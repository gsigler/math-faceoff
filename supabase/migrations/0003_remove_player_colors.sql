-- Remove per-player colours. Colour now distinguishes operations only, never
-- people, so players no longer pick a colour during setup.

-- The leaderboard views read players.color, so drop them before the column.
drop view if exists public.v_weekly_by_operation;
drop view if exists public.v_weekly_leaderboard;
drop view if exists public.v_operation_leaderboard;
drop view if exists public.v_all_time_records;

alter table public.players drop column if exists color;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: create the player (no colour argument now)
-- ─────────────────────────────────────────────────────────────────────────────

drop function if exists public.create_player(uuid, text, text);

create or replace function public.create_player(p_family_id uuid, p_name text)
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

  insert into public.players (family_id, auth_uid, name)
  values (p_family_id, auth.uid(), trim(p_name))
  on conflict (auth_uid) do update
    set family_id = excluded.family_id,
        name      = excluded.name
  returning * into pl;
  return pl;
end;
$$;

-- lookup_family no longer returns member colours.
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
           'id', p.id, 'name', p.name) order by p.created_at), '[]'::jsonb)
  into members
  from public.players p
  where p.family_id = fam.id;

  return jsonb_build_object(
    'id', fam.id, 'name', fam.name, 'code', fam.code,
    'created_at', fam.created_at, 'members', members);
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Leaderboard views, recreated without the colour column
-- ─────────────────────────────────────────────────────────────────────────────

create view public.v_weekly_leaderboard
with (security_invoker = true) as
  select
    p.family_id,
    p.id   as player_id,
    p.name,
    coalesce(sum(r.score), 0) as points
  from public.players p
  left join public.rounds r
    on r.player_id = p.id
   and r.mode = 'faceoff'
   and r.created_at >= date_trunc('week', now())
  group by p.family_id, p.id, p.name;

create view public.v_operation_leaderboard
with (security_invoker = true) as
  select
    p.family_id,
    r.operation,
    p.id    as player_id,
    p.name,
    max(r.score) as best
  from public.rounds r
  join public.players p on p.id = r.player_id
  where r.mode = 'faceoff'
  group by p.family_id, r.operation, p.id, p.name;

create view public.v_all_time_records
with (security_invoker = true) as
  select distinct on (r.family_id, r.operation)
    r.family_id,
    r.operation,
    r.score as best,
    p.name  as holder_name
  from public.rounds r
  join public.players p on p.id = r.player_id
  where r.mode = 'faceoff'
  order by r.family_id, r.operation, r.score desc, r.created_at asc;

create view public.v_weekly_by_operation
with (security_invoker = true) as
  select
    p.family_id,
    r.operation,
    p.id   as player_id,
    p.name,
    sum(r.score) as points
  from public.rounds r
  join public.players p on p.id = r.player_id
  where r.mode = 'faceoff'
    and r.created_at >= date_trunc('week', now())
  group by p.family_id, r.operation, p.id, p.name;

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants
-- ─────────────────────────────────────────────────────────────────────────────

grant execute on function public.create_player(uuid, text) to authenticated;

grant select on public.v_weekly_leaderboard    to authenticated;
grant select on public.v_all_time_records      to authenticated;
grant select on public.v_operation_leaderboard to authenticated;
grant select on public.v_weekly_by_operation   to authenticated;
