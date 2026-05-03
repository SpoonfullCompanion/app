import React from 'react';
import { User, Mail, Link2, LogOut, Pencil, Check, X } from 'lucide-react';
import type { AppSession } from '../../types/app';
import { checkDisplayNameAvailable } from '../../services/backend';

interface AccountScreenProps {
  session: AppSession | null;
  onSignOut: () => Promise<void>;
  onOpenPairing: () => void;
  onUpdateDisplayName: (newName: string) => Promise<{ ok: boolean; message: string }>;
}

export default function AccountScreen({
  session,
  onSignOut,
  onOpenPairing,
  onUpdateDisplayName,
}: AccountScreenProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [draftName, setDraftName] = React.useState('');
  const [nameError, setNameError] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  const startEditing = () => {
    setDraftName(session?.displayName ?? '');
    setNameError('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setDraftName('');
    setNameError('');
  };

  const handleNameBlur = async () => {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed.toLowerCase() === session?.displayName?.toLowerCase()) {
      setNameError('');
      return;
    }
    const available = await checkDisplayNameAvailable(trimmed);
    setNameError(available ? '' : 'That display name is already taken.');
  };

  const handleSave = async () => {
    const trimmed = draftName.trim();
    if (!trimmed) {
      setNameError('Display name cannot be empty.');
      return;
    }
    if (nameError) return;

    setIsSaving(true);
    const result = await onUpdateDisplayName(trimmed);
    setIsSaving(false);

    if (result.ok) {
      setIsEditing(false);
      setDraftName('');
      setNameError('');
    } else {
      setNameError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] pb-24">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-off-white/60 mb-1">
            Account
          </p>
          <p className="text-sm text-off-white/60">
            Manage your profile and settings.
          </p>
        </div>

        <div className="mb-3 text-xs uppercase tracking-[0.2em] font-semibold text-off-white/50">Profile</div>
        <div className="space-y-2 mb-8">

          {/* Display name row */}
          <div className="rounded-xl border border-dark-blue/50 bg-midnight-black/50 p-4">
            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-5 w-5 shrink-0 text-off-white/60" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-off-white/50 mb-1">Display name</p>

                {isEditing ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={draftName}
                        onChange={(e) => { setDraftName(e.target.value); setNameError(''); }}
                        onBlur={() => void handleNameBlur()}
                        autoFocus
                        autoCapitalize="words"
                        autoCorrect="off"
                        className="flex-1 min-w-0 rounded-lg border border-periwinkle/30 bg-midnight-black/60 px-3 py-2 text-sm text-off-white placeholder-off-white/30 outline-none focus:border-bold-blue focus:ring-2 focus:ring-bold-blue/30"
                      />
                      <button
                        onClick={() => void handleSave()}
                        disabled={isSaving || !!nameError || !draftName.trim()}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bold-blue text-white transition-all hover:bg-bold-blue/80 disabled:opacity-40"
                        aria-label="Save display name"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-periwinkle/20 text-off-white/60 transition-all hover:border-periwinkle/50 hover:text-white"
                        aria-label="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {nameError && (
                      <p className="mt-1.5 text-xs text-red-400">{nameError}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-off-white truncate">
                      {session?.displayName || 'Not set'}
                    </p>
                    <button
                      onClick={startEditing}
                      className="ml-3 flex shrink-0 items-center gap-1.5 rounded-full border border-periwinkle/20 px-3 py-1 text-xs text-periwinkle transition-all hover:border-periwinkle/50 hover:text-white"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Email row */}
          <div className="rounded-xl border border-dark-blue/50 bg-midnight-black/50 p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 shrink-0 text-off-white/60" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-off-white/50 mb-1">Email</p>
                <p className="font-medium text-off-white truncate">
                  {session?.email || 'Not available'}
                </p>
              </div>
            </div>
          </div>

          {/* Pairing */}
          <button
            onClick={onOpenPairing}
            className="w-full rounded-xl border border-dark-blue/50 bg-midnight-black/50 p-4 text-left transition-colors hover:border-bold-blue hover:bg-bold-blue/10"
          >
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-off-white" />
              <div className="flex-1">
                <p className="font-medium text-off-white">Pairing Code</p>
                <p className="text-xs text-off-white/50">
                  Get your invite code for caregivers
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="mb-3 text-xs uppercase tracking-[0.2em] font-semibold text-off-white/50">Session</div>
        <button
          onClick={() => void onSignOut()}
          className="w-full rounded-xl border border-dark-blue/50 bg-midnight-black/50 p-4 text-left transition-colors hover:border-red-500 hover:bg-red-500/10"
        >
          <div className="flex items-center gap-3">
            <LogOut className="h-5 w-5 text-red-400" />
            <div className="flex-1">
              <p className="font-medium text-red-400">Sign Out</p>
              <p className="text-xs text-off-white/50">
                Log out of your account
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
