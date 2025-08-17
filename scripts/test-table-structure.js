#!/usr/bin/env node

/**
 * Test Table Structure
 * 
 * This script tests what columns exist in the trending_topics table.
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

async function testTableStructure() {
  console.log('🔍 Testing table structure...\n');

  try {
    // Try to insert minimal data to see what columns exist
    console.log('📊 Testing trending_topics table...');
    
    const minimalTopic = {
      title: 'Test Topic',
      source_name: 'Test Source',
      source_type: 'news'
    };

    const { data, error } = await supabase
      .from('trending_topics')
      .insert(minimalTopic)
      .select();

    if (error) {
      console.error('❌ Error with minimal insert:', error);
      
      // Try to get table info
      console.log('\n📋 Trying to get table info...');
      const { data: tableInfo, error: tableError } = await supabase
        .rpc('exec_sql', { 
          sql: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'trending_topics' ORDER BY ordinal_position;" 
        });
      
      if (tableError) {
        console.error('❌ Error getting table info:', tableError);
      } else {
        console.log('✅ Table columns:', tableInfo);
      }
    } else {
      console.log('✅ Minimal insert successful:', data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testTableStructure();
