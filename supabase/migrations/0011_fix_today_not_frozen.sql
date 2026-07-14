-- Today shouldn't render as "frozen" before it's even over, and a frozen day
-- shouldn't stay a permanent visual scar once the streak resumes. The rule:
-- a day only becomes "frozen" after midnight passes without a play, and it
-- stays frozen only while today itself is still unplayed (you're actively
-- living off the freeze). The moment you play today, every bridged gap day
-- is retroactively shown as `played` too — pretend it was never frozen.

create or replace function public._streak_for_player(p_player_id uuid, p_today date default current_date)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  play_dates   date[];
  streak       int := 0;
  i            int;
  d            date;
  prev         date;
  freezes      int;
  calendar     jsonb := '[]'::jsonb;
  day          date;
  status       text;
  today_played boolean;
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

  today_played := play_dates is not null and p_today = any(play_dates);

  -- 7-day mini calendar: played / frozen (bridged gap) / missed / future.
  -- `day < p_today` excludes today from the frozen bucket outright: today
  -- hasn't finished yet, so it can't have consumed a freeze (renders
  -- `missed` until played, then the `played` branch above wins). A past gap
  -- day within the alive chain shows `frozen` only while today is still
  -- unplayed; once today is played, that same day flips to `played` —
  -- the freeze is filled in rather than left as a lasting mark.
  for day in select generate_series(p_today - 6, p_today, interval '1 day')::date loop
    if day > p_today then
      status := 'future';
    elsif play_dates is not null and day = any(play_dates) then
      status := 'played';
    elsif streak > 0 and day > play_dates[streak] and day < p_today then
      status := case when today_played then 'played' else 'frozen' end;
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
