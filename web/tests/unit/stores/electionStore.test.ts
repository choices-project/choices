"use strict";

import {
  useElectionStore,
  createInitialElectionState
} from '@/lib/stores/electionStore';

const mockElections = [
  {
    election_id: '2025-11-04-primary',
    name: '2025 Washington Primary',
    election_day: '2025-08-05',
    ocd_division_id: 'ocd-division/country:us/state:wa',
    fetched_at: '2025-11-13T00:00:00.000Z'
  }
];

describe('electionStore', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    useElectionStore.setState(createInitialElectionState(), false);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('fetches and caches elections keyed by normalized divisions', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockElections })
    });

    const result = await useElectionStore
      .getState()
      .fetchElectionsForDivisions(['  OCD-DIVISION/COUNTRY:US/state:WA  ']);

    const state = useElectionStore.getState();
    const key = 'ocd-division/country:us/state:wa';

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/civics/elections?divisions=++OCD-DIVISION%2FCOUNTRY%3AUS%2Fstate%3AWA++'
    );
    expect(result).toEqual(mockElections);
    expect(state.electionsByKey[key]).toEqual(mockElections);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('normalizes blank division arrays without calling the API', async () => {
    const result = await useElectionStore.getState().fetchElectionsForDivisions([' ', '']);

    const state = useElectionStore.getState();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result).toEqual([]);
    expect(state.electionsByKey['']).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('records error state when the API request fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({})
    });

    const result = await useElectionStore
      .getState()
      .fetchElectionsForDivisions(['ocd-division/country:us/state:or']);

    const state = useElectionStore.getState();
    const key = 'ocd-division/country:us/state:or';

    expect(result).toEqual([]);
    expect(state.electionsByKey[key]).toBeUndefined();
    expect(state.error).toBe('Failed to fetch elections');
    expect(state.isLoading).toBe(false);
  });

  it('clears cached elections and resets error state', () => {
    useElectionStore.setState(
      {
        electionsByKey: {
          'ocd-division/country:us/state:wa': mockElections
        },
        isLoading: false,
        error: 'previous error'
      },
      false
    );

    useElectionStore.getState().clearElections();

    const state = useElectionStore.getState();

    expect(state.electionsByKey).toEqual({});
    expect(state.error).toBeNull();
  });
});


