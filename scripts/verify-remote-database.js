#!/usr/bin/env node

/**
 * Remote Database Verification Script
 * 
 * This script verifies the current state of the remote Supabase database
 * and checks if we can proceed with the privacy migration.
 * 
 * Created: January 19, 2025
 * Purpose: Verify remote Supabase database state for privacy migration
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
  const timestamp = new Date().toISOString();
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
  log('INFO', 'Loading environment variables...');
  
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
  
  // Set environment variables
  Object.assign(process.env, envVars);
  
  log('SUCCESS', 'Environment variables loaded');
  return envVars;
}

async function createSupabaseClient() {
  log('INFO', 'Creating Supabase client...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    log('ERROR', 'Missing Supabase credentials');
    log('DEBUG', `URL: ${supabaseUrl ? 'SET' : 'MISSING'}`);
    log('DEBUG', `KEY: ${supabaseKey ? 'SET' : 'MISSING'}`);
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  log('SUCCESS', 'Supabase client created');
  
  return supabase;
}

async function checkDatabaseConnection(supabase) {
  log('INFO', 'Testing database connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      log('ERROR', `Database connection failed: ${error.message}`);
      return false;
    }
    
    log('SUCCESS', 'Database connection successful');
    return true;
  } catch (err) {
    log('ERROR', `Database connection error: ${err.message}`);
    return false;
  }
}

async function checkDangerousFields(supabase) {
  log('INFO', 'Checking for dangerous location fields...');
  
  try {
    // Check if dangerous fields exist by trying to select them
    const { data, error } = await supabase
      .from('user_profiles')
      .select('geo_lat, geo_lon, geo_precision')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('column') || error.message.includes('does not exist')) {
        log('SUCCESS', 'Dangerous location fields not found (already removed)');
        return false; // Fields don't exist
      } else {
        log('ERROR', `Error checking dangerous fields: ${error.message}`);
        return null;
      }
    }
    
    // Check if fields have data
    const { data: countData, error: countError } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .not('geo_lat', 'is', null)
      .not('geo_lon', 'is', null);
    
    if (countError) {
      log('WARNING', `Could not count users with dangerous location data: ${countError.message}`);
    } else {
      log('INFO', `Found ${countData?.length || 0} users with dangerous location data`);
    }
    
    log('WARNING', 'Dangerous location fields found - migration needed');
    return true; // Fields exist
  } catch (err) {
    log('ERROR', `Error checking dangerous fields: ${err.message}`);
    return null;
  }
}

async function checkPrivacyTables(supabase) {
  log('INFO', 'Checking for privacy tables...');
  
  const privacyTables = ['user_location_privacy', 'privacy_zones', 'privacy_audit_log'];
  const existingTables = [];
  
  for (const tableName of privacyTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          log('INFO', `Privacy table '${tableName}' does not exist`);
        } else {
          log('WARNING', `Error checking table '${tableName}': ${error.message}`);
        }
      } else {
        log('SUCCESS', `Privacy table '${tableName}' exists`);
        existingTables.push(tableName);
      }
    } catch (err) {
      log('WARNING', `Error checking table '${tableName}': ${err.message}`);
    }
  }
  
  return existingTables;
}

async function checkUserCount(supabase) {
  log('INFO', 'Checking user count...');
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      log('ERROR', `Error counting users: ${error.message}`);
      return null;
    }
    
    const userCount = data?.length || 0;
    log('SUCCESS', `Found ${userCount} users in database`);
    return userCount;
  } catch (err) {
    log('ERROR', `Error counting users: ${err.message}`);
    return null;
  }
}

async function checkMigrationFiles() {
  log('INFO', 'Checking migration files...');
  
  const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '20250119000006_remove_precise_location_data.sql');
  
  if (fs.existsSync(migrationFile)) {
    log('SUCCESS', 'Privacy migration file exists');
    return true;
  } else {
    log('ERROR', 'Privacy migration file not found');
    return false;
  }
}

async function checkPrivacyService() {
  log('INFO', 'Checking privacy service...');
  
  const serviceFile = path.join(__dirname, '..', 'web', 'lib', 'privacy', 'location-privacy-service.ts');
  
  if (fs.existsSync(serviceFile)) {
    log('SUCCESS', 'Privacy service file exists');
    return true;
  } else {
    log('ERROR', 'Privacy service file not found');
    return false;
  }
}

async function generateReport(results) {
  log('INFO', 'Generating verification report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    database: {
      connected: results.databaseConnected,
      dangerousFields: results.dangerousFields,
      privacyTables: results.privacyTables,
      userCount: results.userCount
    },
    files: {
      migrationFile: results.migrationFile,
      privacyService: results.privacyService
    },
    recommendations: []
  };
  
  // Generate recommendations
  if (results.dangerousFields) {
    report.recommendations.push('URGENT: Dangerous location fields found - migration required');
  }
  
  if (results.privacyTables.length === 0) {
    report.recommendations.push('Privacy tables not found - migration required');
  }
  
  if (!results.migrationFile) {
    report.recommendations.push('Migration file missing - cannot proceed');
  }
  
  if (!results.privacyService) {
    report.recommendations.push('Privacy service missing - cannot proceed');
  }
  
  if (results.databaseConnected && results.migrationFile && results.privacyService) {
    report.recommendations.push('READY: All prerequisites met - can proceed with migration');
  }
  
  // Save report
  const reportPath = path.join(__dirname, '..', 'privacy-verification-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log('SUCCESS', `Verification report saved to: ${reportPath}`);
  
  return report;
}

async function main() {
  console.log('🔒 Privacy Implementation Verification');
  console.log('=====================================');
  console.log('');
  
  try {
    // Step 1: Load environment variables
    await loadEnvironmentVariables();
    
    // Step 2: Create Supabase client
    const supabase = await createSupabaseClient();
    
    // Step 3: Check database connection
    const databaseConnected = await checkDatabaseConnection(supabase);
    if (!databaseConnected) {
      log('ERROR', 'Cannot proceed without database connection');
      process.exit(1);
    }
    
    // Step 4: Check dangerous fields
    const dangerousFields = await checkDangerousFields(supabase);
    
    // Step 5: Check privacy tables
    const privacyTables = await checkPrivacyTables(supabase);
    
    // Step 6: Check user count
    const userCount = await checkUserCount(supabase);
    
    // Step 7: Check migration files
    const migrationFile = await checkMigrationFiles();
    
    // Step 8: Check privacy service
    const privacyService = await checkPrivacyService();
    
    // Step 9: Generate report
    const results = {
      databaseConnected,
      dangerousFields,
      privacyTables,
      userCount,
      migrationFile,
      privacyService
    };
    
    const report = await generateReport(results);
    
    console.log('');
    console.log('📊 VERIFICATION SUMMARY');
    console.log('======================');
    console.log(`Database Connected: ${databaseConnected ? '✅' : '❌'}`);
    console.log(`Dangerous Fields: ${dangerousFields ? '⚠️  FOUND' : '✅ SAFE'}`);
    console.log(`Privacy Tables: ${privacyTables.length}/3`);
    console.log(`User Count: ${userCount || 'Unknown'}`);
    console.log(`Migration File: ${migrationFile ? '✅' : '❌'}`);
    console.log(`Privacy Service: ${privacyService ? '✅' : '❌'}`);
    console.log('');
    
    if (report.recommendations.length > 0) {
      console.log('🎯 RECOMMENDATIONS');
      console.log('==================');
      report.recommendations.forEach(rec => console.log(`• ${rec}`));
      console.log('');
    }
    
    if (databaseConnected && migrationFile && privacyService) {
      log('SUCCESS', 'Ready to proceed with privacy migration!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Run: npx supabase db push');
      console.log('2. Verify migration success');
      console.log('3. Update application code');
      console.log('4. Test privacy implementation');
    } else {
      log('ERROR', 'Not ready for migration - fix issues above');
      process.exit(1);
    }
    
  } catch (error) {
    log('ERROR', `Verification failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the verification
main().catch(console.error);
