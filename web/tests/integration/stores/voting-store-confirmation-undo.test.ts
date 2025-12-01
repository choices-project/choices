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
  votingStoreCreator,
  useVotingStore,
} from '@/lib/stores/votingStore';

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn() as jest.Mock;

describe('Voting Store Confirmation & Undo Flows', () => {
  let store: ReturnType<typeof votingStoreCreator>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = votingStoreCreator();
    store.getState().reset();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Vote Confirmation', () => {
    it('confirms a vote successfully', async () => {
      const mockVotingRecord = {
        id: 'record-1',
        ballotId: 'ballot-1',
        contestId: 'contest-1',
        selections: ['candidate-1'],
        confirmed: false,
        submittedAt: new Date().toISOString(),
      };

      store.getState().setVotingRecords([mockVotingRecord]);

      const confirmedRecord = {
        ...mockVotingRecord,
        confirmed: true,
        confirmedAt: new Date().toISOString(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => confirmedRecord,
      });

      await store.getState().confirmVote('record-1');

      const updatedRecord = store.getState().votingRecords.find((r) => r.id === 'record-1');
      expect(updatedRecord?.confirmed).toBe(true);
      expect(store.getState().isUpdating).toBe(false);
    });

    it('handles confirmation errors gracefully', async () => {
      const mockVotingRecord = {
        id: 'record-1',
        ballotId: 'ballot-1',
        contestId: 'contest-1',
        selections: ['candidate-1'],
        confirmed: false,
        submittedAt: new Date().toISOString(),
      };

      store.getState().setVotingRecords([mockVotingRecord]);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(store.getState().confirmVote('record-1')).rejects.toThrow();

      expect(store.getState().error).toBeTruthy();
      expect(store.getState().isUpdating).toBe(false);
    });

    it('handles network errors during confirmation', async () => {
      const mockVotingRecord = {
        id: 'record-1',
        ballotId: 'ballot-1',
        contestId: 'contest-1',
        selections: ['candidate-1'],
        confirmed: false,
        submittedAt: new Date().toISOString(),
      };

      store.getState().setVotingRecords([mockVotingRecord]);

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(store.getState().confirmVote('record-1')).rejects.toThrow();

      expect(store.getState().error).toBeTruthy();
      expect(store.getState().isUpdating).toBe(false);
    });
  });

  describe('Vote Undo', () => {
    it('undoes a vote successfully', async () => {
      const mockVotingRecord = {
        id: 'record-1',
        ballotId: 'ballot-1',
        contestId: 'contest-1',
        selections: ['candidate-1'],
        submittedAt: new Date().toISOString(),
      };

      store.getState().setVotingRecords([mockVotingRecord]);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Vote undone' }),
      });

      await store.getState().undoVote('record-1');

      const records = store.getState().votingRecords;
      expect(records.find((r) => r.id === 'record-1')).toBeUndefined();
      expect(store.getState().isUpdating).toBe(false);
    });

    it('handles undo when API does not support undo (local fallback)', async () => {
      const mockVotingRecord = {
        id: 'record-1',
        ballotId: 'ballot-1',
        contestId: 'contest-1',
        selections: ['candidate-1'],
        submittedAt: new Date().toISOString(),
      };

      store.getState().setVotingRecords([mockVotingRecord]);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 405,
        statusText: 'Method Not Allowed',
      });

      await store.getState().undoVote('record-1');

      // Should still remove locally as fallback
      const records = store.getState().votingRecords;
      expect(records.find((r) => r.id === 'record-1')).toBeUndefined();
    });

    it('handles undo when record not found', async () => {
      store.getState().setVotingRecords([]);

      await expect(store.getState().undoVote('invalid-record')).rejects.toThrow('Vote record not found');

      expect(store.getState().error).toBeTruthy();
      expect(store.getState().isUpdating).toBe(false);
    });

    it('handles network errors during undo', async () => {
      const mockVotingRecord = {
        id: 'record-1',
        ballotId: 'ballot-1',
        contestId: 'contest-1',
        selections: ['candidate-1'],
        submittedAt: new Date().toISOString(),
      };

      store.getState().setVotingRecords([mockVotingRecord]);

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(store.getState().undoVote('record-1')).rejects.toThrow();

      expect(store.getState().error).toBeTruthy();
      expect(store.getState().isUpdating).toBe(false);
    });
  });

  describe('Complete Vote Flow with Confirmation', () => {
    it('casts, confirms, and can undo a vote', async () => {
      // Cast vote
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'record-1',
          ballotId: 'ballot-1',
          contestId: 'contest-1',
          selections: ['candidate-1'],
          submittedAt: new Date().toISOString(),
        }),
      });

      await store.getState().castVote('ballot-1', 'contest-1', ['candidate-1']);

      expect(store.getState().votingRecords.length).toBeGreaterThan(0);

      // Confirm vote
      const recordId = store.getState().votingRecords[0].id;
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...store.getState().votingRecords[0],
          confirmed: true,
          confirmedAt: new Date().toISOString(),
        }),
      });

      await store.getState().confirmVote(recordId);

      const confirmedRecord = store.getState().votingRecords.find((r) => r.id === recordId);
      expect(confirmedRecord?.confirmed).toBe(true);

      // Undo vote
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Vote undone' }),
      });

      await store.getState().undoVote(recordId);

      const records = store.getState().votingRecords;
      expect(records.find((r) => r.id === recordId)).toBeUndefined();
    });
  });
});

