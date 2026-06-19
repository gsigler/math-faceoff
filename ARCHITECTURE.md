# Fact Faceoff — Architecture

A family math-facts competition. Pick an operation, race a 2:00 clock answering
facts 1–12, and post your score to a shared family leaderboard. **No logins** —
families join with a spoken word-code. One universal app on iPhone and iPad.

## Decisions

| Area        | Choice                                                                       |
| ----------- | ---------------------------------------------------------------------------- |
| Client      | **Expo / React Native**, native iOS — one universal app, responsive layouts |
| Backend     | **Supabase** — Postgres + Auth + Realtime, no custom server                  |
| Identity    | **Anonymous auth** — invisible, zero login screens, device-as-passport       |
| Leaderboard | **Realtime push** — scores appear on other devices sub-second                |

## System shape

```
┌──────────────── Universal Expo App ────────────────┐
│  iPhone layout (1-col)      iPad layout (2-col)     │
│  same routes · same logic · same data · adaptive UI │
└───────────────────────┬─────────────────────────────┘
                        │ Supabase JS (HTTPS + WSS)
                        ▼
┌──────────────────── Supabase ──────────────────────┐
│  Auth: anonymous JWT per device (silent)            │
│  Postgres: families / players / rounds              │
│  RLS: every row scoped to your family               │
│  Realtime: postgres_changes on `rounds`             │
│  RPC: join_family() · finish_round()                │
└─────────────────────────────────────────────────────┘
```

## Identity — no logins

- First launch silently calls `signInAnonymously()`; the session is persisted in
  `AsyncStorage` (the anon token is a device passport, not a credential, so this
  avoids SecureStore's 2KB session-blob limit). No prompt is ever shown.
- The **family code is a join mechanism, not a login.** The user only ever types
  the code and their player name.
- The silent token gives a real `auth.uid()`, which powers Row-Level Security:
  a device can only read/write rows in its own family.
- **Tradeoff:** reinstall / new phone = new player (old history stays in the
  family). Acceptable for v1; an optional recovery code can be added later.

## Data model (Postgres)

```
families   id, name, code (unique), created_at
players    id, family_id→families, auth_uid (unique), name, created_at
rounds     id, player_id→players, family_id→families,
           operation ('add'|'sub'|'mul'|'div'),
           mode ('faceoff'|'practice'),
           score, wrong_count, practice_number?, duration_seconds, created_at
```

All leaderboards are **derived from `rounds`** — nothing to keep in sync:

- **Weekly board** ("Total points") = sum of faceoff `score` per player, current week.
- **All-time records** = max faceoff `score` per operation, with the holding player.
- **New record!** = the just-posted faceoff score > prior family max for that operation.
- **Practice rounds** are stored but excluded from both boards.

## Server logic (RPC)

- `join_family(p_code)` → validate code, link `auth.uid()` to the family, return
  the family + members.
- `finish_round(...)` → insert the round, return `{ is_record, my_rank,
  family_best }` so the result screen needs no second query.

The drill itself (timer, problem generation, answer checking) is **client-side** —
it is a family app with no anti-cheat need, and it keeps gameplay instant. The
client writes only the result.

## Client architecture (Expo)

- **Navigation:** `expo-router` (file-based). Screens map 1:1 to the prototype:
  `welcome → create(name/code) | join(code/found) → profile → home → mode → pick
  → test → result`.
- **Responsive:** `useWindowDimensions()` + breakpoints; components render a phone
  (1-col) or iPad (2-col) layout. One component set, two arrangements — no forked
  screens, no separate board mode. The iPad simply renders the app with more space.
- **Server state:** TanStack Query; Supabase realtime events invalidate the
  leaderboard queries.
- **In-round state:** Zustand (active problem, timer, score, streak).
- **Theme:** typed arcade palette + operator colors + chunky-shadow tokens.
- **Fonts:** Fredoka + Nunito (`@expo-google-fonts/*`).
- **Animations:** Reanimated (shake-on-wrong, pop-on-result).

## Repo layout

```
math-faceoff/
  src/
    app/                 # expo-router screens
    components/          # buttons, keypad, leaderboard (phone + iPad)
    game/                # problem generation + scoring (ported from prototype)
    theme/               # palette, tokens, responsive
    lib/                 # supabase client + silent anon auth, env
    state/               # zustand stores
    queries/             # TanStack Query hooks
  supabase/
    migrations/          # schema + RLS + RPC functions
```

## Out of scope for v1

App Store auth / player recovery, push notifications, web build, the Bubblegum /
Neon themes (Arcade only), analytics.
