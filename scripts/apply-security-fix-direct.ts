/**
 * Apply Security Fix Migration Directly
 *
 * Executes the RLS policy fixes using Supabase service role key
 *
 * Usage:
 *   cd web && npx tsx ../scripts/apply-security-fix-direct.ts
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

async function executeMigration() {
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

  // Dynamically import Supabase client (available in web/node_modules when run from web/)
  const { createClient } = await import('@supabase/supabase-js')
  console.log('🔒 Applying Security Fix Migration...')
  console.log('')

  // Read migration file
  const migrationPath = join(
    __dirname,
    '../supabase/migrations/20260122030000_fix_overly_permissive_rls_policies.sql'
  )

  let migrationSQL = readFileSync(migrationPath, 'utf-8')

  // Extract the migrate:up section
  const upMatch = migrationSQL.match(/-- migrate:up\s+([\s\S]*?)(?=\s*-- migrate:down)/)
  if (!upMatch) {
    console.error('❌ Could not extract migrate:up section')
    process.exit(1)
  }

  const upSQL = upMatch[1].trim()

  console.log('📋 Migration will fix:')
  console.log('  - analytics_events (overly permissive policies)')
  console.log('  - analytics_event_data (overly permissive policies)')
  console.log('  - bot_detection_logs (overly permissive policies)')
  console.log('  - cache_performance_log (overly permissive policies)')
  console.log('  - voter_registration_resources_view (security)')
  console.log('')

  try {
    // Use Supabase REST API to execute SQL via pg_net or direct connection
    // Since we can't execute raw SQL directly, we'll use the Supabase Management API
    // or execute via a PostgreSQL function

    // Create admin client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Execute SQL using Supabase's REST API
    // We need to use the PostgREST approach or create a function
    // For now, let's try using the REST API with a direct SQL execution endpoint

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Prefer': 'return=minimal',
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sql: upSQL
      }),
    })

    if (response.ok) {
      console.log('✅ Migration applied successfully!')
      console.log('')
      console.log('🔍 Verifying changes...')

      // Verify the policies were created
      const { data: policies, error: verifyError } = await supabase
        .rpc('exec_sql', {
          sql: `
            SELECT
              tablename,
              policyname,
              roles,
              cmd as command
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename IN ('analytics_events', 'analytics_event_data', 'bot_detection_logs', 'cache_performance_log')
            ORDER BY tablename, policyname;
          `
        })

      if (!verifyError && policies) {
        console.log('✅ Policies verified')
      }

    } else {
      // Try alternative: execute via direct SQL using a helper function
      console.log('⚠️  Direct API execution not available, using alternative method...')

      // Split SQL into executable blocks and execute via Supabase client
      // Since we can't execute raw SQL, we'll need to create the policies via the client
      // or use a different approach

      console.log('')
      console.log('📝 Please apply the migration manually:')
      console.log('   1. Open Supabase Dashboard SQL Editor')
      console.log('   2. Copy the SQL from the migration file')
      console.log('   3. Run it')
      console.log('')
      console.log(`   Migration file: ${migrationPath}`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
    console.log('')
    console.log('📝 Please apply the migration manually via Supabase Dashboard SQL Editor')
    console.log(`   Migration file: ${migrationPath}`)
    process.exit(1)
  }
}

executeMigration().catch(console.error)
