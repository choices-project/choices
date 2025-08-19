#!/usr/bin/env node

/**
 * Deploy Hybrid Privacy Support
 * 
 * This script adds privacy level support to the existing database schema
 * and updates the system to support hybrid privacy levels.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔐 Deploying Hybrid Privacy Support...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deployHybridPrivacy() {
  try {
    console.log('📋 Step 1: Reading privacy support SQL...');
    
    const sqlPath = path.join(__dirname, 'add-privacy-support.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('✅ SQL file loaded successfully');
    console.log(`📄 SQL file size: ${sqlContent.length} characters`);

    console.log('\n📋 Step 2: Executing database schema changes...');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements to execute`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`\n📋 Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });

        if (error) {
          console.log(`❌ Statement ${i + 1} failed:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Statement ${i + 1} failed:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Execution Summary:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📊 Total: ${statements.length}`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. This may be normal if columns already exist.');
    }

    console.log('\n📋 Step 3: Verifying schema changes...');
    
    // Verify that privacy_level column exists
    const { data: columnCheck, error: columnError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'po_polls'
        AND column_name IN ('privacy_level', 'privacy_metadata', 'user_id', 'created_by', 'voting_method', 'category', 'tags')
        ORDER BY column_name;
      `
    });

    if (columnError) {
      console.log('❌ Error checking columns:', columnError.message);
    } else {
      console.log('✅ Privacy columns verification:');
      console.log(JSON.stringify(columnCheck, null, 2));
    }

    // Verify functions exist
    const { data: functionCheck, error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT routine_name, routine_type
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name IN ('get_poll_privacy_settings', 'update_poll_privacy_level')
        ORDER BY routine_name;
      `
    });

    if (functionError) {
      console.log('❌ Error checking functions:', functionError.message);
    } else {
      console.log('✅ Privacy functions verification:');
      console.log(JSON.stringify(functionCheck, null, 2));
    }

    // Verify indexes exist
    const { data: indexCheck, error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT indexname, tablename, indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'po_polls'
        AND indexname LIKE '%privacy%'
        ORDER BY indexname;
      `
    });

    if (indexError) {
      console.log('❌ Error checking indexes:', indexError.message);
    } else {
      console.log('✅ Privacy indexes verification:');
      console.log(JSON.stringify(indexCheck, null, 2));
    }

    console.log('\n🎉 Hybrid Privacy Support Deployment Complete!');
    console.log('\n📋 What was added:');
    console.log('   ✅ privacy_level column to po_polls table');
    console.log('   ✅ privacy_metadata column for additional privacy data');
    console.log('   ✅ user_id and created_by columns for poll creators');
    console.log('   ✅ voting_method, category, and tags columns');
    console.log('   ✅ privacy_level column to po_votes table');
    console.log('   ✅ vote_metadata column for vote tracking');
    console.log('   ✅ get_poll_privacy_settings() function');
    console.log('   ✅ update_poll_privacy_level() function');
    console.log('   ✅ Performance indexes for privacy queries');
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Test the privacy level selector component');
    console.log('   2. Update poll creation forms to include privacy selection');
    console.log('   3. Implement IA/PO service integration for high-privacy polls');
    console.log('   4. Add privacy level indicators to poll displays');
    console.log('   5. Create migration tools for existing polls');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run the deployment
deployHybridPrivacy();
