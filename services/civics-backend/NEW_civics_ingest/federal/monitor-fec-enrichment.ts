#!/usr/bin/env node
/**
 * Monitor FEC enrichment progress and detect rate limits.
 * 
 * Usage:
 *   npm run build && node build/scripts/tools/monitor-fec-enrichment.js
 */
import 'dotenv/config';

import { getSupabaseClient } from '../clients/supabase.js';

async function monitorProgress() {
  const client = getSupabaseClient();
  
  console.log('📊 FEC Enrichment Progress Monitor');
  console.log('='.repeat(50));
  console.log('');
  
  // Check FEC ID coverage
  const { data: fecCoverage, error: fecError } = await client
    .from('representatives_core')
    .select('id, fec_id')
    .eq('level', 'federal')
    .eq('status', 'active');
  
  if (fecError) {
    console.error('❌ Error checking FEC ID coverage:', fecError.message);
    return;
  }
  
  const total = fecCoverage?.length ?? 0;
  const withFecId = fecCoverage?.filter((r) => r.fec_id)?.length ?? 0;
  const missingFecId = total - withFecId;
  const coveragePercent = total > 0 ? Math.round((withFecId / total) * 100) : 0;
  
  console.log('🔍 FEC ID Coverage:');
  console.log(`   Total: ${total}`);
  console.log(`   With FEC ID: ${withFecId} (${coveragePercent}%)`);
  console.log(`   Missing: ${missingFecId}`);
  console.log('');
  
  // Check finance records
  const { data: financeData, error: financeError } = await client
    .from('representative_campaign_finance')
    .select('representative_id, cycle, total_raised, updated_at')
    .order('updated_at', { ascending: false })
    .limit(100);
  
  if (!financeError && financeData) {
    const byCycle = new Map<number, number>();
    const withTotals = new Map<number, number>();
    const recentUpdates = financeData.filter((f) => {
      if (!f.updated_at) return false;
      const updated = new Date(f.updated_at);
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      return updated.getTime() > fiveMinutesAgo;
    });
    
    financeData.forEach((f) => {
      const cycle = f.cycle ?? 0;
      byCycle.set(cycle, (byCycle.get(cycle) ?? 0) + 1);
      if (f.total_raised != null) {
        withTotals.set(cycle, (withTotals.get(cycle) ?? 0) + 1);
      }
    });
    
    console.log('💰 Finance Records:');
    console.log(`   Total records: ${financeData.length}`);
    console.log(`   Updated in last 5 minutes: ${recentUpdates.length}`);
    
    byCycle.forEach((count, cycle) => {
      const withData = withTotals.get(cycle) ?? 0;
      console.log(`   Cycle ${cycle}: ${count} records (${withData} with totals)`);
    });
    console.log('');
  }
  
  // Check for rate limit indicators (recent errors or rate-limited status)
  const { data: recentErrors, error: errorCheckError } = await client
    .from('representative_campaign_finance')
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1);
  
  if (!errorCheckError && recentErrors && recentErrors.length > 0) {
    const lastUpdate = recentErrors[0]?.updated_at;
    if (lastUpdate) {
      const lastUpdateTime = new Date(lastUpdate);
      const minutesAgo = Math.floor((Date.now() - lastUpdateTime.getTime()) / 1000 / 60);
      console.log('⏱️  Last Update:');
      console.log(`   ${minutesAgo} minutes ago`);
      if (minutesAgo > 10) {
        console.log('   ⚠️  No updates in 10+ minutes - may have hit rate limit');
      }
    }
  }
  
  // Estimate progress
  const targetFecIds = total; // We want FEC IDs for all
  const remaining = missingFecId;
  const progress = withFecId;
  const progressPercent = total > 0 ? Math.round((progress / targetFecIds) * 100) : 0;
  
  console.log('📈 Progress:');
  console.log(`   FEC IDs: ${progress}/${targetFecIds} (${progressPercent}%)`);
  console.log(`   Remaining: ${remaining}`);
  
  if (remaining > 0) {
    const estimatedRuns = Math.ceil(remaining / 50); // 50 per run
    console.log(`   Estimated runs needed: ${estimatedRuns} (50 per run)`);
  }
  
  console.log('');
  console.log('💡 To check live log:');
  console.log('   tail -f /tmp/fec-enrichment.log');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  monitorProgress().catch((error) => {
    console.error('Monitor failed:', error);
    process.exit(1);
  });
}
