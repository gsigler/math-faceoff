-- Badge shelf. Computed on read from `rounds` + the streak functions — no
-- `player_badges` table. The wireframe shows no earned timestamp and no
-- "just earned!" toast, so there's no event worth persisting yet; if a
-- celebratory moment gets added later, promote this into a real table then —
-- these conditions are exactly what it'd be seeded from.

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
    'family_champion', coalesce(champion, false)
  );
end;
$$;

grant execute on function public.my_badges() to authenticated;
