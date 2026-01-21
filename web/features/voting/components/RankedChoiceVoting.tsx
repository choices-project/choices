'use client'

import { CheckCircle, AlertCircle, Info, GripVertical } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useVotingIsVoting } from '@/features/voting/lib/store';

import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
import { cn } from '@/lib/utils';

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
  // Initialize rankings from user vote or create default order
  const [rankedOrder, setRankedOrder] = useState<string[]>(() => {
    if (userVote && userVote.length > 0) {
      return userVote;
    }
    return options.map((_, index) => String(options[index]?.id ?? index));
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [isValid, setIsValid] = useState<boolean>(userVote ? userVote.length === options.length : false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const effectiveIsVoting = storeIsVoting || isVoting;
  const isDisabled = hasVoted || effectiveIsVoting || isSubmitting;

  // Initialize ranked order when options change
  useEffect(() => {
    if (userVote && userVote.length > 0) {
      setRankedOrder(userVote);
    } else {
      setRankedOrder(options.map((_, index) => String(options[index]?.id ?? index)));
    }
  }, [options.length, userVote, options]);

  // Update validation when rankings change
  useEffect(() => {
    const allRanked = rankedOrder.length === options.length;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (rankedOrder.length < 2) {
      errors.push('Please rank at least 2 candidates');
    } else if (rankedOrder.length < options.length) {
      warnings.push(`You can rank all ${options.length} candidates for better accuracy`);
    }

    setIsValid(allRanked && errors.length === 0);
    setValidationErrors(errors);
    setValidationWarnings(warnings);

    if (errors.length) {
      ScreenReaderSupport.announce(errors[0] ?? 'Ranking validation error', 'assertive');
    } else if (warnings.length) {
      ScreenReaderSupport.announce(warnings[0] ?? 'Ranking warning. Review your selections.', 'polite');
    }
  }, [rankedOrder, options.length]);

  // Drag and drop handlers
  const handleDragStart = useCallback((index: number) => {
    if (isDisabled) return;
    setDraggedIndex(index);
    ScreenReaderSupport.announce(`Started dragging option at position ${index + 1}`, 'polite');
  }, [isDisabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('opacity-50');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove('opacity-50');

    if (draggedIndex === null || isDisabled) return;

    const newOrder = [...rankedOrder];
    const draggedItem = newOrder[draggedIndex];
    if (!draggedItem) return;

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);

    setRankedOrder(newOrder);
    setDraggedIndex(null);

    const option = options.find((opt, idx) => String(opt.id) === draggedItem || idx === Number.parseInt(draggedItem, 10));
    const textValue = option?.text ?? (option ? (option as unknown as { text?: string })?.text : undefined);
    const optionName = textValue || 'option';
    ScreenReaderSupport.announce(`${optionName} moved to position ${dropIndex + 1}`, 'polite');
  }, [draggedIndex, rankedOrder, isDisabled, options]);

  // Keyboard navigation handlers
  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    if (isDisabled) return;

    if (e.key === 'ArrowUp' && currentIndex > 0) {
      e.preventDefault();
      const newOrder = [...rankedOrder];
      const temp = newOrder[currentIndex];
      if (temp !== undefined) {
        newOrder[currentIndex] = newOrder[currentIndex - 1] ?? temp;
        newOrder[currentIndex - 1] = temp;
        setRankedOrder(newOrder);
        ScreenReaderSupport.announce(`Moved option up to position ${currentIndex}`, 'polite');
      }
    } else if (e.key === 'ArrowDown' && currentIndex < rankedOrder.length - 1) {
      e.preventDefault();
      const newOrder = [...rankedOrder];
      const temp = newOrder[currentIndex];
      if (temp !== undefined) {
        newOrder[currentIndex] = newOrder[currentIndex + 1] ?? temp;
        newOrder[currentIndex + 1] = temp;
        setRankedOrder(newOrder);
        ScreenReaderSupport.announce(`Moved option down to position ${currentIndex + 2}`, 'polite');
      }
    }
  }, [rankedOrder, isDisabled]);

  const orderedCandidateSummary = useMemo(() => {
    return rankedOrder.map((optionId, index) => {
      const option = options.find((opt) => String(opt.id) === optionId);
      let name = optionId;
      if (option) {
        const textValue = option.text ?? (option as unknown as { text?: string })?.text;
        name = textValue || optionId;
      }
      return {
        id: optionId,
        name,
        rank: index + 1,
      };
    });
  }, [rankedOrder, options]);

  const handleSubmit = useCallback(async () => {
    if (isDisabled) {
      return;
    }

    setSubmissionError(null);

    if (rankedOrder.length < 2) {
      const message = 'Please rank at least 2 options before submitting.';
      setSubmissionError(message);
      ScreenReaderSupport.announce(message, 'assertive');
      return;
    }

    if (rankedOrder.length !== options.length) {
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
      // Convert option IDs to indices for API
      const numericRankings = rankedOrder.map((optionId) => {
        const optionIndex = options.findIndex((opt) => String(opt.id) === optionId);
        return optionIndex >= 0 ? optionIndex : Number.parseInt(optionId, 10);
      }).filter((value) => Number.isFinite(value) && value >= 0);

      const { safeWindow } = await import('@/lib/utils/ssr-safe');
      const gtag = safeWindow((w) => w.gtag);
      if (gtag) {
        gtag('event', 'vote_submitted', {
          poll_id: pollId,
          rankings: numericRankings,
          voting_method: 'ranked_choice',
          ranked_options_count: numericRankings.length,
        });
      }

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
    rankedOrder,
    isValid,
    validationErrors,
    options,
    pollId,
    onVote,
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            {title && <h1 className="mb-2 text-2xl font-bold text-foreground">{title}</h1>}
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
        {/* Instructions */}
        <div className="mb-4 rounded-lg border border-primary/20 bg-primary/10 p-4">
          <p className="text-sm text-foreground/90 leading-relaxed">
            <strong className="font-semibold">How it works:</strong> Drag options to reorder them, with 1st being your top choice.
            You can also use ↑ and ↓ arrow keys to move options. The system uses instant runoff to find the option with majority support.
          </p>
        </div>

        {/* Drag and Drop Ranking Interface */}
        <div className="space-y-3 mb-6" role="list" aria-label="Rank your preferences">
          {rankedOrder.map((optionId, displayIndex) => {
            const option = options.find((opt) => String(opt.id) === optionId);
            const optionText = (option?.text ?? (option ? String((option as unknown as { text?: string })?.text ?? '') : '')) || `Option ${displayIndex + 1}`;

            return (
              <div
                key={`ranked-${optionId}-${displayIndex}`}
                draggable={!isDisabled}
                onDragStart={() => handleDragStart(displayIndex)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, displayIndex)}
                onKeyDown={(e) => handleKeyDown(e, displayIndex)}
                tabIndex={isDisabled ? -1 : 0}
                role="button"
                aria-label={`${optionText}, currently ranked ${displayIndex + 1}. Drag to reorder or use arrow keys.`}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border-2 shadow-sm transition-all",
                  "hover:shadow-md active:scale-[0.98]",
                  isDisabled
                    ? "cursor-not-allowed opacity-60 border-border bg-muted"
                    : "cursor-move border-primary/30 bg-card hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  draggedIndex === displayIndex && "opacity-50"
                )}
              >
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary font-bold text-sm shadow-sm">
                  {displayIndex + 1}
                </div>
                <div className="flex-1">
                  <span className="text-base font-semibold text-foreground">{optionText}</span>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                    Rank {displayIndex + 1}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {validationErrors.length > 0 && (
          <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <span>{validationErrors[0]}</span>
            </div>
          </div>
        )}

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
            {orderedCandidateSummary.map((item: { id: string; name: string; rank: number }) => (
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
