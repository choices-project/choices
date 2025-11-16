import { render, screen, waitFor } from '@testing-library/react';

import CivicsLure from '@/features/civics/components/CivicsLure';
import ScreenReaderSupport from '@/lib/accessibility/screen-reader';

jest.mock('@/hooks/useI18n', () => ({
  useI18n: () => {
    const translations: Record<string, (params?: Record<string, unknown>) => string> = {
      'civics.lure.header.title': () => 'Stay civically ready',
      'civics.lure.header.subtitle': () => 'Handle your district',
      'civics.lure.location.label': () => 'Your Area:',
      'civics.lure.live.locationUpdated': ({ location }) => `Civic insights updated for ${location}.`,
      'civics.lure.live.representativesLoaded': ({ count }) =>
        `${count as number} representatives synced.`,
      'civics.lure.live.nextElection': ({ name, count }) =>
        `Next election ${name as string} in ${count as number} days.`,
      'civics.lure.cta.button': () => 'See All My Local Candidates',
      'civics.lure.cta.caption': () => 'Make your voice heard',
      'civics.lure.electionCard.title': () => 'Election calendar',
      'civics.lure.electionCard.description': () => 'Key dates across your divisions.',
      'civics.lure.electionCard.ariaLabel': () => 'Upcoming elections for your divisions',
      'civics.lure.stats.candidates.title': () => 'Local Candidates',
      'civics.lure.stats.candidates.caption': ({ formattedCount }) =>
        `${formattedCount as string} representatives connected`,
      'civics.lure.stats.activities.title': () => 'Active Issues',
      'civics.lure.stats.activities.caption': () => 'Civic updates logged for your district',
      'civics.lure.stats.following.title': () => 'Your Voice',
      'civics.lure.stats.following.caption': () => 'Representatives you’re tracking',
      'civics.lure.stats.election.title': () => 'Next Election',
      'civics.lure.stats.election.addAddress': () => 'Add your address to see district elections.',
      'civics.lure.stats.election.badge.empty': () => 'No elections recorded for your divisions.',
      'civics.lure.stats.election.badge.loading': () => 'Checking…',
      'civics.lure.stats.election.badge.error': () => 'Election data unavailable',
      'civics.lure.stats.election.future': ({ formattedCount, count }) =>
        `Next election is in ${formattedCount as string} ${
          (count as number) === 1 ? 'day' : 'days'
        }.`,
      'civics.lure.candidates.section.title': () => 'Your Local Candidates',
      'civics.lure.candidates.section.subtitle': () => 'Explore the people representing you.',
      'civics.lure.candidates.challengerBadge': () => 'Challenger',
      'civics.lure.candidates.dataQualityBadge': ({ value }) => `${value as string}% data quality`,
      'civics.lure.candidates.verification.verified': () => 'Verified record',
      'civics.lure.candidates.verification.failed': () => 'Verification issues',
      'civics.lure.candidates.verification.pending': () => 'Awaiting verification',
      'civics.lure.candidates.partyIndependent': () => 'Independent',
      'civics.lure.candidates.level.unknown': () => 'Local',
      'civics.lure.candidates.officeFallback': ({ level }) => `${level as string} district`,
      'civics.lure.candidates.activity.lastUpdate': ({ date }) => `Last update on ${date as string}`,
      'civics.lure.candidates.activity.none': () => 'No recent civic activity recorded',
      'civics.lure.engagement.didYouKnow.title': () => 'Did you know?',
      'civics.lure.engagement.didYouKnow.fallback': () =>
        'We highlight responsive representatives soon.',
      'civics.lure.engagement.didYouKnow.highlight': ({ name, score }) =>
        `${name as string} score is ${score as string}`,
      'civics.lure.engagement.dataQualityWatch.title': () => 'Data Quality Watch',
      'civics.lure.engagement.dataQualityWatch.fallback': () =>
        'We will alert you if anything needs attention.',
      'civics.lure.engagement.dataQualityWatch.highlight': ({ name, score }) =>
        `${name as string} limited verification (${score as string})`,
    };

    const t = (key: string, params?: Record<string, unknown>) => {
      const entry = translations[key];
      if (entry) {
        return entry(params);
      }
      if (params?.count && typeof params.count === 'number') {
        return `${key} ${params.count}`;
      }
      return key;
    };

    return {
      t,
      currentLanguage: 'en',
    };
  },
}));

jest.mock('@/lib/stores', () => ({
  useUserCurrentAddress: () => null,
  useUserRepresentatives: () => [],
  useAnalyticsActions: () => ({ trackEvent: jest.fn() }),
}));

const mockFindByLocation = jest.fn();

jest.mock('@/lib/stores/representativeStore', () => ({
  useFindByLocation: () => mockFindByLocation,
  useLocationRepresentatives: () => [
    {
      id: 'rep-1',
      name: 'Representative One',
      office: 'Mayor',
      level: 'city',
      party: 'Progressive',
      activities: [{ title: 'Hosted town hall', date: '2025-05-01' }],
      data_quality_score: 92,
      verification_status: 'verified',
      ocdDivisionIds: ['ocd-division/country:us/state:ca/place:san_francisco'],
    },
  ],
  useRepresentativeError: () => null,
  useRepresentativeGlobalLoading: () => false,
}));

jest.mock('@/features/civics/utils/civicsCountdownUtils', () => {
  const actual = jest.requireActual('@/features/civics/utils/civicsCountdownUtils');
  return {
    ...actual,
    useElectionCountdown: () => ({
      elections: [
        { election_id: 'primary', election_day: '2025-06-10', name: 'Primary election' },
      ],
      nextElection: { election_id: 'primary', election_day: '2025-06-10', name: 'Primary election' },
      daysUntilNextElection: 42,
      loading: false,
      error: null,
    }),
  };
});

jest.mock('@/lib/accessibility/screen-reader', () => ({
  __esModule: true,
  default: {
    announce: jest.fn(),
  },
}));

describe('CivicsLure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindByLocation.mockResolvedValue({ success: true });
  });

  it('announces location changes and renders election countdown copy', async () => {
    const announceSpy = ScreenReaderSupport.announce as jest.Mock;
    render(<CivicsLure userLocation="San Francisco, CA" onEngage={jest.fn()} />);

    await waitFor(() =>
      expect(announceSpy).toHaveBeenCalledWith(
        expect.stringContaining('San Francisco, CA'),
        'polite',
      ),
    );
    await waitFor(() => {
      const liveText = screen.getByTestId('civics-lure-live-message').textContent ?? '';
      expect(liveText.trim().length).toBeGreaterThan(0);
    });

    expect(screen.getByText(/Election calendar/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /See All My Local Candidates/i })).toBeVisible();
  });

  it('announces upcoming election when countdown updates', async () => {
    const announceSpy = ScreenReaderSupport.announce as jest.Mock;
    render(<CivicsLure userLocation="San Francisco, CA" onEngage={jest.fn()} />);

    await waitFor(() =>
      expect(announceSpy).toHaveBeenCalledWith(expect.stringContaining('Next election'), 'polite'),
    );
  });
});


