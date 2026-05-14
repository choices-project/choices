/**
 * @jest-environment node
 *
 * Unit tests for the shared voting-method normalizer. This is the canonical
 * mapping between every stored or sent voting-method alias and the four
 * canonical values used throughout the polls API. Every API route that
 * branches on voting method routes through these helpers, so coverage here
 * protects every poll feature in the app.
 */

import {
  CANONICAL_VOTING_METHODS,
  isRankedVotingMethod,
  normalizeVotingMethod,
  selectPollTotalVotes,
} from './voting-methods';

describe('normalizeVotingMethod', () => {
  it.each([
    ['single', 'single'],
    ['single_choice', 'single'],
    ['SINGLE_CHOICE', 'single'],
    ['Single', 'single'],
  ])('normalizes %s to single', (input, expected) => {
    expect(normalizeVotingMethod(input)).toBe(expected);
  });

  it.each([
    ['multiple', 'multiple'],
    ['multiple_choice', 'multiple'],
    ['MULTIPLE_CHOICE', 'multiple'],
  ])('normalizes %s to multiple', (input, expected) => {
    expect(normalizeVotingMethod(input)).toBe(expected);
  });

  it.each([
    ['ranked', 'ranked'],
    ['ranked_choice', 'ranked'],
    ['ranked-choice', 'ranked'],
    ['RANKED_CHOICE', 'ranked'],
    ['rcv', 'ranked'],
    ['RCV', 'ranked'],
  ])('normalizes %s to ranked', (input, expected) => {
    expect(normalizeVotingMethod(input)).toBe(expected);
  });

  it('passes through approval as-is', () => {
    expect(normalizeVotingMethod('approval')).toBe('approval');
    expect(normalizeVotingMethod('APPROVAL')).toBe('approval');
  });

  it('defaults nullish input to single (DB default)', () => {
    expect(normalizeVotingMethod(undefined)).toBe('single');
    expect(normalizeVotingMethod(null)).toBe('single');
    expect(normalizeVotingMethod('')).toBe('single');
  });

  it('preserves unknown values lowercased so callers can surface "unsupported method"', () => {
    expect(normalizeVotingMethod('quadratic')).toBe('quadratic');
    expect(normalizeVotingMethod('STAR_VOTING')).toBe('star_voting');
  });

  it('exposes the canonical method list to the rest of the app', () => {
    expect(CANONICAL_VOTING_METHODS).toEqual(['single', 'multiple', 'approval', 'ranked']);
  });
});

describe('isRankedVotingMethod', () => {
  it.each(['ranked', 'ranked_choice', 'ranked-choice', 'RANKED_CHOICE', 'rcv'])(
    'returns true for %s',
    (method) => {
      expect(isRankedVotingMethod(method)).toBe(true);
    },
  );

  it.each(['single', 'single_choice', 'multiple', 'multiple_choice', 'approval', 'unknown', null, undefined, ''])(
    'returns false for %s',
    (method) => {
      expect(isRankedVotingMethod(method as string | null | undefined)).toBe(false);
    },
  );

  it('guards the production bug: ranked_choice must be treated as ranked', () => {
    // Regression: every poll created by the wizard has voting_method
    // 'ranked_choice' in the DB. Earlier code only matched the short form
    // 'ranked', so the results endpoint silently returned 0 votes for every
    // ranked-choice poll. This assertion documents that contract.
    expect(isRankedVotingMethod('ranked_choice')).toBe(true);
  });
});

describe('selectPollTotalVotes', () => {
  it('returns 0 when nothing is known yet', () => {
    expect(selectPollTotalVotes({})).toBe(0);
  });

  it('returns the only available signal', () => {
    expect(selectPollTotalVotes({ fromResults: 5 })).toBe(5);
    expect(selectPollTotalVotes({ fromPoll: 7 })).toBe(7);
    expect(selectPollTotalVotes({ fromOptions: 3 })).toBe(3);
  });

  it('regression: a stale 0 from /results never masks a known-good count from /polls', () => {
    // This is the exact bug the May 14 fix addressed. With nullish
    // coalescing (`fromResults ?? fromPoll`) the UI rendered 0 because
    // `fromResults` was 0 (long-form voting_method bug). Taking the max
    // correctly surfaces the real count from `polls.total_votes`.
    expect(
      selectPollTotalVotes({ fromResults: 0, fromPoll: 1, fromOptions: 0, fromRecordedOptions: 0 }),
    ).toBe(1);
  });

  it('takes the largest signal when several disagree', () => {
    expect(
      selectPollTotalVotes({ fromResults: 4, fromPoll: 7, fromOptions: 5, fromRecordedOptions: 6 }),
    ).toBe(7);
  });

  it('ignores nullish, NaN, negative, or non-finite inputs', () => {
    expect(
      selectPollTotalVotes({
        fromResults: null,
        fromPoll: undefined,
        fromOptions: Number.NaN,
        fromRecordedOptions: -5,
      }),
    ).toBe(0);
    expect(
      selectPollTotalVotes({
        fromResults: Infinity,
        fromPoll: 3,
      }),
    ).toBe(3);
  });
});
