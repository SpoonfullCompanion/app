/* eslint-disable */
// @ts-nocheck
//
// submit-feedback — Creates a GitHub issue from in-app user feedback.
//
// Invoked by the app (supabase.functions.invoke('submit-feedback', { body: { feedback } }))
// while the user is authenticated. The function verifies the caller's identity
// from their JWT, looks up their display name and role, then uses the GitHub
// REST API to create an issue in the configured repository.
//
// Required function secrets (supabase secrets set ...):
//   GITHUB_TOKEN  - GitHub Personal Access Token with repo (private) or public_repo (public) scope
//   GITHUB_REPO   - Repository in owner/name format, e.g. "spoonfullcompanion/app"
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected by the platform.

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN') ?? '';
const GITHUB_REPO = Deno.env.get('GITHUB_REPO') ?? 'spoonfullcompanion/app';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  if (!GITHUB_TOKEN) {
    return json({ error: 'GitHub integration is not configured on the server' }, 500);
  }

  try {
    const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    if (!jwt) return json({ error: 'Missing Authorization header' }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData?.user) return json({ error: 'Invalid session' }, 401);
    const callerId = userData.user.id;

    const { data: profile } = await admin
      .from('profiles')
      .select('display_name, role')
      .eq('id', callerId)
      .maybeSingle();

    const displayName = (profile?.display_name as string) ?? 'Unknown user';
    const role = (profile?.role as string) ?? 'unknown';

    let payload: { feedback?: string };
    try {
      payload = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const feedback = (payload.feedback ?? '').trim();
    if (!feedback) return json({ error: 'Feedback cannot be empty' }, 400);
    if (feedback.length > 5000) return json({ error: 'Feedback is too long (max 5000 characters)' }, 400);

    const timestamp = new Date().toISOString();
    const titleExcerpt = feedback.slice(0, 60).replace(/\n/g, ' ');
    const title = `Feedback: ${titleExcerpt}${feedback.length > 60 ? '…' : ''}`;

    const body = [
      `**Submitted by:** ${displayName}`,
      `**Role:** ${role}`,
      `**Time:** ${timestamp}`,
      '',
      '---',
      '',
      feedback,
    ].join('\n');

    const labels = ['user-feedback'];

    const ghRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body, labels }),
    });

    if (!ghRes.ok) {
      const ghErr = await ghRes.json().catch(() => ({}));
      console.error('[submit-feedback] GitHub API error', ghRes.status, JSON.stringify(ghErr));
      return json({ error: 'Failed to create feedback issue' }, 502);
    }

    const ghData = await ghRes.json();
    console.log('[submit-feedback] Created issue', ghData.number, 'in', GITHUB_REPO);

    return json({ ok: true, issueNumber: ghData.number });
  } catch (err) {
    console.error('[submit-feedback] Unexpected error', err);
    return json({ error: 'An unexpected error occurred' }, 500);
  }
});
