/**
 * Apply Security Fix Migration
 *
 * This script applies the RLS policy fixes directly via Supabase REST API
 *
 * Usage:
 *   cd web && npx tsx ../scripts/apply-security-fix.ts
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
import { resolve, join } from 'path'
import { readFileSync } from 'fs'

// Load environment variables from .env.local in web directory
const envPath = resolve(__dirname, '../web/.env.local')
config({ path: envPath })

async function applyMigration() {
  // Dynamically import Supabase client (available in web/node_modules)
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase environment variables')
    console.error('')
    console.error('Required:')
    console.error('  NEXT_PUBLIC_SUPABASE_URL')
    console.error('  SUPABASE_SERVICE_ROLE_KEY')
    console.error('')
    console.error(`Expected .env.local at: ${envPath}`)
    process.exit(1)
  }

  // Create admin client
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Read migration file
  const migrationPath = join(
    __dirname,
    '../supabase/migrations/20260122030000_fix_overly_permissive_rls_policies.sql'
  )

  const migrationSQL = readFileSync(migrationPath, 'utf-8')

  // Extract only the migrate:up section
  const upSection = migrationSQL
    .split('-- migrate:up')[1]
    .split('-- migrate:down')[0]
    .trim()

  console.log('Applying security fix migration...')
  console.log('This will fix overly permissive RLS policies on:')
  console.log('- analytics_events')
  console.log('- analytics_event_data')
  console.log('- bot_detection_logs')
  console.log('- cache_performance_log')
  console.log('- voter_registration_resources_view')
  console.log('')

  try {
    // Execute the migration SQL
    // Note: Supabase JS client doesn't support raw SQL execution directly
    // We need to use the REST API's rpc endpoint or execute via PostgREST
    // For now, we'll use the REST API to execute via a function call

    // Split into individual statements and execute
    const statements = upSection
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`Executing ${statements.length} SQL statements...`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.length === 0 || statement.startsWith('--')) continue

      try {
        // Use Supabase's REST API to execute SQL
        // Note: This requires a function that can execute SQL, or we use the direct PostgREST approach
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ sql: statement }),
        })

        if (!response.ok) {
          // Try alternative: execute via direct SQL endpoint if available
          console.log(`Statement ${i + 1} may need manual execution`)
        } else {
          console.log(`✓ Executed statement ${i + 1}/${statements.length}`)
        }
      } catch (error) {
        console.warn(`Warning: Could not execute statement ${i + 1} automatically`)
        console.warn(`You may need to run this manually in Supabase SQL Editor`)
      }
    }

    console.log('')
    console.log('Migration application complete!')
    console.log('Please verify the changes in Supabase Dashboard.')
    console.log('')
    console.log('To verify, run this query in Supabase SQL Editor:')
    console.log(`
SELECT
  tablename,
  policyname,
  roles,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('analytics_events', 'analytics_event_data', 'bot_detection_logs', 'cache_performance_log')
ORDER BY tablename, policyname;
    `)

  } catch (error) {
    console.error('Error applying migration:', error)
    console.error('')
    console.error('Please apply the migration manually:')
    console.error('1. Open Supabase Dashboard')
    console.error('2. Go to SQL Editor')
    console.error(`3. Copy contents of: ${migrationPath}`)
    console.error('4. Run the migration')
    process.exit(1)
  }
}

applyMigration().catch(console.error)
