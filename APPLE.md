# Apple Account And App Store Setup

Use this file for:

1. Signing up for Apple Developer
2. Creating the app in App Store Connect
3. Getting the app record ready for release
4. Handing off to the TestFlight process in [TESTFLIGHT.md](/Users/greg/spoonfull-app/web/TESTFLIGHT.md)

Important:

- You need an Apple ID with two-factor authentication turned on.
- Apple Developer Program membership is currently `$99 USD` per membership year.
- The app’s bundle identifier in this repo is currently `com.spoonfull.app`. Do not create the App Store record with a different bundle ID unless the developer changes the project first.
- For a prototype-only TestFlight build, set `VITE_SHOW_PATIENT_HEADER_CHROME=false` before building so the patient header buttons stay hidden.

Official Apple references:

- Apple Developer enrollment: [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll/)
- Create an app record: [developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/)
- Upload builds: [developer.apple.com/help/app-store-connect/manage-builds/upload-builds](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/)
- Invite external testers: [developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers](https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers/)

## 1. Enroll In Apple Developer

1. Sign in with the Apple ID that should own the app.
2. Turn on two-factor authentication if it is not already on.
3. Go to Apple Developer enrollment: [Enroll](https://developer.apple.com/programs/enroll/).
4. Choose whether you are enrolling as:
   - `Individual` if the app is owned by one person
   - `Organization` if the app should belong to a company
5. Complete the identity and contact steps.
6. Pay the annual fee.
7. Wait for Apple to approve the membership.

Relevant details:

- Organization enrollment usually takes more information than individual enrollment.
- If enrolling as an organization, Apple may ask for legal business details and D-U-N-S information.
- The person who completes enrollment becomes the Account Holder. That role has the most control.

## 2. Sign In To App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com/).
2. Sign in with the same Apple ID.
3. Accept any pending agreements.
4. If Apple asks for contact or tax information, complete whatever is required.

If this app is free and has no paid features yet, banking setup can usually wait until monetization is added. If Apple blocks progress with a required agreement, complete it before moving on.

## 3. Gather The App Information Before You Create The Record

Have these ready:

- App name
- Primary language
- Bundle ID
  Current repo value: `com.spoonfull.app`
- SKU
  This is an internal identifier only, for example `spoonfull-ios-001`
- Subtitle
- Short and long description
- Keywords
- Support URL
- Privacy Policy URL
- Marketing URL if you want one
- App category
- Copyright line
- App icon
- iPhone screenshots
- Age rating answers
- Privacy answers for App Privacy

If any of these are undecided, stop and resolve them first. Bundle ID and app name choices are especially important.

## 4. Create The App Record

In App Store Connect:

1. Open `Apps`.
2. Click the `+` button.
3. Choose `New App`.
4. Enter:
   - `Platforms`: iOS
   - `Name`: your final app name
   - `Primary Language`
   - `Bundle ID`: choose `com.spoonfull.app` unless the developer gives you a new one
   - `SKU`: any unique internal code
5. Click `Create`.

If the Bundle ID you need is missing from the list, stop and ask the developer to register or confirm the iOS app identifier first.

## 5. Fill Out The App Record

Inside the new app record, complete the sections Apple expects before release:

1. `App Information`
   - category
   - content rights
   - age rating
2. `Pricing and Availability`
   - price tier
   - territories
3. `App Privacy`
   - answer the data collection questions carefully
4. `App Store`
   - screenshots
   - description
   - keywords
   - support URL
   - marketing URL if used
5. Optional but recommended:
   - Accessibility Nutrition Labels

Practical note:

- Do not press release/publish until the build is tested in TestFlight and the metadata is complete.

## 6. Prepare Access For The Build Upload

Before anyone can upload a build:

1. Make sure the app record exists.
2. Make sure the bundle ID in App Store Connect matches the Xcode project.
3. Decide who will upload builds:
   - manual upload in Xcode
   - automated upload from GitHub Actions

> If you are only preparing the Apple-side setup, this is where you can pause and hand off to the developer.

## 7. Prototype-Only TestFlight Build

If you want a TestFlight build that looks more like the original prototype and hides the extra patient header links:

Set:

```env
VITE_SHOW_PATIENT_HEADER_CHROME=false
```

What this does:

- hides the patient `Invite code` button
- hides the patient `Log out` button
- keeps the demo return button for moving back to the main screen

Where to set it:

- local build: add it to `.env`
- GitHub Actions TestFlight build: the workflow has a manual input named `prototype_only`
  - `true` means the workflow sets `VITE_SHOW_PATIENT_HEADER_CHROME=false`
  - `false` means the workflow keeps the standard patient header chrome

## 8. GitHub Actions TestFlight Workflow

This repo now includes:

- [testflight.yml](/Users/greg/spoonfull-app/web/.github/workflows/testflight.yml)

It is a manual GitHub Actions workflow that:

1. checks out the repo
2. installs Node and Ruby
3. installs the iOS signing certificate into a temporary keychain
4. installs the App Store provisioning profile
5. builds the web assets
6. syncs Capacitor iOS
7. archives the iOS app with Fastlane
8. uploads the build to TestFlight

GitHub secrets you will need before that workflow can run:

- `APPLE_TEAM_ID`
- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_API_KEY_BASE64`
- `IOS_CERTIFICATE_P12_BASE64`
- `IOS_CERTIFICATE_PASSWORD`
- `IOS_KEYCHAIN_PASSWORD`
- `IOS_PROVISIONING_PROFILE_BASE64`
- `IOS_PROVISIONING_PROFILE_NAME`

Optional app env secrets for a connected build:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ONESIGNAL_APP_ID`

Notes:

- The GitHub workflow is manual on purpose. It does not auto-upload on every push.
- The App Store Connect API key is for upload access.
- The signing certificate and provisioning profile are still required to create a signed iOS archive.

## 9. What To Hand Off For TestFlight

Once the Apple account and app record are ready, continue with:

- [TESTFLIGHT.md](/Users/greg/spoonfull-app/web/TESTFLIGHT.md)
- [GITHUB_SECRETS.md](/Users/greg/spoonfull-app/web/GITHUB_SECRETS.md)

That file covers the actual beta upload flow. You said you can help with the TestFlight part, which is the right place for the more technical signing and upload steps.
