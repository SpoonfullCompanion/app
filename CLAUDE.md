# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build          # Production build (always run to verify changes)
npm run dev            # Dev server (web only)
npm run lint           # ESLint
npm run ios:sync       # Build + sync to iOS native project
npm run cap:sync       # Sync web assets to both iOS and Android
```

There are no tests. Verify correctness by running `npm run build` and checking for TypeScript errors.

## Architecture

**Spoonfull** is a Capacitor-based iOS/Android app (also runs as web) that helps chronically ill patients communicate needs to caregivers. It has two user roles — patient and caregiver — and works fully offline (demo mode) or with Supabase (connected mode).

### Entry point & state

`src/App.tsx` owns all top-level state: `session`, `pairing`, and `latestStatus`. There is no external state management library. All orchestration — auth, pairing, status subscriptions — flows through `App.tsx` calling functions from `src/services/backend.ts`.

`src/services/backend.ts` is the single backend layer. It handles localStorage reads/writes, all Supabase queries, demo data seeding, auth flows, and realtime subscriptions. ~800 lines.

### Two operating modes

The app detects its mode at runtime from env vars:

- **Demo mode** — no `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`. Seeds a local pairing (`DEMO42`) and status update into localStorage. No network calls. Selected in `DemoRoleScreen`.
- **Connected mode** — Supabase configured. Magic link auth (primary), password auth enabled only on localhost for dev convenience. Realtime subscriptions + localStorage cache.

When `session.authMode === 'demo'`, backend functions skip Supabase and return from localStorage only.

### Screen routing

There is no router library. `App.tsx` renders screens conditionally based on state:

```
isLoading → LoadingScreen
!session && showDemoRoleSelection → DemoRoleScreen
!session → LoginScreen / SignupScreen
session.role === 'patient' → PatientHome (has its own bottom-nav sub-router)
session.role === 'caregiver' → CaregiverHome
```

`PatientHome` manages its own `activeRoute` state and renders: `HomeScreen`, `StatusScreen`, `NeedsScreen`, `HospitalScreen`, `AccountScreen` — each a full-screen component swapped in place.

### Data flow

1. Patient selects energy/symptoms/needs in `StatusScreen` or `NeedsScreen`
2. Calls `onSendUpdate(submission)` → `sendStatusUpdate()` in backend
3. Written to localStorage + Supabase `status_updates` table
4. Caregiver's `subscribeToStatusUpdates()` fires (Supabase realtime + 3s poll fallback)
5. `latestStatus` state updates → `StatusSummaryCard` re-renders in `CaregiverHome`

### Key types (`src/types/app.ts`)

- `AppSession` — `{ profileId, role, email, authMode, displayName }`
- `Pairing` — links patient + caregiver via 6-char `code`; status `'pending' | 'paired'`
- `StatusUpdate` — energy level, `selectedNeeds[]`, `selectedSymptoms[]`, composed `messageText`

### Communication data

All selectable items (needs, energy statuses, symptoms) live in `src/utils/communicationData.ts` as typed arrays with `id`, `label`, `icon` (Lucide icon name), and `speech`/`text` for TTS. Icons are resolved at render time via `LucideIcons[icon]`.

### Supabase schema

Four tables: `profiles`, `pairings`, `status_updates`, `notification_preferences`. RLS is enabled on all tables. Migrations are in `supabase/migrations/` — apply with `mcp__supabase__apply_migration`, never raw `DROP`.

### Design system

Tailwind with custom colors defined in `tailwind.config.js`:
- `midnight-black` (#1D1D1D) — page backgrounds
- `dark-blue` (#243576) — card borders/backgrounds
- `bold-blue` (#425FCC) — primary interactive/CTA
- `periwinkle` (#7894FF) — labels, secondary accents
- `off-white` (#E8E8E8) — body text

Patient screens use `bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)]` as the page background. Cards use `rounded-xl border border-periwinkle/20 bg-midnight-black/50`. CTAs use `rounded-full bg-bold-blue`. Match this pattern when adding new screens.

### Capacitor / native

- App ID: `com.spoonfull.app`
- Deep link `com.spoonfull.app://auth/callback` is intercepted by `CapacitorApp.addListener('appUrlOpen')` in `App.tsx` for magic link auth
- Local notifications via `@capacitor/local-notifications` (caregiver reminders)
- Native build: `npm run build && npx cap sync ios` then open Xcode

### TestFlight deployment

Include the word **"testflight"** in any git commit message to trigger the automated CI pipeline (`.github/workflows/testflight.yml` + Fastlane).

