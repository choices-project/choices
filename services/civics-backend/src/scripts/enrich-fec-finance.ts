#!/usr/bin/env node
/**
 * Fetch current-cycle finance totals from the FEC API and persist them to Supabase.
 * Also bumps `data_quality_score` for each representative as finance completeness improves.
 *
 * Usage:
 *   npm run enrich:finance
 */
import 'dotenv/config';

import { determineOfficeCode } from '@choices/civics-shared';

import { getSupabaseClient } from '../clients/supabase.js';
import {
  fetchCandidateTotals,
  fetchCandidateTopContributors,
} from '../clients/fec.js';
import { evaluateDataQuality } from '../utils/data-quality.js';
import type { FederalEnrichment } from '../enrich/federal.js';
import { upsertFinanceDataQuality } from '../persist/data-quality.js';

type RepresentativeRow = {
  id: number;
  name: string;
  office: string | null;
  canonical_id: string | null;
  state: string | null;
  district: string | null;
  level: string | null;
  fec_id: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  primary_website: string | null;
  data_sources: string[] | null;
};

type RepresentativeFinanceRow = {
  id: number;
  updated_at: string | null;
  last_filing_date: string | null;
  cycle: number | null;
  total_raised: number | null;
};

type RepresentativeRecord = RepresentativeRow & {
  representative_campaign_finance: RepresentativeFinanceRow | null;
};

type SupabaseRepresentativeRecord = RepresentativeRow & {
  representative_campaign_finance?:
    | RepresentativeFinanceRow
    | RepresentativeFinanceRow[]
    | null;
};

type EnrichmentStatus = 'updated' | 'no-data' | 'rate-limited' | 'skipped';

type SuccessfulEnrichmentResult = {
  representative: RepresentativeRecord;
  finance: FinanceUpsertRow;
  quality: ReturnType<typeof evaluateDataQuality>;
  status: 'updated' | 'no-data';
};

type EnrichmentResult =
  | SuccessfulEnrichmentResult
  | {
      representative: RepresentativeRecord;
      status: Exclude<EnrichmentStatus, 'updated' | 'no-data'>;
    };

type FinanceUpsertRow = {
  representative_id: number;
  total_raised: number | null;
  total_spent: number | null;
  cash_on_hand: number | null;
  small_donor_percentage: number | null;
  last_filing_date: string | null;
  top_contributors: Array<{
    name: string;
    amount: number;
    type: string;
    industry: string | null;
    influenceScore: number | null;
  }>;
  cycle: number | null;
  office_code: string | null;
  district: string | null;
  sources: string[] | null;
  source: string;
  updated_at: string;
};

type CliOptions = {
  limit?: number;
  offset?: number;
  state?: string[];
  fec?: string[];
  dryRun?: boolean;
  includeExisting?: boolean;
  staleDays?: number;
  cycle?: number;
};

const FEC_THROTTLE_MS = Number(process.env.FEC_THROTTLE_MS ?? '1200');
let financeTableAvailable = true;

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg || !arg.startsWith('--')) continue;

    const [flag, rawValue] = arg.includes('=')
      ? arg.slice(2).split('=')
      : [arg.slice(2), args[i + 1]];

    const value = rawValue && !rawValue.startsWith('--') ? rawValue : undefined;

    switch (flag) {
      case 'limit':
        if (value) options.limit = Number(value);
        break;
      case 'offset':
        if (value) options.offset = Number(value);
        break;
      case 'cycle':
        if (value) options.cycle = Number(value);
        break;
      case 'state':
        if (value) {
          options.state = value
            .split(',')
            .map((state) => state.trim().toUpperCase())
            .filter(Boolean);
        }
        break;
      case 'fec':
        if (value) {
          options.fec = value
            .split(',')
            .map((id) => id.trim().toUpperCase())
            .filter(Boolean);
        }
        break;
      case 'dry-run':
        options.dryRun = true;
        break;
      case 'include-existing':
        options.includeExisting = true;
        break;
      case 'stale-days':
        if (value) options.staleDays = Number(value);
        break;
      default:
        break;
    }

    if (rawValue && !arg.includes('=')) {
      i += 1;
    }
  }

  return options;
}

