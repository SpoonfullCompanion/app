import { ChevronLeft } from 'lucide-react';

interface PrivacyPolicyScreenProps {
  onBack: () => void;
}

const sections: { number: string; title: string; body: string[] }[] = [
  {
    number: '1',
    title: 'Overview',
    body: [
      'This policy explains what information Spoonfull.app collects, how it\u2019s used, and the choices you have. We collect only what the app needs to work, and we do not sell your information.',
    ],
  },
  {
    number: '2',
    title: 'Information We Collect',
    body: [
      'Account information: a username and email address. We do not ask for your real name, birthdate, or physical address to create an account.',
      'Message content: the needs and urgency indicators you send, and the messages you exchange with your helper.',
      'Helper pairing information: who you\u2019re paired with, so the app knows where to send your messages.',
      'Device and notification data: a push notification token (used through our provider, OneSignal) so your helper can be notified when you reach out.',
      'Usage data: basic technical information such as app version and crash logs, used to fix bugs and keep the beta stable.',
    ],
  },
  {
    number: '3',
    title: 'Health-Adjacent Information',
    body: [
      'Messages and urgency indicators may describe symptoms, severity, or needs related to a health condition. Depending on your location, this kind of information can be treated as sensitive health data under laws such as the Washington My Health My Data Act or the EU General Data Protection Regulation, which may give you additional rights over it. We handle this content with the same care as the rest of your account data and do not use it for advertising.',
    ],
  },
  {
    number: '4',
    title: 'How We Use Information',
    body: [
      'To deliver your messages to your chosen helper.',
      'To share your status with your chosen helpers and paired friends.',
      'To send push notifications through OneSignal when you reach out during a crash.',
      'To maintain, troubleshoot, and improve the app during beta and afterward.',
      'To communicate with you about your account or changes to the app.',
    ],
  },
  {
    number: '5',
    title: 'How We Share Information',
    body: [
      'We share your message content with the helper or helpers you choose to pair with.',
      'Your status content is shared with friends that you choose to pair with.',
      'We do not sell your information, and we do not share it with advertisers.',
      'We use service providers to run the app, including Supabase for data storage and OneSignal for push notifications. These providers process data on our behalf and are not permitted to use it for their own purposes.',
    ],
  },
  {
    number: '6',
    title: 'Data Storage and Security',
    body: [
      'Your information is stored using Supabase\u2019s infrastructure. We take reasonable steps to protect your information, but no system is perfectly secure, and we can\u2019t guarantee absolute security.',
    ],
  },
  {
    number: '7',
    title: 'Your Rights and Choices',
    body: [
      'Depending on where you live, you may have rights to access, correct, delete, or export your information, and to object to certain uses of it. This can include rights under the GDPR (EU/UK users), the CCPA (California users), and similar laws elsewhere.',
      'You can end a helper pairing or delete your account entirely from within the app at any time. When you delete your account, all associated data is permanently removed from our servers immediately upon deletion.',
    ],
  },
  {
    number: '8',
    title: 'Data Retention',
    body: [
      'We keep your information for as long as your account is active, or as needed to provide the app. If you delete your account, we remove your personal information immediately.',
    ],
  },
  {
    number: '9',
    title: 'Children\u2019s Privacy',
    body: [
      'Spoonfull.app is not directed at children under 18, and we do not knowingly collect information from them.',
    ],
  },
  {
    number: '10',
    title: 'International Users',
    body: [
      'Spoonfull.app is used by people and volunteers around the world. If you\u2019re located outside the United States, your information will be stored and processed in the United States, where our service providers operate, and possibly in other countries as our infrastructure grows.',
      'If you\u2019re in the European Economic Area, the UK, or another region with its own data protection laws, we rely on appropriate safeguards, such as standard contractual clauses, when transferring your information to the United States. You may have rights under your local law in addition to the rights described in Section 7, including the right to lodge a complaint with your local data protection authority.',
      'Because Spoonfull.app is currently in beta, our approach to international compliance is still developing alongside the app itself. We\u2019ll update this section as our user base and legal structure become clearer.',
    ],
  },
  {
    number: '11',
    title: 'Changes to This Policy',
    body: [
      'We may update this Privacy Policy as Spoonfull.app develops. We\u2019ll let you know about material changes through the app or by email before they take effect.',
    ],
  },
  {
    number: '12',
    title: 'Contact',
    body: ['Erica Hayes, Cofounder', 'Info@Spoonfull.app'],
  },
];

export default function PrivacyPolicyScreen({ onBack }: PrivacyPolicyScreenProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(66,95,204,0.12),_rgba(29,29,29,0.98)_60%)] text-off-white">
      <div className="mx-auto max-w-xl px-6 py-10 pb-20">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-periwinkle underline-offset-2 hover:text-white transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <p className="text-xs uppercase tracking-[0.25em] text-off-white/60 mb-1">
          Last updated: September 7 2026
        </p>
        <p className="text-xs text-off-white/50 mb-1">
          Applies to: Spoonfull.app iOS beta (TestFlight)
        </p>
        <h1 className="text-3xl font-bold font-league-spartan mb-8">Privacy Policy</h1>

        <div className="space-y-6">
          {sections.map((section) => (
            <div
              key={section.number}
              className="rounded-xl border border-periwinkle/20 bg-midnight-black/50 p-5"
            >
              <h2 className="text-lg font-semibold font-league-spartan text-off-white mb-3">
                {section.number}. {section.title}
              </h2>
              <div className="space-y-3">
                {section.body.map((paragraph, i) => (
                  <p key={i} className="text-sm leading-relaxed text-off-white/75">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
