# Wellness suite

A suite of health and wellness trackers built as one React Native (Expo) app for Android, iOS and the web. It has five modules (Water, Mood, Cycle, Pregnancy and Nutrition) with a shared design system. Each module can be turned on or off in a config file.

> **Status: Phase 0 (project setup).** The design tokens, UI kit, responsive navigation shell, localization (English and Hindi) and CI are in place. The module screens are placeholders.

## Repository layout

```
apps/
  mobile/                 Expo app (Android, iOS, web) using Expo Router
    src/app/              Routes. Every file is a screen; _layout.tsx files are navigators
    src/features/<module> One folder per module: manifest, screens, tests
    src/config/modules.config.ts   Turn modules on or off and set their order
    src/i18n/             i18next setup and en/hi string files
    src/lib/              Pure helpers (regional date and unit defaults)
packages/
  design-tokens/          Colors (light/dark), type scale, spacing, radii, shadows, motion; Tailwind preset
  ui/                     Token-only components: Text, Button, Card, Screen, Icon, ProgressRing, Skeleton, state views
  config/                 Shared TypeScript, ESLint and Babel config
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

Phase 0 needs none. From Phase 1 the app will read these from `apps/mobile/.env` (never commit it):

| Variable                        | Phase | Purpose                                  |
| ------------------------------- | ----- | ---------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | 1     | Supabase project URL                     |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | 1     | Supabase public anon key (RLS-protected) |
| `SENTRY_DSN`                    | 5     | Crash reporting                          |

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

Store builds use EAS (`apps/mobile/eas.json`). They are set up in Phase 6.

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
