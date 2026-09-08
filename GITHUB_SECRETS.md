# GitHub Secrets For TestFlight

This file explains exactly how to prepare the GitHub repository secrets used by:

- [testflight.yml](/Users/greg/spoonfull-app/web/.github/workflows/testflight.yml)

Use this guide after:

- Apple Developer enrollment is complete
- the app record exists in App Store Connect
- you are ready to let GitHub build and upload a TestFlight build

If you are not there yet, start with:

- [APPLE.md](/Users/greg/spoonfull-app/web/APPLE.md)
- [TESTFLIGHT.md](/Users/greg/spoonfull-app/web/TESTFLIGHT.md)

Official references:

- GitHub Actions secrets: [GitHub Docs](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
- App Store Connect API keys: [Apple Help](https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-api)
- Certificate signing request: [Apple Help](https://developer.apple.com/help/account/certificates/create-a-certificate-signing-request)
- Certificates overview: [Apple Help](https://developer.apple.com/help/account/create-certificates/certificates-overview)
- App Store provisioning profile: [Apple Help](https://developer.apple.com/help/account/provisioning-profiles/create-an-app-store-provisioning-profile)
- Installing Apple signing assets in GitHub Actions: [GitHub Docs](https://docs.github.com/en/enterprise-cloud@latest/actions/use-cases-and-examples/deploying/installing-an-apple-certificate-on-macos-runners-for-xcode-development)

## What The Workflow Needs

The GitHub Actions workflow expects these secrets:

- `APPLE_TEAM_ID`
- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_API_KEY_BASE64`
- `IOS_CERTIFICATE_P12_BASE64`
- `IOS_CERTIFICATE_PASSWORD`
- `IOS_KEYCHAIN_PASSWORD`
- `IOS_PROVISIONING_PROFILE_BASE64`
- `IOS_PROVISIONING_PROFILE_NAME`

Optional app env secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ONESIGNAL_APP_ID`

## Where To Add The Secrets In GitHub

GitHub’s current repository secret flow is:

1. Open the GitHub repository.
2. Click `Settings`.
3. In the left sidebar, open `Secrets and variables`.
4. Click `Actions`.
5. Open the `Secrets` tab.
6. Click `New repository secret`.
7. Add each secret from this guide one by one.

If you cannot see `Settings`, you likely do not have enough repository access.

## 1. APPLE_TEAM_ID

This is your Apple Developer Team ID.

How to find it:

1. Sign in to [developer.apple.com/account](https://developer.apple.com/account/).
2. Open the membership or account details area.
3. Copy the Team ID.

Add this to GitHub as:

- secret name: `APPLE_TEAM_ID`
- value: your Apple Team ID

## 2. App Store Connect API Key Secrets

These are used by Fastlane to upload to TestFlight without interactive Apple ID login.

You need:

- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_API_KEY_BASE64`

### Create The API Key

Apple’s App Store Connect API docs say the Account Holder must first enable API access, then a team key can be generated.

In App Store Connect:

1. Sign in to [appstoreconnect.apple.com](https://appstoreconnect.apple.com/).
2. Open `Users and Access`.
3. Open the `Integrations` tab.
4. Open `App Store Connect API`.
5. If prompted, enable API access.
6. Create a new team API key.
7. Give it a clear name, for example `GitHub TestFlight Upload`.
8. Choose a role with enough access for build upload.
   Recommended: `App Manager` or another role you already use for build operations.
9. Download the `.p8` key file.

Important:

- Apple only lets you download the `.p8` file once.
- Store it securely.

### Add The API Key Secrets

From App Store Connect:

- copy the `Key ID`
- copy the `Issuer ID`

Add them as:

- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`

For the downloaded `.p8` file, convert it to Base64 first.

On Mac Terminal:

```bash
base64 -i AuthKey_ABC123XYZ.p8 | pbcopy
```

Then add:

- `APP_STORE_CONNECT_API_KEY_BASE64`
- value: the copied Base64 string

## 3. Apple Distribution Certificate Secrets

The workflow needs a signing certificate in `.p12` form plus its password.

You need:

- `IOS_CERTIFICATE_P12_BASE64`
- `IOS_CERTIFICATE_PASSWORD`
- `IOS_KEYCHAIN_PASSWORD`

### Create Or Confirm The Distribution Certificate

Apple’s certificate docs say App Store distribution uses an `Apple Distribution` certificate.

If your team already has an Apple Distribution certificate and it is installed in Keychain on the Mac used for releases, use that existing one.

If you need to create one:

1. On the Mac, open `Keychain Access`.
2. In the menu bar, choose `Keychain Access > Certificate Assistant > Request a Certificate From a Certificate Authority`.
3. Save the CSR file to disk.
4. Sign in to [developer.apple.com/account/resources/certificates/list](https://developer.apple.com/account/resources/certificates/list).
5. Click the add button.
6. Choose `Apple Distribution`.
7. Upload the CSR.
8. Download the certificate.
9. Double-click the downloaded certificate so it installs into Keychain Access.

### Export The Certificate As .p12

On the same Mac:

1. Open `Keychain Access`.
2. In `My Certificates`, find the `Apple Distribution` certificate for the correct team.
3. Expand it and make sure the private key is present underneath it.
4. Right-click the certificate.
5. Choose `Export`.
6. Save it as a `.p12` file.
7. Enter a password when prompted.

That password becomes:

- `IOS_CERTIFICATE_PASSWORD`

### Convert The .p12 To Base64

On Mac Terminal:

```bash
base64 -i YourCertificate.p12 | pbcopy
```

Add this to GitHub as:

- `IOS_CERTIFICATE_P12_BASE64`

### Create A Keychain Password Secret

The workflow creates a temporary macOS keychain during the build.

Choose any strong password and add it as:

- `IOS_KEYCHAIN_PASSWORD`

This is not your Apple ID password.

## 4. App Store Provisioning Profile Secrets

You need:

- `IOS_PROVISIONING_PROFILE_BASE64`
- `IOS_PROVISIONING_PROFILE_NAME`

### Create The App Store Provisioning Profile

Apple’s provisioning profile docs say App Store uploads need an App Store Connect provisioning profile that matches the app’s bundle ID.

Current bundle ID in this repo:

- `com.spoonfull.app`

In Apple Developer:

1. Sign in to [developer.apple.com/account/resources/profiles/list](https://developer.apple.com/account/resources/profiles/list).
2. Click the add button.
3. Under `Distribution`, choose `App Store Connect`.
4. Continue.
5. Select the App ID for `com.spoonfull.app`.
6. Select the correct Apple Distribution certificate.
7. Continue.
8. Enter a profile name.
   Example: `Spoonfull App Store Profile`
9. Generate the profile.
10. Download the `.mobileprovision` file.

### Add The Provisioning Profile Secrets

Set:

- `IOS_PROVISIONING_PROFILE_NAME`
- value: the exact profile name you created in Apple Developer

Then convert the downloaded profile file to Base64:

```bash
base64 -i YourProfile.mobileprovision | pbcopy
```

Add:

- `IOS_PROVISIONING_PROFILE_BASE64`

## 5. App Environment Secrets

These are optional, but usually needed for a connected build.

### Supabase

Add:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Use the same values you already use locally.

### OneSignal

If push is configured later, add:

- `VITE_ONESIGNAL_APP_ID`

If it is not ready, you can leave this repository secret unset.

## 6. Prototype-Only TestFlight Build

The TestFlight workflow includes a manual input named:

- `prototype_only`

When set to `true`, the workflow automatically builds with:

```env
VITE_SHOW_PATIENT_HEADER_CHROME=false
```

That gives you a cleaner prototype-style TestFlight build for demos and review.

You do not need to create a separate GitHub secret for this flag unless you want to change the workflow.

## 7. Recommended Secret Setup Checklist

Complete these in order:

1. Add `APPLE_TEAM_ID`
2. Add the three App Store Connect API key secrets
3. Add the certificate secrets
4. Add the provisioning profile secrets
5. Add Supabase secrets if the build should run in connected mode
6. Run the GitHub `TestFlight` workflow manually with `prototype_only=true` for a clean demo build

## 8. Quick Verification Before Running The Workflow

Before you trigger the GitHub Action, confirm:

- the app record exists in App Store Connect
- the bundle ID is `com.spoonfull.app`
- the distribution certificate matches the same Apple team
- the provisioning profile matches the same bundle ID
- the provisioning profile uses the same distribution certificate
- the GitHub secrets are saved under the exact names listed above

## 9. Common Failure Cases

### `No profile for team matching ...`

Usually means:

- wrong provisioning profile
- wrong profile name
- wrong bundle ID

### `No signing certificate found`

Usually means:

- the `.p12` export is wrong
- the private key was not included in the export
- the `.p12` password secret is wrong

### `Authentication credentials are missing or invalid`

Usually means:

- App Store Connect API key secrets are wrong
- the `.p8` file was encoded incorrectly
- the API key does not have enough access

### Build uploads but the app looks wrong

Usually means:

- the workflow was run with the wrong `prototype_only` setting
- the app env secrets point to a different backend than expected

## 10. When To Ask The Developer For Help

Ask for help if:

- the bundle ID in Apple does not match the repo
- you cannot find or export the correct distribution certificate
- the provisioning profile is not clearly tied to `com.spoonfull.app`
- the GitHub workflow fails during signing or upload
- you are unsure whether the build should use `prototype_only=true`

## 11. In-App Feedback (Supabase Edge Function Secrets)

The app has a "Send Feedback" card on the Account screen for both patients and caregivers. When a user submits feedback, it creates a GitHub issue in your repository automatically. This requires two Supabase edge function secrets (not GitHub Actions secrets — these are set in the Supabase dashboard).

### Required Supabase Secrets

- `GITHUB_TOKEN` — a GitHub Personal Access Token
- `GITHUB_REPO` — your repository in `owner/name` format

### Creating The GitHub Personal Access Token

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens) (classic) or Settings > Developer settings > Personal access tokens (fine-grained).
2. For a classic token:
   - Click "Generate new token (classic)".
   - Give it a clear name, e.g. "Spoonfull Feedback Bot".
   - Select the `repo` scope (for private repos) or `public_repo` scope (for public repos).
   - Generate and copy the token.
3. For a fine-grained token:
   - Select the `spoonfullcompanion/app` repository.
   - Grant "Issues" read/write permissions.
   - Generate and copy the token.

### Setting The Secrets In Supabase

1. Open the Supabase dashboard for your project.
2. Go to Project Settings > Edge Functions > Secrets (or Settings > Secrets, depending on dashboard version).
3. Add a new secret:
   - name: `GITHUB_TOKEN`
   - value: the token you copied above
4. Add another secret:
   - name: `GITHUB_REPO`
   - value: `spoonfullcompanion/app`

### How It Works

When a user taps "Send Feedback" and writes a message, the app calls the `submit-feedback` edge function. The function verifies the user is signed in, looks up their display name and role, then uses the GitHub REST API to create an issue titled "Feedback: [short excerpt]" with the full message, the sender's name, their role, and a timestamp. The issue is labeled `user-feedback` so you can filter for it in your backlog.

### Verification

After setting the secrets, submit a test feedback from the app. Check the Issues tab of your repository — a new issue with the `user-feedback` label should appear within a few seconds.