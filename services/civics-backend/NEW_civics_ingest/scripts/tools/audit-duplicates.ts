#!/usr/bin/env node
/**
 * Audit for potential duplicate representatives.
 * 
 * Uses existing unique constraints on identifiers to detect duplicates:
 * - openstates_id (unique partial index)
 * - bioguide_id (unique partial index, federal only)
 * - canonical_id (unique partial index)
 * 
 * Also checks for name similarity + state/office matches.
 * 
 * Usage:
 *   npm run tools:audit:duplicates [--limit=N] [--fix] [--dry-run]
 */
import { loadEnv } from '../../utils/load-env.js';
loadEnv();

import { getSupabaseClient } from '../../clients/supabase.js';

interface DuplicateGroup {
  identifier: string;
  identifierType: 'openstates_id' | 'bioguide_id' | 'fec_id' | 'canonical_id';
  representatives: Array<{
    id: number;
    name: string;
    state: string | null;
    office: string | null;
    level: string;
    status: string;
  }>;
}

async function findDuplicateIdentifiers(): Promise<DuplicateGroup[]> {
  const client = getSupabaseClient();
  const duplicates: DuplicateGroup[] = [];
  
  // Query all representatives with identifiers
  const { data: allReps } = await client
    .from('representatives_core')
    .select('id, name, state, office, level, status, openstates_id, bioguide_id, fec_id, canonical_id')
    .not('openstates_id', 'is', null);
  
  if (!allReps) return [];
  
  // Group by identifier
  const byOpenstatesId = new Map<string, typeof allReps>();
  const byBioguideId = new Map<string, typeof allReps>();
  const byFecId = new Map<string, typeof allReps>();
  const byCanonicalId = new Map<string, typeof allReps>();
  
  for (const rep of allReps) {
    if (rep.openstates_id) {
      const existing = byOpenstatesId.get(rep.openstates_id) || [];
      existing.push(rep);
      byOpenstatesId.set(rep.openstates_id, existing);
    }
    if (rep.bioguide_id) {
      const existing = byBioguideId.get(rep.bioguide_id) || [];
      existing.push(rep);
      byBioguideId.set(rep.bioguide_id, existing);
    }
    if (rep.fec_id) {
      const existing = byFecId.get(rep.fec_id) || [];
      existing.push(rep);
      byFecId.set(rep.fec_id, existing);
    }
    if (rep.canonical_id) {
      const existing = byCanonicalId.get(rep.canonical_id) || [];
      existing.push(rep);
      byCanonicalId.set(rep.canonical_id, existing);
    }
  }
  
  // Find duplicates (more than 1 rep with same identifier)
  for (const [id, reps] of byOpenstatesId.entries()) {
    if (reps.length > 1) {
      duplicates.push({
        identifier: id,
        identifierType: 'openstates_id',
        representatives: reps.map(r => ({
          id: r.id,
          name: r.name,
          state: r.state,
          office: r.office,
          level: r.level,
          status: r.status,
        })),
      });
    }
  }
  
  for (const [id, reps] of byBioguideId.entries()) {
    if (reps.length > 1) {
      duplicates.push({
        identifier: id,
        identifierType: 'bioguide_id',
        representatives: reps.map(r => ({
          id: r.id,
          name: r.name,
          state: r.state,
          office: r.office,
          level: r.level,
          status: r.status,
        })),
      });
    }
  }
  
  for (const [id, reps] of byFecId.entries()) {
    if (reps.length > 1) {
      duplicates.push({
        identifier: id,
        identifierType: 'fec_id',
        representatives: reps.map(r => ({
          id: r.id,
          name: r.name,
          state: r.state,
          office: r.office,
          level: r.level,
          status: r.status,
        })),
      });
    }
  }
  
  for (const [id, reps] of byCanonicalId.entries()) {
    if (reps.length > 1) {
      duplicates.push({
        identifier: id,
        identifierType: 'canonical_id',
        representatives: reps.map(r => ({
          id: r.id,
          name: r.name,
          state: r.state,
          office: r.office,
          level: r.level,
          status: r.status,
        })),
      });
    }
  }
  
  return duplicates;
}

