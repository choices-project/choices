import { render, screen } from '@testing-library/react';

import { ElectionCountdownBadge } from '@/features/civics/components/countdown/ElectionCountdownBadge';
import type { CivicElection } from '@/types/civic';

// Mock useI18n
jest.mock('@/hooks/useI18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: { count?: number }) => {
      if (key === 'civics.countdown.badge.countdown.inDays' && params?.count) {
        return `In ${params.count} days`;
      }
      if (key === 'civics.countdown.badge.additional' && params?.count) {
        return `(+${params.count})`;
      }
      if (key === 'civics.countdown.badge.loading') {
        return 'Loading...';
      }
      if (key === 'civics.countdown.badge.error') {
        return 'Error';
      }
      if (key === 'civics.countdown.badge.empty') {
        return 'No elections';
      }
      return key;
    },
    currentLanguage: 'en',
  }),
}));

const buildElection = (overrides: Partial<CivicElection> = {}): CivicElection => ({
  election_id: overrides.election_id ?? 'election-1',
  name: overrides.name ?? 'School Board Election',
  election_day: overrides.election_day ?? '2025-03-15',
  division: overrides.division ?? 'ocd-division/country:us',
  timezone: overrides.timezone ?? 'America/Los_Angeles',
  ...overrides,
});

describe('ElectionCountdownBadge', () => {
  it('announces active countdowns with polite live region copy', () => {
    const nextElection = buildElection();

    render(
      <ElectionCountdownBadge
        nextElection={nextElection}
        daysUntil={5}
        totalUpcoming={3}
        showDate={false}
      />,
    );

    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('aria-live', 'polite');
    expect(badge).toHaveTextContent(nextElection.name);
    expect(badge).toHaveTextContent('In 5 days');
    expect(badge).toHaveTextContent('(+2)');
  });

  it('surfaces empty-state copy when no elections are present', () => {
    render(<ElectionCountdownBadge emptyMessage="No data" />);

    expect(screen.getByText('No data')).toBeInTheDocument();
  });
});


