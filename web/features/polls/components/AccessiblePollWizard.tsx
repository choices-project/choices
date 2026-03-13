'use client';

import { CheckCircle2, Lightbulb, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';

import { useRecordPollEvent } from '@/features/polls/hooks/usePollAnalytics';
import { usePollCreateController } from '@/features/polls/pages/create/hooks';
import type { PollWizardSubmissionResult } from '@/features/polls/pages/create/schema';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';


import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
import { useAccessibleDialog } from '@/lib/accessibility/useAccessibleDialog';
import type { PollWizardSettings } from '@/lib/polls/types';
import { useNotificationActions } from '@/lib/stores';
import { logger } from '@/lib/utils/logger';

import { useI18n } from '@/hooks/useI18n';

const MAX_OPTIONS = 10;
const MAX_TAG_LENGTH = 50;

type ShareInfo = {
  pollId: string;
  title: string;
  privacyLevel: string;
  category: string;
  status: number;
  durationMs?: number;
};

type BooleanSettingKey = Extract<
  keyof PollWizardSettings,
  | 'allowMultipleVotes'
  | 'showResults'
  | 'preventDuplicateVotes'
>;

export function AccessiblePollWizard() {
  const { t } = useI18n();
  const {
    data,
    errors,
    currentStep,
    steps,
    progressPercent,
    activeTip,
    canProceed,
    canGoBack,
    isLoading,
    categories,
    actions: {
      updateData,
      updateSettings,
      addOption,
      removeOption,
      updateOption,
      addTag,
      removeTag,
      clearFieldError,
      resetWizard,
    },
    goToNextStep,
    goToPreviousStep,
    submit,
  } = usePollCreateController();

  const router = useRouter();
  const pathname = usePathname();
  const { addNotification } = useNotificationActions();
  const baseAnalyticsMetadata = useCallback(
    () => ({
      source: 'accessible-wizard',
      optionCount: data.options.length,
      tagCount: data.tags.length,
      privacyLevel: data.settings.privacyLevel,
      category: data.category ?? null,
    }),
    [data.category, data.options.length, data.settings.privacyLevel, data.tags.length],
  );
  const recordPollEvent = useRecordPollEvent(baseAnalyticsMetadata);

  const [newTag, setNewTag] = useState('');
  const [submissionResult, setSubmissionResult] = useState<PollWizardSubmissionResult | null>(null);
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [hasCopiedShareLink, setHasCopiedShareLink] = useState(false);

  const totalSteps = steps.length;
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const passiveLiveRef = useRef<HTMLDivElement>(null);
  const assertiveLiveRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const shareDialogTitleRef = useRef<HTMLHeadingElement>(null);
  const shareDialogRef = useRef<HTMLDivElement>(null);
  const copyButtonRef = useRef<HTMLButtonElement>(null);

  const [lastAnnouncedStep, setLastAnnouncedStep] = useState<string | null>(null);
  const [lastAnnouncedError, setLastAnnouncedError] = useState<string | null>(null);

  const formatSettingLabel = useCallback((rawKey: string) => {
    const spaced = rawKey.replace(/([A-Z])/g, ' $1').trim();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }, []);
  const registerFieldRef = useCallback(
    <T extends HTMLElement>(key: string) =>
    (element: T | null) => {
      if (element) {
        fieldRefs.current[key] = element;
      }
    },
    [],
  );

  const resolveStepLabel = useCallback(
    (stepIndex: number) => {
      const step = steps[stepIndex];
      if (!step) {
        return `Step ${stepIndex + 1}`;
      }

      const stepRecord = step as Record<string, unknown>;
      const candidateKeys = ['label', 'title', 'heading', 'name', 'description', 'id'] as const;

      for (const key of candidateKeys) {
        const value = stepRecord[key];
        if (typeof value === 'string' && value.trim().length > 0) {
          return value;
        }
      }

      return `Step ${stepIndex + 1}`;
    },
    [steps],
  );

  const booleanSettingConfigs = useMemo<Array<{ key: BooleanSettingKey; label: string }>>(() => [
    { key: 'allowMultipleVotes', label: t('polls.create.wizard.audience.settings.allowMultipleVotes.label') },
    { key: 'showResults', label: t('polls.create.wizard.audience.settings.showResults.label') },
    { key: 'preventDuplicateVotes', label: t('polls.create.wizard.audience.settings.preventDuplicateVotes.label') },
  ], [t]);

  const currentStepLabel = useMemo(() => resolveStepLabel(currentStep), [currentStep, resolveStepLabel]);
  const stepPositionLabel = useMemo(
    () => `Step ${currentStep + 1} of ${totalSteps}: ${currentStepLabel}`,
    [currentStep, currentStepLabel, totalSteps],
  );

  const clearLiveRegion = useCallback((region: RefObject<HTMLDivElement>) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.setTimeout(() => {
      if (region.current) {
        region.current.textContent = '';
      }
    }, 1500);
  }, []);

  useEffect(() => {
    if (!currentStepLabel) {
      return;
    }
    if (lastAnnouncedStep === stepPositionLabel) {
      return;
    }
    setLastAnnouncedStep(stepPositionLabel);
    ScreenReaderSupport.announce(stepPositionLabel, 'polite');
    if (passiveLiveRef.current) {
      passiveLiveRef.current.textContent = stepPositionLabel;
      clearLiveRegion(passiveLiveRef);
    }
    if (stepHeadingRef.current) {
      ScreenReaderSupport.setFocus(stepHeadingRef.current, { announce: stepPositionLabel });
    }
  }, [clearLiveRegion, currentStepLabel, lastAnnouncedStep, stepPositionLabel]);

  useEffect(() => {
    const entries = Object.entries(errors).filter(
      ([, value]) => typeof value === 'string' && value.length > 0,
    ) as Array<[string, string]>;

    if (!entries.length) {
      setLastAnnouncedError(null);
      return;
    }

    const firstEntry = entries[0];
    if (!firstEntry) {
      setLastAnnouncedError(null);
      return;
    }

    const [firstKey, firstMessage] = firstEntry;
    if (firstMessage === lastAnnouncedError) {
      return;
    }

    setLastAnnouncedError(firstMessage);
    ScreenReaderSupport.announce(firstMessage, 'assertive');
    if (assertiveLiveRef.current) {
      assertiveLiveRef.current.textContent = firstMessage;
      clearLiveRegion(assertiveLiveRef);
    }

    const errorFieldMap: Record<string, string> = {
      title: 'title',
      description: 'description',
      category: 'category',
      options: 'option-0',
      tags: 'tagInput',
      privacyLevel: 'privacyLevel',
      _form: 'submit',
    };

    let targetKey = errorFieldMap[firstKey];
    if (!targetKey && firstKey.startsWith('option-')) {
      targetKey = firstKey;
    }

    const target = targetKey ? fieldRefs.current[targetKey] : null;
    if (target && 'focus' in target && typeof target.focus === 'function') {
      (target as HTMLElement).focus();
    }
  }, [clearLiveRegion, errors, lastAnnouncedError]);

  const currentTip =
    activeTip ?? {
      heading: 'Review your poll',
      body: 'Confirm your information looks right before proceeding.',
    };

  const resetSubmissionFeedback = () => {
    if (submissionResult) {
      setSubmissionResult(null);
    }
  };

  const handleTitleChange = (value: string) => {
    resetSubmissionFeedback();
    clearFieldError('title');
    updateData({ title: value });
  };

  const handleDescriptionChange = (value: string) => {
    resetSubmissionFeedback();
    clearFieldError('description');
    updateData({ description: value });
  };

  const handleCategorySelect = (categoryId: string) => {
    resetSubmissionFeedback();
    clearFieldError('category');
    updateData({ category: categoryId });
  };

  const handleOptionChange = (index: number, value: string) => {
    resetSubmissionFeedback();
    clearFieldError('options');
    clearFieldError(`option-${index}`);
    updateOption(index, value);
  };

  const handleRemoveOption = (index: number) => {
    resetSubmissionFeedback();
    removeOption(index);
    clearFieldError('options');
    clearFieldError(`option-${index}`);
    ScreenReaderSupport.announce(`Option ${index + 1} removed.`, 'polite');
  };

  const handleAddOption = () => {
    resetSubmissionFeedback();
    if (data.options.length >= MAX_OPTIONS) {
      ScreenReaderSupport.announce('You have reached the maximum number of options', 'assertive');
      return;
    }
    addOption();
    ScreenReaderSupport.announce(`Option ${data.options.length + 1} added. Provide a label for the new option.`, 'polite');
    clearFieldError('options');
  };

  const handleAddTag = () => {
    resetSubmissionFeedback();
    const tag = newTag.trim();
    if (!tag) {
      ScreenReaderSupport.announce('Enter a tag before adding.', 'assertive');
      return;
    }
    if (data.tags.includes(tag)) {
      ScreenReaderSupport.announce(`The tag ${tag} has already been added.`, 'assertive');
      return;
    }
    if (data.tags.length >= 5) {
      ScreenReaderSupport.announce('You have reached the maximum number of tags.', 'assertive');
      return;
    }
    if (tag.length > MAX_TAG_LENGTH) {
      ScreenReaderSupport.announce(`Tags must be ${MAX_TAG_LENGTH} characters or fewer.`, 'assertive');
      return;
    }
    addTag(tag);
    clearFieldError('tags');
    setNewTag('');
    ScreenReaderSupport.announce(`Tag ${tag} added.`, 'polite');
  };

  const handleRemoveTag = (tag: string) => {
    resetSubmissionFeedback();
    removeTag(tag);
    clearFieldError('tags');
    ScreenReaderSupport.announce(`Tag ${tag} removed.`, 'polite');
  };

  const handlePrivacyLevelChange = (value: string) => {
    resetSubmissionFeedback();
    const nextLevel = value as typeof data.settings.privacyLevel;
    clearFieldError('privacyLevel');
    updateSettings({ privacyLevel: nextLevel });
    updateData({ privacyLevel: nextLevel });
    ScreenReaderSupport.announce(`Privacy level set to ${value}.`, 'polite');
  };

  const handleVotingMethodChange = (value: string) => {
    resetSubmissionFeedback();
    const nextMethod = value as typeof data.settings.votingMethod;
    updateSettings({ votingMethod: nextMethod });
    ScreenReaderSupport.announce(`Voting method set to ${value}.`, 'polite');
  };

  const handleBooleanSettingChange = <K extends keyof typeof data.settings>(key: K, value: boolean) => {
    resetSubmissionFeedback();
    updateSettings({ [key]: value } as Pick<typeof data.settings, K>);
    ScreenReaderSupport.announce(`${formatSettingLabel(String(key))} ${value ? 'enabled' : 'disabled'}.`, 'polite');
  };

  const handleSubmit = async () => {
    resetSubmissionFeedback();
    const result = await submit();
    setSubmissionResult(result);

    if (result.success) {
      const pollData = result.data ?? {
        pollId: result.pollId,
        title: result.title,
        status: result.status,
      };

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('choices:poll-created', {
            detail: {
              id: pollData.pollId,
              pollId: pollData.pollId,
              title: pollData.title ?? data.title,
            },
          }),
        );
      }

      addNotification({
        type: 'success',
        title: 'Poll created',
        message: result.message ?? `"${pollData.title}" is live for voters.`,
      });
      ScreenReaderSupport.announce(`Poll created successfully. "${pollData.title}" is live for voters.`, 'polite');

      logger.info('Poll created successfully', {
        pollId: pollData.pollId,
        title: pollData.title,
        category: data.category,
        status: pollData.status,
        durationMs: result.durationMs,
      });
      recordPollEvent('poll_created', {
        category: 'poll_creation',
        label: pollData.pollId,
        metadata: {
          pollId: pollData.pollId,
          status: pollData.status,
          durationMs: result.durationMs,
        },
      });

      setShareInfo({
        pollId: pollData.pollId,
        title: pollData.title,
        privacyLevel: data.settings.privacyLevel,
        category: data.category,
        status: pollData.status,
        ...(result.durationMs !== undefined ? { durationMs: result.durationMs } : {}),
      });
      setHasCopiedShareLink(false);
      resetWizard();
      setNewTag('');
      return;
    }

    const failureMetadata = {
      status: result.status,
      reason: result.reason,
      durationMs: result.durationMs,
      fieldErrors: result.fieldErrors ? Object.keys(result.fieldErrors) : undefined,
    };

    if (result.status === 401) {
      const redirect = encodeURIComponent(pathname ?? '/polls/create');
      addNotification({
        type: 'warning',
        title: 'Sign in required',
        message: 'Please sign in to publish your poll.',
      });
      ScreenReaderSupport.announce('Sign in required to publish your poll.', 'assertive');
      recordPollEvent('poll_creation_failed', {
        category: 'poll_creation',
        metadata: failureMetadata,
      });
      router.push(`/auth?redirect=${redirect}`);
      return;
    }

    let failureRecorded = false;

    if (result.status === 403 || result.status === 429) {
      recordPollEvent('poll_creation_failed', {
        category: 'poll_creation',
        metadata: failureMetadata,
      });
      failureRecorded = true;

      addNotification({
        type: result.status === 403 ? 'error' : 'warning',
        title: result.status === 403 ? 'Access denied' : 'Slow down',
        message:
          result.status === 403
            ? 'You do not have permission to create polls on this account.'
            : 'You are creating polls too quickly. Please wait a moment and try again.',
      });
      ScreenReaderSupport.announce(
        result.status === 403
          ? 'Access denied. You do not have permission to create polls on this account.'
          : 'Rate limit reached. Please wait before creating another poll.',
        'assertive',
      );
      return;
    }

    addNotification({
      type: 'error',
      title: 'Unable to publish poll',
      message: result.message ?? 'We hit a snag while publishing your poll.',
    });
    if (!failureRecorded) {
      recordPollEvent('poll_creation_failed', {
        category: 'poll_creation',
        metadata: failureMetadata,
      });
    }
    ScreenReaderSupport.announce('Unable to publish poll. Please review errors and try again.', 'assertive');
  };

  const handleCopyShareLink = () => {
    if (!shareInfo || typeof window === 'undefined' || !navigator?.clipboard) {
      ScreenReaderSupport.announce('Copy is not available in this environment.', 'assertive');
      return;
    }

    const url = `${window.location.origin}/polls/${shareInfo.pollId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => setHasCopiedShareLink(true))
      .then(() => ScreenReaderSupport.announce('Share link copied to clipboard.', 'polite'))
      .catch(() => {
        setHasCopiedShareLink(false);
        ScreenReaderSupport.announce('Unable to copy the share link. Try copying manually.', 'assertive');
        recordPollEvent('copy_link_failed', {
          category: 'poll_creation',
          label: shareInfo.pollId,
          metadata: {
            pollId: shareInfo.pollId,
            location: 'accessible-wizard',
            status: shareInfo.status,
            durationMs: shareInfo.durationMs,
          },
        });
      });
    recordPollEvent('copy_link', {
      category: 'poll_creation',
      label: shareInfo.pollId,
      metadata: {
        pollId: shareInfo.pollId,
        location: 'accessible-wizard',
        privacyLevel: shareInfo.privacyLevel,
        category: shareInfo.category,
        status: shareInfo.status,
        durationMs: shareInfo.durationMs,
      },
      });
  };

  const resetShareDialog = () => {
    setShareInfo(null);
    setHasCopiedShareLink(false);
  };

  const handleCloseShareDialog = () => {
    if (shareInfo) {
      recordPollEvent('share_modal_closed', {
        category: 'poll_creation',
        label: shareInfo.pollId,
        metadata: {
          pollId: shareInfo.pollId,
          status: shareInfo.status,
          durationMs: shareInfo.durationMs,
          location: 'accessible-wizard',
        },
      });
    }
    resetShareDialog();
  };

  const handleViewPublishedPoll = () => {
    if (!shareInfo) {
      return;
    }
    recordPollEvent('view_poll', {
      category: 'poll_creation',
      label: shareInfo.pollId,
      metadata: {
        pollId: shareInfo.pollId,
        location: 'accessible-wizard',
        status: shareInfo.status,
        durationMs: shareInfo.durationMs,
      },
    });
    handleCloseShareDialog();
  };

  const shareUrl = useMemo(() => {
    if (shareInfo && typeof window !== 'undefined') {
      return `${window.location.origin}/polls/${shareInfo.pollId}`;
    }
    return '';
  }, [shareInfo]);

  const isShareOpen = Boolean(shareInfo);

  useAccessibleDialog({
    isOpen: isShareOpen,
    dialogRef: shareDialogRef,
    ...(isShareOpen
      ? {
          initialFocusRef: copyButtonRef,
          ariaLabelId: 'share-dialog-title',
          liveMessage: 'Share dialog opened. Copy the link or view the published poll.',
        }
      : {}),
    onClose: handleCloseShareDialog,
  });

  useEffect(() => {
    if (shareInfo) {
      if (shareDialogTitleRef.current) {
      ScreenReaderSupport.setFocus(shareDialogTitleRef.current, {
        announce: `Share your poll: ${shareInfo.title}`,
      });
      }
      recordPollEvent('share_modal_opened', {
        category: 'poll_creation',
        label: shareInfo.pollId,
        metadata: {
          pollId: shareInfo.pollId,
          status: shareInfo.status,
          durationMs: shareInfo.durationMs,
          location: 'accessible-wizard',
          privacyLevel: shareInfo.privacyLevel,
          category: shareInfo.category,
        },
      });
    } else if (fieldRefs.current['submit']) {
      fieldRefs.current['submit']?.focus();
    }
  }, [recordPollEvent, shareInfo]);

  const renderDetailsStep = () => (
    <div className="space-y-6" aria-labelledby="poll-details-heading">
      <header>
        <h3 id="poll-details-heading" className="text-lg font-semibold text-foreground">
          Poll details
        </h3>
        <p className="text-sm text-muted-foreground">Describe what you want people to vote on.</p>
      </header>

      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-2" htmlFor="poll-title-input">
          Poll Title <span className="text-red-500 dark:text-red-400">*</span>
        </label>
        <p id="poll-title-help" className="text-xs text-muted-foreground">
          Provide a clear question voters can understand at a glance.
        </p>
        <input
          id="poll-title-input"
          type="text"
          value={data.title}
          onChange={(event) => handleTitleChange(event.target.value)}
          ref={registerFieldRef<HTMLInputElement>('title')}
          className={`w-full rounded-md border bg-card text-foreground px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary ${
            errors.title ? 'border-red-300 dark:border-red-600' : 'border-border'
          }`}
          placeholder="e.g., Should our town invest in renewable energy projects?"
          maxLength={200}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={`poll-title-help poll-title-count${errors.title ? ' poll-title-error' : ''}`}
        />
        <p id="poll-title-count" className="mt-1 text-sm text-muted-foreground" aria-live="polite">
          {data.title.length}/200 characters
        </p>
        {errors.title && (
          <p id="poll-title-error" className="mt-1 flex items-center gap-1 text-sm text-red-600 dark:text-red-400" role="alert">
            <X className="h-4 w-4" />
            {errors.title}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-2" htmlFor="poll-description-input">
          Description
        </label>
        <p id="poll-description-help" className="text-xs text-muted-foreground">
          Give voters context, background, or links that help them make an informed choice.
        </p>
        <textarea
          id="poll-description-input"
          value={data.description}
          onChange={(event) => handleDescriptionChange(event.target.value)}
          ref={registerFieldRef<HTMLTextAreaElement>('description')}
          className={`w-full rounded-md border bg-card text-foreground px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary ${
            errors.description ? 'border-red-300 dark:border-red-600' : 'border-border'
          }`}
          placeholder="Give voters helpful context to make an informed decision."
          rows={4}
          maxLength={1000}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={`poll-description-help poll-description-count${errors.description ? ' poll-description-error' : ''}`}
        />
        <p id="poll-description-count" className="mt-1 text-sm text-muted-foreground" aria-live="polite">
          {data.description.length}/1000 characters
        </p>
        {errors.description && (
          <p
            id="poll-description-error"
            className="mt-1 flex items-center gap-1 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            <X className="h-4 w-4" />
            {errors.description}
          </p>
        )}
      </div>
    </div>
  );

  const renderOptionsStep = () => (
    <div className="space-y-4" aria-labelledby="poll-options-heading">
      <header>
        <h3 id="poll-options-heading" className="text-lg font-semibold text-foreground">
          Response options
        </h3>
        <p className="text-sm text-muted-foreground">Provide at least two clear, concise options for voters.</p>
      </header>

      {errors.options && (
        <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-300" role="alert">
          {errors.options}
        </div>
      )}

      <p id="poll-options-help" className="text-xs text-muted-foreground">
        Keep option labels short and unique. Avoid duplicating choices.
      </p>

      <div className="space-y-3" aria-labelledby="poll-options-heading" aria-describedby="poll-options-help poll-options-meta">
        {data.options.map((option, index) => (
          <div key={`option-${index}`} className="space-y-1">
            <div className="flex gap-2">
              <input
                id={`poll-option-${index}`}
                value={option}
                onChange={(event) => handleOptionChange(index, event.target.value)}
                placeholder={`Option ${index + 1}`}
                maxLength={100}
                ref={registerFieldRef<HTMLInputElement>(`option-${index}`)}
                className={`flex-1 rounded-md border bg-card text-foreground px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary ${
                  errors[`option-${index}`] ? 'border-red-300 dark:border-red-600' : 'border-border'
                }`}
                aria-invalid={Boolean(errors[`option-${index}`])}
                aria-describedby={`poll-option-${index}-helper${errors[`option-${index}`] ? ` poll-option-${index}-error` : ''}`}
              />
              {data.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                  className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                  aria-label={`Remove option ${index + 1}`}
                >
                  Remove
                </button>
              )}
            </div>
            <div id={`poll-option-${index}-helper`} className="flex justify-between text-xs text-muted-foreground">
              <span>{option.length}/100 characters</span>
              {option.length > 80 && <span className="text-orange-500 dark:text-orange-400">Approaching limit</span>}
            </div>
            {errors[`option-${index}`] && (
              <p id={`poll-option-${index}-error`} className="text-sm text-red-600 dark:text-red-400" role="alert">
                {errors[`option-${index}`]}
              </p>
            )}
          </div>
        ))}
      </div>

      <p id="poll-options-meta" className="text-xs text-muted-foreground">
        {data.options.length}/{MAX_OPTIONS} options configured
      </p>

      {data.options.length < MAX_OPTIONS && (
        <button
          type="button"
          onClick={handleAddOption}
          className="inline-flex items-center gap-2 rounded-md border border-primary/30 px-3 py-2 text-sm text-primary hover:bg-primary/10"
          aria-describedby="poll-options-meta"
        >
          <Plus className="h-4 w-4" />
          Add option
        </button>
      )}
    </div>
  );

  const renderAudienceStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Select a category</h3>
        <p className="text-sm text-muted-foreground">Categories help the right audience discover your poll.</p>
      </div>

      {errors.category && (
        <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-300" role="alert">
          {errors.category}
        </div>
      )}

      <p id="poll-category-help" className="text-xs text-muted-foreground">
        Pick the option that best describes your topic. Only one category can be active at a time.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2" aria-describedby="poll-category-help">
        {categories.map((category) => {
          const isSelected = data.category === category.id;
          return (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => handleCategorySelect(category.id)}
                className={`w-full rounded-lg border p-4 text-left transition ${
                  isSelected 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-border bg-card'
                }`}
                aria-pressed={isSelected}
                aria-label={`Category ${category.name}`}
                aria-describedby={`category-${category.id}-description`}
              >
                <div className="text-2xl" aria-hidden="true">
                  {category.icon}
                </div>
                <div className="mt-2 font-medium text-foreground">{category.name}</div>
                <p id={`category-${category.id}-description`} className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      <div aria-labelledby="poll-tags-label">
        <div className="mb-2 flex items-center justify-between">
          <label id="poll-tags-label" className="text-sm font-medium text-foreground/80" htmlFor="poll-tags-input">
            Tags
          </label>
          <span className="text-xs text-muted-foreground">
            {data.tags.length}/5 selected
          </span>
        </div>

        {errors.tags && (
          <div
            id="poll-tags-error"
            className="mb-2 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-300"
            role="alert"
          >
            {errors.tags}
          </div>
        )}

        <div className="flex gap-2">
          <input
            id="poll-tags-input"
            value={newTag}
            onChange={(event) => {
              resetSubmissionFeedback();
              setNewTag(event.target.value);
            }}
            placeholder="Add a tag (e.g., climate, budget)"
            maxLength={MAX_TAG_LENGTH}
            className="flex-1 rounded-md border border-border bg-card text-foreground px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary"
            ref={registerFieldRef<HTMLInputElement>('tagInput')}
            aria-describedby={`poll-tags-help poll-tags-limit${errors.tags ? ' poll-tags-error' : ''}`}
            aria-invalid={Boolean(errors.tags)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAddTag();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddTag}
            disabled={!newTag.trim() || data.tags.length >= 5}
            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            aria-describedby="poll-tags-limit"
          >
            Add
          </button>
        </div>
        <p id="poll-tags-help" className="mt-1 text-xs text-muted-foreground">
          Tags help people discover your poll. Use up to five keywords.
        </p>
        <div id="poll-tags-limit" className="mt-1 text-xs text-muted-foreground">
          {newTag.length}/{MAX_TAG_LENGTH} characters — {data.tags.length}/5 selected
        </div>

        {data.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Selected tags">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-1 text-sm text-primary"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-primary hover:text-primary/80"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <section className="space-y-4 rounded-lg border border-border p-4 bg-card" aria-labelledby="poll-settings-heading">
        <header>
          <h3 id="poll-settings-heading" className="text-lg font-semibold text-foreground">Voting & privacy settings</h3>
          <p className="text-sm text-muted-foreground">Decide how people participate and what they can see.</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-foreground/80">
            Privacy level
            <select
              value={data.settings.privacyLevel}
              onChange={(event) => handlePrivacyLevelChange(event.target.value)}
              className="rounded-md border border-border bg-card text-foreground px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary"
              ref={registerFieldRef<HTMLSelectElement>('privacyLevel')}
              aria-invalid={Boolean(errors.privacyLevel)}
            >
              <option value="public">Public – anyone can discover and vote</option>
              <option value="unlisted">Unlisted – hidden from search, link required</option>
              <option value="private">Private – only invited participants</option>
            </select>
            {errors.privacyLevel && (
              <span className="text-xs text-red-600 dark:text-red-400" role="alert">
                {errors.privacyLevel}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-2 text-sm text-foreground/80">
            Voting method
            <select
              value={data.settings.votingMethod}
              onChange={(event) => handleVotingMethodChange(event.target.value)}
              className="rounded-md border border-border bg-card text-foreground px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-primary"
            >
              <option value="single">Single choice</option>
              <option value="multiple">Multiple choice</option>
              <option value="ranked">Ranked choice</option>
              <option value="quadratic">Quadratic voting</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {booleanSettingConfigs.map(({ key, label }) => {
            const inputId = `poll-setting-${key}`;
            return (
              <label
                key={key}
                htmlFor={inputId}
                className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground/80"
              >
                <span>{label}</span>
                <input
                  id={inputId}
                  type="checkbox"
                  checked={Boolean(data.settings[key])}
                  onChange={(event) =>
                    handleBooleanSettingChange(key, event.target.checked)
                  }
                  className="rounded"
                />
              </label>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-border p-4 bg-card" aria-labelledby="poll-preview-heading">
        <h3 id="poll-preview-heading" className="text-lg font-semibold text-foreground">Preview</h3>
        <p className="text-sm text-muted-foreground">This is what voters will see.</p>

        <div className="mt-4 space-y-3">
          <div>
            <h4 className="text-xl font-semibold text-foreground">{data.title || 'Untitled poll'}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{data.description || 'Add context to help voters decide.'}</p>
          </div>

          <div className="space-y-2" aria-label="Preview options">
            {data.options
              .filter((option) => option.trim().length > 0)
              .map((option, index) => (
                <div key={`preview-option-${index}`} className="flex items-center gap-2 text-sm text-foreground/80">
                  <input type="radio" disabled className="text-primary focus:ring-0" aria-hidden="true" />
                  <span>{option}</span>
                </div>
              ))}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {data.category && (
              <span className="rounded-full bg-muted px-2 py-1 text-foreground">#{data.category}</span>
            )}
            {data.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-primary/20 px-2 py-1 text-primary">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );

  const renderStepContent = () => {
    const step = steps[currentStep];
    if (!step) {
      return null;
    }

    switch (step.id) {
      case 'details':
        return renderDetailsStep();
      case 'options':
        return renderOptionsStep();
      case 'audience':
        return renderAudienceStep();
      case 'review':
      default:
        return renderReviewStep();
    }
  };

  const progressValueText = `Step ${currentStep + 1} of ${totalSteps}, ${progressPercent}% complete`;

  return (
    <>
      <div aria-live="polite" className="sr-only" ref={passiveLiveRef} />
      <div aria-live="assertive" className="sr-only" ref={assertiveLiveRef} />

      <a
        href="#poll-step-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to current step
      </a>

      <main
        id="accessible-poll-main"
        className="min-h-screen bg-background py-10"
        aria-labelledby="poll-wizard-title"
      >
        <div className="mx-auto max-w-4xl px-4">
          <header className="mb-8 space-y-2">
            <h1 id="poll-wizard-title" className="text-3xl font-bold text-foreground">
              Create a new poll
            </h1>
            <p className="text-muted-foreground">Walk through the steps to shape your question, options, and audience.</p>
          </header>

          {submissionResult && submissionResult.success && (
            <div className="mb-6 flex items-start gap-2 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 px-3 py-3 text-sm text-green-800 dark:text-green-200" role="status">
              <CheckCircle2 className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-medium">Poll published!</p>
                <p>Your poll &quot;{submissionResult.data?.title ?? submissionResult.title}&quot; is ready for voters.</p>
              </div>
            </div>
          )}

          {submissionResult && !submissionResult.success && submissionResult.message && (
            <div className="mb-6 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3 py-3 text-sm text-red-700 dark:text-red-300" role="alert">
              {submissionResult.message}
            </div>
          )}

          <section className="mb-8" aria-labelledby="poll-progress-heading">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span id="poll-progress-heading">
                Step {currentStep + 1} of {totalSteps}
              </span>
              <span>{progressPercent}% complete</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                role="progressbar"
                aria-labelledby="poll-progress-heading"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={progressValueText}
                style={{ width: `${Math.max(progressPercent, 5)}%` }}
              />
            </div>
            <nav className="mt-4" aria-label="Poll creation steps">
              <ol className="flex flex-wrap gap-3">
                {steps.map((step) => (
                  <li key={step.id}>
                    <span
                      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                        step.isCurrent
                          ? 'border-primary bg-primary/10 text-primary'
                          : step.isCompleted
                          ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'border-border text-muted-foreground'
                      }`}
                      aria-current={step.isCurrent ? 'step' : undefined}
                    >
                      <span className="font-medium capitalize">{step.title}</span>
                      <span className="sr-only">
                        {step.isCurrent
                          ? ' (current step)'
                          : step.isCompleted
                          ? ' (completed)'
                          : ' (upcoming step)'}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </nav>
          </section>

          {currentTip && (
            <aside
              className="mb-6 flex items-start gap-3 rounded-lg border border-primary/40 bg-primary/10 p-4 text-sm text-primary"
              role="note"
              aria-live="polite"
            >
              <Lightbulb className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-semibold">{currentTip.heading}</p>
                <p className="mt-1 text-primary">{currentTip.body}</p>
              </div>
            </aside>
          )}

          <section
            className="mb-8 rounded-lg border border-border bg-card p-6 shadow-sm"
            aria-labelledby="poll-step-heading"
            id="poll-step-content"
          >
            <h2 id="poll-step-heading" ref={stepHeadingRef} className="sr-only" tabIndex={-1}>
              {stepPositionLabel}
            </h2>
            {renderStepContent()}
          </section>

          {errors._form && (
            <div
              className="mb-6 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3 py-3 text-sm text-red-700 dark:text-red-300"
              role="alert"
            >
              {errors._form}
            </div>
          )}

          <footer className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetSubmissionFeedback();
                goToPreviousStep();
              }}
              disabled={!canGoBack || isLoading}
              className="border-border text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              Previous
            </Button>

            <div className="flex gap-2">
              {currentStep === totalSteps - 1 ? (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canProceed || isLoading}
                  ref={registerFieldRef<HTMLButtonElement>('submit')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isLoading ? 'Publishing…' : 'Publish poll'}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    resetSubmissionFeedback();
                    goToNextStep();
                  }}
                  disabled={!canProceed || isLoading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Next
                </Button>
              )}
            </div>
          </footer>
        </div>
      </main>

      <Dialog
        open={isShareOpen}
        onOpenChange={(open) => (open ? undefined : handleCloseShareDialog())}
      >
        <DialogContent
          aria-live="polite"
          aria-modal="true"
          aria-describedby="share-dialog-description share-dialog-link"
          ref={shareDialogRef}
        >
          <DialogHeader>
            <DialogTitle id="share-dialog-title" ref={shareDialogTitleRef}>
              Share your poll
            </DialogTitle>
            <DialogDescription id="share-dialog-description">
              Spread the word so people can vote on <strong>{shareInfo?.title}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80" htmlFor="share-link-input">
                Share link
              </label>
              <div className="flex gap-2">
                <Input id="share-link-input" value={shareUrl} readOnly className="flex-1" aria-describedby="share-dialog-link" />
                <Button type="button" onClick={handleCopyShareLink} variant="secondary" ref={copyButtonRef}>
                  {hasCopiedShareLink ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                Visibility: <strong>{shareInfo?.privacyLevel ?? 'public'}</strong>
              </p>
              {shareInfo?.category && (
                <p>
                  Category: <strong>{shareInfo.category}</strong>
                </p>
              )}
            </div>
            <div id="share-dialog-link" className="sr-only">
              {hasCopiedShareLink ? 'Share link copied to clipboard.' : 'Press copy to place the share link on your clipboard.'}
            </div>
          </div>

          <DialogFooter>
            {shareInfo && (
              <Button asChild variant="default">
                <Link href={`/polls/${shareInfo.pollId}`} onClick={handleViewPublishedPoll}>
                  View poll
                </Link>
              </Button>
            )}
            <Button type="button" onClick={handleCloseShareDialog} variant="secondary">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


