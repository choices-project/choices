"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Plus,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

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
    canGoBack,
    isLoading,
    categories,
    actions,
    goToNextStep,
    goToPreviousStep,
    submit,
  } = usePollCreateController()

  const PRIVACY_LABELS: Record<string, string> = useMemo(() => ({
    public: t('polls.create.privacy.public'),
    private: t('polls.create.privacy.private'),
    unlisted: t('polls.create.privacy.unlisted'),
  }), [t]);

  const VOTING_METHOD_LABELS: Record<string, string> = useMemo(() => ({
    single: t('polls.create.votingMethod.single'),
    multiple: t('polls.create.votingMethod.multiple'),
    approval: t('polls.create.votingMethod.approval'),
    ranked: t('polls.create.votingMethod.ranked'),
  }), [t]);

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

  const handleDataUpdate = (update: Partial<typeof data>) => {
    actions.updateData(update)
    Object.keys(update).forEach((field) => actions.clearFieldError(field))
  }

  const handleOptionChange = (index: number, value: string) => {
    actions.updateOption(index, value)
    actions.clearFieldError(`option-${index}`)
    actions.clearFieldError("options")
  }

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

  const handleSubmit = async () => {
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
          title: t('polls.create.notifications.signInRequired.title'),
          message: t('polls.create.notifications.signInRequired.message'),
          duration: 6000,
        });
        router.push(`/auth?redirect=${encodeURIComponent('/polls/create')}`);
        return;
      }

      if (result.status === 403) {
        addNotification({
          type: 'error',
          title: t('polls.create.notifications.accessDenied.title'),
          message: t('polls.create.notifications.accessDenied.message'),
          duration: 6000,
        });
        return;
      }

      if (result.status === 429) {
        addNotification({
          type: 'warning',
          title: t('polls.create.notifications.rateLimit.title'),
          message: t('polls.create.notifications.rateLimit.message'),
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
      title: t('polls.create.notifications.pollCreated.title'),
      message: result.message ?? t('polls.create.notifications.pollCreated.message'),
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
              <Label htmlFor="description">{t('polls.create.wizard.details.description.label')}</Label>
              <Textarea
                 id="description"
                 value={data.description}
                onChange={(event) => handleDataUpdate({ description: event.target.value })}
                placeholder={t('polls.create.wizard.details.description.placeholder')}
                rows={5}
                maxLength={DESCRIPTION_CHAR_LIMIT}
                aria-invalid={Boolean(errors.description)}
                aria-describedby="description-hint description-count"
              />
              <div id="description-hint" className="mt-2 text-xs text-muted-foreground">
                {t('polls.create.wizard.details.description.hint')}
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
                {t('polls.create.wizard.options.label') || 'Poll Options'}
              </legend>
              <p className="mt-1 text-sm text-muted-foreground mb-4">
                {t('polls.create.wizard.options.hint') || 'Provide clear, distinct choices for voters to select from.'}
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
                <span>{t('polls.create.wizard.options.maxHint', { max: MAX_OPTIONS }) || `You can add up to ${MAX_OPTIONS} options.`}</span>
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
                  <Label htmlFor="privacy-level">{t('polls.create.wizard.audience.privacy.label') || 'Privacy level'}</Label>
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
                  <p id="privacy-help" className="mt-2 text-xs text-muted-foreground">
                    {t('polls.create.wizard.audience.privacy.hint') || 'Control who can find and access your poll.'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="voting-method">{t('polls.create.wizard.audience.votingMethod.label') || 'Voting method'}</Label>
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
                  <p id="voting-method-help" className="mt-2 text-xs text-muted-foreground">
                    {t('polls.create.wizard.audience.votingMethod.hint') || 'Choose how votes are counted and ranked.'}
                  </p>
                </div>
              </fieldset>
            </div>

            {/* Category Section */}
            <fieldset>
              <Label>{t('polls.create.wizard.audience.category.label')}</Label>
              <p className="mt-1 text-xs text-muted-foreground">{t('polls.create.wizard.audience.category.hint')}</p>
              {errors.category && (
                <p className="mt-2 text-sm text-destructive" id="error-category">
                  {errors.category}
                </p>
              )}

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {categories.map((category) => {
                  const isSelected = data.category === category.id;
                  return (
                  <button
                    key={category.id}
                    type="button"
                      onClick={() => handleDataUpdate({ category: category.id })}
                      className={cn(
                        "rounded-lg border p-4 text-left transition",
                        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/60",
                      )}
                      aria-pressed={isSelected}
                    >
                      <div className="text-2xl" aria-hidden>
                        {category.icon}
                      </div>
                      <div className="mt-2 font-medium">{category.name}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
                  </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <Label htmlFor="tags">{t('polls.create.wizard.audience.tags.label')}</Label>
              <p className="mt-1 text-xs text-muted-foreground">{t('polls.create.wizard.audience.tags.hint')}</p>
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
                    placeholder={t('polls.create.wizard.audience.tags.placeholder')}
                    aria-describedby="tags-hint"
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    {t('polls.create.wizard.audience.tags.add')}
                  </Button>
                </div>
              )}
              <div id="tags-hint" className="mt-2 text-xs text-muted-foreground">
                {t('polls.create.wizard.audience.tags.maxHint', { max: MAX_TAGS })}
            </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-medium">{t('polls.create.wizard.audience.settings.legend')}</legend>
              <SettingToggle
                id="allow-multiple-votes"
                label={t('polls.create.wizard.audience.settings.allowMultipleVotes.label')}
                description={t('polls.create.wizard.audience.settings.allowMultipleVotes.description')}
                      checked={data.settings.allowMultipleVotes}
                onCheckedChange={(checked) => actions.updateSettings({ allowMultipleVotes: checked })}
              />
              <SettingToggle
                id="allow-anonymous-votes"
                label={t('polls.create.wizard.audience.settings.allowAnonymousVotes.label')}
                description={t('polls.create.wizard.audience.settings.allowAnonymousVotes.description')}
                      checked={data.settings.allowAnonymousVotes}
                onCheckedChange={(checked) => actions.updateSettings({ allowAnonymousVotes: checked })}
              />
              <SettingToggle
                id="require-authentication"
                label={t('polls.create.wizard.audience.settings.requireAuthentication.label')}
                description={t('polls.create.wizard.audience.settings.requireAuthentication.description')}
                checked={data.settings.requireAuthentication}
                onCheckedChange={(checked) => actions.updateSettings({ requireAuthentication: checked })}
              />
              <SettingToggle
                id="show-results"
                label={t('polls.create.wizard.audience.settings.showResults.label')}
                description={t('polls.create.wizard.audience.settings.showResults.description')}
                      checked={data.settings.showResults}
                onCheckedChange={(checked) => actions.updateSettings({ showResults: checked })}
              />
              <SettingToggle
                id="allow-comments"
                label={t('polls.create.wizard.audience.settings.allowComments.label')}
                description={t('polls.create.wizard.audience.settings.allowComments.description')}
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
              <h3 className="text-base font-semibold mb-1">Preview</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This is what voters will see.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('polls.create.wizard.review.title') || 'Review Your Poll'}</CardTitle>
                <CardDescription>{t('polls.create.wizard.review.description') || 'Double-check everything before publishing.'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <section>
                  <h3 className="text-lg font-semibold">{data.title || t('polls.create.wizard.review.untitled') || 'Untitled Poll'}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {data.description || t('polls.create.wizard.review.noDescription') || 'No description provided.'}
                  </p>
                </section>

                  <Separator />

                <section>
                  <h4 className="text-sm font-semibold mb-3">{t('polls.create.wizard.review.optionsHeading') || 'Poll Options'}</h4>
                  <div className="space-y-2">
                    {data.options
                      .filter((option) => option.trim().length > 0)
                      .map((option, index) => (
                        <div key={`preview-option-${index}`} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary text-primary text-sm font-semibold shrink-0" aria-hidden>
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium">{option || `Option ${index + 1}`}</span>
                        </div>
                      ))}
                    {data.options.filter((option) => option.trim().length > 0).length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No options added yet.</p>
                    )}
                  </div>
                </section>

                  <Separator />

                <section className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">{data.category}</Badge>
                    {data.tags.map((tag) => (
                    <Badge key={`preview-tag-${tag}`} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </section>

                <section className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                  <p>
                    <span className="font-medium text-foreground">{t('polls.create.wizard.review.privacy')}:</span> {PRIVACY_LABELS[data.settings.privacyLevel]}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">{t('polls.create.wizard.review.votingMethod')}:</span> {VOTING_METHOD_LABELS[data.settings.votingMethod]}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">{t('polls.create.wizard.review.multipleVotes')}:</span> {data.settings.allowMultipleVotes ? t('polls.create.wizard.review.enabled') : t('polls.create.wizard.review.disabled')}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">{t('polls.create.wizard.review.anonymousVotes')}:</span> {data.settings.allowAnonymousVotes ? t('polls.create.wizard.review.allowed') : t('polls.create.wizard.review.disabled')}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">{t('polls.create.wizard.review.requireSignIn')}:</span> {data.settings.requireAuthentication ? t('polls.create.wizard.review.yes') : t('polls.create.wizard.review.no')}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">{t('polls.create.wizard.review.comments')}:</span> {data.settings.allowComments ? t('polls.create.wizard.review.enabled') : t('polls.create.wizard.review.disabled')}
                  </p>
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('polls.create.page.title')}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {t('polls.create.page.subtitle')}
          </p>
        </header>

        <WizardProgress steps={steps} />

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
            <AlertTitle className="text-red-900 dark:text-red-100">{t('polls.create.page.errorSummary.title')}</AlertTitle>
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
            onClick={goToPreviousStep}
            disabled={!canGoBack || isLoading}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('polls.create.page.buttons.previous')}
          </Button>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            {currentStep === POLL_CREATION_STEPS.length - 1 ? (
              <Button type="button" className="w-full" onClick={handleSubmit} disabled={!canProceed || isLoading}>
                {isLoading ? t('polls.create.page.buttons.creating') : t('polls.create.page.buttons.publish')}
              </Button>
            ) : (
              <Button type="button" className="w-full" onClick={goToNextStep} disabled={!canProceed || isLoading}>
                {t('polls.create.page.buttons.next')}
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
            <DialogTitle id="share-dialog-title">{t('polls.create.share.dialog.title')}</DialogTitle>
            <DialogDescription id="share-dialog-description">
              {t('polls.create.share.dialog.description', { title: shareInfo?.title ?? t('polls.create.share.dialog.yourPoll') })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {shareInfo && (
              <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 p-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">{t('polls.create.share.dialog.pollTitle')}</p>
                    <p className="text-base font-semibold text-foreground">{shareInfo.title}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">{t('polls.create.share.dialog.privacy')}</p>
                      <p>{PRIVACY_LABELS[shareInfo.privacyLevel]}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">{t('polls.create.share.dialog.votingMethod')}</p>
                      <p>{VOTING_METHOD_LABELS[shareInfo.votingMethod]}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">{t('polls.create.share.dialog.category')}</p>
                      <p className="capitalize">{shareInfo.category}</p>
                    </div>
                    {nextMilestone && (
                      <div>
                        <p className="text-xs font-medium uppercase text-muted-foreground">{t('polls.create.share.dialog.nextMilestone')}</p>
                        <p>{t('polls.create.share.dialog.milestoneVotes', { count: nextMilestone })}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="share-link">{t('polls.create.share.dialog.pollLink')}</Label>
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
                  {hasCopiedShareLink ? t('polls.create.share.dialog.copied') : t('polls.create.share.dialog.copyLink')}
                </Button>
              </div>
              <div id="share-dialog-link" className="sr-only">
                {hasCopiedShareLink
                  ? t('polls.create.share.dialog.linkCopiedAria')
                  : t('polls.create.share.dialog.linkCopyHintAria')}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={handleViewPoll}>
                {t('polls.create.share.dialog.buttons.viewPoll')}
              </Button>
              <Button type="button" variant="outline" onClick={handleViewAnalytics}>
                {t('polls.create.share.dialog.buttons.viewAnalytics')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  window.open(`mailto:?subject=${encodeURIComponent(t('polls.create.share.dialog.email.subject'))}&body=${encodeURIComponent(shareUrl)}`);
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
                {t('polls.create.share.dialog.buttons.emailLink')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(t('polls.create.share.dialog.x.tweet', { title: shareInfo?.title ?? t('polls.create.share.dialog.yourPoll'), url: shareUrl }))}`, '_blank');
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
                {t('polls.create.share.dialog.buttons.shareOnX')}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t('polls.create.share.dialog.milestones.title')}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t('polls.create.share.dialog.milestones.description')}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {t('polls.create.share.dialog.milestones.enabled', { current: enabledMilestones.length, total: milestones.length })}
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
                        {t('polls.create.share.dialog.milestones.notifyAt', { count: milestone })}
                      </Label>
                      <p id={`milestone-${milestone}-description`} className="text-xs text-muted-foreground">
                        {t('polls.create.share.dialog.milestones.itemDescription', { count: milestone })}
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
              {t('polls.create.share.dialog.buttons.createAnother')}
            </Button>
            <Button type="button" onClick={handleViewPoll}>
              {t('polls.create.share.dialog.buttons.done')}
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
};

const WizardProgress = ({ steps }: WizardProgressProps) => {
  const { t } = useI18n();
  return (
    <nav aria-label={t('polls.create.wizard.progress.ariaLabel')} className="mb-8">
      <ol className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {steps.map((step, index) => (
          <li key={step.title} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition',
                step.isCompleted
                  ? 'border-green-500 bg-green-500 text-white'
                  : step.isCurrent
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground',
              )}
              aria-current={step.isCurrent ? 'step' : undefined}
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
            {index < steps.length - 1 && <div className="ml-2 hidden h-px flex-1 bg-border sm:block" />}
          </li>
        ))}
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

const SettingToggle = ({ id, label, description, checked, onCheckedChange }: SettingToggleProps) => (
  <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-4">
    <div className="space-y-1">
      <Label htmlFor={id} className="font-medium">
        {label}
      </Label>
      <p id={`${id}-description`} className="text-xs text-muted-foreground">
        {description}
      </p>
    </div>
    <Switch
      id={id}
      checked={checked}
      onChange={(event) => onCheckedChange(event.currentTarget.checked)}
      aria-describedby={`${id}-description`}
    />
  </div>
);
