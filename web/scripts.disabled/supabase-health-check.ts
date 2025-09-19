#!/usr/bin/env tsx
/**
 * Supabase Health Check Script
 * 
 * Validates that all civics tables have RLS enabled and proper policies.
 * Fails CI if any security or performance issues are detected.
 * 
 * Usage:
 *   npm run db:health-check
 *   tsx scripts/supabase-health-check.ts
 * 
 * Environment Variables:
 *   SUPABASE_DB_URL - Full database connection string
 * 
 * Created: 2025-01-17
 */

import 'dotenv/config';
import { Client } from 'pg';

const HEALTH_CHECK_SQL = `
-- Check for missing RLS on civics tables
select 'rls_missing' as issue, tablename
from pg_tables t
left join pg_policies p on p.schemaname=t.schemaname and p.tablename=t.tablename
where t.schemaname='public' and t.tablename like 'civics_%' and not t.rowsecurity

union all

-- Check for missing public select policies
select 'no_public_select_policy', tablename
from (
  select t.tablename, bool_or(p.cmd='SELECT' and p.roles::text like '%anon%') as has_public
  from pg_tables t
  left join pg_policies p on p.schemaname=t.schemaname and p.tablename=t.tablename
  where t.schemaname='public' and t.tablename like 'civics_%'
  group by t.tablename
) s where not has_public

union all

-- Check for slow queries (if pg_stat_statements is available)
select 'slow_query', left(query, 100) as tablename
from pg_stat_statements
where mean_time > 5000  -- >5 seconds
  and calls > 0
limit 5;
`;

interface HealthIssue {
  issue: string;
  tablename: string;
}

async function main() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  
  if (!dbUrl) {
    console.error('❌ SUPABASE_DB_URL environment variable is required');
    console.error('   Set it to your full database connection string');
    process.exit(1);
  }

  console.log('🔍 Running Supabase health check...');
  
  const client = new Client({ connectionString: dbUrl });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const { rows } = await client.query(HEALTH_CHECK_SQL);
    
    if (rows.length === 0) {
      console.log('✅ Database health check passed!');
      console.log('   - All civics tables have RLS enabled');
      console.log('   - All tables have proper public select policies');
      console.log('   - No slow queries detected');
      process.exit(0);
    }
    
    // Group issues by type
    const issuesByType = rows.reduce((acc, row: HealthIssue) => {
      if (!acc[row.issue]) acc[row.issue] = [];
      acc[row.issue].push(row.tablename);
      return acc;
    }, {} as Record<string, string[]>);
    
    console.error('❌ Database health check failed!');
    console.error('');
    
    for (const [issueType, tables] of Object.entries(issuesByType)) {
      console.error(`🔴 ${issueType.toUpperCase()}:`);
      (tables as string[]).forEach(table => console.error(`   - ${table}`));
      console.error('');
    }
    
    // Provide remediation guidance
    if (issuesByType.rls_missing) {
      console.error('💡 To fix RLS issues, run:');
      console.error('   web/database/security/10_civics_rls_enable.sql');
    }
    
    if (issuesByType.no_public_select_policy) {
      console.error('💡 To fix policy issues, run:');
      console.error('   web/database/security/10_civics_rls_enable.sql');
    }
    
    if (issuesByType.slow_query) {
      console.error('💡 To fix slow queries, run:');
      console.error('   web/database/performance/21_catalog_cache.sql');
    }
    
    process.exit(1);
    
  } catch (error) {
    console.error('❌ Health check failed with error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
