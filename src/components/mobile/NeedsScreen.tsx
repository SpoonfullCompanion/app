import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Send, Clock, Zap, Hourglass, HandHeart, Star, Heart, CheckCircle, Users, Check, ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { NEEDS } from '../../utils/communicationData';
import { speak } from '../../utils/textToSpeech';
import type { AppSession, Connection, CommunicationSubmission, NeedPriority } from '../../types/app';
import { getActiveHelpers } from '../../services/backend';
import AvatarIcon from '../AvatarIcon';

interface NeedsScreenProps {
  ttsEnabled: boolean;
  onToggleTTS: () => void;
  onSendUpdate: (submission: CommunicationSubmission) => Promise<void>;
  profileId: string;
  session: AppSession | null;
  onNavigate: (route: 'hospital') => void;
}

const PRIORITIES: { id: NeedPriority; label: string; sublabel: string; icon: React.ComponentType<{ className?: string }>; borderClass: string; selectedClass: string }[] = [
  {
    id: 'when_you_can',
    label: 'When you can',
    sublabel: 'No rush',
    icon: Clock,
    borderClass: 'border-teal-700/40 bg-teal-900/20 hover:border-teal-600/50 hover:bg-teal-900/30',
    selectedClass: 'border-teal-500 bg-teal-700 shadow-teal-700/40',
  },
  {
    id: 'soon',
    label: 'Soon',
    sublabel: 'Within the next hour please',
    icon: Hourglass,
    borderClass: 'border-amber-700/40 bg-amber-900/20 hover:border-amber-600/50 hover:bg-amber-900/30',
    selectedClass: 'border-amber-500 bg-amber-700 shadow-amber-700/40',
  },
  {
    id: 'asap',
    label: 'Need ASAP',
    sublabel: 'Please stop what you\'re doing',
    icon: Zap,
    borderClass: 'border-red-700/40 bg-red-900/20 hover:border-red-600/50 hover:bg-red-900/30',
    selectedClass: 'border-red-500 bg-red-700 shadow-red-700/40',
  },
];

const APPRECIATION: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'thank_you', label: 'Thank you so much', icon: HandHeart },
  { id: 'i_appreciate_you', label: "I appreciate you", icon: Star },
  { id: 'i_love_you', label: 'I love you', icon: Heart },
];

