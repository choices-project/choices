#!/usr/bin/env node

/**
 * Direct Table Checker
 * 
 * Tries to access known tables directly to see what exists
 */

const fs = require('fs');
const path = require('path');

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Known tables from our codebase
const knownTables = [
  'user_profiles',
  'polls',
  'votes',
  'error_logs',
  'feedback',
  'webauthn_credentials',
  'webauthn_challenges',
  'idempotency_keys',
  'user_consent',
  'privacy_logs',
  'user_profiles_encrypted',
  'private_user_data',
  'analytics_contributions',
  'civics_representatives',
  'civics_address_cache',
  'civics_rate_limits',
  'civics_user_preferences',
  'id_crosswalk',
  'candidates',
  'elections',
  'campaign_finance',
  'contributions',
  'voting_records',
  'data_licenses',
  'independence_score_methodology',
  'ingest_cursors',
  'data_quality_audit',
  'civics_person_xref',
  'civics_source_precedence',
  'civics_expected_counts',
  'civics_quality_thresholds',
  'civics_fec_minimal',
  'civics_votes_minimal',
  'civics_divisions',
  'civics_campaign_finance',
  'civics_votes',
  'civics_voting_behavior'
];

async function checkTables() {
  console.log('🔍 Checking which tables exist in the live database...');
  
  const results = {
    existing: [],
    missing: [],
    errors: [],
    tableDetails: {}
  };
  
  for (const tableName of knownTables) {
    try {
      console.log(`🔍 Checking ${tableName}...`);
      
      // Try to select from the table (limit 0 to just check if it exists)
      const { error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          results.missing.push(tableName);
          console.log(`   ❌ ${tableName} - does not exist`);
        } else {
          results.errors.push(`${tableName}: ${error.message}`);
          console.log(`   ⚠️  ${tableName} - error: ${error.message}`);
        }
      } else {
        results.existing.push(tableName);
        results.tableDetails[tableName] = {
          count: count || 0,
          accessible: true
        };
        console.log(`   ✅ ${tableName} - exists (${count || 0} rows)`);
      }
    } catch (err) {
      results.errors.push(`${tableName}: ${err.message}`);
      console.log(`   ❌ ${tableName} - exception: ${err.message}`);
    }
  }
  
  // Try to get column information for existing tables
  console.log('\n🔍 Getting column details for existing tables...');
  for (const tableName of results.existing.slice(0, 10)) { // First 10 tables
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error && data && data.length > 0) {
        const columns = Object.keys(data[0]);
        results.tableDetails[tableName].columns = columns;
        console.log(`   📋 ${tableName}: ${columns.length} columns (${columns.slice(0, 5).join(', ')}${columns.length > 5 ? '...' : ''})`);
      }
    } catch (err) {
      console.log(`   ⚠️  ${tableName}: Could not get column details - ${err.message}`);
    }
  }
  
  return results;
}

async function main() {
  try {
    const results = await checkTables();
    
    // Write results to file
    const outputPath = path.join(__dirname, '../LIVE_DATABASE_TABLES.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    
    console.log('\n📊 TABLE SUMMARY:');
    console.log(`   ✅ Existing: ${results.existing.length}`);
    console.log(`   ❌ Missing: ${results.missing.length}`);
    console.log(`   ⚠️  Errors: ${results.errors.length}`);
    
    console.log('\n✅ EXISTING TABLES:');
    results.existing.forEach(table => {
      const details = results.tableDetails[table];
      const count = details?.count || '?';
      const columnCount = details?.columns?.length || '?';
      console.log(`   ${table} (${count} rows, ${columnCount} columns)`);
    });
    
    console.log('\n❌ MISSING TABLES:');
    results.missing.forEach(table => {
      console.log(`   ${table}`);
    });
    
    if (results.errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      results.errors.forEach(error => {
        console.log(`   ${error}`);
      });
    }
    
    console.log(`\n✅ Table information saved to: ${outputPath}`);
    
    // Also create a human-readable markdown version
    const markdownPath = path.join(__dirname, '../LIVE_DATABASE_TABLES.md');
    const markdown = generateMarkdownTables(results);
    fs.writeFileSync(markdownPath, markdown);
    console.log(`📝 Human-readable table list saved to: ${markdownPath}`);
    
  } catch (error) {
    console.error('❌ Failed to check tables:', error.message);
    process.exit(1);
  }
}

function generateMarkdownTables(results) {
  let markdown = `# Live Database Tables\n\n`;
  markdown += `**Generated**: ${new Date().toISOString()}\n\n`;
  
  markdown += `## Summary\n\n`;
  markdown += `- **Existing Tables**: ${results.existing.length}\n`;
  markdown += `- **Missing Tables**: ${results.missing.length}\n`;
  markdown += `- **Errors**: ${results.errors.length}\n\n`;
  
  // Existing tables
  markdown += `## Existing Tables (${results.existing.length})\n\n`;
  results.existing.forEach(table => {
    const details = results.tableDetails[table];
    const count = details?.count || '?';
    const columnCount = details?.columns?.length || '?';
    
    markdown += `### ${table}\n\n`;
    markdown += `- **Row Count**: ${count}\n`;
    markdown += `- **Column Count**: ${columnCount}\n`;
    
    if (details?.columns && details.columns.length > 0) {
      markdown += `- **Columns**: ${details.columns.join(', ')}\n`;
    }
    markdown += `\n`;
  });
  
  // Missing tables
  if (results.missing.length > 0) {
    markdown += `## Missing Tables (${results.missing.length})\n\n`;
    results.missing.forEach(table => {
      markdown += `- ${table}\n`;
    });
    markdown += `\n`;
  }
  
  // Errors
  if (results.errors.length > 0) {
    markdown += `## Errors\n\n`;
    results.errors.forEach(error => {
      markdown += `- ${error}\n`;
    });
  }
  
  return markdown;
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { checkTables };

