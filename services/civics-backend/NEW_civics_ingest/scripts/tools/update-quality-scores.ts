#!/usr/bin/env node
/**
 * Update data quality scores for all representatives.
 * 
 * Calculates quality scores based on:
 * - Completeness (contacts, photos, social media, finance data)
 * - Freshness (last update date, stale data flags)
 * - Verification status (verified identifiers, cross-references)
 * 
 * Updates the `data_quality_score` column (0-100) in `representatives_core`.
 * 
 * Usage:
 *   npm run tools:update:quality-scores [--limit=N] [--dry-run] [--status=active]
 */
import { loadEnv } from '../../utils/load-env.js';
loadEnv();

import { getSupabaseClient } from '../../clients/supabase.js';

interface RepresentativeData {
  id: number;
  name: string;
  status: string;
  data_quality_score: number;
  verification_status: string | null;
  updated_at: string;
  has_contacts: boolean;
  has_photos: boolean;
  has_social: boolean;
  has_finance: boolean;
  finance_cycle: number | null;
  finance_updated_at: string | null;
  has_openstates_id: boolean;
  has_bioguide_id: boolean;
  has_fec_id: boolean;
  has_canonical_id: boolean;
}

function calculateQualityScore(rep: RepresentativeData): number {
  let score = 0;
  const maxScore = 100;
  
  // Completeness (40 points max)
  let completenessScore = 0;
  if (rep.has_contacts) completenessScore += 10;
  if (rep.has_photos) completenessScore += 10;
  if (rep.has_social) completenessScore += 10;
  if (rep.has_finance) completenessScore += 10;
  score += completenessScore;
  
  // Identifier coverage (30 points max)
  let identifierScore = 0;
  if (rep.has_openstates_id) identifierScore += 7.5;
  if (rep.has_bioguide_id) identifierScore += 7.5;
  if (rep.has_fec_id) identifierScore += 7.5;
  if (rep.has_canonical_id) identifierScore += 7.5;
  score += identifierScore;
  
  // Verification status (10 points max)
  if (rep.verification_status === 'verified') {
    score += 10;
  } else if (rep.verification_status === 'pending') {
    score += 5;
  }
  
  // Freshness (20 points max)
  let freshnessScore = 0;
  if (rep.has_finance && rep.finance_cycle) {
    const currentYear = new Date().getFullYear();
    const cycleYear = rep.finance_cycle;
    
    if (cycleYear >= currentYear) {
      freshnessScore += 20; // Current cycle
    } else if (cycleYear === currentYear - 2) {
      freshnessScore += 15; // Previous cycle (still relevant)
    } else if (cycleYear >= currentYear - 4) {
      freshnessScore += 10; // Older but within 2 cycles
    } else {
      freshnessScore += 5; // Very stale
    }
  } else {
    // No finance data - check last update
    const updatedAt = rep.updated_at ? new Date(rep.updated_at) : null;
    if (updatedAt) {
      const daysSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 30) {
        freshnessScore += 20;
      } else if (daysSinceUpdate < 90) {
        freshnessScore += 15;
      } else if (daysSinceUpdate < 180) {
        freshnessScore += 10;
      } else {
        freshnessScore += 5;
      }
    }
  }
  score += freshnessScore;
  
  return Math.min(Math.round(score), maxScore);
}

