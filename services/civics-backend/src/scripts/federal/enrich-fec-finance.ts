#!/usr/bin/env node
/**
 * Fetch current-cycle finance totals from the FEC API and persist them to Supabase.
 * Also bumps `data_quality_score` for each representative as finance completeness improves.
 *
 * Usage:
 *   npm run federal:enrich:finance
 */
import 'dotenv/config';

import { determineOfficeCode } from '@choices/civics-shared';

import { getSupabaseClient } from '../../clients/supabase.js';
import {
  fetchCandidateTotals,
  fetchCandidateTopContributors,
  searchCandidates,
  type FecApiError,
} from '../../clients/fec.js';
import { evaluateDataQuality } from '../../utils/data-quality.js';
import type { FederalEnrichment } from '../../enrich/federal.js';
import { upsertFinanceDataQuality } from '../../persist/data-quality.js';

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
  lookupMissingFecIds?: boolean;
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
      case 'lookup-missing-fec-ids':
        options.lookupMissingFecIds = true;
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
    .eq('level', 'federal')
    .not('fec_id', 'is', null)
    .eq('status', 'active');

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

  const contacts = buildContactArrays(representative);

  const enrichment: FederalEnrichment = {
    googleCivicId: null,
    congressGovId: null,
    nextElectionDate: null,
    issues: [],
    social: {},
    contacts,
    biography: null,
    aliases: [],
    identifiers: {
      openstates: null,
      bioguide: null,
      fec: representative.fec_id ?? null,
      wikipedia: null,
      ballotpedia: null,
      other: {},
    },
    extras: null,
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
  _finance: FinanceUpsertRow,
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
  validateCycle(cycle);

  // Throttle API calls
  await new Promise((resolve) => setTimeout(resolve, FEC_THROTTLE_MS));
  
  let totals: any;
  try {
    totals = await fetchCandidateTotals(rep.fec_id, cycle);
  } catch (error) {
    const fecError = error as FecApiError;
    const message = fecError.message ?? '';
    
    // Handle rate limits - client already retried, but we still hit limit
    if (fecError.statusCode === 429 || message.includes('rate limit')) {
      return { representative: rep, status: 'rate-limited' };
    }
    
    // Re-throw other errors with context
    throw new Error(
      `Failed to fetch FEC totals for ${rep.name} (${rep.fec_id}, cycle ${cycle}): ${message}`,
    );
  }

  const status: 'updated' | 'no-data' = totals ? 'updated' : 'no-data';

  let contributorsRaw: any[] = [];
  if (status === 'updated') {
    await new Promise((resolve) => setTimeout(resolve, FEC_THROTTLE_MS));
    try {
      contributorsRaw = await fetchCandidateTopContributors(rep.fec_id, cycle, 5);
    } catch (error) {
      const fecError = error as FecApiError;
      const message = fecError.message ?? '';
      
      // Rate limits on contributors are non-fatal - continue without them
      if (fecError.statusCode === 429 || message.includes('rate limit')) {
        // Silently continue - we have totals, just missing contributors
      } else {
        // Log other errors but continue - contributors are optional
        console.warn(
          `Failed to fetch contributors for ${rep.name} (${rep.fec_id}): ${message}`,
        );
      }
    }
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

/**
 * Validate cycle parameter
 */
function validateCycle(cycle: number): void {
  if (!cycle || cycle < 2000 || cycle > 2100 || cycle % 2 !== 0) {
    throw new Error(`Invalid cycle: ${cycle}. Must be an even year between 2000-2100`);
  }
}

/**
 * Check FEC ID coverage for active federal representatives
 */
async function checkFecIdCoverage(): Promise<{
  total: number;
  withFecId: number;
  missingFecId: number;
  coveragePercent: number;
}> {
  const client = getSupabaseClient();
  const { data: allFederal, error: allError } = await client
    .from('representatives_core')
    .select('id, fec_id')
    .eq('level', 'federal')
    .eq('status', 'active');

  if (allError) {
    throw new Error(`Failed to check FEC ID coverage: ${allError.message}`);
  }

  const total = allFederal?.length ?? 0;
  const withFecId = allFederal?.filter((r) => r.fec_id)?.length ?? 0;
  const missingFecId = total - withFecId;
  const coveragePercent = total > 0 ? Math.round((withFecId / total) * 100) : 0;

  return { total, withFecId, missingFecId, coveragePercent };
}

/**
 * Format elapsed time for progress reporting
 */
function formatElapsed(startTime: number): string {
  const elapsed = Date.now() - startTime;
  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Estimate time remaining based on current progress
 */
function estimateTimeRemaining(
  completed: number,
  total: number,
  elapsedMs: number,
): string {
  if (completed === 0) return 'calculating...';
  const avgTimePerItem = elapsedMs / completed;
  const remaining = total - completed;
  const remainingMs = avgTimePerItem * remaining;
  const remainingSeconds = Math.floor(remainingMs / 1000);
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  if (remainingMinutes > 0) {
    return `~${remainingMinutes}m ${remainingSeconds % 60}s`;
  }
  return `~${remainingSeconds}s`;
}

async function main() {
  const startTime = Date.now();
  try {
    const options = parseArgs();
    options.cycle = options.cycle ?? getDefaultCycle();
    validateCycle(options.cycle);

    console.log('\n📊 FEC Finance Enrichment');
    console.log('='.repeat(50));

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

    // Pre-enrichment: Check FEC ID coverage
    console.log('\n🔍 Pre-enrichment checks...');
    const coverage = await checkFecIdCoverage();
    console.log(
      `   FEC ID coverage: ${coverage.withFecId}/${coverage.total} (${coverage.coveragePercent}%)`,
    );
    if (coverage.missingFecId > 0) {
      console.warn(
        `   ⚠️  ${coverage.missingFecId} active federal representatives missing FEC IDs.`,
      );
      console.warn(
        '   Note: FEC IDs come from OpenStates YAML data (other_identifiers with scheme: fec)',
      );
      
      if (options.lookupMissingFecIds) {
        console.log('\n🔍 Attempting to lookup missing FEC IDs via FEC API...');
        const client = getSupabaseClient();
        const { data: missingFecReps, error: missingError } = await client
          .from('representatives_core')
          .select('id, name, office, state, district')
          .eq('level', 'federal')
          .eq('status', 'active')
          .is('fec_id', null)
          .limit(50); // Limit to avoid too many API calls

        if (!missingError && missingFecReps && missingFecReps.length > 0) {
          console.log(`   Found ${missingFecReps.length} representatives to lookup...`);
          let foundCount = 0;
          
          for (const rep of missingFecReps) {
            try {
              // Map office to FEC office code
              const officeCode = rep.office === 'Senator' ? 'S' : rep.office === 'Representative' ? 'H' : undefined;
              if (!officeCode || !rep.state) continue;

              await new Promise((resolve) => setTimeout(resolve, FEC_THROTTLE_MS));
              const candidates = await searchCandidates({
                name: rep.name.split(' ').slice(-1)[0], // Last name only for better matching
                office: officeCode as 'H' | 'S',
                state: rep.state,
                election_year: options.cycle,
                per_page: 5,
              });

              // Find best match
              const match = candidates.find(
                (c) => c.name.toLowerCase().includes(rep.name.toLowerCase().split(' ')[0]) &&
                  c.name.toLowerCase().includes(rep.name.toLowerCase().split(' ').slice(-1)[0]),
              );

              if (match && match.candidate_id) {
                const { error: updateError } = await client
                  .from('representatives_core')
                  .update({ fec_id: match.candidate_id })
                  .eq('id', rep.id);

                if (!updateError) {
                  foundCount += 1;
                  console.log(`   ✅ Found FEC ID for ${rep.name}: ${match.candidate_id}`);
                }
              }
            } catch (error) {
              // Silently continue - lookup is optional
            }
          }

          if (foundCount > 0) {
            console.log(`   ✅ Found ${foundCount} FEC IDs via API lookup`);
          }
        }
      } else {
        console.log('   💡 Tip: Use --lookup-missing-fec-ids to attempt FEC ID lookup via API');
      }
    }

    let reps = await fetchRepresentatives(options);
    if (reps.length === 0) {
      console.log('\n❌ No representatives with FEC IDs found.');
      return;
    }

    console.log(`\n📥 Fetching FEC finance for ${reps.length} representatives...`);
    console.log(`   Estimated time: ~${Math.ceil((reps.length * FEC_THROTTLE_MS * 2) / 1000 / 60)} minutes (${FEC_THROTTLE_MS}ms throttle)`);

    let updatedCount = 0;
    let noDataCount = 0;
    let rateLimited = 0;
    let errorCount = 0;
    const enrichedIds: number[] = [];
    const errors: Array<{ name: string; fecId: string; error: string }> = [];

    for (let i = 0; i < reps.length; i++) {
      const rep = reps[i];
      const progress = i + 1;
      const percent = Math.round((progress / reps.length) * 100);
      const elapsed = formatElapsed(startTime);
      const eta = estimateTimeRemaining(progress, reps.length, Date.now() - startTime);

      try {
        const output = await enrichRepresentative(rep, options);
        if (!output) continue;

        if (output.status === 'updated') {
          if (!options.dryRun) {
            updatedCount += 1;
            enrichedIds.push(rep.id);
          }
          process.stdout.write(
            `\r[${percent}%] ${progress}/${reps.length} | ✅ ${rep.name} (${rep.fec_id}) | ${elapsed} | ETA: ${eta}`,
          );
        } else if (output.status === 'no-data') {
          if (!options.dryRun) {
            noDataCount += 1;
            enrichedIds.push(rep.id);
          }
          process.stdout.write(
            `\r[${percent}%] ${progress}/${reps.length} | ⚠️  ${rep.name} (${rep.fec_id}) - no data | ${elapsed} | ETA: ${eta}`,
          );
        } else if (output.status === 'rate-limited') {
          rateLimited += 1;
          process.stdout.write(
            `\r[${percent}%] ${progress}/${reps.length} | ⏸️  ${rep.name} (${rep.fec_id}) - rate limited | ${elapsed} | ETA: ${eta}`,
          );
        }
      } catch (error) {
        errorCount += 1;
        const errorMessage = (error as Error).message;
        errors.push({
          name: rep.name,
          fecId: rep.fec_id ?? 'unknown',
          error: errorMessage,
        });
        process.stdout.write(
          `\r[${percent}%] ${progress}/${reps.length} | ❌ ${rep.name} (${rep.fec_id}) - error | ${elapsed} | ETA: ${eta}`,
        );
        console.error(`\n   Error: ${errorMessage}`);
      }
    }

    // Clear progress line
    process.stdout.write('\r' + ' '.repeat(100) + '\r');

    // Post-enrichment verification
    if (!options.dryRun && enrichedIds.length > 0) {
      console.log('\n📊 Post-enrichment verification...');
      const client = getSupabaseClient();
      const { data: financeData, error: verificationError } = await client
        .from('representative_campaign_finance')
        .select('representative_id, total_raised, cycle')
        .in('representative_id', enrichedIds)
        .eq('cycle', options.cycle);

      if (!verificationError && financeData) {
        const withData = financeData.filter((f) => f.total_raised != null).length;
        const totalEnriched = financeData.length;
        const coveragePercent = totalEnriched > 0
          ? Math.round((withData / totalEnriched) * 100)
          : 0;

        console.log(`   Representatives with finance data: ${withData}/${totalEnriched} (${coveragePercent}%)`);
        console.log(`   Expected coverage: ~80-90% of active federal reps with FEC IDs`);

        if (coveragePercent < 70) {
          console.warn(
            `   ⚠️  Warning: Coverage (${coveragePercent}%) is lower than expected (80-90%).`,
          );
          console.warn('   This may indicate API issues or many candidates not filing for this cycle.');
        } else if (coveragePercent >= 80) {
          console.log(`   ✅ Coverage within expected range.`);
        }
      }
    }

    // Summary statistics
    console.log('\n📈 Summary Statistics');
    console.log('='.repeat(50));
    console.log(`   Total processed: ${reps.length}`);
    console.log(`   ✅ Successfully updated: ${updatedCount}`);
    console.log(`   ⚠️  No data recorded: ${noDataCount}`);
    console.log(`   ⏸️  Rate limited: ${rateLimited}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   ⏱️  Total time: ${formatElapsed(startTime)}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.slice(0, 10).forEach((e) => {
        console.log(`   - ${e.name} (${e.fecId}): ${e.error}`);
      });
      if (errors.length > 10) {
        console.log(`   ... and ${errors.length - 10} more errors`);
      }
    }

    if (rateLimited > 0) {
      console.log('\n⚠️  Rate Limit Warnings:');
      console.log(
        `   ${rateLimited} representatives hit rate limits. Consider:`,
      );
      console.log('   - Requesting enhanced API key from APIinfo@fec.gov (7,200 calls/hour)');
      console.log(`   - Increasing FEC_THROTTLE_MS (current: ${FEC_THROTTLE_MS}ms)`);
      console.log('   - Running enrichment in smaller batches');
    }

    if (options.dryRun) {
      console.log('\n✅ Dry-run complete (no database changes made).');
    } else {
      console.log('\n✅ Finance enrichment complete!');
    }
  } catch (error) {
    console.error('\n❌ Finance enrichment failed:', error);
    if (error instanceof Error) {
      console.error('   Error details:', error.message);
      if (error.stack) {
        console.error('   Stack:', error.stack);
      }
    }
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

