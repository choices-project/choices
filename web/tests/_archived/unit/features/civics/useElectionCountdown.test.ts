/** @jest-environment jsdom */

import { renderHook, waitFor } from '@testing-library/react';

import { useElectionCountdown } from '@/features/civics/utils/civicsCountdownUtils';
import {
  createInitialAnalyticsState,
  useAnalyticsStore,
} from '@/lib/stores/analyticsStore';
import { useElectionStore } from '@/lib/stores/electionStore';
import { notificationStoreUtils } from '@/lib/stores/notificationStore';

describe('useElectionCountdown', () => {
  const mockNow = new Date('2025-01-01T00:00:00Z').getTime();

  const divisionId = 'ocd-division/country:us/state:ca';
  const key = divisionId;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockNow);
    const upcomingDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    useElectionStore.setState({
      electionsByKey: {
        [key]: [
          {
            election_id: '2026-ca-primary',
            election_day: upcomingDate,
            name: 'California Primary',
            ocd_division_id: divisionId,
            fetched_at: new Date().toISOString(),
          }
        ]
      },
      isLoading: false,
      error: null
    });

    useAnalyticsStore.setState((state) => {
      const initial = createInitialAnalyticsState();
      return {
        ...state,
        ...initial,
        trackingEnabled: true,
        preferences: {
          ...initial.preferences,
          trackingEnabled: true,
        },
      };
    });
  });

  afterEach(() => {
    useElectionStore.setState({
      electionsByKey: {},
      isLoading: false,
      error: null
    });
    jest.useRealTimers();
    useAnalyticsStore.setState((state) => {
      const initial = createInitialAnalyticsState();
      return {
        ...state,
        ...initial,
        trackingEnabled: true,
        preferences: {
          ...initial.preferences,
          trackingEnabled: true,
        },
      };
    });
  });

  it('creates election notifications when notify is enabled', async () => {
    const notificationSpy = jest
      .spyOn(notificationStoreUtils, 'createElectionNotification')
      .mockImplementation(() => undefined);

    const { rerender, unmount } = renderHook(
      (props: { divisions: string[]; options: Parameters<typeof useElectionCountdown>[1] }) =>
        useElectionCountdown(props.divisions, props.options),
      {
        initialProps: {
          divisions: [divisionId],
          options: {
            autoFetch: false,
            clearOnEmpty: false,
            notify: true,
            notificationSource: 'notification-center',
            notificationThresholdDays: 10,
            representativeNames: ['Alex Official']
          }
        }
      }
    );

    await waitFor(() => {
      expect(useElectionStore.getState().electionsByKey[key]?.length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(notificationSpy).toHaveBeenCalledTimes(1);
      expect(notificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          electionId: '2026-ca-primary',
          divisionId,
          representativeNames: ['Alex Official'],
          source: 'notification-center'
        })
      );
    });

    notificationSpy.mockClear();
    rerender({
      divisions: [divisionId],
      options: {
        autoFetch: false,
        clearOnEmpty: false,
        notify: true,
        notificationSource: 'notification-center',
        notificationThresholdDays: 10,
        representativeNames: ['Alex Official']
      }
    });

    await waitFor(() => {
      expect(notificationSpy).not.toHaveBeenCalled();
    });

    unmount();
    notificationSpy.mockRestore();
  });

  it('tracks analytics exposure when analytics options provided', async () => {
    const trackSpy = jest
      .spyOn(useAnalyticsStore.getState(), 'trackEvent')
      .mockImplementation(() => undefined);

    const { rerender, unmount, result } = renderHook(
      (props: { divisions: string[]; options: Parameters<typeof useElectionCountdown>[1] }) =>
        useElectionCountdown(props.divisions, props.options),
      {
        initialProps: {
          divisions: [divisionId],
          options: {
            autoFetch: false,
            analytics: {
              surface: 'test-surface',
              metadata: {
                foo: 'bar',
              },
            },
          },
        },
      },
    );

    await waitFor(() => {
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'civics.election.countdown.view',
          event_data: expect.objectContaining({
            surface: 'test-surface',
            foo: 'bar',
          }),
        }),
      );
    });

    expect(result.current.nextElection?.election_id).toBe('2026-ca-primary');

    // Ensure the event does not duplicate on re-render with same election
    rerender({
      divisions: [divisionId],
      options: {
        autoFetch: false,
        analytics: {
          surface: 'test-surface',
          metadata: {
            foo: 'bar',
          },
        },
      },
    });

    expect(trackSpy).toHaveBeenCalledTimes(1);

    unmount();

    trackSpy.mockRestore();
  });
});


