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
    description: 'Share your energy level and how you are feeling',
    color: 'from-electric-blue/20 to-electric-blue/5',
    iconColor: 'text-electric-blue',
  },
  {
    id: 'needs' as NavRoute,
    icon: MessageSquare,
    title: 'Needs',
    description: 'Let caregivers know what you need right now',
    color: 'from-periwinkle/20 to-periwinkle/5',
    iconColor: 'text-periwinkle',
  },
  {
    id: 'hospital' as NavRoute,
    icon: Stethoscope,
    title: 'Hospital',
    description: 'Quick phrases for hospital staff and visitors',
    color: 'from-seafoam-green/20 to-seafoam-green/5',
    iconColor: 'text-seafoam-green',
  },
];

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  return (
    <div className="min-h-screen bg-midnight-black pb-24">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-periwinkle">Spoonfull</h1>
          <p className="text-sm text-periwinkle/70">
            Communicate your needs with ease
          </p>
        </div>

        <div className="space-y-4">
          {navigationCards.map(({ id, icon: Icon, title, description, color, iconColor }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`group w-full rounded-2xl border border-dark-blue/50 bg-gradient-to-br ${color} p-6 text-left shadow-lg shadow-black/20 transition-all hover:scale-[1.02] hover:border-dark-blue hover:shadow-xl hover:shadow-black/30 active:scale-[0.98]`}
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-xl bg-midnight-black/50 p-3 ${iconColor}`}>
                  <Icon className="h-8 w-8" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h2 className="mb-1 text-xl font-semibold text-periwinkle">
                    {title}
                  </h2>
                  <p className="text-sm leading-relaxed text-periwinkle/70">
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
