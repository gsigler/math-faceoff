-- Push notification infrastructure: per-player timezone, Expo push tokens,
-- and a send log for dedupe. Tokens/log are readable only via the
-- service-role key from Edge Functions — no `authenticated` policies, same
-- "no client write access" spirit as `rounds`, just extended to reads too
-- since tokens are only ever useful server-side.

alter table public.players add column timezone text;

create or replace function public.set_my_timezone(p_timezone text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.players set timezone = p_timezone where auth_uid = auth.uid();
end;
$$;

create table public.player_push_tokens (
  id                uuid primary key default gen_random_uuid(),
  player_id         uuid not null references public.players (id) on delete cascade,
  expo_push_token   text not null unique,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index player_push_tokens_player_id_idx on public.player_push_tokens (player_id);

alter table public.player_push_tokens enable row level security;
-- No policies for `authenticated`: tokens are written only via
-- register_push_token() (security definer) and read only by Edge Functions
-- using the service-role key, which bypasses RLS entirely.

create or replace function public.register_push_token(p_expo_push_token text)
returns void
language plpgsql
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

  insert into public.player_push_tokens (player_id, expo_push_token)
  values (pl.id, p_expo_push_token)
  on conflict (expo_push_token) do update
    set player_id = excluded.player_id,
        updated_at = now();
end;
$$;

create table public.notification_log (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references public.players (id) on delete cascade,
  kind       text not null check (kind in ('streak_risk', 'daily_nudge', 'record_beaten')),
  local_date date not null,
  sent_at    timestamptz not null default now(),
  unique (player_id, kind, local_date)
);

alter table public.notification_log enable row level security;
-- Same shape as player_push_tokens: no client policies, service-role only.

create extension if not exists pg_cron;
create extension if not exists pg_net;

grant execute on function public.set_my_timezone(text)     to authenticated;
grant execute on function public.register_push_token(text) to authenticated;
