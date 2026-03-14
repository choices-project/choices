#!/usr/bin/env tsx
/**
 * Seed constituent-will polls from current political landscape (119th Congress).
 *
 * Loads seed-polls-config.json, resolves created_by from E2E_ADMIN_EMAIL,
 * optionally fetches bill summaries from GovInfo, and inserts polls + options.
 *
 * Usage:
 *   npm run seed:polls
 *   npx tsx scripts/seed-constituent-will-polls.ts
 *
 * Requires:
 *   - E2E_ADMIN_EMAIL (user must exist in Supabase Auth)
 *   - SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL
 *   - GOVINFO_API_KEY (optional; for bill summaries)
 */

import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env before govInfoMCPService is imported (it reads process.env at init)
config({ path: resolve(__dirname, '../../.env.local') });
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

// Dynamic import after env is loaded so GovInfo API key is available
const { govInfoMCPService } = await import('../lib/services/govinfo-mcp-service');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;

type PollConfig = {
  representativeId: number;
  representativeName: string;
  billId: string;
  billTitle: string;
  description?: string;
};

type SeedConfig = {
  narrative: string;
  polls: PollConfig[];
};

const POLL_OPTIONS = [
  { text: 'Yes - Support this bill', order_index: 0 },
  { text: 'No - Oppose this bill', order_index: 1 },
  { text: 'Abstain - No position', order_index: 2 }
];

async function main() {
  console.log('🌱 Seeding constituent-will polls...\n');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Resolve created_by: prefer E2E_ADMIN_EMAIL, fallback to first admin or first user
  let adminUser: { id: string; email?: string } | null = null;

  if (ADMIN_EMAIL) {
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (!authError && authData?.users) {
      adminUser = authData.users.find((u) => u.email === ADMIN_EMAIL) ?? null;
    }
  }

  if (!adminUser) {
    // Fallback: use first user with is_admin from user_profiles, or first auth user
    const { data: admins } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('is_admin', true)
      .limit(1);
    if (admins?.[0]?.user_id) {
      const { data: authData } = await supabase.auth.admin.listUsers();
      adminUser = authData?.users?.find((u) => u.id === admins[0].user_id) ?? null;
    }
    if (!adminUser) {
      const { data: authData } = await supabase.auth.admin.listUsers();
      adminUser = authData?.users?.[0] ?? null;
    }
  }

  if (!adminUser) {
    console.error('✗ No user found. Create a user in Supabase Auth or set E2E_ADMIN_EMAIL to an existing user.');
    process.exit(1);
  }

  console.log(`✓ Using created_by: ${adminUser.email ?? adminUser.id}\n`);

  // Load config
  const configPath = resolve(__dirname, 'seed-polls-config.json');
  let seedConfig: SeedConfig;
  try {
    const raw = readFileSync(configPath, 'utf-8');
    seedConfig = JSON.parse(raw) as SeedConfig;
  } catch (err) {
    console.error('✗ Failed to load seed-polls-config.json:', err);
    process.exit(1);
  }

  const { narrative, polls } = seedConfig;
  console.log(`Narrative: ${narrative}`);
  console.log(`Polls to create: ${polls.length}\n`);

  const createdIds: number[] = [];

  for (const poll of polls) {
    const title = `Should ${poll.representativeName} support the ${poll.billTitle}?`;

    let billSummary: string | null = poll.description || null;
    if (process.env.GOVINFO_API_KEY) {
      try {
        const summary = await govInfoMCPService.getPackageSummary(poll.billId);
        if (summary?.summary) {
          billSummary = summary.summary;
        }
      } catch {
        // Use config description as fallback
      }
    }

    const { data: inserted, error: pollError } = await supabase
      .from('polls')
      .insert({
        title,
        description: poll.description?.trim() || null,
        created_by: adminUser.id,
        status: 'active',
        privacy_level: 'public',
        voting_method: 'single_choice',
        poll_type: 'constituent_will',
        bill_id: poll.billId,
        representative_id: poll.representativeId,
        bill_title: poll.billTitle,
        bill_summary: billSummary,
        total_votes: 0,
        category: 'civics',
        tags: ['constituent-will', 'accountability'],
        hashtags: ['constituent-will', 'accountability'],
        primary_hashtag: 'constituent-will'
      })
      .select('id')
      .single();

    if (pollError || !inserted) {
      console.error(`✗ Failed to create poll for ${poll.representativeName} / ${poll.billTitle}:`, pollError?.message);
      continue;
    }

    const { error: optionsError } = await supabase.from('poll_options').insert(
      POLL_OPTIONS.map((opt) => ({
        poll_id: inserted.id,
        text: opt.text,
        option_text: opt.text,
        order_index: opt.order_index
      }))
    );

    if (optionsError) {
      console.warn(`⚠ Poll ${inserted.id} created but options failed:`, optionsError.message);
    }

    createdIds.push(inserted.id);
    console.log(`✓ Created poll ${inserted.id}: ${title}`);
  }

  console.log(`\n🎉 Done. Created ${createdIds.length} polls: [${createdIds.join(', ')}]`);
}

main().catch((err) => {
  console.error('✗ Unexpected error:', err);
  process.exit(1);
});
