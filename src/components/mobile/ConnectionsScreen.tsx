import React from 'react';
import { Search, UserPlus, Check, X, Users, Clock, Link2, Loader, Heart, Info } from 'lucide-react';
import type { AppSession, Connection } from '../../types/app';
import {
  searchProfiles,
  getPatientConnections,
  requestConnection,
  respondToConnection,
  removeConnection,
} from '../../services/backend';
import AvatarIcon from '../AvatarIcon';

interface ConnectionsScreenProps {
  session: AppSession;
}

type SearchResult = {
  profileId: string;
  displayName: string;
  role: 'patient' | 'caregiver';
  avatarIcon: string | null;
};

type Tab = 'caregivers' | 'friends' | 'requests';

export default function ConnectionsScreen({ session }: ConnectionsScreenProps) {
  const [tab, setTab] = React.useState<Tab>('caregivers');
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = React.useState(true);

  // Search state
  const [query, setQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [requestingId, setRequestingId] = React.useState<string | null>(null);
  const [requestMessages, setRequestMessages] = React.useState<Record<string, string>>({});

  // Action state
  const [respondingId, setRespondingId] = React.useState<string | null>(null);
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  const loadConnections = React.useCallback(async () => {
    const data = await getPatientConnections(session);
    setConnections(data);
    setIsLoadingConnections(false);
  }, [session]);

  React.useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  const activeConnections = connections.filter(
    (c) => c.status === 'active' && c.connectionType === 'caregiver',
  );
  const activeFriends = connections.filter(
    (c) => c.status === 'active' && c.connectionType === 'patient_friend',
  );
  const pendingRequests = connections.filter((c) => c.status === 'pending');

  // Deduplicate search results against existing connections
  const existingFollowerIds = new Set(connections.map((c) => c.followerId));

  const handleSearch = React.useCallback(async (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results = await searchProfiles(session, value);
    setSearchResults(
      results.filter((r) => !existingFollowerIds.has(r.profileId))
    );
    setIsSearching(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, connections]);

  // Debounce search
  React.useEffect(() => {
    const id = window.setTimeout(() => {
      if (query.trim()) void handleSearch(query);
    }, 300);
    return () => window.clearTimeout(id);
  }, [query, handleSearch]);

  const handleRequest = async (target: SearchResult) => {
    setRequestingId(target.profileId);
    const connectionType = target.role === 'caregiver' ? 'caregiver' : 'patient_friend';
    const asPatient = connectionType === 'caregiver';
    const result = await requestConnection(session, target.profileId, connectionType, asPatient);
    setRequestMessages((prev) => ({ ...prev, [target.profileId]: result.message }));
    setRequestingId(null);
    if (result.ok) {
      void loadConnections();
      setSearchResults((prev) => prev.filter((r) => r.profileId !== target.profileId));
      setTab('requests');
    }
  };

  const handleRespond = async (conn: Connection, accept: boolean) => {
    setRespondingId(conn.id);
    await respondToConnection(session, conn.id, accept);
    setRespondingId(null);
    await loadConnections();
    if (accept) {
      setTab(conn.connectionType === 'patient_friend' ? 'friends' : 'caregivers');
    }
  };

  const handleRemove = async (connectionId: string) => {
    setRemovingId(connectionId);
    await removeConnection(session, connectionId);
    setRemovingId(null);
    void loadConnections();
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] pb-24">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="sr-only">Connections</h1>

        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.25em] text-off-white/70 mb-1">Connections</p>
          <p className="text-sm text-off-white/80">Manage who can see your updates.</p>
        </div>

        {/* Search bar */}
        <div className="mb-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-off-white/60" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by display name…"
              autoCapitalize="none"
              autoCorrect="off"
              aria-label="Search by display name"
              className="w-full rounded-xl border border-periwinkle/30 bg-midnight-black/60 py-3 pl-10 pr-4 text-base text-off-white placeholder-off-white/60 outline-none transition-colors focus:border-bold-blue focus:ring-2 focus:ring-bold-blue/20"
            />
            {isSearching && (
              <Loader className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-periwinkle/60" />
            )}
          </div>

          {/* Search results */}
          {query.trim() && !isSearching && (
            <div className="mt-2 space-y-1.5">
              {searchResults.length === 0 ? (
                <p className="px-1 py-3 text-sm text-off-white/80">No users found matching &ldquo;{query}&rdquo;</p>
              ) : (
                searchResults.map((result) => (
                  <div
                    key={result.profileId}
                    className="flex items-center gap-3 rounded-xl border border-periwinkle/15 bg-midnight-black/50 px-4 py-3"
                  >
                    <AvatarIcon iconId={result.avatarIcon} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-off-white text-sm truncate">{result.displayName}</p>
                      {result.role === 'caregiver' ? (
                        <p className="text-xs text-off-white/70">Helper</p>
                      ) : (
                        <p className="text-xs text-periwinkle/80">Patient — shares status updates only</p>
                      )}
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
                        ) : result.role === 'patient' ? (
                          <Heart className="h-3 w-3" />
                        ) : (
                          <UserPlus className="h-3 w-3" />
                        )}
                        {result.role === 'patient' ? 'Add Friend' : 'Invite'}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-xl border border-white/10 bg-midnight-black/40 p-1">
          <button
            onClick={() => setTab('caregivers')}
            aria-pressed={tab === 'caregivers'}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              tab === 'caregivers'
                ? 'bg-bold-blue/20 text-white'
                : 'text-off-white/70 hover:text-off-white'
            }`}
          >
            Helpers
            {activeConnections.length > 0 && (
              <span className="ml-1.5 rounded-full bg-bold-blue/30 px-1.5 py-0.5 text-xs text-periwinkle">
                {activeConnections.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('friends')}
            aria-pressed={tab === 'friends'}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              tab === 'friends'
                ? 'bg-bold-blue/20 text-white'
                : 'text-off-white/70 hover:text-off-white'
            }`}
          >
            Friends
            {activeFriends.length > 0 && (
              <span className="ml-1.5 rounded-full bg-bold-blue/30 px-1.5 py-0.5 text-xs text-periwinkle">
                {activeFriends.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('requests')}
            aria-pressed={tab === 'requests'}
            className={`relative flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              tab === 'requests'
                ? 'bg-bold-blue/20 text-white'
                : 'text-off-white/70 hover:text-off-white'
            }`}
          >
            Requests
            {pendingRequests.length > 0 && (
              <span className="ml-1.5 rounded-full bg-bold-blue px-1.5 py-0.5 text-xs text-white">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab content */}
        {isLoadingConnections ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="h-5 w-5 animate-spin text-periwinkle/60" />
          </div>
        ) : tab === 'caregivers' ? (

          <div className="space-y-2">
            {activeConnections.length === 0 ? (
              <div className="rounded-2xl border border-dark-blue/30 bg-midnight-black/40 px-5 py-14 text-center">
                <Users className="mx-auto mb-3 h-8 w-8 text-off-white/50" />
                <p className="text-sm text-off-white/90">No helpers connected</p>
                <p className="mt-1 text-xs text-off-white/70">Search by display name above to invite a helper</p>
              </div>
            ) : (
              activeConnections.map((conn) => {
                const iAmPatient = conn.patientId === session.profileId;
                const otherName = iAmPatient ? (conn.followerDisplayName ?? 'Unknown') : (conn.patientDisplayName ?? 'Unknown');
                const otherIcon = iAmPatient ? conn.followerAvatarIcon : conn.patientAvatarIcon;
                return (
                  <div
                    key={conn.id}
                    className="flex items-center gap-3 rounded-xl border border-dark-blue/50 bg-midnight-black/50 px-4 py-3"
                  >
                    <AvatarIcon iconId={otherIcon} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-off-white text-sm truncate">{otherName}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                        <span className="text-xs text-green-400">Active helper</span>
                      </div>
                    </div>
                    <button
                      onClick={() => void handleRemove(conn.id)}
                      disabled={removingId === conn.id}
                      className="flex items-center gap-1 rounded-full border border-periwinkle/20 px-3 py-1 text-xs text-off-white/70 transition-all hover:border-red-500/40 hover:text-red-400 disabled:opacity-40"
                    >
                      {removingId === conn.id ? (
                        <Loader className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      Remove
                    </button>
                  </div>
                );
              })
            )}
          </div>

        ) : tab === 'friends' ? (
          <div className="space-y-4">
            {/* Info banner */}
            <div className="flex items-start gap-2.5 rounded-xl border border-periwinkle/20 bg-bold-blue/10 px-4 py-3">
              <Info className="h-4 w-4 text-periwinkle mt-0.5 shrink-0" />
              <p className="text-xs text-white/90 leading-relaxed">
                Friends share energy and symptom updates with each other. Needs are never shared with friends.
              </p>
            </div>

            {/* Friend list */}
            {activeFriends.length === 0 ? (
              <div className="rounded-2xl border border-dark-blue/30 bg-midnight-black/40 px-5 py-12 text-center">
                <Heart className="mx-auto mb-3 h-8 w-8 text-off-white/50" />
                <p className="text-sm text-off-white/90">No friends connected yet</p>
                <p className="mt-1 text-xs text-off-white/70">Search for other patients above to add a friend</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeFriends.map((conn) => {
                  const iAmPatient = conn.patientId === session.profileId;
                  const otherName = iAmPatient ? (conn.followerDisplayName ?? 'Unknown') : (conn.patientDisplayName ?? 'Unknown');
                  const otherIcon = iAmPatient ? conn.followerAvatarIcon : conn.patientAvatarIcon;
                  return (
                    <div
                      key={conn.id}
                      className="flex items-center gap-3 rounded-xl border border-dark-blue/50 bg-midnight-black/50 px-4 py-3"
                    >
                      <AvatarIcon iconId={otherIcon} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-off-white text-sm truncate">{otherName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                          <span className="text-xs text-green-400">Patient friend</span>
                        </div>
                      </div>
                      <button
                        onClick={() => void handleRemove(conn.id)}
                        disabled={removingId === conn.id}
                        className="flex items-center gap-1 rounded-full border border-periwinkle/20 px-3 py-1 text-xs text-off-white/70 transition-all hover:border-red-500/40 hover:text-red-400 disabled:opacity-40"
                      >
                        {removingId === conn.id ? (
                          <Loader className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        ) : (
          /* Requests tab */
          <div className="space-y-2">
            {pendingRequests.length === 0 ? (
              <div className="rounded-2xl border border-dark-blue/30 bg-midnight-black/40 px-5 py-14 text-center">
                <Clock className="mx-auto mb-3 h-8 w-8 text-off-white/50" />
                <p className="text-sm text-off-white/90">No pending requests</p>
                <p className="mt-1 text-xs text-off-white/70">Connection requests will appear here</p>
              </div>
            ) : (
              pendingRequests.map((conn) => {
                const theyRequested = conn.requestedBy !== session.profileId;
                const iAmPatient = conn.patientId === session.profileId;
                const otherName = iAmPatient
                  ? (conn.followerDisplayName ?? 'Unknown')
                  : (conn.patientDisplayName ?? 'Unknown');
                const otherIcon = iAmPatient ? conn.followerAvatarIcon : conn.patientAvatarIcon;
                return (
                  <div
                    key={conn.id}
                    className="rounded-xl border border-bold-blue/30 bg-midnight-black/50 px-4 py-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <AvatarIcon iconId={otherIcon} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-off-white text-sm truncate">{otherName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Link2 className="h-3 w-3 text-periwinkle" />
                          <p className="text-xs text-periwinkle">
                            {theyRequested
                              ? conn.connectionType === 'patient_friend'
                                ? 'Wants to share status updates with you'
                                : 'Wants to be your helper'
                              : conn.connectionType === 'patient_friend'
                                ? 'Invite sent — waiting for them to accept'
                                : 'Invite sent — waiting for them'
                            }
                          </p>
                        </div>
                        {conn.connectionType === 'patient_friend' && (
                          <p className="mt-1 text-xs text-off-white/70">Status updates only — needs are not shared</p>
                        )}
                      </div>
                    </div>
                    {theyRequested && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => void handleRespond(conn, true)}
                          disabled={respondingId === conn.id}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-bold-blue py-2 text-sm font-semibold text-white transition-all hover:bg-bold-blue/80 active:scale-95 disabled:opacity-50"
                        >
                          {respondingId === conn.id ? (
                            <Loader className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Accept
                        </button>
                        <button
                          onClick={() => void handleRespond(conn, false)}
                          disabled={respondingId === conn.id}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-periwinkle/20 py-2 text-sm font-medium text-off-white/60 transition-all hover:border-periwinkle/40 hover:text-white active:scale-95 disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                          Decline
                        </button>
                      </div>
                    )}
                    {!theyRequested && (
                      <button
                        onClick={() => void handleRemove(conn.id)}
                        disabled={removingId === conn.id}
                        className="mt-2 text-xs text-off-white/70 underline underline-offset-2 hover:text-off-white"
                      >
                        Cancel invite
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </main>
  );
}
