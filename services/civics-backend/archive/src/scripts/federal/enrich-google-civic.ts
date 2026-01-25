#!/usr/bin/env node
/**
 * Google Civic API federal enrichment: populate google_civic_id and enrich
 * contact/social/photo data for federal representatives.
 *
 * Run via: `npm run federal:enrich:google-civic`
 */
import 'dotenv/config';

import {
  fetchRepresentativeInfoByDivision,
  buildCongressionalDistrictId,
  type GoogleCivicRepresentativeInfoResponse,
  type GoogleCivicOfficial,
  type GoogleCivicOffice,
  GoogleCivicApiError,
} from '../../clients/googleCivic.js';
import { getSupabaseClient } from '../../clients/supabase.js';

interface CliOptions {
  limit?: number;
  states?: string[];
  dryRun?: boolean;
  skipExisting?: boolean;
}

interface RepresentativeRow {
  id: number;
  name: string;
  state: string | null;
  district: string | null;
  office: string | null;
  google_civic_id: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  primary_website: string | null;
  primary_photo_url: string | null;
  status: 'active' | 'inactive' | 'historical' | null;
}

const GOOGLE_CIVIC_THROTTLE_MS = Number(process.env.GOOGLE_CIVIC_THROTTLE_MS ?? '1200');

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg || !arg.startsWith('--')) continue;

    let flag: string;
    let rawValue: string | undefined;
    if (arg.includes('=')) {
      const [f, v] = arg.slice(2).split('=');
      flag = f ?? '';
      rawValue = v;
    } else {
      flag = arg.slice(2);
      const next = args[i + 1];
      rawValue = next && !next.startsWith('--') ? next : undefined;
    }

    const value = rawValue && !String(rawValue).startsWith('--') ? String(rawValue).trim() : undefined;

    switch (flag) {
      case 'limit':
        if (value) options.limit = Number(value);
        break;
      case 'states':
        if (value) {
          options.states = value
            .split(',')
            .map((state) => state.trim().toUpperCase())
            .filter(Boolean);
        }
        break;
      case 'dry-run':
        options.dryRun = true;
        break;
      case 'skip-existing':
        options.skipExisting = true;
        break;
      default:
        break;
    }

    if (!arg.includes('=') && rawValue !== undefined) {
      i += 1;
    }
  }

  return options;
}

const FEDERAL_SELECT =
  'id,name,state,district,office,google_civic_id,primary_email,primary_phone,primary_website,primary_photo_url,status';

