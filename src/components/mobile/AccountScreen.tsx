import React from 'react';
import { User, Mail, Link2, LogOut, Pencil, Check, X, Lock } from 'lucide-react';
import type { AppSession } from '../../types/app';
import { checkDisplayNameAvailable } from '../../services/backend';
import AvatarIcon from '../AvatarIcon';
import AvatarIconPicker from '../AvatarIconPicker';

interface AccountScreenProps {
  session: AppSession | null;
  onSignOut: () => Promise<void>;
  onOpenPairing: () => void;
  onUpdateDisplayName: (newName: string) => Promise<{ ok: boolean; message: string }>;
  onUpdateEmail: (newEmail: string) => Promise<{ ok: boolean; message: string }>;
  onUpdatePassword: (newPassword: string) => Promise<{ ok: boolean; message: string }>;
  onUpdateAvatarIcon: (iconId: string) => Promise<{ ok: boolean; message: string }>;
}

type EditingField = 'displayName' | 'email' | 'password' | 'avatar' | null;

const inputClass =
  'flex-1 min-w-0 rounded-lg border border-periwinkle/30 bg-midnight-black/60 px-3 py-2 text-sm text-off-white placeholder-off-white/30 outline-none focus:border-bold-blue focus:ring-2 focus:ring-bold-blue/30';

function SaveButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bold-blue text-white transition-all hover:bg-bold-blue/80 disabled:opacity-40 disabled:cursor-not-allowed"
      aria-label="Save"
    >
      <Check className="h-4 w-4" />
    </button>
  );
}

function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-periwinkle/20 text-off-white/60 transition-all hover:border-periwinkle/50 hover:text-white"
      aria-label="Cancel"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ml-3 flex shrink-0 items-center gap-1.5 rounded-full border border-periwinkle/20 px-3 py-1 text-xs text-periwinkle transition-all hover:border-periwinkle/50 hover:text-white"
    >
      <Pencil className="h-3 w-3" />
      Edit
    </button>
  );
}

