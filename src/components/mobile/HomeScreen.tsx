import { Activity, MessageSquare, Stethoscope } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { NavRoute } from './BottomNavigation';
import { formatDistanceToNow } from './time';

interface HomeScreenProps {
  onNavigate: (route: NavRoute) => void;
}

interface StatusUpdate {
  id: string;
  message_text: string;
  sent_at: string;
  helper_location: string | null;
  selected_needs: string[];
  energy_status: string | null;
}

const navigationCards = [
  {
    id: 'status' as NavRoute,
    icon: Activity,
    title: 'Status',
    description: 'Update your energy level and how you are feeling',
  },
  {
    id: 'needs' as NavRoute,
    icon: MessageSquare,
    title: 'Needs',
    description: 'Let caregivers know what you need right now',
  },
  {
    id: 'hospital' as NavRoute,
    icon: Stethoscope,
    title: 'Hospital',
    description: 'Quick phrases for hospital staff and visitors',
  },
];

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [recentUpdates, setRecentUpdates] = useState<StatusUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentUpdates() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('status_updates')
          .select('id, message_text, sent_at, helper_location, selected_needs, energy_status')
          .eq('patient_id', user.id)
          .order('sent_at', { ascending: false })
          .limit(3);

        if (error) throw error;
        setRecentUpdates(data || []);
      } catch (error) {
        console.error('Error fetching recent updates:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentUpdates();
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] pb-24">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-off-white/60 mb-6">
            Communicate
          </p>
          <p className="text-sm text-white">
            What would you like to share?
          </p>
        </div>

        <div className="space-y-3">
          {navigationCards.map(({ id, icon: Icon, title, description }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="group w-full rounded-xl border border-bold-blue/40 bg-bold-blue/20 p-4 text-left transition-all hover:bg-bold-blue/30 hover:border-bold-blue/60 active:scale-[0.98]"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-white/10 p-2">
                  <Icon className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h2 className="mb-0.5 text-base font-semibold text-white">
                    {title}
                  </h2>
                  <p className="text-xs leading-relaxed text-white/80">
                    {description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {!loading && (
          <div className="mt-12">
            <p className="text-xs uppercase tracking-[0.25em] text-off-white/60 mb-4">
              Previous
            </p>
            {recentUpdates.length > 0 ? (
              <div className="space-y-2">
                {recentUpdates.map((update) => (
                  <div
                    key={update.id}
                    className="rounded-lg border border-dark-blue/30 bg-midnight-black/30 p-3"
                  >
                    <p className="text-sm text-white/90 mb-1 line-clamp-2">
                      {update.message_text}
                    </p>
                    <p className="text-xs text-periwinkle/60">
                      {formatDistanceToNow(update.sent_at)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dark-blue/30 bg-midnight-black/30 p-4 text-center">
                <p className="text-sm text-periwinkle/60">
                  No recent communications
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
