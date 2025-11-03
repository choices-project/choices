#!/usr/bin/env node

/**
 * Database Tables Verification Script
 * 
 * Queries Supabase directly to verify which tables actually exist
 * vs what documentation claims should exist.
 * 
 * Usage: node scripts/verify-database-tables.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  console.error('\nPlease check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Expected tables from audit documentation
const EXPECTED_TABLES = {
  // Core tables (should exist)
  'user_profiles': { status: 'expected', category: 'core' },
  'polls': { status: 'expected', category: 'core' },
  'votes': { status: 'expected', category: 'core' },
  'feedback': { status: 'expected', category: 'core' },
  'error_logs': { status: 'expected', category: 'core' },
  
  // WebAuthn (feature enabled, migration needed?)
  'webauthn_credentials': { status: 'expected', category: 'webauthn', feature: 'WEBAUTHN: true' },
  'webauthn_challenges': { status: 'expected', category: 'webauthn', feature: 'WEBAUTHN: true' },
  
  // Civics tables (should exist)
  'civics_person_xref': { status: 'expected', category: 'civics' },
  'civics_representatives': { status: 'expected', category: 'civics' },
  'civics_votes_minimal': { status: 'expected', category: 'civics' },
  'civics_fec_minimal': { status: 'expected', category: 'civics' },
  'civics_quality_thresholds': { status: 'expected', category: 'civics' },
  'civics_expected_counts': { status: 'expected', category: 'civics' },
  'civics_source_precedence': { status: 'expected', category: 'civics' },
  
  // Feature-flagged tables (may not exist)
  'device_flows': { status: 'optional', category: 'device-flow', feature: 'DEVICE_FLOW_AUTH: false' },
  'contact_threads': { status: 'optional', category: 'contact', feature: 'CONTACT_INFORMATION_SYSTEM: false' },
  'contact_messages': { status: 'optional', category: 'contact', feature: 'CONTACT_INFORMATION_SYSTEM: false' },
  'message_templates': { status: 'optional', category: 'contact', feature: 'CONTACT_INFORMATION_SYSTEM: false' },
  'notification_subscriptions': { status: 'optional', category: 'notifications', feature: 'PUSH_NOTIFICATIONS: false' },
  'notification_history': { status: 'optional', category: 'notifications', feature: 'PUSH_NOTIFICATIONS: false' },
  'poll_narratives': { status: 'optional', category: 'narrative', feature: 'POLL_NARRATIVE_SYSTEM: false' },
  'verified_facts': { status: 'optional', category: 'narrative', feature: 'POLL_NARRATIVE_SYSTEM: false' },
  'community_facts': { status: 'optional', category: 'narrative', feature: 'POLL_NARRATIVE_SYSTEM: false' },
  'fact_votes': { status: 'optional', category: 'narrative', feature: 'POLL_NARRATIVE_SYSTEM: false' },
  'narrative_moderation': { status: 'optional', category: 'narrative', feature: 'POLL_NARRATIVE_SYSTEM: false' },
  'zk_nullifiers': { status: 'optional', category: 'privacy', feature: 'ADVANCED_PRIVACY: false' },
  'zk_artifacts': { status: 'optional', category: 'privacy', feature: 'ADVANCED_PRIVACY: false' },
  'oauth_accounts': { status: 'optional', category: 'social', feature: 'SOCIAL_SIGNUP: false' },
  'civic_database_entries': { status: 'optional', category: 'analytics', note: 'Referenced in analytics-service.ts but not created' },
};

async function queryTables() {
  console.log('🔍 Querying Supabase for existing tables...\n');
  
  try {
    // Query information_schema for all tables in public schema
    const query = `
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    // Use Supabase REST API to execute raw query via rpc (if available)
    // Fallback: try to query each expected table directly
    
    const existingTables = new Set();
    const existingViews = new Set();
    const errors = [];
    
    // Try to get list via a test query on a known table
    console.log('📋 Checking for existing tables...\n');
    
    // Check each expected table
    for (const tableName of Object.keys(EXPECTED_TABLES)) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(0);
        
        if (!error) {
          existingTables.add(tableName);
          console.log(`✅ ${tableName} - EXISTS`);
        } else if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.log(`❌ ${tableName} - MISSING`);
        } else {
          // Other error - might be permission, but table exists
          existingTables.add(tableName);
          console.log(`⚠️  ${tableName} - EXISTS (but query failed: ${error.message})`);
        }
      } catch (err) {
        errors.push({ table: tableName, error: err.message });
      }
    }
    
    // Also check for any other tables we might have missed
    console.log('\n🔍 Checking for additional tables...\n');
    const commonTables = [
      'cache', 'analytics', 'rate_limits', 'notifications', 'user_sessions',
      'site_messages', 'hashtags', 'hashtag_polls', 'poll_hashtags'
    ];
    
    for (const tableName of commonTables) {
      if (!EXPECTED_TABLES[tableName]) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(0);
          
          if (!error) {
            console.log(`ℹ️  ${tableName} - EXISTS (not in expected list)`);
          }
        } catch (err) {
          // Table doesn't exist, skip
        }
      }
    }
    
    return {
      existing: Array.from(existingTables),
      missing: Object.keys(EXPECTED_TABLES).filter(t => !existingTables.has(t)),
      errors
    };
    
  } catch (error) {
    console.error('❌ Error querying database:', error.message);
    throw error;
  }
}

async function generateReport(results) {
  const report = {
    generated: new Date().toISOString(),
    supabaseUrl: supabaseUrl?.replace(/\/\/.*@/, '//***@'), // Hide credentials
    summary: {
      totalExpected: Object.keys(EXPECTED_TABLES).length,
      existing: results.existing.length,
      missing: results.missing.length,
      errors: results.errors.length
    },
    existing: results.existing.map(table => ({
      table,
      ...EXPECTED_TABLES[table]
    })),
    missing: results.missing.map(table => ({
      table,
      ...EXPECTED_TABLES[table]
    })),
    criticalIssues: [],
    recommendations: []
  };
  
  // Check for critical issues
  const criticalTables = ['webauthn_credentials', 'webauthn_challenges'];
  for (const table of criticalTables) {
    if (!results.existing.includes(table)) {
      report.criticalIssues.push({
        table,
        issue: `Feature WEBAUTHN is enabled (true) but required table ${table} is missing`,
        impact: 'WebAuthn feature will not work despite being enabled',
        action: 'Run migration: web/scripts/migrations/001-webauthn-schema.sql'
      });
    }
  }
  
  // Generate recommendations
  if (results.existing.includes('webauthn_credentials')) {
    report.recommendations.push({
      priority: 'info',
      message: 'WebAuthn tables exist - feature should be functional'
    });
  } else {
    report.recommendations.push({
      priority: 'high',
      message: 'Run WebAuthn migration to enable passwordless authentication'
    });
  }
  
  // Check optional tables vs feature flags
  const optionalFeatureTables = {
    'device_flows': 'DEVICE_FLOW_AUTH',
    'contact_threads': 'CONTACT_INFORMATION_SYSTEM',
    'notification_subscriptions': 'PUSH_NOTIFICATIONS',
    'poll_narratives': 'POLL_NARRATIVE_SYSTEM'
  };
  
  for (const [table, flag] of Object.entries(optionalFeatureTables)) {
    const exists = results.existing.includes(table);
    if (exists) {
      report.recommendations.push({
        priority: 'info',
        message: `${table} exists - ${flag} feature may be ready to enable`
      });
    }
  }
  
  return report;
}

async function main() {
  try {
    console.log('🚀 Starting database table verification...\n');
    
    const results = await queryTables();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Expected: ${Object.keys(EXPECTED_TABLES).length}`);
    console.log(`✅ Existing: ${results.existing.length}`);
    console.log(`❌ Missing: ${results.missing.length}`);
    
    if (results.errors.length > 0) {
      console.log(`⚠️  Errors: ${results.errors.length}`);
    }
    
    const report = await generateReport(results);
    
    // Save report
    const reportPath = path.join(__dirname, '../docs/DATABASE_VERIFICATION_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Generate markdown summary
    const markdownPath = path.join(__dirname, '../docs/DATABASE_VERIFICATION_REPORT.md');
    const markdown = generateMarkdownReport(report);
    fs.writeFileSync(markdownPath, markdown);
    console.log(`📝 Markdown report saved to: ${markdownPath}`);
    
    // Print critical issues
    if (report.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      report.criticalIssues.forEach(issue => {
        console.log(`\n   Table: ${issue.table}`);
        console.log(`   Issue: ${issue.issue}`);
        console.log(`   Impact: ${issue.impact}`);
        console.log(`   Action: ${issue.action}`);
      });
    }
    
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function generateMarkdownReport(report) {
  let md = `# Database Tables Verification Report\n\n`;
  md += `**Generated**: ${report.generated}\n\n`;
  md += `**Supabase Project**: ${report.supabaseUrl}\n\n`;
  
  md += `## Summary\n\n`;
  md += `- **Total Expected Tables**: ${report.summary.totalExpected}\n`;
  md += `- **Existing Tables**: ${report.summary.existing} ✅\n`;
  md += `- **Missing Tables**: ${report.summary.missing} ❌\n`;
  md += `- **Query Errors**: ${report.summary.errors}\n\n`;
  
  if (report.criticalIssues.length > 0) {
    md += `## 🚨 Critical Issues\n\n`;
    report.criticalIssues.forEach(issue => {
      md += `### ${issue.table}\n\n`;
      md += `**Issue**: ${issue.issue}\n\n`;
      md += `**Impact**: ${issue.impact}\n\n`;
      md += `**Action Required**: ${issue.action}\n\n`;
    });
  }
  
  md += `## Existing Tables\n\n`;
  md += `| Table | Category | Status | Feature Flag |\n`;
  md += `|-------|----------|--------|--------------|\n`;
  report.existing.forEach(item => {
    const feature = item.feature || '-';
    md += `| ${item.table} | ${item.category} | ✅ Exists | ${feature} |\n`;
  });
  
  md += `\n## Missing Tables\n\n`;
  md += `| Table | Category | Status | Feature Flag |\n`;
  md += `|-------|----------|--------|--------------|\n`;
  report.missing.forEach(item => {
    const feature = item.feature || '-';
    const status = item.status === 'expected' ? '❌ Missing (Expected)' : '⚠️ Missing (Optional)';
    md += `| ${item.table} | ${item.category} | ${status} | ${feature} |\n`;
  });
  
  if (report.recommendations.length > 0) {
    md += `\n## Recommendations\n\n`;
    report.recommendations.forEach(rec => {
      md += `- **${rec.priority.toUpperCase()}**: ${rec.message}\n`;
    });
  }
  
  return md;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { queryTables, generateReport };

