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
  searchCandidateWithTotals,
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
  
  // Query representatives first, then fetch finance data separately to avoid relationship ambiguity
  let query = client
    .from('representatives_core')
    .select('id,name,office,canonical_id,state,district,level,fec_id,primary_email,primary_phone,primary_website,data_sources')
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

  const rows = (data ?? []) as RepresentativeRow[];

  // Fetch finance data separately to avoid relationship ambiguity
  const representativeIds = rows.map((r) => r.id);
  let financeMap = new Map<number, RepresentativeFinanceRow | null>();
  
  if (representativeIds.length > 0) {
    const { data: financeData, error: financeError } = await client
      .from('representative_campaign_finance')
      .select('representative_id, id, updated_at, last_filing_date, cycle, total_raised')
      .in('representative_id', representativeIds);
    
    if (!financeError && financeData) {
      // Create a map of representative_id -> finance row
      // If multiple finance rows exist per rep, take the most recent one
      for (const finance of financeData) {
        const repId = finance.representative_id;
        const existing = financeMap.get(repId);
        
        if (!existing || !finance.updated_at) {
          financeMap.set(repId, finance as RepresentativeFinanceRow);
        } else if (finance.updated_at && existing.updated_at) {
          // Keep the more recent one
          const existingDate = new Date(existing.updated_at);
          const newDate = new Date(finance.updated_at);
          if (newDate > existingDate) {
            financeMap.set(repId, finance as RepresentativeFinanceRow);
          }
        }
      }
    }
  }

  const normalizedRows: RepresentativeRecord[] = rows.map((row) => {
    const finance = financeMap.get(row.id) ?? null;
    return {
      ...row,
      representative_campaign_finance: finance,
    };
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
    // Fetch representatives (will be refreshed after FEC ID lookup if needed)
    let reps = await fetchRepresentatives(options);
    
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
          let enrichedCount = 0;
          const enrichedDuringLookup = new Set<number>(); // Track reps we've already enriched
          
          for (const rep of missingFecReps) {
            try {
              // Use combined function to get FEC ID + finance data in one optimized flow
              const fecOffice = rep.office === 'Senator' ? 'S' : rep.office === 'Representative' ? 'H' : undefined;
              const { candidate, totals } = await searchCandidateWithTotals({
                name: rep.name,
                office: fecOffice,
                state: rep.state ?? undefined,
                cycle: options.cycle,
                per_page: 5,
              });

              if (candidate && candidate.candidate_id) {
                // Update FEC ID in database
                const { error: updateError } = await client
                  .from('representatives_core')
                  .update({ fec_id: candidate.candidate_id })
                  .eq('id', rep.id);

                if (!updateError) {
                  console.log(`   ✅ Found FEC ID for ${rep.name}: ${candidate.candidate_id}`);
                  foundCount++;
                  
                  // If we got totals, also store finance data immediately (big API savings!)
                  if (totals) {
                    try {
                      // Fetch contributors (optional, but good to have)
                      await new Promise((resolve) => setTimeout(resolve, FEC_THROTTLE_MS));
                      let contributors: any[] = [];
                      try {
                        contributors = await fetchCandidateTopContributors(candidate.candidate_id, options.cycle, 5);
                      } catch (contribError) {
                        // Contributors are optional, continue without them
                      }
                      
                      // Build finance record with the data we already have
                      const repRow: RepresentativeRow = {
                        id: rep.id,
                        name: rep.name,
                        office: rep.office ?? null,
                        canonical_id: null,
                        state: rep.state,
                        district: rep.district ?? null,
                        level: 'federal',
                        fec_id: candidate.candidate_id,
                        primary_email: null,
                        primary_phone: null,
                        primary_website: null,
                        data_sources: null,
                      };
                      
                      const { finance } = buildFinanceRecord({
                        representative: repRow,
                        cycle: options.cycle,
                        totals,
                        contributors,
                        status: 'updated',
                      });
                      
                      // Store finance data
                      if (!options.dryRun) {
                        await upsertFinance([finance]);
                        enrichedDuringLookup.add(rep.id);
                        enrichedCount++;
                        console.log(`      💰 Also stored finance data (saved 1 API call!)`);
                      }
                    } catch (financeError) {
                      // Finance storage failed, but FEC ID was saved - continue
                      console.warn(`      ⚠️  FEC ID saved but finance data failed: ${(financeError as Error).message}`);
                    }
                  }
                } else {
                  console.warn(`   ⚠️  Found FEC ID but failed to update: ${updateError.message}`);
                }
              }
            } catch (error) {
              // Continue to next rep if lookup fails
              continue;
            }
            
            // Throttle API calls
            await new Promise((resolve) => setTimeout(resolve, FEC_THROTTLE_MS));
          }
          
          console.log(`   ✅ Found ${foundCount} FEC IDs via API lookup`);
          if (enrichedCount > 0) {
            console.log(`   💰 Enriched ${enrichedCount} representatives during lookup (saved ${enrichedCount} API calls!)`);
          }
          
          console.log(`   ✅ Found ${foundCount} FEC IDs via API lookup`);
          
          // Refresh representatives list after FEC ID lookups
          if (foundCount > 0) {
            console.log('   Refreshing representatives list with newly found FEC IDs...');
            reps = await fetchRepresentatives(options);
            
            // Filter out reps we already enriched during lookup to avoid duplicate API calls
            if (enrichedDuringLookup.size > 0) {
              const beforeCount = reps.length;
              reps = reps.filter((r) => !enrichedDuringLookup.has(r.id));
              const afterCount = reps.length;
              if (beforeCount > afterCount) {
                console.log(`   ⚡ Skipping ${beforeCount - afterCount} reps already enriched (saved ${(beforeCount - afterCount) * 2} API calls!)`);
              }
            }
          }
        }
      } else {
        console.log('   💡 Tip: Use --lookup-missing-fec-ids to attempt FEC ID lookup via API');
      }
    }

    if (!reps || reps.length === 0) {
      console.log('\n✅ No representatives to enrich.');
      return;
    }

    console.log(`\n📊 Enriching ${reps.length} representative(s)...`);
    console.log('='.repeat(50));

    const results: EnrichmentResult[] = [];
    let updatedCount = 0;
    let noDataCount = 0;
    let rateLimitedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < reps.length; i++) {
      const rep = reps[i];
      const progress = i + 1;
      const elapsed = formatElapsed(startTime);
      const eta = estimateTimeRemaining(progress, reps.length, Date.now() - startTime);
      
      process.stdout.write(
        `\r   [${progress}/${reps.length}] ${rep.name}${rep.fec_id ? ` (${rep.fec_id})` : ''}... ${elapsed} elapsed, ${eta} remaining`
      );

      try {
        const result = await enrichRepresentative(rep, options);
        results.push(result);

        if (result.status === 'updated') {
          updatedCount++;
        } else if (result.status === 'no-data') {
          noDataCount++;
        } else if (result.status === 'rate-limited') {
          rateLimitedCount++;
        }
      } catch (error) {
        errorCount++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`${rep.name} (${rep.fec_id ?? 'no FEC ID'}): ${errorMsg}`);
        console.error(`\n   ❌ Error enriching ${rep.name}: ${errorMsg}`);
      }
    }

    // Clear progress line
    process.stdout.write('\r' + ' '.repeat(100) + '\r');

    // Summary
    console.log('\n📊 Enrichment Summary');
    console.log('='.repeat(50));
    console.log(`   Total processed: ${reps.length}`);
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⚠️  No data: ${noDataCount}`);
    console.log(`   🚦 Rate limited: ${rateLimitedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n   Error details:');
      errors.forEach((err) => console.log(`     - ${err}`));
    }

    const totalTime = formatElapsed(startTime);
    console.log(`\n⏱️  Total time: ${totalTime}`);

    // Post-enrichment verification
    if (!options.dryRun && updatedCount > 0) {
      console.log('\n🔍 Post-enrichment verification...');
      const client = getSupabaseClient();
      const postCoverage = await checkFecIdCoverage();
      const { count: financeCount, error: financeError } = await client
        .from('representative_campaign_finance')
        .select('*', { count: 'exact', head: true });

      if (!financeError) {
        const financePercent = postCoverage.total > 0
          ? Math.round(((financeCount ?? 0) / postCoverage.total) * 100)
          : 0;
        console.log(`   Finance data coverage: ${financeCount ?? 0}/${postCoverage.total} (${financePercent}%)`);
        
        if (financePercent < 50) {
          console.warn('   ⚠️  Low finance data coverage. Consider running enrichment again or checking for issues.');
        }
      }
    }

    console.log('\n✅ Enrichment complete!');
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
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

