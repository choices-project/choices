#!/usr/bin/env node
/**
 * Enrich representatives with supplemental contact and social data from the Google Civic API.
 *
 * Usage:
 *   npm run state:sync:google-civic [--states=CA,NY] [--limit=250] [--dry-run]
 */
import 'dotenv/config';

import { collectGoogleCivicEnrichment } from '../../enrich/googleCivic.js';
import { collectActiveRepresentatives, type CollectOptions } from '../../ingest/openstates/index.js';
import type { CanonicalRepresentative } from '../../ingest/openstates/people.js';
import type { CanonicalSocialProfile } from '../../ingest/openstates/people.js';
import { syncRepresentativeSocial } from '../../persist/social.js';
import { syncRepresentativeDataSources } from '../../persist/data-sources.js';
import { getSupabaseClient } from '../../clients/supabase.js';

type StepCounts = {
  contacts: number;
  social: number;
  photos: number;
  dataSources: number;
};

type CliOptions = {
  states?: string[];
  limit?: number;
  dryRun?: boolean;
};

const GOOGLE_CONTACT_SOURCE = 'google_civic';
const GOOGLE_CIVIC_THROTTLE_MS = Number(process.env.GOOGLE_CIVIC_THROTTLE_MS ?? '1200');

function parseCliOptions(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg || !arg.startsWith('--')) continue;

    const [flag, rawValue] = arg.includes('=')
      ? (arg.slice(2).split('=') as [string, string | undefined])
      : [arg.slice(2), args[i + 1]];
    const value = rawValue && !rawValue.startsWith('--') ? rawValue : undefined;

    switch (flag) {
      case 'states':
        if (value) {
          options.states = value
            .split(',')
            .map((state) => state.trim().toUpperCase())
            .filter(Boolean);
        }
        break;
      case 'limit':
        if (value) {
          options.limit = Number(value);
        }
        break;
      case 'dry-run':
        options.dryRun = true;
        break;
      default:
        break;
    }

    if (value && !arg.includes('=')) {
      i += 1;
    }
  }

  return options;
}

function dedupeRepresentatives(reps: CanonicalRepresentative[]): CanonicalRepresentative[] {
  const seenIds = new Set<number>();
  const fallbackKeys = new Set<string>();
  const result: CanonicalRepresentative[] = [];

  for (const rep of reps) {
    const supabaseId = rep.supabaseRepresentativeId ?? undefined;
    if (supabaseId && seenIds.has(supabaseId)) {
      continue;
    }
    if (!supabaseId) {
      if (fallbackKeys.has(rep.canonicalKey)) continue;
      fallbackKeys.add(rep.canonicalKey);
    } else {
      seenIds.add(supabaseId);
    }
    result.push(rep);
  }

  return result;
}

async function loadRepresentatives(options: CliOptions): Promise<CanonicalRepresentative[]> {
  // Note: We skip federal reps since Google Civic API doesn't have congressional district data
  // Focus on state and local representatives only
  
  const stateOptions: CollectOptions = {};
  if (options.states && options.states.length > 0) {
    stateOptions.states = options.states;
  }
  if (typeof options.limit === 'number') {
    stateOptions.limit = options.limit;
  }

  const state = await collectActiveRepresentatives(stateOptions);
  
  // Filter to state and local only (skip federal)
  const filtered = state.filter((rep) => {
    const level = rep.currentRoles[0]?.jurisdiction?.includes('/state:') 
      ? (rep.currentRoles[0]?.chamber ? 'state' : 'local')
      : 'local';
    return level === 'state' || level === 'local';
  });

  // Enrich with division IDs from database if missing
  const client = getSupabaseClient();
  const repsWithDivisions = await Promise.all(
    filtered.map(async (rep) => {
      // If division IDs already exist in roles, use them
      if (rep.currentRoles.some((role) => role.divisionId)) {
        return rep;
      }

      // Otherwise, fetch from representative_divisions table
      if (rep.supabaseRepresentativeId) {
        const { data: divisions } = await client
          .from('representative_divisions')
          .select('division_id')
          .eq('representative_id', rep.supabaseRepresentativeId);

        if (divisions && divisions.length > 0) {
          // Add division IDs to roles
          const divisionIds = divisions.map((d) => d.division_id).filter(Boolean);
          if (divisionIds.length > 0) {
            return {
              ...rep,
              currentRoles: rep.currentRoles.map((role, idx) => ({
                ...role,
                divisionId: idx === 0 ? divisionIds[0] : role.divisionId, // Use first division ID for primary role
              })),
            };
          }
        }
      }

      return rep;
    }),
  );

  const deduped = dedupeRepresentatives(repsWithDivisions);

  if (typeof options.limit === 'number' && deduped.length > options.limit) {
    return deduped.slice(0, options.limit);
  }

  return deduped;
}

