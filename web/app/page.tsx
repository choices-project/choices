import { AccountabilityView } from '@/features/accountability/AccountabilityView';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Surveillance-industry money in politics',
  description:
    'Public record of political contributions from Axon (TASER) and Flock Safety to federal, state and local officials, with office contact channels and votes on related bills.',
};

/**
 * Public home is the compiled money-in-politics record plus office contact.
 * The previous marketing page remains at `/welcome`. `/accountability` is the same view.
 */
export default function RootPage() {
  return <AccountabilityView />;
}
