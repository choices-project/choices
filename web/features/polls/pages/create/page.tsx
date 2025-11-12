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
import { usePollMilestoneNotifications, type PollMilestone } from '@/features/polls/hooks/usePollMilestones';
import { useRecordPollEvent, type PollEventOptions } from '@/features/polls/hooks/usePollAnalytics';
import { useNotificationActions } from "@/lib/stores"
import { cn } from "@/lib/utils"

import {
  DESCRIPTION_CHAR_LIMIT,
  MAX_OPTIONS,
  MAX_TAGS,
  POLL_CREATION_STEPS,
  TITLE_CHAR_LIMIT,
} from "./constants"
import { usePollCreateController } from "./hooks"


const PRIVACY_LABELS: Record<string, string> = {
  public: "Public – anyone can discover and vote",
  private: "Private – only people with the link can participate",
  unlisted: "Unlisted – hidden from search but open to anyone with the link",
}

const VOTING_METHOD_LABELS: Record<string, string> = {
  single: "Single choice",
  multiple: "Multiple selection",
  approval: "Approval voting",
  ranked: "Ranked choice",
}

type ShareModalState = {
  pollId: string
  title: string
  privacyLevel: 'public' | 'private' | 'unlisted'
  category: string
  votingMethod: string
}

export default function CreatePollPage() {
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

  const [newTag, setNewTag] = useState("")
  const [shareInfo, setShareInfo] = useState<ShareModalState | null>(null)
  const [hasCopiedShareLink, setHasCopiedShareLink] = useState(false)
  const { addNotification } = useNotificationActions()
  const errorSummaryRef = useRef<HTMLDivElement | null>(null)

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
        title: 'Link copied',
        message: 'Share the link with your audience to start collecting votes.',
        duration: 3000,
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Unable to copy link',
        message: error instanceof Error ? error.message : 'Please copy the link manually.',
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
        title: "Too many tags",
        message: `You can add up to ${MAX_TAGS} tags.`,
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
          title: 'Sign in required',
          message: 'Please sign in to publish your poll.',
          duration: 6000,
        });
        router.push(`/auth?redirect=${encodeURIComponent('/polls/create')}`);
        return;
      }

      if (result.status === 403) {
        addNotification({
          type: 'error',
          title: 'Access denied',
          message: 'You do not have permission to create polls on this account.',
          duration: 6000,
        });
        return;
      }

      if (result.status === 429) {
        addNotification({
          type: 'warning',
          title: 'Slow down',
          message: 'You are creating polls too quickly. Please wait a moment and try again.',
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
        title: result.fieldErrors ? 'Check the highlighted fields' : 'Unable to create poll',
        message: result.message ?? 'Please try again in a moment.',
        duration: 6000,
      });
      return;
    }

    const { pollId, title: createdTitle } = result;
    const shareTitle = createdTitle ?? data.title;

    addNotification({
      type: 'success',
      title: 'Poll created',
      message: result.message ?? 'Share your poll to start collecting votes.',
      duration: 4000,
    });

    recordPollEvent('poll_created', {
      category: 'poll_creation',
      label: pollId,
      value: 1,
      metadata: {
        pollId,
        status: result.status,
        durationMs: result.durationMs,
        optionCount: data.options.length,
        privacyLevel: data.settings.privacyLevel,
        category: data.category,
      },
    });

    setShareInfo({
      pollId,
      title: shareTitle,
      privacyLevel: data.settings.privacyLevel,
      category: data.category,
      votingMethod: data.settings.votingMethod,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('choices:poll-created', {
          detail: { id: pollId, title: createdTitle },
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                 id="description"
                 value={data.description}
                onChange={(event) => handleDataUpdate({ description: event.target.value })}
                placeholder="Explain the context, stakes, or background so voters can make an informed decision."
                rows={5}
                maxLength={DESCRIPTION_CHAR_LIMIT}
                aria-invalid={Boolean(errors.description)}
                aria-describedby="description-hint description-count"
              />
              <div id="description-hint" className="mt-2 text-xs text-muted-foreground">
                Help voters understand why this poll matters. Include relevant context and goals.
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
              <Label>Poll options</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Provide at least two clear, distinct choices so voters can differentiate at a glance.
              </p>
              {errors.options && (
                <p className="mt-2 text-sm text-destructive" id="error-options">
                  {errors.options}
                </p>
              )}

              <div className="mt-4 space-y-3" role="group" aria-labelledby="poll-options">
                {data.options.map((option, index) => (
                  <div key={`option-${index}`} className="flex items-start gap-2">
                    <Input
                      value={option}
                      onChange={(event) => handleOptionChange(index, event.target.value)}
                      placeholder={`Option ${index + 1}`}
                      aria-label={`Option ${index + 1}`}
                      aria-invalid={Boolean(errors[`option-${index}`])}
                    />
                    {data.options.length > 2 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="mt-1 text-muted-foreground hover:text-destructive"
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
                <span>{`You can add up to ${MAX_OPTIONS} options.`}</span>
                <span>
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
                Add option
                </Button>
            </fieldset>
          </div>
        )

      case "audience":
        return (
          <div className="space-y-8">
            <fieldset>
              <Label>Category</Label>
              <p className="mt-1 text-xs text-muted-foreground">Categorize your poll so the right people can discover it.</p>
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
              <Label htmlFor="tags">Tags</Label>
              <p className="mt-1 text-xs text-muted-foreground">Add keywords so your poll shows up in relevant searches.</p>
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
                      aria-label={`Remove tag ${tag}`}
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
                    placeholder="Add a tag"
                    aria-describedby="tags-hint"
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
              )}
              <div id="tags-hint" className="mt-2 text-xs text-muted-foreground">
                {`You can add up to ${MAX_TAGS} tags.`}
            </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-medium">Participation & privacy</legend>
              <SettingToggle
                id="allow-multiple-votes"
                label="Allow multiple votes"
                description="Enable if voters should be able to support more than one option."
                      checked={data.settings.allowMultipleVotes}
                onCheckedChange={(checked) => actions.updateSettings({ allowMultipleVotes: checked })}
              />
              <SettingToggle
                id="allow-anonymous-votes"
                label="Allow anonymous votes"
                description="Disable this if you need to know exactly who participated."
                      checked={data.settings.allowAnonymousVotes}
                onCheckedChange={(checked) => actions.updateSettings({ allowAnonymousVotes: checked })}
              />
              <SettingToggle
                id="require-authentication"
                label="Require sign-in to vote"
                description="Ensure voters are authenticated before submitting a response."
                checked={data.settings.requireAuthentication}
                onCheckedChange={(checked) => actions.updateSettings({ requireAuthentication: checked })}
              />
              <SettingToggle
                id="show-results"
                label="Show results in real time"
                description="Disable to hide results until the poll closes."
                      checked={data.settings.showResults}
                onCheckedChange={(checked) => actions.updateSettings({ showResults: checked })}
              />
              <SettingToggle
                id="allow-comments"
                label="Allow comments"
                description="Collect qualitative feedback alongside quantitative votes."
                      checked={data.settings.allowComments}
                onCheckedChange={(checked) => actions.updateSettings({ allowComments: checked })}
              />
            </fieldset>

            <fieldset className="grid gap-6 md:grid-cols-2">
                  <div>
                <Label htmlFor="privacy-level">Privacy level</Label>
                    <select
                  id="privacy-level"
                  className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
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
                  Change who can discover and participate in this poll.
                </p>
                  </div>

                  <div>
                <Label htmlFor="voting-method">Voting method</Label>
                    <select
                  id="voting-method"
                  className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
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
                  Choose the mechanics that best fit how you want to evaluate responses.
                </p>
                  </div>
            </fieldset>
          </div>
        )

      case 'review':
      default:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview your poll</CardTitle>
                <CardDescription>Review everything voters will see before you publish.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <section>
                  <h3 className="text-lg font-semibold">{data.title || 'Untitled poll'}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {data.description || 'Add a description to help voters understand the context.'}
                  </p>
                </section>

                  <Separator />

                <section>
                  <h4 className="text-sm font-semibold">Options</h4>
                  <ul className="mt-2 space-y-2">
                    {data.options
                      .filter((option) => option.trim().length > 0)
                      .map((option, index) => (
                        <li key={`preview-option-${index}`} className="flex items-center gap-2 text-sm">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full border" aria-hidden />
                          <span>{option}</span>
                        </li>
                      ))}
                  </ul>
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
                    <span className="font-medium text-foreground">Privacy:</span> {PRIVACY_LABELS[data.settings.privacyLevel]}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Voting method:</span> {VOTING_METHOD_LABELS[data.settings.votingMethod]}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Multiple votes:</span> {data.settings.allowMultipleVotes ? 'Enabled' : 'Disabled'}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Anonymous votes:</span> {data.settings.allowAnonymousVotes ? 'Allowed' : 'Disabled'}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Require sign-in:</span> {data.settings.requireAuthentication ? 'Yes' : 'No'}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Comments:</span> {data.settings.allowComments ? 'Enabled' : 'Disabled'}
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Create a new poll</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Guide your audience through a clear decision. Fill out each step to describe the poll, add options, and set
            participation rules.
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
            className="mb-6"
            aria-live="assertive"
            aria-atomic="true"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Resolve these items before continuing</AlertTitle>
            <AlertDescription>
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
            Previous
          </Button>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            {currentStep === POLL_CREATION_STEPS.length - 1 ? (
              <Button type="button" className="w-full" onClick={handleSubmit} disabled={!canProceed || isLoading}>
                {isLoading ? 'Creating…' : 'Publish poll'}
              </Button>
            ) : (
              <Button type="button" className="w-full" onClick={goToNextStep} disabled={!canProceed || isLoading}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </footer>
      </div>

      <Dialog
        open={Boolean(shareInfo)}
        onOpenChange={(open) => {
          if (!open && shareInfo) {
            recordPollEvent('share_modal_closed', { metadata: { pollId: shareInfo?.pollId ?? null } });
            setShareInfo(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share your poll</DialogTitle>
            <DialogDescription>
              Help voters discover “{shareInfo?.title ?? 'your poll'}” by sharing the link below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {shareInfo && (
              <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 p-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Poll title</p>
                    <p className="text-base font-semibold text-foreground">{shareInfo.title}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">Privacy</p>
                      <p>{PRIVACY_LABELS[shareInfo.privacyLevel]}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">Voting method</p>
                      <p>{VOTING_METHOD_LABELS[shareInfo.votingMethod]}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">Category</p>
                      <p className="capitalize">{shareInfo.category}</p>
                    </div>
                    {nextMilestone && (
                      <div>
                        <p className="text-xs font-medium uppercase text-muted-foreground">Next milestone</p>
                        <p>{nextMilestone.toLocaleString()} votes</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="share-link">Poll link</Label>
              <div className="mt-2 flex items-center gap-2">
                <Input id="share-link" value={shareUrl} readOnly onFocus={(event) => event.target.select()} />
                <Button type="button" variant="outline" onClick={handleCopyShareLink}>
                  {hasCopiedShareLink ? 'Copied' : 'Copy link'}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={handleViewPoll}>
                View poll
              </Button>
              <Button type="button" variant="outline" onClick={handleViewAnalytics}>
                View analytics
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  window.open(`mailto:?subject=${encodeURIComponent('Check out this poll')}&body=${encodeURIComponent(shareUrl)}`);
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
                Email link
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Vote now: ${shareInfo?.title ?? 'this poll'} ${shareUrl}`)}`, '_blank');
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
                Share on X
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Milestone alerts</h3>
                  <p className="text-xs text-muted-foreground">
                    Receive in-app alerts when your poll reaches key vote counts.
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {enabledMilestones.length}/{milestones.length} enabled
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
                        Notify me at {milestone.toLocaleString()} votes
                      </Label>
                      <p id={`milestone-${milestone}-description`} className="text-xs text-muted-foreground">
                        Sends an alert when the poll crosses {milestone.toLocaleString()} votes so you can celebrate or
                        share again.
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
              Create another poll
            </Button>
            <Button type="button" onClick={handleViewPoll}>
              Done
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
  return (
    <nav aria-label="Poll creation progress" className="mb-8">
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
