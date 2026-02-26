#!/usr/bin/env node
/**
 * Debug script: Log raw OpenStates committees API response for a jurisdiction.
 * Run: npm run build && node build/scripts/tools/debug-committees-api.js
 * Or: npx tsx NEW_civics_ingest/scripts/tools/debug-committees-api.ts
 *
 * Set OPENSTATES_API_KEY and optionally JURISDICTION=ocd-jurisdiction/country:us/state:ca
 */
import { loadEnv } from '../../utils/load-env.js';
loadEnv();

const OPENSTATES_API_BASE = process.env.OPENSTATES_API_BASE ?? 'https://v3.openstates.org';
const JURISDICTION =
  process.env.JURISDICTION ?? 'ocd-jurisdiction/country:us/state:ca';

async function main() {
  const apiKey = process.env.OPENSTATES_API_KEY;
  if (!apiKey) {
    console.error('OPENSTATES_API_KEY is required');
    process.exit(1);
  }

  // Test 1: Without jurisdiction (get any committees)
  const urlAny = new URL('/committees', OPENSTATES_API_BASE);
  urlAny.searchParams.set('per_page', '5');
  console.log('Test 1 - Any committees:', urlAny.toString());
  const resAny = await fetch(urlAny.toString(), {
    headers: { 'X-API-KEY': apiKey, Accept: 'application/json' },
  });
  const jsonAny = (await resAny.json()) as { results?: unknown[]; pagination?: { total_items?: number } };
  console.log('  Status:', resAny.status, '| results:', jsonAny.results?.length ?? 0, '| total:', jsonAny.pagination?.total_items ?? '?');
  if (jsonAny.results?.[0]) {
    const first = jsonAny.results[0] as Record<string, unknown>;
    console.log('  First jurisdiction:', (first.jurisdiction as Record<string, unknown>)?.id ?? first.jurisdiction);
  }
  console.log('');

  // Test 2: With jurisdiction
  const url = new URL('/committees', OPENSTATES_API_BASE);
  url.searchParams.set('jurisdiction', JURISDICTION);
  url.searchParams.set('per_page', '10');
  url.searchParams.append('include', 'memberships');

  console.log('Test 2 - With jurisdiction:', url.toString());
  console.log('');

  const res = await fetch(url.toString(), {
    headers: {
      'X-API-KEY': apiKey,
      Accept: 'application/json',
    },
  });

  console.log('Status:', res.status, res.statusText);
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    console.log('Body (raw):', text.slice(0, 500));
    return;
  }

  console.log('Keys:', Object.keys(json as object));
  const obj = json as Record<string, unknown>;
  if (Array.isArray(obj.results)) {
    console.log('results.length:', obj.results.length);
    const first = obj.results[0] as Record<string, unknown> | undefined;
    if (first) {
      console.log('First committee keys:', Object.keys(first));
      console.log('First committee memberships:', first.memberships ? 'present' : 'absent');
      if (first.memberships && Array.isArray(first.memberships)) {
        console.log('Memberships count:', first.memberships.length);
      }
    }
  }
  if (obj.pagination) {
    console.log('Pagination:', obj.pagination);
  }
  console.log('');
  console.log('Full response (truncated):', JSON.stringify(json, null, 2).slice(0, 2000));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
