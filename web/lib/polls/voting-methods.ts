/**
 * Voting-method normalization helpers.
 *
 * Background: historically the `polls.voting_method` column has been written
 * with the long-form values (`single_choice`, `multiple_choice`,
 * `ranked_choice`, `approval`) by the poll wizard, while several API routes
 * still compared against the short-form (`single`, `multiple`, `ranked`,
 * `approval`). That mismatch caused ranked-choice polls in particular to fall
 * through to the regular `votes` table path in `/api/polls/[id]/results`,
 * which left the UI reporting `0` votes even after a ballot was successfully
 * recorded in `poll_rankings`.
 *
 * This module is the single source of truth for normalizing a raw
 * `voting_method` value into one of the four short-form canonical methods.
 */

export const CANONICAL_VOTING_METHODS = [
  'single',
  'multiple',
  'approval',
  'ranked',
] as const;

export type CanonicalVotingMethod = (typeof CANONICAL_VOTING_METHODS)[number];

/**
 * Normalize an arbitrary voting-method string (DB long-form, legacy short-form,
 * or mixed case) into the canonical short form. Unknown values are returned
 * unchanged so callers can decide how to surface "unsupported method" errors.
 */
export function normalizeVotingMethod(method: string | null | undefined): string {
  if (!method) {
    return 'single';
  }
  switch (method.toLowerCase()) {
    case 'single':
    case 'single_choice':
      return 'single';
    case 'multiple':
    case 'multiple_choice':
      return 'multiple';
    case 'ranked':
    case 'ranked_choice':
    case 'ranked-choice':
    case 'rcv':
      return 'ranked';
    case 'approval':
      return 'approval';
    default:
      return method.toLowerCase();
  }
}

/**
 * Convenience predicate for "is this a ranked-choice poll?", covering all the
 * stored aliases at once.
 */
export function isRankedVotingMethod(method: string | null | undefined): boolean {
  return normalizeVotingMethod(method) === 'ranked';
}

/**
 * Pick the most trustworthy total-vote count across the three signals
 * available on the poll detail page:
 *   * `fromResults` – `/api/polls/[id]/results` returns the live tally.
 *   * `fromPoll`    – the stored `polls.total_votes` from `/api/polls/[id]`.
 *   * `fromOptions` – the sum of per-option vote counts.
 *
 * We deliberately do NOT use `??`: the results endpoint can briefly report 0
 * (cold cache, integrity-filtered count, server bug fixed in a later deploy)
 * while `polls.total_votes` already reflects the latest write. Taking the
 * max preserves the highest known-good count from any source and never lets
 * a stale 0 mask a real tally.
 */
export function selectPollTotalVotes(signals: {
  fromResults?: number | null | undefined;
  fromPoll?: number | null | undefined;
  fromOptions?: number | null | undefined;
  fromRecordedOptions?: number | null | undefined;
}): number {
  const values = [
    signals.fromResults,
    signals.fromPoll,
    signals.fromOptions,
    signals.fromRecordedOptions,
  ].map((value) => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0));
  return Math.max(0, ...values);
}
