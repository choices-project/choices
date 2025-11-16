"use strict";

import {
  representativeStore,
  createInitialRepresentativeState
} from '@/lib/stores/representativeStore';
import type {
  Representative,
  RepresentativeListResponse
} from '@/types/representative';

jest.mock('@/lib/services/representative-service', () => {
  const findByLocation = jest.fn();
  const getRepresentativeById = jest.fn();

  return {
    representativeService: {
      findByLocation,
      getRepresentativeById,
      getRepresentatives: jest.fn(),
      followRepresentative: jest.fn(),
      unfollowRepresentative: jest.fn(),
      getUserRepresentatives: jest.fn(),
      checkFollowStatus: jest.fn()
    }
  };
});

jest.mock('@/features/civics/utils/divisions', () => ({
  getRepresentativeDivisionIds: jest.fn()
}));

jest.mock('@/lib/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

const { representativeService } = jest.requireMock(
  '@/lib/services/representative-service'
) as {
  representativeService: {
    findByLocation: jest.Mock;
    getRepresentativeById: jest.Mock;
  };
};

const { getRepresentativeDivisionIds } = jest.requireMock(
  '@/features/civics/utils/divisions'
) as {
  getRepresentativeDivisionIds: jest.Mock;
};

const baseRepresentative: Representative = {
  id: 42,
  name: 'Council Member Sample',
  party: 'Independent',
  office: 'City Council',
  level: 'local',
  state: 'WA',
  district: 'Seattle-05',
  data_quality_score: 92,
  verification_status: 'verified',
  data_sources: ['unit-test'],
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
  last_verified: '2025-01-01T00:00:00.000Z'
};

describe('representativeStore division normalisation', () => {
  beforeEach(() => {
    representativeStore.setState(createInitialRepresentativeState());
    jest.clearAllMocks();
  });

  it('collects user division ids from location lookups', async () => {
    const anotherRepresentative: Representative = {
      ...baseRepresentative,
      id: 99,
      name: 'State Senator Example',
      level: 'state',
      district: 'LD-11'
    };

    const response: RepresentativeListResponse = {
      success: true,
      data: {
        representatives: [baseRepresentative, anotherRepresentative],
        total: 2,
        page: 1,
        limit: 20,
        hasMore: false
      }
    };

    representativeService.findByLocation.mockResolvedValue(response);
    getRepresentativeDivisionIds
      .mockReturnValueOnce(['ocd-division/country:us/state:wa'])
      .mockReturnValueOnce([
        'ocd-division/country:us/state:wa',
        'ocd-division/country:us/state:wa/sldu:11'
      ]);

    await representativeStore.getState().findByLocation({ address: '123 Main St' });

    const state = representativeStore.getState();

    expect(state.representativeDivisions[42]).toEqual(['ocd-division/country:us/state:wa']);
    expect(state.representativeDivisions[99]).toEqual([
      'ocd-division/country:us/state:wa',
      'ocd-division/country:us/state:wa/sldu:11'
    ]);
    expect(getRepresentativeDivisionIds).toHaveBeenCalledTimes(2);
    expect(state.userDivisionIds.slice().sort()).toEqual(
      [
        'ocd-division/country:us/state:wa',
        'ocd-division/country:us/state:wa/sldu:11'
      ].sort()
    );
  });

  it('updates cached detail and divisions when fetching by id', async () => {
    const detailRepresentative: Representative = {
      ...baseRepresentative,
      id: 123,
      name: 'Representative Detail Test'
    };

    representativeService.getRepresentativeById.mockResolvedValue({
      success: true,
      data: detailRepresentative
    });
    getRepresentativeDivisionIds.mockReturnValue([
      'ocd-division/country:us/state:wa',
      'ocd-division/country:us/state:wa/cd:7'
    ]);

    const result = await representativeStore.getState().getRepresentativeById(123);
    const state = representativeStore.getState();

    // Result should be populated and state updated
    expect(state.currentRepresentativeId).toBe(123);
    expect(state.currentRepresentativeId).toBe(123);
    expect(state.detailCache[123]).toBeDefined();
    expect(getRepresentativeDivisionIds).toHaveBeenCalledWith(detailRepresentative);
  });
});