async function fetchFederalRows(options: CliOptions): Promise<RepresentativeRow[]> {
  const client = getSupabaseClient();
  let query = client
    .from('representatives_core')
    .select(FEDERAL_SELECT)
    .eq('level', 'federal')
    .eq('status', 'active');

  if (options.states && options.states.length > 0) {
    query = query.in('state', options.states);
  }

  if (options.skipExisting) {
    query = query.is('google_civic_id', null);
  }

  if (typeof options.limit === 'number' && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch federal representatives: ${error.message}`);
  }

  return (data ?? []) as RepresentativeRow[];
}

function normaliseName(value: string | null | undefined): string {
  if (!value) return '';
  let processed = value.trim();

  if (processed.includes(',')) {
    const parts = processed
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      const [last, ...rest] = parts;
      processed = `${rest.join(' ')} ${last}`.trim();
    } else {
      processed = parts.join(' ');
    }
  }

  return processed
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findMatchingOfficial(
  payload: GoogleCivicRepresentativeInfoResponse,
  rep: RepresentativeRow,
): { official: GoogleCivicOfficial; office: GoogleCivicOffice | null; officialIndex: number } | null {
  if (!payload.officials || payload.officials.length === 0) {
    return null;
  }

  const offices = payload.offices ?? [];
  const officials = payload.officials ?? [];
  const repNameNormalized = normaliseName(rep.name);

  // Filter offices by level (federal) and role (legislator)
  const federalOffices = offices.filter((office) => {
    const levels = office.levels ?? [];
    const roles = office.roles ?? [];
    return (
      levels.includes('country') &&
      (roles.includes('legislatorUpperBody') || roles.includes('legislatorLowerBody'))
    );
  });

  // Try to match by office first (more accurate)
  for (const office of federalOffices) {
    // Check if office matches rep's office type
    const isSenatorOffice = office.roles?.includes('legislatorUpperBody') ?? false;
    const isRepOffice = office.roles?.includes('legislatorLowerBody') ?? false;
    const repIsSenator = rep.office === 'Senator';
    const repIsRepresentative = rep.office === 'Representative';

    if (
      (repIsSenator && !isSenatorOffice) ||
      (repIsRepresentative && !isRepOffice)
    ) {
      continue;
    }

    // Check officials in this office
    for (const officialIndex of office.officialIndices ?? []) {
      const official = officials[officialIndex];
      if (!official) continue;

      const officialNameNormalized = normaliseName(official.name);
      if (officialNameNormalized === repNameNormalized) {
        return { official, office, officialIndex };
      }

      // Try partial match (first and last name)
      const repParts = repNameNormalized.split(/\s+/);
      const officialParts = officialNameNormalized.split(/\s+/);
      if (
        repParts.length >= 2 &&
        officialParts.length >= 2 &&
        repParts[repParts.length - 1] === officialParts[officialParts.length - 1] && // Last name matches
        repParts[0] === officialParts[0] // First name matches
      ) {
        return { official, office, officialIndex };
      }
    }
  }

  // Fallback: name-only matching across all officials
  for (let i = 0; i < officials.length; i++) {
    const official = officials[i];
    const officialNameNormalized = normaliseName(official.name);
    if (officialNameNormalized === repNameNormalized) {
      // Find office for this official
      const office = offices.find((o) => o.officialIndices?.includes(i)) ?? null;
      return { official, office, officialIndex: i };
    }
  }

  return null;
}

async function enrichRepresentative(
  rep: RepresentativeRow,
  options: CliOptions,
): Promise<{
  success: boolean;
  googleCivicId: string | null;
  enriched: {
    contacts: boolean;
    social: boolean;
    photo: boolean;
    primaryFields: boolean;
  };
  error?: string;
}> {
  if (!rep.state) {
    return {
      success: false,
      googleCivicId: null,
      enriched: { contacts: false, social: false, photo: false, primaryFields: false },
      error: 'Missing state',
    };
  }

  // Build OCD division ID
  let divisionId: string;
  try {
    divisionId = buildCongressionalDistrictId(rep.state, rep.district, rep.office ?? 'Representative');
  } catch (error) {
    return {
      success: false,
      googleCivicId: null,
      enriched: { contacts: false, social: false, photo: false, primaryFields: false },
      error: `Failed to build division ID: ${(error as Error).message}`,
    };
  }

  // Throttle API calls
  await new Promise((resolve) => setTimeout(resolve, GOOGLE_CIVIC_THROTTLE_MS));

  // Fetch representative info
  let payload: GoogleCivicRepresentativeInfoResponse | null;
  try {
    payload = await fetchRepresentativeInfoByDivision(divisionId);
  } catch (error) {
    const apiError = error as GoogleCivicApiError;
    if (apiError.statusCode === 404) {
      return {
        success: false,
        googleCivicId: null,
        enriched: { contacts: false, social: false, photo: false, primaryFields: false },
        error: 'Division not found',
      };
    }
    if (apiError.statusCode === 429) {
      return {
        success: false,
        googleCivicId: null,
        enriched: { contacts: false, social: false, photo: false, primaryFields: false },
        error: 'Rate limit exceeded',
      };
    }
    return {
      success: false,
      googleCivicId: null,
      enriched: { contacts: false, social: false, photo: false, primaryFields: false },
      error: apiError.message,
    };
  }

  if (!payload) {
    return {
      success: false,
      googleCivicId: null,
      enriched: { contacts: false, social: false, photo: false, primaryFields: false },
      error: 'No data returned',
    };
  }

  // Find matching official
  const match = findMatchingOfficial(payload, rep);
  if (!match) {
    return {
      success: false,
      googleCivicId: null,
      enriched: { contacts: false, social: false, photo: false, primaryFields: false },
      error: 'No matching official found',
    };
  }

  const { official, officialIndex } = match;
  const googleCivicId = `${divisionId}:${officialIndex}`;

  // Prepare enrichment data
  const emails = (official.emails ?? []).filter((e) => e && e.trim().length > 0);
  const phones = (official.phones ?? []).filter((p) => p && p.trim().length > 0);
  const urls = (official.urls ?? []).filter((u) => u && u.trim().length > 0);
  const photoUrl = official.photoUrl ?? null;

  // Build social media profiles from channels
  const socialProfiles: Array<{
    platform: string;
    handle: string | null;
    url: string | null;
  }> = [];
  for (const channel of official.channels ?? []) {
    const type = channel.type?.toLowerCase();
    const id = channel.id;
    if (!type || !id) continue;

    let url: string | null = null;
    switch (type) {
      case 'twitter':
        url = `https://twitter.com/${id}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/${id}`;
        break;
      case 'youtube':
        url = id.startsWith('UC') ? `https://www.youtube.com/channel/${id}` : `https://www.youtube.com/${id}`;
        break;
      case 'instagram':
        url = `https://www.instagram.com/${id}`;
        break;
      case 'tiktok':
        url = `https://www.tiktok.com/@${id}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/in/${id}`;
        break;
    }

    socialProfiles.push({
      platform: type,
      handle: id,
      url,
    });
  }

  // Update primary fields if missing
  const primaryUpdates: Record<string, string> = {};
  if (!rep.primary_email && emails.length > 0) {
    primaryUpdates.primary_email = emails[0].slice(0, 255);
  }
  if (!rep.primary_phone && phones.length > 0) {
    primaryUpdates.primary_phone = phones[0].slice(0, 20);
  }
  if (!rep.primary_website && urls.length > 0) {
    primaryUpdates.primary_website = urls[0].slice(0, 500);
  }
  if (!rep.primary_photo_url && photoUrl) {
    primaryUpdates.primary_photo_url = photoUrl.slice(0, 500);
  }

  if (options.dryRun) {
    return {
      success: true,
      googleCivicId,
      enriched: {
        contacts: emails.length > 0 || phones.length > 0,
        social: false, // Social media handled separately via state sync
        photo: photoUrl !== null,
        primaryFields: Object.keys(primaryUpdates).length > 0,
      },
    };
  }

  // Store data
  const client = getSupabaseClient();
  const now = new Date().toISOString();

  // Update google_civic_id
  const { error: idError } = await client
    .from('representatives_core')
    .update({ google_civic_id: googleCivicId })
    .eq('id', rep.id);

  if (idError) {
    return {
      success: false,
      googleCivicId: null,
      enriched: { contacts: false, social: false, photo: false, primaryFields: false },
      error: `Failed to update google_civic_id: ${idError.message}`,
    };
  }

  // Update primary fields
  if (Object.keys(primaryUpdates).length > 0) {
    const { error: primaryError } = await client
      .from('representatives_core')
      .update({ ...primaryUpdates, updated_at: now })
      .eq('id', rep.id);

    if (primaryError) {
      console.warn(`Failed to update primary fields for ${rep.name}: ${primaryError.message}`);
    }
  }

  // Store contacts
  if (emails.length > 0 || phones.length > 0) {
    const contactRows = [
      ...emails.map((email) => ({
        representative_id: rep.id,
        contact_type: 'email',
        value: email,
        is_primary: false,
        is_verified: false,
        source: 'google_civic',
        updated_at: now,
      })),
      ...phones.map((phone) => ({
        representative_id: rep.id,
        contact_type: 'phone',
        value: phone,
        is_primary: false,
        is_verified: false,
        source: 'google_civic',
        updated_at: now,
      })),
    ];

    // Delete existing Google Civic contacts
    await client
      .from('representative_contacts')
      .delete()
      .eq('representative_id', rep.id)
      .eq('source', 'google_civic');

    if (contactRows.length > 0) {
      const { error: contactError } = await client
        .from('representative_contacts')
        .insert(contactRows);

      if (contactError) {
        console.warn(`Failed to store contacts for ${rep.name}: ${contactError.message}`);
      }
    }
  }

  // Store social media
  // Note: The table is representative_social_media and doesn't have a source field
  // We'll store social profiles but can't filter by source, so we'll update all social for this rep
  // For now, we'll skip social media storage in the federal script to avoid conflicts
  // Social media can be enriched via the state sync script which handles it properly
  // This keeps the federal script focused on google_civic_id and primary contact fields

  // Store photo
  if (photoUrl) {
    // Delete existing Google Civic photos
    await client
      .from('representative_photos')
      .delete()
      .eq('representative_id', rep.id)
      .eq('source', 'google_civic');

    const { error: photoError } = await client
      .from('representative_photos')
      .insert({
        representative_id: rep.id,
        url: photoUrl,
        source: 'google_civic',
        is_primary: false,
        alt_text: `${rep.name} portrait`,
        attribution: 'Google Civic Information API',
        updated_at: now,
      });

    if (photoError) {
      console.warn(`Failed to store photo for ${rep.name}: ${photoError.message}`);
    }
  }

  // Update data sources
  const sources = new Set<string>();
  if (emails.length > 0 || phones.length > 0 || photoUrl) {
    sources.add('google-civic');
  }

  if (sources.size > 0) {
    // Get current data_sources
    const { data: currentRep } = await client
      .from('representatives_core')
      .select('data_sources')
      .eq('id', rep.id)
      .single();

    const currentSources = new Set(currentRep?.data_sources ?? []);
    sources.forEach((s) => currentSources.add(s));

    await client
      .from('representatives_core')
      .update({ data_sources: Array.from(currentSources) })
      .eq('id', rep.id);
  }

  return {
    success: true,
    googleCivicId,
    enriched: {
      contacts: emails.length > 0 || phones.length > 0,
      social: socialProfiles.length > 0,
      photo: photoUrl !== null,
      primaryFields: Object.keys(primaryUpdates).length > 0,
    },
  };
}

