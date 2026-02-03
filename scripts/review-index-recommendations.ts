/**
 * Review Index Recommendations
 *
 * This script queries Supabase for index recommendations from the Index Advisor
 * and helps you review and apply them safely.
 *
 * Usage:
 *   cd web && npx tsx ../scripts/review-index-recommendations.ts
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
import { writeFileSync } from 'fs'
import { join, resolve } from 'path'

// Load environment variables from .env.local in web directory
const envPath = resolve(__dirname, '../web/.env.local')
config({ path: envPath })

async function reviewIndexRecommendations() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials')
    console.error('')
    console.error('Required environment variables:')
    console.error('  NEXT_PUBLIC_SUPABASE_URL')
    console.error('  SUPABASE_SERVICE_ROLE_KEY')
    console.error('')
    console.error(`Expected .env.local at: ${envPath}`)
    process.exit(1)
  }

  console.log('📊 Reviewing Index Recommendations...')
  console.log('')

  try {
    // Query for index recommendations
    // Note: Index Advisor recommendations are typically available via Supabase Dashboard
    // or through pg_stat_statements analysis
    // This script helps you query slow queries that might benefit from indexes

    const slowQueriesSQL = `
      SELECT
        query,
        calls,
        total_exec_time,
        mean_exec_time,
        max_exec_time,
        rows,
        shared_blks_hit,
        shared_blks_read,
        shared_blks_dirtied,
        temp_blks_read,
        temp_blks_written
      FROM pg_stat_statements
      WHERE mean_exec_time > 100  -- Queries taking more than 100ms on average
        AND calls > 10  -- Queries that run frequently
      ORDER BY mean_exec_time DESC
      LIMIT 20;
    `

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        sql: slowQueriesSQL,
      }),
    })

    if (!response.ok) {
      await response.text()
      console.log('⚠️  Could not query pg_stat_statements directly')
      console.log('')
      console.log('💡 Index recommendations are available in Supabase Dashboard:')
      console.log('   https://supabase.com/dashboard/project/muqwrehywjrbaeerjgfb/observability/query-performance')
      console.log('')
      console.log('📝 Manual Review Steps:')
      console.log('   1. Enable Index Advisor in Dashboard')
      console.log('   2. Wait for recommendations (may take a few hours)')
      console.log('   3. Review recommendations in Dashboard')
      console.log('   4. Use this script to generate migration files')
      return
    }

    const data = await response.json()
    console.log('🔍 Found slow queries that might benefit from indexes:')
    console.log('')

    if (data && data.length > 0) {
      data.forEach((query: any, index: number) => {
        console.log(`${index + 1}. Query (${query.calls} calls, avg ${query.mean_exec_time?.toFixed(2)}ms)`)
        console.log(`   ${query.query?.substring(0, 100)}...`)
        console.log('')
      })

      console.log('💡 Recommendations:')
      console.log('   - Review these queries in Supabase Dashboard')
      console.log('   - Check Index Advisor for specific index suggestions')
      console.log('   - Consider indexes on:')
      console.log('     * WHERE clause columns')
      console.log('     * JOIN columns')
      console.log('     * ORDER BY columns')
      console.log('     * GROUP BY columns')
    } else {
      console.log('✅ No slow queries found (or pg_stat_statements not enabled)')
    }

  } catch (error) {
    console.error('❌ Error:', error)
    console.log('')
    console.log('💡 Index recommendations are available in Supabase Dashboard')
  }
}

/**
 * Generate a migration file for index recommendations
 */
export function generateIndexMigration(
  tableName: string,
  columns: string[],
  indexName?: string,
  unique = false,
  concurrent = true
): string {
  const idxName = indexName || `idx_${tableName}_${columns.join('_')}`
  const uniqueModifier = unique ? 'UNIQUE ' : ''
  const concurrentClause = concurrent ? 'CONCURRENTLY' : ''

  return `-- migrate:up
-- Index: ${idxName}
-- Table: ${tableName}
-- Columns: ${columns.join(', ')}
-- Generated: ${new Date().toISOString()}

CREATE ${uniqueModifier}INDEX ${concurrentClause} IF NOT EXISTS ${idxName}
ON public.${tableName}
USING btree (${columns.join(', ')});

-- migrate:down
DROP INDEX IF EXISTS ${idxName};
`
}

/**
 * Create a migration file from index recommendation
 */
export function createIndexMigration(
  recommendation: {
    table: string
    columns: string[]
    indexName?: string
    unique?: boolean
    reason?: string
  }
): string {
  const timestamp = (new Date().toISOString().replace(/[-:]/g, '').split('.')[0] ?? '').replace('T', '')
  const migrationName = `add_index_${recommendation.table}_${recommendation.columns.join('_')}`
  const migrationPath = join(
    __dirname,
    `../supabase/migrations/${timestamp}_${migrationName}.sql`
  )

  const migrationSQL = generateIndexMigration(
    recommendation.table,
    recommendation.columns,
    recommendation.indexName,
    recommendation.unique || false,
    true // Always use CONCURRENTLY for production
  )

  // Add comment with reason if provided
  if (recommendation.reason) {
    const commentedSQL = migrationSQL.replace(
      '-- migrate:up',
      `-- migrate:up\n-- Reason: ${recommendation.reason}`
    )
    writeFileSync(migrationPath, commentedSQL)
  } else {
    writeFileSync(migrationPath, migrationSQL)
  }

  return migrationPath
}

// Run the review
reviewIndexRecommendations().catch(console.error)
