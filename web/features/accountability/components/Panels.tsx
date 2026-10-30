'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import type {
  CoverageRow,
  LobbyingYear,
  Official,
  ReportedItem,
  RollCall,
  VotePosition,
} from '@/lib/accountability/types';

import { useI18n } from '@/hooks/useI18n';

import { CompanyBadge, SourceLink, useMoney } from './RecipientCard';

import type {
  CompanyFilter,
} from '../lib/filter';

const POSITIONS: VotePosition[] = ['yes', 'no', 'nv', 'present'];

export function VotesPanel({
  rollCalls,
  officials,
  company,
}: {
  rollCalls: RollCall[];
  officials: Official[];
  company: CompanyFilter;
}) {
  const { t } = useI18n();
  const money = useMoney();
  const sorted = [...rollCalls].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t('accountability.votesIntro')}</p>
      {sorted.map((rc) => {
        const groups: Record<VotePosition, Array<{ name: string; amount: number }>> = {
          yes: [],
          no: [],
          nv: [],
          present: [],
        };
        for (const o of officials) {
          const pos = o.votes?.[rc.id];
          if (!pos) continue;
          const amount = company === 'all' ? o.totals.total : o.totals[company];
          if (amount <= 0) continue;
          groups[pos].push({ name: o.name, amount });
        }
        const funded = POSITIONS.reduce((n, p) => n + groups[p].length, 0);
        return (
          <Card key={rc.id}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{rc.jurisdiction === 'US' ? t('accountability.levels.federal') : rc.jurisdiction}</Badge>
                <Badge variant="secondary">{t(`accountability.chamber.${rc.chamber}`)}</Badge>
                <Badge variant="outline">{t(`accountability.topics.${rc.topic}`)}</Badge>
                {rc.lobbiedBy.map((c) => (
                  <CompanyBadge key={c} company={c} />
                ))}
              </div>
              <CardTitle className="text-base">
                <SourceLink url={rc.url}>{rc.bill}</SourceLink> — {rc.title}
              </CardTitle>
              <CardDescription>
                {rc.question} · {rc.date}
                {rc.result ? ` · ${rc.result}` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="tabular-nums text-foreground">
                {t('accountability.tally', { yes: rc.tally.yes, no: rc.tally.no, other: rc.tally.other })}
              </p>
              {rc.lobbiedBy.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t(rc.jurisdiction === 'US' ? 'accountability.lobbiedNote' : 'accountability.companyBillNote', {
                    companies: rc.lobbiedBy.map((c) => t(`accountability.companies.${c}`)).join(', '),
                  })}
                </p>
              ) : null}
              {funded > 0 ? (
                <details>
                  <summary className="cursor-pointer text-primary">
                    {t('accountability.fundedVoters', {
                      count: funded,
                      yes: groups.yes.length,
                      no: groups.no.length,
                    })}
                  </summary>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {POSITIONS.filter((p) => groups[p].length > 0).map((p) => (
                      <div key={p}>
                        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {t(`accountability.vote.${p}`)} ({groups[p].length})
                        </h4>
                        <ul className="space-y-0.5">
                          {[...groups[p]]
                            .sort((a, b) => b.amount - a.amount)
                            .map((r) => (
                              <li key={r.name} className="flex justify-between gap-2">
                                <span>{r.name}</span>
                                <span className="tabular-nums text-muted-foreground">{money(r.amount)}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </details>
              ) : (
                <p className="text-xs text-muted-foreground">{t('accountability.noFundedVoters')}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function LobbyingPanel({ rows, company }: { rows: LobbyingYear[]; company: CompanyFilter }) {
  const { t } = useI18n();
  const money = useMoney();
  const visible = rows
    .filter((r) => company === 'all' || r.company === company)
    .sort((a, b) => b.year - a.year || a.company.localeCompare(b.company));

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t('accountability.lobbyingIntro')}</p>
      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full text-sm">
          <caption className="sr-only">{t('accountability.tabs.lobbying')}</caption>
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="p-3 font-medium">{t('accountability.lobbying.year')}</th>
              <th scope="col" className="p-3 font-medium">{t('accountability.lobbying.company')}</th>
              <th scope="col" className="p-3 text-right font-medium">{t('accountability.lobbying.reported')}</th>
              <th scope="col" className="p-3 font-medium">{t('accountability.lobbying.registrants')}</th>
              <th scope="col" className="p-3 font-medium">{t('accountability.lobbying.issues')}</th>
              <th scope="col" className="p-3 font-medium">{t('accountability.lobbying.bills')}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={`${r.company}-${r.year}`} className="border-t border-border align-top">
                <td className="p-3 tabular-nums">
                  <SourceLink url={r.url}>{r.year}</SourceLink>
                </td>
                <td className="p-3">
                  <CompanyBadge company={r.company} />
                  <div className="mt-1 text-xs text-muted-foreground">
                    {t('accountability.lobbying.filings', { count: r.filings })}
                  </div>
                </td>
                <td className="p-3 text-right tabular-nums">{money(r.reportedAmount)}</td>
                <td className="p-3">{r.registrants.join('; ')}</td>
                <td className="p-3">{r.topIssues.join('; ')}</td>
                <td className="p-3 text-xs">{r.bills.join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<CoverageRow['status'], string> = {
  searched: 'border-emerald-600/40 text-emerald-800 dark:text-emerald-300',
  partial: 'border-amber-600/40 text-amber-800 dark:text-amber-300',
  not_searched: 'text-muted-foreground',
  blocked: 'border-red-600/40 text-red-800 dark:text-red-300',
};

export function AboutPanel({
  reported,
  coverage,
  generatedAt,
}: {
  reported: ReportedItem[];
  coverage: CoverageRow[];
  generatedAt: string;
}) {
  const { t } = useI18n();
  const methodKeys = ['sources', 'matching', 'channels', 'privacy', 'votes', 'contact', 'limits'] as const;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('accountability.method.title')}</CardTitle>
          <CardDescription>{t('accountability.method.updated', { date: generatedAt })}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5 text-sm text-foreground">
            {methodKeys.map((k) => (
              <li key={k}>{t(`accountability.method.${k}`)}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {reported.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('accountability.reported.title')}</CardTitle>
            <CardDescription>{t('accountability.reported.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reported.map((r) => (
              <div key={r.url} className="text-sm">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <CompanyBadge company={r.company} />
                  <Badge variant="outline">{r.jurisdiction}</Badge>
                </div>
                <p className="text-foreground">{r.summary}</p>
                <SourceLink url={r.url}>{r.source}</SourceLink>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('accountability.coverage.title')}</CardTitle>
          <CardDescription>{t('accountability.coverage.description')}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">{t('accountability.coverage.title')}</caption>
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="pb-2 pr-3 font-medium">{t('accountability.coverage.jurisdiction')}</th>
                <th scope="col" className="pb-2 pr-3 font-medium">{t('accountability.coverage.source')}</th>
                <th scope="col" className="pb-2 pr-3 font-medium">{t('accountability.coverage.status')}</th>
                <th scope="col" className="pb-2 font-medium">{t('accountability.coverage.note')}</th>
              </tr>
            </thead>
            <tbody>
              {coverage.map((c, i) => (
                <tr key={`${c.jurisdiction}-${c.source}-${i}`} className="border-t border-border align-top">
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {c.jurisdiction} · {t(`accountability.levels.${c.level}`)}
                  </td>
                  <td className="py-2 pr-3">
                    <SourceLink url={c.url}>{c.source}</SourceLink>
                  </td>
                  <td className="py-2 pr-3">
                    <Badge variant="outline" className={STATUS_STYLE[c.status]}>
                      {t(`accountability.coverage.statuses.${c.status}`)}
                    </Badge>
                  </td>
                  <td className="py-2 text-muted-foreground">{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
