-- Four more badges: night_owl (mirrors early_bird), sharpshooter (a perfect
-- Faceoff run, mirrors perfect_drill's practice-only version), marathoner
-- (5+ Faceoff rounds in one local day), and all_rounder (played Faceoff, not
-- just Practice, in all 4 operations — distinct from all_4_ops). All four
-- are plain booleans, same style as the other non-progress badges.

create or replace function public.my_badges()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  pl          public.players;
  best_streak int;
  live        jsonb;
  solved      int;
  champion    boolean;
begin
  select * into pl from public.players where auth_uid = auth.uid();
  if pl.id is null then
    raise exception 'no player for this device';
  end if;

  best_streak := public._best_streak(pl.id);
  live        := public.my_streak();

  select coalesce(sum(score), 0) into solved from public.rounds where player_id = pl.id;

  -- this player holds rank-1 (by best score, tie-break earliest) on all 4 operations
  select bool_and(top.player_id = pl.id) and count(*) = 4 into champion
  from (
    select distinct on (operation) operation, player_id
    from public.rounds
    where family_id = pl.family_id and mode = 'faceoff'
    order by operation, score desc, created_at asc
  ) top;

  return jsonb_build_object(
    'perfect_drill', exists (
      select 1 from public.rounds
      where player_id = pl.id and mode = 'practice' and score > 0 and wrong_count = 0
    ),
    'streak_7', jsonb_build_object(
      'earned', best_streak >= 7,
      'progress', greatest(0, 7 - (live->>'current_streak')::int)
    ),
    'streak_30', jsonb_build_object(
      'earned', best_streak >= 30,
      'progress', greatest(0, 30 - (live->>'current_streak')::int)
    ),
    'family_record', exists (select 1 from public.rounds where player_id = pl.id and is_record),
    'all_4_ops', (
      select count(distinct operation) from public.rounds
      where player_id = pl.id and mode = 'practice'
    ) = 4,
    'solved_100', jsonb_build_object(
      'earned', solved >= 100,
      'progress', greatest(0, 100 - solved)
    ),
    'early_bird', exists (select 1 from public.rounds where player_id = pl.id and local_hour < 8),
    'family_champion', coalesce(champion, false),
    'night_owl', exists (select 1 from public.rounds where player_id = pl.id and local_hour >= 21),
    'sharpshooter', exists (
      select 1 from public.rounds
      where player_id = pl.id and mode = 'faceoff' and score > 0 and wrong_count = 0
    ),
    'marathoner', exists (
      select 1 from (
        select local_date, count(*) as n
        from public.rounds
        where player_id = pl.id and mode = 'faceoff'
        group by local_date
      ) daily
      where n >= 5
    ),
    'all_rounder', (
      select count(distinct operation) from public.rounds
      where player_id = pl.id and mode = 'faceoff'
    ) = 4
  );
end;
$$;

grant execute on function public.my_badges() to authenticated;
