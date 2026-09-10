import type { EmailOtpType, RealtimeChannel } from '@supabase/supabase-js';
import { appConfig } from '../lib/appConfig';
import { getAuthRedirectUrl } from '../lib/nativeAuth';
import { supabase } from '../lib/supabaseClient';
import type {
  AppSession,
  CaregiverResponse,
  Connection,
  ConnectionType,
  CommunicationSubmission,
  StatusUpdate,
  UserRole,
} from '../types/app';
import { clearStorage, readStorage, storageKey, writeStorage } from '../utils/storage';

const STORAGE_KEYS = {
  session: 'session',
  pendingRole: 'pending-role',
  pendingAuthMode: 'pending-auth-mode',
  statusUpdates: 'status-updates',
};

const DEMO_PATIENT_ID = 'demo-patient';
const DEMO_CAREGIVER_ID = 'demo-caregiver';
const LOCAL_AUTH_EMAIL_DOMAIN = 'local.spoonfull.test';

function formatDisplayName(role: UserRole) {
  return role === 'patient' ? 'Patient' : 'Caregiver';
}

function buildConnectedSession(params: {
  profileId: string;
  role: UserRole;
  email: string | null;
  authMode: 'magic_link' | 'password';
  displayName?: string;
  avatarIcon?: string | null;
}) {
  return {
    profileId: params.profileId,
    role: params.role,
    email: params.email,
    authMode: params.authMode,
    displayName: params.displayName || params.email?.split('@')[0] || formatDisplayName(params.role),
    avatarIcon: params.avatarIcon ?? null,
  } satisfies AppSession;
}

function resolveAuthMode(
  storedSession: AppSession | null,
  pendingAuthMode: AppSession['authMode'] | null,
) {
  if (pendingAuthMode === 'password' || pendingAuthMode === 'magic_link') {
    return pendingAuthMode;
  }

  return storedSession?.authMode === 'password' ? 'password' : 'magic_link';
}

function normalizeLocalUsername(identifier: string) {
  return identifier
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '');
}

function resolvePasswordEmail(identifier: string) {
  const trimmed = identifier.trim().toLowerCase();

  if (!appConfig.enablePasswordAuth) {
    return trimmed;
  }

  if (trimmed.includes('@')) {
    return trimmed;
  }

  const username = normalizeLocalUsername(trimmed);
  if (!username) {
    return '';
  }

  return `${username}@${LOCAL_AUTH_EMAIL_DOMAIN}`;
}

function loadStatusUpdates() {
  return readStorage<StatusUpdate[]>(STORAGE_KEYS.statusUpdates, []);
}

function saveStatusUpdates(updates: StatusUpdate[]) {
  writeStorage(STORAGE_KEYS.statusUpdates, updates);
}

function broadcastStoragePulse() {
  writeStorage('sync-pulse', { at: new Date().toISOString() });
}

function addStatusUpdate(update: StatusUpdate) {
  const next = loadStatusUpdates().filter((entry) => entry.id !== update.id);
  next.unshift(update);
  saveStatusUpdates(next);
  broadcastStoragePulse();
  return update;
}

function resolveDemoProfileId(role: UserRole) {
  return role === 'patient' ? DEMO_PATIENT_ID : DEMO_CAREGIVER_ID;
}

function seedDemoState() {
  const existingStatus = loadStatusUpdates().find((entry) => entry.id === 'status-demo');
  if (!existingStatus) {
    saveStatusUpdates([
      {
        id: 'status-demo',
        patientId: DEMO_PATIENT_ID,
        caregiverId: DEMO_CAREGIVER_ID,
        helperLocation: 'away',
        selectedNeeds: ['help', 'bright'],
        energyStatus: 'low',
        selectedSymptoms: ['pain', 'sensory'],
        messageText: 'Hi, thanks for being here.\n\nLow Energy - I\'m below baseline.\n\nI need:\n• I need help\n• It is too bright\n\nCurrent Symptoms: Pain, Sensory Sensitive\n\nThank you, I appreciate you.\nSent with Spoonfull.app',
        sentAt: new Date(Date.now() - 15 * 60_000).toISOString(),
        delivery: 'sent',
      },
      ...loadStatusUpdates(),
    ]);
  }
}

async function upsertProfile(session: AppSession) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from('profiles').upsert({
    id: session.profileId,
    role: session.role,
    email: session.email,
    display_name: session.displayName,
    avatar_icon: session.avatarIcon ?? null,
  });

  if (error) {
    throw error;
  }
}

export async function restoreSession() {
  const storedSession = readStorage<AppSession | null>(STORAGE_KEYS.session, null);
  const pendingRole = readStorage<UserRole | null>(STORAGE_KEYS.pendingRole, null);
  const pendingAuthMode = readStorage<AppSession['authMode'] | null>(STORAGE_KEYS.pendingAuthMode, null);

  if (!supabase) {
    return storedSession;
  }

  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) {
      return storedSession;
    }

    const metadataRole = data.session.user.user_metadata.role as UserRole | undefined;
    const profile = await fetchProfile(data.session.user.id);
    const role = pendingRole ?? profile?.role ?? metadataRole ?? storedSession?.role ?? 'patient';
    const authMode = resolveAuthMode(storedSession, pendingAuthMode);
    const session = buildConnectedSession({
      profileId: data.session.user.id,
      role,
      email: data.session.user.email ?? null,
      authMode,
      displayName: profile?.displayName ?? storedSession?.displayName,
      avatarIcon: profile?.avatarIcon ?? storedSession?.avatarIcon ?? null,
    });

    writeStorage(STORAGE_KEYS.session, session);
    clearStorage(STORAGE_KEYS.pendingRole);
    clearStorage(STORAGE_KEYS.pendingAuthMode);

    void upsertProfile(session).catch((error) => {
      console.error('Failed to upsert profile during session restore', error);
    });

    return session;
  } catch (error) {
    console.error('Failed to restore Supabase session', error);
    return storedSession;
  }
}

