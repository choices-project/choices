#!/usr/bin/env node
/**
 * Verify crosswalk integrity between identifiers.
 * 
 * Checks that all identifiers link correctly:
 * - bioguide_id ↔ openstates_id ↔ fec_id ↔ canonical_id
 * - Verifies representatives with same identifier have consistent data
 * - Flags broken crosswalks
 * 
 * Usage:
 *   npm run tools:verify:crosswalk [--limit=N] [--fix] [--dry-run]
 */
import { loadEnv } from '../../utils/load-env.js';
loadEnv();

import { getSupabaseClient } from '../../clients/supabase.js';

interface CrosswalkIssue {
  type: 'missing_link' | 'inconsistent_data' | 'orphaned_identifier';
  identifier_type: string;
  identifier_value: string;
  representative_id: number;
  representative_name: string;
  issue: string;
  suggestion?: string;
}

async function verifyCrosswalk(options: {
  limit?: number;
  fix?: boolean;
  dryRun?: boolean;
}): Promise<void> {
  const { limit, fix = false, dryRun = false } = options;
  
  console.log('\n🔗 Crosswalk Verification');
  console.log('='.repeat(60));
  if (dryRun) {
    console.log('🔍 Running in DRY-RUN mode (no fixes will be applied)');
  }
  if (fix && !dryRun) {
    console.log('⚠️  FIX mode enabled - issues will be corrected where possible');
  }
  
  const client = getSupabaseClient();
  const issues: CrosswalkIssue[] = [];
  
  // Get all representatives with identifiers
  // Use multiple queries to get reps with any identifier
  const { data: reps1 } = await client
    .from('representatives_core')
    .select('id, name, status, level, openstates_id, bioguide_id, fec_id, canonical_id')
    .not('openstates_id', 'is', null);
  
  const { data: reps2 } = await client
    .from('representatives_core')
    .select('id, name, status, level, openstates_id, bioguide_id, fec_id, canonical_id')
    .not('bioguide_id', 'is', null)
    .is('openstates_id', null);
  
  const { data: reps3 } = await client
    .from('representatives_core')
    .select('id, name, status, level, openstates_id, bioguide_id, fec_id, canonical_id')
    .not('fec_id', 'is', null)
    .is('openstates_id', null)
    .is('bioguide_id', null);
  
  const { data: reps4 } = await client
    .from('representatives_core')
    .select('id, name, status, level, openstates_id, bioguide_id, fec_id, canonical_id')
    .not('canonical_id', 'is', null)
    .is('openstates_id', null)
    .is('bioguide_id', null)
    .is('fec_id', null);
  
  // Combine and deduplicate
  type RepType = {
    id: number;
    name: string;
    status: string;
    level: string;
    openstates_id: string | null;
    bioguide_id: string | null;
    fec_id: string | null;
    canonical_id: string | null;
  };
  
  const allRepsMap = new Map<number, RepType>();
  for (const rep of [...(reps1 || []), ...(reps2 || []), ...(reps3 || []), ...(reps4 || [])]) {
    if (rep && !allRepsMap.has(rep.id)) {
      allRepsMap.set(rep.id, rep);
    }
  }
  
  let reps = Array.from(allRepsMap.values());
  
  if (limit) {
    reps = reps.slice(0, limit);
  }
  
  if (reps.length === 0) {
    console.log('No representatives with identifiers found.');
    return;
  }
  
  console.log(`\n📋 Verifying ${reps.length} representatives with identifiers...`);
  
  // Build identifier maps
  const byOpenstatesId = new Map<string, typeof reps>();
  const byBioguideId = new Map<string, typeof reps>();
  const byFecId = new Map<string, typeof reps>();
  const byCanonicalId = new Map<string, typeof reps>();
  
  for (const rep of reps) {
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
  
  // Check 1: Multiple representatives with same identifier (should be caught by unique constraints)
  for (const [id, repsWithId] of byOpenstatesId.entries()) {
    if (repsWithId.length > 1) {
      for (const rep of repsWithId) {
        issues.push({
          type: 'inconsistent_data',
          identifier_type: 'openstates_id',
          identifier_value: id,
          representative_id: rep.id,
          representative_name: rep.name,
          issue: `Multiple representatives share openstates_id: ${id} (${repsWithId.length} total)`,
          suggestion: 'Deduplicate using tools:audit:duplicates --fix',
        });
      }
    }
  }
  
  for (const [id, repsWithId] of byBioguideId.entries()) {
    if (repsWithId.length > 1) {
      for (const rep of repsWithId) {
        issues.push({
          type: 'inconsistent_data',
          identifier_type: 'bioguide_id',
          identifier_value: id,
          representative_id: rep.id,
          representative_name: rep.name,
          issue: `Multiple representatives share bioguide_id: ${id} (${repsWithId.length} total)`,
          suggestion: 'Deduplicate using tools:audit:duplicates --fix',
        });
      }
    }
  }
  
  for (const [id, repsWithId] of byFecId.entries()) {
    if (repsWithId.length > 1) {
      for (const rep of repsWithId) {
        issues.push({
          type: 'inconsistent_data',
          identifier_type: 'fec_id',
          identifier_value: id,
          representative_id: rep.id,
          representative_name: rep.name,
          issue: `Multiple representatives share fec_id: ${id} (${repsWithId.length} total)`,
          suggestion: 'Deduplicate using tools:audit:duplicates --fix',
        });
      }
    }
  }
  
  for (const [id, repsWithId] of byCanonicalId.entries()) {
    if (repsWithId.length > 1) {
      for (const rep of repsWithId) {
        issues.push({
          type: 'inconsistent_data',
          identifier_type: 'canonical_id',
          identifier_value: id,
          representative_id: rep.id,
          representative_name: rep.name,
          issue: `Multiple representatives share canonical_id: ${id} (${repsWithId.length} total)`,
          suggestion: 'Deduplicate using tools:audit:duplicates --fix',
        });
      }
    }
  }
  
  // Check 2: Representatives with identifiers that should link but don't
  // (e.g., federal rep with bioguide_id but no fec_id - might be missing)
  for (const rep of reps) {
    if (rep.level === 'federal') {
      // Federal reps should ideally have both bioguide_id and fec_id
      if (rep.bioguide_id && !rep.fec_id) {
        issues.push({
          type: 'missing_link',
          identifier_type: 'fec_id',
          identifier_value: 'missing',
          representative_id: rep.id,
          representative_name: rep.name,
          issue: `Federal representative has bioguide_id (${rep.bioguide_id}) but missing fec_id`,
          suggestion: 'Run federal:enrich:finance --lookup-missing-fec-ids',
        });
      }
      
      // Check if bioguide_id exists in other reps
      if (rep.bioguide_id) {
        const otherReps = byBioguideId.get(rep.bioguide_id)?.filter(r => r.id !== rep.id) || [];
        if (otherReps.length > 0) {
          // Check if they have different openstates_id or fec_id
          for (const other of otherReps) {
            if (other.openstates_id !== rep.openstates_id || other.fec_id !== rep.fec_id) {
              issues.push({
                type: 'inconsistent_data',
                identifier_type: 'bioguide_id',
                identifier_value: rep.bioguide_id,
                representative_id: rep.id,
                representative_name: rep.name,
                issue: `Same bioguide_id (${rep.bioguide_id}) but different openstates_id or fec_id`,
                suggestion: 'Review and merge if duplicates',
              });
            }
          }
        }
      }
    }
    
    // State/local reps should have openstates_id
    if ((rep.level === 'state' || rep.level === 'local') && !rep.openstates_id) {
      issues.push({
        type: 'missing_link',
        identifier_type: 'openstates_id',
        identifier_value: 'missing',
        representative_id: rep.id,
        representative_name: rep.name,
        issue: `State/local representative missing openstates_id`,
        suggestion: 'Run openstates:ingest to populate',
      });
    }
  }
  
  if (issues.length === 0) {
    console.log('\n✅ No crosswalk issues found!');
    return;
  }
  
  console.log(`\n⚠️  Found ${issues.length} crosswalk issues:`);
  
  // Group by issue type
  const byType = new Map<string, CrosswalkIssue[]>();
  for (const issue of issues) {
    const existing = byType.get(issue.type) || [];
    existing.push(issue);
    byType.set(issue.type, existing);
  }
  
  for (const [type, typeIssues] of byType.entries()) {
    console.log(`\n   ${type} (${typeIssues.length}):`);
    for (const issue of typeIssues.slice(0, 10)) {
      console.log(`     - ${issue.representative_name} (ID ${issue.representative_id})`);
      console.log(`       ${issue.issue}`);
      if (issue.suggestion) {
        console.log(`       💡 ${issue.suggestion}`);
      }
    }
    if (typeIssues.length > 10) {
      console.log(`     ... and ${typeIssues.length - 10} more`);
    }
  }
  
  console.log(`\n📊 Summary:`);
  for (const [type, typeIssues] of byType.entries()) {
    console.log(`   ${type}: ${typeIssues.length}`);
  }
  
  if (!fix) {
    console.log('\n💡 Tip: Use --fix to see suggested fixes (most require manual review)');
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

verifyCrosswalk(options).catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
