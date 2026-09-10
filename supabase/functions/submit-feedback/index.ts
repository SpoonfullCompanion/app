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
  // Short id so every line from one submission can be grepped together.
  const rid = crypto.randomUUID().slice(0, 8);
  const log = (...args: unknown[]) => console.log(`[submit-feedback][${rid}]`, ...args);
  const logErr = (...args: unknown[]) => console.error(`[submit-feedback][${rid}]`, ...args);

  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== 'POST') {
    logErr('Method not allowed:', req.method);
    return json({ error: 'Method not allowed' }, 405);
  }

  // Read and parse the body FIRST, before any check that can bail out. Whatever
  // else goes wrong from here on, the user's words are already in hand and get
  // written to the error log rather than lost.
  let rawBody = '';
  try {
    rawBody = await req.text();
  } catch (err) {
    logErr('Could not read request body:', err);
  }

  let feedback = '';
  let parseFailed = false;
  if (rawBody) {
    try {
      const payload = JSON.parse(rawBody) as { feedback?: unknown };
      feedback = String(payload.feedback ?? '').trim();
    } catch {
      parseFailed = true;
      logErr('Request body was not valid JSON. Raw body:', rawBody.slice(0, 5000));
    }
  }

  // Anything that prevents the issue from being filed logs this, so the text is
  // recoverable from the function logs and can be filed by hand.
  const logUnfiled = (reason: string, who = 'unidentified user') => {
    logErr(
      `UNFILED FEEDBACK (${reason}) from ${who} at ${new Date().toISOString()}:`,
      feedback || rawBody.slice(0, 5000) || '(nothing captured)',
    );
  };

  log('Request received. bytes=', rawBody.length, 'parsedChars=', feedback.length);

  if (!GITHUB_TOKEN) {
    logErr('GITHUB_TOKEN is not set on this function. Check Project Settings -> Edge Functions -> Secrets.');
    logUnfiled('GITHUB_TOKEN missing');
    return json({ error: 'GitHub integration is not configured on the server' }, 500);
  }

  try {
    const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    if (!jwt) {
      logErr('Missing Authorization header.');
      logUnfiled('no auth header');
      return json({ error: 'Missing Authorization header' }, 401);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      logErr('Session validation failed:', userErr?.message ?? 'no user on token');
      logUnfiled('invalid session');
      return json({ error: 'Invalid session' }, 401);
    }
    const callerId = userData.user.id;

    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('display_name, role')
      .eq('id', callerId)
      .maybeSingle();

    if (profileErr) {
      // Non-fatal: the issue can still be filed with placeholder attribution.
      logErr('Profile lookup failed (continuing with placeholders):', profileErr.message);
    }

    const displayName = (profile?.display_name as string) ?? 'Unknown user';
    const role = (profile?.role as string) ?? 'unknown';
    const who = `${displayName} (${role}, ${callerId})`;
    log('Authenticated as', who);

    // Body problems are reported only now, so the log line can name the sender.
    if (!rawBody) {
      logErr('Request body was empty (content-length 0) — the client sent no payload.');
      logUnfiled('empty request body', who);
      return json({ error: 'Request body was empty — no feedback payload was sent' }, 400);
    }
    if (parseFailed) {
      logUnfiled('malformed JSON body', who);
      return json({ error: 'Invalid JSON body' }, 400);
    }
    if (!feedback) {
      logErr('Feedback field missing or blank after parsing. Raw body:', rawBody.slice(0, 1000));
      return json({ error: 'Feedback cannot be empty' }, 400);
    }
    if (feedback.length > 5000) {
      logErr('Feedback too long:', feedback.length, 'characters');
      logUnfiled('over length limit', who);
      return json({ error: 'Feedback is too long (max 5000 characters)' }, 400);
    }

    const timestamp = new Date().toISOString();
    const titleExcerpt = feedback.slice(0, 60).replace(/\n/g, ' ');
    const title = `Feedback: ${titleExcerpt}${feedback.length > 60 ? '…' : ''}`;

    const issueBody = [
      `**Submitted by:** ${displayName}`,
      `**Role:** ${role}`,
      `**Time:** ${timestamp}`,
      '',
      '---',
      '',
      feedback,
    ].join('\n');

    log('Creating issue in', GITHUB_REPO);

    const ghRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body: issueBody, labels: ['user-feedback'] }),
    });

    if (!ghRes.ok) {
      const ghErrText = await ghRes.text().catch(() => '(could not read response body)');
      logErr(
        'GitHub API rejected the issue.',
        'status=', ghRes.status,
        'repo=', GITHUB_REPO,
        'response=', ghErrText.slice(0, 2000),
      );
      // 404 on a private repo almost always means the token lacks `repo` scope
      // (classic) or was not granted Issues access to this repository
      // (fine-grained) — GitHub hides existence rather than returning 403.
      if (ghRes.status === 404) {
        logErr(
          'A 404 here usually means the token cannot see',
          GITHUB_REPO,
          '— check the token scope and that GITHUB_REPO is exactly "owner/name".',
        );
      }
      logUnfiled(`GitHub ${ghRes.status}`, who);
      return json({ error: `Failed to create feedback issue (GitHub ${ghRes.status})` }, 502);
    }

    const ghData = await ghRes.json();
    log('Created issue #' + ghData.number, 'in', GITHUB_REPO);

    return json({ ok: true, issueNumber: ghData.number });
  } catch (err) {
    logErr('Unexpected error:', err instanceof Error ? err.stack ?? err.message : err);
    logUnfiled('unexpected server error');
    return json({ error: 'An unexpected error occurred' }, 500);
  }
});
