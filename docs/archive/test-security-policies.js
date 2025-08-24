#!/usr/bin/env node

require('dotenv').config({ path: './web/.env.local' });

const fs = require('fs');
const path = require('path');

async function testSecurityPolicies() {
  console.log('🔍 Testing Security Policies SQL');
  console.log('================================\n');

  try {
    // Read the security policies file
    const sqlPath = path.join(__dirname, '../database/security_policies_fixed.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('✅ Security policies file loaded');
    console.log(`📄 File size: ${sql.length} characters`);
    console.log(`📄 Lines: ${sql.split('\n').length}`);

    // Check for potential type issues
    console.log('\n🔍 Checking for potential type issues...');

    const typeIssues = [];
    
    // Check for auth.uid() comparisons without proper casting
    const authUidPatterns = [
      { pattern: /auth\.uid\(\)\s*=\s*[^:]+(?!::)/g, issue: 'auth.uid() comparison without type casting' },
      { pattern: /auth\.uid\(\)\s*!=\s*[^:]+(?!::)/g, issue: 'auth.uid() comparison without type casting' },
      { pattern: /auth\.uid\(\)\s*IN\s*[^:]+(?!::)/g, issue: 'auth.uid() IN clause without type casting' }
    ];

    authUidPatterns.forEach(({ pattern, issue }) => {
      const matches = sql.match(pattern);
      if (matches) {
        matches.forEach(match => {
          typeIssues.push({
            issue,
            match: match.trim(),
            line: findLineNumber(sql, match)
          });
        });
      }
    });

    // Check for UUID/text comparisons
    const uuidTextPatterns = [
      { pattern: /uuid\s*=\s*text/gi, issue: 'UUID = TEXT comparison' },
      { pattern: /text\s*=\s*uuid/gi, issue: 'TEXT = UUID comparison' }
    ];

    uuidTextPatterns.forEach(({ pattern, issue }) => {
      const matches = sql.match(pattern);
      if (matches) {
        matches.forEach(match => {
          typeIssues.push({
            issue,
            match: match.trim(),
            line: findLineNumber(sql, match)
          });
        });
      }
    });

    if (typeIssues.length > 0) {
      console.log('❌ Potential type issues found:');
      typeIssues.forEach(({ issue, match, line }) => {
        console.log(`   Line ${line}: ${issue}`);
        console.log(`   Match: ${match}`);
        console.log('');
      });
    } else {
      console.log('✅ No obvious type issues found');
    }

    // Check for proper type casting
    console.log('\n🔍 Checking for proper type casting...');
    
    const properCasting = [
      'auth.uid()::text',
      'auth.uid()::uuid',
      '::text',
      '::uuid'
    ];

    const castingCount = {};
    properCasting.forEach(cast => {
      const regex = new RegExp(cast.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = sql.match(regex);
      castingCount[cast] = matches ? matches.length : 0;
    });

    console.log('✅ Type casting found:');
    Object.entries(castingCount).forEach(([cast, count]) => {
      console.log(`   ${cast}: ${count} occurrences`);
    });

    // Check for table references
    console.log('\n🔍 Checking for table references...');
    
    const tables = [
      'ia_users',
      'ia_tokens', 
      'po_polls',
      'po_votes',
      'feedback',
      'trending_topics',
      'generated_polls',
      'data_sources',
      'poll_generation_logs',
      'quality_metrics',
      'system_configuration',
      'audit_logs'
    ];

    const tableCount = {};
    tables.forEach(table => {
      const regex = new RegExp(table, 'g');
      const matches = sql.match(regex);
      tableCount[table] = matches ? matches.length : 0;
    });

    console.log('✅ Table references found:');
    Object.entries(tableCount).forEach(([table, count]) => {
      if (count > 0) {
        console.log(`   ${table}: ${count} references`);
      }
    });

    console.log('\n🎉 Security policies analysis complete!');
    console.log('\n📋 Next steps:');
    if (typeIssues.length > 0) {
      console.log('1. Fix the identified type issues');
      console.log('2. Test the SQL in Supabase dashboard');
      console.log('3. Deploy the corrected policies');
    } else {
      console.log('1. Deploy the security policies in Supabase dashboard');
      console.log('2. Test the policies with real data');
      console.log('3. Verify all access controls work correctly');
    }

  } catch (error) {
    console.error('❌ Error testing security policies:', error);
  }
}

function findLineNumber(text, searchString) {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchString)) {
      return i + 1;
    }
  }
  return 'unknown';
}

testSecurityPolicies();
