/**
 * Representative Accountability Page
 *
 * Shows constituent-will polls for this representative and compares
 * poll results (constituent preference) to actual votes.
 * GET /api/accountability/constituent-will provides the comparison data.
 */

'use client';

import { Scale, ArrowLeft, ExternalLink, RotateCcw, Share2, Download, FileText, Link2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useAnalyticsActions } from '@/lib/stores';
import { cn } from '@/lib/utils';

import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';

type PollListItem = {
  id: string;
  title: string;
  billId?: string | null;
  billTitle?: string | null;
  representativeId?: number | null;
};

type ConstituentWillAnalysis = {
  representativeId: string;
  billId: string;
  billTitle: string;
  pollResults: {
    pollId: string;
    pollTitle: string;
    totalVotes: number;
    constituentPreference: 'yes' | 'no' | 'abstain' | 'mixed';
    percentageYes: number;
    percentageNo: number;
    percentageAbstain: number;
  };
  actualVote: {
    vote: 'yes' | 'no' | 'abstain' | 'not_voted';
    date?: string;
    alignment: number;
  };
  billContext: {
    summary?: string;
    keyProvisions?: string[];
    relatedBills?: string[];
    relatedBillsWithTitles?: Array<{ packageId: string; title?: string }>;
  };
  accountabilityScore: number;
  lastUpdated: string;
};

