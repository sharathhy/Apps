# Wellness suite

A suite of health and wellness trackers built as one React Native (Expo) app for Android, iOS and the web. It has six modules (Water, Mood, Sleep, Cycle, Pregnancy and Nutrition) with a shared design system. Each module can be turned on or off in a config file.

On first launch each person chooses **Women's health** (all trackers), **Men's health** (every tracker except Cycle and Pregnancy, which are never offered) or **Show everything**. They can then switch individual trackers on or off. Their choice, language and light or dark theme are saved on the device only.

> **Status: Phase 4 (Cycle and Pregnancy).** Accounts, consent, export and deletion (Phase 1), notifications and achievements (Phase 2), Water, Mood and Sleep (Phase 3), and Cycle and Pregnancy with partner sharing (Phase 4) are in place. Nutrition and offline sync come next.

## Repository layout

```
apps/
  mobile/                 Expo app (Android, iOS, web) using Expo Router
    src/app/              Routes. Every file is a screen; _layout.tsx files are navigators
    src/features/<module> One folder per module: manifest, screens, tests
    src/config/modules.config.ts   Turn modules on or off and set their order
    src/i18n/             i18next setup and en/hi string files
    src/lib/              Pure helpers (regional date and unit defaults)
    src/features/consent  Per-category consent (stored on the device, synced to the ledger when signed in)
    src/features/data     Export and delete-everything
    src/features/account  Sign-up, sign-in and password reset (Supabase)
packages/
  design-tokens/          Colors (light/dark), type scale, spacing, radii, shadows, motion; Tailwind preset
  ui/                     Token-only components: Text, Button, Card, Screen, Icon, ProgressRing, Skeleton, state views
  config/                 Shared TypeScript, ESLint and Babel config
supabase/
  migrations/             Database schema, Row Level Security and storage bucket
  functions/delete-account Edge function that deletes the signed-in user's files and account
  tests/                  RLS tests that run against a real Postgres
docs/legal/               Privacy policy, terms and medical disclaimer (drafts for legal review)
.github/workflows/ci.yml  Typecheck, lint, tests, web build and native bundle checks
```

## Requirements

- Node 22 LTS (see `.nvmrc`)
- pnpm 10 (`corepack enable` picks up the pinned version)
- To run on a device: the **Expo Go** app, an Android emulator (Android Studio), or the iOS Simulator (Xcode, macOS only)

## Setup

```bash
corepack enable
pnpm install
```

### Environment variables

The app works fully on the device without any. To turn on accounts and sync, copy `apps/mobile/.env.example` to `apps/mobile/.env` (never commit it) and fill in:

| Variable                        | Phase | Purpose                                  |
| ------------------------------- | ----- | ---------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | 1     | Supabase project URL                     |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | 1     | Supabase public anon key (RLS-protected) |
| `SENTRY_DSN`                    | 7     | Crash reporting                          |

## Commands

Run these from the repository root.

| Command             | What it does                                                      |
| ------------------- | ----------------------------------------------------------------- |
| `pnpm dev`          | Start the Expo dev server (press `a` Android, `i` iOS, `w` web)   |
| `pnpm web`          | Start the dev server and open the web build                       |
| `pnpm android`      | Start and open on a connected Android device or emulator          |
| `pnpm ios`          | Start and open in the iOS Simulator (macOS)                       |
| `pnpm test`         | Unit and component tests in every package (Jest)                  |
| `pnpm typecheck`    | TypeScript strict checks in every package                         |
| `pnpm lint`         | ESLint with zero warnings allowed                                 |
| `pnpm format`       | Format with Prettier                                              |
| `pnpm build:web`    | Static web export to `apps/mobile/dist` (deployable as is)        |
| `pnpm check:native` | Compile the Android and iOS JavaScript bundles (no device needed) |

`pnpm test` also runs the Row Level Security tests when `DATABASE_URL` points at a disposable Postgres 15+ database (CI provides one). Without it those tests are skipped locally.

Store builds use EAS (`apps/mobile/eas.json`). They are set up in Phase 6.

## Supabase (accounts and sync)

Accounts are optional. Without Supabase settings the app stores everything on the device, and Settings shows that accounts are not set up.

