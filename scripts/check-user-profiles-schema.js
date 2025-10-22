#!/usr/bin/env node

/**
 * Check User Profiles Schema
 * 
 * This script checks the current schema of the user_profiles table
 * to understand the constraint issue.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(status, message) {
  const color = {
    'SUCCESS': colors.green,
    'WARNING': colors.yellow,
    'ERROR': colors.red,
    'INFO': colors.blue,
    'DEBUG': colors.cyan
  }[status] || colors.reset;
  
  const icon = {
    'SUCCESS': '✅',
    'WARNING': '⚠️ ',
    'ERROR': '❌',
    'INFO': 'ℹ️ ',
    'DEBUG': '🔍'
  }[status] || '•';
  
  console.log(`${color}${icon} ${message}${colors.reset}`);
}

async function loadEnvironmentVariables() {
  const envPath = path.join(__dirname, '..', 'web', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log('ERROR', 'Environment file not found at web/.env.local');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (value && !value.startsWith('#')) {
        envVars[key.trim()] = value;
      }
    }
  });
  
  Object.assign(process.env, envVars);
  return envVars;
}

async function checkUserProfilesSchema() {
  log('INFO', 'Loading environment variables...');
  await loadEnvironmentVariables();
  
  log('INFO', 'Creating Supabase client...');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  log('INFO', 'Checking user_profiles table schema...');
  
  try {
    // Get table structure
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      log('ERROR', `Error accessing user_profiles: ${error.message}`);
      return;
    }
    
    log('SUCCESS', 'user_profiles table accessible');
    
    // Check if user_id is unique
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .limit(10);
    
    if (userError) {
      log('ERROR', `Error checking user_id: ${userError.message}`);
      return;
    }
    
    log('INFO', `Found ${userData?.length || 0} users`);
    
    // Check for duplicate user_ids
    const userIds = userData?.map(u => u.user_id) || [];
    const uniqueUserIds = [...new Set(userIds)];
    
    if (userIds.length !== uniqueUserIds.length) {
      log('WARNING', `Duplicate user_ids found: ${userIds.length} total, ${uniqueUserIds.length} unique`);
    } else {
      log('SUCCESS', 'No duplicate user_ids found');
    }
    
    // Check if user_id is the primary key
    log('INFO', 'Checking primary key structure...');
    
    // Try to get a specific user by user_id
    if (userData && userData.length > 0) {
      const testUserId = userData[0].user_id;
      const { data: specificUser, error: specificError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', testUserId)
        .single();
      
      if (specificError) {
        log('WARNING', `Error getting specific user: ${specificError.message}`);
      } else {
        log('SUCCESS', 'user_id can be used for single record lookup');
      }
    }
    
    // Check if there's an id field
    const { data: idData, error: idError } = await supabase
      .from('user_profiles')
      .select('id, user_id')
      .limit(1);
    
    if (idError) {
      log('WARNING', `Error checking id field: ${idError.message}`);
    } else {
      log('SUCCESS', 'Both id and user_id fields exist');
      log('DEBUG', `Sample data: ${JSON.stringify(idData?.[0], null, 2)}`);
    }
    
  } catch (err) {
    log('ERROR', `Error checking schema: ${err.message}`);
  }
}

async function main() {
  console.log('🔍 User Profiles Schema Check');
  console.log('=============================');
  console.log('');
  
  try {
    await checkUserProfilesSchema();
  } catch (error) {
    log('ERROR', `Schema check failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main().catch(console.error);
