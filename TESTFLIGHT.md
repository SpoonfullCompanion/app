# TestFlight Preparation

## Apple Requirement

You need an active Apple Developer Program membership to upload builds to App Store Connect and distribute them with TestFlight.

## Manual Upload Flow

1. Run:

```bash
npm install
npm run build
npx cap sync ios
```

2. Open `ios/App/App.xcodeproj` in Xcode.
3. Set your Apple team in **Signing & Capabilities**.
4. Choose **Any iOS Device (arm64)** or a connected device.
5. Click **Product > Archive**.
6. In Organizer, choose **Distribute App**.
7. Select **App Store Connect**.
8. Upload the build.

## Automated Upload Option

This repo includes:

- `Gemfile`
- `fastlane/Appfile`
- `fastlane/Fastfile`
- `.github/workflows/testflight.yml`

Install Fastlane:

```bash
bundle install
```

Then run:

```bash
bundle exec fastlane ios beta
```

That lane:

1. Installs npm packages
2. Builds the web app
3. Syncs the Capacitor iOS project
4. Builds the Xcode project
5. Uploads the build to TestFlight

## GitHub Actions Upload Option

This repo includes an automated GitHub Actions workflow:

- `.github/workflows/testflight.yml`

It builds and uploads a TestFlight build when a commit to `main` contains the word **testflight** in the message (e.g. from Bolt when you say "publish the app"). You can also trigger it manually from the GitHub Actions tab.

The workflow has a manual input named `hide_header_chrome`:

- `true`: builds a cleaner demo with `VITE_SHOW_PATIENT_HEADER_CHROME=false`
- `false`: builds with the full header chrome (caregiver screens, sign out, etc.)

Push-triggered builds default to hiding the header chrome.

## Fastlane Environment

Optional environment variables:

```bash
export APPLE_ID="your-apple-id@example.com"
export APP_STORE_CONNECT_TEAM_ID="123456789"
```

## Recommended First Release Flow

1. Verify Supabase auth locally
2. Verify pairing and status updates locally
3. Verify on a real iPhone if possible
4. Upload one build manually from Xcode first
5. Use Fastlane for repeat uploads after the first successful archive