1. Create a free project at [supabase.com](https://supabase.com). The free plan includes 500 MB of database storage and 50,000 monthly active users, and pauses projects after a week without activity; check current limits at supabase.com/pricing.
2. Install the [Supabase CLI](https://supabase.com/docs/guides/cli), then run `supabase link --project-ref <ref>` and `supabase db push` from the repository root to apply `supabase/migrations`.
3. Deploy the functions: `supabase functions deploy delete-account` and `supabase functions deploy notify-partners`.
4. Under Authentication → URL configuration, add `wellness://**` and your web URL (for example `https://<your-app>.vercel.app/**`) to the redirect URLs, so the email confirmation and password reset links open the app.
5. Put the project URL and anon key in `apps/mobile/.env` and, for the web build, in the Vercel project's environment variables.

Every table forces Row Level Security, so each account can read and change only its own rows. Consent records are append-only, and the notification delivery log has no user column.

**Partner sharing** is the one exception, and it is narrow: a partner can read the summary rows (`partner_snapshots`) for the scopes the owner chose, only while their `partner_links` row exists. Links are created only by `accept_partner_invite` with a single-use code (stored as a hash, valid 7 days). Either side can delete the link; the last link going away deletes the summary, and withdrawing consent ends every link. Notes, symptoms, weight and names are never shared. `supabase/tests/rls.test.ts` covers all of this.

## Privacy and legal

- Onboarding explains what is stored and asks for consent separately for each kind of health data and for anonymous statistics. Everything is off until the person turns it on. A module stays locked until its category is allowed, and consent can be changed in Settings → Your data.
- **Export** (Settings → Your data) downloads a JSON file with everything on the device and, when signed in, the account's server data.
- **Delete** removes the account and its files on the server, cancels scheduled notifications and clears all data on the device.
- The legal texts in `docs/legal/` are **drafts for legal review**. The app shows them under Settings; after editing one, run `pnpm --filter @wellness/mobile gen:legal` (a test fails if the in-app copy is stale).

## Notifications and achievements

Everything is off until the person opts in. Reminders are local notifications, planned a week ahead and rebuilt on every start, on return to the foreground and after any change, so they survive restarts, reinstalls (restored from the account) and time zone or daylight saving changes. Quiet hours, a daily limit (default 3, at most 5), snooze and lock-screen privacy apply to all of them. On the web, reminders and badges appear in the in-app notification center.

[docs/notifications-and-achievements.md](docs/notifications-and-achievements.md) lists every type, trigger, wording, default and achievement.

## Design system

- **Tokens live in `packages/design-tokens`.** Components never use raw values. Tailwind's default palette, spacing and font sizes are replaced by the tokens, so a class like `bg-red-500` or `p-7` does not exist.
- **Colors** are semantic: `background`, `surface`, `surface-muted`, `text`, `text-muted`, `primary`, `danger` and so on. Each has a light and a dark value, applied as CSS variables by `ThemeProvider`.
- **Module accents:** each module has an accent color (`water`, `mood`, `cycle`, `pregnancy`, `nutrition`) and a `-soft` tint. Wrap a module screen in `<AccentScope module="water">` and the generic `bg-accent` and `text-accent` classes pick up that module's color.
- **Contrast is tested.** `packages/design-tokens/src/colors.test.ts` fails the build if any text, accent or control color drops below WCAG AA in either theme.
- **Motion** comes from the `useMotion()` hook, which reads the OS reduce-motion setting. Durations become 0 and springs become instant when it is on.
- **Accessibility:** the base `Pressable` enforces a 44pt minimum touch target. Text scales with the system font size (capped on large headings). Interactive components set screen reader roles and labels.

## Modules

To turn a module off, set it to `false` in `apps/mobile/src/config/modules.config.ts`. It then disappears from navigation and the home screen, and its route redirects to home. On phones the bottom bar shows Home, the first three enabled modules and Settings; tablets and desktop web show every module in a side rail.

To add a module, create `src/features/<id>/` with a `manifest.ts`, a screen and tests. Then register it in `src/features/registry.ts`, add a route file under `src/app/(tabs)/` and add strings to both locale files.

## Localization and regions

Strings are in `src/i18n/locales/en.json` and `hi.json`. A test fails if the two files have different keys or placeholders. The Hindi strings need review by a native speaker before release.

Regional defaults (`src/lib/region.ts`): India uses metric units, DD/MM/YYYY and INR, and is the fallback for every other region. The USA uses imperial units, MM/DD/YYYY and USD.

## CI and free-tier limits

GitHub Actions runs two jobs on every pull request:

1. Formatting, typecheck, lint and tests
2. Web export and Android/iOS bundle compilation

Public repositories get unlimited Actions minutes. Private repositories get 2,000 free minutes per month, and each run uses about 5 to 8 minutes. EAS builds are not run in CI. The EAS free plan has a monthly build quota, so builds are triggered manually from Phase 6.

## Medical disclaimer

This app does not provide medical advice, diagnosis, or treatment. Consult a qualified healthcare professional.

## Installable web app (PWA)

The web build can be installed like an app. `apps/mobile/public/` holds the manifest, icons and a service worker (`sw.js`), and `src/app/+html.tsx` links them. Chrome, Edge and Android show an **Install app** button in Settings and on Home. On iPhone and iPad, people tap Share and then Add to Home Screen. Once the app has loaded, it opens and works offline.

## Deploying the web build (Vercel, free Hobby plan)

`vercel.json` holds the whole configuration, so no settings need to be changed in the Vercel dashboard.

1. Sign in at [vercel.com](https://vercel.com) with GitHub.
2. Choose **Add New → Project**, import `sharathhy/Apps`, and leave every setting at its default.
3. Click **Deploy**. Every push gets a preview URL; pushes to the production branch update the live site.

The Hobby plan is free for personal, non-commercial projects and includes 100 GB of bandwidth per month. Check current limits at vercel.com/pricing. A commercial launch needs the Pro plan or Netlify's free tier, so ask before switching.
