'use client';

import { Download, Search } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { RollCall, SurveillanceMoneyDataset } from '@/lib/accountability/types';

import { useI18n } from '@/hooks/useI18n';


import { AboutPanel, LobbyingPanel, VotesPanel } from './Panels';
import { RecipientCard, useMoney } from './RecipientCard';
import {
  DEFAULT_FILTERS,
  filterOfficials,
  filterOrganizations,
  sumAmounts,
  type RecipientFilters,
} from '../lib/filter';


const PAGE_SIZE = 30;

function FilterSelect<V extends string>({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: V;
  onChange: (v: V) => void;
  options: Array<{ value: V; label: string }>;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={(v) => onChange(v as V)}>
        <SelectTrigger id={id} className="h-9 min-w-[10rem]">
          <SelectValue>{options.find((o) => o.value === value)?.label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</div>
        {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}

export function AccountabilityExplorer({ data }: { data: SurveillanceMoneyDataset }) {
  const { t } = useI18n();
  const money = useMoney();
  const [filters, setFilters] = useState<RecipientFilters>(DEFAULT_FILTERS);
  const [officialLimit, setOfficialLimit] = useState(PAGE_SIZE);
  const [orgLimit, setOrgLimit] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(filters.query);

  const update = <K extends keyof RecipientFilters>(key: K, value: RecipientFilters[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setOfficialLimit(PAGE_SIZE);
    setOrgLimit(PAGE_SIZE);
  };

  const rollCalls = useMemo(() => new Map<string, RollCall>(data.votes.map((v) => [v.id, v])), [data.votes]);

  const states = useMemo(() => {
    const s = new Set<string>();
    for (const o of data.officials) if (o.state) s.add(o.state);
    for (const o of data.organizations) if (o.state) s.add(o.state);
    return [...s].sort();
  }, [data.officials, data.organizations]);

  const effective = useMemo(() => ({ ...filters, query: deferredQuery }), [filters, deferredQuery]);
  const officials = useMemo(() => filterOfficials(data.officials, effective), [data.officials, effective]);
  const organizations = useMemo(
    () => filterOrganizations(data.organizations, effective),
    [data.organizations, effective],
  );
  const officialTotal = sumAmounts(officials);
  const orgTotal = sumAmounts(organizations.filter((r) => r.item.direction !== 'received'));
  const jurisdictions = new Set(
    officials.map((o) => o.item.state).filter((s) => s && s !== 'US'),
  ).size;

  const isFiltered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <div className="space-y-6">
      <section aria-label={t('accountability.summaryLabel')} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t('accountability.stats.officials')} value={officials.length.toLocaleString()} />
        <Stat label={t('accountability.stats.toOfficials')} value={money(officialTotal)} />
        <Stat label={t('accountability.stats.toOrganizations')} value={money(orgTotal)} hint={t('accountability.stats.orgHint')} />
        <Stat
          label={t('accountability.stats.jurisdictions')}
          value={jurisdictions.toLocaleString()}
          hint={t('accountability.stats.rollCalls', { count: data.votes.length })}
        />
      </section>

      <section aria-label={t('accountability.downloads.label')} className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">{t('accountability.downloads.intro')}</p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {(
            [
              ['surveillance-money.json', 'accountability.downloads.json'],
              ['officials.csv', 'accountability.downloads.officials'],
              ['organizations.csv', 'accountability.downloads.organizations'],
              ['contributions.csv', 'accountability.downloads.contributions'],
              ['votes.csv', 'accountability.downloads.votes'],
              ['lobbying.csv', 'accountability.downloads.lobbying'],
              ['contacts.csv', 'accountability.downloads.contacts'],
            ] as const
          ).map(([file, key]) => (
            <li key={file}>
              <a
                href={`/data/accountability/${file}`}
                download={file}
                className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                {t(key)}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label={t('accountability.filters.label')} className="rounded-lg border border-border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="acct-search" className="text-xs font-medium text-muted-foreground">
              {t('accountability.filters.search')}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="acct-search"
                type="search"
                value={filters.query}
                onChange={(e) => update('query', e.target.value.slice(0, 100))}
                placeholder={t('accountability.filters.searchPlaceholder')}
                className="h-9 pl-8"
                autoComplete="off"
              />
            </div>
          </div>
          <FilterSelect
            id="acct-state"
            label={t('accountability.filters.state')}
            value={filters.state}
            onChange={(v) => update('state', v)}
            options={[
              { value: 'all', label: t('accountability.filters.allStates') },
              ...states.map((s) => ({ value: s, label: s === 'US' ? t('accountability.filters.national') : s })),
            ]}
          />
          <FilterSelect
            id="acct-level"
            label={t('accountability.filters.level')}
            value={filters.level}
            onChange={(v) => update('level', v)}
            options={[
              { value: 'all', label: t('accountability.filters.allLevels') },
              { value: 'federal', label: t('accountability.levels.federal') },
              { value: 'state', label: t('accountability.levels.state') },
              { value: 'local', label: t('accountability.levels.local') },
              { value: 'association', label: t('accountability.levels.association') },
            ]}
          />
          <FilterSelect
            id="acct-company"
            label={t('accountability.filters.company')}
            value={filters.company}
            onChange={(v) => update('company', v)}
            options={[
              { value: 'all', label: t('accountability.filters.bothCompanies') },
              { value: 'axon', label: t('accountability.companies.axon') },
              { value: 'flock', label: t('accountability.companies.flock') },
            ]}
          />
          <FilterSelect
            id="acct-money"
            label={t('accountability.filters.money')}
            value={filters.money}
            onChange={(v) => update('money', v)}
            options={[
              { value: 'all', label: t('accountability.filters.moneyAll') },
              { value: 'direct', label: t('accountability.filters.moneyDirect') },
            ]}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <FilterSelect
            id="acct-sort"
            label={t('accountability.filters.sort')}
            value={filters.sort}
            onChange={(v) => update('sort', v)}
            options={[
              { value: 'amount', label: t('accountability.filters.sortAmount') },
              { value: 'name', label: t('accountability.filters.sortName') },
              { value: 'state', label: t('accountability.filters.sortState') },
            ]}
          />
          <label className="mt-5 flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={filters.votedOnly}
              onChange={(e) => update('votedOnly', e.target.checked)}
            />
            {t('accountability.filters.votedOnly')}
          </label>
          {isFiltered ? (
            <Button variant="ghost" size="sm" className="mt-5" onClick={() => setFilters(DEFAULT_FILTERS)}>
              {t('accountability.filters.reset')}
            </Button>
          ) : null}
        </div>
      </section>

      <Tabs defaultValue="officials">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="officials">
            {t('accountability.tabs.officials')} ({officials.length})
          </TabsTrigger>
          <TabsTrigger value="organizations">
            {t('accountability.tabs.organizations')} ({organizations.length})
          </TabsTrigger>
          <TabsTrigger value="votes">{t('accountability.tabs.votes')}</TabsTrigger>
          <TabsTrigger value="lobbying">{t('accountability.tabs.lobbying')}</TabsTrigger>
          <TabsTrigger value="about">{t('accountability.tabs.about')}</TabsTrigger>
        </TabsList>

        <TabsContent value="officials" className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('accountability.officialsIntro')}</p>
          {officials.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('accountability.empty')}</p>
          ) : null}
          {officials.slice(0, officialLimit).map((r) => (
            <RecipientCard
              key={r.item.id}
              kind="official"
              item={r.item}
              amount={r.amount}
              contributions={r.contributions}
              rollCalls={rollCalls}
            />
          ))}
          {officials.length > officialLimit ? (
            <div className="text-center">
              <Button variant="outline" onClick={() => setOfficialLimit((n) => n + PAGE_SIZE)}>
                {t('accountability.showMore', { shown: officialLimit, total: officials.length })}
              </Button>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="organizations" className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('accountability.organizationsIntro')}</p>
          {organizations.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('accountability.empty')}</p>
          ) : null}
          {organizations.slice(0, orgLimit).map((r) => (
            <RecipientCard
              key={r.item.id}
              kind="organization"
              item={r.item}
              amount={r.amount}
              contributions={r.contributions}
              rollCalls={rollCalls}
            />
          ))}
          {organizations.length > orgLimit ? (
            <div className="text-center">
              <Button variant="outline" onClick={() => setOrgLimit((n) => n + PAGE_SIZE)}>
                {t('accountability.showMore', { shown: orgLimit, total: organizations.length })}
              </Button>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="votes">
          <VotesPanel rollCalls={data.votes} officials={data.officials} company={filters.company} />
        </TabsContent>

        <TabsContent value="lobbying">
          <LobbyingPanel rows={data.lobbying} company={filters.company} />
        </TabsContent>

        <TabsContent value="about">
          <AboutPanel reported={data.reported} coverage={data.coverage} generatedAt={data.generatedAt} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
