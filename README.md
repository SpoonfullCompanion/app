# Spoonfull Mobile App

iOS and Android app for the Spoonfull Crash Companion — built with React, Capacitor, and Supabase.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and add Supabase or OneSignal values if you want connected mode.
3. Run `npm run dev` for the web shell or `npm run build` to produce the Capacitor web assets.
4. Install CocoaPods on macOS before creating the iOS project.
5. After native platforms exist, run `npm run cap:sync`, then `npm run ios` or `npm run android`.

## Modes

- Without Supabase env vars, the app runs in demo mode and seeds local patient/caregiver data.
- With Supabase env vars present, the app enables magic-link auth, pairing persistence, and realtime status sync.
- With `VITE_ONESIGNAL_APP_ID` present, the notification layer is ready for remote push configuration.

## Publishing to TestFlight

Include the word **testflight** in your commit message to trigger an automated TestFlight build via GitHub Actions. For example, from Bolt, say "publish the app" and it will include "testflight" in the commit.

You can also trigger a build manually from the GitHub Actions tab using the "TestFlight" workflow.

> **Note:** The CI/CD workflow is currently disabled until iOS certificates and GitHub secrets are configured. See [GITHUB_SECRETS.md](GITHUB_SECRETS.md) for setup instructions.

## Docs

- [SETUP.md](SETUP.md) — Local development and simulator setup
- [APPLE.md](APPLE.md) — Apple Developer enrollment and App Store Connect
- [GITHUB_SECRETS.md](GITHUB_SECRETS.md) — CI/CD secrets configuration
- [SUPABASE.md](SUPABASE.md) — Database schema and auth setup
- [TESTFLIGHT.md](TESTFLIGHT.md) — TestFlight deployment guide
