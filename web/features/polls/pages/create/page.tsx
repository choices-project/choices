"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GripVertical,
  Lightbulb,
  Plus,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useRecordPollEvent, type PollEventOptions } from '@/features/polls/hooks/usePollAnalytics';
import { usePollMilestoneNotifications, type PollMilestone } from '@/features/polls/hooks/usePollMilestones';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

import { useAccessibleDialog } from '@/lib/accessibility/useAccessibleDialog';
import { useNotificationActions } from "@/lib/stores"
import { cn } from "@/lib/utils"

import { useI18n } from '@/hooks/useI18n';

import {
  DESCRIPTION_CHAR_LIMIT,
  MAX_OPTIONS,
  MAX_TAGS,
  POLL_CREATION_STEPS,
  TITLE_CHAR_LIMIT,
} from "./constants"
import { usePollCreateController } from "./hooks"


// Privacy and voting method labels will be localized using useI18n hook

type ShareModalState = {
  pollId: string
  title: string
  privacyLevel: 'public' | 'private' | 'unlisted'
  category: string
  votingMethod: string
}

export default function CreatePollPage() {
  const { t } = useI18n();
  const router = useRouter()
  const {
    data,
    errors,
    currentStep,
    steps,
    activeTip,
    canProceed,
    isLoading,
    categories,
    actions,
    goToNextStep,
    goToPreviousStep,
    submit,
  } = usePollCreateController()

  // Helper function to safely get translations with fallback
  const safeT = useCallback((key: string, fallback: string, params?: Record<string, string | number>): string => {
    const result = params ? t(key, params) : t(key);
    // Check if result is the key itself or a generic placeholder
    const genericPlaceholders = ['Label', 'Hint', 'Title', 'Subtitle', 'MaxHint', 'Placeholder', 'SubHint', 'subHint', 'Description', 'Legend'];
    if (result === key || genericPlaceholders.includes(result) || result.includes('polls.create.')) {
      return fallback;
    }
    return result;
  }, [t]);

  // Handle clickable step navigation
  const handleStepClick = useCallback((stepIndex: number) => {
    if (actions.goToStep && stepIndex >= 0 && stepIndex < POLL_CREATION_STEPS.length) {
      actions.goToStep(stepIndex);
    }
  }, [actions.goToStep])

  const PRIVACY_LABELS: Record<string, string> = useMemo(() => ({
    public: safeT('polls.create.privacy.public', 'Public'),
    private: safeT('polls.create.privacy.private', 'Private'),
    unlisted: safeT('polls.create.privacy.unlisted', 'Unlisted'),
  }), [safeT]);

  const VOTING_METHOD_LABELS: Record<string, string> = useMemo(() => ({
    single: safeT('polls.create.votingMethod.single', 'Single Choice'),
    multiple: safeT('polls.create.votingMethod.multiple', 'Multiple Choice'),
    approval: safeT('polls.create.votingMethod.approval', 'Approval Voting'),
    ranked: safeT('polls.create.votingMethod.ranked', 'Ranked Choice'),
  }), [safeT]);

  const [newTag, setNewTag] = useState("")
  const [shareInfo, setShareInfo] = useState<ShareModalState | null>(null)
  const [hasCopiedShareLink, setHasCopiedShareLink] = useState(false)
  const { addNotification } = useNotificationActions()
  const errorSummaryRef = useRef<HTMLDivElement | null>(null)
  const shareDialogRef = useRef<HTMLDivElement | null>(null)
  const shareCopyButtonRef = useRef<HTMLButtonElement | null>(null)

  const recordPollEvent = useRecordPollEvent();

  const {
    milestones,
    preferences: milestonePreferences,
    enabledMilestones,
    nextMilestone,
    updatePreference: updateMilestonePreference,
  } = usePollMilestoneNotifications({
    pollId: shareInfo?.pollId ?? null,
    totalVotes: 0,
  });

  useEffect(() => {
    if (shareInfo) {
      const payload: PollEventOptions = {
        value: 1,
        metadata: {
          pollId: shareInfo.pollId,
          trigger: shareInfo.title ? 'create_success' : 'unknown',
        },
      }

      if (shareInfo.pollId) {
        payload.label = shareInfo.pollId
      }

      recordPollEvent('share_modal_opened', payload);
    }
  }, [recordPollEvent, shareInfo]);

  useEffect(() => {
    if (!shareInfo) return;
    const payload: PollEventOptions = {
      metadata: {
        enabledMilestones,
        nextMilestone,
      },
    }

    if (shareInfo.pollId) {
      payload.label = shareInfo.pollId
    }

    recordPollEvent('milestone_pref_summary', payload);
  }, [enabledMilestones, nextMilestone, recordPollEvent, shareInfo]);

  const hasErrors = Object.keys(errors ?? {}).length > 0

  useEffect(() => {
    if (hasErrors && errorSummaryRef.current) {
      errorSummaryRef.current.focus()
    }
  }, [hasErrors])

  useEffect(() => {
    if (!shareInfo?.pollId) {
      setHasCopiedShareLink(false)
    }
  }, [shareInfo?.pollId])

  useEffect(() => {
    if (!hasCopiedShareLink) return
    const timeout = window.setTimeout(() => setHasCopiedShareLink(false), 2000)
    return () => window.clearTimeout(timeout)
  }, [hasCopiedShareLink])

  const errorMessages = useMemo(() => {
    const entries = Object.entries(errors ?? {})
    return entries
      .filter(([key]) => !key.startsWith('option-'))
      .map(([key, message]) => ({
        id: `error-${key}`,
        message,
      }))
  }, [errors])

  const shareUrl = useMemo(() => {
    if (!shareInfo) return ''
    if (typeof window === 'undefined') return `/polls/${shareInfo.pollId}`
    return `${window.location.origin}/polls/${shareInfo.pollId}`
  }, [shareInfo])

  const handleCloseShareDialog = useCallback(() => {
    if (!shareInfo) return
    recordPollEvent('share_modal_closed', {
      metadata: {
        pollId: shareInfo.pollId,
      },
      label: shareInfo.pollId,
    })
    setShareInfo(null)
  }, [recordPollEvent, shareInfo])

  useAccessibleDialog({
    isOpen: Boolean(shareInfo),
    dialogRef: shareDialogRef,
    initialFocusRef: shareCopyButtonRef,
    onClose: handleCloseShareDialog,
    liveMessage: shareInfo
      ? t('polls.create.share.dialog.liveOpen', { title: shareInfo.title })
      : t('polls.create.share.dialog.liveOpenFallback'),
    ariaLabelId: 'share-dialog-title',
  })

  const focusField = useCallback((field: string) => {
    if (typeof window === 'undefined') return;
    const selectors = [`[data-field="${field}"]`, `#${field}`];
    for (const selector of selectors) {
      const element = selector.startsWith('#')
        ? document.getElementById(field)
        : (document.querySelector(selector) as HTMLElement | null);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus({ preventScroll: true });
        return;
      }
    }
  }, []);

  const handleMilestoneToggle = (milestone: PollMilestone, enabled: boolean) => {
    updateMilestonePreference(milestone, enabled)
    const payload: PollEventOptions = {
      value: enabled ? 1 : 0,
      metadata: {
        pollId: shareInfo?.pollId,
        milestone,
        enabled,
      },
    }

    if (shareInfo?.pollId) {
      payload.label = shareInfo.pollId
    }

    recordPollEvent('milestone_pref_updated', payload)
  }

  const handleCopyShareLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setHasCopiedShareLink(true)
      recordPollEvent('copy_link', {
        value: 1,
        metadata: {
          pollId: shareInfo?.pollId,
          location: 'post_publish',
        },
        ...(shareInfo?.pollId ? { label: shareInfo.pollId } : {}),
      });
      addNotification({
        type: 'success',
        title: t('polls.create.share.notifications.linkCopied.title'),
        message: t('polls.create.share.notifications.linkCopied.message'),
        duration: 3000,
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: t('polls.create.share.notifications.copyFailed.title'),
        message: error instanceof Error ? error.message : t('polls.create.share.notifications.copyFailed.message'),
        duration: 4000,
      })
    }
  }

  const handleViewPoll = () => {
    if (!shareInfo) return
    recordPollEvent('view_poll', {
      label: shareInfo.pollId,
      value: 1,
    });
    router.push(`/polls/${shareInfo.pollId}`)
    setShareInfo(null)
  }

  const handleViewAnalytics = () => {
    if (!shareInfo) return
    recordPollEvent('view_analytics', {
      label: shareInfo.pollId,
      value: 1,
    });
    router.push(`/polls/analytics?pollId=${shareInfo.pollId}`)
    setShareInfo(null)
  }

  const handleCreateAnotherPoll = () => {
    setShareInfo(null)
    recordPollEvent('create_another', {
      value: 1,
    });
    router.push('/polls/create')
  }

  const handleDataUpdate = useCallback((update: Partial<typeof data>) => {
    actions.updateData(update)
    Object.keys(update).forEach((field) => actions.clearFieldError(field))
  }, [actions])

  const handleOptionChange = useCallback((index: number, value: string) => {
    actions.updateOption(index, value)
    actions.clearFieldError(`option-${index}`)
    actions.clearFieldError("options")
  }, [actions])

  // Sync DOM values to React state for browser automation compatibility (step 1: details)
  // Uses the same proven pattern from AuthPageClient
  useEffect(() => {
    if (typeof window === 'undefined' || currentStep !== 0) return;

    const getTitleInput = (): HTMLInputElement | null => {
      return document.getElementById('title') as HTMLInputElement | null;
    };

    const getDescriptionInput = (): HTMLTextAreaElement | null => {
      return document.getElementById('description') as HTMLTextAreaElement | null;
    };

    let cleanup: (() => void) | undefined;
    let checkTimeout: NodeJS.Timeout | undefined;

    const checkInputs = (): void => {
      const titleInput = getTitleInput();
      const descriptionInput = getDescriptionInput();

      if (!titleInput && !descriptionInput) {
        // Retry after a short delay if inputs aren't ready (max 5 seconds)
        checkTimeout = setTimeout(checkInputs, 100);
        return;
      }

      const syncTitle = () => {
        const currentInput = getTitleInput();
        if (!currentInput) return;

        // CRITICAL: Only sync if input is NOT focused (programmatic changes from E2E tests)
        // If user is actively typing, React's controlled input handles it naturally
        if (document.activeElement === currentInput) {
          return;
        }

        const currentValue = currentInput.value;
        const syncedValue = currentInput.getAttribute('data-synced-value');
        // Sync if value exists and is different from what we last synced
        // Also sync if value is empty but we had a value before (reset case)
        if (currentValue !== syncedValue && data.title !== currentValue) {
          currentInput.setAttribute('data-synced-value', currentValue || '');

          // CRITICAL FIX: Update React state FIRST, then dispatch events in next tick
          // This ensures React's controlled input system recognizes the change
          // Update state immediately - React will re-render
          handleDataUpdate({ title: currentValue });

          // Use setTimeout to dispatch events after state update is queued
          // This ensures React processes the state change before events fire
          setTimeout(() => {
            // Create proper InputEvent with correct properties for React
            const inputEvent = new InputEvent('input', {
              bubbles: true,
              cancelable: true,
              data: currentValue,
              inputType: 'insertText',
              isComposing: false
            });

            // Also dispatch change event for form validation
            const changeEvent = new Event('change', {
              bubbles: true,
              cancelable: true
            });

            // Dispatch events in correct order
            currentInput.dispatchEvent(inputEvent);
            currentInput.dispatchEvent(changeEvent);
          }, 0);
        }
      };

      const syncDescription = () => {
        const currentInput = getDescriptionInput();
        if (!currentInput) return;

        // CRITICAL: Only sync if input is NOT focused (programmatic changes from E2E tests)
        // If user is actively typing, React's controlled input handles it naturally
        if (document.activeElement === currentInput) {
          return;
        }

        const currentValue = currentInput.value;
        const syncedValue = currentInput.getAttribute('data-synced-value');
        // Sync if value exists and is different from what we last synced
        // Also sync if value is empty but we had a value before (reset case)
        if (currentValue !== syncedValue && data.description !== currentValue) {
          currentInput.setAttribute('data-synced-value', currentValue || '');

          // CRITICAL FIX: Update React state FIRST, then dispatch events in next tick
          // Update state immediately - React will re-render
          handleDataUpdate({ description: currentValue });

          // Use setTimeout to dispatch events after state update is queued
          setTimeout(() => {
            // Create proper InputEvent with correct properties for React
            const inputEvent = new InputEvent('input', {
              bubbles: true,
              cancelable: true,
              data: currentValue,
              inputType: 'insertText',
              isComposing: false
            });

            // Also dispatch change event for form validation
            const changeEvent = new Event('change', {
              bubbles: true,
              cancelable: true
            });

            // Dispatch events in correct order
            currentInput.dispatchEvent(inputEvent);
            currentInput.dispatchEvent(changeEvent);
          }, 0);
        }
      };

      // Only sync on blur events (when user finishes typing) and periodically for E2E tests
      // Don't sync on input/focus - let React's controlled inputs handle normal typing
      titleInput?.addEventListener('blur', syncTitle);
      descriptionInput?.addEventListener('blur', syncDescription);

      // Also sync periodically to catch any direct DOM manipulation (E2E tests)
      // Only sync when inputs are NOT focused to avoid interfering with user typing
      // Keep syncing for 30 seconds to handle slower test environments
      const interval = setInterval(() => {
        syncTitle();
        syncDescription();
      }, 500); // Check every 500ms (less frequent to avoid interference)

      // Extended to 30 seconds to catch late DOM updates in production/test environments
      const timeout = setTimeout(() => clearInterval(interval), 30000);

      cleanup = () => {
        const currentTitleInput = getTitleInput();
        const currentDescriptionInput = getDescriptionInput();
        if (currentTitleInput) {
          currentTitleInput.removeEventListener('blur', syncTitle);
        }
        if (currentDescriptionInput) {
          currentDescriptionInput.removeEventListener('blur', syncDescription);
        }
        clearInterval(interval);
        clearTimeout(timeout);
        if (checkTimeout) clearTimeout(checkTimeout);
      };
    };

    // Start checking for inputs
    checkInputs();

    return () => {
      if (cleanup) cleanup();
      if (checkTimeout) clearTimeout(checkTimeout);
    };
  }, [currentStep, data.title, data.description, handleDataUpdate]);

  // Sync DOM values to React state for browser automation compatibility (step 2: options)
  // Uses the same proven pattern from AuthPageClient
  useEffect(() => {
    if (typeof window === 'undefined' || currentStep !== 1) return;

    const getOptionInput = (index: number): HTMLInputElement | null => {
      return document.getElementById(`option-${index}`) as HTMLInputElement | null;
    };

    let cleanup: (() => void) | undefined;
    let checkTimeout: NodeJS.Timeout | undefined;

    const checkInputs = (): void => {
      // Check if at least one option input exists
      const firstOptionInput = getOptionInput(0);
      if (!firstOptionInput) {
        // Retry after a short delay if inputs aren't ready (max 5 seconds)
        checkTimeout = setTimeout(checkInputs, 100);
        return;
      }

      const syncOptions = () => {
        data.options.forEach((currentOption, index) => {
          const optionInput = getOptionInput(index);
          if (!optionInput) return;

          // CRITICAL: Only sync if input is NOT focused (programmatic changes from E2E tests)
          // If user is actively typing, React's controlled input handles it naturally
          if (document.activeElement === optionInput) {
            return;
          }

          const currentValue = optionInput.value;
          const syncedValue = optionInput.getAttribute('data-synced-value');
          // Sync if value exists and is different from what we last synced
          if (currentValue !== syncedValue && currentOption !== currentValue) {
            optionInput.setAttribute('data-synced-value', currentValue || '');

            // CRITICAL FIX: Update React state FIRST, then dispatch events in next tick
            // Update state immediately - React will re-render
            handleOptionChange(index, currentValue);

            // Use setTimeout to dispatch events after state update is queued
            setTimeout(() => {
              // Create proper InputEvent with correct properties for React
              const inputEvent = new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                data: currentValue,
                inputType: 'insertText',
                isComposing: false
              });

              // Also dispatch change event for form validation
              const changeEvent = new Event('change', {
                bubbles: true,
                cancelable: true
              });

              // Dispatch events in correct order
              optionInput.dispatchEvent(inputEvent);
              optionInput.dispatchEvent(changeEvent);
            }, 0);
          }
        });
      };

      // Only sync on blur events (when user finishes typing) for all option inputs
      // Don't sync on input/focus - let React's controlled inputs handle normal typing
      data.options.forEach((_, index) => {
        const optionInput = getOptionInput(index);
        optionInput?.addEventListener('blur', syncOptions);
      });

      // Also sync periodically to catch any direct DOM manipulation (E2E tests)
      // Only sync when inputs are NOT focused to avoid interfering with user typing
      // Keep syncing for 30 seconds to handle slower test environments
      const interval = setInterval(syncOptions, 500); // Check every 500ms (less frequent to avoid interference)

      // Extended to 30 seconds to catch late DOM updates in production/test environments
      const timeout = setTimeout(() => clearInterval(interval), 30000);

      cleanup = () => {
        data.options.forEach((_, index) => {
          const optionInput = getOptionInput(index);
          optionInput?.removeEventListener('blur', syncOptions);
        });
        clearInterval(interval);
        clearTimeout(timeout);
        if (checkTimeout) clearTimeout(checkTimeout);
      };
    };

    // Start checking for inputs
    checkInputs();

    return () => {
      if (cleanup) cleanup();
      if (checkTimeout) clearTimeout(checkTimeout);
    };
  }, [currentStep, data.options, handleOptionChange]);

  const handleAddOption = () => {
    if (data.options.length < MAX_OPTIONS) {
      actions.addOption()
      actions.clearFieldError('options')
    }
  }

  const handleRemoveOption = (index: number) => {
    if (data.options.length > 2) {
      actions.removeOption(index)
      actions.clearFieldError(`option-${index}`)
      actions.clearFieldError('options')
    }
  }

  const handleAddTag = () => {
    const trimmed = newTag.trim()
    if (!trimmed) return

    const normalized = trimmed.toLowerCase()

    if (data.tags.includes(normalized)) {
      setNewTag('')
      return
    }

    if (data.tags.length >= MAX_TAGS) {
      addNotification({
        type: "warning",
        title: t('polls.create.notifications.tooManyTags.title'),
        message: t('polls.create.notifications.tooManyTags.message', { max: MAX_TAGS }),
        duration: 4000,
      })
      return
    }

    actions.addTag(normalized)
    actions.clearFieldError("tags")
    setNewTag('')
  }

  const handleRemoveTag = (tag: string) => {
    actions.removeTag(tag)
    actions.clearFieldError("tags")
  }

  const handleChangePrivacy = (value: string) => {
    actions.updateSettings({ privacyLevel: value as typeof data.settings.privacyLevel })
    actions.clearFieldError("privacyLevel")
  }

  const handleSubmit = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const result = await submit();

    if (!result.success) {
      if (result.reason === 'cancelled') {
        return;
      }

      const firstErrorField = result.fieldErrors ? Object.keys(result.fieldErrors)[0] : undefined;
      if (firstErrorField) {
        requestAnimationFrame(() => focusField(firstErrorField));
      }

      if (result.status === 401) {
        addNotification({
          type: 'warning',
          title: safeT('polls.create.notifications.signInRequired.title', 'Sign In Required'),
          message: safeT('polls.create.notifications.signInRequired.message', 'Please sign in to create a poll.'),
          duration: 6000,
        });
        router.push(`/auth?redirect=${encodeURIComponent('/polls/create')}`);
        return;
      }

      if (result.status === 403) {
        addNotification({
          type: 'error',
          title: safeT('polls.create.notifications.accessDenied.title', 'Access Denied'),
          message: safeT('polls.create.notifications.accessDenied.message', 'You do not have permission to create polls.'),
          duration: 6000,
        });
        return;
      }

      if (result.status === 429) {
        addNotification({
          type: 'warning',
          title: safeT('polls.create.notifications.rateLimit.title', 'Rate Limit Exceeded'),
          message: safeT('polls.create.notifications.rateLimit.message', 'Please wait a moment before creating another poll.'),
          duration: 6000,
        });
        return;
      }

      recordPollEvent('poll_creation_failed', {
        category: 'poll_creation',
        metadata: {
          status: result.status,
          reason: result.reason,
          durationMs: result.durationMs,
          fieldErrors: result.fieldErrors ? Object.keys(result.fieldErrors) : undefined,
        },
      });

      addNotification({
        type: result.fieldErrors ? 'warning' : 'error',
        title: result.fieldErrors ? t('polls.create.notifications.validationErrors.title') : t('polls.create.notifications.creationFailed.title'),
        message: result.message ?? t('polls.create.notifications.creationFailed.message'),
        duration: 6000,
      });
      return;
    }

    const pollData = result.data ?? {
      pollId: result.pollId,
      title: result.title ?? data.title,
      status: result.status,
    };

    const shareTitle = pollData.title ?? data.title;

    addNotification({
      type: 'success',
      title: safeT('polls.create.notifications.pollCreated.title', 'Poll Created!'),
      message: result.message ?? safeT('polls.create.notifications.pollCreated.message', 'Your poll has been created successfully.'),
      duration: 4000,
    });

    recordPollEvent('poll_created', {
      category: 'poll_creation',
      label: pollData.pollId,
      value: 1,
      metadata: {
        pollId: pollData.pollId,
        status: pollData.status,
        durationMs: result.durationMs,
        optionCount: data.options.length,
        privacyLevel: data.settings.privacyLevel,
        category: data.category,
      },
    });

    setShareInfo({
      pollId: pollData.pollId,
      title: shareTitle,
      privacyLevel: data.settings.privacyLevel,
      category: data.category,
      votingMethod: data.settings.votingMethod,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('choices:poll-created', {
          detail: {
            id: pollData.pollId,
            pollId: pollData.pollId,
            title: pollData.title ?? shareTitle,
          },
        }),
      );
    }
  };

  const renderStep = () => {
    switch (POLL_CREATION_STEPS[currentStep]?.id) {
      case "details":
        return (
          <div className="space-y-6">
            <fieldset>
              <Label htmlFor="title">Poll title</Label>
              <Input
                id="title"
                value={data.title}
                onChange={(event) => handleDataUpdate({ title: event.target.value })}
                placeholder="Where should we focus next quarter’s budget?"
                maxLength={TITLE_CHAR_LIMIT}
                aria-invalid={Boolean(errors.title)}
                aria-describedby="title-hint title-count"
              />
              <div id="title-hint" className="mt-2 text-xs text-muted-foreground">
                Keep it short, action-oriented, and easy to scan.
              </div>
              <div
                id="title-count"
                className={cn(
                  "mt-1 text-xs",
                  data.title.length >= TITLE_CHAR_LIMIT ? "text-destructive font-semibold" : "text-muted-foreground",
                )}
              >
                {data.title.length}/{TITLE_CHAR_LIMIT}
              </div>
              {errors.title && (
                <p id="error-title" className="mt-1 text-sm text-destructive">
                  {errors.title}
                </p>
              )}
            </fieldset>

            <fieldset>
              <Label htmlFor="description">{(() => {
                const label = t('polls.create.wizard.details.description.label');
                return label && label !== 'Label' && label !== 'polls.create.wizard.details.description.label' ? label : 'Description';
              })()}</Label>
              <Textarea
                 id="description"
                value={data.description}
                onChange={(event) => handleDataUpdate({ description: event.target.value })}
                onInput={(event) => {
                  // Sync DOM value to React state for browser automation compatibility
                  const value = (event.target as HTMLTextAreaElement).value;
                  if (value !== data.description) {
                    handleDataUpdate({ description: value });
                  }
                }}
                placeholder={(() => {
                  const placeholder = t('polls.create.wizard.details.description.placeholder');
                  return placeholder && placeholder !== 'Placeholder' && placeholder !== 'polls.create.wizard.details.description.placeholder' ? placeholder : 'Explain why this poll matters and what voters should consider...';
                })()}
                rows={5}
                maxLength={DESCRIPTION_CHAR_LIMIT}
                aria-invalid={Boolean(errors.description)}
                aria-describedby="description-hint description-count"
              />
              <div id="description-hint" className="mt-2 text-xs text-muted-foreground">
                {(() => {
                  const hint = t('polls.create.wizard.details.description.hint');
                  return hint && hint !== 'Hint' && hint !== 'polls.create.wizard.details.description.hint' ? hint : 'Provide context and background information for your poll.';
                })()}
              </div>
              <div
                id="description-count"
                className={cn(
                  "mt-1 text-xs",
                  data.description.length >= DESCRIPTION_CHAR_LIMIT
                    ? "text-destructive font-semibold"
                    : "text-muted-foreground",
                )}
              >
                {data.description.length}/{DESCRIPTION_CHAR_LIMIT}
              </div>
              {errors.description && (
                <p id="error-description" className="mt-1 text-sm text-destructive">
                  {errors.description}
                </p>
              )}
            </fieldset>
          </div>
        )

      case "options":
        return (
          <div className="space-y-6">
            <fieldset>
              <legend className="text-base font-semibold mb-2">
                {safeT('polls.create.wizard.options.label', 'Poll Options')}
              </legend>
              <p className="mt-1 text-sm text-muted-foreground mb-4">
                {safeT('polls.create.wizard.options.hint', 'Provide clear, distinct choices for voters to select from.')}
              </p>
              {errors.options && (
                <Alert variant="destructive" className="mt-2 mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription id="error-options">{errors.options}</AlertDescription>
                </Alert>
              )}

              <div className="mt-4 space-y-3" role="group" aria-labelledby="poll-options">
                {data.options.map((option, index) => (
                  <div key={`option-${index}`} className="flex items-start gap-3">
                    <div className="flex-shrink-0 pt-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`option-${index}`} className="sr-only">
                        Option {index + 1}
                      </Label>
                      <Input
                        id={`option-${index}`}
                        value={option}
                        onChange={(event) => handleOptionChange(index, event.target.value)}
                        onInput={(event) => {
                          // Sync DOM value to React state for browser automation compatibility
                          const value = (event.target as HTMLInputElement).value;
                          if (value !== option) {
                            handleOptionChange(index, value);
                          }
                        }}
                        placeholder={`Option ${index + 1} (e.g., "Yes", "No", "Maybe")`}
                        aria-label={`Poll option ${index + 1}`}
                        aria-invalid={Boolean(errors[`option-${index}`])}
                        className="w-full"
                        maxLength={200}
                      />
                      {errors[`option-${index}`] && (
                        <p className="mt-1 text-sm text-destructive" role="alert">
                          {errors[`option-${index}`]}
                        </p>
                      )}
                    </div>
                    {data.options.length > 2 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="mt-1 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleRemoveOption(index)}
                        aria-label={`Remove option ${index + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{safeT('polls.create.wizard.options.maxHint', `You can add up to ${MAX_OPTIONS} options.`, { max: MAX_OPTIONS })}</span>
                <span className="font-medium">
                  {data.options.length}/{MAX_OPTIONS}
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={handleAddOption}
                disabled={data.options.length >= MAX_OPTIONS}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('polls.create.wizard.options.add') || 'Add Option'}
              </Button>
            </fieldset>
          </div>
        )

      case "audience":
        return (
          <div className="space-y-8">
            {/* Voting & Privacy Settings Section */}
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold mb-1 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Voting & privacy settings
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Decide how people participate and what they can see.
                </p>
              </div>

              <fieldset className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="privacy-level">{safeT('polls.create.wizard.audience.privacy.label', 'Privacy level')}</Label>
                  <select
                    id="privacy-level"
                    className="mt-2 w-full rounded-md border px-3 py-2 text-sm bg-background"
                    value={data.settings.privacyLevel}
                    onChange={(event) => handleChangePrivacy(event.target.value)}
                    aria-describedby="privacy-help"
                  >
                    {Object.entries(PRIVACY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <p id="privacy-help" className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {safeT('polls.create.wizard.audience.privacy.hint', 'Control who can find and access your poll. Public polls appear in search and listings, Private polls require a direct link, and Unlisted polls are hidden from search but accessible via link.')}
                  </p>
                </div>

                <div>
                  <Label htmlFor="voting-method">{safeT('polls.create.wizard.audience.votingMethod.label', 'Voting method')}</Label>
                  <select
                    id="voting-method"
                    className="mt-2 w-full rounded-md border px-3 py-2 text-sm bg-background"
                    value={data.settings.votingMethod}
                    onChange={(event) =>
                      actions.updateSettings({ votingMethod: event.target.value as typeof data.settings.votingMethod })
                    }
                    aria-describedby="voting-method-help"
                  >
                    {Object.entries(VOTING_METHOD_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <p id="voting-method-help" className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {safeT('polls.create.wizard.audience.votingMethod.hint', 'Choose how votes are counted and ranked. Single allows one choice, Multiple allows several, Approval lets voters approve multiple options, and Ranked uses instant runoff voting to find majority support.')}
                  </p>
                </div>
              </fieldset>
            </div>

            {/* Category Section */}
            <fieldset>
              <Label className="text-base font-semibold">{safeT('polls.create.wizard.audience.category.label', 'Category')}</Label>
              <p className="mt-1 text-sm text-muted-foreground mb-1">
                {safeT('polls.create.wizard.audience.category.hint', 'Choose a category to help voters find your poll. Categories help organize polls and make them easier to discover.')}
              </p>
              <p className="text-xs text-muted-foreground italic">
                {safeT('polls.create.wizard.audience.category.subHint', 'Click on a category card below to select it.')}
              </p>
              {errors.category && (
                <p className="mt-2 text-sm text-destructive" id="error-category">
                  {errors.category}
                </p>
              )}

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => {
                  const isSelected = data.category === category.id;
                  return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDataUpdate({ category: category.id });
                    }}
                    className={cn(
                      "rounded-lg border-2 p-4 text-left transition-all cursor-pointer",
                      "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20"
                        : "border-border hover:border-primary/60 bg-card",
                    )}
                    aria-pressed={isSelected}
                    aria-label={`Select ${category.name} category`}
                  >
                      <div className="text-2xl mb-2" aria-hidden>
                        {category.icon}
                      </div>
                      <div className="font-semibold text-base">{category.name}</div>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{category.description}</p>
                      {isSelected && (
                        <div className="mt-2 flex items-center gap-1 text-primary text-xs font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          Selected
                        </div>
                      )}
                  </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <Label htmlFor="tags" className="text-base font-semibold">{safeT('polls.create.wizard.audience.tags.label', 'Tags')}</Label>
              <p className="mt-1 text-sm text-muted-foreground mb-1">
                {safeT('polls.create.wizard.audience.tags.hint', 'Add tags to help categorize your poll. Tags make your poll easier to find and help voters discover polls on similar topics.')}
              </p>
              <p className="text-xs text-muted-foreground italic mb-2">
                {(() => {
                  const hint = safeT('polls.create.wizard.audience.tags.subHint', 'Type a tag and press Enter or click Add to include it.');
                  return hint && hint !== 'SubHint' && hint !== 'subHint' ? hint : 'Type a tag and press Enter or click Add to include it.';
                })()}
              </p>
              {errors.tags && (
                <p className="mt-2 text-sm text-destructive" id="error-tags">
                  {errors.tags}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2" aria-live="polite">
                {data.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={t('polls.create.wizard.audience.tags.removeAria', { tag })}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {data.tags.length < MAX_TAGS && (
                <div className="mt-3 flex gap-2">
                  <Input
                    id="tags"
                    value={newTag}
                    onChange={(event) => setNewTag(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder={safeT('polls.create.wizard.audience.tags.placeholder', 'Enter a tag and press Enter')}
                    aria-describedby="tags-hint"
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    {safeT('polls.create.wizard.audience.tags.add', 'Add')}
                  </Button>
                </div>
              )}
              <div id="tags-hint" className="mt-2 text-xs text-muted-foreground">
                {safeT('polls.create.wizard.audience.tags.maxHint', `You can add up to ${MAX_TAGS} tags.`, { max: MAX_TAGS })}
            </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-base font-semibold mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                {safeT('polls.create.wizard.audience.settings.legend', 'Poll Settings')}
              </legend>
              <p className="text-sm text-muted-foreground mb-4">
                {safeT('polls.create.wizard.audience.settings.description', 'Configure additional options for how your poll works and what voters can do.')}
              </p>
              <SettingToggle
                id="allow-multiple-votes"
                label={safeT('polls.create.wizard.audience.settings.allowMultipleVotes.label', 'Allow multiple votes')}
                description={safeT('polls.create.wizard.audience.settings.allowMultipleVotes.description', 'Let voters cast multiple votes on this poll. When enabled, voters can select more than one option, which is useful for polls where multiple choices are acceptable.')}
                checked={data.settings.allowMultipleVotes}
                onCheckedChange={(checked) => actions.updateSettings({ allowMultipleVotes: checked })}
              />
              <SettingToggle
                id="allow-anonymous-votes"
                label={safeT('polls.create.wizard.audience.settings.allowAnonymousVotes.label', 'Allow anonymous votes')}
                description={safeT('polls.create.wizard.audience.settings.allowAnonymousVotes.description', 'Allow voters to vote without revealing their identity. This encourages participation but reduces accountability. Results will not show individual voter information.')}
                checked={data.settings.allowAnonymousVotes}
                onCheckedChange={(checked) => actions.updateSettings({ allowAnonymousVotes: checked })}
              />
              <SettingToggle
                id="require-authentication"
                label={safeT('polls.create.wizard.audience.settings.requireAuthentication.label', 'Require authentication')}
                description={safeT('polls.create.wizard.audience.settings.requireAuthentication.description', 'Only authenticated users can vote on this poll. This ensures each person can only vote once and helps prevent spam or manipulation.')}
                checked={data.settings.requireAuthentication}
                onCheckedChange={(checked) => actions.updateSettings({ requireAuthentication: checked })}
              />
              <SettingToggle
                id="show-results"
                label={safeT('polls.create.wizard.audience.settings.showResults.label', 'Show results')}
                description={safeT('polls.create.wizard.audience.settings.showResults.description', 'Display poll results to voters. When enabled, voters can see current vote counts and percentages. You can choose to show results immediately or after voting.')}
                checked={data.settings.showResults}
                onCheckedChange={(checked) => actions.updateSettings({ showResults: checked })}
              />
              <SettingToggle
                id="allow-comments"
                label={safeT('polls.create.wizard.audience.settings.allowComments.label', 'Allow comments')}
                description={safeT('polls.create.wizard.audience.settings.allowComments.description', 'Let voters comment on this poll. Comments enable discussion and allow voters to share their reasoning, which can enrich the voting experience and provide context for decisions.')}
                checked={data.settings.allowComments}
                onCheckedChange={(checked) => actions.updateSettings({ allowComments: checked })}
              />
            </fieldset>

          </div>
        )

      case 'review':
      default:
        return (
          <div className="space-y-6">
            {/* Preview Section */}
            <div className="mb-6">
              <h3 className="text-base font-semibold mb-1 text-foreground">Preview</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This is what voters will see.
              </p>
            </div>

            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-xl font-bold">{safeT('polls.create.wizard.review.title', 'Review Your Poll')}</CardTitle>
                <CardDescription className="text-sm mt-1">{safeT('polls.create.wizard.review.description', 'Double-check everything before publishing.')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <section>
                  <h3 className="text-xl font-bold text-foreground leading-tight">{data.title || safeT('polls.create.wizard.review.untitled', 'Untitled Poll')}</h3>
                  {data.description && (
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {data.description}
                    </p>
                  )}
                  {!data.description && (
                    <p className="mt-2 text-sm text-muted-foreground italic">
                      {safeT('polls.create.wizard.review.noDescription', 'No description provided.')}
                    </p>
                  )}
                </section>

                  <Separator />

                <section>
                  <h4 className="text-base font-semibold mb-4 text-foreground">{safeT('polls.create.wizard.review.optionsHeading', 'Poll Options')}</h4>
                  <InteractivePreview 
                    votingMethod={data.settings.votingMethod}
                    options={data.options.filter((option) => option.trim().length > 0)}
                  />
                </section>

                  <Separator />

                <section className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-sm font-medium px-3 py-1">{data.category}</Badge>
                    {data.tags.map((tag) => (
                    <Badge key={`preview-tag-${tag}`} variant="secondary" className="text-sm font-medium px-3 py-1">
                      {tag}
                    </Badge>
                  ))}
                </section>

                <section className="grid gap-3 text-sm md:grid-cols-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <span className="font-medium text-foreground">{safeT('polls.create.wizard.review.privacy', 'Privacy')}</span>
                    <span className="text-muted-foreground font-semibold">{PRIVACY_LABELS[data.settings.privacyLevel] || data.settings.privacyLevel}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <span className="font-medium text-foreground">{safeT('polls.create.wizard.review.votingMethod', 'Voting Method')}</span>
                    <span className="text-muted-foreground font-semibold">{VOTING_METHOD_LABELS[data.settings.votingMethod] || data.settings.votingMethod}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <span className="font-medium text-foreground">{safeT('polls.create.wizard.review.multipleVotes', 'Multiple Votes')}</span>
                    <span className={cn("font-semibold", data.settings.allowMultipleVotes ? "text-green-600" : "text-muted-foreground")}>
                      {data.settings.allowMultipleVotes ? safeT('polls.create.wizard.review.enabled', 'Enabled') : safeT('polls.create.wizard.review.disabled', 'Disabled')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <span className="font-medium text-foreground">{safeT('polls.create.wizard.review.anonymousVotes', 'Anonymous Votes')}</span>
                    <span className={cn("font-semibold", data.settings.allowAnonymousVotes ? "text-green-600" : "text-muted-foreground")}>
                      {data.settings.allowAnonymousVotes ? safeT('polls.create.wizard.review.allowed', 'Allowed') : safeT('polls.create.wizard.review.disabled', 'Disabled')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <span className="font-medium text-foreground">{safeT('polls.create.wizard.review.requireSignIn', 'Require Sign In')}</span>
                    <span className={cn("font-semibold", data.settings.requireAuthentication ? "text-green-600" : "text-muted-foreground")}>
                      {data.settings.requireAuthentication ? safeT('polls.create.wizard.review.yes', 'Yes') : safeT('polls.create.wizard.review.no', 'No')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <span className="font-medium text-foreground">{safeT('polls.create.wizard.review.comments', 'Comments')}</span>
                    <span className={cn("font-semibold", data.settings.allowComments ? "text-green-600" : "text-muted-foreground")}>
                      {data.settings.allowComments ? safeT('polls.create.wizard.review.enabled', 'Enabled') : safeT('polls.create.wizard.review.disabled', 'Disabled')}
                    </span>
                  </div>
                </section>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{safeT('polls.create.page.title', 'Create Poll')}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {safeT('polls.create.page.subtitle', 'Create a new poll to gather opinions and make decisions.')}
          </p>
        </header>

        <WizardProgress steps={steps} onStepClick={handleStepClick} currentStep={currentStep} />

        {activeTip && (
          <aside className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4" aria-live="polite">
            <div className="flex gap-3">
              <span className="rounded-lg bg-primary/10 p-2 text-primary" aria-hidden>
                <Lightbulb className="h-5 w-5" />
              </span>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-primary">{activeTip.heading}</p>
                <p className="text-primary/80">{activeTip.body}</p>
              </div>
          </div>
          </aside>
        )}

        {hasErrors && (
          <Alert
            ref={errorSummaryRef}
            tabIndex={-1}
            variant="destructive"
            className="mb-6 border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950"
            aria-live="assertive"
            aria-atomic="true"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-red-900 dark:text-red-100">{safeT('polls.create.page.errorSummary.title', 'Please fix the following errors')}</AlertTitle>
            <AlertDescription className="text-red-800 dark:text-red-200">
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {errorMessages.map(({ id, message }) => (
                  <li key={id}>{message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-8">
          <CardContent className="p-6">{renderStep()}</CardContent>
        </Card>

        <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (currentStep > 0) {
                goToPreviousStep();
              }
            }}
            disabled={currentStep === 0 || isLoading}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {safeT('polls.create.page.buttons.previous', 'Previous')}
          </Button>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            {currentStep === POLL_CREATION_STEPS.length - 1 ? (
              <Button
                type="button"
                className="w-full"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSubmit();
                }}
                disabled={!canProceed || isLoading}
              >
                {isLoading ? safeT('polls.create.page.buttons.creating', 'Creating...') : safeT('polls.create.page.buttons.publish', 'Publish poll')}
              </Button>
            ) : (
              <Button
                type="button"
                className="w-full"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goToNextStep();
                }}
                disabled={!canProceed || isLoading}
              >
                {safeT('polls.create.page.buttons.next', 'Next')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </footer>
      </div>

      <Dialog open={Boolean(shareInfo)} onOpenChange={(open) => !open && handleCloseShareDialog()}>
        <DialogContent
          ref={shareDialogRef}
          aria-modal="true"
          aria-labelledby="share-dialog-title"
          aria-describedby="share-dialog-description share-dialog-link"
        >
          <DialogHeader>
            <DialogTitle id="share-dialog-title">{safeT('polls.create.share.dialog.title', 'Your poll is live!')}</DialogTitle>
            <DialogDescription id="share-dialog-description">
              {safeT('polls.create.share.dialog.description', `Share "${shareInfo?.title ?? safeT('polls.create.share.dialog.yourPoll', 'your poll')}" with others.`, { title: shareInfo?.title ?? safeT('polls.create.share.dialog.yourPoll', 'your poll') })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {shareInfo && (
              <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 p-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">{safeT('polls.create.share.dialog.pollTitle', 'Poll Title')}</p>
                    <p className="text-base font-semibold text-foreground">{shareInfo.title}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">{safeT('polls.create.share.dialog.privacy', 'Privacy')}</p>
                      <p>{PRIVACY_LABELS[shareInfo.privacyLevel] || shareInfo.privacyLevel}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">{safeT('polls.create.share.dialog.votingMethod', 'Voting Method')}</p>
                      <p>{VOTING_METHOD_LABELS[shareInfo.votingMethod] || shareInfo.votingMethod}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">{safeT('polls.create.share.dialog.category', 'Category')}</p>
                      <p className="capitalize">{shareInfo.category}</p>
                    </div>
                    {nextMilestone && (
                      <div>
                        <p className="text-xs font-medium uppercase text-muted-foreground">{safeT('polls.create.share.dialog.nextMilestone', 'Next Milestone')}</p>
                        <p>{safeT('polls.create.share.dialog.milestoneVotes', `${nextMilestone} votes`, { count: nextMilestone })}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="share-link">{safeT('polls.create.share.dialog.pollLink', 'Poll Link')}</Label>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  id="share-link"
                  value={shareUrl}
                  readOnly
                  onFocus={(event) => event.target.select()}
                  aria-describedby="share-dialog-link"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyShareLink}
                  ref={shareCopyButtonRef}
                >
                  {hasCopiedShareLink ? safeT('polls.create.share.dialog.copied', 'Copied!') : safeT('polls.create.share.dialog.copyLink', 'Copy Link')}
                </Button>
              </div>
              <div id="share-dialog-link" className="sr-only">
                {hasCopiedShareLink
                  ? safeT('polls.create.share.dialog.linkCopiedAria', 'Link copied to clipboard')
                  : safeT('polls.create.share.dialog.linkCopyHintAria', 'Click to copy poll link')}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={handleViewPoll}>
                {safeT('polls.create.share.dialog.buttons.viewPoll', 'View Poll')}
              </Button>
              <Button type="button" variant="outline" onClick={handleViewAnalytics}>
                {safeT('polls.create.share.dialog.buttons.viewAnalytics', 'View Analytics')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  window.open(`mailto:?subject=${encodeURIComponent(safeT('polls.create.share.dialog.email.subject', 'Check out this poll'))}&body=${encodeURIComponent(shareUrl)}`);
                  recordPollEvent('email_link', {
                    value: 1,
                    metadata: {
                      channel: 'email',
                      pollId: shareInfo?.pollId,
                    },
                    ...(shareInfo?.pollId ? { label: shareInfo.pollId } : {}),
                  });
                }}
              >
                {safeT('polls.create.share.dialog.buttons.emailLink', 'Email Link')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const tweetText = safeT('polls.create.share.dialog.x.tweet', `Check out this poll: "${shareInfo?.title ?? safeT('polls.create.share.dialog.yourPoll', 'your poll')}" ${shareUrl}`, { title: shareInfo?.title ?? safeT('polls.create.share.dialog.yourPoll', 'your poll'), url: shareUrl });
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank');
                  recordPollEvent('share_x', {
                    value: 1,
                    metadata: {
                      channel: 'x',
                      pollId: shareInfo?.pollId,
                    },
                    ...(shareInfo?.pollId ? { label: shareInfo.pollId } : {}),
                  });
                }}
              >
                {safeT('polls.create.share.dialog.buttons.shareOnX', 'Share on X')}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{safeT('polls.create.share.dialog.milestones.title', 'Vote Milestones')}</h3>
                  <p className="text-xs text-muted-foreground">
                    {safeT('polls.create.share.dialog.milestones.description', 'Get notified when your poll reaches these vote counts.')}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {safeT('polls.create.share.dialog.milestones.enabled', `${enabledMilestones.length} of ${milestones.length} enabled`, { current: enabledMilestones.length, total: milestones.length })}
                </span>
              </div>

              <div className="space-y-3">
                {milestones.map((milestone) => (
                  <div
                    key={`milestone-pref-${milestone}`}
                    className="flex items-start justify-between gap-4 rounded-md border border-border/60 bg-background p-3"
                  >
                    <div>
                      <Label htmlFor={`milestone-${milestone}`} className="text-sm font-medium">
                        {safeT('polls.create.share.dialog.milestones.notifyAt', `Notify at ${milestone} votes`, { count: milestone })}
                      </Label>
                      <p id={`milestone-${milestone}-description`} className="text-xs text-muted-foreground">
                        {safeT('polls.create.share.dialog.milestones.itemDescription', `Get notified when your poll reaches ${milestone} votes.`, { count: milestone })}
                      </p>
                    </div>
                    <Switch
                      id={`milestone-${milestone}`}
                      checked={Boolean(milestonePreferences[milestone])}
                      onCheckedChange={(checked) => handleMilestoneToggle(milestone, checked)}
                      aria-describedby={`milestone-${milestone}-description`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={handleCreateAnotherPoll}>
              {safeT('polls.create.share.dialog.buttons.createAnother', 'Create Another')}
            </Button>
            <Button type="button" onClick={handleViewPoll}>
              {safeT('polls.create.share.dialog.buttons.done', 'Done')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type WizardProgressProps = {
  steps: Array<{
    title: string;
    subtitle: string;
    index: number;
    isCurrent: boolean;
    isCompleted: boolean;
    hasError: boolean;
  }>;
  onStepClick?: (stepIndex: number) => void;
  currentStep: number;
};

const WizardProgress = ({ steps, onStepClick, currentStep }: WizardProgressProps) => {
  const { t } = useI18n();
  return (
    <nav aria-label={t('polls.create.wizard.progress.ariaLabel') || 'Poll creation steps'} className="mb-8">
      <ol className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {steps.map((step, index) => {
          const isClickable = onStepClick && (step.isCompleted || index <= currentStep);
          const handleClick = () => {
            if (isClickable && onStepClick) {
              onStepClick(index);
            }
          };

          return (
            <li key={step.title} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={handleClick}
                disabled={!isClickable}
                className={cn(
                  'flex flex-1 items-center gap-2 text-left transition-opacity',
                  isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default',
                  !isClickable && 'opacity-60'
                )}
                aria-label={`Go to step ${index + 1}: ${step.title}`}
                aria-current={step.isCurrent ? 'step' : undefined}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition',
                    step.isCompleted
                      ? 'border-green-500 bg-green-500 text-white'
                      : step.isCurrent
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground',
                    isClickable && 'hover:scale-105'
                  )}
                >
                  {step.isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" aria-hidden />
                  ) : step.hasError ? (
                    <AlertCircle className="h-5 w-5" aria-hidden />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.subtitle}</p>
                </div>
              </button>
              {index < steps.length - 1 && <div className="ml-2 hidden h-px flex-1 bg-border sm:block" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

type SettingToggleProps = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

// Interactive Preview Component for Step 4
type InteractivePreviewProps = {
  votingMethod: string;
  options: string[];
};

const InteractivePreview = ({ votingMethod, options }: InteractivePreviewProps) => {
  const [rankedOrder, setRankedOrder] = React.useState<string[]>(() => 
    options.map((_, index) => `option-${index}`)
  );
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [selectedSingle, setSelectedSingle] = React.useState<number | null>(null);
  const [selectedMultiple, setSelectedMultiple] = React.useState<number[]>([]);
  const [selectedApproval, setSelectedApproval] = React.useState<number[]>([]);

  // Initialize ranked order when options change
  React.useEffect(() => {
    setRankedOrder(options.map((_, index) => `option-${index}`));
  }, [options.length]);

  // Drag and drop handlers for ranked choice
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove('opacity-50');
    
    if (draggedIndex === null) return;
    
    const newOrder = [...rankedOrder];
    const draggedItem = newOrder[draggedIndex];
    if (!draggedItem) return;
    
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    
    setRankedOrder(newOrder);
    setDraggedIndex(null);
  };


  if (votingMethod === 'ranked') {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🏆</span>
            <span className="text-sm font-bold text-purple-900">Ranked Choice Voting</span>
          </div>
          <p className="text-xs text-purple-800 leading-relaxed">
            Voters will rank each option from 1st (most preferred) to last (least preferred).
          </p>
        </div>
        <div className="space-y-3">
          {rankedOrder.map((orderKey, displayIndex) => {
            const optionIndex = parseInt(orderKey.replace('option-', ''), 10);
            const option = options[optionIndex];
            if (optionIndex < 0 || optionIndex >= options.length || !option) return null;
            
            return (
              <div
                key={`preview-ranked-${orderKey}`}
                draggable
                onDragStart={() => handleDragStart(displayIndex)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, displayIndex)}
                className="flex items-center gap-3 p-4 rounded-lg border-2 border-purple-200 bg-white shadow-sm hover:shadow-md transition-all cursor-move hover:border-purple-300 active:scale-[0.98]"
              >
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 font-bold text-sm shadow-sm">
                  {displayIndex + 1}
                </div>
                <div className="flex-1">
                  <span className="text-base font-semibold text-foreground">{option}</span>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-purple-400" />
                  <div className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                    Rank {displayIndex + 1}
                  </div>
                </div>
              </div>
            );
          })}
          {options.length === 0 && (
            <p className="text-sm text-muted-foreground italic text-center py-4">No options added yet.</p>
          )}
        </div>
        <div className="mt-4 p-4 rounded-lg bg-purple-50/30 border border-purple-200">
          <p className="text-xs text-purple-900 leading-relaxed">
            <strong className="font-semibold">How it works:</strong> Drag options to reorder them, with 1st being your top choice.
            The system uses instant runoff to find the option with majority support.
          </p>
        </div>
      </div>
    );
  }

  if (votingMethod === 'single') {
    return (
      <div className="space-y-3">
        {options.map((option, index) => (
          <label
            key={`preview-single-${index}`}
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-border bg-card shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/60"
          >
            <input
              type="radio"
              name="preview-single-choice"
              checked={selectedSingle === index}
              onChange={() => setSelectedSingle(index)}
              className="h-5 w-5 text-primary focus:ring-primary"
            />
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-primary text-sm font-bold shrink-0 shadow-sm" aria-hidden>
              {index + 1}
            </span>
            <span className="text-base font-semibold text-foreground flex-1">{option}</span>
          </label>
        ))}
        {options.length === 0 && (
          <p className="text-sm text-muted-foreground italic text-center py-4">No options added yet.</p>
        )}
      </div>
    );
  }

  if (votingMethod === 'multiple') {
    return (
      <div className="space-y-3">
        {options.map((option, index) => (
          <label
            key={`preview-multiple-${index}`}
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-border bg-card shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/60"
          >
            <input
              type="checkbox"
              checked={selectedMultiple.includes(index)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedMultiple([...selectedMultiple, index]);
                } else {
                  setSelectedMultiple(selectedMultiple.filter(i => i !== index));
                }
              }}
              className="h-5 w-5 text-primary focus:ring-primary rounded"
            />
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-primary text-sm font-bold shrink-0 shadow-sm" aria-hidden>
              {index + 1}
            </span>
            <span className="text-base font-semibold text-foreground flex-1">{option}</span>
          </label>
        ))}
        {options.length === 0 && (
          <p className="text-sm text-muted-foreground italic text-center py-4">No options added yet.</p>
        )}
      </div>
    );
  }

  if (votingMethod === 'approval') {
    return (
      <div className="space-y-3">
        {options.map((option, index) => (
          <label
            key={`preview-approval-${index}`}
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-border bg-card shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/60"
          >
            <input
              type="checkbox"
              checked={selectedApproval.includes(index)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedApproval([...selectedApproval, index]);
                } else {
                  setSelectedApproval(selectedApproval.filter(i => i !== index));
                }
              }}
              className="h-5 w-5 text-primary focus:ring-primary rounded"
            />
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-primary text-sm font-bold shrink-0 shadow-sm" aria-hidden>
              {index + 1}
            </span>
            <span className="text-base font-semibold text-foreground flex-1">{option}</span>
          </label>
        ))}
        {options.length === 0 && (
          <p className="text-sm text-muted-foreground italic text-center py-4">No options added yet.</p>
        )}
      </div>
    );
  }

  // Default fallback for other voting methods
  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <div key={`preview-default-${index}`} className="flex items-center gap-3 p-4 rounded-lg border-2 border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-primary text-sm font-bold shrink-0 shadow-sm" aria-hidden>
            {index + 1}
          </span>
          <span className="text-base font-semibold text-foreground">{option}</span>
        </div>
      ))}
      {options.length === 0 && (
        <p className="text-sm text-muted-foreground italic text-center py-4">No options added yet.</p>
      )}
    </div>
  );
};

const SettingToggle = ({ id, label, description, checked, onCheckedChange }: SettingToggleProps) => {
  // Ensure we never show generic "Label" or "Description" text
  const displayLabel = label && label !== 'Label' && !label.includes('polls.create.') ? label : 'Setting';
  const displayDescription = description && description !== 'Description' && description !== 'Hint' && !description.includes('polls.create.') ? description : '';

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-4 hover:border-primary/40 transition-colors">
      <div className="space-y-1 flex-1">
        <Label htmlFor={id} className="font-semibold text-sm cursor-pointer">
          {displayLabel}
        </Label>
        {displayDescription && (
          <p id={`${id}-description`} className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {displayDescription}
          </p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-describedby={displayDescription ? `${id}-description` : undefined}
        className="shrink-0"
      />
    </div>
  );
};
