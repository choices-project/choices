#!/usr/bin/env node

/**
 * Check Table Columns
 * 
 * This script checks what columns actually exist in the trending_topics table.
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../web/.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTableColumns() {
  console.log('🔍 Checking table columns...\n');

  try {
    // Get table columns using exec_sql
    console.log('📋 Getting trending_topics table columns...');
    
    const { data, error } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            column_name, 
            data_type, 
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'trending_topics' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        ` 
      });
    
    if (error) {
      console.error('❌ Error getting table columns:', error);
    } else {
      console.log('✅ Table columns:');
      console.table(data);
    }

    // Also try to select from the table to see what we get
    console.log('\n📊 Trying to select from trending_topics...');
    const { data: selectData, error: selectError } = await supabase
      .from('trending_topics')
      .select('*')
      .limit(1);

    if (selectError) {
      console.error('❌ Error selecting from table:', selectError);
    } else {
      console.log('✅ Select successful, sample data:', selectData);
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run the check
checkTableColumns();
