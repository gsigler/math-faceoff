# CLAUDE.md

Quick orientation for agents. Full design is in [ARCHITECTURE.md](ARCHITECTURE.md);
human setup is in [README.md](README.md).

## What this is

**Fact Faceoff** — a family math-facts competition. **Expo (React Native) + Supabase**,
one universal iPhone/iPad app. **No logins** — anonymous auth; families join with a
word-code.

## Run it

Default target is **hosted sandbox Supabase** — no Docker, no `supabase start`.
The sandbox URL + anon key live in `.env.development` (committed) and are
auto-loaded by Expo when `NODE_ENV=development`, so there's nothing to configure.

```bash
npm install
npm run ios                          # native dev build → booted iOS simulator, against sandbox Supabase
```

This is what "run this" means: a native dev build on a booted iOS simulator,
talking to sandbox. No `.env` copy step — `.env.development` already points at it.

### Local Supabase (optional)

To develop against a local stack instead, copy `.env.local.example` to
`.env.development.local` (gitignored — it overrides the sandbox values) and start
Docker:

```bash
supabase start                       # local Postgres+Auth+Realtime; applies migrations
```

`supabase/config.toml` already enables anonymous sign-ins and disables the local
analytics container (it fails to boot). Apply a new migration to the running DB with:

```bash
docker exec -i supabase_db_math-faceoff psql -U postgres -d postgres < supabase/migrations/<file>.sql
```

Note: a physical device can't reach `127.0.0.1`, so local dev is simulator/web
only — use sandbox (the default) for on-device testing.

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
- **Env:** only `EXPO_PUBLIC_*` vars reach the client. `.env.development` (sandbox)
  and `.env.production` are committed on purpose — publishable keys are client keys,
  protected by RLS. Only `.env.development.local` (local override) is gitignored.
- **Git:** branch off `main` for non-trivial work; commit/push only when asked.
```
