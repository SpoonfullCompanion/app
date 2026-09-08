/* eslint-disable */
// @ts-nocheck
//
// delete-account — Permanently deletes a user's account and all associated data.
//
// Invoked by the app (supabase.functions.invoke('delete-account')) while the
// user is authenticated. The function verifies the caller's identity from
// their JWT, then:
//   1. Deletes their profile row — ON DELETE CASCADE removes all related rows
//      in status_updates, connections, pairings, notification_preferences,
//      caregiver_archived_updates, patient_archived_updates, and
//      caregiver_responses (via cascade from status_updates).
//   2. Deletes the auth user account itself via the admin API.
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected by the platform.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    if (!jwt) return json({ error: 'Missing Authorization header' }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData?.user) return json({ error: 'Invalid session' }, 401);
    const callerId = userData.user.id;

    // Delete the profile row — cascades to all related tables.
    const { error: profileErr } = await admin
      .from('profiles')
      .delete()
      .eq('id', callerId);

    if (profileErr) {
      console.error('[delete-account] Failed to delete profile', profileErr);
      return json({ error: 'Failed to delete account data' }, 500);
    }

    // Delete the auth user account.
    const { error: authErr } = await admin.auth.admin.deleteUser(callerId);
    if (authErr) {
      console.error('[delete-account] Failed to delete auth user', authErr);
      // Profile data is already gone; the auth user is orphaned but
      // cannot sign in without a profile row. Return success so the
      // client clears local state.
    }

    return json({ ok: true });
  } catch (err) {
    console.error('[delete-account] Unexpected error', err);
    return json({ error: 'An unexpected error occurred' }, 500);
  }
});
