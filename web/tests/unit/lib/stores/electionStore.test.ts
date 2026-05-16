import {
  buildElectionKey,
  createInitialElectionState,
  useElectionStore,
} from '@/lib/stores/electionStore';

const mockElections = [
  {
    election_id: '2025-11-04-primary',
    name: '2025 Washington Primary',
    election_day: '2025-08-05',
    ocd_division_id: 'ocd-division/country:us/state:wa',
    fetched_at: '2025-11-13T00:00:00.000Z',
  },
  {
    election_id: '2025-11-04-general',
    name: '2025 Oregon General',
    election_day: '2025-11-04',
    ocd_division_id: 'ocd-division/country:us/state:or',
    fetched_at: '2025-11-13T00:00:00.000Z',
  },
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
      json: async () => ({ data: mockElections }),
    });

    const result = await useElectionStore
      .getState()
      .fetchElectionsForDivisions(['  OCD-DIVISION/COUNTRY:US/state:WA  ']);

    const state = useElectionStore.getState();
    const key = buildElectionKey(['ocd-division/country:us/state:wa']);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockElections);
    expect(state.electionsByKey[key]).toEqual(mockElections);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('dedupes concurrent fetches for the same division key', async () => {
    let resolveJson: (value: unknown) => void = () => {};
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveJson = (payload) => resolve({ ok: true, json: async () => payload });
        }),
    );

    const divisions = ['ocd-division/country:us/state:wa'];
    const first = useElectionStore.getState().fetchElectionsForDivisions(divisions);
    const second = useElectionStore.getState().fetchElectionsForDivisions(divisions);

    resolveJson({ data: mockElections.slice(0, 1) });
    const [a, b] = await Promise.all([first, second]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
  });

  it('returns cached elections without calling the API again', async () => {
    const key = buildElectionKey(['ocd-division/country:us/state:wa']);
    useElectionStore.setState(
      {
        ...createInitialElectionState(),
        electionsByKey: { [key]: mockElections.slice(0, 1) },
      },
      false,
    );

    const result = await useElectionStore
      .getState()
      .fetchElectionsForDivisions(['ocd-division/country:us/state:wa']);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result).toEqual(mockElections.slice(0, 1));
  });

  it('indexes elections for per-representative division groups', () => {
    useElectionStore.getState().indexElectionsForDivisionGroups(
      [
        ['ocd-division/country:us/state:wa'],
        ['ocd-division/country:us/state:or'],
      ],
      mockElections,
    );

    const state = useElectionStore.getState();
    expect(state.electionsByKey[buildElectionKey(['ocd-division/country:us/state:wa'])]).toEqual([
      mockElections[0],
    ]);
    expect(state.electionsByKey[buildElectionKey(['ocd-division/country:us/state:or'])]).toEqual([
      mockElections[1],
    ]);
  });

  it('records per-key error state when the API request fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    const divisions = ['ocd-division/country:us/state:or'];
    const result = await useElectionStore.getState().fetchElectionsForDivisions(divisions);

    const state = useElectionStore.getState();
    const key = buildElectionKey(divisions);

    expect(result).toEqual([]);
    expect(state.electionsByKey[key]).toBeUndefined();
    expect(state.errorsByKey[key]).toBe('Failed to fetch elections');
    expect(state.isLoading).toBe(false);
  });
});
