#!/usr/bin/env node
/**
 * Sync state-level voter registration resources into Supabase.
 *
 * Supports loading curated JSON from a remote URL, a local file, or both. The data shape is:
 * [
 *   {
 *     "state_code": "CA",
 *     "election_office_name": "California Secretary of State",
 *     "online_url": "https://registertovote.ca.gov/",
 *     "mail_form_url": "https://elections.cdn.sos.ca.gov/voter-registration/forms/english/voter-reg-eng.pdf",
 *     "mailing_address": "Secretary of State\nElections Division\n1500 11th Street\nSacramento, CA 95814",
 *     "status_check_url": "https://voterstatus.sos.ca.gov/",
 *     "special_instructions": "Online registration closes 15 days before Election Day.",
 *     "sources": ["vote.gov"],
 *     "metadata": {
 *       "notes": "Online portal available."
 *     }
 *   }
 * ]
 *
 * Usage:
 *   npm run state:sync:voter-registration
 *   npm run state:sync:voter-registration -- --dry-run
 *
 * Optional environment variables:
 *   - VOTER_REGISTRATION_DATA_URL: Remote JSON endpoint (same shape as above).
 *   - VOTER_REGISTRATION_DATA_FILE: Local JSON file path. Defaults to data/voter-registration/resources.json
 */
import 'dotenv/config';

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { getSupabaseClient } from '../../clients/supabase.js';

type CuratedResource = {
  state_code: string;
  election_office_name?: string | null;
  online_url?: string | null;
  mail_form_url?: string | null;
  mailing_address?: string | null;
  status_check_url?: string | null;
  special_instructions?: string | null;
  sources?: string[];
  metadata?: Record<string, unknown> | null;
};

type ResourceRow = {
  state_code: string;
  election_office_name: string | null;
  online_url: string | null;
  mail_form_url: string | null;
  mailing_address: string | null;
  status_check_url: string | null;
  special_instructions: string | null;
  sources: string[];
  metadata: Record<string, unknown> | null;
  last_verified: string;
  updated_at: string;
};

type CliOptions = {
  dryRun: boolean;
};

interface MergeableResource {
  election_office_name?: string | null;
  online_url?: string | null;
  mail_form_url?: string | null;
  mailing_address?: string | null;
  status_check_url?: string | null;
  special_instructions?: string | null;
  sources?: string[];
  metadata?: Record<string, unknown> | null;
}

const DEFAULT_DATA_FILE = path.resolve(process.cwd(), 'data/voter-registration/resources.json');
const REMOTE_DATA_URL = process.env.VOTER_REGISTRATION_DATA_URL ?? '';

const MANUAL_OVERRIDES: Record<string, MergeableResource> = {
  ND: {
    special_instructions:
      'North Dakota does not require voter registration. Bring acceptable identification when you vote.',
    sources: ['manual'],
  },
};

function parseArgs(): CliOptions {
  const options: CliOptions = {
    dryRun: false,
  };

  for (const arg of process.argv.slice(2)) {
    if (arg === '--dry-run' || arg === '--dryrun') {
      options.dryRun = true;
    }
  }

  return options;
}

async function fetchRemoteData(url: string): Promise<CuratedResource[]> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Choices-Civics-Ingest/1.0 (+https://choices.dev)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch voter registration data (${response.status} ${response.statusText})`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error('Unexpected remote data format: expected an array of resources');
  }

  return payload as CuratedResource[];
}

async function readLocalData(filePath: string): Promise<CuratedResource[]> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('Local data file must contain an array');
    }
    return parsed as CuratedResource[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn(`[voter-registration] Local data file not found at ${filePath}; skipping.`);
      return [];
    }
    throw error;
  }
}

function mergeResource(target: MergeableResource, patch: MergeableResource | null | undefined): MergeableResource {
  const merged: MergeableResource = { ...target };
  if (!patch) return merged;

  if (patch.election_office_name !== undefined) {
    merged.election_office_name = patch.election_office_name ?? null;
  }
  if (patch.online_url !== undefined) {
    merged.online_url = patch.online_url ?? null;
  }
  if (patch.mail_form_url !== undefined) {
    merged.mail_form_url = patch.mail_form_url ?? null;
  }
  if (patch.mailing_address !== undefined) {
    merged.mailing_address = patch.mailing_address ?? null;
  }
  if (patch.status_check_url !== undefined) {
    merged.status_check_url = patch.status_check_url ?? null;
  }
  if (patch.special_instructions !== undefined) {
    merged.special_instructions = patch.special_instructions ?? null;
  }
  if (patch.sources !== undefined) {
    const existing = new Set<string>(merged.sources ?? []);
    for (const source of patch.sources ?? []) {
      if (source) existing.add(source);
    }
    merged.sources = Array.from(existing);
  }
  if (patch.metadata !== undefined) {
    merged.metadata = patch.metadata ?? null;
  }

  return merged;
}

