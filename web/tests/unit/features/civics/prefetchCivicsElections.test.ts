import { prefetchElectionsForRepresentatives } from '@/features/civics/utils/prefetchCivicsElections';

import {
  buildElectionKey,
  createInitialElectionState,
  useElectionStore,
} from '@/lib/stores/electionStore';

describe('prefetchElectionsForRepresentatives', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    useElectionStore.setState(createInitialElectionState(), false);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('batch-fetches once and indexes per-representative keys', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            election_id: 'wa-primary',
            name: 'WA Primary',
            election_day: '2025-08-05',
            ocd_division_id: 'ocd-division/country:us/state:wa',
          },
          {
            election_id: 'or-general',
            name: 'OR General',
            election_day: '2025-11-04',
            ocd_division_id: 'ocd-division/country:us/state:or',
          },
        ],
      }),
    });

    await prefetchElectionsForRepresentatives([
      { metadata: { division_ids: ['ocd-division/country:us/state:wa'] } },
      { metadata: { division_ids: ['ocd-division/country:us/state:or'] } },
    ]);

    expect(global.fetch).toHaveBeenCalledTimes(1);

    const state = useElectionStore.getState();
    const waKey = buildElectionKey(['ocd-division/country:us/state:wa']);
    const orKey = buildElectionKey(['ocd-division/country:us/state:or']);

    expect(state.electionsByKey[waKey]).toHaveLength(1);
    expect(state.electionsByKey[orKey]).toHaveLength(1);
  });
});
