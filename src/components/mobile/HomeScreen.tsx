import { Activity, MessageSquare, Stethoscope } from 'lucide-react';
import type { NavRoute } from './BottomNavigation';

interface HomeScreenProps {
  onNavigate: (route: NavRoute) => void;
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
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] pb-24">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-periwinkle">Communication Options</h1>
          <p className="text-sm text-periwinkle/70">
            What would you like to share?
          </p>
        </div>

        <div className="space-y-4">
          {navigationCards.map(({ id, icon: Icon, title, description }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="group w-full rounded-2xl border-2 border-bold-blue bg-bold-blue p-6 text-left transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-bold-blue/30 active:scale-[0.98]"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-white/10 p-3">
                  <Icon className="h-8 w-8 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h2 className="mb-1 text-xl font-semibold text-white">
                    {title}
                  </h2>
                  <p className="text-sm leading-relaxed text-white/90">
                    {description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-dark-blue/30 bg-midnight-black/50 p-4 text-center">
          <p className="text-xs text-periwinkle/60">
            All actions can be spoken aloud with text-to-speech
          </p>
        </div>
      </div>
    </div>
  );
}