function mergeSocialProfiles(
  existing: CanonicalSocialProfile[],
  additions: CanonicalSocialProfile[],
): CanonicalSocialProfile[] {
  const map = new Map<string, CanonicalSocialProfile>();
  for (const profile of existing) {
    const key = `${profile.platform}:${profile.handle ?? profile.url ?? ''}`.toLowerCase();
    if (!map.has(key)) {
      map.set(key, profile);
    }
  }
  for (const profile of additions) {
    const key = `${profile.platform}:${profile.handle ?? profile.url ?? ''}`.toLowerCase();
    if (!map.has(key)) {
      map.set(key, profile);
    }
  }
  return Array.from(map.values());
}

async function syncGoogleContacts(
  representativeId: number,
  emails: string[],
  phones: string[],
  addresses: string[],
): Promise<void> {
  const timestamp = new Date().toISOString();
  const rows: Array<{
    representative_id: number;
    contact_type: string;
    value: string;
    is_primary: boolean;
    is_verified: boolean;
    source: string;
    updated_at: string;
  }> = [];

  const addRows = (values: string[], type: string) => {
    values.forEach((value, index) => {
      rows.push({
        representative_id: representativeId,
        contact_type: type,
        value,
        is_primary: index === 0,
        is_verified: false,
        source: GOOGLE_CONTACT_SOURCE,
        updated_at: timestamp,
      });
    });
  };

  addRows(emails, 'email');
  addRows(phones, 'phone');
  addRows(addresses, 'address');

  const client = getSupabaseClient();
  const { error: deleteError } = await client
    .from('representative_contacts')
    .delete()
    .eq('representative_id', representativeId)
    .eq('source', GOOGLE_CONTACT_SOURCE);

  if (deleteError) {
    throw new Error(
      `Failed to prune prior Google Civic contacts for representative ${representativeId}: ${deleteError.message}`,
    );
  }

  if (rows.length === 0) {
    return;
  }

  const { error: insertError } = await client.from('representative_contacts').insert(rows);
  if (insertError) {
    throw new Error(
      `Failed to upsert Google Civic contacts for representative ${representativeId}: ${insertError.message}`,
    );
  }
}

async function syncGooglePhoto(
  representativeId: number,
  name: string,
  photoUrl: string | null,
): Promise<void> {
  const client = getSupabaseClient();
  const { error: deleteError } = await client
    .from('representative_photos')
    .delete()
    .eq('representative_id', representativeId)
    .eq('source', 'google_civic');

  if (deleteError) {
    throw new Error(
      `Failed to prune prior Google Civic photo for representative ${representativeId}: ${deleteError.message}`,
    );
  }

  if (!photoUrl) {
    return;
  }

  const { error: insertError } = await client.from('representative_photos').insert({
    representative_id: representativeId,
    url: photoUrl,
    source: 'google_civic',
    is_primary: false,
    alt_text: name ? `${name} portrait` : null,
    attribution: 'Google Civic Information API',
    updated_at: new Date().toISOString(),
  });

  if (insertError) {
    throw new Error(
      `Failed to upsert Google Civic photo for representative ${representativeId}: ${insertError.message}`,
    );
  }
}

