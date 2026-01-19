/**
 * Voting Store Confirmation & Undo Flow Tests
 * 
 * Tests for voting store confirmation and undo functionality:
 * - Vote confirmation flow
 * - Vote undo flow
 * - Error handling for confirmation/undo
 * 
 * Created: January 2025
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import {
  votingStore,
  type VotingRecord,
} from '@/lib/stores/votingStore';

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

const fetchMock = jest.fn<(...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>>();
global.fetch = fetchMock as typeof fetch;

const createVotingRecord = (overrides: Partial<VotingRecord> = {}): VotingRecord => ({
  id: 'record-1',
  ballotId: 'ballot-1',
  contestId: 'contest-1',
  selections: ['candidate-1'],
  votedAt: new Date().toISOString(),
  method: 'digital',
  verified: false,
  ...overrides,
});

describe('Voting Store Confirmation & Undo Flows', () => {
  const store = votingStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store.getState().reset();
    fetchMock.mockClear();
  });

  describe('Vote Confirmation', () => {
    it('confirms a vote successfully', async () => {
      const mockVotingRecord = createVotingRecord();

      store.getState().setVotingRecords([mockVotingRecord]);

      const confirmedRecord = {
        ...mockVotingRecord,
        verified: true,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => confirmedRecord,
      } as Response);

      await store.getState().confirmVote('record-1');

      const updatedRecord = store
        .getState()
        .votingRecords.find((r: VotingRecord) => r.id === 'record-1');
      expect(updatedRecord?.verified).toBe(true);
      expect(store.getState().isUpdating).toBe(false);
    });

    it('handles confirmation errors gracefully', async () => {
      const mockVotingRecord = createVotingRecord();

      store.getState().setVotingRecords([mockVotingRecord]);

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as Response);

      await expect(store.getState().confirmVote('record-1')).rejects.toThrow();

      expect(store.getState().error).toBeTruthy();
      expect(store.getState().isUpdating).toBe(false);
    });

    it('handles network errors during confirmation', async () => {
      const mockVotingRecord = createVotingRecord();

      store.getState().setVotingRecords([mockVotingRecord]);

      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(store.getState().confirmVote('record-1')).rejects.toThrow();

      expect(store.getState().error).toBeTruthy();
      expect(store.getState().isUpdating).toBe(false);
    });
  });

  describe('Vote Undo', () => {
    it('undoes a vote successfully', async () => {
      const mockVotingRecord = createVotingRecord();

      store.getState().setVotingRecords([mockVotingRecord]);

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Vote undone' }),
      } as Response);

      await store.getState().undoVote('record-1');

      const records = store.getState().votingRecords;
      expect(records.find((r: VotingRecord) => r.id === 'record-1')).toBeUndefined();
      expect(store.getState().isUpdating).toBe(false);
    });

    it('handles undo when API does not support undo (local fallback)', async () => {
      const mockVotingRecord = createVotingRecord();

      store.getState().setVotingRecords([mockVotingRecord]);

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 405,
        statusText: 'Method Not Allowed',
      } as Response);

      await store.getState().undoVote('record-1');

      // Should still remove locally as fallback
      const records = store.getState().votingRecords;
      expect(records.find((r: VotingRecord) => r.id === 'record-1')).toBeUndefined();
    });

    it('handles undo when record not found', async () => {
      store.getState().setVotingRecords([]);

      await expect(store.getState().undoVote('invalid-record')).rejects.toThrow('Vote record not found');

      expect(store.getState().error).toBeTruthy();
      expect(store.getState().isUpdating).toBe(false);
    });

    it('handles network errors during undo', async () => {
      const mockVotingRecord = createVotingRecord();

      store.getState().setVotingRecords([mockVotingRecord]);

      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(store.getState().undoVote('record-1')).rejects.toThrow();

      expect(store.getState().error).toBeTruthy();
      expect(store.getState().isUpdating).toBe(false);
    });
  });

  describe('Complete Vote Flow with Confirmation', () => {
    it('casts, confirms, and can undo a vote', async () => {
      // Cast vote
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () =>
          createVotingRecord({
            id: 'record-1',
            ballotId: 'ballot-1',
            contestId: 'contest-1',
            selections: ['candidate-1'],
          }),
      } as Response);

      await store.getState().castVote('ballot-1', 'contest-1', ['candidate-1']);

      expect(store.getState().votingRecords.length).toBeGreaterThan(0);

      // Confirm vote
      const firstRecord = store.getState().votingRecords[0];
      if (!firstRecord) {
        throw new Error('Expected a voting record after casting');
      }
      const recordId = firstRecord.id;
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...firstRecord,
          verified: true,
        }),
      } as Response);

      await store.getState().confirmVote(recordId);

      const confirmedRecord = store
        .getState()
        .votingRecords.find((r: VotingRecord) => r.id === recordId);
      expect(confirmedRecord?.verified).toBe(true);

      // Undo vote
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Vote undone' }),
      } as Response);

      await store.getState().undoVote(recordId);

      const records = store.getState().votingRecords;
      expect(records.find((r: VotingRecord) => r.id === recordId)).toBeUndefined();
    });
  });
});

