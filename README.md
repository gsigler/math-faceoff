# Math Faceoff

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

1. Install deps:

   ```bash
   npm install
   ```

2. Create a Supabase project, then apply the schema in
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   (via the SQL editor or `supabase db push`). Make sure **Anonymous sign-ins**
   are enabled in Auth settings.

3. Copy `.env.example` to `.env` and fill in your project values:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=ey...
   ```

4. Run it:

   ```bash
   npm run ios       # or: npm start, then press i
   ```

## Project layout

```
src/
  app/         expo-router screens (welcome → onboarding → home → play → result)
  components/  shared UI primitives (Screen, buttons, Avatar, ProgressBar…)
  game/        problem generation + scoring
  theme/       arcade palette, tokens, responsive helpers
  lib/         supabase client, typed API, env
  state/       zustand stores (session, onboarding flow, active round)
  queries/     TanStack Query hooks + realtime subscription
supabase/
  migrations/  schema, RLS, RPC functions, leaderboard views
```
