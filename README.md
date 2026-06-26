# Fact Faceoff

A family math-facts competition. Pick an operation, race a 2:00 clock answering
facts 1–12, and post your score to a shared family leaderboard. **No logins** —
families join with a spoken word-code (e.g. `MANGO-42`). One universal app on
iPhone and iPad, built with Expo + Supabase.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full design.

## Stack

- **Expo / React Native** (expo-router, Reanimated) — universal iPhone + iPad app
- **Supabase** — Postgres, anonymous auth, realtime leaderboard
- **TanStack Query** (server state) + **Zustand** (in-round state)

## Setup

```bash
npm install
npm run ios       # native dev build on a booted iOS simulator
```

That's it — the app runs against the hosted **sandbox** Supabase project by
default. Its URL and publishable key are committed in `.env.development` and
auto-loaded by Expo, so there's nothing to configure to get started. (Publishable
keys are client keys, protected by RLS — safe to commit.)

### Environments

| File | Target | Loaded by |
| ---- | ------ | --------- |
| `.env.development` | sandbox (default) | `expo start` / dev builds |
| `.env.production` | production | prod builds / `expo export` / EAS |
| `.env.development.local` | local Supabase (optional, gitignored) | overrides sandbox in dev |

### Running against local Supabase (optional)

```bash
cp .env.local.example .env.development.local   # overrides sandbox values in dev
supabase start                                  # local Postgres+Auth+Realtime (needs Docker)
npm run ios
```

A physical device can't reach `127.0.0.1`, so local dev is **simulator / web
only** — use sandbox for on-device testing. To stand up your own Supabase project
from scratch, apply [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
(SQL editor or `supabase db push`) and enable **Anonymous sign-ins** in Auth
settings.

## Project layout

```
src/
  app/         expo-router screens (welcome → onboarding → home → play → result)
  components/  shared UI primitives (Screen, buttons, ProgressBar…)
  game/        problem generation + scoring
  theme/       arcade palette, tokens, responsive helpers
  lib/         supabase client, typed API, env
  state/       zustand stores (session, onboarding flow, active round)
  queries/     TanStack Query hooks + realtime subscription
supabase/
  migrations/  schema, RLS, RPC functions, leaderboard views
```
