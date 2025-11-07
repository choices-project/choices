'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { useAnalyticsActions, useAnalyticsStore } from '@/lib/stores/analyticsStore';
import logger from '@/lib/utils/logger';

import { AnalyticsTestBridge } from '../_components/AnalyticsTestBridge';

type WizardStep = 'details' | 'options' | 'audience' | 'review' | 'share';

const WIZARD_STEPS: readonly WizardStep[] = ['details', 'options', 'audience', 'review'];

type PollFormState = {
  title: string;
  description: string;
  options: string[];
  category: string;
  tags: string[];
  allowMultipleVotes: boolean;
  allowAnonymousVotes: boolean;
  requireAuthentication: boolean;
  showResults: boolean;
  allowComments: boolean;
  privacyLevel: 'public' | 'private' | 'unlisted';
  votingMethod: 'single' | 'multiple' | 'ranked';
};

const DEFAULT_FORM: PollFormState = {
  title: '',
  description: '',
  options: ['', ''],
  category: 'general',
  tags: [],
  allowMultipleVotes: false,
  allowAnonymousVotes: true,
  requireAuthentication: false,
  showResults: true,
  allowComments: true,
  privacyLevel: 'public',
  votingMethod: 'single',
};

const CATEGORIES: Array<{ id: string; name: string; description: string }> = [
  { id: 'general', name: 'General', description: 'General purpose polls' },
  { id: 'technology', name: 'Technology', description: 'Product and roadmap decisions' },
  { id: 'community', name: 'Community', description: 'Engage members with collaborative votes' },
];

const PRIVACY_LABELS: Record<PollFormState['privacyLevel'], string> = {
  public: 'Public – anyone can discover and vote',
  private: 'Private – only people with the link can participate',
  unlisted: 'Unlisted – hidden from search but open to anyone with the link',
};

const VOTING_METHOD_LABELS: Record<PollFormState['votingMethod'], string> = {
  single: 'Single choice',
  multiple: 'Multiple selection',
  ranked: 'Ranked choice',
};

const StepIndicator = ({ step }: { step: WizardStep }) => {
  const steps: Array<{ id: WizardStep; label: string }> = [
    { id: 'details', label: 'Describe' },
    { id: 'options', label: 'Options' },
    { id: 'audience', label: 'Audience' },
    { id: 'review', label: 'Review' },
  ];

  return (
    <ol className="mb-6 flex flex-wrap gap-2 text-sm" aria-label="Poll creation progress">
      {steps.map(({ id, label }, index) => {
        const isCurrent = step === id;
        const isCompleted = steps.findIndex((s) => s.id === step) > index;

        return (
          <li
            key={id}
            className={`rounded-full border px-3 py-1 ${
              isCurrent ? 'border-blue-600 bg-blue-50 text-blue-700' : isCompleted ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'
            }`}
          >
            {label}
          </li>
        );
      })}
    </ol>
  );
};

const ShareDialog = ({ form, onClose }: { form: PollFormState; onClose: () => void }) => {
  const primaryTag = form.tags[0] ?? 'No tag';

  return (
    <div role="dialog" aria-modal="true" className="rounded-lg border bg-white p-6 shadow-xl">
      <h2 className="text-xl font-semibold">Share your poll</h2>
      <p className="mt-2 text-sm text-slate-600">Your poll is ready. Copy the link and share it with your audience.</p>

      <dl className="mt-6 space-y-2 text-sm">
        <div>
          <dt className="font-medium text-slate-700">Title</dt>
          <dd>{form.title}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-700">Privacy</dt>
          <dd>{PRIVACY_LABELS[form.privacyLevel]}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-700">Voting method</dt>
          <dd>{VOTING_METHOD_LABELS[form.votingMethod]}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-700">Primary tag</dt>
          <dd>{primaryTag}</dd>
        </div>
      </dl>

      <button
        type="button"
        className="mt-6 inline-flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        onClick={onClose}
      >
        Done
      </button>
    </div>
  );
};

