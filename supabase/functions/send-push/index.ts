/* eslint-disable */
// @ts-nocheck
//
// send-push — OneSignal push fan-out for Spoonfull.
//
// Invoked by the app (supabase.functions.invoke('send-push', { body }))
// immediately after a row is written:
//   { type: 'status_update',     recordId }  -> notify the patient's active helpers
//   { type: 'caregiver_response', recordId }  -> notify the patient who got the reply
//
// Runs with the service role so it can resolve recipients across users, but
// verifies the caller owns the source row before sending anything. Recipients
// are targeted by OneSignal External ID, which the app sets to each user's
// profileId via OneSignal.login(profileId).
//
// Required function secrets (supabase secrets set ...):
//   ONESIGNAL_APP_ID        - OneSignal app id (same value as VITE_ONESIGNAL_APP_ID)
//   ONESIGNAL_REST_API_KEY  - OneSignal REST API key (server-side secret, never shipped to the client)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected by the platform.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID') ?? '';
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY') ?? '';
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

async function displayName(admin, profileId: string): Promise<string> {
  const { data } = await admin
    .from('profiles')
    .select('display_name')
    .eq('id', profileId)
    .maybeSingle();
  return (data?.display_name as string) ?? '';
}

/** Keep only the profile ids that have opted in to push. */
async function pushEnabledIds(admin, ids: string[]): Promise<string[]> {
  if (!ids.length) return [];
  const { data } = await admin
    .from('notification_preferences')
    .select('user_id')
    .in('user_id', ids)
    .eq('push_enabled', true);
  return (data ?? []).map((r) => r.user_id as string);
}

async function sendToOneSignal(
  externalIds: string[],
  heading: string,
  content: string,
  data: Record<string, unknown>,
): Promise<Response> {
  const res = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Classic REST API keys use the "Basic" scheme. If you generated a new
      // OneSignal API key that requires "Key <token>", change this header.
      Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_external_user_ids: externalIds,
      channel_for_external_user_ids: 'push',
      headings: { en: heading },
      contents: { en: content },
      data,
    }),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('OneSignal API error', result);
    return json({ error: 'OneSignal send failed', details: result }, 502);
  }
  return json({ ok: true, sent: externalIds.length, oneSignalId: result.id });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    return json({ error: 'OneSignal is not configured on the server' }, 500);
  }

  const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  if (!jwt) return json({ error: 'Missing Authorization header' }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData?.user) return json({ error: 'Invalid session' }, 401);
  const callerId = userData.user.id;

  let payload: { type?: string; recordId?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  const { type, recordId } = payload;
  if (!recordId) return json({ error: 'Missing recordId' }, 400);

  if (type === 'status_update') {
    const { data: update } = await admin
      .from('status_updates')
      .select('id, patient_id, message_text, targeted_follower_ids')
      .eq('id', recordId)
      .maybeSingle();
    if (!update) return json({ error: 'Status update not found' }, 404);
    if (update.patient_id !== callerId) return json({ error: 'Forbidden' }, 403);

    const { data: conns } = await admin
      .from('connections')
      .select('follower_id')
      .eq('patient_id', update.patient_id)
      .eq('status', 'active');
    let followerIds = (conns ?? []).map((c) => c.follower_id as string);

    const targeted = update.targeted_follower_ids as string[] | null;
    if (Array.isArray(targeted) && targeted.length) {
      const set = new Set(targeted);
      followerIds = followerIds.filter((id) => set.has(id));
    }

    const recipients = await pushEnabledIds(admin, followerIds);
    if (!recipients.length) return json({ ok: true, sent: 0 });

    const name = await displayName(admin, update.patient_id);
    const heading = name ? `${name} sent an update` : 'New update';
    const content =
      ((update.message_text as string) ?? '').trim() ||
      'Open Spoonfull to see what they need.';
    return await sendToOneSignal(recipients, heading, content, {
      kind: 'status_update',
      updateId: update.id,
      patientId: update.patient_id,
    });
  }

  if (type === 'caregiver_response') {
    const { data: resp } = await admin
      .from('caregiver_responses')
      .select('id, status_update_id, caregiver_id, message')
      .eq('id', recordId)
      .maybeSingle();
    if (!resp) return json({ error: 'Response not found' }, 404);
    if (resp.caregiver_id !== callerId) return json({ error: 'Forbidden' }, 403);
    const message = ((resp.message as string) ?? '').trim();
    if (!message) return json({ ok: true, sent: 0, skipped: 'empty' });

    const { data: update } = await admin
      .from('status_updates')
      .select('id, patient_id')
      .eq('id', resp.status_update_id)
      .maybeSingle();
    if (!update) return json({ error: 'Parent update not found' }, 404);

    const recipients = await pushEnabledIds(admin, [update.patient_id as string]);
    if (!recipients.length) return json({ ok: true, sent: 0 });

    const name = await displayName(admin, resp.caregiver_id);
    const heading = name ? `${name} replied` : 'New reply';
    return await sendToOneSignal(recipients, heading, message, {
      kind: 'caregiver_response',
      updateId: update.id,
      responseId: resp.id,
    });
  }

  return json({ error: `Unknown type: ${type}` }, 400);
});
