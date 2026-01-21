/**
 * Execute Migration via Supabase REST API
 *
 * This script executes the security fix migration using Supabase's REST API
 * by calling a PostgreSQL function that executes the SQL.
 *
 * Usage:
 *   cd web && npx tsx ../scripts/execute-migration-via-api.ts
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

// Dynamically import Supabase client (available in web/node_modules)
const { createClient } = await import('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey)
  console.error('')
  console.error(`Expected .env.local at: ${envPath}`)
  process.exit(1)
}

async function executeMigration() {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Read the migration file
  const migrationPath = join(
    __dirname,
    '../supabase/migrations/20260122030000_fix_overly_permissive_rls_policies.sql'
  )

  let migrationSQL = readFileSync(migrationPath, 'utf-8')

  // Extract the migrate:up section
  const upMatch = migrationSQL.match(/-- migrate:up\s+([\s\S]*?)(?=\s*-- migrate:down)/)
  if (!upMatch) {
    console.error('Could not extract migrate:up section from migration file')
    process.exit(1)
  }

  const upSQL = upMatch[1].trim()

  console.log('Applying security fix migration...')
  console.log('This will fix overly permissive RLS policies')
  console.log('')

  try {
    // Execute the SQL using Supabase's REST API
    // We'll use the rpc endpoint to execute SQL via a function
    // First, create a temporary function to execute the SQL

    const executeSQL = `
      DO $$
      BEGIN
        ${upSQL}
      END $$;
    `

    // Use the Supabase REST API directly to execute SQL
    // Note: This requires the SQL to be executed via a stored procedure
    // For now, we'll use the direct PostgREST approach

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        sql: executeSQL
      }),
    })

    if (response.ok) {
      console.log('✓ Migration applied successfully!')
    } else {
      // If exec_sql doesn't exist, we need to execute via psql or dashboard
      const errorText = await response.text()
      console.warn('Could not execute via API (this is expected if exec_sql function does not exist)')
      console.warn('Error:', errorText)
      console.log('')
      console.log('Please apply the migration manually:')
      console.log('1. Open Supabase Dashboard')
      console.log('2. Go to SQL Editor')
      console.log(`3. Copy and run the SQL from: ${migrationPath}`)
      console.log('')
      console.log('Or use Supabase CLI:')
      console.log(`  supabase db push`)
    }

  } catch (error) {
    console.error('Error:', error)
    console.log('')
    console.log('Please apply the migration manually via Supabase Dashboard SQL Editor')
    console.log(`Migration file: ${migrationPath}`)
  }
}

executeMigration().catch(console.error)
