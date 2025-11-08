#!/usr/bin/env node
/**
 * Fetch current-cycle finance totals from the FEC API and persist them to Supabase.
 * Also bumps `data_quality_score` for each representative as finance completeness improves.
 *
 * Usage:
 *   npm run enrich:finance
 */
import 'dotenv/config';

import { getSupabaseClient } from '../clients/supabase.js';
import {
  fetchCandidateTotals,
  fetchCandidateTopContributors,
} from '../clients/fec.js';
import { evaluateDataQuality } from '../utils/data-quality.js';
import type { FederalEnrichment } from '../enrich/federal.js';

type RepresentativeRow = {
  id: number;
  name: string;
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
      default:
        break;
    }

    if (rawValue && !arg.includes('=')) {
      i += 1;
    }
  }

  return options;
}

async function fetchRepresentatives(options: CliOptions) {
  const client = getSupabaseClient();
  let query = client
    .from('representatives_core')
    .select(
      'id,name,canonical_id,state,district,level,fec_id,primary_email,primary_phone,primary_website,data_sources',
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

  if (typeof options.offset === 'number' && typeof options.limit === 'number') {
    query = query.range(options.offset, options.offset + options.limit - 1);
  } else if (typeof options.limit === 'number') {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch representatives: ${error.message}`);
  }

  return (data ?? []) as RepresentativeRow[];
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
}): {
  finance: FinanceUpsertRow;
  enrichment: FederalEnrichment;
} {
  const { representative, cycle, totals, contributors } = options;

  const smallDonorPercentage =
    totals.individual_unitemized_contributions && totals.individual_contributions
      ? Math.round(
          (totals.individual_unitemized_contributions / totals.individual_contributions) * 1000,
        ) / 10
      : null;

  const topContributors = contributors.slice(0, 5).map((entry) => ({
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
    total_raised: totals.total_receipts ?? null,
    total_spent: totals.total_disbursements ?? null,
    cash_on_hand: totals.cash_on_hand_end_period ?? null,
    small_donor_percentage: smallDonorPercentage,
    last_filing_date: extractLastFilingDate(totals),
    top_contributors: topContributors,
    cycle,
    office_code: null,
    district: representative.district ?? null,
    sources: [`fec:${cycle}`],
    source: `fec:${cycle}`,
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
      data_quality_score: Math.round(qualityScore * 100) / 100,
      data_sources: Array.from(sources),
    })
    .eq('id', rep.id);

  if (error) {
    throw new Error(`Failed to update representative ${rep.id}: ${error.message}`);
  }
}

async function enrichRepresentative(rep: RepresentativeRow, options: CliOptions) {
  if (!rep.fec_id) return null;
  const cycle = new Date().getFullYear() % 2 === 0 ? new Date().getFullYear() : new Date().getFullYear() - 1;

  await new Promise((resolve) => setTimeout(resolve, FEC_THROTTLE_MS));
  let totals: any;
  try {
    totals = await fetchCandidateTotals(rep.fec_id, cycle);
  } catch (error) {
    const message = (error as Error).message ?? '';
    if (message.includes('OVER_RATE_LIMIT') || message.includes('429')) {
      console.warn(`Rate limit hit for ${rep.name} (${rep.fec_id}). Try re-running later with a slower throttle or upgraded key.`);
      return null;
    }
    throw error;
  }

  if (!totals) {
    console.warn(`No FEC totals found for ${rep.name} (${rep.fec_id}) – skipping.`);
    return null;
  }

  await new Promise((resolve) => setTimeout(resolve, FEC_THROTTLE_MS));
  let contributorsRaw: any[] = [];
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

  const { finance, enrichment } = buildFinanceRecord({
    representative: rep,
    cycle,
    totals,
    contributors: contributorsRaw,
  });

  const { emails, phones, links } = buildContactArrays(rep);

  const federalEnrichment = enrichment;
  const quality = evaluateDataQuality({
    canonical: { emails, phones, links },
    federal: federalEnrichment,
  });

  if (options.dryRun) {
    console.log(`[dry-run] Would upsert finance for ${rep.name} (${rep.fec_id}) with cycle ${cycle}.`);
  } else {
    await upsertFinance([finance]);
    await updateRepresentativeMetadata(rep, finance, quality.overall);
  }

  return {
    representative: rep,
    finance,
    quality,
  };
}

async function main() {
  try {
    const options = parseArgs();

    if (options.limit) {
      console.log(`Limiting enrichment to ${options.limit} representatives.`);
    }
    if (options.state?.length) {
      console.log(`Filtering by states: ${options.state.join(', ')}`);
    }
    if (options.fec?.length) {
      console.log(`Filtering by FEC IDs: ${options.fec.join(', ')}`);
    }
    if (options.dryRun) {
      console.log('Running in dry-run mode (no Supabase updates will be made).');
    }

    const reps = await fetchRepresentatives(options);
    if (reps.length === 0) {
      console.log('No representatives with FEC IDs found.');
      return;
    }

    console.log(`Fetching FEC finance for ${reps.length} representatives...`);

    let succeeded = 0;
    for (const rep of reps) {
      try {
        const output = await enrichRepresentative(rep, options);
        if (output && !options.dryRun) {
          succeeded += 1;
        }
      } catch (error) {
        console.error(`Failed to enrich ${rep.name} (${rep.fec_id}):`, (error as Error).message);
      }
    }

    console.log(`✅ Finance enrichment complete (${succeeded}/${reps.length}).`);
  } catch (error) {
    console.error('Finance enrichment failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

