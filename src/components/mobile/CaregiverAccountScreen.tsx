import React from 'react';
import { Bell, Link2, LogIn, LogOut, Mail, Pencil, Check, X, Construction } from 'lucide-react';
import type { AppSession, Pairing } from '../../types/app';
import { getNotificationStatus, requestLocalNotificationPermission, scheduleLocalReminder } from '../../services/notifications';
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

export default function CaregiverAccountScreen({
  session,
  pairing,
  showHeaderChrome,
  onJoinInviteCode,
  onLeavePairing,
  onSignOut,
  onUpdateAvatarIcon,
}: CaregiverAccountScreenProps) {
  const [code, setCode] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [notificationMessage, setNotificationMessage] = React.useState('');
  const [editingIcon, setEditingIcon] = React.useState(false);
  const [draftIcon, setDraftIcon] = React.useState(session?.avatarIcon ?? 'leaf');
  const [savingIcon, setSavingIcon] = React.useState(false);

  const handleSaveIcon = async () => {
    setSavingIcon(true);
    await onUpdateAvatarIcon(draftIcon);
    setSavingIcon(false);
    setEditingIcon(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onJoinInviteCode(code);
    setMessage(result);
  };

  const handleLeavePairing = async () => {
    const result = await onLeavePairing();
    setMessage(result);
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
        <div className="mb-6 space-y-2">

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

        {/* Pairing */}
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-off-white/60">Pairing</div>
        <div className="mb-6 rounded-xl border border-periwinkle/20 bg-midnight-black/50 p-4">
          {pairing ? (
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
                  Use different code
                </button>
              </div>
            </div>
          ) : (
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
          )}
          {message && <p className="mt-3 text-sm text-off-white/70">{message}</p>}
          {notificationMessage && <p className="mt-3 text-sm text-off-white/70">{notificationMessage}</p>}
        </div>

        {/* Sign out */}
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-off-white/60">Session</div>
        <button
          onClick={() => void onSignOut()}
          className="mb-6 w-full rounded-xl border border-dark-blue/50 bg-midnight-black/50 p-4 text-left transition-colors hover:border-red-500 hover:bg-red-500/10"
        >
          <div className="flex items-center gap-3">
            <LogOut className="h-5 w-5 text-red-400" />
            <div>
              <p className="font-medium text-red-400">Sign Out</p>
              <p className="text-xs text-off-white/60">Log out of your account</p>
            </div>
          </div>
        </button>

        {/* Coming soon */}
        <div className="rounded-xl border border-dark-blue/30 bg-midnight-black/30 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Construction className="h-4 w-4 text-off-white/50" />
            <p className="text-xs font-semibold uppercase tracking-wide text-off-white/50">Planned Features</p>
          </div>
          <div className="space-y-1.5 text-sm text-off-white/50">
            <div className="flex items-center gap-2"><Bell className="h-3.5 w-3.5" /><span>Push notification preferences</span></div>
            <div className="flex items-center gap-2"><Link2 className="h-3.5 w-3.5" /><span>Connection management</span></div>
          </div>
        </div>

      </div>
    </div>
  );
}
