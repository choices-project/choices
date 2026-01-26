#!/usr/bin/env node
/**
 * Check OpenStates API enrichment status.
 * 
 * Usage:
 *   npm run tools:check:openstates-status
 */
import 'dotenv/config';

import { getSupabaseClient } from '../clients/supabase.js';
import { getOpenStatesUsageStats } from '../clients/openstates.js';

async function main() {
  const client = getSupabaseClient();

  console.log('\n📊 OpenStates API Enrichment Status');
  console.log('='.repeat(60));

  // API Usage Stats
  const apiStats = getOpenStatesUsageStats();
  console.log(`\n🔌 API Usage:`);
  console.log(`   Requests today: ${apiStats.dailyRequests}/${apiStats.dailyLimit}`);
  console.log(`   Remaining: ${apiStats.remaining}`);
  console.log(`   Reset at: ${apiStats.resetAt.toLocaleString()}`);
  if (apiStats.consecutive429Errors > 0) {
    console.log(`   ⚠️  Consecutive 429 errors: ${apiStats.consecutive429Errors}`);
  }

  // State/Local representatives
  const { count: totalStateLocal, error: totalError } = await client
    .from('representatives_core')
    .select('*', { count: 'exact', head: true })
    .in('level', ['state', 'local'])
    .eq('status', 'active');

  if (totalError) {
    console.error('Error fetching state/local reps:', totalError.message);
    return;
  }

  // Representatives with OpenStates ID
  const { count: withOpenStatesId, error: osError } = await client
    .from('representatives_core')
    .select('*', { count: 'exact', head: true })
    .in('level', ['state', 'local'])
    .eq('status', 'active')
    .not('openstates_id', 'is', null);

  if (osError) {
    console.error('Error fetching reps with OpenStates ID:', osError.message);
    return;
  }

  // Representatives with activity (bills)
  const { count: withActivity, error: activityError } = await client
    .from('representative_activity')
    .select('representative_id', { count: 'exact', head: true })
    .eq('type', 'bill')
    .eq('source', 'openstates');

  if (activityError) {
    console.error('Error fetching activity:', activityError.message);
    return;
  }

  // Representatives with events
  const { count: withEvents } = await client
    .from('representative_activity')
    .select('representative_id', { count: 'exact', head: true })
    .eq('type', 'event')
    .eq('source', 'openstates');

  // Representatives with committees
  const { count: withCommittees } = await client
    .from('representative_committees')
    .select('representative_id', { count: 'exact', head: true })
    .eq('is_current', true);

  console.log(`\n📈 Coverage (State/Local Representatives):`);
  console.log(`   Total state/local: ${totalStateLocal ?? 0}`);
  console.log(`   With OpenStates ID: ${withOpenStatesId ?? 0} (${totalStateLocal ? Math.round(((withOpenStatesId ?? 0) / totalStateLocal) * 100) : 0}%)`);
  console.log(`   With bill activity: ${withActivity ?? 0} (${totalStateLocal ? Math.round(((withActivity ?? 0) / totalStateLocal) * 100) : 0}%)`);
  console.log(`   With events: ${withEvents ?? 0} (${totalStateLocal ? Math.round(((withEvents ?? 0) / totalStateLocal) * 100) : 0}%)`);
  console.log(`   With committees: ${withCommittees ?? 0} (${totalStateLocal ? Math.round(((withCommittees ?? 0) / totalStateLocal) * 100) : 0}%)`);

  const missingActivity = (totalStateLocal ?? 0) - (withActivity ?? 0);
  const missingEvents = (totalStateLocal ?? 0) - (withEvents ?? 0);
  const missingCommittees = (totalStateLocal ?? 0) - (withCommittees ?? 0);

  if (missingActivity > 0) {
    console.log(`\n⚠️  Missing bill activity: ${missingActivity}`);
    console.log(`   Run: npm run openstates:sync:activity`);
  }

  if (missingEvents > 0) {
    console.log(`\n⚠️  Missing events: ${missingEvents}`);
    console.log(`   Run: npm run openstates:sync:events`);
  }

  if (missingCommittees > 0) {
    console.log(`\n⚠️  Missing committees: ${missingCommittees}`);
    console.log(`   Run: npm run openstates:sync:committees`);
  }

  // Recent activity
  const { data: recentActivity, error: recentError } = await client
    .from('representative_activity')
    .select('representative_id, type, title, date, source')
    .eq('source', 'openstates')
    .order('created_at', { ascending: false })
    .limit(10);

  if (!recentError && recentActivity && recentActivity.length > 0) {
    console.log(`\n📅 Recent OpenStates API updates (last 10):`);
    for (const activity of recentActivity) {
      const { data: rep } = await client
        .from('representatives_core')
        .select('name, openstates_id')
        .eq('id', activity.representative_id)
        .single();
      
      if (rep) {
        const date = activity.date ? new Date(activity.date).toLocaleDateString() : 'unknown';
        console.log(`   ${rep.name} - ${activity.type}: ${activity.title?.substring(0, 50)}... (${date})`);
      }
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

main().catch((error) => {
  console.error('Status check failed:', error);
  process.exit(1);
});
