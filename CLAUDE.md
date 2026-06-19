# CLAUDE.md

Quick orientation for agents. Full design is in [ARCHITECTURE.md](ARCHITECTURE.md);
human setup is in [README.md](README.md).

## What this is

**Fact Faceoff** — a family math-facts competition. **Expo (React Native) + Supabase**,
one universal iPhone/iPad app. **No logins** — anonymous auth; families join with a
word-code.

## Run it

Needs Docker running (local Supabase) and a `.env`.

```bash
npm install
supabase start                       # local Postgres+Auth+Realtime; applies migrations
cp .env.example .env                 # then paste the API URL + anon key from `supabase status`
npm run ios                          # opens on a booted simulator via Expo Go
```

`supabase/config.toml` already enables anonymous sign-ins and disables the local
analytics container (it fails to boot). Apply a new migration to the running DB with:

```bash
docker exec -i supabase_db_math-faceoff psql -U postgres -d postgres < supabase/migrations/<file>.sql
```

## Verify before finishing

```bash
npx tsc --noEmit                     # must pass
npx expo export --platform ios       # optional: confirms the bundle builds
```

## Layout

```
src/app/        expo-router screens (welcome → onboarding → home → mode → pick → test → result, + family)
src/components/  shared UI (Screen, buttons, OpBadge, boards)
src/game/        problem generation + scoring
src/theme/       arcade palette, tokens, responsive helpers
src/lib/         supabase client, typed API, env
src/state/       zustand stores (session, flow, round)
src/queries/     TanStack Query hooks + realtime
supabase/migrations/  schema, RLS, RPCs, leaderboard views
```

## Conventions & gotchas

- **State:** Zustand for client state (`session`/`flow`/`round`); TanStack Query for
  server data. Realtime on `rounds` invalidates the leaderboard queries.
- **No logins:** identity is the anonymous `auth.uid()`. RLS scopes every row to the
  caller's family. All writes go through `SECURITY DEFINER` RPCs
  (`create_family` / `lookup_family` / `create_player` / `finish_round`) — don't
  write tables directly from the client.
- **Styling:** use tokens from `src/theme` (colors, `shadow`, `radius`, `OPERATIONS`).
  Operator symbols (＋ − × ÷) render via `OpBadge` (geometric, exactly centered) —
  don't put font glyphs in small boxes, they sit high.
- **Responsive:** wrap screens in `Screen`; pass `wide` for the iPad dashboard, omit
  it for focused single-column screens. One component set, two layouts — no forked
  screens.
- **Env:** only `EXPO_PUBLIC_*` vars reach the client. Never commit `.env`
  (`.env.example` is the tracked template).
- **Git:** branch off `main` for non-trivial work; commit/push only when asked.
```
