#!/usr/bin/env node
/**
 * Check FEC enrichment status and coverage.
 * 
 * Usage:
 *   npm run tools:check:fec-status
 */
import { loadEnv } from '../utils/load-env.js';
loadEnv();

import { getSupabaseClient } from '../clients/supabase.js';

async function main() {
  const client = getSupabaseClient();

  console.log('\n📊 FEC Enrichment Status');
  console.log('='.repeat(60));

  // Total federal representatives
  const { count: totalFederal, error: totalError } = await client
    .from('representatives_core')
    .select('*', { count: 'exact', head: true })
    .eq('level', 'federal')
    .eq('status', 'active');

  if (totalError) {
    console.error('Error fetching total federal reps:', totalError.message);
    return;
  }

  // Representatives with FEC IDs
  const { count: withFecId, error: fecError } = await client
    .from('representatives_core')
    .select('*', { count: 'exact', head: true })
    .eq('level', 'federal')
    .eq('status', 'active')
    .not('fec_id', 'is', null);

  if (fecError) {
    console.error('Error fetching reps with FEC IDs:', fecError.message);
    return;
  }

  // Representatives with finance data
  const { count: withFinance, error: financeError } = await client
    .from('representative_campaign_finance')
    .select('representative_id', { count: 'exact', head: true });

  if (financeError) {
    console.error('Error fetching finance data:', financeError.message);
    return;
  }

  // Representatives with recent finance data (2024 or 2026 cycle)
  const { data: recentFinance } = await client
    .from('representative_campaign_finance')
    .select('representative_id, cycle, updated_at')
    .in('cycle', [2024, 2026])
    .order('updated_at', { ascending: false })
    .limit(10);

  console.log(`\n📈 Coverage:`);
  console.log(`   Total federal representatives: ${totalFederal ?? 0}`);
  console.log(`   With FEC ID: ${withFecId ?? 0} (${totalFederal ? Math.round(((withFecId ?? 0) / totalFederal) * 100) : 0}%)`);
  console.log(`   With finance data: ${withFinance ?? 0} (${totalFederal ? Math.round(((withFinance ?? 0) / totalFederal) * 100) : 0}%)`);

  const missingFecId = (totalFederal ?? 0) - (withFecId ?? 0);
  const missingFinance = (totalFederal ?? 0) - (withFinance ?? 0);

  if (missingFecId > 0) {
    console.log(`\n⚠️  Missing FEC IDs: ${missingFecId}`);
    console.log(`   Run: npm run federal:enrich:finance -- --lookup-missing-fec-ids`);
  }

  if (missingFinance > 0) {
    console.log(`\n⚠️  Missing finance data: ${missingFinance}`);
    console.log(`   Run: npm run federal:enrich:finance`);
  }

  if (recentFinance && recentFinance.length > 0) {
    console.log(`\n📅 Recent finance updates (last 10):`);
    for (const finance of recentFinance) {
      const { data: rep } = await client
        .from('representatives_core')
        .select('name, fec_id')
        .eq('id', finance.representative_id)
        .single();
      
      if (rep) {
        const updated = finance.updated_at ? new Date(finance.updated_at).toLocaleDateString() : 'unknown';
        console.log(`   ${rep.name} (${rep.fec_id || 'no FEC ID'}) - Cycle ${finance.cycle}, updated ${updated}`);
      }
    }
  }

  // Check for stale data (older than 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { count: staleCount, error: staleError } = await client
    .from('representative_campaign_finance')
    .select('*', { count: 'exact', head: true })
    .lt('updated_at', thirtyDaysAgo.toISOString());

  if (!staleError && staleCount && staleCount > 0) {
    console.log(`\n🕐 Stale data (>30 days old): ${staleCount}`);
    console.log(`   Run: npm run federal:enrich:finance -- --stale-days=30`);
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

main().catch((error) => {
  console.error('Status check failed:', error);
  process.exit(1);
});
