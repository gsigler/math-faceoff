-- Weekly standings should rank by each player's *best single faceoff run* this
-- week, not their cumulative points. Summing rewarded grinding many rounds; the
-- rest of the app (records, personal best, family standings) already ranks by a
-- single best run, so make the weekly board consistent.
--
-- max(int) is int but the old sum(int) column was bigint, so the column type
-- changes — drop and recreate rather than create-or-replace.

drop view if exists public.v_weekly_by_operation;

create view public.v_weekly_by_operation
with (security_invoker = true) as
  select
    p.family_id,
    r.operation,
    p.id   as player_id,
    p.name,
    max(r.score) as points
  from public.rounds r
  join public.players p on p.id = r.player_id
  where r.mode = 'faceoff'
    and r.created_at >= date_trunc('week', now())
  group by p.family_id, r.operation, p.id, p.name;

grant select on public.v_weekly_by_operation to authenticated;
