import React from 'react';
import { MessageSquare, ChevronDown, ChevronUp, Loader2, Check, AlertCircle } from 'lucide-react';
import { appConfig } from '../../lib/appConfig';
import { submitFeedback } from '../../services/backend';

export default function FeedbackCard() {
  const [expanded, setExpanded] = React.useState(false);
  const [feedback, setFeedback] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = React.useState('');

  const isDemo = appConfig.mode === 'demo';

  const handleSubmit = async () => {
    const trimmed = feedback.trim();
    if (!trimmed || status === 'submitting') return;
    setStatus('submitting');
    setErrorMsg('');
    const result = await submitFeedback(trimmed);
    if (result.ok) {
      setStatus('success');
      setFeedback('');
      setTimeout(() => {
        setExpanded(false);
        setStatus('idle');
      }, 2500);
    } else {
      setStatus('error');
      setErrorMsg(result.error ?? 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="mb-8">
      <div className="mb-3 text-xs uppercase tracking-[0.2em] font-semibold text-off-white/70">Feedback</div>
      <div className="rounded-xl border border-dark-blue/50 bg-midnight-black/50 p-4">
        {isDemo ? (
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dark-blue/40">
              <MessageSquare className="h-5 w-5 text-off-white/40" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-off-white text-sm">Send Feedback</p>
              <p className="text-xs text-off-white/70 mt-0.5">
                Requires a connected account to submit feedback.
              </p>
            </div>
          </div>
        ) : !expanded ? (
          <button
            type="button"
            onClick={() => { setExpanded(true); setStatus('idle'); setErrorMsg(''); }}
            className="flex w-full items-center gap-3 text-left"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bold-blue/20">
              <MessageSquare className="h-5 w-5 text-bold-blue" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-off-white text-sm">Send Feedback</p>
              <p className="text-xs text-off-white/70 mt-0.5">Tell us what could be better</p>
            </div>
            <ChevronDown className="h-5 w-5 shrink-0 text-off-white/40" />
          </button>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bold-blue/20">
                  <MessageSquare className="h-5 w-5 text-bold-blue" />
                </div>
                <div>
                  <p className="font-medium text-off-white text-sm">Send Feedback</p>
                  <p className="text-xs text-off-white/70 mt-0.5">Tell us what could be better</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setExpanded(false); setStatus('idle'); setErrorMsg(''); }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-periwinkle/20 text-off-white/60 transition-all hover:border-periwinkle/50 hover:text-white"
                aria-label="Collapse feedback"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>

            {status === 'success' ? (
              <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-3">
                <Check className="h-4 w-4 shrink-0 text-green-400" />
                <p className="text-sm text-green-400">Thank you! Your feedback has been sent.</p>
              </div>
            ) : (
              <>
                <textarea
                  value={feedback}
                  onChange={(e) => { setFeedback(e.target.value); if (status === 'error') setStatus('idle'); }}
                  autoFocus
                  rows={4}
                  maxLength={5000}
                  placeholder="What's working well? What could be better? Any bugs you've noticed?"
                  aria-label="Feedback text"
                  className="w-full resize-none rounded-lg border border-periwinkle/30 bg-midnight-black/60 px-3 py-2.5 text-sm text-off-white placeholder-off-white/30 outline-none focus:border-bold-blue focus:ring-2 focus:ring-bold-blue/30"
                />
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-off-white/40">{feedback.length}/5000</p>
                  <div className="flex items-center gap-2">
                    {status === 'error' && (
                      <p className="flex items-center gap-1 text-xs text-red-400">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errorMsg}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleSubmit()}
                      disabled={!feedback.trim() || status === 'submitting'}
                      className="flex items-center gap-2 rounded-full bg-bold-blue px-5 py-2 text-sm font-medium text-white transition-all hover:bg-bold-blue/80 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {status === 'submitting' ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Feedback'
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
