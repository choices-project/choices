import type { FederalEnrichment } from '../enrich/federal.js';

export interface DataQualityScore {
  completeness: number;
  freshness: number;
  overall: number;
  notes: string[];
}

export function evaluateDataQuality({
  canonical,
  federal,
}: {
  canonical: { emails: string[]; phones: string[]; links: string[] };
  federal: FederalEnrichment | null;
}): DataQualityScore {
  const notes: string[] = [];

  const emailScore = canonical.emails.length > 0 ? 1 : 0;
  if (emailScore === 0) notes.push('Missing email');

  const phoneScore = canonical.phones.length > 0 ? 1 : 0;
  if (phoneScore === 0) notes.push('Missing phone');

  const linkScore = canonical.links.length > 0 ? 1 : 0;
  if (linkScore === 0) notes.push('Missing link');

  const finance = federal?.finance ?? null;
  const financeScore = finance ? 1 : 0;
  if (!finance) {
    notes.push('Missing finance summary');
  } else {
    if (finance.totalRaised == null) notes.push('Finance totalRaised missing');
    if (finance.cashOnHand == null) notes.push('Finance cashOnHand missing');
  }

  const completeness = (emailScore + phoneScore + linkScore + financeScore) / 4;

  let freshness = 0.5;
  if (finance?.cycle) {
    const currentCycle = finance.cycle;
    const nowYear = new Date().getFullYear();
    if (currentCycle >= nowYear) {
      freshness = 1;
    } else if (currentCycle === nowYear - 2) {
      freshness = 0.75;
    } else {
      freshness = 0.4;
      notes.push(`Finance data stale (cycle ${currentCycle})`);
    }
  } else if (!finance) {
    freshness = 0.3;
  }

  const overall = Math.round(((completeness + freshness) / 2) * 100) / 100;

  return {
    completeness: Math.round(completeness * 100) / 100,
    freshness: Math.round(freshness * 100) / 100,
    overall,
    notes,
  };
}

