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
  const getRepresentatives = jest.fn();
  const getRepresentativeById = jest.fn();

  return {
    representativeService: {
      findByLocation,
      getRepresentatives,
      getRepresentativeById,
      followRepresentative: jest.fn(),
      unfollowRepresentative: jest.fn(),
      getUserRepresentatives: jest.fn()
    }
  };
});

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
    getRepresentatives: jest.Mock;
    getRepresentativeById: jest.Mock;
  };
};

describe('representativeStore findByLocation', () => {
  const mockRepresentative: Representative = {
    id: 2001,
    name: 'Council Member Jane Example',
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

  beforeEach(() => {
    representativeStore.setState(createInitialRepresentativeState());
    jest.clearAllMocks();
  });

  it('hydrates locationRepresentatives on successful lookup', async () => {
    const response: RepresentativeListResponse = {
      success: true,
      data: {
        representatives: [mockRepresentative],
        total: 1,
        page: 1,
        limit: 20,
        hasMore: false
      }
    };

    representativeService.findByLocation.mockResolvedValue(response);

    await representativeStore.getState().findByLocation({ address: '123 Main St' });

    const state = representativeStore.getState();

    expect(representativeService.findByLocation).toHaveBeenCalledWith({ address: '123 Main St' });
    expect(state.locationRepresentatives).toEqual([mockRepresentative]);
    expect(state.error).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('records error state when lookup fails', async () => {
    representativeService.findByLocation.mockResolvedValue({
      success: false,
      error: 'Lookup failed',
      data: {
        representatives: [],
        total: 0,
        page: 1,
        limit: 20,
        hasMore: false
      }
    });

    await representativeStore.getState().findByLocation({ address: 'bad address' });

    const state = representativeStore.getState();

    expect(state.locationRepresentatives).toHaveLength(0);
    expect(state.error).toBe('Lookup failed');
    expect(state.isLoading).toBe(false);
  });
});

