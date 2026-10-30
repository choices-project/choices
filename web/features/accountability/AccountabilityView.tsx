import { Scale } from 'lucide-react';

import { AccountabilityExplorer } from '@/features/accountability/components/AccountabilityExplorer';
import { AccountabilityIntro } from '@/features/accountability/components/AccountabilityIntro';

import dataset from '@/lib/accountability/surveillance-money.json';
import type { Official, SurveillanceMoneyDataset } from '@/lib/accountability/types';

const full = dataset as unknown as SurveillanceMoneyDataset;

function slimOfficial(o: Official): Official {
  const { bioguide: _b, fecIds: _f, totals: { byChannel: _c, ...totals }, ...rest } = o;
  return { ...rest, totals: { ...totals, byChannel: {} } };
}

const data: SurveillanceMoneyDataset = {
  ...full,
  officials: full.officials.map(slimOfficial),
  organizations: full.organizations.map(({ totals: { byChannel: _c, ...totals }, ...o }) => ({
    ...o,
    totals: { ...totals, byChannel: {} },
  })),
};

export function AccountabilityView() {
  return (
    <div className="min-h-screen bg-muted">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Scale className="mb-3 h-8 w-8 text-primary" aria-hidden="true" />
          <AccountabilityIntro generatedAt={data.generatedAt} companies={data.companies} />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <AccountabilityExplorer data={data} />
      </div>
    </div>
  );
}
