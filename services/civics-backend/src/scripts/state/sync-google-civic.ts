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
import { fetchFederalRepresentatives, type FetchFederalOptions } from '../../ingest/supabase/representatives.js';
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
  const federalOptions: FetchFederalOptions = {};
  if (options.states && options.states.length > 0) {
    federalOptions.states = options.states;
  }

  const stateOptions: CollectOptions = {};
  if (options.states && options.states.length > 0) {
    stateOptions.states = options.states;
  }
  if (typeof options.limit === 'number') {
    stateOptions.limit = options.limit;
  }

  const [federal, state] = await Promise.all([
    fetchFederalRepresentatives(federalOptions),
    collectActiveRepresentatives(stateOptions),
  ]);

  const combined = dedupeRepresentatives([...federal, ...state]);

  if (typeof options.limit === 'number' && combined.length > options.limit) {
    return combined.slice(0, options.limit);
  }

  return combined;
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

  for (const rep of reps) {
    try {
      await applyGoogleCivicEnrichment(rep, options, counts);
    } catch (error) {
      console.error(
        `Failed to enrich ${rep.name} (${rep.supabaseRepresentativeId ?? 'no id'}):`,
        (error as Error).message,
      );
    }
  }

  if (options.dryRun) {
    console.log('Dry run complete.');
    return;
  }

  console.log(
    `Google Civic enrichment complete. Contacts updated: ${counts.contacts}, social: ${counts.social}, photos: ${counts.photos}, data sources: ${counts.dataSources}.`,
  );
}

main().catch((error) => {
  console.error('Google Civic enrichment failed:', error);
  process.exit(1);
});


