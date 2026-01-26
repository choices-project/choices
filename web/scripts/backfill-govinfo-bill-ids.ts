#!/usr/bin/env tsx
/**
 * Backfill representative_activity metadata with govinfo_bill_id for federal bills.
 *
 * Selects rows with metadata.identifier (e.g. "HR 1234", "S 567") and metadata.session,
 * derives congress from session, builds BILLS-{congress}{type}{number}-{suffix}, and
 * updates metadata.govinfo_bill_id.
 *
 * Usage:
 *   npm run backfill:govinfo-bill-ids
 *   npm run backfill:govinfo-bill-ids:dry
 *   npx tsx scripts/backfill-govinfo-bill-ids.ts --dry-run --limit 500
 */

import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

import {
  identifierToGovInfoPackageId,
  sessionToCongress
} from '../lib/integrations/bill-id-crosswalk';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const limitIdx = argv.indexOf('--limit');
const limit = limitIdx >= 0 && argv[limitIdx + 1] ? parseInt(argv[limitIdx + 1], 10) : 2000;

type ActivityRow = {
  id: number;
  representative_id: number;
  type: string;
  title: string;
  metadata: Record<string, unknown> | null;
};

async function main() {
  console.log('Backfilling govinfo_bill_id in representative_activity metadata...');
  if (dryRun) console.log('(dry run – no updates)');
  console.log('');

  const { data: rows, error } = await supabase
    .from('representative_activity')
    .select('id, representative_id, type, title, metadata')
    .not('metadata', 'is', null)
    .limit(limit);

  if (error) {
    console.error('Fetch error:', error.message);
    process.exit(1);
  }

  const activities = (rows ?? []) as ActivityRow[];
  let updated = 0;
  let skipped = 0;

  for (const row of activities) {
    const meta = row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};
    const identifier = typeof meta.identifier === 'string' ? meta.identifier : null;
    const session = meta.session != null ? String(meta.session) : null;
    if (meta.govinfo_bill_id != null) {
      skipped++;
      continue;
    }
    const congress = sessionToCongress(session);
    const govinfoId = identifier && congress != null
      ? identifierToGovInfoPackageId(identifier, congress)
      : null;
    if (!govinfoId) {
      skipped++;
      continue;
    }

    const nextMeta = { ...meta, govinfo_bill_id: govinfoId };
    if (!dryRun) {
      const { error: upErr } = await supabase
        .from('representative_activity')
        .update({ metadata: nextMeta, updated_at: new Date().toISOString() })
        .eq('id', row.id);
      if (upErr) {
        console.warn(`Update failed id=${row.id}: ${upErr.message}`);
        continue;
      }
    }
    updated++;
    if (updated <= 10) {
      console.log(`  ${dryRun ? '[dry] ' : ''}id=${row.id} rep=${row.representative_id} ${identifier} -> ${govinfoId}`);
    }
  }

  console.log('');
  console.log(`Done. Updated=${updated} skipped=${skipped} total=${activities.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
