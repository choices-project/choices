import { render, screen } from '@testing-library/react';

import { ElectionCountdownBadge } from '@/features/civics/components/countdown/ElectionCountdownBadge';
import type { CivicElection } from '@/types/civic';

const buildElection = (overrides: Partial<CivicElection> = {}): CivicElection => ({
  election_id: overrides.election_id ?? 'election-1',
  name: overrides.name ?? 'School Board Election',
  election_day: overrides.election_day ?? '2025-03-15',
  ocd_division_id: overrides.ocd_division_id ?? 'ocd-division/country:us',
  fetched_at: overrides.fetched_at ?? new Date().toISOString(),
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


