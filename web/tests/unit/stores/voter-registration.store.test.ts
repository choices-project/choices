import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import {
  createInitialVoterRegistrationState,
  voterRegistrationStoreCreator,
  type VoterRegistrationStore,
  type VoterRegistrationResource,
} from '@/lib/stores/voterRegistrationStore';

const createTestStore = () => create<VoterRegistrationStore>()(immer(voterRegistrationStoreCreator));

const originalFetch = global.fetch;

describe('voterRegistrationStore', () => {
  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = originalFetch;
  });

  it('initializes with default state', () => {
    const store = createTestStore();
    expect(store.getState()).toMatchObject(createInitialVoterRegistrationState());
  });

  it('fetches and caches voter registration resources', async () => {
    const resource: VoterRegistrationResource = {
      state_code: 'CA',
      election_office_name: 'California Secretary of State',
      online_url: 'https://registertovote.ca.gov/',
      mail_form_url: null,
      mailing_address: null,
      status_check_url: null,
      special_instructions: null,
      sources: ['manual'],
      metadata: null,
      last_verified: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: resource }),
    } as Response);

    const store = createTestStore();
    const result = await store.getState().fetchRegistrationForState('ca');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual(resource);
    expect(store.getState().resourcesByState['CA']).toEqual(resource);

    (global.fetch as jest.Mock).mockClear();
    const cached = await store.getState().fetchRegistrationForState('CA');
    expect(global.fetch).not.toHaveBeenCalled();
    expect(cached).toEqual(resource);
  });

  it('handles fetch errors gracefully', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({}),
    } as Response);

    const store = createTestStore();
    const result = await store.getState().fetchRegistrationForState('ny');
    expect(result).toBeNull();
    expect(store.getState().error).toBe('Failed to fetch voter registration resources');
    expect(store.getState().resourcesByState['NY']).toBeNull();
  });

  it('rejects empty state codes', async () => {
    const store = createTestStore();
    const result = await store.getState().fetchRegistrationForState('');
    expect(result).toBeNull();
    expect(store.getState().error).toBe('State code is required to fetch voter registration resources.');
  });
});


