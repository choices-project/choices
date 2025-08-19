#!/usr/bin/env node

/**
 * Check Supabase Health and Identify Warnings
 * 
 * This script analyzes our current Supabase usage and identifies potential warnings
 * that might be causing issues with our provider.
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../web/.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkDatabaseHealth() {
  console.log('🔍 Checking Database Health...\n');
  
  try {
    // Test basic connectivity
    console.log('1. Testing basic connectivity...');
    const startTime = Date.now();
    const { data: connectionTest, error: connectionError } = await supabase
      .from('ia_users')
      .select('count')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (connectionError) {
      console.error('❌ Connection test failed:', connectionError.message);
      return false;
    }
    
    console.log(`✅ Connection successful (${responseTime}ms)`);
    
    // Test query performance
    console.log('\n2. Testing query performance...');
    const queryStart = Date.now();
    const { data: queryTest, error: queryError } = await supabase
      .from('po_polls')
      .select('poll_id, title, status')
      .eq('status', 'active')
      .limit(10);
    
    const queryTime = Date.now() - queryStart;
    
    if (queryError) {
      console.error('❌ Query test failed:', queryError.message);
      return false;
    }
    
    console.log(`✅ Query successful (${queryTime}ms)`);
    
    // Performance analysis
    if (queryTime > 1000) {
      console.warn('⚠️  Slow query detected (>1000ms)');
    } else if (queryTime > 500) {
      console.warn('⚠️  Query could be optimized (>500ms)');
    } else {
      console.log('✅ Query performance is good');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function checkTableStructure() {
  console.log('\n📋 Checking Table Structure...\n');
  
  try {
    // Check key tables
    const tables = [
      'ia_users',
      'po_polls', 
      'feedback',
      'trending_topics',
      'generated_polls'
    ];
    
    for (const table of tables) {
      console.log(`Checking table: ${table}`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Error accessing ${table}:`, error.message);
      } else {
        console.log(`✅ ${table} accessible`);
      }
    }
  } catch (error) {
    console.error('❌ Table structure check failed:', error.message);
  }
}

async function checkRLSPolicies() {
  console.log('\n🔒 Checking RLS Policies...\n');
  
  try {
    // Check if RLS is enabled on key tables
    const { data: rlsData, error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          rowsecurity as rls_enabled
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename IN ('ia_users', 'po_polls', 'feedback', 'trending_topics', 'generated_polls')
        ORDER BY tablename;
      `
    });
    
    if (rlsError) {
      console.error('❌ RLS check failed:', rlsError.message);
      return;
    }
    
    console.log('RLS Status:');
    rlsData.forEach(row => {
      const status = row.rls_enabled ? '✅ Enabled' : '❌ Disabled';
      console.log(`  ${row.tablename}: ${status}`);
    });
  } catch (error) {
    console.error('❌ RLS policy check failed:', error.message);
  }
}

async function checkIndexes() {
  console.log('\n📊 Checking Database Indexes...\n');
  
  try {
    const { data: indexData, error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
        AND tablename IN ('ia_users', 'po_polls', 'feedback', 'trending_topics', 'generated_polls')
        ORDER BY tablename, indexname;
      `
    });
    
    if (indexError) {
      console.error('❌ Index check failed:', indexError.message);
      return;
    }
    
    console.log('Database Indexes:');
    const tableIndexes = {};
    
    indexData.forEach(row => {
      if (!tableIndexes[row.tablename]) {
        tableIndexes[row.tablename] = [];
      }
      tableIndexes[row.tablename].push(row.indexname);
    });
    
    Object.entries(tableIndexes).forEach(([table, indexes]) => {
      console.log(`  ${table}: ${indexes.length} indexes`);
      indexes.forEach(index => {
        console.log(`    - ${index}`);
      });
    });
  } catch (error) {
    console.error('❌ Index check failed:', error.message);
  }
}

async function checkConnectionPool() {
  console.log('\n🔗 Checking Connection Pool...\n');
  
  try {
    // Test multiple concurrent connections
    console.log('Testing connection pool with concurrent requests...');
    
    const promises = Array.from({ length: 5 }, (_, i) => 
      supabase
        .from('ia_users')
        .select('count')
        .limit(1)
        .then(() => ({ success: true, id: i }))
        .catch(error => ({ success: false, id: i, error: error.message }))
    );
    
    const results = await Promise.all(promises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Concurrent connections: ${successful} successful, ${failed} failed`);
    
    if (failed > 0) {
      console.warn('⚠️  Some concurrent connections failed - check connection pool settings');
    }
  } catch (error) {
    console.error('❌ Connection pool test failed:', error.message);
  }
}

async function generateRecommendations() {
  console.log('\n💡 Recommendations for Supabase Optimization...\n');
  
  const recommendations = [
    {
      category: 'Query Optimization',
      items: [
        'Use specific field selection instead of select(*)',
        'Implement proper pagination with limit() and range()',
        'Add indexes for frequently queried columns',
        'Use batch operations for multiple records'
      ]
    },
    {
      category: 'Connection Management',
      items: [
        'Reuse Supabase client instances',
        'Implement proper error handling',
        'Use connection pooling effectively',
        'Monitor connection usage'
      ]
    },
    {
      category: 'Performance Monitoring',
      items: [
        'Monitor query performance in Supabase dashboard',
        'Set up alerts for slow queries',
        'Track connection pool usage',
        'Monitor error rates'
      ]
    },
    {
      category: 'Security Best Practices',
      items: [
        'Enable Row Level Security (RLS) on all tables',
        'Use service role only for admin operations',
        'Implement proper access policies',
        'Regular security audits'
      ]
    }
  ];
  
  recommendations.forEach(rec => {
    console.log(`${rec.category}:`);
    rec.items.forEach(item => {
      console.log(`  • ${item}`);
    });
    console.log('');
  });
}

async function main() {
  console.log('🔍 Supabase Health Check and Warning Analysis');
  console.log('============================================\n');
  
  try {
    // Run all health checks
    const healthOk = await checkDatabaseHealth();
    if (!healthOk) {
      console.error('❌ Database health check failed');
      return;
    }
    
    await checkTableStructure();
    await checkRLSPolicies();
    await checkIndexes();
    await checkConnectionPool();
    await generateRecommendations();
    
    console.log('\n🎉 Health check completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Review any warnings or errors above');
    console.log('2. Implement the recommendations provided');
    console.log('3. Monitor Supabase dashboard for improvements');
    console.log('4. Contact Supabase support if issues persist');
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
