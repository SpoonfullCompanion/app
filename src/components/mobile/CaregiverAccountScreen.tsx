import React from 'react';
import { Bell, Link2, LogIn, LogOut, Mail, Pencil, Check, X, Search, UserPlus, Loader, Users } from 'lucide-react';
import type { AppSession, Connection, Pairing } from '../../types/app';
import { getNotificationStatus, requestLocalNotificationPermission, scheduleLocalReminder } from '../../services/notifications';
import {
  getFollowerConnections,
  removeConnection,
  requestConnection,
  searchProfiles,
} from '../../services/backend';
import AvatarIcon from '../AvatarIcon';
import AvatarIconPicker from '../AvatarIconPicker';

interface CaregiverAccountScreenProps {
  session: AppSession | null;
  pairing: Pairing | null;
  showHeaderChrome: boolean;
  onJoinInviteCode: (code: string) => Promise<string>;
  onLeavePairing: () => Promise<string>;
  onSignOut: () => Promise<void>;
  onUpdateAvatarIcon: (iconId: string) => Promise<{ ok: boolean; message: string }>;
}

type SearchResult = {
  profileId: string;
  displayName: string;
  role: 'patient' | 'caregiver';
  avatarIcon: string | null;
};

export default function CaregiverAccountScreen({
  session,
  pairing,
  showHeaderChrome,
  onJoinInviteCode,
  onLeavePairing,
  onSignOut,
  onUpdateAvatarIcon,
}: CaregiverAccountScreenProps) {
  // Legacy pairing
  const [code, setCode] = React.useState('');
  const [pairingMessage, setPairingMessage] = React.useState('');
  const [notificationMessage, setNotificationMessage] = React.useState('');

  // Avatar
  const [editingIcon, setEditingIcon] = React.useState(false);
  const [draftIcon, setDraftIcon] = React.useState(session?.avatarIcon ?? 'leaf');
  const [savingIcon, setSavingIcon] = React.useState(false);

  // Connections
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [loadingConnections, setLoadingConnections] = React.useState(true);
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  // Search for patient
  const [query, setQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [requestingId, setRequestingId] = React.useState<string | null>(null);
  const [requestMessages, setRequestMessages] = React.useState<Record<string, string>>({});

  const loadConnections = React.useCallback(async () => {
    if (!session) return;
    const data = await getFollowerConnections(session);
    setConnections(data);
    setLoadingConnections(false);
  }, [session]);

  React.useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  const existingPatientIds = new Set(connections.map((c) => c.patientId));

  const handleSearch = React.useCallback(async (value: string) => {
    if (!session || !value.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    const results = await searchProfiles(session, value);
    // Show only patients not already connected
    setSearchResults(results.filter((r) => r.role === 'patient' && !existingPatientIds.has(r.profileId)));
    setIsSearching(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, connections]);

  React.useEffect(() => {
    const id = window.setTimeout(() => {
      if (query.trim()) void handleSearch(query);
      else setSearchResults([]);
    }, 300);
    return () => window.clearTimeout(id);
  }, [query, handleSearch]);

  const handleRequest = async (target: SearchResult) => {
    if (!session) return;
    setRequestingId(target.profileId);
    // Caregiver requests to follow patient: patient = target, follower = session
    const result = await requestConnection(session, target.profileId, 'caregiver', false);
    setRequestMessages((prev) => ({ ...prev, [target.profileId]: result.message }));
    setRequestingId(null);
    if (result.ok) {
      void loadConnections();
      setSearchResults((prev) => prev.filter((r) => r.profileId !== target.profileId));
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    if (!session) return;
    setRemovingId(connectionId);
    await removeConnection(session, connectionId);
    setRemovingId(null);
    void loadConnections();
  };

  const handleSaveIcon = async () => {
    setSavingIcon(true);
    await onUpdateAvatarIcon(draftIcon);
    setSavingIcon(false);
    setEditingIcon(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onJoinInviteCode(code);
    setPairingMessage(result);
  };

  const handleLeavePairing = async () => {
    const result = await onLeavePairing();
    setPairingMessage(result);
    setNotificationMessage('');
    setCode('');
  };

  const handleEnableReminders = async () => {
    const status = await getNotificationStatus();
    if (!status.localNotificationsAvailable) {
      setNotificationMessage('Local reminders are available once the app is running in a native Capacitor build.');
      return;
    }
    const granted = await requestLocalNotificationPermission();
    if (!granted) {
      setNotificationMessage('Notification permission was not granted.');
      return;
    }
    await scheduleLocalReminder();
    setNotificationMessage(
      status.pushConfigured
        ? 'Local reminder scheduled.'
        : 'Local reminder scheduled. Remote push is disabled until OneSignal is configured.',
    );
  };

  const activeConnections = connections.filter((c) => c.status === 'active');
  const pendingConnections = connections.filter((c) => c.status === 'pending');

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] pb-24">
      <div className="mx-auto max-w-2xl px-4 py-8">

        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.25em] text-off-white/60">Account</p>
            <p className="text-base font-semibold text-white">Helper Settings</p>
          </div>
          {showHeaderChrome && (
            <button
              onClick={() => void onSignOut()}
              className="rounded-full border border-dark-blue bg-midnight-black/90 p-3 text-off-white shadow-lg transition-colors hover:border-bold-blue hover:text-bold-blue"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Profile */}
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-off-white/60">Profile</div>
        <div className="mb-8 space-y-2">

          {/* Avatar icon */}
          <div className="rounded-xl border border-dark-blue/50 bg-midnight-black/50 p-4">
            {editingIcon ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-off-white/50">Choose your icon</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSaveIcon()}
                      disabled={savingIcon}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bold-blue text-white transition-all hover:bg-bold-blue/80 disabled:opacity-40"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingIcon(false)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-periwinkle/20 text-off-white/60 transition-all hover:border-periwinkle/50 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <AvatarIconPicker selected={draftIcon} onChange={setDraftIcon} />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <AvatarIcon iconId={session?.avatarIcon} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-off-white/50 mb-0.5">Icon</p>
                  <p className="font-medium text-off-white text-sm">Your profile icon</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setDraftIcon(session?.avatarIcon ?? 'leaf'); setEditingIcon(true); }}
                  className="ml-3 flex shrink-0 items-center gap-1.5 rounded-full border border-periwinkle/20 px-3 py-1 text-xs text-periwinkle transition-all hover:border-periwinkle/50 hover:text-white"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-dark-blue/50 bg-midnight-black/50 p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-off-white/60" />
              <div>
                <p className="text-xs text-off-white/60">Email</p>
                <p className="font-medium text-off-white">{session?.email || 'Not available'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Find a patient */}
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-off-white/60">Find a patient</div>
        <div className="mb-8 rounded-xl border border-periwinkle/20 bg-midnight-black/50 p-4">
          <p className="mb-3 text-sm text-off-white/60">
            Search by display name to send a connection request. The patient approves it on their end.
          </p>
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-off-white/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Patient display name…"
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full rounded-xl border border-periwinkle/30 bg-midnight-black/60 py-3 pl-10 pr-4 text-sm text-off-white placeholder-off-white/30 outline-none transition-colors focus:border-bold-blue focus:ring-2 focus:ring-bold-blue/20"
            />
            {isSearching && (
              <Loader className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-periwinkle/60" />
            )}
          </div>

          {query.trim() && !isSearching && (
            <div className="space-y-1.5">
              {searchResults.length === 0 ? (
                <p className="py-2 text-sm text-off-white/40">No patients found matching &ldquo;{query}&rdquo;</p>
              ) : (
                searchResults.map((result) => (
                  <div
                    key={result.profileId}
                    className="flex items-center gap-3 rounded-xl border border-periwinkle/15 bg-midnight-black/50 px-4 py-3"
                  >
                    <AvatarIcon iconId={result.avatarIcon} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-off-white text-sm truncate">{result.displayName}</p>
                      <p className="text-xs text-off-white/40">Patient</p>
                    </div>
                    {requestMessages[result.profileId] ? (
                      <span className="text-xs text-periwinkle">{requestMessages[result.profileId]}</span>
                    ) : (
                      <button
                        onClick={() => void handleRequest(result)}
                        disabled={requestingId === result.profileId}
                        className="flex items-center gap-1.5 rounded-full bg-bold-blue px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-bold-blue/80 active:scale-95 disabled:opacity-50"
                      >
                        {requestingId === result.profileId ? (
                          <Loader className="h-3 w-3 animate-spin" />
                        ) : (
                          <UserPlus className="h-3 w-3" />
                        )}
                        Request
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* My patients */}
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-off-white/60">
          My patients
          {activeConnections.length > 0 && (
            <span className="ml-2 rounded-full bg-bold-blue/20 px-1.5 py-0.5 text-[10px] text-periwinkle">
              {activeConnections.length}
            </span>
          )}
          {pendingConnections.length > 0 && (
            <span className="ml-1.5 rounded-full bg-amber-900/50 px-1.5 py-0.5 text-[10px] text-amber-300">
              {pendingConnections.length} pending
            </span>
          )}
        </div>
        <div className="mb-8 space-y-2">
          {loadingConnections ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-5 w-5 animate-spin text-periwinkle/60" />
            </div>
          ) : connections.length === 0 ? (
            <div className="rounded-2xl border border-dark-blue/30 bg-midnight-black/40 px-5 py-10 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-off-white/20" />
              <p className="text-sm text-off-white/40">No patients yet</p>
              <p className="mt-1 text-xs text-off-white/25">Send a connection request above</p>
            </div>
          ) : (
            connections.map((conn) => (
              <div
                key={conn.id}
                className={`flex items-center gap-3 rounded-xl border bg-midnight-black/50 px-4 py-3 ${
                  conn.status === 'active' ? 'border-dark-blue/50' : 'border-amber-700/30'
                }`}
              >
                <AvatarIcon iconId={conn.patientAvatarIcon} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-off-white text-sm truncate">
                    {conn.patientDisplayName ?? 'Unknown'}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {conn.status === 'active' ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                        <span className="text-xs text-green-400">Active</span>
                      </>
                    ) : (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        <span className="text-xs text-amber-400">Waiting for approval</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => void handleRemoveConnection(conn.id)}
                  disabled={removingId === conn.id}
                  className="flex items-center gap-1 rounded-full border border-periwinkle/20 px-3 py-1 text-xs text-off-white/50 transition-all hover:border-red-500/40 hover:text-red-400 disabled:opacity-40"
                >
                  {removingId === conn.id ? <Loader className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                  {conn.status === 'pending' ? 'Cancel' : 'Remove'}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Legacy pairing — kept for existing paired users */}
        {pairing && (
          <>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-off-white/60">Legacy pairing</div>
            <div className="mb-8 rounded-xl border border-periwinkle/20 bg-midnight-black/50 p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-xs text-off-white/50">Invite code</p>
                    <p className="text-2xl font-bold tracking-[0.25em] text-white">{pairing.code}</p>
                  </div>
                  <div className="rounded-lg border border-green-700/40 bg-green-800/30 px-3 py-1.5">
                    <p className="text-xs font-medium text-green-400">Paired</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={() => void handleEnableReminders()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-periwinkle/30 bg-midnight-black/60 px-4 py-3 text-sm font-medium text-off-white transition-colors hover:border-periwinkle/50"
                  >
                    <Bell className="h-4 w-4" />
                    Enable reminders
                  </button>
                  <button
                    onClick={() => void handleLeavePairing()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-periwinkle/30 bg-midnight-black/60 px-4 py-3 text-sm font-medium text-off-white transition-colors hover:border-periwinkle/50"
                  >
                    <Link2 className="h-4 w-4" />
                    Disconnect
                  </button>
                </div>
              </div>
              {pairingMessage && <p className="mt-3 text-sm text-off-white/70">{pairingMessage}</p>}
              {notificationMessage && <p className="mt-3 text-sm text-off-white/70">{notificationMessage}</p>}
            </div>
          </>
        )}

        {/* Enter code — only show if no pairing */}
        {!pairing && (
          <>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-off-white/60">Legacy invite code</div>
            <div className="mb-8 rounded-xl border border-periwinkle/20 bg-midnight-black/50 p-4">
              <p className="mb-3 text-sm text-off-white/50">Already have an invite code? Enter it here.</p>
              <form onSubmit={(e) => void handleJoin(e)} className="space-y-3">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter invite code"
                  className="w-full rounded-lg border border-periwinkle/30 bg-midnight-black/60 px-4 py-3 text-center text-xl tracking-[0.3em] text-white placeholder-off-white/30 outline-none transition-colors focus:border-bold-blue focus:ring-2 focus:ring-bold-blue/20"
                />
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-bold-blue px-6 py-4 font-semibold text-white shadow-xl shadow-bold-blue/30 transition-all hover:bg-bold-blue/90"
                >
                  <LogIn className="h-5 w-5" />
                  Join patient
                </button>
              </form>
              {pairingMessage && <p className="mt-3 text-sm text-off-white/70">{pairingMessage}</p>}
            </div>
          </>
        )}

        {/* Sign out */}
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-off-white/60">Session</div>
        <button
          onClick={() => void onSignOut()}
          className="w-full rounded-xl border border-dark-blue/50 bg-midnight-black/50 p-4 text-left transition-colors hover:border-red-500 hover:bg-red-500/10"
        >
          <div className="flex items-center gap-3">
            <LogOut className="h-5 w-5 text-red-400" />
            <div>
              <p className="font-medium text-red-400">Sign Out</p>
              <p className="text-xs text-off-white/60">Log out of your account</p>
            </div>
          </div>
        </button>

      </div>
    </div>
  );
}
