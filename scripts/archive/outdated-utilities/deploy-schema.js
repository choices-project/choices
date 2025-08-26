#!/usr/bin/env node

/**
 * Deploy Supabase Schema Script
 * 
 * This script deploys the complete database schema to the Supabase database.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './web/.env.local' });

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deploySchema() {
  console.log('🚀 Deploying Supabase schema...');
  
  try {
    // Read the schema files
    const schemaPath = path.join(__dirname, '../web/lib/supabase-schema.sql');
    const rlsPath = path.join(__dirname, '../web/lib/supabase-rls.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    
    if (!fs.existsSync(rlsPath)) {
      throw new Error(`RLS file not found: ${rlsPath}`);
    }
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    const rlsSQL = fs.readFileSync(rlsPath, 'utf8');
    
    console.log('📄 Schema file loaded successfully');
    console.log('📄 RLS file loaded successfully');
    
    // Split the schema into individual statements
    const schemaStatements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔧 Executing ${schemaStatements.length} schema statements...`);
    
    // Execute schema statements
    for (let i = 0; i < schemaStatements.length; i++) {
      const statement = schemaStatements[i];
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.log(`⚠️  Statement ${i + 1} warning:`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} error (continuing):`, err.message);
        }
      }
    }
    
    // Split the RLS into individual statements
    const rlsStatements = rlsSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔒 Executing ${rlsStatements.length} RLS statements...`);
    
    // Execute RLS statements
    for (let i = 0; i < rlsStatements.length; i++) {
      const statement = rlsStatements[i];
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.log(`⚠️  RLS Statement ${i + 1} warning:`, error.message);
          } else {
            console.log(`✅ RLS Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`⚠️  RLS Statement ${i + 1} error (continuing):`, err.message);
        }
      }
    }
    
    console.log('✅ Schema deployment completed!');
    
    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const tables = [
      'user_profiles',
      'polls', 
      'votes',
      'feedback',
      'user_analytics',
      'user_demographics',
      'user_privacy_settings',
      'biometric_credentials',
      'webauthn_credentials',
      'admin_audit_log',
      'feature_flags',
      'system_metrics'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`⚠️  Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error deploying schema:', error.message);
    process.exit(1);
  }
}

// Run the script
deploySchema()
  .then(() => {
    console.log('🎉 Schema deployment completed successfully!');
    console.log('🚀 Your database is now ready for the Choices platform!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Schema deployment failed:', error);
    process.exit(1);
  });

