import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Send } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { NEEDS } from '../../utils/communicationData';
import { speak } from '../../utils/textToSpeech';
import type { CommunicationSubmission, StatusUpdate } from '../../types/app';
import { supabase } from '../../lib/supabaseClient';
import { formatDistanceToNow } from './time';

interface NeedsScreenProps {
  ttsEnabled: boolean;
  onToggleTTS: () => void;
  onSendUpdate: (submission: CommunicationSubmission) => Promise<void>;
  profileId: string;
}

export default function NeedsScreen({ ttsEnabled, onToggleTTS, onSendUpdate, profileId }: NeedsScreenProps) {
  const [selectedNeeds, setSelectedNeeds] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [lastCommunication, setLastCommunication] = useState<StatusUpdate | null>(null);

  useEffect(() => {
    fetchLastCommunication();
  }, [profileId]);

  const fetchLastCommunication = async () => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('status_updates')
      .select('*')
      .eq('patient_id', profileId)
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setLastCommunication({
        id: data.id,
        patientId: data.patient_id,
        caregiverId: data.caregiver_id,
        helperLocation: data.helper_location,
        selectedNeeds: data.selected_needs,
        energyStatus: data.energy_status,
        selectedSymptoms: data.selected_symptoms,
        messageText: data.message_text,
        sentAt: data.sent_at,
        delivery: data.delivery,
      });
    }
  };

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
  };

  const handleSendNeeds = async () => {
    if (selectedNeeds.size === 0) return;

    setIsSending(true);
    try {
      const needsArray = Array.from(selectedNeeds);
      const messages = needsArray
        .map(id => NEEDS.find(n => n.id === id)?.speech)
        .filter(Boolean)
        .join('. ');

      await onSendUpdate({
        type: 'need',
        selectedNeeds: needsArray,
        message: messages,
      });

      await fetchLastCommunication();
    } finally {
      setIsSending(false);
    }
  };

  const lastCommunicatedNeeds = (lastCommunication?.selectedNeeds ?? [])
    .map(id => NEEDS.find(n => n.id === id))
    .filter(Boolean);

  const hasNeeds = lastCommunicatedNeeds.length > 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] pb-32">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Needs</h1>
            <p className="text-sm text-zinc-100/70">Tap to select, then send to notify your helper.</p>
          </div>
          <button
            onClick={onToggleTTS}
            className="rounded-full border border-dark-blue bg-midnight-black/90 p-3 text-zinc-100 shadow-lg shadow-black/20 transition-colors hover:border-bold-blue hover:text-bold-blue"
          >
            {ttsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-periwinkle/20 bg-midnight-black/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-100/60">
              Last Communication
            </h2>
            {hasNeeds && (
              <p className="text-xs text-zinc-100/50">
                {formatDistanceToNow(lastCommunication!.sentAt)}
              </p>
            )}
          </div>
          {hasNeeds ? (
            <div className="flex flex-wrap items-center gap-2">
              {lastCommunicatedNeeds.map((need) => {
                const Icon = LucideIcons[need.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
                return (
                  <div key={need.id} className="flex items-center gap-1.5 rounded-lg bg-bold-blue/20 px-3 py-1.5 text-sm font-medium text-zinc-100">
                    {Icon && <Icon className="h-4 w-4" />}
                    {need.label}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-zinc-100/60">No needs sent</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {NEEDS.map((need) => {
            const Icon = LucideIcons[need.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>;
            const isSelected = selectedNeeds.has(need.id);
            return (
              <button
                key={need.id}
                onClick={() => handleNeedClick(need.id)}
                className={`group rounded-xl border-2 p-4 text-center transition-all ${
                  isSelected
                    ? 'border-bold-blue bg-bold-blue shadow-lg shadow-bold-blue/30 scale-[1.02]'
                    : 'border-periwinkle/30 bg-midnight-black/60 hover:border-periwinkle/50 hover:bg-midnight-black/80 hover:scale-[1.02]'
                }`}
              >
                <div className="mb-2 flex justify-center">
                  {Icon && (
                    <Icon className={`h-8 w-8 transition-colors ${
                      isSelected ? 'text-white' : 'text-zinc-100'
                    }`} />
                  )}
                </div>
                <span className={`text-sm font-medium transition-colors ${
                  isSelected ? 'text-white' : 'text-zinc-100'
                }`}>
                  {need.label}
                </span>
              </button>
            );
          })}
        </div>

        {selectedNeeds.size > 0 && (
          <div className="fixed inset-x-0 bottom-20 px-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="mx-auto max-w-2xl">
              <button
                onClick={() => void handleSendNeeds()}
                disabled={isSending}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-bold-blue px-6 py-4 font-semibold text-white shadow-xl shadow-bold-blue/30 transition-all hover:bg-bold-blue/90 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
                {isSending ? 'Sending...' : `Send ${selectedNeeds.size} Need${selectedNeeds.size > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