function createPatchFromResource(resource: CuratedResource): MergeableResource {
  const patch: MergeableResource = {};

  if (resource.election_office_name !== undefined) {
    patch.election_office_name = resource.election_office_name ?? null;
  }
  if (resource.online_url !== undefined) {
    patch.online_url = resource.online_url ?? null;
  }
  if (resource.mail_form_url !== undefined) {
    patch.mail_form_url = resource.mail_form_url ?? null;
  }
  if (resource.mailing_address !== undefined) {
    patch.mailing_address = resource.mailing_address ?? null;
  }
  if (resource.status_check_url !== undefined) {
    patch.status_check_url = resource.status_check_url ?? null;
  }
  if (resource.special_instructions !== undefined) {
    patch.special_instructions = resource.special_instructions ?? null;
  }
  if (resource.sources !== undefined) {
    patch.sources = resource.sources;
  }
  if (resource.metadata !== undefined) {
    patch.metadata = resource.metadata ?? null;
  }

  return patch;
}

function normalizeResource(resource: CuratedResource): ResourceRow {
  const stateCode = resource.state_code?.trim().toUpperCase();
  if (!stateCode || !/^[A-Z]{2}$/.test(stateCode)) {
    throw new Error(`Invalid state code encountered: ${resource.state_code}`);
  }

  const sources = Array.from(new Set(resource.sources ?? [])).filter(Boolean);
  if (sources.length === 0) {
    sources.push('manual');
  }

  const timestamp = new Date().toISOString();

  const metadata =
    resource.metadata && Object.keys(resource.metadata).length > 0 ? resource.metadata : null;

  return {
    state_code: stateCode,
    election_office_name: resource.election_office_name ?? null,
    online_url: resource.online_url ?? null,
    mail_form_url: resource.mail_form_url ?? null,
    mailing_address: resource.mailing_address ?? null,
    status_check_url: resource.status_check_url ?? null,
    special_instructions: resource.special_instructions ?? null,
    sources,
    metadata,
    last_verified: timestamp,
    updated_at: timestamp,
  };
}

async function loadCuratedResources(): Promise<ResourceRow[]> {
  const merged = new Map<string, MergeableResource>();

  // Manual overrides as baseline
  for (const [stateCode, resource] of Object.entries(MANUAL_OVERRIDES)) {
    merged.set(stateCode, mergeResource({}, resource));
  }

  // Remote data
  if (REMOTE_DATA_URL) {
    try {
      console.log(`[voter-registration] Fetching remote resources from ${REMOTE_DATA_URL}`);
      const remote = await fetchRemoteData(REMOTE_DATA_URL);
      for (const resource of remote) {
        const stateCode = resource.state_code?.trim().toUpperCase();
        if (!stateCode) {
          console.warn('[voter-registration] Skipping remote entry with missing state_code');
          continue;
        }
        const current = merged.get(stateCode) ?? {};
        const patch = createPatchFromResource({
          ...resource,
          sources: resource.sources ?? ['vote.gov'],
        });
        merged.set(stateCode, mergeResource(current, patch));
      }
    } catch (error) {
      console.warn(
        `[voter-registration] Failed to fetch remote resources: ${(error as Error).message}. Continuing with local data.`,
      );
    }
  }

  // Local data file
  const localDataFile = process.env.VOTER_REGISTRATION_DATA_FILE ?? DEFAULT_DATA_FILE;
  try {
    const local = await readLocalData(localDataFile);
    for (const resource of local) {
      const stateCode = resource.state_code?.trim().toUpperCase();
      if (!stateCode) {
        console.warn('[voter-registration] Skipping local entry with missing state_code');
        continue;
      }

      const current = merged.get(stateCode) ?? {};
      merged.set(stateCode, mergeResource(current, createPatchFromResource(resource)));
    }
  } catch (error) {
    throw new Error(
      `[voter-registration] Failed to read local resources (${(error as Error).message}).`,
    );
  }

  if (merged.size === 0) {
    throw new Error('No voter registration resources loaded from remote or local sources.');
  }

  const rows: ResourceRow[] = [];
  for (const [stateCode, resource] of merged.entries()) {
    rows.push(
      normalizeResource({
        state_code: stateCode,
        ...resource,
      }),
    );
  }

  rows.sort((a, b) => a.state_code.localeCompare(b.state_code));

  return rows;
}

async function upsertResources(rows: ResourceRow[], dryRun: boolean): Promise<void> {
  console.log(`[voter-registration] Prepared ${rows.length} resource rows.`);

  if (dryRun) {
    console.log('[voter-registration] Dry run enabled – no changes written.');
    return;
  }

  const client = getSupabaseClient();

  const { data, error } = await client
    .from('voter_registration_resources')
    .upsert(rows, { onConflict: 'state_code' })
    .select('state_code');

  if (error) {
    throw new Error(`Failed to upsert voter registration resources: ${error.message}`);
  }

  const affected = data?.length ?? 0;
  console.log(`[voter-registration] Upsert complete (${affected} rows).`);
}

async function main() {
  const options = parseArgs();
  const rows = await loadCuratedResources();
  await upsertResources(rows, options.dryRun);
}

main().catch((error) => {
  console.error('[voter-registration] Sync failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});