async function findNameSimilarityDuplicates(): Promise<DuplicateGroup[]> {
  const client = getSupabaseClient();
  const duplicates: DuplicateGroup[] = [];
  
  // Get all active representatives
  const { data: allReps } = await client
    .from('representatives_core')
    .select('id, name, state, office, level, status')
    .eq('status', 'active');
  
  if (!allReps) return [];
  
  // Simple name similarity check (same last name + same state + same office)
  const nameGroups = new Map<string, typeof allReps>();
  
  for (const rep of allReps) {
    // Extract last name (assume "Last, First" or "First Last" format)
    const lastName = rep.name.includes(',')
      ? rep.name.split(',')[0].trim().toLowerCase()
      : rep.name.split(' ').pop()?.toLowerCase() || '';
    
    if (!lastName || !rep.state) continue;
    
    const key = `${lastName}|${rep.state}|${rep.office || ''}`;
    const existing = nameGroups.get(key) || [];
    existing.push(rep);
    nameGroups.set(key, existing);
  }
  
  // Find groups with multiple reps (potential duplicates)
  for (const [key, reps] of nameGroups.entries()) {
    if (reps.length > 1) {
      const [lastName] = key.split('|');
      duplicates.push({
        identifier: `name:${lastName}`,
        identifierType: 'canonical_id', // Use as placeholder
        representatives: reps.map(r => ({
          id: r.id,
          name: r.name,
          state: r.state,
          office: r.office,
          level: r.level,
          status: r.status,
        })),
      });
    }
  }
  
  return duplicates;
}

async function auditDuplicates(options: {
  limit?: number;
  fix?: boolean;
  dryRun?: boolean;
}): Promise<void> {
  const { limit, fix = false, dryRun = false } = options;
  
  console.log('\n🔍 Duplicate Representative Audit');
  console.log('='.repeat(60));
  if (dryRun) {
    console.log('🔍 Running in DRY-RUN mode (no fixes will be applied)');
  }
  if (fix && !dryRun) {
    console.log('⚠️  FIX mode enabled - duplicates will be merged');
  }
  
  // Find duplicates by identifier
  console.log('\n📋 Checking for duplicate identifiers...');
  const identifierDups = await findDuplicateIdentifiers();
  
  // Find duplicates by name similarity
  console.log('📋 Checking for name similarity duplicates...');
  const nameDups = await findNameSimilarityDuplicates();
  
  const allDups = [...identifierDups, ...nameDups];
  
  if (limit) {
    allDups.splice(limit);
  }
  
  if (allDups.length === 0) {
    console.log('\n✅ No duplicates found!');
    return;
  }
  
  console.log(`\n⚠️  Found ${allDups.length} potential duplicate groups:`);
  
  for (const group of allDups) {
    console.log(`\n   ${group.identifierType}: ${group.identifier}`);
    console.log(`   Representatives (${group.representatives.length}):`);
    for (const rep of group.representatives) {
      console.log(`     - ID ${rep.id}: ${rep.name} (${rep.state}, ${rep.office || 'N/A'}, ${rep.level}, ${rep.status})`);
    }
    
    if (fix && !dryRun && group.representatives.length > 1) {
      // Keep the first active rep, mark others as historical
      const activeReps = group.representatives.filter(r => r.status === 'active');
      const primaryRep = activeReps[0] || group.representatives[0];
      const duplicateReps = group.representatives.filter(r => r.id !== primaryRep.id);
      
      console.log(`   🔧 Merging: Keeping ${primaryRep.id}, marking others as historical`);
      
      const client = getSupabaseClient();
      for (const dup of duplicateReps) {
        const { error } = await client
          .from('representatives_core')
          .update({
            status: 'historical',
            replaced_by_id: primaryRep.id,
            status_reason: `Duplicate detected: same ${group.identifierType} as ${primaryRep.id}`,
            status_changed_at: new Date().toISOString(),
          })
          .eq('id', dup.id);
        
        if (error) {
          console.warn(`     ⚠️  Failed to update ${dup.id}: ${error.message}`);
        } else {
          console.log(`     ✅ Updated ${dup.id}`);
        }
      }
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Identifier duplicates: ${identifierDups.length}`);
  console.log(`   Name similarity duplicates: ${nameDups.length}`);
  console.log(`   Total groups: ${allDups.length}`);
  
  if (!fix) {
    console.log('\n💡 Tip: Use --fix to automatically merge duplicates');
  }
}

// CLI
const args = process.argv.slice(2);
const options: {
  limit?: number;
  fix?: boolean;
  dryRun?: boolean;
} = {};

for (const arg of args) {
  if (arg.startsWith('--limit=')) {
    options.limit = parseInt(arg.split('=')[1], 10);
  } else if (arg === '--fix') {
    options.fix = true;
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  }
}

auditDuplicates(options).catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