async function updateQualityScores(options: {
  limit?: number;
  dryRun?: boolean;
  status?: string;
}): Promise<void> {
  const { limit, dryRun = false, status = 'active' } = options;
  
  console.log('\n📊 Data Quality Score Update');
  console.log('='.repeat(60));
  if (dryRun) {
    console.log('🔍 Running in DRY-RUN mode (no updates will be made)');
  }
  console.log(`Filtering by status: ${status}`);
  if (limit) {
    console.log(`Limiting to ${limit} representatives`);
  }
  
  const client = getSupabaseClient();
  
  // Build query to get all representative data
  let query = client
    .from('representatives_core')
    .select(`
      id,
      name,
      status,
      data_quality_score,
      verification_status,
      updated_at,
      openstates_id,
      bioguide_id,
      fec_id,
      canonical_id
    `)
    .eq('status', status);
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data: reps, error: repsError } = await query;
  
  if (repsError) {
    throw new Error(`Failed to fetch representatives: ${repsError.message}`);
  }
  
  if (!reps || reps.length === 0) {
    console.log('No representatives found.');
    return;
  }
  
  console.log(`\n📋 Processing ${reps.length} representatives...`);
  
  // Fetch related data for each representative
  const repsWithData: RepresentativeData[] = [];
  
  for (const rep of reps) {
    const repId = rep.id;
    
    // Check for contacts
    const { count: contactsCount } = await client
      .from('representative_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('representative_id', repId);
    
    // Check for photos
    const { count: photosCount } = await client
      .from('representative_photos')
      .select('*', { count: 'exact', head: true })
      .eq('representative_id', repId);
    
    // Check for social media
    const { count: socialCount } = await client
      .from('representative_social_media')
      .select('*', { count: 'exact', head: true })
      .eq('representative_id', repId);
    
    // Check for finance data
    const { data: financeData } = await client
      .from('representative_campaign_finance')
      .select('cycle, updated_at')
      .eq('representative_id', repId)
      .order('cycle', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    repsWithData.push({
      id: repId,
      name: rep.name,
      status: rep.status,
      data_quality_score: rep.data_quality_score ?? 0,
      verification_status: rep.verification_status,
      updated_at: rep.updated_at,
      has_contacts: (contactsCount ?? 0) > 0,
      has_photos: (photosCount ?? 0) > 0,
      has_social: (socialCount ?? 0) > 0,
      has_finance: !!financeData,
      finance_cycle: financeData?.cycle ?? null,
      finance_updated_at: financeData?.updated_at ?? null,
      has_openstates_id: !!rep.openstates_id,
      has_bioguide_id: !!rep.bioguide_id,
      has_fec_id: !!rep.fec_id,
      has_canonical_id: !!rep.canonical_id,
    });
  }
  
  // Calculate and update scores
  let updated = 0;
  let unchanged = 0;
  let improved = 0;
  const improvements: Array<{ name: string; old: number; new: number }> = [];
  
  for (const rep of repsWithData) {
    const newScore = calculateQualityScore(rep);
    const oldScore = rep.data_quality_score;
    
    if (newScore !== oldScore) {
      if (!dryRun) {
        const { error: updateError } = await client
          .from('representatives_core')
          .update({ data_quality_score: newScore })
          .eq('id', rep.id);
        
        if (updateError) {
          console.warn(`⚠️  Failed to update ${rep.name}: ${updateError.message}`);
          continue;
        }
      }
      
      updated++;
      if (newScore > oldScore) {
        improved++;
        improvements.push({ name: rep.name, old: oldScore, new: newScore });
      }
      
      if (updated <= 10 || newScore > oldScore) {
        console.log(
          `   ${newScore > oldScore ? '📈' : '📉'} ${rep.name}: ${oldScore} → ${newScore}`,
        );
      }
    } else {
      unchanged++;
    }
  }
  
  console.log('\n✅ Update complete!');
  console.log(`   Updated: ${updated}`);
  console.log(`   Improved: ${improved}`);
  console.log(`   Unchanged: ${unchanged}`);
  
  if (improvements.length > 0 && improvements.length <= 20) {
    console.log('\n📈 Top improvements:');
    improvements
      .sort((a, b) => b.new - b.old - (a.new - a.old))
      .slice(0, 10)
      .forEach((imp) => {
        console.log(`   ${imp.name}: ${imp.old} → ${imp.new} (+${imp.new - imp.old})`);
      });
  }
}

// CLI
const args = process.argv.slice(2);
const options: {
  limit?: number;
  dryRun?: boolean;
  status?: string;
} = {};

for (const arg of args) {
  if (arg.startsWith('--limit=')) {
    options.limit = parseInt(arg.split('=')[1], 10);
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  } else if (arg.startsWith('--status=')) {
    options.status = arg.split('=')[1];
  }
}

updateQualityScores(options).catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
