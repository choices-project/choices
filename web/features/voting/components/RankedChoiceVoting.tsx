'use client'

import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';

import { AccessibleRankingInterface } from '@/components/accessible/RankingInterface';
import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
import { useVotingIsVoting } from '@/features/voting/lib/store';

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
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">{title}</h1>
            {description && <p className="text-gray-600">{description}</p>}
          </div>
          <button
            type="button"
            onClick={() => setShowExplanation((value) => !value)}
            className="flex items-center space-x-2 text-blue-600 transition-colors hover:text-blue-700"
          >
            <Info className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-medium">How it works</span>
          </button>
        </div>

        {showExplanation && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="mb-2 font-semibold text-blue-900">How Ranked Choice Voting Works</h3>
            <div className="space-y-2 text-sm text-blue-800">
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
          <div className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800">
            🏆 Ranked Choice Voting
          </div>
          <span className="text-sm text-gray-500">Rank each option (1 = most preferred) before submitting.</span>
        </div>
      </div>

      {submissionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4" role="alert">
          <div className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-red-500" aria-hidden="true" />
            <p className="text-red-800">{submissionError}</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
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
          <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800" role="status">
            {validationWarnings[0]}
          </div>
        )}

        <div className="flex justify-center">
          {hasVoted ? (
            <div className="flex items-center space-x-2 text-green-600">
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
                isDisabled ? 'cursor-not-allowed bg-gray-300 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <CheckCircle className="h-5 w-5" aria-hidden="true" />
              <span>{isSubmitting ? 'Submitting vote…' : 'Submit vote'}</span>
            </button>
          )}
        </div>
      </div>

      {orderedCandidateSummary.length > 0 && !hasVoted && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">Your current rankings</h3>
          <div className="space-y-2">
            {orderedCandidateSummary.map((item) => (
              <div key={item.id} className="flex items-center space-x-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {item.rank}
                </div>
                <span className="text-gray-900">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
