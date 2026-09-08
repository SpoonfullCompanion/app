import { ChevronLeft } from 'lucide-react';

interface TermsOfUseScreenProps {
  onBack: () => void;
}

const sections: { number: string; title: string; body: string[] }[] = [
  {
    number: '1',
    title: 'Agreement to These Terms',
    body: [
      'By creating an account or using Spoonfull.app, you agree to these Terms of Use and to the Privacy Policy below. If you do not agree, please do not use the app.',
    ],
  },
  {
    number: '2',
    title: 'Not an Emergency Service',
    body: [
      'Spoonfull.app is a communication tool. It is not an emergency service and is not monitored in real time. Messages sent through the app, including during Crash Mode or Hospital Mode, may not be seen right away by your helper or by anyone else.',
      'If you or someone you know is in danger, or is experiencing a medical emergency, call your local emergency number right away. Do not rely on Spoonfull.app to get help in an emergency.',
      'Everyone deserves to live in safety, dignity, and respect. If you or someone you know feels unsafe, neglected, or at risk outside of a medical emergency, support is available in most regions through Adult Protective Services or adult safeguarding services. Availability and names of these services vary by country.',
    ],
  },
  {
    number: '3',
    title: 'Beta Status',
    body: [
      'Spoonfull.app is currently in beta testing. Features may change, break, or be removed without notice. Data loss, downtime, and bugs are more likely during this period than they will be in a general release. Beta access does not guarantee continued access to the app or to any account or message history.',
    ],
  },
  {
    number: '4',
    title: 'Eligibility',
    body: ['You must be at least 18 years old to create a Spoonfull.app account.'],
  },
  {
    number: '5',
    title: 'Your Account',
    body: [
      'Spoonfull.app asks for a username and an email address to create an account. We do not require your real name or date of birth.',
      'You are responsible for keeping your login credentials secure and for all activity that happens under your account. Let us know right away if you believe your account has been accessed without your permission.',
    ],
  },
  {
    number: '6',
    title: 'Messages and Your Content',
    body: [
      'Spoonfull.app lets you send tap-based messages and urgency indicators to your helper during a crash. You own the content you create. By using the app, you give Spoonfull.app permission to store and transmit that content for the purpose of delivering it to your helper and operating the service.',
      'Content you share with a helper is visible to that helper. Choose who you pair with accordingly.',
    ],
  },
  {
    number: '7',
    title: 'Helpers',
    body: [
      'A helper is someone you choose to pair with to receive your messages during a crash. Spoonfull.app does not verify the identity, intentions, or suitability of any helper. Pairing with a helper is your decision, and you can end a pairing at any time.',
    ],
  },
  {
    number: '8',
    title: 'Acceptable Use',
    body: [
      'Do not use Spoonfull.app to harass, threaten, or harm another person.',
      'Do not use the app for any purpose other than communicating about needs during a crash between you and your helper.',
      'Do not attempt to access another user\u2019s account or data without permission.',
      'Do not reverse engineer, scrape, or interfere with the app\u2019s operation.',
    ],
  },
  {
    number: '9',
    title: 'Disclaimers',
    body: [
      'Spoonfull.app is provided \u201Cas is\u201D and \u201Cas available,\u201D without warranties of any kind, express or implied. We do not guarantee that messages will be delivered, seen, or acted upon in any particular timeframe, or at all. We do not guarantee the app will be free of errors or interruptions.',
    ],
  },
  {
    number: '10',
    title: 'Limitation of Liability',
    body: [
      'To the fullest extent permitted by law, Spoonfull.app and its founders, volunteers, and contributors are not liable for any harm, loss, or damage arising from your use of the app, including harm arising from a delayed or missed message, a helper\u2019s action or inaction, or reliance on the app during an emergency.',
    ],
  },
  {
    number: '11',
    title: 'Changes to the App and These Terms',
    body: [
      'We may update these Terms as Spoonfull.app develops, especially during and after the beta period. If we make material changes, we will let you know through the app or by email before they take effect.',
    ],
  },
  {
    number: '12',
    title: 'Ending Your Account',
    body: [
      'You can delete your account at any time. We may suspend or end an account that violates these Terms or that we believe puts another user at risk.',
    ],
  },
  {
    number: '13',
    title: 'Governing Law',
    body: [
      '[Legal to specify jurisdiction once entity formation is settled. Worth flagging to legal specifically: because beta testers may be located outside the US, they\u2019ll want to confirm this clause is enforceable for international users and whether any mandatory local consumer-protection rules override it in certain countries.]',
    ],
  },
  {
    number: '14',
    title: 'Contact',
    body: ['Erica Hayes, Cofounder', 'Info@Spoonfull.app'],
  },
];

export default function TermsOfUseScreen({ onBack }: TermsOfUseScreenProps) {
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
        <h1 className="text-3xl font-bold font-league-spartan mb-8">Terms of Use</h1>

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
                  <p
                    key={i}
                    className={`text-sm leading-relaxed ${
                      paragraph.startsWith('[')
                        ? 'text-yellow-300/80 italic'
                        : 'text-off-white/75'
                    }`}
                  >
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
