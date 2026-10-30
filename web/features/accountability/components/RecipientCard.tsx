'use client';

import { ExternalLink, Globe, Mail, Phone } from 'lucide-react';


import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import type { Contribution, Official, OfficialContact, Organization, RollCall, VotePosition } from '@/lib/accountability/types';

import { useI18n } from '@/hooks/useI18n';

import { safeHref, safeTel } from '../lib/filter';

import type { ReactNode } from 'react';


const SOURCE_LABELS: Record<string, string> = {
  fec: 'FEC',
  'irs-8872': 'IRS Form 8872',
  'tx-tec': 'Texas Ethics Commission',
  'ca-calaccess': 'Cal-Access',
  'co-tracer': 'Colorado TRACER',
  'il-sbe': 'Illinois SBE',
  'ny-boe': 'NY State BOE',
  'nyc-cfb': 'NYC Campaign Finance Board',
  'la-ethics': 'LA City Ethics',
  'wa-pdc': 'Washington PDC',
  'fl-doe': 'Florida Division of Elections',
  'az-seethemoney': 'Arizona SeeTheMoney',
};

const COMPANY_STYLE: Record<string, string> = {
  axon: 'border-amber-600/40 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  flock: 'border-sky-600/40 bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200',
};

const VOTE_STYLE: Record<VotePosition, string> = {
  yes: 'border-emerald-600/40 text-emerald-800 dark:text-emerald-300',
  no: 'border-red-600/40 text-red-800 dark:text-red-300',
  nv: 'text-muted-foreground',
  present: 'text-muted-foreground',
};

export function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

const moneyFormatters = new Map<string, Intl.NumberFormat>();

