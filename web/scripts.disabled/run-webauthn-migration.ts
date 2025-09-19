#!/usr/bin/env tsx

/**
 * WebAuthn Migration Runner
 * 
 * This script runs the WebAuthn database migration using the service role key.
 * It creates the necessary tables, indexes, RLS policies, and functions.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Environment validation
const validateEnvironment = () => {
  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  };

  const missing = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return requiredVars;
};

async function runWebAuthnMigration() {
  try {
    console.log('🚀 Starting WebAuthn migration...');
    
    // Validate environment
    const env = validateEnvironment();
    console.log('✅ Environment variables validated');

    // Create service role client
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Read migration file
    const migrationPath = join(__dirname, 'migrations', '001-webauthn-schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded');

    // Split into individual statements (basic approach)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement && statement.trim()) {
        try {
          console.log(`  ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // Some errors are expected (like IF NOT EXISTS)
            if (error.message.includes('already exists') || 
                error.message.includes('does not exist') ||
                error.message.includes('cron.schedule')) {
              console.log(`    ⚠️  Expected: ${error.message}`);
            } else {
              throw error;
            }
          } else {
            console.log(`    ✅ Success`);
          }
        } catch (err) {
          console.error(`    ❌ Error: ${err}`);
          // Continue with other statements
        }
      }
    }

    // Verify tables were created
    console.log('\n🔍 Verifying migration...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['webauthn_credentials', 'webauthn_challenges']);

    if (tablesError) {
      throw new Error(`Failed to verify tables: ${tablesError.message}`);
    }

    const tableNames = tables?.map(t => t.table_name) || [];
    console.log(`✅ Found tables: ${tableNames.join(', ')}`);

    if (tableNames.length === 2) {
      console.log('\n🎉 WebAuthn migration completed successfully!');
      console.log('📋 Next steps:');
      console.log('  1. Set environment variables: RP_ID, ALLOWED_ORIGINS, WEBAUTHN_CHALLENGE_TTL_SECONDS');
      console.log('  2. Deploy API routes');
      console.log('  3. Test on production domain');
    } else {
      console.log('⚠️  Migration may not have completed fully. Check the logs above.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runWebAuthnMigration();
}

export { runWebAuthnMigration };