export default function RepresentativeAccountabilityPage() {
  const { t } = useI18n();
  const { user, isLoading: authLoading } = useAuth();
  const { trackPageView, trackUserAction } = useAnalyticsActions();
  const params = useParams();
  const repIdParam = params?.id as string | undefined;
  const repId = repIdParam ? parseInt(repIdParam, 10) : null;
  const isValidRepId = repId != null && !Number.isNaN(repId) && repId >= 1;

  const [polls, setPolls] = useState<PollListItem[]>([]);
  const [analyses, setAnalyses] = useState<Record<string, ConstituentWillAnalysis>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repName, setRepName] = useState<string | null>(null);
  const [billContentByPoll, setBillContentByPoll] = useState<Record<string, string>>({});
  const [billContentLoading, setBillContentLoading] = useState<Record<string, boolean>>({});
  const [shareCopied, setShareCopied] = useState(false);

  const fetchPolls = useCallback(async () => {
    if (!isValidRepId) return;
    const res = await fetch(
      `/api/polls?representative_id=${repId}&poll_type=constituent_will&limit=50`,
      { credentials: 'include' }
    );
    if (!res.ok) return;
    const payload = await res.json();
    if (payload?.success && Array.isArray(payload?.data?.polls)) {
      setPolls(
        payload.data.polls.map((p: { id: string; title?: string; billId?: string; billTitle?: string; representativeId?: number }) => ({
          id: p.id,
          title: p.title ?? '',
          billId: p.billId ?? null,
          billTitle: p.billTitle ?? null,
          representativeId: p.representativeId ?? null,
        }))
      );
    }
  }, [isValidRepId, repId]);

  const fetchRepName = useCallback(async () => {
    if (!isValidRepId) return;
    const res = await fetch(`/api/v1/civics/representative/${repId}?fields=name`, { credentials: 'include' });
    if (!res.ok) return;
    const payload = await res.json();
    const name = payload?.data?.representative?.name ?? payload?.data?.name ?? null;
    if (name) setRepName(name);
  }, [isValidRepId, repId]);

  useEffect(() => {
    if (!isValidRepId) {
      setLoading(false);
      setError('Invalid representative');
      return;
    }
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchPolls(), fetchRepName()]);
        if (cancelled) return;
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isValidRepId, user, authLoading, fetchPolls, fetchRepName]);

  useEffect(() => {
    if (!user || polls.length === 0 || !isValidRepId) return;
    const byPoll: Record<string, ConstituentWillAnalysis> = {};
    let cancelled = false;
    (async () => {
      for (const poll of polls) {
        if (!poll.billId || cancelled) continue;
        try {
          const res = await fetch(
            `/api/accountability/constituent-will?representativeId=${repId}&billId=${encodeURIComponent(poll.billId)}&pollId=${encodeURIComponent(poll.id)}`,
            { credentials: 'include' }
          );
          if (!res.ok || cancelled) continue;
          const payload = await res.json();
          if (payload?.success && payload?.data) {
            byPoll[poll.id] = payload.data as ConstituentWillAnalysis;
          }
        } catch {
          // skip failed analyses
        }
      }
      if (!cancelled) setAnalyses((prev) => ({ ...prev, ...byPoll }));
    })();
    return () => { cancelled = true; };
  }, [user, polls, repId, isValidRepId]);

  const retryLoad = useCallback(() => {
    setError(null);
    if (!isValidRepId) return;
    setLoading(true);
    Promise.all([fetchPolls(), fetchRepName()])
      .then(() => setLoading(false))
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load');
        setLoading(false);
      });
  }, [isValidRepId, fetchPolls, fetchRepName]);

  useEffect(() => {
    if (!isValidRepId || !user) return;
    trackPageView('accountability', { representativeId: repId });
  }, [isValidRepId, repId, user, trackPageView]);

  const fetchBillContent = useCallback(async (pollId: string, billId: string) => {
    setBillContentLoading((prev) => ({ ...prev, [pollId]: true }));
    try {
      const res = await fetch(`/api/bills/content?packageId=${encodeURIComponent(billId)}&format=html`, { credentials: 'include' });
      if (!res.ok) return;
      const payload = await res.json();
      if (payload?.success && payload?.data?.content) {
        setBillContentByPoll((prev) => ({ ...prev, [pollId]: payload.data.content }));
      }
    } finally {
      setBillContentLoading((prev) => ({ ...prev, [pollId]: false }));
    }
  }, []);

  const handleShare = useCallback(() => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      });
    }
    trackUserAction('accountability_share', 'accountability', 'share');
  }, [trackUserAction]);

  const handleExportCsv = useCallback(() => {
    const rows: string[][] = [['Poll title', 'Bill ID', 'Constituent preference', 'Actual vote', 'Score (%)']];
    polls.forEach((poll) => {
      const a = analyses[poll.id];
      if (!a) return;
      rows.push([
        poll.title || poll.billTitle || poll.billId || '',
        poll.billId ?? '',
        a.pollResults.constituentPreference,
        a.actualVote.vote,
        String(a.accountabilityScore)
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `accountability-${repId ?? 'rep'}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    trackUserAction('accountability_export_csv', 'accountability', 'export_csv', rows.length - 1);
  }, [polls, analyses, repId, trackUserAction]);

  if (!isValidRepId) {
    return (
      <main id="main-content" className="container max-w-3xl mx-auto py-8 px-4" aria-label={t('civics.representatives.accountability.title')}>
        <Alert variant="destructive">
          <AlertTitle>{t('civics.representatives.detail.notFound.title')}</AlertTitle>
          <AlertDescription>{t('civics.representatives.detail.notFound.message')}</AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/representatives">{t('civics.representatives.detail.back')}</Link>
        </Button>
      </main>
    );
  }

  if (authLoading || (loading && !error)) {
    return (
      <main id="main-content" className="container max-w-3xl mx-auto py-8 px-4" aria-label={t('civics.representatives.accountability.title')} aria-busy="true">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-muted rounded w-48" aria-hidden />
          <div className="h-9 bg-muted rounded w-3/4 max-w-md" aria-hidden />
          <div className="h-4 bg-muted rounded w-1/2 max-w-sm" aria-hidden />
          <div className="h-40 bg-muted rounded-lg" aria-hidden />
          <div className="h-40 bg-muted rounded-lg" aria-hidden />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main id="main-content" className="container max-w-3xl mx-auto py-8 px-4" aria-label={t('civics.representatives.accountability.title')}>
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground hover:text-foreground focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md">
          <Link href={`/representatives/${repId}`} className="inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" aria-hidden />
            {t('civics.representatives.accountability.backToRep')}
          </Link>
        </Button>
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Scale className="w-5 h-5 text-primary" aria-hidden />
              {t('civics.representatives.accountability.title')}
            </CardTitle>
            <CardDescription className="text-base mt-1">
              {t('civics.representatives.accountability.signInRequired')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg">
              <Link href={`/auth?redirect=${encodeURIComponent(`/representatives/${repId}/accountability`)}`}>
                {t('navigation.login')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const someLoading = polls.length > 0 && Object.keys(analyses).length < polls.filter((p) => p.billId).length;

  return (
    <main id="main-content" className="container max-w-3xl mx-auto py-8 px-4" aria-label={t('civics.representatives.accountability.title')} aria-busy={someLoading}>
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground hover:text-foreground focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md">
        <Link href={`/representatives/${repId}`} className="inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" aria-hidden />
          {t('civics.representatives.accountability.backToRep')}
        </Link>
      </Button>

      <header className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 flex-wrap">
              <Scale className="w-6 h-6 text-primary shrink-0" aria-hidden />
              <span>{t('civics.representatives.accountability.title')}{repName ? `: ${repName}` : ''}</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-base">
              {t('civics.representatives.accountability.subtitle')}
            </p>
          </div>
          {polls.length > 0 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
                {shareCopied ? <Link2 className="w-4 h-4" aria-hidden /> : <Share2 className="w-4 h-4" aria-hidden />}
                {shareCopied ? t('civics.representatives.accountability.linkCopied') : t('civics.representatives.accountability.share')}
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCsv}>
                <Download className="w-4 h-4" aria-hidden />
                {t('civics.representatives.accountability.exportCsv')}
              </Button>
            </div>
          )}
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>{t('civics.representatives.accountability.loadError')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={retryLoad}>
            <RotateCcw className="w-4 h-4" aria-hidden />
            {t('civics.representatives.accountability.retry')}
          </Button>
        </Alert>
      )}

      {polls.length === 0 && !loading && (
        <Card className="border-2">
          <CardContent className="pt-6 pb-6 px-6">
            <p className="text-muted-foreground text-base">{t('civics.representatives.accountability.empty')}</p>
            <p className="text-muted-foreground text-sm mt-2">{t('civics.representatives.accountability.emptyHint')}</p>
            <Button asChild size="lg" className="mt-6">
              <Link href={`/polls/create/constituent-will?representative_id=${repId}`}>
                {t('civics.representatives.detail.actions.createBillVotePoll')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <section className="space-y-6" aria-label={t('civics.representatives.accountability.subtitle')}>
        {polls.map((poll) => {
          const analysis = analyses[poll.id];
          const isLoading = !analysis && !!poll.billId;
          return (
            <Card key={poll.id} className={cn('overflow-hidden', isLoading && 'border-dashed')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg leading-tight">{poll.title || poll.billTitle || poll.billId || 'Bill poll'}</CardTitle>
                {poll.billTitle && poll.billTitle !== poll.title && (
                  <CardDescription className="mt-1">{poll.billTitle}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="rounded-lg bg-muted/50 dark:bg-muted/20 p-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {t('civics.representatives.accountability.constituentWill')}
                        </p>
                        <p className="font-medium capitalize mt-1">{analysis.pollResults.constituentPreference.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Yes {analysis.pollResults.percentageYes.toFixed(0)}% · No {analysis.pollResults.percentageNo.toFixed(0)}% · Abstain {analysis.pollResults.percentageAbstain.toFixed(0)}% · {analysis.pollResults.totalVotes} votes
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 dark:bg-muted/20 p-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {t('civics.representatives.accountability.actualVote')}
                        </p>
                        <p className="font-medium capitalize mt-1">
                          {analysis.actualVote.vote === 'not_voted'
                            ? t('civics.representatives.accountability.notVoted')
                            : analysis.actualVote.vote}
                        </p>
                        {analysis.actualVote.date && (
                          <p className="text-sm text-muted-foreground mt-1">{analysis.actualVote.date}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {t('civics.representatives.accountability.score')}
                        </span>
                        <span
                          className={cn(
                            'font-bold tabular-nums',
                            analysis.accountabilityScore >= 70 && 'text-green-600 dark:text-green-400',
                            analysis.accountabilityScore >= 40 && analysis.accountabilityScore < 70 && 'text-amber-600 dark:text-amber-400',
                            analysis.accountabilityScore < 40 && 'text-red-600 dark:text-red-400'
                          )}
                          aria-label={`${t('civics.representatives.accountability.score')}: ${analysis.accountabilityScore}%`}
                        >
                          {analysis.accountabilityScore}%
                        </span>
                        {analysis.actualVote.vote !== 'not_voted' && (
                          <span className="text-sm text-muted-foreground">
                            {analysis.actualVote.alignment >= 0
                              ? t('civics.representatives.accountability.aligned')
                              : t('civics.representatives.accountability.notAligned')}
                          </span>
                        )}
                      </div>
                      <Button asChild variant="outline" size="sm" className="gap-2 shrink-0">
                        <Link href={`/polls/${poll.id}`}>
                          <ExternalLink className="w-4 h-4" aria-hidden />
                          {t('civics.representatives.accountability.viewPoll')}
                        </Link>
                      </Button>
                    </div>
                    {analysis.billContext?.summary && (
                      <details className="rounded-lg border border-border bg-muted/30 overflow-hidden">
                        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset rounded-lg">
                          {t('civics.representatives.accountability.billContext')}
                        </summary>
                        <p className="px-4 pb-4 pt-1 text-sm text-muted-foreground leading-relaxed">{analysis.billContext.summary}</p>
                      </details>
                    )}
                    {(analysis.billContext?.relatedBillsWithTitles?.length ?? analysis.billContext?.relatedBills?.length ?? 0) > 0 && (
                      <div className="rounded-lg border border-border bg-muted/20 p-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          {t('civics.representatives.accountability.relatedBills')}
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {(analysis.billContext.relatedBillsWithTitles ?? analysis.billContext.relatedBills?.map((id) => ({ packageId: id, title: undefined })) ?? []).map((b) => (
                            <li key={b.packageId}>
                              <a
                                href={`https://api.govinfo.gov/link?package=${encodeURIComponent(b.packageId)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {b.title ?? b.packageId}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {poll.billId && (
                      <details
                        className="rounded-lg border border-border bg-muted/30 overflow-hidden"
                        onToggle={(e) => {
                          const open = (e.target as HTMLDetailsElement).open;
                          if (open && poll.billId && !billContentByPoll[poll.id] && !billContentLoading[poll.id]) {
                            fetchBillContent(poll.id, poll.billId);
                          }
                        }}
                      >
                        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset rounded-lg flex items-center gap-2">
                          <FileText className="w-4 h-4 shrink-0" aria-hidden />
                          {t('civics.representatives.accountability.billText')}
                        </summary>
                        <div className="px-4 pb-4 pt-1">
                          {billContentLoading[poll.id] && (
                            <p className="text-sm text-muted-foreground">{t('civics.representatives.accountability.loadingBillText')}</p>
                          )}
                          {billContentByPoll[poll.id] && (
                            <iframe
                              title={t('civics.representatives.accountability.billText')}
                              srcDoc={billContentByPoll[poll.id]}
                              className="w-full min-h-[400px] max-h-[60vh] rounded border border-border bg-background"
                              sandbox="allow-same-origin"
                            />
                          )}
                        </div>
                      </details>
                    )}
                  </>
                ) : (
                  <div className="animate-pulse space-y-3 py-2" aria-live="polite" aria-busy="true">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-16 bg-muted rounded-lg" />
                      <div className="h-16 bg-muted rounded-lg" />
                    </div>
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <p className="text-sm text-muted-foreground sr-only">{t('civics.representatives.accountability.loadingComparison')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </main>
  );
}