export function useMoney() {
  const { currentLanguage } = useI18n();
  let fmt = moneyFormatters.get(currentLanguage);
  if (!fmt) {
    fmt = new Intl.NumberFormat(currentLanguage, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    moneyFormatters.set(currentLanguage, fmt);
  }
  return fmt.format.bind(fmt);
}

export function CompanyBadge({ company }: { company: string }) {
  const { t } = useI18n();
  return (
    <Badge variant="outline" className={COMPANY_STYLE[company]}>
      {t(`accountability.companies.${company}`)}
    </Badge>
  );
}

function ContactChip({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  const isTel = href.startsWith('tel:');
  return (
    <a
      href={href}
      target={isTel ? undefined : '_blank'}
      rel={isTel ? undefined : 'noopener noreferrer nofollow'}
      className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground hover:border-primary hover:text-primary"
    >
      {icon}
      {label}
    </a>
  );
}

const contactIcon = <Globe className="h-3 w-3" aria-hidden="true" />;

export function ContactLinks({ contact }: { contact?: OfficialContact }) {
  const { t } = useI18n();
  if (!contact) return null;
  const phone = safeTel(contact.phone);
  const website = safeHref(contact.website);
  const form = safeHref(contact.contactForm);
  const twitter = safeHref(contact.twitter);
  const facebook = safeHref(contact.facebook);
  const instagram = safeHref(contact.instagram);
  const ballotpedia = safeHref(contact.ballotpedia);
  if (!phone && !website && !form && !twitter && !facebook && !instagram && !ballotpedia) return null;
  return (
    <nav aria-label={t('accountability.contact.label')} className="mt-2 flex flex-wrap gap-1.5">
      {phone ? (
        <ContactChip
          href={phone}
          label={contact.phone ?? t('accountability.contact.phone')}
          icon={<Phone className="h-3 w-3" aria-hidden="true" />}
        />
      ) : null}
      {form ? (
        <ContactChip href={form} label={t('accountability.contact.form')} icon={<Mail className="h-3 w-3" aria-hidden="true" />} />
      ) : null}
      {website ? <ContactChip href={website} label={t('accountability.contact.website')} icon={contactIcon} /> : null}
      {twitter ? <ContactChip href={twitter} label={t('accountability.contact.twitter')} icon={contactIcon} /> : null}
      {facebook ? <ContactChip href={facebook} label={t('accountability.contact.facebook')} icon={contactIcon} /> : null}
      {instagram ? <ContactChip href={instagram} label={t('accountability.contact.instagram')} icon={contactIcon} /> : null}
      {ballotpedia ? <ContactChip href={ballotpedia} label={t('accountability.contact.ballotpedia')} icon={contactIcon} /> : null}
    </nav>
  );
}

export function SourceLink({ url, children }: { url?: string | undefined; children: React.ReactNode }) {
  const href = safeHref(url);
  if (!href) return <span>{children}</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
    >
      {children}
      <ExternalLink className="h-3 w-3" aria-hidden="true" />
    </a>
  );
}

function ContributionRow({ c }: { c: Contribution }) {
  const { t } = useI18n();
  const money = useMoney();
  const isAggregate = c.channel === 'employees';
  const when = isAggregate
    ? c.dateFrom && c.dateTo && c.dateFrom !== c.dateTo
      ? `${c.dateFrom} – ${c.dateTo}`
      : (c.dateTo ?? c.dateFrom ?? '—')
    : (c.date ?? '—');

  return (
    <tr className="border-t border-border align-top">
      <td className="py-2 pr-3 whitespace-nowrap tabular-nums text-muted-foreground">{when}</td>
      <td className="py-2 pr-3">
        <div className="flex flex-wrap items-center gap-1">
          <CompanyBadge company={c.company} />
          <Badge variant="secondary">{t(`accountability.channels.${c.channel}`)}</Badge>
        </div>
        <div className="mt-1 text-foreground">
          {isAggregate
            ? t('accountability.employeeAggregate', {
                donors: c.donorCount ?? 0,
                gifts: c.contributionCount ?? 0,
              })
            : c.donor}
          {c.donorRole ? <span className="text-muted-foreground"> · {c.donorRole}</span> : null}
        </div>
        {c.via ? (
          <div className="text-xs text-muted-foreground">
            {t('accountability.via')} {c.via}
          </div>
        ) : null}
      </td>
      <td className="py-2 pr-3 text-right whitespace-nowrap font-medium tabular-nums">{money(c.amount)}</td>
      <td className="py-2 text-xs whitespace-nowrap">
        <SourceLink url={c.url}>{sourceLabel(c.source)}</SourceLink>
      </td>
    </tr>
  );
}

export function ContributionTable({ rows }: { rows: Contribution[] }) {
  const { t } = useI18n();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">{t('accountability.table.caption')}</caption>
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="pb-1 pr-3 font-medium">{t('accountability.table.date')}</th>
            <th scope="col" className="pb-1 pr-3 font-medium">{t('accountability.table.from')}</th>
            <th scope="col" className="pb-1 pr-3 text-right font-medium">{t('accountability.table.amount')}</th>
            <th scope="col" className="pb-1 font-medium">{t('accountability.table.source')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c, i) => (
            <ContributionRow key={`${c.source}-${c.date ?? c.dateTo ?? ''}-${c.amount}-${i}`} c={c} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VoteList({ votes, rollCalls }: { votes: Record<string, VotePosition>; rollCalls: Map<string, RollCall> }) {
  const { t } = useI18n();
  const rows = Object.entries(votes)
    .map(([id, pos]) => ({ rc: rollCalls.get(id), pos }))
    .filter((r): r is { rc: RollCall; pos: VotePosition } => Boolean(r.rc))
    .sort((a, b) => b.rc.date.localeCompare(a.rc.date));
  if (rows.length === 0) return null;
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-foreground">{t('accountability.votesOnTracked')}</h4>
      <ul className="space-y-2">
        {rows.map(({ rc, pos }) => (
          <li key={rc.id} className="flex flex-wrap items-start justify-between gap-2 text-sm">
            <div className="min-w-0">
              <SourceLink url={rc.url}>
                <span className="font-medium">{rc.bill}</span>
              </SourceLink>{' '}
              <span className="text-foreground">{rc.title}</span>
              <div className="text-xs text-muted-foreground">
                {rc.jurisdiction === 'US' ? '' : `${rc.jurisdiction} `}
                {t(`accountability.chamber.${rc.chamber}`)} · {rc.question} · {rc.date}
                {rc.lobbiedBy.length > 0
                  ? ` · ${t(rc.jurisdiction === 'US' ? 'accountability.lobbiedBy' : 'accountability.companyBill', {
                      companies: rc.lobbiedBy.map((c) => t(`accountability.companies.${c}`)).join(', '),
                    })}`
                  : ''}
              </div>
            </div>
            <Badge variant="outline" className={VOTE_STYLE[pos]}>
              {t(`accountability.vote.${pos}`)}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

type CardProps = {
  amount: number;
  contributions: Contribution[];
  rollCalls: Map<string, RollCall>;
} & ({ kind: 'official'; item: Official } | { kind: 'organization'; item: Organization });

export function RecipientCard(props: CardProps) {
  const { t } = useI18n();
  const money = useMoney();
  const { item, amount, contributions } = props;
  let axon = 0;
  let flock = 0;
  for (const c of contributions) {
    if (c.company === 'axon') axon += c.amount;
    else flock += c.amount;
  }
  const votes = props.kind === 'official' ? props.item.votes : undefined;
  const voteCount = votes ? Object.keys(votes).length : 0;
  const subtitle = props.kind === 'official' ? props.item.office : props.item.note;

  return (
    <Card>
      <CardContent className="p-0">
        <details className="group">
          <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">{item.name}</h3>
                {props.kind === 'official' && props.item.party ? (
                  <Badge variant="outline">{props.item.party}</Badge>
                ) : null}
                {item.level ? (
                  <Badge variant="secondary">{t(`accountability.levels.${item.level}`)}</Badge>
                ) : null}
                {item.state ? <Badge variant="outline">{item.state}</Badge> : null}
                {props.kind === 'organization' && props.item.kind ? (
                  <Badge variant="outline">{t(`accountability.orgKinds.${props.item.kind}`)}</Badge>
                ) : null}
                {props.kind === 'organization' && props.item.direction === 'received' ? (
                  <Badge variant="outline" className={COMPANY_STYLE.axon}>
                    {t('accountability.moneyRaised')}
                  </Badge>
                ) : null}
              </div>
              {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
              {props.kind === 'official' && props.item.contact ? <ContactLinks contact={props.item.contact} /> : null}
              <p className="mt-1 text-xs text-muted-foreground">
                {t('accountability.recordCount', { count: contributions.length })}
                {voteCount > 0 ? ` · ${t('accountability.voteCount', { count: voteCount })}` : ''}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold tabular-nums text-foreground">{money(amount)}</div>
              <div className="text-xs text-muted-foreground tabular-nums">
                {axon > 0 ? `${t('accountability.companies.axon')} ${money(axon)}` : null}
                {axon > 0 && flock > 0 ? ' · ' : null}
                {flock > 0 ? `${t('accountability.companies.flock')} ${money(flock)}` : null}
              </div>
              <div className="mt-1 text-xs text-primary group-open:hidden">{t('accountability.showDetails')}</div>
              <div className="mt-1 hidden text-xs text-primary group-open:block">{t('accountability.hideDetails')}</div>
            </div>
          </summary>
          <div className="space-y-4 border-t border-border p-4">
            <ContributionTable rows={contributions} />
            {votes ? <VoteList votes={votes} rollCalls={props.rollCalls} /> : null}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
