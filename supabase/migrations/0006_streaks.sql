-- Daily play streaks. A day counts only when a faceoff round is completed
-- that day (practice doesn't count). The streak, freeze bank, and 7-day
-- calendar are all derived from `rounds` history — no mutable counter to
-- keep in sync, because the freeze rule ("always tops back up to 3 on play,
-- no monthly cap") means a gap can never be preceded by anything but a full
-- bank, so each gap can be judged independently against a constant threshold.
--
-- `created_at` is UTC and streaks are day-boundary-sensitive, so the client
-- stamps its own local day/hour at finish time rather than us trying to
-- derive "local day" from a stored timezone (more moving parts, DST edge
-- cases). `is_record` is persisted too: `finish_round` already computes it
-- in-memory for the result screen, and storing it avoids an expensive
-- historical self-join for the "family record" badge and is the exact
-- signal the record-beaten push needs.

alter table public.rounds
  add column local_date date not null default current_date,
  add column local_hour smallint not null default extract(hour from now())::int
              check (local_hour between 0 and 23),
  add column is_record boolean not null default false;

create index rounds_streak_idx on public.rounds (player_id, local_date) where mode = 'faceoff';

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: finish a round (adds p_local_date / p_local_hour, persists is_record)
-- New trailing params change the function's arity, so `create or replace`
-- would leave the old 6-arg overload behind — drop it first.
-- ─────────────────────────────────────────────────────────────────────────────

drop function if exists public.finish_round(text, text, int, int, int, int);

create or replace function public.finish_round(
  p_operation        text,
  p_mode             text,
  p_score            int,
  p_wrong_count      int,
  p_practice_number  int default null,
  p_duration_seconds int default 120,
  p_local_date       date default current_date,
  p_local_hour       int default extract(hour from now())::int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  pl               public.players;
  prior_best       int;
  my_prior_best    int;
  my_rank          int;
  is_record_       boolean := false;
  is_personal_best boolean := false;
begin
  select * into pl from public.players where auth_uid = auth.uid();
  if pl.id is null then
    raise exception 'no player for this device';
  end if;

  -- best faceoff score in the family for this operation BEFORE this round
  select coalesce(max(score), 0) into prior_best
  from public.rounds
  where family_id = pl.family_id and operation = p_operation and mode = 'faceoff';

  -- this player's best faceoff score for this operation BEFORE this round
  select coalesce(max(score), 0) into my_prior_best
  from public.rounds
  where player_id = pl.id and operation = p_operation and mode = 'faceoff';

  if p_mode = 'faceoff' then
    is_record_       := p_score > prior_best;
    is_personal_best := p_score > my_prior_best;
  end if;

  insert into public.rounds
    (player_id, family_id, operation, mode, score, wrong_count, practice_number,
     duration_seconds, local_date, local_hour, is_record)
  values
    (pl.id, pl.family_id, p_operation, p_mode, p_score, p_wrong_count, p_practice_number,
     p_duration_seconds, p_local_date, p_local_hour, is_record_);

  if p_mode = 'faceoff' then
    -- rank of this player's best faceoff score for this operation within the family
    select rnk into my_rank from (
      select player_id, rank() over (order by best desc) as rnk
      from (
        select player_id, max(score) as best
        from public.rounds
        where family_id = pl.family_id and operation = p_operation and mode = 'faceoff'
        group by player_id
      ) per_player
    ) ranked
    where player_id = pl.id;
  end if;

  return jsonb_build_object(
    'is_record',        is_record_,
    'is_personal_best', is_personal_best,
    'my_rank',          my_rank,
    'family_best',      greatest(prior_best, case when p_mode = 'faceoff' then p_score else prior_best end),
    'personal_best',    greatest(my_prior_best, case when p_mode = 'faceoff' then p_score else my_prior_best end)
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Longest historical streak ever (islands-and-gaps over distinct play days,
-- bridging gaps of <=3 missed days). Internal helper: permanent streak badges
-- key off this so they never un-earn when today's live streak breaks.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public._best_streak(p_player_id uuid)
returns int
language sql
stable
set search_path = public
as $$
  with d as (
    select distinct local_date as day from public.rounds
    where player_id = p_player_id and mode = 'faceoff'
  ),
  -- lag() has to land in its own step: Postgres rejects a window function
  -- nested inside another window function's argument expression.
  gaps as (
    select day, lag(day) over (order by day) as prev_day from d
  ),
  grp as (
    select day,
           sum(case when prev_day is null or day - prev_day > 4 then 1 else 0 end)
             over (order by day) as g
    from gaps
  )
  select coalesce(max(cnt), 0) from (select g, count(*) as cnt from grp group by g) s
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: current streak, freeze bank, and a 7-day calendar for the caller.
-- ─────────────────────────────────────────────────────────────────────────────

-- Player-scoped core (no auth.uid() dependency) so it can also be called
-- from Edge Functions running as the service role, e.g. notify-tick's
-- evening/morning sweep over every player, not just the calling device.
create or replace function public._streak_for_player(p_player_id uuid, p_today date default current_date)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  play_dates  date[];
  streak      int := 0;
  i           int;
  d           date;
  prev        date;
  freezes     int;
  calendar    jsonb := '[]'::jsonb;
  day         date;
  status      text;
begin
  select array_agg(distinct local_date order by local_date desc) into play_dates
  from public.rounds
  where player_id = p_player_id and mode = 'faceoff' and local_date <= p_today;

  if play_dates is null then
    streak  := 0;
    freezes := 3;
  elsif (p_today - play_dates[1]) > 4 then
    -- last play is more than 3 full missed days ago: streak already dead
    streak  := 0;
    freezes := 3;
  else
    -- prev starts at p_today (not p_today+1): the first gap being tested is
    -- "fully missed days between the most recent play and today, excluding
    -- today itself" — same threshold the dead-check above already used, so
    -- a 3-day-missed gap (still alive) doesn't get exited on immediately.
    prev := p_today;
    for i in 1 .. array_length(play_dates, 1) loop
      d := play_dates[i];
      exit when (prev - d - 1) > 3;
      streak := streak + 1;
      prev := d;
    end loop;
    freezes := greatest(0, least(3, 3 - greatest(0, p_today - play_dates[1] - 1)));
  end if;

  -- 7-day mini calendar: played / frozen (bridged gap) / missed / future.
  -- By construction the chain (play_dates[1..streak]) has no gap >3 missed
  -- days anywhere inside it, so any unplayed day between its earliest date
  -- and today is frozen — no need to re-check each individual gap.
  for day in select generate_series(p_today - 6, p_today, interval '1 day')::date loop
    if day > p_today then
      status := 'future';
    elsif play_dates is not null and day = any(play_dates) then
      status := 'played';
    elsif streak > 0 and day > play_dates[streak] and day <= p_today then
      status := 'frozen';
    else
      status := 'missed';
    end if;
    calendar := calendar || jsonb_build_object('date', day, 'status', status);
  end loop;

  return jsonb_build_object(
    'current_streak',   streak,
    'freezes_remaining', freezes,
    'last_play_date',   case when play_dates is null then null else play_dates[1] end,
    'calendar',          calendar
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: current streak for the calling device.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.my_streak(p_today date default current_date)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  pl public.players;
begin
  select * into pl from public.players where auth_uid = auth.uid();
  if pl.id is null then
    raise exception 'no player for this device';
  end if;
  return public._streak_for_player(pl.id, p_today);
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants
-- ─────────────────────────────────────────────────────────────────────────────

grant execute on function public.finish_round(text, text, int, int, int, int, date, int) to authenticated;
grant execute on function public.my_streak(date) to authenticated;
-- notify-tick (Edge Function, service role) sweeps every player's streak directly.
grant execute on function public._streak_for_player(uuid, date) to service_role;
