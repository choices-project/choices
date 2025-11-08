import { determineOfficeCode, normalizeDistrict, getCurrentFecCycle } from '@choices/civics-shared';

import {
  fetchCandidateTopContributors,
  fetchCandidateTotals,
  type FecContributor,
  type FecTotals,
} from '../clients/fec.js';
import type { CanonicalRepresentative } from '../ingest/openstates/people.js';

export interface FinanceSummary {
  totalRaised: number | null;
  totalSpent: number | null;
  cashOnHand: number | null;
  topContributors: Array<{
    name: string;
    amount: number;
    type: string;
    industry: string | null;
    influenceScore: number | null;
  }>;
  smallDonorPercentage: number | null;
  cycle: number;
  officeCode: string | null;
  district: string | null;
  sources: string[];
}

export interface FederalEnrichment {
  googleCivicId: string | null;
  nextElectionDate: string | null;
  finance: FinanceSummary | null;
  issues: Array<{ issue: string; weight?: number }>;
  social: Record<string, string>;
  sources: { fec: string[] };
}

export async function enrichFederalRepresentative(
  canonical: CanonicalRepresentative,
): Promise<FederalEnrichment> {
  const role = canonical.currentRoles[0];
  const officeCode = determineOfficeCode(buildOfficeLabel(role));
  const district = normalizeDistrict(role?.district ?? null) ?? null;
  const cycle = getCurrentFecCycle();

  const finance = await fetchFecFinance(canonical, { officeCode, district, cycle });

  return {
    googleCivicId: null,
    nextElectionDate: null,
    finance,
    issues: [],
    social: {},
    sources: {
      fec: finance?.sources ?? [],
    },
  };
}

async function fetchFecFinance(
  canonical: CanonicalRepresentative,
  { officeCode, district, cycle }: { officeCode: string | null; district: string | null; cycle: number },
): Promise<FinanceSummary | null> {
  if (!canonical.identifiers.fec) {
    return null;
  }

  try {
    const totals = await fetchCandidateTotals(canonical.identifiers.fec, cycle);
    if (!totals) {
      return null;
    }

    const contributorsRaw = await fetchCandidateTopContributors(
      canonical.identifiers.fec,
      cycle,
      5,
    );

    const topContributors = contributorsRaw.map((entry: FecContributor) => ({
      name: entry?.employer ?? 'Unknown Employer',
      amount: entry?.total ?? 0,
      type: 'employer',
      industry: entry?.state ?? null,
      influenceScore: null,
    }));

    return {
      totalRaised: totals.total_receipts ?? null,
      totalSpent: totals.total_disbursements ?? null,
      cashOnHand: totals.cash_on_hand_end_period ?? null,
      topContributors,
      smallDonorPercentage: computeSmallDonorPercentage(totals),
      cycle,
      officeCode,
      district,
      sources: [
        `FEC candidate totals: ${totals.candidate_id ?? canonical.identifiers.fec}`,
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `Unable to fetch FEC finance data for ${canonical.identifiers.fec}:`,
      message,
    );
    return null;
  }
}

function buildOfficeLabel(role: CanonicalRepresentative['currentRoles'][number] | undefined): string {
  if (!role) return '';
  switch (role.chamber) {
    case 'upper':
      return 'U.S. Senate';
    case 'lower':
      return 'U.S. House of Representatives';
    default:
      return '';
  }
}

function computeSmallDonorPercentage(totals: FecTotals): number | null {
  const unitemized = totals.individual_unitemized_contributions ?? null;
  const individual = totals.individual_contributions ?? null;

  if (
    unitemized === null ||
    unitemized === undefined ||
    individual === null ||
    individual === undefined ||
    individual === 0
  ) {
    return null;
  }

  return Math.round((unitemized / individual) * 1000) / 10;
}

