'use client'

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useI18n } from '@/hooks/useI18n';
import useSWR from '@/shims/swr';

type FlashTone = 'info' | 'success' | 'warning' | 'error';

const flashToneClasses: Record<FlashTone, string> = {
  info: 'text-blue-700 bg-blue-50 border-blue-200',
  success: 'text-green-700 bg-green-50 border-green-200',
  warning: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  error: 'text-red-700 bg-red-50 border-red-200',
};

type CandidateProfile = {
  id: string;
  slug: string;
  display_name: string;
  office?: string | null;
  jurisdiction?: string | null;
  party?: string | null;
  bio?: string | null;
  website?: string | null;
  social?: Record<string, string> | null;
  filing_status: 'not_started' | 'in_progress' | 'filed' | 'verified';
  representative_id?: number | null;
  isOwner?: boolean;
  is_public?: boolean;
};

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((r) => {
  if (!r.ok) throw new Error('Failed to load');
  return r.json();
});

export default function CandidatePage({ params }: { params: { slug: string } }) {
  const { t } = useI18n();
  const { data, error, mutate } = useSWR<{ data: CandidateProfile }>(`/api/candidates/${params.slug}`, fetcher);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [editDraft, setEditDraft] = useState<{ bio?: string; website?: string; social?: Record<string, string> }>({});
  const [flash, setFlash] = useState<{ message: string; tone: FlashTone } | null>(null);
  const [codeRequested, setCodeRequested] = useState(false);
  const [code, setCode] = useState('');

  if (error) {
    return <div className="p-6">{t('candidates.profile.status.notFound')}</div>;
  }
  if (!data) {
    return <div className="p-6">{t('candidates.profile.status.loading')}</div>;
  }

  const c = data.data;
  const officeLabel = c.office ?? t('candidates.profile.labels.prospectiveCandidate');
  const statusLabel =
    c.filing_status === 'verified'
      ? t('candidates.profile.labels.statusVerified')
      : t('candidates.profile.labels.statusPending');
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{c.display_name}</h1>
        <p className="text-gray-600">
          {officeLabel}
          {c.party ? ` • ${c.party}` : ''} {c.jurisdiction ? ` • ${c.jurisdiction}` : ''}
        </p>
        <div className="mt-2">
          <span className={`inline-flex items-center rounded px-2 py-1 text-sm ${c.filing_status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {c.isOwner ? (
        <div className="flex items-center gap-3 p-3 border rounded">
          <button
            className="px-3 py-1 rounded bg-blue-600 text-white"
            onClick={async () => {
              try {
                const res = await fetch(`/api/candidates/${params.slug}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ is_public: !c.is_public }),
                });
                if (res.ok) {
                  mutate();
                }
              } catch {
                // noop
              }
            }}
            title={t('candidates.profile.actions.togglePublicTitle')}
          >
            {c.is_public
              ? t('candidates.profile.actions.unpublish')
              : t('candidates.profile.actions.publish')}
          </button>
          <span className="text-sm text-gray-600">
            {c.is_public
              ? t('candidates.profile.labels.public')
              : t('candidates.profile.labels.private')}
          </span>
          <button
            className="ml-auto px-3 py-1 rounded border"
            onClick={async () => {
              setVerifying(true);
              setFlash(null);
              try {
                const res = await fetch('/api/candidates/verify/request', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                });
                const js = await res.json().catch(() => ({}));
                if (res.ok && js?.success !== false) {
                  setFlash({
                    message: t('candidates.profile.verification.codeSent'),
                    tone: 'info',
                  });
                  setCodeRequested(true);
                } else {
                  setFlash({
                    message: js?.error ?? t('candidates.profile.verification.requestFailed'),
                    tone: 'error',
                  });
                }
              } catch {
                setFlash({
                  message: t('candidates.profile.verification.requestError'),
                  tone: 'error',
                });
              } finally {
                setVerifying(false);
              }
            }}
            disabled={verifying}
            title={t('candidates.profile.verification.tooltip')}
          >
            {verifying
              ? t('candidates.profile.verification.buttons.loading')
              : t('candidates.profile.verification.buttons.request')}
          </button>
        </div>
      ) : null}

      {flash ? (
        <div className={`text-sm border rounded p-2 ${flashToneClasses[flash.tone]}`}>
          {flash.message}
        </div>
      ) : null}
      {c.isOwner && codeRequested ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 border rounded">
            <input
              className="border rounded p-2 flex-1"
              placeholder={t('candidates.profile.verification.input.placeholder')}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              inputMode="numeric"
            />
            <button
              className="px-3 py-1 rounded bg-green-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
              onClick={async () => {
                setSaving(true);
                setFlash(null);
                try {
                  const res = await fetch('/api/candidates/verify/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ code }),
                  });
                  const js = await res.json().catch(() => ({}));
                  if (res.ok && js?.success !== false) {
                    setFlash({
                      message: t('candidates.profile.verification.complete'),
                      tone: 'success',
                    });
                    setCodeRequested(false);
                    setCode('');
                    mutate();
                  } else {
                    const errorDetails = js?.details || {};
                    let errorMessage: string | null = null;
                    if (errorDetails.expired) {
                      errorMessage =
                        errorDetails.code ?? t('candidates.profile.verification.error.expired');
                    } else if (errorDetails.locked) {
                      errorMessage =
                        errorDetails.code ?? t('candidates.profile.verification.error.locked');
                    } else if (errorDetails.alreadyUsed) {
                      errorMessage =
                        errorDetails.code ?? t('candidates.profile.verification.error.alreadyUsed');
                    } else if (errorDetails.invalid) {
                      const attemptsRemaining = errorDetails.attemptsRemaining;
                      if (
                        typeof attemptsRemaining === 'number' &&
                        Number.isFinite(attemptsRemaining) &&
                        attemptsRemaining > 0
                      ) {
                        errorMessage =
                          errorDetails.code ??
                          t('candidates.profile.verification.error.invalidWithAttempts', {
                            count: attemptsRemaining,
                          });
                      } else {
                        errorMessage =
                          errorDetails.code ?? t('candidates.profile.verification.error.invalid');
                      }
                    } else {
                      errorMessage = js?.error ?? t('candidates.profile.verification.error.general');
                    }
                    setFlash({
                      message: errorMessage,
                      tone: 'error',
                    });
                  }
                } catch {
                  setFlash({
                    message: t('candidates.profile.verification.failed'),
                    tone: 'error',
                  });
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || code.length < 6}
            >
              {saving
                ? t('candidates.profile.verification.buttons.submitLoading')
                : t('candidates.profile.verification.buttons.submit')}
            </button>
          </div>
          <div className="text-xs text-gray-500 px-3">
            {t('candidates.profile.verification.input.note')}
          </div>
        </div>
      ) : null}

      {/* Owner inline edit */}
      {c.isOwner ? (
        <div className="space-y-3 p-4 border rounded">
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {t('candidates.profile.edit.bioLabel')}
            </label>
            <textarea
              className="w-full border rounded p-2"
              rows={4}
              defaultValue={c.bio ?? ''}
              onChange={(e) => setEditDraft((d) => ({ ...d, bio: e.target.value }))}
              placeholder={t('candidates.profile.edit.bioPlaceholder')}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {t('candidates.profile.edit.websiteLabel')}
            </label>
            <input
              type="url"
              className="w-full border rounded p-2"
              defaultValue={c.website ?? ''}
              onChange={(e) => setEditDraft((d) => ({ ...d, website: e.target.value }))}
              placeholder={t('candidates.profile.edit.websitePlaceholder')}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {t('candidates.profile.edit.socialLabel')}
            </label>
            <textarea
              className="w-full border rounded p-2"
              rows={3}
              defaultValue={
                c.social
                  ? Object.entries(c.social)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join('\n')
                  : ''
              }
              onChange={(e) => {
                const lines = e.target.value.split('\n');
                const obj: Record<string, string> = {};
                for (const line of lines) {
                  const idx = line.indexOf(':');
                  if (idx > 0) {
                    const key = line.slice(0, idx).trim();
                    const val = line.slice(idx + 1).trim();
                    if (key && val) obj[key] = val;
                  }
                }
                setEditDraft((d) => ({ ...d, social: obj }));
              }}
              placeholder={t('candidates.profile.edit.socialPlaceholder')}
            />
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded bg-green-600 text-white"
              onClick={async () => {
                setSaving(true);
                setFlash(null);
                try {
                  const res = await fetch(`/api/candidates/${params.slug}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      ...(editDraft.bio !== undefined ? { bio: editDraft.bio } : {}),
                      ...(editDraft.website !== undefined ? { website: editDraft.website } : {}),
                      ...(editDraft.social !== undefined ? { social: editDraft.social } : {}),
                    }),
                  });
                  if (res.ok) {
                    setFlash({
                      message: t('candidates.profile.edit.success'),
                      tone: 'success',
                    });
                    mutate();
                  } else {
                    setFlash({
                      message: t('candidates.profile.edit.error'),
                      tone: 'error',
                    });
                  }
                } catch {
                  setFlash({
                    message: t('candidates.profile.edit.error'),
                    tone: 'error',
                  });
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              {saving
                ? t('candidates.profile.edit.saveLoading')
                : t('candidates.profile.edit.saveButton')}
            </button>
          </div>
        </div>
      ) : null}

      {!c.isOwner && c.bio ? <p className="text-base leading-7">{c.bio}</p> : null}

      <div className="space-y-2">
        {c.website ? (
          <div>
            <span className="font-medium">
              {t('candidates.profile.links.websiteLabel')}
            </span>{' '}
            <a className="text-blue-600 underline" href={c.website} rel="noopener noreferrer" target="_blank">
              {c.website}
            </a>
            <span
              className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700"
              title={t('candidates.profile.links.selfProvidedTitle')}
            >
              {t('candidates.profile.links.selfProvidedBadge')}
            </span>
          </div>
        ) : null}
        {c.social ? (
          <div className="space-x-3">
            {Object.entries(c.social).map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1">
                <a className="text-blue-600 underline" href={v} target="_blank" rel="noopener noreferrer">
                  {k}
                </a>
                <span
                  className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700"
                  title={t('candidates.profile.links.selfProvidedTitle')}
                >
                  {t('candidates.profile.links.selfProvidedBadge')}
                </span>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {!c.isOwner && c.is_public ? (
        <SuggestCorrectionSection candidateName={c.display_name} candidateSlug={c.slug} t={t} />
      ) : null}

      <div className="pt-4 border-t">
        <Link href="/app">{t('candidates.profile.navigation.backToApp')}</Link>
      </div>
    </div>
  );
}

type SuggestCorrectionSectionProps = {
  candidateName: string;
  candidateSlug: string;
  t: ReturnType<typeof useI18n>;
};

type IssueType = 'info' | 'contact' | 'verification' | 'other';

function SuggestCorrectionSection({ candidateName, candidateSlug, t }: SuggestCorrectionSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [issueType, setIssueType] = useState<IssueType>('info');
  const [details, setDetails] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [source, setSource] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const issueOptions = useMemo(
    () => [
      { value: 'info', label: t('candidates.profile.correction.issueTypes.info') },
      { value: 'contact', label: t('candidates.profile.correction.issueTypes.contact') },
      { value: 'verification', label: t('candidates.profile.correction.issueTypes.verification') },
      { value: 'other', label: t('candidates.profile.correction.issueTypes.other') },
    ],
    [t],
  );

  const handleClose = () => {
    setIsOpen(false);
    setSuccess(null);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (details.trim().length < 20) {
      setError(t('candidates.profile.correction.detailsRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      const fallbackValue = t('candidates.profile.correction.missingValue');
      const issueLabel =
        issueOptions.find((option) => option.value === issueType)?.label ?? issueType;
      const messageTitle = t('candidates.profile.correction.feedbackTitle', { name: candidateName });
      const messageDescription = t('candidates.profile.correction.feedbackDescription', {
        issue: issueLabel,
        details: details.trim(),
        source: source || fallbackValue,
        contact: contactEmail || fallbackValue,
      });

      const payload = {
        type: 'correction',
        title: messageTitle,
        description: messageDescription,
        sentiment: 'neutral',
        feedbackContext: {
          candidateSlug,
          candidateName,
          issueType,
          contactEmail: contactEmail || null,
          source: source || null,
        },
        userJourney: {
          currentPage:
            typeof window !== 'undefined' ? window.location.pathname : `/candidates/${candidateSlug}`,
        },
      };

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.success === false) {
        throw new Error(data?.error ?? t('candidates.profile.correction.error'));
      }

      setSuccess(t('candidates.profile.correction.success'));
      setIssueType('info');
      setDetails('');
      setContactEmail('');
      setSource('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('candidates.profile.correction.error');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded border border-amber-100 bg-amber-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-amber-900">
            {t('candidates.profile.correction.badge')}
          </p>
          <p className="text-xs text-amber-800">{candidateName}</p>
        </div>
        <button
          type="button"
          className="text-sm font-semibold text-blue-700 underline-offset-2 hover:underline"
          onClick={() => {
            setIsOpen(true);
            setSuccess(null);
            setError(null);
          }}
        >
          {t('candidates.profile.correction.linkLabel')}
        </button>
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => (open ? setIsOpen(true) : handleClose())}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('candidates.profile.correction.dialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('candidates.profile.correction.dialogDescription')}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {t('candidates.profile.correction.issueLabel')}
              </label>
              <select
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={issueType}
                onChange={(event) => setIssueType(event.target.value as IssueType)}
              >
                {issueOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {t('candidates.profile.correction.detailsLabel')}
              </label>
              <textarea
                className="h-32 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                placeholder={t('candidates.profile.correction.detailsPlaceholder')}
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                required
                minLength={20}
              />
              <p className="text-xs text-gray-500">
                {t('candidates.profile.correction.detailsHelp')}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {t('candidates.profile.correction.contactLabel')}
              </label>
              <input
                type="email"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                placeholder={t('candidates.profile.correction.contactPlaceholder')}
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
              />
              <p className="text-xs text-gray-500">
                {t('candidates.profile.correction.contactDescription')}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                {t('candidates.profile.correction.sourceLabel')}
              </label>
              <input
                type="url"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                placeholder={t('candidates.profile.correction.sourcePlaceholder')}
                value={source}
                onChange={(event) => setSource(event.target.value)}
              />
              <p className="text-xs text-gray-500">
                {t('candidates.profile.correction.sourceDescription')}
              </p>
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {success ? (
              <Alert className="bg-green-50 text-green-700">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            ) : null}

            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                className="text-sm text-gray-600 underline-offset-2 hover:underline"
                onClick={handleClose}
              >
                {t('candidates.profile.correction.close')}
              </button>
              <button
                type="submit"
                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? t('candidates.profile.correction.submitting')
                  : t('candidates.profile.correction.submit')}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