export default function NeedsScreen({ ttsEnabled, onToggleTTS, onSendUpdate, session, onNavigate }: NeedsScreenProps) {
  const [selectedNeeds, setSelectedNeeds] = useState<Set<string>>(new Set());
  const [selectedPriority, setSelectedPriority] = useState<NeedPriority | null>(null);
  const [selectedAppreciation, setSelectedAppreciation] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [pulseKey, setPulseKey] = useState(0);
  const [helpers, setHelpers] = useState<Connection[]>([]);
  const [selectedHelperIds, setSelectedHelperIds] = useState<Set<string>>(new Set());
  const [recipientOpen, setRecipientOpen] = useState(false);
  const recipientRef = useRef<HTMLDivElement>(null);

  // Load active helpers once on mount
  useEffect(() => {
    if (!session || session.authMode === 'demo') return;
    getActiveHelpers(session).then((conns) => {
      setHelpers(conns);
      setSelectedHelperIds(new Set(conns.map((c) => c.followerId)));
    }).catch(console.error);
  }, [session]);

  // Close recipient dropdown on outside click
  useEffect(() => {
    if (!recipientOpen) return;
    const handler = (e: MouseEvent) => {
      if (recipientRef.current && !recipientRef.current.contains(e.target as Node)) {
        setRecipientOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [recipientOpen]);

  useEffect(() => {
    if (!sent) return;
    const t = window.setTimeout(() => setSent(false), 3000);
    return () => window.clearTimeout(t);
  }, [sent]);

  const handleNeedClick = (needId: string) => {
    const need = NEEDS.find(n => n.id === needId);
    if (!need) return;

    const newNeeds = new Set(selectedNeeds);
    if (newNeeds.has(needId)) {
      newNeeds.delete(needId);
    } else {
      newNeeds.add(needId);
      if (ttsEnabled) {
        speak(need.speech);
      }
    }
    setSelectedNeeds(newNeeds);

    if (newNeeds.size === 0) {
      setSelectedPriority(null);
    }
  };

  const handleSendNeeds = async () => {
    if (selectedNeeds.size === 0 && !customNote.trim() && selectedAppreciation.size === 0) return;

    setPulseKey(k => k + 1);
    setIsSending(true);
    try {
      const needsArray = Array.from(selectedNeeds);
      const parts: string[] = [];

      const needMessages = needsArray
        .map(id => NEEDS.find(n => n.id === id)?.speech)
        .filter(Boolean) as string[];
      if (needMessages.length > 0) parts.push(needMessages.join('. '));
      if (customNote.trim()) parts.push(customNote.trim());

      const appreciationMessages = Array.from(selectedAppreciation)
        .map(id => APPRECIATION.find(a => a.id === id)?.label)
        .filter(Boolean) as string[];
      if (appreciationMessages.length > 0) parts.push(appreciationMessages.join('. '));

      // null = broadcast (all helpers selected, or demo/no helpers); array = targeted
      const allSelected = helpers.length === 0 || selectedHelperIds.size === helpers.length;
      const targetedFollowerIds = allSelected ? null : Array.from(selectedHelperIds);

      await onSendUpdate({
        type: 'need',
        selectedNeeds: needsArray,
        message: parts.join('. '),
        needPriority: selectedPriority,
        targetedFollowerIds,
      });

      setSelectedNeeds(new Set());
      setSelectedPriority(null);
      setCustomNote('');
      setSelectedAppreciation(new Set());
      setSent(true);
    } finally {
      setIsSending(false);
    }
  };

  const handleSpeakNote = () => {
    if (customNote.trim() && ttsEnabled) {
      speak(customNote);
    }
  };

  const hasSelection = selectedNeeds.size > 0 || customNote.trim().length > 0 || selectedAppreciation.size > 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] pb-32">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-off-white/60 mb-2">
              Needs
            </p>
            <p className="text-sm text-white">
              Tap to speak, or select your needs to notify to your helper.
            </p>
            <button
              onClick={() => onNavigate('hospital')}
              className="mt-1 text-sm text-periwinkle underline underline-offset-2 hover:text-white transition-colors"
            >
              In the hospital? Try Hospital Mode.
            </button>
          </div>
          <button
            onClick={onToggleTTS}
            className="rounded-full border border-dark-blue bg-midnight-black/90 p-3 text-off-white shadow-lg shadow-black/20 transition-all hover:border-bold-blue hover:text-bold-blue active:scale-90"
          >
            {ttsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {NEEDS.map((need) => {
            const Icon = LucideIcons[need.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
            const isSelected = selectedNeeds.has(need.id);
            return (
              <button
                key={need.id}
                onClick={() => handleNeedClick(need.id)}
                className={`rounded-xl border-2 p-3 text-left transition-all duration-150 active:scale-95 ${
                  isSelected
                    ? 'border-bold-blue bg-bold-blue shadow-lg shadow-bold-blue/40 scale-[1.03]'
                    : 'border-periwinkle/30 bg-midnight-black/60 hover:border-periwinkle/50 hover:bg-midnight-black/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  {Icon && (
                    <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-off-white'}`} />
                  )}
                  <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-off-white'}`}>
                    {need.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <label htmlFor="customNote" className="mb-2 block text-sm font-medium text-white">
            Type to Speak or Add Notes
          </label>
          <div className="flex gap-2">
            <textarea
              id="customNote"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Type a custom message or note here..."
              rows={3}
              className="flex-1 rounded-lg border border-periwinkle/30 bg-midnight-black/60 px-3 py-2 text-sm text-white placeholder-zinc-100/60 focus:border-bold-blue focus:outline-none focus:ring-2 focus:ring-bold-blue/30"
            />
            <button
              onClick={handleSpeakNote}
              disabled={!customNote.trim() || !ttsEnabled}
              className="rounded-lg border border-periwinkle/30 bg-midnight-black/60 px-4 text-zinc-100 transition-all hover:border-bold-blue hover:bg-midnight-black/80 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Volume2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-off-white/80">
            Set Priority <span className="text-off-white/60 normal-case font-normal">(optional)</span>
          </h2>
          <div className="flex flex-col gap-3">
            {PRIORITIES.map((priority) => {
              const isSelected = selectedPriority === priority.id;
              return (
                <button
                  key={priority.id}
                  onClick={() => setSelectedPriority(isSelected ? null : priority.id)}
                  className={`flex items-center gap-4 rounded-xl border-2 px-4 py-3.5 text-left transition-all duration-150 active:scale-[0.98] ${
                    isSelected
                      ? `${priority.selectedClass} shadow-lg scale-[1.02]`
                      : priority.borderClass
                  }`}
                >
                  <priority.icon className={`h-5 w-5 shrink-0 ${isSelected ? 'text-white' : 'text-off-white/70'}`} />
                  <div>
                    <p className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-off-white'}`}>
                      {priority.label}
                    </p>
                    <p className={`text-xs ${isSelected ? 'text-white/90' : 'text-off-white/70'}`}>
                      {priority.sublabel}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-off-white/80">
            Appreciation <span className="text-off-white/60 normal-case font-normal">(optional)</span>
          </h2>
          <div className="flex flex-col gap-3">
            {APPRECIATION.map((item) => {
              const isSelected = selectedAppreciation.has(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    const next = new Set(selectedAppreciation);
                    if (next.has(item.id)) next.delete(item.id);
                    else next.add(item.id);
                    setSelectedAppreciation(next);
                    if (!isSelected && ttsEnabled) speak(item.label);
                  }}
                  className={`flex items-center gap-4 rounded-xl border-2 px-4 py-3.5 text-left transition-all duration-150 active:scale-[0.98] ${
                    isSelected
                      ? 'border-bold-blue bg-bold-blue shadow-lg shadow-bold-blue/40 scale-[1.02]'
                      : 'border-periwinkle/30 bg-midnight-black/60 hover:border-periwinkle/50 hover:bg-midnight-black/80'
                  }`}
                >
                  <item.icon className={`h-5 w-5 shrink-0 ${isSelected ? 'text-white' : 'text-off-white/70'}`} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-off-white'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Helper selector — only shown when patient has multiple helpers */}
        {helpers.length > 1 && (
          <div className="mt-6" ref={recipientRef}>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-off-white/60">Send to</p>

            {/* Dropdown trigger */}
            <button
              onClick={() => setRecipientOpen(v => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-periwinkle/25 bg-midnight-black/60 px-4 py-3 text-left transition-all hover:border-periwinkle/45 hover:bg-midnight-black/80 active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                <Users className="h-4 w-4 shrink-0 text-periwinkle/70" />
                <span className="text-sm text-white">
                  {selectedHelperIds.size === helpers.length
                    ? 'All helpers'
                    : helpers
                        .filter(h => selectedHelperIds.has(h.followerId))
                        .map(h => h.followerDisplayName ?? 'Helper')
                        .join(', ')}
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 text-off-white/50 transition-transform duration-200 ${recipientOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown panel */}
            {recipientOpen && (
              <div className="mt-1.5 overflow-hidden rounded-xl border border-periwinkle/25 bg-[#1a1f35] shadow-xl shadow-black/40">
                {/* All helpers row */}
                <button
                  onClick={() => setSelectedHelperIds(new Set(helpers.map(h => h.followerId)))}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5 active:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-bold-blue/20 shrink-0">
                      <Users className="h-3.5 w-3.5 text-bold-blue" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">All helpers</p>
                      <p className="text-xs text-off-white/55">{helpers.length} people</p>
                    </div>
                  </div>
                  {selectedHelperIds.size === helpers.length && (
                    <Check className="h-4 w-4 shrink-0 text-bold-blue" />
                  )}
                </button>

                <div className="h-px bg-white/6 mx-4" />

                {/* Individual rows */}
                {helpers.map((helper, i) => {
                  const isSelected = selectedHelperIds.has(helper.followerId);
                  const name = helper.followerDisplayName ?? 'Helper';
                  return (
                    <button
                      key={helper.followerId}
                      onClick={() => {
                        const next = new Set(selectedHelperIds);
                        if (isSelected) {
                          if (next.size === 1) return;
                          next.delete(helper.followerId);
                        } else {
                          next.add(helper.followerId);
                        }
                        setSelectedHelperIds(next);
                      }}
                      className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5 active:bg-white/10 ${i < helpers.length - 1 ? '' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <AvatarIcon iconId={helper.followerAvatarIcon ?? null} size="sm" className="h-7 w-7 shrink-0" />
                        <span className="text-sm text-off-white">{name}</span>
                      </div>
                      <div className={`h-5 w-5 shrink-0 rounded-full border-2 transition-all ${
                        isSelected
                          ? 'border-bold-blue bg-bold-blue'
                          : 'border-white/20 bg-transparent'
                      }`}>
                        {isSelected && <Check className="h-full w-full p-0.5 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="fixed inset-x-0 bottom-20 px-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="mx-auto max-w-2xl">
            {sent ? (
              <div className="flex w-full items-center justify-center gap-2 rounded-full bg-green-700 px-6 py-4 font-semibold text-white shadow-xl shadow-green-900/30">
                <CheckCircle className="h-5 w-5" />
                Needs sent
              </div>
            ) : (
              <button
                key={pulseKey}
                onClick={() => void handleSendNeeds()}
                disabled={isSending || !hasSelection}
                className={`flex w-full items-center justify-center gap-2 rounded-full bg-bold-blue px-6 py-4 font-semibold text-white shadow-xl shadow-bold-blue/30 transition-all hover:bg-bold-blue/90 active:scale-95 disabled:opacity-50 ${pulseKey > 0 ? 'animate-pulse-once' : ''}`}
              >
                <Send className="h-5 w-5" />
                {isSending ? 'Sending...' : selectedNeeds.size > 0 ? `Send ${selectedNeeds.size} Need${selectedNeeds.size > 1 ? 's' : ''}` : 'Send Message'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
