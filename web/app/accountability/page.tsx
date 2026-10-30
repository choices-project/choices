import { AccountabilityView } from '@/features/accountability/AccountabilityView';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Surveillance-industry money in politics - Choices',
  description:
    'Read-only public record of political contributions from Axon (TASER) and Flock Safety to federal, state and local officials, with their votes on related bills and office contact channels. Every figure links to its public filing.',
};

export default function AccountabilityPage() {
  return <AccountabilityView />;
}
