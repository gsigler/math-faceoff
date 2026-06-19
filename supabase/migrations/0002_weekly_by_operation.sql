-- Weekly leaderboard, split per operation.
-- A player appears in an operation's list only if they played that operation
-- (faceoff) this week. Points are summed per player *per operation*.

create or replace view public.v_weekly_by_operation
with (security_invoker = true) as
  select
    p.family_id,
    r.operation,
    p.id   as player_id,
    p.name,
    p.color,
    sum(r.score) as points
  from public.rounds r
  join public.players p on p.id = r.player_id
  where r.mode = 'faceoff'
    and r.created_at >= date_trunc('week', now())
  group by p.family_id, r.operation, p.id, p.name, p.color;

grant select on public.v_weekly_by_operation to authenticated;
