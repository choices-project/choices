'use client'

import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';

import { useVotingIsVoting } from '@/features/voting/lib/store';

import { AccessibleRankingInterface } from '@/components/accessible/RankingInterface';

import ScreenReaderSupport from '@/lib/accessibility/screen-reader';

import type { PollOption } from '../types';

type RankedChoiceVotingProps = {
  pollId: string;
  title: string;
  description?: string;
  options: PollOption[];
  onVote: (pollId: string, rankings: number[]) => Promise<void>;
  isVoting: boolean;
  hasVoted?: boolean;
  userVote?: string[];
};

export default function RankedChoiceVoting({
  pollId,
  title,
  description,
  options,
  onVote,
  isVoting,
  hasVoted = false,
  userVote,
}: RankedChoiceVotingProps) {
  const storeIsVoting = useVotingIsVoting();
  const [selectedRankings, setSelectedRankings] = useState<string[]>(userVote ?? []);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [isValid, setIsValid] = useState<boolean>(userVote ? userVote.length === options.length : false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const effectiveIsVoting = storeIsVoting || isVoting;
  const isDisabled = hasVoted || effectiveIsVoting || isSubmitting;

  const candidates = useMemo(
    () =>
      options.map((option) => ({
        id: String(option.id),
        name: String((option as unknown as { text?: string }).text ?? option.id),
        bio: String((option as unknown as { option_text?: string }).option_text ?? ''),
      })),
    [options],
  );

  const handleRankingChange = useCallback((rankings: string[]) => {
    setSelectedRankings(rankings);
  }, []);

  const handleValidationChange = useCallback(
    (valid: boolean, errors: string[], warnings: string[]) => {
      setIsValid(valid);
      setValidationErrors(errors);
      setValidationWarnings(warnings);

      if (errors.length) {
        ScreenReaderSupport.announce(errors[0] ?? 'Ranking validation error', 'assertive');
      } else if (warnings.length) {
        ScreenReaderSupport.announce(
          warnings[0] ?? 'Ranking warning. Review your selections.',
          'polite',
        );
      }
    },
    [],
  );

  const orderedCandidateSummary = useMemo(() => {
    if (!selectedRankings.length) {
      return [];
    }

    return selectedRankings.map((candidateId, index) => {
      const candidate = candidates.find((item) => item.id === candidateId);
      return {
        id: candidateId,
        name: candidate?.name ?? candidateId,
        rank: index + 1,
      };
    });
  }, [candidates, selectedRankings]);

  const handleSubmit = useCallback(async () => {
    if (isDisabled) {
      return;
    }

    setSubmissionError(null);

    if (!selectedRankings.length) {
      const message = 'Please rank all options before submitting.';
      setSubmissionError(message);
      ScreenReaderSupport.announce(message, 'assertive');
      return;
    }

    if (selectedRankings.length !== options.length) {
      const message = `Please rank all ${options.length} options before submitting your vote.`;
      setSubmissionError(message);
      ScreenReaderSupport.announce(message, 'assertive');
      return;
    }

    if (!isValid) {
      const message = validationErrors[0] ?? 'Please resolve the validation issues before submitting.';
      setSubmissionError(message);
      ScreenReaderSupport.announce(message, 'assertive');
      return;
    }

    setIsSubmitting(true);
    try {
      const { safeWindow } = await import('@/lib/utils/ssr-safe');
      const gtag = safeWindow((w) => w.gtag);
      if (gtag) {
        gtag('event', 'vote_submitted', {
          poll_id: pollId,
          rankings: selectedRankings,
          voting_method: 'ranked_choice',
          ranked_options_count: selectedRankings.length,
        });
      }

      const numericRankings = selectedRankings
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isFinite(value));

      await onVote(pollId, numericRankings);
      ScreenReaderSupport.announce('Your ranked choice vote has been submitted.', 'polite');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit vote';
      setSubmissionError(message);
      ScreenReaderSupport.announce(message, 'assertive');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isDisabled,
    selectedRankings,
    isValid,
    validationErrors,
    options.length,
    pollId,
    onVote,
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-foreground">{title}</h1>
            {description && <p className="text-muted-foreground">{description}</p>}
          </div>
          <button
            type="button"
            onClick={() => setShowExplanation((value) => !value)}
            className="flex items-center space-x-2 text-primary transition-colors hover:text-primary/80"
          >
            <Info className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-medium">How it works</span>
          </button>
        </div>

        {showExplanation && (
          <div className="mb-4 rounded-lg border border-primary/20 bg-primary/10 p-4">
            <h3 className="mb-2 font-semibold text-foreground">How Ranked Choice Voting Works</h3>
            <div className="space-y-2 text-sm text-foreground/90">
              <p>
                • <strong>Rank every option</strong> from 1st (most preferred) to last (least preferred).
              </p>
              <p>• <strong>No spoilers:</strong> Support your favourite without helping your least favourite.</p>
              <p>• <strong>Majority support:</strong> The winner ultimately reflects majority preference.</p>
              <p>
                • <strong>Instant runoff:</strong> Lowest-ranked options are eliminated and their votes transfer to the
                next choice.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <div className="rounded-full bg-primary/20 px-3 py-1 text-sm font-medium text-primary">
            🏆 Ranked Choice Voting
          </div>
          <span className="text-sm text-muted-foreground">Rank each option (1 = most preferred) before submitting.</span>
        </div>
      </div>

      {submissionError && (
        <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-4" role="alert">
          <div className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-destructive" aria-hidden="true" />
            <p className="text-destructive">{submissionError}</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <AccessibleRankingInterface
          candidates={candidates}
          onRankingChange={handleRankingChange}
          onValidationChange={handleValidationChange}
          initialRankings={userVote ?? []}
          maxRankings={options.length}
          allowPartialRanking={false}
          showSocialInsights={false}
          className="mb-6"
        />

        {validationWarnings.length > 0 && !validationErrors.length && (
          <div className="mb-4 rounded-md border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-400" role="status">
            {validationWarnings[0]}
          </div>
        )}

        <div className="flex justify-center">
          {hasVoted ? (
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5" aria-hidden="true" />
              <span className="font-medium">Vote submitted successfully!</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isDisabled}
              data-testid="start-voting-button"
              className={`flex items-center space-x-2 rounded-lg px-8 py-3 font-medium transition-colors ${
                isDisabled ? 'cursor-not-allowed bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              <CheckCircle className="h-5 w-5" aria-hidden="true" />
              <span>{isSubmitting ? 'Submitting vote…' : 'Submit vote'}</span>
            </button>
          )}
        </div>
      </div>

      {orderedCandidateSummary.length > 0 && !hasVoted && (
        <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-foreground">Your current rankings</h3>
          <div className="space-y-2">
            {orderedCandidateSummary.map((item) => (
              <div key={item.id} className="flex items-center space-x-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {item.rank}
                </div>
                <span className="text-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