export async function sendMagicLink(email: string, role?: UserRole) {
  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase is not configured. Use demo mode or add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    };
  }

  const redirectTo = getAuthRedirectUrl();
  if (role) {
    writeStorage(STORAGE_KEYS.pendingRole, role);
  }
  writeStorage(STORAGE_KEYS.pendingAuthMode, 'magic_link');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      data: role ? { role } : {},
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: 'Magic link sent. Open the link on this device to complete sign-in.' };
}

export async function signUpWithPassword(
  email: string,
  password: string,
  role: UserRole,
  displayName: string,
  avatarIcon: string | null = null,
) {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }

  const trimmedName = displayName.trim();
  if (!trimmedName) {
    return { ok: false, message: 'Enter a display name.' };
  }

  const nameAvailable = await checkDisplayNameAvailable(trimmedName);
  if (!nameAvailable) {
    return { ok: false, message: 'That display name is already taken.' };
  }

  const resolvedEmail = resolvePasswordEmail(email);
  if (!resolvedEmail) {
    return { ok: false, message: 'Enter a username or email address.' };
  }

  writeStorage(STORAGE_KEYS.pendingRole, role);
  writeStorage(STORAGE_KEYS.pendingAuthMode, 'password');
  const { data, error } = await supabase.auth.signUp({
    email: resolvedEmail,
    password,
    options: {
      data: { role },
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  if (data.session) {
    const session = buildConnectedSession({
      profileId: data.user?.id ?? data.session.user.id,
      role,
      email: data.user?.email ?? data.session.user.email ?? resolvedEmail,
      authMode: 'password',
      displayName: trimmedName,
      avatarIcon,
    });
    writeStorage(STORAGE_KEYS.session, session);
    void upsertProfile(session).catch((err) => {
      console.error('Failed to upsert profile after signup', err);
    });
    return { ok: true, message: 'Account created and signed in.', session };
  }

  return {
    ok: true,
    message:
      'Account created. If Supabase email confirmation is enabled, disable it for local testing or confirm the account before signing in.',
  };
}

async function fetchProfile(userId: string): Promise<{ role: UserRole; displayName: string; avatarIcon: string | null } | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, display_name, avatar_icon')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      role: data.role as UserRole,
      displayName: data.display_name as string,
      avatarIcon: (data.avatar_icon as string | null) ?? null,
    };
  } catch (error) {
    console.error('Failed to fetch profile', error);
    return null;
  }
}

export async function checkDisplayNameAvailable(name: string): Promise<boolean> {
  if (!supabase) {
    return true;
  }

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .ilike('display_name', name.trim())
    .maybeSingle();

  return !data;
}

export async function updateAvatarIcon(
  session: AppSession,
  iconId: string,
): Promise<{ ok: boolean; message: string; session?: AppSession }> {
  if (!supabase) {
    const updated: AppSession = { ...session, avatarIcon: iconId };
    writeStorage(STORAGE_KEYS.session, updated);
    return { ok: true, message: 'Icon updated.', session: updated };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_icon: iconId })
    .eq('id', session.profileId);

  if (error) {
    return { ok: false, message: error.message };
  }

  const updated: AppSession = { ...session, avatarIcon: iconId };
  writeStorage(STORAGE_KEYS.session, updated);
  return { ok: true, message: 'Icon updated.', session: updated };
}

export async function updateDisplayName(
  session: AppSession,
  newName: string,
): Promise<{ ok: boolean; message: string; session?: AppSession }> {
  const trimmed = newName.trim();
  if (!trimmed) {
    return { ok: false, message: 'Display name cannot be empty.' };
  }

  if (!supabase) {
    const updated: AppSession = { ...session, displayName: trimmed };
    writeStorage(STORAGE_KEYS.session, updated);
    return { ok: true, message: 'Display name updated.', session: updated };
  }

  const available = await checkDisplayNameAvailable(trimmed);
  if (!available && trimmed.toLowerCase() !== session.displayName.toLowerCase()) {
    return { ok: false, message: 'That display name is already taken.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: trimmed })
    .eq('id', session.profileId);

  if (error) {
    return { ok: false, message: error.message };
  }

  const updated: AppSession = { ...session, displayName: trimmed };
  writeStorage(STORAGE_KEYS.session, updated);
  return { ok: true, message: 'Display name updated.', session: updated };
}

export async function updateEmail(
  session: AppSession,
  newEmail: string,
): Promise<{ ok: boolean; message: string; session?: AppSession }> {
  const trimmed = newEmail.trim().toLowerCase();
  if (!trimmed) {
    return { ok: false, message: 'Enter a new email address.' };
  }

  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }

  const { error } = await supabase.auth.updateUser({ email: trimmed });
  if (error) {
    return { ok: false, message: error.message };
  }

  const updated: AppSession = { ...session, email: trimmed };
  writeStorage(STORAGE_KEYS.session, updated);
  return {
    ok: true,
    message: 'Check your new email address for a confirmation link.',
    session: updated,
  };
}

export async function updatePassword(
  newPassword: string,
): Promise<{ ok: boolean; message: string }> {
  if (!newPassword) {
    return { ok: false, message: 'Enter a new password.' };
  }

  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: 'Password updated.' };
}