export default function AccountScreen({
  session,
  onSignOut,
  onOpenPairing,
  onUpdateDisplayName,
  onUpdateEmail,
  onUpdatePassword,
  onUpdateAvatarIcon,
}: AccountScreenProps) {
  const [editing, setEditing] = React.useState<EditingField>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Display name state
  const [draftName, setDraftName] = React.useState('');
  const [nameError, setNameError] = React.useState('');

  // Email state
  const [draftEmail, setDraftEmail] = React.useState('');
  const [emailError, setEmailError] = React.useState('');
  const [emailSuccess, setEmailSuccess] = React.useState('');

  // Password state
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');
  const [passwordSuccess, setPasswordSuccess] = React.useState('');

  // Avatar icon state
  const [draftIcon, setDraftIcon] = React.useState(session?.avatarIcon ?? 'leaf');

  const startEditing = (field: EditingField) => {
    setEditing(field);
    setNameError('');
    setEmailError('');
    setEmailSuccess('');
    setPasswordError('');
    setPasswordSuccess('');
    if (field === 'displayName') setDraftName(session?.displayName ?? '');
    if (field === 'email') setDraftEmail(session?.email ?? '');
    if (field === 'password') { setNewPassword(''); setConfirmPassword(''); }
    if (field === 'avatar') setDraftIcon(session?.avatarIcon ?? 'leaf');
  };

  const cancelEditing = () => {
    setEditing(null);
    setNameError('');
    setEmailError('');
    setEmailSuccess('');
    setPasswordError('');
    setPasswordSuccess('');
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

  const handleSaveName = async () => {
    const trimmed = draftName.trim();
    if (!trimmed) { setNameError('Display name cannot be empty.'); return; }
    if (nameError) return;
    setIsSaving(true);
    const result = await onUpdateDisplayName(trimmed);
    setIsSaving(false);
    if (result.ok) {
      cancelEditing();
    } else {
      setNameError(result.message);
    }
  };

  const handleSaveAvatar = async () => {
    setIsSaving(true);
    const result = await onUpdateAvatarIcon(draftIcon);
    setIsSaving(false);
    if (result.ok) cancelEditing();
  };

  const handleSaveEmail = async () => {
    const trimmed = draftEmail.trim();
    if (!trimmed) { setEmailError('Enter a new email address.'); return; }
    setIsSaving(true);
    const result = await onUpdateEmail(trimmed);
    setIsSaving(false);
    if (result.ok) {
      setEmailError('');
      setEmailSuccess(result.message);
      setEditing(null);
    } else {
      setEmailError(result.message);
    }
  };

  const handleSavePassword = async () => {
    if (!newPassword) { setPasswordError('Enter a new password.'); return; }
    if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match.'); return; }
    setIsSaving(true);
    const result = await onUpdatePassword(newPassword);
    setIsSaving(false);
    if (result.ok) {
      setPasswordError('');
      setPasswordSuccess(result.message);
      setEditing(null);
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] pb-24">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-off-white/60 mb-1">Account</p>
          <p className="text-sm text-off-white/60">Manage your profile and settings.</p>
        </div>

        {/* Profile section */}
        <div className="mb-3 text-xs uppercase tracking-[0.2em] font-semibold text-off-white/50">Profile</div>
        <div className="space-y-2 mb-8">

          {/* Avatar icon */}
          <div className="rounded-xl border border-dark-blue/50 bg-midnight-black/50 p-4">
            {editing === 'avatar' ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-off-white/50">Choose your icon</p>
                  <div className="flex items-center gap-2">
                    <SaveButton onClick={() => void handleSaveAvatar()} disabled={isSaving} />
                    <CancelButton onClick={cancelEditing} />
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
                <EditButton onClick={() => startEditing('avatar')} />
              </div>
            )}
          </div>

          {/* Display name */}
          <div className="rounded-xl border border-dark-blue/50 bg-midnight-black/50 p-4">
            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-5 w-5 shrink-0 text-off-white/60" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-off-white/50 mb-1">Display name</p>
                {editing === 'displayName' ? (
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
                        className={inputClass}
                      />
                      <SaveButton onClick={() => void handleSaveName()} disabled={isSaving || !!nameError || !draftName.trim()} />
                      <CancelButton onClick={cancelEditing} />
                    </div>
                    {nameError && <p className="mt-1.5 text-xs text-red-400">{nameError}</p>}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-off-white truncate">{session?.displayName || 'Not set'}</p>
                    <EditButton onClick={() => startEditing('displayName')} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="rounded-xl border border-dark-blue/50 bg-midnight-black/50 p-4">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-off-white/60" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-off-white/50 mb-1">Email</p>
                {editing === 'email' ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={draftEmail}
                        onChange={(e) => { setDraftEmail(e.target.value); setEmailError(''); }}
                        autoFocus
                        autoCapitalize="none"
                        autoCorrect="off"
                        placeholder="new@example.com"
                        className={inputClass}
                      />
                      <SaveButton onClick={() => void handleSaveEmail()} disabled={isSaving || !draftEmail.trim()} />
                      <CancelButton onClick={cancelEditing} />
                    </div>
                    {emailError && <p className="mt-1.5 text-xs text-red-400">{emailError}</p>}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-off-white truncate">{session?.email || 'Not available'}</p>
                    <EditButton onClick={() => startEditing('email')} />
                  </div>
                )}
                {emailSuccess && !editing && (
                  <p className="mt-1.5 text-xs text-periwinkle">{emailSuccess}</p>
                )}
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="rounded-xl border border-dark-blue/50 bg-midnight-black/50 p-4">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-off-white/60" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-off-white/50 mb-1">Password</p>
                {editing === 'password' ? (
                  <div className="space-y-2">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                      autoFocus
                      placeholder="New password (min. 6 characters)"
                      className={`${inputClass} w-full`}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                        placeholder="Confirm new password"
                        className={inputClass}
                      />
                      <SaveButton
                        onClick={() => void handleSavePassword()}
                        disabled={isSaving || !newPassword || !confirmPassword}
                      />
                      <CancelButton onClick={cancelEditing} />
                    </div>
                    {passwordError && <p className="mt-0.5 text-xs text-red-400">{passwordError}</p>}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-off-white">••••••••</p>
                    <EditButton onClick={() => startEditing('password')} />
                  </div>
                )}
                {passwordSuccess && !editing && (
                  <p className="mt-1.5 text-xs text-periwinkle">{passwordSuccess}</p>
                )}
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
                <p className="text-xs text-off-white/50">Get your invite code for caregivers</p>
              </div>
            </div>
          </button>
        </div>

        {/* Session section */}
        <div className="mb-3 text-xs uppercase tracking-[0.2em] font-semibold text-off-white/50">Session</div>
        <button
          onClick={() => void onSignOut()}
          className="w-full rounded-xl border border-dark-blue/50 bg-midnight-black/50 p-4 text-left transition-colors hover:border-red-500 hover:bg-red-500/10"
        >
          <div className="flex items-center gap-3">
            <LogOut className="h-5 w-5 text-red-400" />
            <div className="flex-1">
              <p className="font-medium text-red-400">Sign Out</p>
              <p className="text-xs text-off-white/50">Log out of your account</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