async function applyGoogleCivicEnrichment(
  rep: CanonicalRepresentative,
  options: CliOptions,
  counts: StepCounts,
): Promise<void> {
  // Throttle API calls to respect rate limits
  await new Promise((resolve) => setTimeout(resolve, GOOGLE_CIVIC_THROTTLE_MS));
  
  const enrichment = await collectGoogleCivicEnrichment(rep);
  if (!enrichment) {
    if (options.dryRun) {
      console.log(`[dry-run] ${rep.name} — no Google Civic data available.`);
    }
    return;
  }

  const representativeId = rep.supabaseRepresentativeId;
  if (!representativeId) {
    return;
  }

  const summaryParts: string[] = [];
  if (enrichment.emails.length > 0) summaryParts.push(`emails +${enrichment.emails.length}`);
  if (enrichment.phones.length > 0) summaryParts.push(`phones +${enrichment.phones.length}`);
  if (enrichment.addresses.length > 0) summaryParts.push(`addresses +${enrichment.addresses.length}`);
  if (enrichment.social.length > 0) summaryParts.push(`social +${enrichment.social.length}`);
  if (enrichment.photoUrl) summaryParts.push('photo');

  if (options.dryRun) {
    console.log(
      `[dry-run] ${rep.name} — ${summaryParts.join(', ') || 'no new data'} (division: ${
        enrichment.divisionId ?? 'unknown'
      }, match: ${enrichment.matchName ?? 'unknown'})`,
    );
    return;
  }

  if (enrichment.emails.length || enrichment.phones.length || enrichment.addresses.length) {
    await syncGoogleContacts(representativeId, enrichment.emails, enrichment.phones, enrichment.addresses);
    counts.contacts += 1;
  }

  if (enrichment.social.length > 0) {
    const mergedSocial = mergeSocialProfiles(rep.social ?? [], enrichment.social);
    const mergedRep: CanonicalRepresentative = {
      ...rep,
      social: mergedSocial,
    };
    await syncRepresentativeSocial(mergedRep);
    counts.social += 1;
  }

  if (enrichment.photoUrl) {
    await syncGooglePhoto(representativeId, rep.name, enrichment.photoUrl);
    counts.photos += 1;
  }

  if (enrichment.emails.length || enrichment.phones.length || enrichment.social.length || enrichment.photoUrl) {
    const sources = new Set(rep.sources ?? []);
    sources.add('google-civic');
    const repWithSources: CanonicalRepresentative = {
      ...rep,
      sources: Array.from(sources),
    };
    await syncRepresentativeDataSources(repWithSources);
    counts.dataSources += 1;
  }

  console.log(
    `Updated ${rep.name} (${rep.state}) — ${summaryParts.join(', ')} [division: ${
      enrichment.divisionId ?? 'unknown'
    }]`,
  );
}

async function main(): Promise<void> {
  if (!process.env.GOOGLE_CIVIC_API_KEY) {
    console.error('GOOGLE_CIVIC_API_KEY is required to run this script.');
    process.exit(1);
  }

  const options = parseCliOptions();
  const reps = await loadRepresentatives(options);

  if (reps.length === 0) {
    console.log('No representatives available for Google Civic enrichment.');
    return;
  }

  console.log(
    `Found ${reps.length} representative(s) for Google Civic enrichment${
      options.states?.length ? ` in ${options.states.join(', ')}` : ''
    }.`,
  );

  const counts: StepCounts = { contacts: 0, social: 0, photos: 0, dataSources: 0 };
  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  console.log(`\n📊 Processing ${reps.length} representative(s)...`);
  console.log('='.repeat(50));

  for (let i = 0; i < reps.length; i++) {
    const rep = reps[i];
    const progress = i + 1;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const avgTime = elapsed / progress;
    const remaining = reps.length - progress;
    const eta = Math.floor(avgTime * remaining);
    const etaMin = Math.floor(eta / 60);
    const etaSec = eta % 60;

    process.stdout.write(
      `\r   [${progress}/${reps.length}] ${rep.name}${rep.state ? ` (${rep.state})` : ''}... ${elapsed}s elapsed, ${etaMin}m ${etaSec}s remaining`,
    );

    try {
      await applyGoogleCivicEnrichment(rep, options, counts);
      successCount++;
    } catch (error) {
      errorCount++;
      const errorMsg = (error as Error).message;
      if (errorMsg.includes('404') || errorMsg.includes('not found')) {
        skippedCount++;
      } else {
        console.error(
          `\n   ❌ Failed to enrich ${rep.name} (${rep.supabaseRepresentativeId ?? 'no id'}): ${errorMsg}`,
        );
      }
    }
  }

  // Clear progress line
  process.stdout.write('\r' + ' '.repeat(100) + '\r');

  if (options.dryRun) {
    console.log('\n✅ Dry run complete.');
    return;
  }

  const totalTime = Math.floor((Date.now() - startTime) / 1000);
  const totalMin = Math.floor(totalTime / 60);
  const totalSec = totalTime % 60;

  console.log('\n📊 Enrichment Summary');
  console.log('='.repeat(50));
  console.log(`   Total processed: ${reps.length}`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   ⚠️  Skipped (no data): ${skippedCount}`);
  console.log(`\n   Data enriched:`);
  console.log(`   - Contacts: ${counts.contacts}`);
  console.log(`   - Social media: ${counts.social}`);
  console.log(`   - Photos: ${counts.photos}`);
  console.log(`   - Data sources: ${counts.dataSources}`);
  console.log(`\n⏱️  Total time: ${totalMin}m ${totalSec}s`);
  console.log('\n✅ Google Civic enrichment complete!');
}

main().catch((error) => {
  console.error('Google Civic enrichment failed:', error);
  process.exit(1);
});