export async function signInWithPassword(email: string, password: string, role?: UserRole) {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }

  const resolvedEmail = resolvePasswordEmail(email);
  if (!resolvedEmail) {
    return { ok: false, message: 'Enter a username or email address.' };
  }

  if (role) {
    writeStorage(STORAGE_KEYS.pendingRole, role);
  }
  writeStorage(STORAGE_KEYS.pendingAuthMode, 'password');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: resolvedEmail,
    password,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  const roleFromMetadata = data.user.user_metadata.role as UserRole | undefined;
  const profile = await fetchProfile(data.user.id);
  const storedSession = readStorage<AppSession | null>(STORAGE_KEYS.session, null);
  const finalRole = role ?? profile?.role ?? roleFromMetadata ?? storedSession?.role ?? 'patient';

  const session = buildConnectedSession({
    profileId: data.user.id,
    role: finalRole,
    email: data.user.email ?? resolvedEmail,
    authMode: 'password',
    displayName: profile?.displayName ?? storedSession?.displayName,
    avatarIcon: profile?.avatarIcon ?? storedSession?.avatarIcon ?? null,
  });
  writeStorage(STORAGE_KEYS.session, session);

  return { ok: true, message: 'Signed in.', session };
}

export async function continueInDemo(role: UserRole) {
  seedDemoState();
  const session: AppSession = {
    profileId: resolveDemoProfileId(role),
    role,
    email: null,
    authMode: 'demo',
    displayName: role === 'patient' ? 'Demo patient' : 'Demo caregiver',
    avatarIcon: role === 'patient' ? 'leaf' : 'heart',
  };

  writeStorage(STORAGE_KEYS.session, session);
  return session;
}

export async function signOut() {
  if (supabase) {
    await supabase.auth.signOut();
  }

  clearStorage(STORAGE_KEYS.session);
  clearStorage(STORAGE_KEYS.pendingRole);
  clearStorage(STORAGE_KEYS.pendingAuthMode);
}

export async function restoreSessionFromAuthUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: {
    role?: UserRole;
  };
}) {
  const storedSession = readStorage<AppSession | null>(STORAGE_KEYS.session, null);
  const pendingRole = readStorage<UserRole | null>(STORAGE_KEYS.pendingRole, null);
  const pendingAuthMode = readStorage<AppSession['authMode'] | null>(STORAGE_KEYS.pendingAuthMode, null);
  const profile = await fetchProfile(user.id);
  const role = pendingRole ?? profile?.role ?? user.user_metadata?.role ?? storedSession?.role ?? 'patient';
  const authMode = resolveAuthMode(storedSession, pendingAuthMode);
  const session = buildConnectedSession({
    profileId: user.id,
    role,
    email: user.email ?? null,
    authMode,
    displayName: profile?.displayName ?? storedSession?.displayName,
    avatarIcon: profile?.avatarIcon ?? storedSession?.avatarIcon ?? null,
  });

  writeStorage(STORAGE_KEYS.session, session);
  clearStorage(STORAGE_KEYS.pendingRole);
  clearStorage(STORAGE_KEYS.pendingAuthMode);

  void upsertProfile(session).catch((error) => {
    console.error('Failed to upsert profile after auth state change', error);
  });

  return session;
}

function parseAuthUrl(url: string) {
  const parsedUrl = new URL(url);
  const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ''));
  const param = (name: string) => parsedUrl.searchParams.get(name) ?? hashParams.get(name);

  return {
    accessToken: param('access_token'),
    refreshToken: param('refresh_token'),
    code: param('code'),
    tokenHash: param('token_hash'),
    type: param('type') as EmailOtpType | null,
  };
}

export async function completeAuthFromUrl(url: string) {
  if (!supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }

  const { accessToken, refreshToken, code, tokenHash, type } = parseAuthUrl(url);

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      return { ok: false, message: error.message };
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return { ok: false, message: error.message };
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      return { ok: false, message: error.message };
    }
  } else {
    return { ok: false, message: 'Auth callback did not include a session payload.' };
  }

  const session = await restoreSession();
  if (!session) {
    return { ok: false, message: 'Supabase callback succeeded but no session was restored.' };
  }

  return { ok: true, session };
}

export async function sendStatusUpdate(session: AppSession, submission: CommunicationSubmission) {
  // Only need submissions can be targeted; status updates always broadcast (null)
  const targetedFollowerIds =
    submission.type === 'need' && submission.targetedFollowerIds?.length
      ? submission.targetedFollowerIds
      : null;

  const update: StatusUpdate = {
    id: crypto.randomUUID(),
    patientId: session.profileId,
    caregiverId: null,
    helperLocation: submission.helperLocation,
    selectedNeeds: submission.selectedNeeds ?? [],
    energyStatus: submission.energyStatus ?? null,
    selectedSymptoms: submission.selectedSymptoms ?? [],
    messageText: submission.messageText ?? '',
    sentAt: new Date().toISOString(),
    delivery: 'sent',
    needPriority: submission.needPriority ?? null,
    targetedFollowerIds,
  };

  addStatusUpdate(update);

  if (supabase) {
    const { error } = await supabase.from('status_updates').insert({
      id: update.id,
      patient_id: update.patientId,
      caregiver_id: null,
      pairing_id: null,
      helper_location: update.helperLocation,
      selected_needs: update.selectedNeeds,
      energy_status: update.energyStatus,
      selected_symptoms: update.selectedSymptoms,
      message_text: update.messageText,
      sent_at: update.sentAt,
      delivery: update.delivery,
      need_priority: update.needPriority ?? null,
      targeted_follower_ids: targetedFollowerIds,
    });

    if (error) {
      console.error('Failed to insert status update', error);
    } else if (appConfig.hasOneSignal && session.authMode !== 'demo') {
      void supabase.functions
        .invoke('send-push', { body: { type: 'status_update', recordId: update.id } })
        .catch((pushError) => console.error('send-push invoke failed', pushError));
    }
  }

  return update;
}

