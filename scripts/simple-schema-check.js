#!/usr/bin/env node

/**
 * Simple Database Schema Check
 * 
 * Uses Supabase client to check what tables actually exist
 * and verify WebAuthn tables are present.
 * 
 * SAFETY: Read-only operations only
 * 
 * Usage:
 *   node scripts/simple-schema-check.js
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables safely
require('dotenv').config({ path: path.join(__dirname, '../web/.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('🔍 Simple Database Schema Check');
  console.log('=' .repeat(50));
  console.log('⚠️  This script performs READ-ONLY operations only');
  console.log('');

  try {
    // Check for WebAuthn tables specifically
    await checkWebAuthnTables();
    
    // Check for other important tables
    await checkImportantTables();
    
    // List all tables we can access
    await listAllTables();
    
    console.log('\n✅ Schema check complete - no data was modified');
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
    process.exit(1);
  }
}

async function checkWebAuthnTables() {
  console.log('🔐 Checking WebAuthn tables...');
  
  const webauthnTables = [
    'webauthn_credentials',
    'webauthn_challenges'
  ];
  
  for (const tableName of webauthnTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
          console.log(`❌ Table '${tableName}' does not exist`);
        } else {
          console.log(`⚠️  Table '${tableName}' exists but has issues: ${error.message}`);
        }
      } else {
        console.log(`✅ Table '${tableName}' exists and is accessible`);
      }
    } catch (err) {
      console.log(`❌ Error checking table '${tableName}': ${err.message}`);
    }
  }
}

async function checkImportantTables() {
  console.log('\n📋 Checking important application tables...');
  
  const importantTables = [
    'user_profiles',
    'polls',
    'votes',
    'feedback',
    'hashtags',
    'analytics_events'
  ];
  
  for (const tableName of importantTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
          console.log(`❌ Table '${tableName}' does not exist`);
        } else {
          console.log(`⚠️  Table '${tableName}' exists but has issues: ${error.message}`);
        }
      } else {
        console.log(`✅ Table '${tableName}' exists and is accessible`);
      }
    } catch (err) {
      console.log(`❌ Error checking table '${tableName}': ${err.message}`);
    }
  }
}

async function listAllTables() {
  console.log('\n📊 Attempting to list all accessible tables...');
  
  // Try to get table information using a simple query
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(20);
    
    if (error) {
      console.log('⚠️  Could not query information_schema:', error.message);
    } else if (data && Array.isArray(data)) {
      console.log(`✅ Found ${data.length} tables in public schema:`);
      data.forEach((table, i) => {
        console.log(`  ${i+1}. ${table.table_name}`);
      });
    } else {
      console.log('⚠️  Unexpected data format from information_schema');
    }
  } catch (err) {
    console.log('⚠️  Could not access information_schema:', err.message);
  }
  
  // Try alternative approach - test common table names
  console.log('\n🔍 Testing common table patterns...');
  const commonPatterns = [
    'users', 'user_profiles', 'profiles',
    'polls', 'votes', 'options',
    'auth', 'sessions', 'tokens',
    'analytics', 'events', 'logs',
    'feedback', 'comments', 'reviews',
    'hashtags', 'tags', 'categories'
  ];
  
  const foundTables = [];
  
  for (const pattern of commonPatterns) {
    try {
      const { data, error } = await supabase
        .from(pattern)
        .select('*')
        .limit(1);
      
      if (!error) {
        foundTables.push(pattern);
      }
    } catch (err) {
      // Table doesn't exist or not accessible
    }
  }
  
  if (foundTables.length > 0) {
    console.log(`✅ Found ${foundTables.length} accessible tables:`);
    foundTables.forEach((table, i) => {
      console.log(`  ${i+1}. ${table}`);
    });
  } else {
    console.log('⚠️  No accessible tables found with common patterns');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

