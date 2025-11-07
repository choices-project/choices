import { describe, expect, it } from '@jest/globals';

import { RankedStrategy } from '@/lib/vote/strategies/ranked';
import type { PollData, VoteData } from '@/lib/vote/types';

const createPoll = (): PollData => {
  const now = new Date();

  return {
    id: 'poll-1',
    title: 'Best Sci-Fi Franchise',
    description: 'Rank your favourite franchise.',
    votingMethod: 'ranked',
    options: [
      { id: 'opt-a', text: 'Star Wars' },
      { id: 'opt-b', text: 'Star Trek' },
      { id: 'opt-c', text: 'Battlestar Galactica' },
    ],
    status: 'active',
    createdBy: 'user-admin',
    createdAt: now,
    updatedAt: now,
    votingConfig: {},
    metadata: {},
  };
};

const createVote = (id: string, rankings: number[]): VoteData => ({
  id,
  pollId: 'poll-1',
  rankings,
  privacyLevel: 'public',
  timestamp: new Date(),
  auditReceipt: `${id}-receipt`,
});

describe('RankedStrategy', () => {
  const strategy = new RankedStrategy();
  const poll = createPoll();

  describe('validateVote', () => {
    it('accepts well-formed rankings', async () => {
      const validation = await strategy.validateVote(
        {
          pollId: poll.id,
          userId: 'user-123',
          voteData: { rankings: [0, 2] },
        },
        poll,
      );

      expect(validation).toMatchObject({ isValid: true, requiresAuthentication: true });
    });

    it('rejects missing rankings array', async () => {
      const validation = await strategy.validateVote(
        {
          pollId: poll.id,
          voteData: {},
        },
        poll,
      );

      expect(validation.isValid).toBe(false);
      expect(validation.error).toMatch(/Rankings array is required/i);
    });

    it('rejects duplicate rankings', async () => {
      const validation = await strategy.validateVote(
        {
          pollId: poll.id,
          voteData: { rankings: [0, 1, 1] },
        },
        poll,
      );

      expect(validation.isValid).toBe(false);
      expect(validation.error).toMatch(/Duplicate rankings/i);
    });

    it('rejects out-of-bounds rankings', async () => {
      const validation = await strategy.validateVote(
        {
          pollId: poll.id,
          voteData: { rankings: [0, 3] },
        },
        poll,
      );

      expect(validation.isValid).toBe(false);
      expect(validation.error).toMatch(/between 0 and 2/i);
    });

    it('rejects non-integer rankings', async () => {
      const validation = await strategy.validateVote(
        {
          pollId: poll.id,
          voteData: { rankings: [0, 1.5] },
        },
        poll,
      );

      expect(validation.isValid).toBe(false);
      expect(validation.error).toMatch(/valid integers/i);
    });
  });

  it('processes votes and returns ranked metadata', async () => {
    const response = await strategy.processVote(
      {
        pollId: poll.id,
        userId: 'user-42',
        voteData: { rankings: [1, 0, 2] },
        privacyLevel: 'public',
      },
      poll,
    );

    expect(response.success).toBe(true);
    expect(response.pollId).toBe(poll.id);
    expect(typeof response.voteId).toBe('string');
    expect(response.metadata?.rankedOptions).toEqual([
      { rank: 1, option: 'Star Trek' },
      { rank: 2, option: 'Star Wars' },
      { rank: 3, option: 'Battlestar Galactica' },
    ]);
  });

  it('calculates instant-runoff results with a majority winner', async () => {
    const votes: VoteData[] = [
      createVote('vote-1', [0, 1, 2]),
      createVote('vote-2', [1, 0, 2]),
      createVote('vote-3', [1, 2, 0]),
    ];

    const results = await strategy.calculateResults(poll, votes);

    expect(results.totalVotes).toBe(3);
    expect(results.results.winner).toBe('1');
    expect(results.results.instantRunoffRounds?.length).toBeGreaterThan(0);
    expect(results.results.optionVotes['1']).toBeGreaterThan(results.results.optionVotes['0']);
    expect(results.results.bordaScores?.['1']).toBeGreaterThan(0);
  });

  it('exposes configuration metadata', () => {
    const config = strategy.getConfiguration();

    expect(config).toMatchObject({
      name: 'Ranked Choice Voting',
      resultType: 'instant_runoff',
      requiresRanking: true,
    });
  });
});