function mapStatusRecord(data: Record<string, unknown>): StatusUpdate {
  return {
    id: data.id as string,
    patientId: data.patient_id as string,
    caregiverId: data.caregiver_id as string | null,
    helperLocation: data.helper_location as StatusUpdate['helperLocation'],
    selectedNeeds: (data.selected_needs as string[]) ?? [],
    energyStatus: (data.energy_status as string | null) ?? null,
    selectedSymptoms: (data.selected_symptoms as string[]) ?? [],
    messageText: data.message_text as string,
    sentAt: data.sent_at as string,
    delivery: data.delivery as 'sent' | 'draft',
    needPriority: (data.need_priority as StatusUpdate['needPriority']) ?? null,
    targetedFollowerIds: (data.targeted_follower_ids as string[] | null) ?? null,
    completedAt: (data.completed_at as string | null) ?? null,
    completedBy: (data.completed_by as string | null) ?? null,
  };
}

export async function getLatestStatus(session: AppSession) {
  const updates = await getRecentUpdates(session);
  return updates[0] ?? null;
}

export async function getRecentUpdates(session: AppSession, limit = 10): Promise<StatusUpdate[]> {
  const matchesSession = (update: StatusUpdate) =>
    session.role === 'patient'
      ? update.patientId === session.profileId
      : update.caregiverId === session.profileId;

  const localUpdates = loadStatusUpdates().filter(matchesSession).slice(0, limit);

  if (!supabase || session.authMode === 'demo') {
    return localUpdates;
  }

  if (session.role === 'caregiver') {
    const connectedUpdates = await getUpdatesForConnectedPatients(session, limit);
    if (connectedUpdates.length) {
      connectedUpdates.forEach(addStatusUpdate);
      return connectedUpdates;
    }
  }

  const query = supabase
    .from('status_updates')
    .select('*')
    .eq('patient_id', session.profileId)
    .order('sent_at', { ascending: false })
    .limit(limit);

  const { data, error } = await query;
  if (error || !data?.length) {
    return localUpdates;
  }

  const remoteUpdates = data.map(mapStatusRecord);
  remoteUpdates.forEach(addStatusUpdate);

  // Merge local + remote, dedup by ID, sort newest first, and respect limit.
  // This ensures updates that were just sent (and may not be visible in the
  // remote query yet due to read-after-write timing) are never lost.
  const seen = new Set<string>();
  const merged = [...remoteUpdates, ...localUpdates]
    .filter((u) => {
      if (seen.has(u.id)) return false;
      seen.add(u.id);
      return true;
    })
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
    .slice(0, limit);

  return merged;
}