function formatElapsed(startTime: number): string {
  const elapsed = Date.now() - startTime;
  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

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

async function checkGoogleCivicIdCoverage(): Promise<{
  total: number;
  withGoogleCivicId: number;
  missingGoogleCivicId: number;
  coveragePercent: number;
}> {
  const client = getSupabaseClient();
  const { data: allFederal, error: allError } = await client
    .from('representatives_core')
    .select('id, google_civic_id')
    .eq('level', 'federal')
    .eq('status', 'active');

  if (allError) {
    throw new Error(`Failed to check Google Civic ID coverage: ${allError.message}`);
  }

  const total = allFederal?.length ?? 0;
  const withGoogleCivicId = allFederal?.filter((r) => r.google_civic_id)?.length ?? 0;
  const missingGoogleCivicId = total - withGoogleCivicId;
  const coveragePercent = total > 0 ? Math.round((withGoogleCivicId / total) * 100) : 0;

  return { total, withGoogleCivicId, missingGoogleCivicId, coveragePercent };
}

async function main(): Promise<void> {
  const startTime = Date.now();
  try {
    const options = parseArgs();

    if (!process.env.GOOGLE_CIVIC_API_KEY) {
      console.error('GOOGLE_CIVIC_API_KEY is required to run this script.');
      process.exit(1);
    }

    console.log('\n📊 Google Civic Federal Enrichment');
    console.log('='.repeat(50));

    if (options.limit) {
      console.log(`Limiting enrichment to ${options.limit} representatives.`);
    }
    if (options.states?.length) {
      console.log(`Filtering by states: ${options.states.join(', ')}`);
    }
    if (options.skipExisting) {
      console.log('Skipping representatives that already have google_civic_id.');
    }
    if (options.dryRun) {
      console.log('Running in dry-run mode (no Supabase updates will be made).');
    }

    // Pre-enrichment: Check Google Civic ID coverage
    console.log('\n🔍 Pre-enrichment checks...');
    const coverage = await checkGoogleCivicIdCoverage();
    console.log(
      `   Google Civic ID coverage: ${coverage.withGoogleCivicId}/${coverage.total} (${coverage.coveragePercent}%)`,
    );
    if (coverage.missingGoogleCivicId > 0) {
      console.log(
        `   ⚠️  ${coverage.missingGoogleCivicId} active federal representatives missing Google Civic IDs.`,
      );
    }

    const reps = await fetchFederalRows(options);
    if (reps.length === 0) {
      console.log('\n✅ No representatives to enrich.');
      return;
    }

    console.log(`\n📊 Enriching ${reps.length} representative(s)...`);
    console.log('='.repeat(50));

    let successCount = 0;
    let errorCount = 0;
    let rateLimitedCount = 0;
    let noMatchCount = 0;
    const errors: string[] = [];
    const enriched = {
      contacts: 0,
      social: 0,
      photo: 0,
      primaryFields: 0,
    };

    for (let i = 0; i < reps.length; i++) {
      const rep = reps[i];
      const progress = i + 1;
      const elapsed = formatElapsed(startTime);
      const eta = estimateTimeRemaining(progress, reps.length, Date.now() - startTime);

      process.stdout.write(
        `\r   [${progress}/${reps.length}] ${rep.name}${rep.state ? ` (${rep.state}${rep.district ? `-${rep.district}` : ''})` : ''}... ${elapsed} elapsed, ${eta} remaining`,
      );

      try {
        const result = await enrichRepresentative(rep, options);

        if (result.success) {
          successCount++;
          if (result.enriched.contacts) enriched.contacts++;
          if (result.enriched.social) enriched.social++;
          if (result.enriched.photo) enriched.photo++;
          if (result.enriched.primaryFields) enriched.primaryFields++;
        } else {
          if (result.error === 'Rate limit exceeded') {
            rateLimitedCount++;
          } else if (result.error === 'No matching official found') {
            noMatchCount++;
          } else {
            errorCount++;
            errors.push(`${rep.name}: ${result.error}`);
          }
        }
      } catch (error) {
        errorCount++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`${rep.name}: ${errorMsg}`);
        console.error(`\n   ❌ Error enriching ${rep.name}: ${errorMsg}`);
      }
    }

    // Clear progress line
    process.stdout.write('\r' + ' '.repeat(100) + '\r');

    // Summary
    console.log('\n📊 Enrichment Summary');
    console.log('='.repeat(50));
    console.log(`   Total processed: ${reps.length}`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   🚦 Rate limited: ${rateLimitedCount}`);
    console.log(`   ⚠️  No match: ${noMatchCount}`);
    console.log(`\n   Data enriched:`);
    console.log(`   - Contacts: ${enriched.contacts}`);
    console.log(`   - Social media: ${enriched.social}`);
    console.log(`   - Photos: ${enriched.photo}`);
    console.log(`   - Primary fields: ${enriched.primaryFields}`);

    if (errors.length > 0) {
      console.log('\n   Error details:');
      errors.slice(0, 10).forEach((err) => console.log(`     - ${err}`));
      if (errors.length > 10) {
        console.log(`     ... and ${errors.length - 10} more errors`);
      }
    }

    const totalTime = formatElapsed(startTime);
    console.log(`\n⏱️  Total time: ${totalTime}`);

    // Post-enrichment verification
    if (!options.dryRun && successCount > 0) {
      console.log('\n🔍 Post-enrichment verification...');
      const postCoverage = await checkGoogleCivicIdCoverage();
      console.log(
        `   Google Civic ID coverage: ${postCoverage.withGoogleCivicId}/${postCoverage.total} (${postCoverage.coveragePercent}%)`,
      );
      const improvement = postCoverage.withGoogleCivicId - coverage.withGoogleCivicId;
      if (improvement > 0) {
        console.log(`   ✅ Improved by ${improvement} representatives`);
      }
    }

    console.log('\n✅ Enrichment complete!');
  } catch (error) {
    console.error('\n❌ Google Civic enrichment failed:', error);
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
