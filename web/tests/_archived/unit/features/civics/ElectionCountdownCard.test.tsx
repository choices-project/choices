import { render, screen } from '@testing-library/react';

import { ElectionCountdownCard } from '@/features/civics/components/countdown/ElectionCountdownCard';
import type { CivicElection } from '@/types/civic';

const buildElection = (overrides: Partial<CivicElection> = {}): CivicElection => ({
  election_id: overrides.election_id ?? `election-${Math.random()}`,
  name: overrides.name ?? 'General Election',
  election_day: overrides.election_day ?? '2025-11-05',
  ocd_division_id: overrides.ocd_division_id ?? 'ocd-division/country:us',
  fetched_at: overrides.fetched_at ?? new Date().toISOString(),
  ...overrides,
});

describe('ElectionCountdownCard', () => {
  it('renders loading state copy for screen readers', () => {
    render(
      <ElectionCountdownCard
        loading
        elections={[]}
        nextElection={null}
        daysUntilNextElection={null}
        totalUpcoming={0}
      />,
    );

    expect(
      screen.getByText(/Fetching the latest election calendar/i),
    ).toBeInTheDocument();
  });

  it('renders error state when provided', () => {
    render(
      <ElectionCountdownCard
        error="Unable to load elections"
        elections={[]}
        nextElection={null}
        daysUntilNextElection={null}
        totalUpcoming={0}
      />,
    );

    expect(screen.getByText('Unable to load elections')).toBeInTheDocument();
  });

  it('lists upcoming elections and shows badge data', () => {
    const elections = [
      buildElection({ election_id: 'primary', name: 'Primary', election_day: '2025-06-10' }),
      buildElection({ election_id: 'general', name: 'General', election_day: '2025-11-05' }),
    ];

    render(
      <ElectionCountdownCard
        title="Countdown"
        description="Key dates"
        elections={elections}
        nextElection={elections[0] ?? null}
        daysUntilNextElection={42}
        totalUpcoming={elections.length}
      />,
    );

    expect(screen.getByRole('region', { name: /countdown/i })).toBeInTheDocument();
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
    expect(screen.getAllByText('Primary').length).toBeGreaterThan(0);
    expect(screen.getAllByText('General').length).toBeGreaterThan(0);
  });

  it('shows empty state copy when no elections exist', () => {
    render(
      <ElectionCountdownCard
        elections={[]}
        nextElection={null}
        daysUntilNextElection={null}
        totalUpcoming={0}
        emptyMessage="No upcoming elections"
      />,
    );

    expect(screen.getByText('No upcoming elections')).toBeInTheDocument();
  });
});


