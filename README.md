# Fact Faceoff

A family math-facts competition. Pick an operation, race a 2:00 clock answering
facts 1–12, and post your score to a shared family leaderboard. **No logins** —
families join with a spoken word-code (e.g. `MANGO-42`). One universal app on
iPhone and iPad, built with Expo + Supabase.

The app also tracks personal bests, practice attempts, daily streaks, and earned badges. See [ARCHITECTURE.md](ARCHITECTURE.md) for the original design and `supabase/migrations/` for the current database behavior.

## Design choices

- A family joins with a word-code instead of creating accounts for each player.
- Problem generation, the timer, and answer checking stay on the device so each answer gets an immediate response.
- Supabase stores completed rounds and synchronizes leaderboards. Practice runs contribute to personal progress without entering the family competition.
- One set of screens adapts to iPhone and iPad.

## Stack

- **Expo / React Native** (expo-router, Reanimated) — universal iPhone + iPad app
- **Supabase** — Postgres, anonymous auth, realtime leaderboard
- **TanStack Query** (server state) + **Zustand** (in-round state)

## Setup

### Prerequisites (native iOS build)

`npm run ios` compiles a native dev build locally, so a fresh Mac needs:

- **Full Xcode** (not just the Command Line Tools), with its license accepted:
  ```bash
  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
  sudo xcodebuild -license accept
  ```
- **An iOS simulator runtime** — install via Xcode › Settings › Components, or
  `xcodebuild -downloadPlatform iOS`.
- **CocoaPods** — `brew install cocoapods` (bundles its own Ruby; more reliable
  than `gem install` on the system Ruby).

No local toolchain? Use a [cloud build](#cloud-builds-eas) instead.

### Run it

```bash
npm install

# Configure your own Supabase instance first; see below.
cp .env.example .env.development.local
npm run ios       # native dev build on a booted iOS simulator
```

Fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in
`.env.development.local` before starting the app. Use a publishable client key
from your own project. These values are included in the client bundle; never
use a service-role key, secret API key, or database password here.

The repository does not connect development builds to the author's sandbox.
Existing production build configuration uses public client identifiers, not
private credentials. Replace that configuration and the Expo project identifiers
with your own before making or distributing a production build.

### Cloud builds (EAS)

To build without a local Xcode/CocoaPods toolchain (or to build for a device),
use [EAS](eas.json). The `development` profile produces a simulator dev-client:

```bash
npx eas-cli login
npx eas-cli build --profile development --platform ios   # builds in the cloud
npx eas-cli build:run --profile development --platform ios   # install on a sim
npx expo start --dev-client                              # serve JS using your configured development instance
```

The build is a debug **dev-client**, so it shows Expo's floating dev-menu (gear)
overlay — that's expected and absent from `preview`/`production` release builds.

### Set up Supabase

For a hosted project, create your own Supabase project, enable anonymous sign-ins,
and apply **all** checked-in migrations in filename order, including the later
personal-best, streak, badge, and notification migrations. With the Supabase CLI:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Read the migrations before applying them to a database. Use a new project for
development. The initial migration alone does not supply the current app's RPCs.

Push notifications also need the Edge Functions in `supabase/functions/`, Expo
and APNs setup for your own app, and the server-side Vault configuration referenced
in `0009_notify_cron.sql`. Keep service-role credentials on the server. They never
belong in `EXPO_PUBLIC_*` variables. Gameplay can be developed without delivering
push notifications.

### Environments

| File | Target | Loaded by |
| ---- | ------ | --------- |
| `.env.development.local` | your development instance, gitignored | `expo start` / dev builds |
| `.env.production` | existing owner production client config | production builds / `expo export` / EAS |
| `.env.production.local` | your production instance, gitignored | overrides production config on your machine |

For cloud builds from a fork, configure your own Expo project and environment
variables. The existing CI workflows deploy the owner's Supabase project and
build the owner's app. Forks need their own project references, GitHub secrets,
bundle identifiers, signing credentials, and App Store configuration. Do not run
the manual release workflow until those are set up for your app.

### Running against local Supabase (optional)

```bash
cp .env.local.example .env.development.local   # configure the local development instance
supabase start                                  # local Postgres+Auth+Realtime (needs Docker)
# Copy the URL and publishable/anon key printed by the CLI into the local env file.
npm run ios
```

A physical device can't reach `127.0.0.1`, so local dev is **simulator / web
only**. For a physical device, use your own hosted development project.
`supabase start` applies the checked-in migrations and the local config enables
anonymous sign-ins.

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

## Verification

```bash
npx tsc --noEmit
npx expo export --platform ios
```

## License

Application code is available under the [MIT license](LICENSE). The Expo
template's copyright notice is retained alongside the project's notice.
