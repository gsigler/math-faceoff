-- Personal-best scoring. finish_round now also computes the caller's own prior
-- best for this operation, so the result screen can celebrate beating *your*
-- high score — not only the family record.

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
  pl               public.players;
  prior_best       int;
  my_prior_best    int;
  my_rank          int;
  is_record        boolean := false;
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

  insert into public.rounds
    (player_id, family_id, operation, mode, score, wrong_count, practice_number, duration_seconds)
  values
    (pl.id, pl.family_id, p_operation, p_mode, p_score, p_wrong_count, p_practice_number, p_duration_seconds);

  if p_mode = 'faceoff' then
    is_record        := p_score > prior_best;
    is_personal_best := p_score > my_prior_best;

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
    'is_record',        is_record,
    'is_personal_best', is_personal_best,
    'my_rank',          my_rank,
    'family_best',      greatest(prior_best, case when p_mode = 'faceoff' then p_score else prior_best end),
    'personal_best',    greatest(my_prior_best, case when p_mode = 'faceoff' then p_score else my_prior_best end)
  );
end;
$$;
