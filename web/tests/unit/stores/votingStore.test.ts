import { createStore } from 'zustand/vanilla';

import type {
  Ballot,
  VotingRecord,
  VotingSlice,
  VotingState,
} from '@/lib/stores/votingStore';
import {
  createInitialVotingSlice,
  createVotingStoreState,
} from '@/lib/stores/votingStore';

const createTestVotingStore = (initial?: Partial<VotingSlice>) =>
  createStore<VotingState>()((set, get) => createVotingStoreState(set, get, initial));

const createBallot = (overrides: Partial<Ballot> = {}): Ballot => ({
  id: 'ballot-1',
  electionId: 'election-1',
  title: 'City Council Election',
  description: 'Vote for your preferred candidates.',
  type: 'general',
  date: new Date('2025-11-10T12:00:00Z').toISOString(),
  deadline: new Date('2025-11-10T18:00:00Z').toISOString(),
  status: 'active',
  contests: [],
  metadata: {
    jurisdiction: 'Cityville',
    district: 'District 9',
    turnout: 0,
    totalVoters: 0,
  },
  ...overrides,
});

const createVotingRecord = (overrides: Partial<VotingRecord> = {}): VotingRecord => ({
  id: 'record-1',
  ballotId: 'ballot-1',
  contestId: 'contest-1',
  selections: ['candidate-1'],
  votedAt: new Date('2025-11-10T12:30:00Z').toISOString(),
  method: 'digital',
  verified: true,
  location: undefined,
  receipt: undefined,
  ...overrides,
});

describe('votingStore', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('uses shared base actions for loading and error state', () => {
    const store = createTestVotingStore();

    store.getState().setLoading(true);
    expect(store.getState().isLoading).toBe(true);

    store.getState().setError('Something went wrong');
    expect(store.getState().error).toBe('Something went wrong');

    store.getState().clearError();
    expect(store.getState().error).toBeNull();
  });

  it('reset restores initial slice state', () => {
    const store = createTestVotingStore();
    const ballot = createBallot();

    store.getState().setBallots([ballot]);
    store.getState().setVoting(true);
    store.getState().setLoading(true);
    store.getState().setError('failed');

    store.getState().reset();

    const expected = createInitialVotingSlice();
    const state = store.getState();

    expect(state.ballots).toEqual(expected.ballots);
    expect(state.isVoting).toBe(expected.isVoting);
    expect(state.isLoading).toBe(expected.isLoading);
    expect(state.error).toBeNull();
  });

  it('castVote toggles voting flag and appends record on success', async () => {
    const store = createTestVotingStore();
    const votingRecord = createVotingRecord();

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => votingRecord,
    } as Response);

    await store.getState().castVote('ballot-1', 'contest-1', ['candidate-1']);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(store.getState().isVoting).toBe(false);
    expect(store.getState().error).toBeNull();
    expect(store.getState().votingRecords[0]).toMatchObject({
      id: votingRecord.id,
      selections: votingRecord.selections,
    });
  });

  it('castVote surfaces errors and clears voting flag on failure', async () => {
    const store = createTestVotingStore();

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);

    await expect(
      store.getState().castVote('ballot-1', 'contest-1', ['candidate-1']),
    ).rejects.toThrow('Failed to cast vote');

    expect(store.getState().isVoting).toBe(false);
    expect(store.getState().error).toBe('Failed to cast vote');
  });

  it('updateVote updates record selections and resets flags', async () => {
    const existingRecord = createVotingRecord();
    const store = createTestVotingStore({
      votingRecords: [existingRecord],
    });

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    await store.getState().updateVote(existingRecord.id, ['candidate-2']);

    expect(fetchSpy).toHaveBeenCalledWith(
      `/api/voting/records/${existingRecord.id}`,
      expect.objectContaining({
        method: 'PUT',
      }),
    );
    expect(store.getState().isVoting).toBe(false);
    expect(store.getState().error).toBeNull();
    expect(store.getState().votingRecords[0].selections).toEqual(['candidate-2']);
  });

  it('cancelVote removes record and clears flags', async () => {
    const existingRecord = createVotingRecord();
    const store = createTestVotingStore({
      votingRecords: [existingRecord],
    });

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
    } as Response);

    await store.getState().cancelVote(existingRecord.id);

    expect(fetchSpy).toHaveBeenCalledWith(
      `/api/voting/records/${existingRecord.id}`,
      expect.objectContaining({
        method: 'DELETE',
      }),
    );
    expect(store.getState().isVoting).toBe(false);
    expect(store.getState().error).toBeNull();
    expect(store.getState().votingRecords).toHaveLength(0);
  });

  it('registerTimer and clearTimer manage tracked intervals and reset clears them', () => {
    jest.useFakeTimers();
    const store = createTestVotingStore();
    const clearSpy = jest.spyOn(global, 'clearInterval');

    const handleOne = setInterval(() => {}, 1000);
    const timerId = store.getState().registerTimer(handleOne);
    expect(store.getState().timerHandles[timerId]).toBe(handleOne);

    store.getState().clearTimer(timerId);
    expect(clearSpy).toHaveBeenCalledWith(handleOne);
    expect(store.getState().timerHandles[timerId]).toBeUndefined();

    const handleTwo = setInterval(() => {}, 1000);
    store.getState().registerTimer(handleTwo);
    store.getState().reset();

    expect(clearSpy).toHaveBeenCalledWith(handleTwo);
    expect(Object.keys(store.getState().timerHandles)).toHaveLength(0);

    clearInterval(handleOne);
    clearInterval(handleTwo);
    clearSpy.mockRestore();
  });

  it('submitBallot appends record on success and clears voting flag', async () => {
    const store = createTestVotingStore();
    const votingRecord = createVotingRecord({ id: 'record-submit' });

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => votingRecord,
    } as Response);

    await store.getState().submitBallot('ballot-1', { contest: ['selection'] });

    expect(store.getState().isVoting).toBe(false);
    expect(store.getState().votingRecords[0].id).toBe('record-submit');
  });

  it('submitBallot surfaces errors and resets flags', async () => {
    const store = createTestVotingStore();

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);

    await expect(
      store.getState().submitBallot('ballot-1', { contest: ['selection'] }),
    ).rejects.toThrow('Failed to submit ballot');

    expect(store.getState().isVoting).toBe(false);
    expect(store.getState().error).toBe('Failed to submit ballot');
  });

  it('clearAllTimers clears intervals even when none are registered', () => {
    jest.useFakeTimers();
    const store = createTestVotingStore();
    expect(() => store.getState().clearAllTimers()).not.toThrow();
    jest.useRealTimers();
  });
});

