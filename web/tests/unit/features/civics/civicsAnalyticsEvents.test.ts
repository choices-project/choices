/**
 * @jest-environment node
 */
import { trackCivicsRepresentativeEvent } from '@/features/civics/analytics/civicsAnalyticsEvents';

describe('trackCivicsRepresentativeEvent', () => {
  it('emits follow toggle event with representative defaults', () => {
    const trackEvent = jest.fn();

    trackCivicsRepresentativeEvent(trackEvent, {
      type: 'civics_representative_follow_toggle',
      data: {
        representativeId: 42,
        representativeName: 'Alex Official',
        divisionIds: ['ocd-division/country:us/state:ca'],
        nextElectionId: '2026-ca-primary',
        nextElectionDay: '2026-06-05',
        electionCountdownDays: 45,
        source: 'unit_test',
        action: 'follow',
        previousFollowState: 'not_following',
      },
    });

    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'civics_representative_follow_toggle',
        action: 'follow_toggle',
        label: '42',
        value: 1,
        event_data: expect.objectContaining({
          representativeId: 42,
          action: 'follow',
          previousFollowState: 'not_following',
          electionCountdownDays: 45,
        }),
      }),
    );
  });

  it('falls back to first representative id for bulk events', () => {
    const trackEvent = jest.fn();

    trackCivicsRepresentativeEvent(trackEvent, {
      type: 'civics_representative_bulk_contact_send',
      value: 3,
      data: {
        representativeIds: [100, 101, 102],
        selectedRepresentativeIds: [100, 102],
        totalRepresentatives: 3,
        selectedCount: 2,
        divisionIds: ['ocd-division/country:us/state:ny'],
        successCount: 3,
        failureCount: 0,
        templateId: null,
      },
    });

    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'civics_representative_bulk_contact_send',
        action: 'bulk_contact_send',
        label: '100',
        value: 3,
        event_data: expect.objectContaining({
          representativeIds: [100, 101, 102],
          successCount: 3,
        }),
      }),
    );
  });
});


