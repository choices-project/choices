#!/usr/bin/env node
/**
 * Validate term dates for representatives.
 * 
 * Checks:
 * - term_end_date >= term_start_date (enforced by check constraint)
 * - next_election_date >= CURRENT_DATE (enforced by check constraint)
 * - Missing term dates for active representatives
 * - Inconsistent term dates (e.g., term ended but still active)
 * 
 * Usage:
 *   npm run tools:validate:term-dates [--limit=N] [--fix] [--dry-run]
 */
import { loadEnv } from '../../utils/load-env.js';
loadEnv();

import { getSupabaseClient } from '../../clients/supabase.js';

interface TermDateIssue {
  id: number;
  name: string;
  status: string;
  issue: string;
  term_start_date: string | null;
  term_end_date: string | null;
  next_election_date: string | null;
  level: string;
  office: string | null;
}

async function validateTermDates(options: {
  limit?: number;
  fix?: boolean;
  dryRun?: boolean;
}): Promise<void> {
  const { limit, fix = false, dryRun = false } = options;
  
  console.log('\n📅 Term Date Validation');
  console.log('='.repeat(60));
  if (dryRun) {
    console.log('🔍 Running in DRY-RUN mode (no fixes will be applied)');
  }
  if (fix && !dryRun) {
    console.log('⚠️  FIX mode enabled - issues will be corrected where possible');
  }
  
  const client = getSupabaseClient();
  const issues: TermDateIssue[] = [];
  
  // Get all representatives
  let query = client
    .from('representatives_core')
    .select('id, name, status, level, office, term_start_date, term_end_date, next_election_date');
  
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
  
  console.log(`\n📋 Validating ${reps.length} representatives...`);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (const rep of reps) {
    const termStart = rep.term_start_date ? new Date(rep.term_start_date) : null;
    const termEnd = rep.term_end_date ? new Date(rep.term_end_date) : null;
    const nextElection = rep.next_election_date ? new Date(rep.next_election_date) : null;
    
    // Check 1: Missing term dates for active representatives
    if (rep.status === 'active' && !termStart && !termEnd) {
      issues.push({
        id: rep.id,
        name: rep.name,
        status: rep.status,
        issue: 'Missing term dates for active representative',
        term_start_date: rep.term_start_date,
        term_end_date: rep.term_end_date,
        next_election_date: rep.next_election_date,
        level: rep.level,
        office: rep.office,
      });
    }
    
    // Check 2: Term ended but still active
    if (rep.status === 'active' && termEnd && termEnd < today) {
      issues.push({
        id: rep.id,
        name: rep.name,
        status: rep.status,
        issue: `Term ended ${termEnd.toISOString().split('T')[0]} but status is still active`,
        term_start_date: rep.term_start_date,
        term_end_date: rep.term_end_date,
        next_election_date: rep.next_election_date,
        level: rep.level,
        office: rep.office,
      });
      
      if (fix && !dryRun) {
        console.log(`   🔧 Fixing: Marking ${rep.name} as historical (term ended)`);
        const { error } = await client
          .from('representatives_core')
          .update({
            status: 'historical',
            status_reason: `Term ended on ${rep.term_end_date}`,
            status_changed_at: new Date().toISOString(),
          })
          .eq('id', rep.id);
        
        if (error) {
          console.warn(`     ⚠️  Failed: ${error.message}`);
        } else {
          console.log(`     ✅ Updated`);
        }
      }
    }
    
    // Check 3: Missing next_election_date for active representatives
    if (rep.status === 'active' && !nextElection && rep.level === 'federal') {
      issues.push({
        id: rep.id,
        name: rep.name,
        status: rep.status,
        issue: 'Missing next_election_date for active federal representative',
        term_start_date: rep.term_start_date,
        term_end_date: rep.term_end_date,
        next_election_date: rep.next_election_date,
        level: rep.level,
        office: rep.office,
      });
    }
    
    // Check 4: next_election_date in the past
    if (nextElection && nextElection < today && rep.status === 'active') {
      issues.push({
        id: rep.id,
        name: rep.name,
        status: rep.status,
        issue: `next_election_date ${rep.next_election_date} is in the past`,
        term_start_date: rep.term_start_date,
        term_end_date: rep.term_end_date,
        next_election_date: rep.next_election_date,
        level: rep.level,
        office: rep.office,
      });
    }
    
    // Check 5: term_start_date after term_end_date (should be caught by constraint, but check anyway)
    if (termStart && termEnd && termStart > termEnd) {
      issues.push({
        id: rep.id,
        name: rep.name,
        status: rep.status,
        issue: `term_start_date (${rep.term_start_date}) is after term_end_date (${rep.term_end_date})`,
        term_start_date: rep.term_start_date,
        term_end_date: rep.term_end_date,
        next_election_date: rep.next_election_date,
        level: rep.level,
        office: rep.office,
      });
    }
  }
  
  if (issues.length === 0) {
    console.log('\n✅ No term date issues found!');
    return;
  }
  
  console.log(`\n⚠️  Found ${issues.length} term date issues:`);
  
  // Group by issue type
  const byIssue = new Map<string, TermDateIssue[]>();
  for (const issue of issues) {
    const existing = byIssue.get(issue.issue) || [];
    existing.push(issue);
    byIssue.set(issue.issue, existing);
  }
  
  for (const [issueType, issueList] of byIssue.entries()) {
    console.log(`\n   ${issueType} (${issueList.length}):`);
    for (const issue of issueList.slice(0, 10)) {
      console.log(`     - ${issue.name} (ID ${issue.id}): ${issue.level} ${issue.office || 'N/A'}`);
      console.log(`       Term: ${issue.term_start_date || 'N/A'} to ${issue.term_end_date || 'N/A'}`);
      console.log(`       Next election: ${issue.next_election_date || 'N/A'}`);
    }
    if (issueList.length > 10) {
      console.log(`     ... and ${issueList.length - 10} more`);
    }
  }
  
  console.log(`\n📊 Summary:`);
  for (const [issueType, issueList] of byIssue.entries()) {
    console.log(`   ${issueType}: ${issueList.length}`);
  }
  
  if (!fix) {
    console.log('\n💡 Tip: Use --fix to automatically correct issues where possible');
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

validateTermDates(options).catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
