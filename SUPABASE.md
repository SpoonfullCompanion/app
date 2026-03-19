# Supabase Setup And Testing

## Required Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ONESIGNAL_APP_ID=
```

## Supabase Dashboard Setup

1. Create a Supabase project.
2. In **Project Settings > API**, copy:
   - Project URL
   - Publishable / anon key
3. In the **SQL Editor**, run:
   - `supabase/migrations/20260311011500_mobile_v1_schema.sql`
   - `supabase/migrations/20260311123500_fix_pairing_lookup_policy.sql`
   - `supabase/migrations/20260311174000_fix_pairing_claim_policy.sql`
   - `supabase/migrations/20260311181500_fix_pairing_unclaim_policy.sql`
4. In **Authentication > Providers**, make sure **Email** is enabled.
5. For easy localhost password testing, open **Authentication > Providers > Email** and turn off **Confirm email** while you are creating local test accounts.
6. In **Authentication > URL Configuration**, add:
   - `http://localhost:5173`
   - `http://localhost:4173`
   - `com.spoonfull.app://auth/callback`
7. In **Realtime**, make sure `status_updates` is available for Postgres changes.

## Local Testing Checklist

### Test auth on the web first

```bash
npm install
npm run dev
```

Then:

1. Open the app in a browser.
2. Choose **Patient** or **Caregiver**.
3. In localhost, use the **Local testing** section first:
   - enter a username such as `patient-test`
   - enter a password with at least 6 characters
   - click **Create account**
4. Open a second browser or private window.
5. Create a second account for the other role.

Expected result:

- You land in the signed-in flow without waiting for email.
- A row appears in `profiles`.

If you want to test the real email flow instead:

1. Enter an email address in **Use magic link instead**.
2. Click **Send magic link**.
3. Open the email and click the magic link.

### Test auth in the iOS simulator

```bash
npm run build
npx cap sync ios
```

Then:

1. Run the app in the simulator.
2. Send a magic link from the app.
3. Open the email on the same simulated device if possible, or open the link in Safari on that device.
4. Tap the link.

Expected result:

- The app opens through `com.spoonfull.app://auth/callback`
- The session is restored inside the app
- The auth screen is replaced with the signed-in flow

### Test pairing

1. Sign in as a patient.
2. Create an invite code.
3. Copy the code.
4. Sign out.
5. Sign in as a caregiver.
6. Enter the invite code.

Expected result:

- A row appears in `pairings`
- Both `patient_id` and `caregiver_id` are populated

If the caregiver sees `Invite code not found` even though the patient just created it:

1. Re-run `supabase/migrations/20260311123500_fix_pairing_lookup_policy.sql` in the SQL Editor.
2. Create a brand new invite code.
3. Retry from the caregiver browser.

If the caregiver can join locally but patient updates still save with `"caregiver_id": null`:

1. Run `supabase/migrations/20260311174000_fix_pairing_claim_policy.sql`.
2. Create a brand new invite code.
3. Join again from the caregiver browser.
4. Send a fresh patient update.

If the caregiver sees an RLS error when clicking `Use different code`:

1. Run `supabase/migrations/20260311181500_fix_pairing_unclaim_policy.sql`.
2. Refresh the caregiver browser.
3. Click `Use different code` again.

### Test status updates

1. Stay signed in as the patient.
2. Complete the prototype flow.
3. Tap the final send action in the prototype flow.

Expected result:

- A row appears in `status_updates`
- The status payload fields are populated

### Test realtime

1. Keep one session open as patient in the simulator.
2. Open another session as caregiver in a browser private window or another device.
3. Pair them.
4. Send a new patient update.

Expected result:

- The caregiver view refreshes with the latest status without a manual reload

## What To Check In Supabase

Open **Table Editor** and confirm rows are appearing in:

- `profiles`
- `pairings`
- `status_updates`
- `notification_preferences`