export function subscribeToStatusUpdates(
  session: AppSession,
  onChange: (updates: StatusUpdate[]) => void,
) {
  const localListener = () => {
    getRecentUpdates(session).then(onChange).catch((error) => {
      console.error('Failed to refresh local status updates', error);
    });
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === storageKey('sync-pulse')) {
      localListener();
    }
  };

  window.addEventListener('storage', handleStorage);
  const pollId = window.setInterval(() => {
    localListener();
  }, 3000);

  let channel: RealtimeChannel | null = null;
  if (supabase) {
    channel = supabase
      .channel(`status-updates-${session.profileId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'status_updates',
        },
        () => {
          localListener();
        },
      )
      .subscribe();
  }

  localListener();

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.clearInterval(pollId);
    if (channel) {
      void supabase?.removeChannel(channel);
    }
  };
}

export async function loadPushPreference(profileId: string): Promise<boolean> {
  if (!supabase) return false;

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('push_enabled')
    .eq('user_id', profileId)
    .maybeSingle();

  if (error || !data) return false;
  return data.push_enabled;
}

export async function savePushPreference(profileId: string, enabled: boolean): Promise<void> {
  if (!supabase) return;

  await supabase
    .from('notification_preferences')
    .upsert(
      { user_id: profileId, push_enabled: enabled, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
}

export async function markUpdatesSeen(caregiverId: string, statusUpdateIds: string[]): Promise<void> {
  if (!supabase || !statusUpdateIds.length) return;

  const now = new Date().toISOString();
  const rows = statusUpdateIds.map((id) => ({
    status_update_id: id,
    caregiver_id: caregiverId,
    message: '',
    seen_at: now,
  }));

  await supabase
    .from('caregiver_responses')
    .upsert(rows, { onConflict: 'status_update_id,caregiver_id', ignoreDuplicates: true });
}

export async function sendCaregiverResponse(
  caregiverId: string,
  statusUpdateId: string,
  message: string,
): Promise<CaregiverResponse | null> {
  if (!supabase) return null;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('caregiver_responses')
    .upsert(
      { status_update_id: statusUpdateId, caregiver_id: caregiverId, message, seen_at: now },
      { onConflict: 'status_update_id,caregiver_id' },
    )
    .select()
    .maybeSingle();

  if (error || !data) {
    console.error('Failed to send caregiver response', error);
    return null;
  }

  if (appConfig.hasOneSignal) {
    void supabase.functions
      .invoke('send-push', { body: { type: 'caregiver_response', recordId: data.id } })
      .catch((pushError) => console.error('send-push invoke failed', pushError));
  }

  return {
    id: data.id,
    statusUpdateId: data.status_update_id,
    caregiverId: data.caregiver_id,
    message: data.message,
    seenAt: data.seen_at,
    createdAt: data.created_at,
  };
}

export async function getResponsesForUpdates(
  caregiverId: string,
  statusUpdateIds: string[],
): Promise<Record<string, CaregiverResponse>> {
  if (!supabase || !statusUpdateIds.length) return {};

  const { data, error } = await supabase
    .from('caregiver_responses')
    .select('*')
    .eq('caregiver_id', caregiverId)
    .in('status_update_id', statusUpdateIds);

  if (error || !data) return {};

  const map: Record<string, CaregiverResponse> = {};
  for (const row of data) {
    map[row.status_update_id] = {
      id: row.id,
      statusUpdateId: row.status_update_id,
      caregiverId: row.caregiver_id,
      message: row.message,
      seenAt: row.seen_at,
      createdAt: row.created_at,
    };
  }
  return map;
}

// ─── Connections ─────────────────────────────────────────────────────────────

function mapConnectionRecord(row: Record<string, unknown>, patientProfile?: Record<string, unknown> | null, followerProfile?: Record<string, unknown> | null): Connection {
  return {
    id: row.id as string,
    patientId: row.patient_id as string,
    followerId: row.follower_id as string,
    connectionType: row.connection_type as Connection['connectionType'],
    status: row.status as Connection['status'],
    requestedBy: row.requested_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    patientDisplayName: (patientProfile?.display_name as string | undefined) ?? (row.patient_display_name as string | undefined),
    patientAvatarIcon: (patientProfile?.avatar_icon as string | null | undefined) ?? (row.patient_avatar_icon as string | null | undefined),
    followerDisplayName: (followerProfile?.display_name as string | undefined) ?? (row.follower_display_name as string | undefined),
    followerAvatarIcon: (followerProfile?.avatar_icon as string | null | undefined) ?? (row.follower_avatar_icon as string | null | undefined),
  };
}

/** Request a connection. Either side can initiate. */
export async function requestConnection(
  session: AppSession,
  targetProfileId: string,
  connectionType: ConnectionType,
  asPatient: boolean,
): Promise<{ ok: boolean; message: string; connection?: Connection }> {
  if (!supabase) return { ok: false, message: 'Supabase is not configured.' };

  const patientId = asPatient ? session.profileId : targetProfileId;
  const followerId = asPatient ? targetProfileId : session.profileId;

  const { data, error } = await supabase
    .from('connections')
    .insert({
      patient_id: patientId,
      follower_id: followerId,
      connection_type: connectionType,
      status: 'pending',
      requested_by: session.profileId,
    })
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      return { ok: false, message: 'A connection with this person already exists.' };
    }
    return { ok: false, message: error.message };
  }

  if (!data) return { ok: false, message: 'Failed to create connection.' };
  return { ok: true, message: 'Connection request sent.', connection: mapConnectionRecord(data) };
}

/** Patient approves or declines a pending connection request. */
export async function respondToConnection(
  session: AppSession,
  connectionId: string,
  accept: boolean,
): Promise<{ ok: boolean; message: string; connection?: Connection }> {
  if (!supabase) return { ok: false, message: 'Supabase is not configured.' };

  const newStatus = accept ? 'active' : 'declined';
  const { data, error } = await supabase
    .from('connections')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', connectionId)
    .or(`patient_id.eq.${session.profileId},follower_id.eq.${session.profileId}`)
    .select()
    .maybeSingle();

  if (error) return { ok: false, message: error.message };
  if (!data) return { ok: false, message: 'Connection not found or not authorised.' };
  return {
    ok: true,
    message: accept ? 'Connection accepted.' : 'Connection declined.',
    connection: mapConnectionRecord(data),
  };
}

/** Remove an active connection (either side can disconnect). */
export async function removeConnection(
  session: AppSession,
  connectionId: string,
): Promise<{ ok: boolean; message: string }> {
  if (!supabase) return { ok: false, message: 'Supabase is not configured.' };

  const { error } = await supabase
    .from('connections')
    .delete()
    .eq('id', connectionId)
    .or(`patient_id.eq.${session.profileId},follower_id.eq.${session.profileId}`);

  if (error) return { ok: false, message: error.message };
  return { ok: true, message: 'Connection removed.' };
}

/** Returns only the active caregiver-type helpers following this patient. */
export async function getActiveHelpers(session: AppSession): Promise<Connection[]> {
  const all = await getPatientConnections(session);
  return all.filter((c) => c.status === 'active' && c.connectionType === 'caregiver');
}

/** Get all connections for a patient: rows where they are the patient (helpers following them)
 *  plus rows where they are the follower (patient_friend connections they initiated). */
export async function getPatientConnections(session: AppSession): Promise<Connection[]> {
  if (!supabase || session.authMode === 'demo') return [];

  const [asPatientRes, asFollowerRes] = await Promise.all([
    supabase
      .from('connections')
      .select('*, follower:profiles!connections_follower_id_fkey(display_name, avatar_icon)')
      .eq('patient_id', session.profileId)
      .order('created_at', { ascending: false }),
    supabase
      .from('connections')
      .select('*, patient:profiles!connections_patient_id_fkey(display_name, avatar_icon)')
      .eq('follower_id', session.profileId)
      .eq('connection_type', 'patient_friend')
      .order('created_at', { ascending: false }),
  ]);

  const asPatient: Connection[] = (asPatientRes.data ?? []).map((row) => {
    const follower = row.follower as Record<string, unknown> | null;
    return {
      id: row.id,
      patientId: row.patient_id,
      followerId: row.follower_id,
      connectionType: row.connection_type as Connection['connectionType'],
      status: row.status as Connection['status'],
      requestedBy: row.requested_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      followerDisplayName: follower?.display_name as string | undefined,
      followerAvatarIcon: follower?.avatar_icon as string | null | undefined,
    };
  });

  const asFollower: Connection[] = (asFollowerRes.data ?? []).map((row) => {
    const patient = row.patient as Record<string, unknown> | null;
    return {
      id: row.id,
      patientId: row.patient_id,
      followerId: row.follower_id,
      connectionType: row.connection_type as Connection['connectionType'],
      status: row.status as Connection['status'],
      requestedBy: row.requested_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      patientDisplayName: patient?.display_name as string | undefined,
      patientAvatarIcon: patient?.avatar_icon as string | null | undefined,
    };
  });

  // Deduplicate by id in case of overlap
  const seen = new Set<string>();
  return [...asPatient, ...asFollower].filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

/** Get all active patients for a caregiver or patient-friend follower. */
export async function getFollowerConnections(session: AppSession): Promise<Connection[]> {
  if (!supabase || session.authMode === 'demo') return [];

  const { data, error } = await supabase
    .from('connections')
    .select(`
      *,
      patient:profiles!connections_patient_id_fkey(display_name, avatar_icon)
    `)
    .eq('follower_id', session.profileId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const patient = row.patient as Record<string, unknown> | null;
    return {
      id: row.id,
      patientId: row.patient_id,
      followerId: row.follower_id,
      connectionType: row.connection_type as Connection['connectionType'],
      status: row.status as Connection['status'],
      requestedBy: row.requested_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      patientDisplayName: patient?.display_name as string | undefined,
      patientAvatarIcon: patient?.avatar_icon as string | null | undefined,
    };
  });
}

/** Search profiles by display name (case-insensitive prefix match). Returns up to 10 results. */
export async function searchProfiles(
  session: AppSession,
  query: string,
): Promise<Array<{ profileId: string; displayName: string; role: UserRole; avatarIcon: string | null }>> {
  if (!supabase || !query.trim()) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, role, avatar_icon')
    .ilike('display_name', `%${query.trim()}%`)
    .neq('id', session.profileId)
    .limit(10);

  if (error || !data) return [];

  return data.map((row) => ({
    profileId: row.id as string,
    displayName: row.display_name as string,
    role: row.role as UserRole,
    avatarIcon: row.avatar_icon as string | null,
  }));
}

/** Get recent status updates for all of a caregiver's active patients (via connections). */
export async function getUpdatesForConnectedPatients(
  session: AppSession,
  limit = 20,
): Promise<StatusUpdate[]> {
  if (!supabase || session.authMode === 'demo') {
    return getRecentUpdates(session, null, limit);
  }

  const connections = await getFollowerConnections(session);
  const activePatientIds = connections
    .filter((c) => c.status === 'active')
    .map((c) => c.patientId);

  if (!activePatientIds.length) return [];

  const { data, error } = await supabase
    .from('status_updates')
    .select('*')
    .in('patient_id', activePatientIds)
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(mapStatusRecord);
}

/** Get recent status updates from mutual patient friends.
 *  Collects patient IDs from both sides of active patient_friend connections
 *  then fetches their latest status updates, enriched with display name + avatar. */
export async function getFriendStatusUpdates(
  session: AppSession,
  limit = 20,
): Promise<StatusUpdate[]> {
  if (!supabase || session.authMode === 'demo') return [];

  // Fetch both sides: connections where current user is the patient, and where they are the follower
  const [asPatientRes, asFollowerRes] = await Promise.all([
    supabase
      .from('connections')
      .select('follower_id, follower:profiles!connections_follower_id_fkey(display_name, avatar_icon)')
      .eq('patient_id', session.profileId)
      .eq('connection_type', 'patient_friend')
      .eq('status', 'active'),
    supabase
      .from('connections')
      .select('patient_id, patient:profiles!connections_patient_id_fkey(display_name, avatar_icon)')
      .eq('follower_id', session.profileId)
      .eq('connection_type', 'patient_friend')
      .eq('status', 'active'),
  ]);

  // Build a map of friendId -> { displayName, avatarIcon }
  const friendMap = new Map<string, { displayName: string; avatarIcon: string | null }>();

  for (const row of asPatientRes.data ?? []) {
    const profile = row.follower as Record<string, unknown> | null;
    friendMap.set(row.follower_id, {
      displayName: (profile?.display_name as string) ?? 'Unknown',
      avatarIcon: (profile?.avatar_icon as string | null) ?? null,
    });
  }
  for (const row of asFollowerRes.data ?? []) {
    const profile = row.patient as Record<string, unknown> | null;
    friendMap.set(row.patient_id, {
      displayName: (profile?.display_name as string) ?? 'Unknown',
      avatarIcon: (profile?.avatar_icon as string | null) ?? null,
    });
  }

  if (friendMap.size === 0) return [];

  const { data, error } = await supabase
    .from('status_updates')
    .select('*')
    .in('patient_id', [...friendMap.keys()])
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  // Keep only the most recent status update (has energy_status) per friend.
  // Needs-only updates are excluded so they never hide a friend's energy status.
  const latestStatus = new Map<string, typeof data[0]>();
  for (const row of data) {
    const pid = row.patient_id as string;
    if (row.energy_status && !latestStatus.has(pid)) {
      latestStatus.set(pid, row);
    }
  }

  const deduped = [...latestStatus.values()];

  return deduped.map((row) => {
    const base = mapStatusRecord(row);
    const friend = friendMap.get(base.patientId);
    return {
      ...base,
      patientDisplayName: friend?.displayName,
      patientAvatarIcon: friend?.avatarIcon ?? null,
    };
  });
}

// ─── Archive ─────────────────────────────────────────────────────────────────

const ARCHIVE_MAX = 20;

interface ArchiveConfig {
  table: string;
  idColumn: string;
}

const CAREGIVER_ARCHIVE: ArchiveConfig = { table: 'caregiver_archived_updates', idColumn: 'caregiver_id' };
const PATIENT_ARCHIVE: ArchiveConfig = { table: 'patient_archived_updates', idColumn: 'patient_id' };

async function archiveUpdateGeneric(config: ArchiveConfig, profileId: string, statusUpdateId: string): Promise<void> {
  if (!supabase) return;

  await supabase
    .from(config.table)
    .upsert(
      { [config.idColumn]: profileId, status_update_id: statusUpdateId },
      { onConflict: `${config.idColumn},status_update_id` },
    );

  const { data } = await supabase
    .from(config.table)
    .select('id, archived_at')
    .eq(config.idColumn, profileId)
    .order('archived_at', { ascending: false });

  if (data && data.length > ARCHIVE_MAX) {
    const toDelete = data.slice(ARCHIVE_MAX).map((r) => r.id);
    await supabase.from(config.table).delete().in('id', toDelete);
  }
}

async function unarchiveUpdateGeneric(config: ArchiveConfig, profileId: string, statusUpdateId: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from(config.table)
    .delete()
    .eq(config.idColumn, profileId)
    .eq('status_update_id', statusUpdateId);
}

async function getArchivedIdsGeneric(config: ArchiveConfig, profileId: string): Promise<Set<string>> {
  if (!supabase) return new Set();
  const { data } = await supabase
    .from(config.table)
    .select('status_update_id')
    .eq(config.idColumn, profileId)
    .order('archived_at', { ascending: false })
    .limit(ARCHIVE_MAX);

  return new Set((data ?? []).map((r) => r.status_update_id as string));
}

async function getArchivedUpdatesGeneric(config: ArchiveConfig, session: AppSession): Promise<StatusUpdate[]> {
  if (!supabase || session.authMode === 'demo') return [];

  const { data, error } = await supabase
    .from(config.table)
    .select(`archived_at, status_updates (*)`)
    .eq(config.idColumn, session.profileId)
    .order('archived_at', { ascending: false })
    .limit(ARCHIVE_MAX);

  if (error || !data) return [];

  return data
    .map((row) => {
      const u = row.status_updates as Record<string, unknown> | null;
      if (!u) return null;
      return mapStatusRecord(u);
    })
    .filter(Boolean) as StatusUpdate[];
}

export async function archiveUpdate(caregiverId: string, statusUpdateId: string): Promise<void> {
  return archiveUpdateGeneric(CAREGIVER_ARCHIVE, caregiverId, statusUpdateId);
}

export async function unarchiveUpdate(caregiverId: string, statusUpdateId: string): Promise<void> {
  return unarchiveUpdateGeneric(CAREGIVER_ARCHIVE, caregiverId, statusUpdateId);
}

export async function getArchivedUpdateIds(caregiverId: string): Promise<Set<string>> {
  return getArchivedIdsGeneric(CAREGIVER_ARCHIVE, caregiverId);
}

export async function getArchivedUpdates(session: AppSession): Promise<StatusUpdate[]> {
  return getArchivedUpdatesGeneric(CAREGIVER_ARCHIVE, session);
}

export async function archivePatientUpdate(patientId: string, statusUpdateId: string): Promise<void> {
  return archiveUpdateGeneric(PATIENT_ARCHIVE, patientId, statusUpdateId);
}

export async function unarchivePatientUpdate(patientId: string, statusUpdateId: string): Promise<void> {
  return unarchiveUpdateGeneric(PATIENT_ARCHIVE, patientId, statusUpdateId);
}

export async function getPatientArchivedUpdateIds(patientId: string): Promise<Set<string>> {
  return getArchivedIdsGeneric(PATIENT_ARCHIVE, patientId);
}

export async function getPatientArchivedUpdates(session: AppSession): Promise<StatusUpdate[]> {
  return getArchivedUpdatesGeneric(PATIENT_ARCHIVE, session);
}

// ─── Resolve ──────────────────────────────────────────────────────────────────

export async function markUpdateResolved(
  updateId: string,
  resolvedByProfileId: string,
  patientId: string,
): Promise<void> {
  if (!supabase) return;

  await supabase
    .from('status_updates')
    .update({ completed_at: new Date().toISOString(), completed_by: resolvedByProfileId })
    .eq('id', updateId);

  await Promise.all([
    archiveUpdate(resolvedByProfileId, updateId),
    archivePatientUpdate(patientId, updateId),
  ]);
}

export async function unmarkUpdateResolved(updateId: string): Promise<void> {
  if (!supabase) return;

  await supabase
    .from('status_updates')
    .update({ completed_at: null, completed_by: null })
    .eq('id', updateId);
}

// ─── End Archive ──────────────────────────────────────────────────────────────

// ─── End Connections ──────────────────────────────────────────────────────────

async function fetchResponsesForUpdates(
  statusUpdateIds: string[],
): Promise<Record<string, CaregiverResponse[]>> {
  if (!supabase || !statusUpdateIds.length) return {};

  const { data, error } = await supabase
    .from('caregiver_responses')
    .select('*, caregiver:profiles!caregiver_responses_caregiver_id_fkey(display_name)')
    .in('status_update_id', statusUpdateIds)
    .order('created_at', { ascending: true });

  if (error || !data) return {};

  const map: Record<string, CaregiverResponse[]> = {};
  for (const row of data) {
    const caregiver = row.caregiver as Record<string, unknown> | null;
    const response: CaregiverResponse = {
      id: row.id,
      statusUpdateId: row.status_update_id,
      caregiverId: row.caregiver_id,
      caregiverDisplayName: (caregiver?.display_name as string) ?? undefined,
      message: row.message,
      seenAt: row.seen_at,
      createdAt: row.created_at,
    };
    if (!map[row.status_update_id]) map[row.status_update_id] = [];
    map[row.status_update_id].push(response);
  }
  return map;
}

export async function getResponsesForPatient(
  statusUpdateIds: string[],
): Promise<Record<string, CaregiverResponse[]>> {
  return fetchResponsesForUpdates(statusUpdateIds);
}

export async function getAllResponsesForUpdates(
  statusUpdateIds: string[],
): Promise<Record<string, CaregiverResponse[]>> {
  return fetchResponsesForUpdates(statusUpdateIds);
}

/**
 * supabase-js wraps any non-2xx from an Edge Function in a FunctionsHttpError
 * whose `message` is always the generic "Edge Function returned a non-2xx
 * status code". The useful payload — our function's own `{ error }` JSON — is
 * on `error.context`, which is the raw Response. Pull it out so the caller sees
 * the real reason instead of a string that is identical for every failure mode.
 */
async function describeFunctionError(error: unknown, fallback: string): Promise<string> {
  const context = (error as { context?: unknown })?.context;

  if (typeof Response !== 'undefined' && context instanceof Response) {
    const { status } = context;
    let body = '';
    try {
      body = await context.text();
    } catch {
      // Body already consumed or unreadable — fall through to the status-only message.
    }

    if (body) {
      let parsed: { error?: string } | null = null;
      try {
        parsed = JSON.parse(body);
      } catch {
        // Not JSON (e.g. a gateway error page) — surface a trimmed excerpt.
        return `${body.slice(0, 200)} (HTTP ${status})`;
      }
      if (parsed?.error) return `${parsed.error} (HTTP ${status})`;
    }

    return `${fallback} (HTTP ${status})`;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function submitFeedback(feedback: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) {
    return { ok: false, error: 'Requires a connected account to submit feedback.' };
  }

  try {
    // NOTE: do not set a Content-Type header here. supabase-js only serializes
    // `body` when the caller has NOT supplied one (see functions-js
    // FunctionsClient: the whole serialization branch is gated on
    // `!hasOwnProperty(headers, 'Content-Type')`). Passing it explicitly meant
    // the request went out with no body at all, and the function rejected it
    // with 400 "Invalid JSON body". It sets application/json for us.
    const { data, error } = await supabase.functions.invoke('submit-feedback', {
      body: { feedback },
    });

    if (error) {
      const message = await describeFunctionError(error, 'Failed to submit feedback');
      console.error('[submitFeedback] Edge function call failed:', message, error);
      return { ok: false, error: message };
    }

    if (data?.error) {
      console.error('[submitFeedback] Function reported an error:', data.error);
      return { ok: false, error: data.error };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to submit feedback';
    console.error('[submitFeedback] Unexpected client error:', err);
    return { ok: false, error: message };
  }
}

export async function deleteAccount(session: AppSession): Promise<{ ok: boolean; error?: string }> {
  if (session.authMode === 'demo' || !supabase) {
    clearStorage(STORAGE_KEYS.session);
    clearStorage(STORAGE_KEYS.pendingRole);
    clearStorage(STORAGE_KEYS.pendingAuthMode);
    clearStorage(STORAGE_KEYS.statusUpdates);
    return { ok: true };
  }

  try {
    const { error } = await supabase.functions.invoke('delete-account', {
      headers: { 'Content-Type': 'application/json' },
    });

    if (error) {
      return { ok: false, error: error.message ?? 'Failed to delete account' };
    }

    await supabase.auth.signOut();
    clearStorage(STORAGE_KEYS.session);
    clearStorage(STORAGE_KEYS.pendingRole);
    clearStorage(STORAGE_KEYS.pendingAuthMode);
    clearStorage(STORAGE_KEYS.statusUpdates);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete account';
    return { ok: false, error: message };
  }
}
