-- Math Faceoff — initial schema
-- Families, players, rounds. No logins: identity is the anonymous auth.uid().
-- Leaderboards are derived from `rounds`. Writes go through SECURITY DEFINER RPCs.

-- ─────────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.families (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 40),
  code       text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families (id) on delete cascade,
  auth_uid   uuid not null unique references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 20),
  color      text not null,
  created_at timestamptz not null default now()
);

create index if not exists players_family_id_idx on public.players (family_id);

create table if not exists public.rounds (
  id               uuid primary key default gen_random_uuid(),
  player_id        uuid not null references public.players (id) on delete cascade,
  family_id        uuid not null references public.families (id) on delete cascade,
  operation        text not null check (operation in ('add', 'sub', 'mul', 'div')),
  mode             text not null check (mode in ('faceoff', 'practice')),
  score            int  not null check (score >= 0),
  wrong_count      int  not null default 0 check (wrong_count >= 0),
  practice_number  int  check (practice_number between 1 and 12),
  duration_seconds int  not null default 120,
  created_at       timestamptz not null default now()
);

create index if not exists rounds_family_created_idx on public.rounds (family_id, created_at desc);
create index if not exists rounds_board_idx on public.rounds (family_id, mode, operation, score desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: the family of the current device (anonymous auth.uid())
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.my_family_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select family_id from public.players where auth_uid = auth.uid()
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security: a device can only read its own family's data.
-- All writes happen through the SECURITY DEFINER RPCs below, so no write policies.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.families enable row level security;
alter table public.players  enable row level security;
alter table public.rounds   enable row level security;

create policy families_select_own on public.families
  for select to authenticated using (id = public.my_family_id());

create policy players_select_own on public.players
  for select to authenticated using (family_id = public.my_family_id());

create policy rounds_select_own on public.rounds
  for select to authenticated using (family_id = public.my_family_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- Word-based family codes (easy to say aloud), e.g. MANGO-42
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.gen_family_code()
returns text
language plpgsql
volatile
as $$
declare
  words text[] := array['MANGO','TIGER','COMET','PIXEL','OTTER','MAPLE','ROCKET',
                        'PANDA','PEPPER','COCOA','LEMON','BISON','CEDAR','DELTA'];
  candidate text;
begin
  loop
    candidate := words[1 + floor(random() * array_length(words, 1))::int]
                 || '-' || lpad(floor(10 + random() * 90)::text, 2, '0');
    exit when not exists (select 1 from public.families where code = candidate);
  end loop;
  return candidate;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: create a family (returns the new family incl. its share code)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.create_family(p_name text)
returns public.families
language plpgsql
security definer
set search_path = public
as $$
declare
  fam public.families;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  insert into public.families (name, code)
  values (trim(p_name), public.gen_family_code())
  returning * into fam;
  return fam;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: look up a family by code (the "Found them!" screen). Read-only.
-- Returns the family and its current members as JSON.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.lookup_family(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  fam     public.families;
  members jsonb;
begin
  select * into fam from public.families
  where upper(replace(code, '-', '')) = upper(replace(trim(p_code), '-', ''));

  if fam.id is null then
    return null;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', p.id, 'name', p.name, 'color', p.color) order by p.created_at), '[]'::jsonb)
  into members
  from public.players p
  where p.family_id = fam.id;

  return jsonb_build_object(
    'id', fam.id, 'name', fam.name, 'code', fam.code,
    'created_at', fam.created_at, 'members', members);
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: create the player for this device (links auth.uid() to a family)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.create_player(p_family_id uuid, p_name text, p_color text)
returns public.players
language plpgsql
security definer
set search_path = public
as $$
declare
  pl public.players;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (select 1 from public.families where id = p_family_id) then
    raise exception 'family not found';
  end if;

  insert into public.players (family_id, auth_uid, name, color)
  values (p_family_id, auth.uid(), trim(p_name), p_color)
  on conflict (auth_uid) do update
    set family_id = excluded.family_id,
        name      = excluded.name,
        color     = excluded.color
  returning * into pl;
  return pl;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: finish a round. Inserts the round and returns record/rank info.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.finish_round(
  p_operation        text,
  p_mode             text,
  p_score            int,
  p_wrong_count      int,
  p_practice_number  int default null,
  p_duration_seconds int default 120
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  pl          public.players;
  prior_best  int;
  my_rank     int;
  is_record   boolean := false;
begin
  select * into pl from public.players where auth_uid = auth.uid();
  if pl.id is null then
    raise exception 'no player for this device';
  end if;

  -- best faceoff score in the family for this operation BEFORE this round
  select coalesce(max(score), 0) into prior_best
  from public.rounds
  where family_id = pl.family_id and operation = p_operation and mode = 'faceoff';

  insert into public.rounds
    (player_id, family_id, operation, mode, score, wrong_count, practice_number, duration_seconds)
  values
    (pl.id, pl.family_id, p_operation, p_mode, p_score, p_wrong_count, p_practice_number, p_duration_seconds);

  if p_mode = 'faceoff' then
    is_record := p_score > prior_best;

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
    'is_record',   is_record,
    'my_rank',     my_rank,
    'family_best', greatest(prior_best, case when p_mode = 'faceoff' then p_score else prior_best end)
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Leaderboard views (security_invoker => scoped by the RLS policies above)
-- ─────────────────────────────────────────────────────────────────────────────

-- Weekly "Total points": sum of faceoff scores per player for the current week.
create or replace view public.v_weekly_leaderboard
with (security_invoker = true) as
  select
    p.family_id,
    p.id   as player_id,
    p.name,
    p.color,
    coalesce(sum(r.score), 0) as points
  from public.players p
  left join public.rounds r
    on r.player_id = p.id
   and r.mode = 'faceoff'
   and r.created_at >= date_trunc('week', now())
  group by p.family_id, p.id, p.name, p.color;

-- Per-player best faceoff score for each operation (the result-screen board).
create or replace view public.v_operation_leaderboard
with (security_invoker = true) as
  select
    p.family_id,
    r.operation,
    p.id    as player_id,
    p.name,
    p.color,
    max(r.score) as best
  from public.rounds r
  join public.players p on p.id = r.player_id
  where r.mode = 'faceoff'
  group by p.family_id, r.operation, p.id, p.name, p.color;

-- All-time record per operation, with the holder.
create or replace view public.v_all_time_records
with (security_invoker = true) as
  select distinct on (r.family_id, r.operation)
    r.family_id,
    r.operation,
    r.score as best,
    p.name  as holder_name,
    p.color as holder_color
  from public.rounds r
  join public.players p on p.id = r.player_id
  where r.mode = 'faceoff'
  order by r.family_id, r.operation, r.score desc, r.created_at asc;

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants + realtime
-- ─────────────────────────────────────────────────────────────────────────────

grant execute on function public.create_family(text)                       to authenticated;
grant execute on function public.lookup_family(text)                       to authenticated;
grant execute on function public.create_player(uuid, text, text)           to authenticated;
grant execute on function public.finish_round(text, text, int, int, int, int) to authenticated;

grant select on public.v_weekly_leaderboard    to authenticated;
grant select on public.v_all_time_records      to authenticated;
grant select on public.v_operation_leaderboard to authenticated;

-- Push round inserts to subscribed devices (live leaderboard).
alter publication supabase_realtime add table public.rounds;