function getDefaultCycle(): number {
  const year = new Date().getFullYear();
  return year % 2 === 0 ? year : year - 1;
}

async function fetchRepresentatives(options: CliOptions) {
  const client = getSupabaseClient();
  let query = client
    .from('representatives_core')
    .select(
      'id,name,office,canonical_id,state,district,level,fec_id,primary_email,primary_phone,primary_website,data_sources,representative_campaign_finance!left(id,updated_at,last_filing_date,cycle,total_raised)',
    )
    .eq('is_active', true)
    .eq('level', 'federal')
    .not('fec_id', 'is', null);

  if (options.state && options.state.length > 0) {
    query = query.in('state', options.state);
  }

  if (options.fec && options.fec.length > 0) {
    query = query.in('fec_id', options.fec);
  }

  const baseLimit = options.limit ?? 50;
  const fetchLimit = options.includeExisting ? baseLimit : Math.max(baseLimit * 3, 150);

  if (typeof options.offset === 'number') {
    query = query.range(options.offset, options.offset + fetchLimit - 1);
  } else {
    query = query.limit(fetchLimit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch representatives: ${error.message}`);
  }

  const rows = (data ?? []) as SupabaseRepresentativeRecord[];

  const normalizedRows = rows.map((row) => {
    const finance = row.representative_campaign_finance;
    const normalizedFinance = Array.isArray(finance)
      ? finance[0] ?? null
      : (finance ?? null);

    return {
      ...row,
      representative_campaign_finance: normalizedFinance,
    } as RepresentativeRecord;
  });

  normalizedRows.sort((a, b) => {
    const aDate = a.representative_campaign_finance?.updated_at
      ? new Date(a.representative_campaign_finance.updated_at).getTime()
      : 0;
    const bDate = b.representative_campaign_finance?.updated_at
      ? new Date(b.representative_campaign_finance.updated_at).getTime()
      : 0;
    if (!aDate && !bDate) return 0;
    if (!aDate) return -1;
    if (!bDate) return 1;
    return aDate - bDate;
  });

  const staleDays = options.staleDays ?? 0;
  const staleCutoff =
    !options.includeExisting && staleDays > 0
      ? Date.now() - staleDays * 24 * 60 * 60 * 1000
      : null;

  const filtered = normalizedRows.filter((row) => {
    if (options.includeExisting) return true;
    const finance = row.representative_campaign_finance;
    if (!finance) return true;
    if (staleCutoff) {
      const updatedAt = finance.updated_at ? new Date(finance.updated_at).getTime() : NaN;
      if (!Number.isNaN(updatedAt) && updatedAt < staleCutoff) {
        return true;
      }
    }
    return false;
  });

  return options.limit ? filtered.slice(0, options.limit) : filtered;
}

function extractLastFilingDate(totals: any): string | null {
  const possible = [
    totals.last_filing_date,
    totals.coverage_end_date,
    totals.report_year ? `${totals.report_year}-12-31` : null,
  ].filter(Boolean);

  if (possible.length === 0) return null;
  const date = new Date(possible[0]);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function buildFinanceRecord(options: {
  representative: RepresentativeRow;
  cycle: number;
  totals: any;
  contributors: any[];
  status: 'updated' | 'no-data';
}): {
  finance: FinanceUpsertRow;
  enrichment: FederalEnrichment;
} {
  const { representative, cycle, totals, contributors, status } = options;
  const contributorInput = status === 'no-data' ? [] : contributors;
  const totalsData = totals ?? {};

  const smallDonorPercentage =
    totalsData.individual_unitemized_contributions && totalsData.individual_contributions
      ? Math.round(
          (totalsData.individual_unitemized_contributions / totalsData.individual_contributions) *
            1000,
        ) / 10
      : null;

  const topContributors = contributorInput.slice(0, 5).map((entry) => ({
    name: entry?.employer ?? entry?.committee_name ?? 'Unknown',
    amount: entry?.total ?? entry?.sum ?? 0,
    type: entry?.entity_type ?? 'employer',
    industry: entry?.state ?? entry?.industry ?? null,
    influenceScore: null,
  })) as Array<{
    name: string;
    amount: number;
    type: string;
    industry: string | null;
    influenceScore: number | null;
  }>;

  const financeRow: FinanceUpsertRow = {
    representative_id: representative.id,
    total_raised: totalsData.total_receipts ?? null,
    total_spent: totalsData.total_disbursements ?? null,
    cash_on_hand: totalsData.cash_on_hand_end_period ?? null,
    small_donor_percentage: smallDonorPercentage,
    last_filing_date: extractLastFilingDate(totalsData),
    top_contributors: topContributors,
    cycle,
    office_code: determineOfficeCode(options.representative.office ?? '') ?? null,
    district: representative.district ?? null,
    sources:
      status === 'no-data'
        ? [`fec:${cycle}`, 'fec:no-data']
        : [`fec:${cycle}`],
    source: status === 'no-data' ? 'fec:no-data' : `fec:${cycle}`,
    updated_at: new Date().toISOString(),
  };

  const financeSummary = {
    totalRaised: financeRow.total_raised,
    totalSpent: financeRow.total_spent,
    cashOnHand: financeRow.cash_on_hand,
    topContributors,
    smallDonorPercentage,
    cycle,
    officeCode: financeRow.office_code,
    district: financeRow.district,
    sources: financeRow.sources ?? [],
  };

  const enrichment: FederalEnrichment = {
    googleCivicId: null,
    nextElectionDate: null,
    issues: [],
    social: {},
    sources: {
      fec: financeRow.total_raised != null ? [`finance-cycle-${cycle}`] : [],
    },
    finance: financeSummary,
  };

  return {
    finance: financeRow,
    enrichment,
  };
}

function buildContactArrays(rep: RepresentativeRow) {
  const emails = rep.primary_email ? [rep.primary_email] : [];
  const phones = rep.primary_phone ? [rep.primary_phone] : [];
  const links = rep.primary_website ? [rep.primary_website] : [];
  return { emails, phones, links };
}

async function upsertFinance(rows: FinanceUpsertRow[]) {
  if (rows.length === 0 || !financeTableAvailable) return;
  const client = getSupabaseClient();
  const { error } = await client
    .from('representative_campaign_finance')
    .upsert(rows, { onConflict: 'representative_id' });
  if (error) {
    if (error.message.includes("Could not find the table 'public.representatives_finance'")) {
      console.warn(
        'Skipping representatives_finance upserts – table not found. Create the table or adjust the enrichment script.',
      );
      financeTableAvailable = false;
      return;
    }
    throw new Error(`Failed to upsert representatives_finance: ${error.message}`);
  }
}

async function updateRepresentativeMetadata(
  rep: RepresentativeRow,
  finance: FinanceUpsertRow,
  qualityScore: number,
) {
  const client = getSupabaseClient();
  const sources = new Set(rep.data_sources ?? []);
  sources.add('finance:fec');

  const { error } = await client
    .from('representatives_core')
    .update({
      data_quality_score: Math.round(qualityScore * 100),
      data_sources: Array.from(sources),
    })
    .eq('id', rep.id);

  if (error) {
    throw new Error(`Failed to update representative ${rep.id}: ${error.message}`);
  }
}

async function enrichRepresentative(
  rep: RepresentativeRecord,
  options: CliOptions,
): Promise<EnrichmentResult> {
  if (!rep.fec_id) {
    return { representative: rep, status: 'skipped' };
  }

  const cycle = options.cycle ?? getDefaultCycle();

  await new Promise((resolve) => setTimeout(resolve, FEC_THROTTLE_MS));
  let totals: any;
  try {
    totals = await fetchCandidateTotals(rep.fec_id, cycle);
  } catch (error) {
    const message = (error as Error).message ?? '';
    if (message.includes('OVER_RATE_LIMIT') || message.includes('429')) {
      console.warn(
        `Rate limit hit for ${rep.name} (${rep.fec_id}). Try re-running later with a slower throttle or upgraded key.`,
      );
      return { representative: rep, status: 'rate-limited' };
    }
    throw error;
  }

  const status: 'updated' | 'no-data' = totals ? 'updated' : 'no-data';

  let contributorsRaw: any[] = [];
  if (status === 'updated') {
    await new Promise((resolve) => setTimeout(resolve, FEC_THROTTLE_MS));
    try {
      contributorsRaw = await fetchCandidateTopContributors(rep.fec_id, cycle, 5);
    } catch (error) {
      const message = (error as Error).message ?? '';
      if (message.includes('OVER_RATE_LIMIT') || message.includes('429')) {
        console.warn(`Rate limit hit fetching contributors for ${rep.name} (${rep.fec_id}).`);
      } else {
        throw error;
      }
    }
  } else {
    console.warn(`No FEC totals found for ${rep.name} (${rep.fec_id}) – recording empty row.`);
  }

  const { finance, enrichment } = buildFinanceRecord({
    representative: rep,
    cycle,
    totals,
    contributors: contributorsRaw,
    status,
  });

  const { emails, phones, links } = buildContactArrays(rep);

  const quality = evaluateDataQuality({
    canonical: { emails, phones, links },
    federal: enrichment,
  });

  if (options.dryRun) {
    const tag = status === 'no-data' ? 'no-data' : `cycle ${cycle}`;
    console.log(`[dry-run] Would upsert finance for ${rep.name} (${rep.fec_id}) with ${tag}.`);
  } else {
    await upsertFinance([finance]);
    await updateRepresentativeMetadata(rep, finance, quality.overall);
    await upsertFinanceDataQuality({
      representativeId: rep.id,
      score: quality,
      status,
    });
  }

  return {
    representative: rep,
    finance,
    quality,
    status,
  };
}

async function main() {
  try {
    const options = parseArgs();
    options.cycle = options.cycle ?? getDefaultCycle();

    if (options.limit) {
      console.log(`Limiting enrichment to ${options.limit} representatives.`);
    }
    if (options.state?.length) {
      console.log(`Filtering by states: ${options.state.join(', ')}`);
    }
    if (options.fec?.length) {
      console.log(`Filtering by FEC IDs: ${options.fec.join(', ')}`);
    }
    if (options.staleDays && !options.includeExisting) {
      console.log(`Including finance rows stale for >= ${options.staleDays} days.`);
    }
    if (options.includeExisting) {
      console.log('include-existing enabled: re-enriching all matching representatives.');
      if (options.staleDays) {
        console.warn('stale-days ignored when include-existing is set.');
      }
    } else if (!options.staleDays) {
      console.log('Targeting representatives missing finance rows.');
    }
    if (options.dryRun) {
      console.log('Running in dry-run mode (no Supabase updates will be made).');
    }
    console.log(`Using FEC cycle ${options.cycle}.`);

    const reps = await fetchRepresentatives(options);
    if (reps.length === 0) {
      console.log('No representatives with FEC IDs found.');
      return;
    }

    console.log(`Fetching FEC finance for ${reps.length} representatives...`);

    let updatedCount = 0;
    let noDataCount = 0;
    let rateLimited = 0;
    for (const rep of reps) {
      try {
        const output = await enrichRepresentative(rep, options);
        if (!output) continue;
        if (output.status === 'updated') {
          if (!options.dryRun) updatedCount += 1;
        } else if (output.status === 'no-data') {
          if (!options.dryRun) noDataCount += 1;
        } else if (output.status === 'rate-limited') {
          rateLimited += 1;
        }
      } catch (error) {
        console.error(`Failed to enrich ${rep.name} (${rep.fec_id}):`, (error as Error).message);
      }
    }

    if (options.dryRun) {
      console.log('✅ Dry-run complete.');
    } else {
      console.log(
        `✅ Finance enrichment complete. Updated: ${updatedCount}, recorded no-data: ${noDataCount}, rate-limited: ${rateLimited}.`,
      );
    }
  } catch (error) {
    console.error('Finance enrichment failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

