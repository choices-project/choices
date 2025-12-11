import Link from 'next/link';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Choices',
  description:
    'Review the Terms of Service governing your use of Choices, including user responsibilities, acceptable use, and dispute resolution.',
};

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: [
      'By creating an account or accessing Choices you agree to these Terms of Service and our Privacy Policy.',
      'If you are accepting these terms on behalf of an organization you represent that you have authority to bind that organization.',
    ],
  },
  {
    title: '2. Platform Use',
    body: [
      'Provide accurate information and keep your profile up to date.',
      'Do not attempt to manipulate polls, civic actions, or analytics through automated scripts or coordinated activity.',
      'Respect intellectual property rights and only submit content you have the right to share.',
    ],
  },
  {
    title: '3. Privacy + Data Handling',
    body: [
      'We only process personal data in accordance with the Privacy Policy and the controls surfaced in your account settings.',
      'Some features (for example, verification or representative lookups) require additional information; we only use it for the stated purpose.',
      'You remain responsible for keeping your login credentials secure.',
    ],
  },
  {
    title: '4. Termination & Suspension',
    body: [
      'We may suspend or terminate accounts that violate these terms, abuse civic tooling, or compromise platform security.',
      'You may close your account at any time from the privacy dashboard or by contacting support.',
    ],
  },
  {
    title: '5. Liability',
    body: [
      'Choices is provided “as is” without warranties of any kind.',
      'To the fullest extent permitted by law, our total liability is limited to fees paid (if any) for the service in the 12 months preceding the claim.',
    ],
  },
  {
    title: '6. Updates & Contact',
    body: [
      'We may update these terms to reflect product, legal, or security changes. Material changes will be announced in-app.',
      'Questions? Email compliance@choices.vote or use the in-app feedback widget.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Choices Legal</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="mt-2 text-gray-600">
            These terms outline your rights and responsibilities when using the Choices platform.
          </p>
          <p className="mt-1 text-sm text-gray-500">Last updated: November 17, 2025</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        {SECTIONS.map((section) => (
          <section
            key={section.title}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-700">
              {section.body.map((sentence) => (
                <li key={sentence}>{sentence}</li>
              ))}
            </ul>
          </section>
        ))}

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="text-lg font-semibold text-blue-900">Related policies</h3>
          <p className="mt-2 text-sm text-blue-900">
            Refer to our{' '}
            <Link href="/privacy" className="font-semibold underline">
              Privacy Policy
            </Link>{' '}
            for data handling details and your rights as a user.
          </p>
        </div>
      </div>
    </div>
  );
}