export default function PollCreateHarnessPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<PollFormState>(DEFAULT_FORM);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedPollId, setSubmittedPollId] = useState<string | null>(null);
  const [shareInfo, setShareInfo] = useState<{ pollId: string; title: string } | null>(null);
  const { trackEvent } = useAnalyticsActions();
  const sessionId = useAnalyticsStore((state) => state.sessionId) ?? 'harness';
  const hasTrackedSuccessRef = useRef(false);
  const hasTrackedShareRef = useRef(false);

  const step = useMemo<WizardStep>(() => {
    if (submittedPollId) {
      return 'share';
    }
    return WIZARD_STEPS[stepIndex] ?? 'details';
  }, [stepIndex, submittedPollId]);

  const canProceed = useMemo(() => {
    if (step === 'details') {
      return form.title.trim().length >= 3 && form.description.trim().length >= 10;
    }
    if (step === 'options') {
      return form.options.filter((option) => option.trim().length > 0).length >= 2;
    }
    if (step === 'audience') {
      return form.tags.length > 0;
    }
    return true;
  }, [step, form]);

  const setOption = (index: number, value: string) => {
    setForm((prev) => {
      const options = [...prev.options];
      options[index] = value;
      return { ...prev, options };
    });
  };

  const addOption = () => {
    setForm((prev) => ({ ...prev, options: [...prev.options, ''] }));
  };

  const removeOption = (index: number) => {
    setForm((prev) => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }));
  };

  const addTag = () => {
    const trimmed = newTag.trim().toLowerCase();
    if (!trimmed) return;
    setForm((prev) => ({ ...prev, tags: prev.tags.includes(trimmed) ? prev.tags : [...prev.tags, trimmed] }));
    setNewTag('');
  };

  const goNext = () => {
    if (!canProceed) return;
    setStepIndex((prev) => Math.min(prev + 1, 3));
  };

  const goPrev = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        options: form.options.filter((option) => option.trim().length > 0),
        category: form.category,
        tags: form.tags,
        settings: {
          allowMultipleVotes: form.allowMultipleVotes,
          allowAnonymousVotes: form.allowAnonymousVotes,
          requireAuthentication: form.requireAuthentication,
          showResults: form.showResults,
          allowComments: form.allowComments,
          privacyLevel: form.privacyLevel,
          votingMethod: form.votingMethod,
        },
      };

      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload }),
      });

      if (!response.ok) {
        throw new Error('Failed to create poll');
      }

      const body = (await response.json()) as { data?: { id?: string } };
      const newId = body.data?.id ?? `harness-${Date.now()}`;
      setSubmittedPollId(newId);
      setShareInfo({ pollId: newId, title: form.title });
    } catch (error) {
      logger.error('Harness poll submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!submittedPollId || hasTrackedSuccessRef.current) {
      return;
    }

    hasTrackedSuccessRef.current = true;
    const validOptions = form.options.filter((option) => option.trim().length > 0);

    trackEvent({
      event_type: 'poll_event',
      type: 'poll_event',
      category: 'poll_authoring',
      action: 'poll_created',
      session_id: sessionId,
      event_data: {
        pollId: submittedPollId,
        title: form.title,
        optionCount: validOptions.length,
        tagCount: form.tags.length,
        privacy: form.privacyLevel,
        votingMethod: form.votingMethod,
      },
      created_at: new Date().toISOString(),
      label: form.title,
      value: validOptions.length,
      metadata: {
        harness: true,
      },
    });
  }, [form, sessionId, submittedPollId, trackEvent]);

  useEffect(() => {
    if (!shareInfo || hasTrackedShareRef.current || !submittedPollId) {
      return;
    }

    hasTrackedShareRef.current = true;
    trackEvent({
      event_type: 'poll_event',
      type: 'poll_event',
      category: 'poll_authoring',
      action: 'poll_share_opened',
      session_id: sessionId,
      event_data: {
        pollId: shareInfo.pollId,
        title: shareInfo.title,
        harness: true,
      },
      created_at: new Date().toISOString(),
      label: shareInfo.title,
    });
  }, [sessionId, shareInfo, submittedPollId, trackEvent]);

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <AnalyticsTestBridge />
      <div className="mx-auto max-w-3xl rounded-xl border bg-white px-6 py-8 shadow-sm">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Poll creation harness</h1>
          <p className="mt-1 text-sm text-slate-500">
            This lightweight flow mirrors the primary poll authoring journey so automated tests can run quickly without the
            full production dependencies.
          </p>
        </header>

        {step !== 'share' && <StepIndicator step={step} />}

        {step === 'details' && (
          <section className="space-y-5" aria-label="Poll basics">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700">
                Poll title
              </label>
              <input
                id="title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Where should we focus next quarter’s budget?"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                maxLength={120}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Explain the context, stakes, or background so voters can make an informed decision."
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                rows={4}
                maxLength={360}
              />
            </div>
          </section>
        )}

        {step === 'options' && (
          <section className="space-y-4" aria-label="Poll options">
            <p className="text-sm text-slate-600">Provide at least two distinct choices so voters can differentiate quickly.</p>
            {form.options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={option}
                  onChange={(event) => setOption(index, event.target.value)}
                  placeholder={`Option ${index + 1}`}
                  aria-label={`Option ${index + 1}`}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
                {form.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="rounded-md border px-2 text-xs text-slate-600 hover:bg-slate-100"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="inline-flex items-center rounded-md border border-dashed px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Add option
            </button>
          </section>
        )}

        {step === 'audience' && (
          <section className="space-y-6" aria-label="Audience and discovery">
            <div>
              <p className="text-sm font-medium text-slate-700">Category</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {CATEGORIES.map((category) => {
                  const isSelected = category.id === form.category;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      className={`rounded-lg border p-3 text-left text-sm transition ${
                        isSelected ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-400'
                      }`}
                      aria-pressed={isSelected}
                      onClick={() => setForm((prev) => ({ ...prev, category: category.id }))}
                    >
                      <div className="font-medium">{category.name}</div>
                      <p className="mt-1 text-xs text-slate-500">{category.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-slate-700">
                Tags
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="tags"
                  value={newTag}
                  onChange={(event) => setNewTag(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add a tag"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="rounded-md border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Add
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2" aria-live="polite">
                {form.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs">
                    {tag}
                    <button
                      type="button"
                      className="text-slate-500 hover:text-red-600"
                      onClick={() => setForm((prev) => ({ ...prev, tags: prev.tags.filter((existing) => existing !== tag) }))}
                      aria-label={`Remove tag ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-slate-700">Participation & policies</legend>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  role="switch"
                  aria-label="Allow multiple votes"
                  checked={form.allowMultipleVotes}
                  onChange={(event) => setForm((prev) => ({ ...prev, allowMultipleVotes: event.target.checked }))}
                />
                <span className="text-sm">Allow multiple votes</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  role="switch"
                  aria-label="Allow anonymous votes"
                  checked={form.allowAnonymousVotes}
                  onChange={(event) => setForm((prev) => ({ ...prev, allowAnonymousVotes: event.target.checked }))}
                />
                <span className="text-sm">Allow anonymous votes</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  role="switch"
                  aria-label="Require sign-in to vote"
                  checked={form.requireAuthentication}
                  onChange={(event) => setForm((prev) => ({ ...prev, requireAuthentication: event.target.checked }))}
                />
                <span className="text-sm">Require sign-in to vote</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  role="switch"
                  aria-label="Show results in real time"
                  checked={form.showResults}
                  onChange={(event) => setForm((prev) => ({ ...prev, showResults: event.target.checked }))}
                />
                <span className="text-sm">Show results in real time</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  role="switch"
                  aria-label="Allow comments"
                  checked={form.allowComments}
                  onChange={(event) => setForm((prev) => ({ ...prev, allowComments: event.target.checked }))}
                />
                <span className="text-sm">Allow comments</span>
              </label>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="privacy-level" className="block text-sm font-medium text-slate-700">
                  Privacy level
                </label>
                <select
                  id="privacy-level"
                  value={form.privacyLevel}
                  onChange={(event) => setForm((prev) => ({ ...prev, privacyLevel: event.target.value as PollFormState['privacyLevel'] }))}
                  className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                >
                  {Object.entries(PRIVACY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="voting-method" className="block text-sm font-medium text-slate-700">
                  Voting method
                </label>
                <select
                  id="voting-method"
                  value={form.votingMethod}
                  onChange={(event) => setForm((prev) => ({ ...prev, votingMethod: event.target.value as PollFormState['votingMethod'] }))}
                  className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                >
                  {Object.entries(VOTING_METHOD_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        )}

        {step === 'review' && (
          <section className="space-y-4" aria-label="Review and publish">
            <div className="rounded-lg bg-slate-50 p-4">
              <h2 className="text-lg font-semibold text-slate-900">{form.title || 'Untitled poll'}</h2>
              <p className="mt-2 text-sm text-slate-600">{form.description || 'Describe your poll to build context.'}</p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium text-slate-700">Options</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {form.options.filter((option) => option.trim().length > 0).map((option, index) => (
                  <li key={index}>{option}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border p-4 text-sm text-slate-600">
              <p>
                <span className="font-medium">Privacy:</span> {PRIVACY_LABELS[form.privacyLevel]}
              </p>
              <p>
                <span className="font-medium">Voting method:</span> {VOTING_METHOD_LABELS[form.votingMethod]}
              </p>
              <p>
                <span className="font-medium">Multiple votes:</span> {form.allowMultipleVotes ? 'Enabled' : 'Disabled'}
              </p>
              <p>
                <span className="font-medium">Anonymous votes:</span> {form.allowAnonymousVotes ? 'Allowed' : 'Disabled'}
              </p>
              <p>
                <span className="font-medium">Require sign-in:</span> {form.requireAuthentication ? 'Yes' : 'No'}
              </p>
              <p>
                <span className="font-medium">Comments:</span> {form.allowComments ? 'Enabled' : 'Disabled'}
              </p>
              <p>
                <span className="font-medium">Tags:</span> {form.tags.length > 0 ? form.tags.join(', ') : 'Add tags for better discovery'}
              </p>
            </div>
          </section>
        )}

        {step === 'share' && submittedPollId ? (
          <ShareDialog
            form={form}
            onClose={() => {
              setForm(DEFAULT_FORM);
              setStepIndex(0);
              setSubmittedPollId(null);
              setShareInfo(null);
              hasTrackedSuccessRef.current = false;
              hasTrackedShareRef.current = false;
            }}
          />
        ) : (
          <footer className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={goPrev}
              disabled={stepIndex === 0 || isSubmitting}
              className="rounded-md border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            {step === 'review' ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canProceed || isSubmitting}
                className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Creating…' : 'Publish poll'}
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                disabled={!canProceed || isSubmitting}
                className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            )}
          </footer>
        )}
      </div>
    </main>
  );
}

