#!/usr/bin/env node

/**
 * Safe Supabase Database Inspection Script
 * 
 * This script provides safe, read-only inspection of your Supabase database
 * to help identify performance issues, unused indexes, and optimization opportunities.
 * 
 * SAFETY FEATURES:
 * - Read-only operations only
 * - No data modification
 * - No schema changes
 * - Safe error handling
 * 
 * Usage:
 *   node scripts/supabase-inspection.js
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
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in web/.env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('🔍 Safe Supabase Database Inspection');
  console.log('=' .repeat(50));
  console.log('⚠️  This script performs READ-ONLY operations only');
  console.log('');

  try {
    // 1. Database Overview
    await getDatabaseOverview();
    
    // 2. Cache Performance
    await getCachePerformance();
    
    // 3. Index Analysis
    await getIndexAnalysis();
    
    // 4. Table Statistics
    await getTableStatistics();
    
    // 5. Query Performance (if available)
    await getQueryPerformance();
    
    console.log('\n✅ Inspection complete - no data was modified');
    
  } catch (error) {
    console.error('❌ Inspection failed:', error.message);
    console.log('This is a safe error - no data was modified');
    process.exit(1);
  }
}

async function getDatabaseOverview() {
  console.log('\n📊 DATABASE OVERVIEW');
  console.log('-'.repeat(30));
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as database_size,
          (SELECT count(*) FROM pg_stat_user_tables) as user_tables,
          (SELECT count(*) FROM pg_stat_user_indexes) as user_indexes,
          (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as public_tables
      `
    });
    
    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : data;
    
    console.log(`Database Size: ${result?.database_size || 'Unknown'}`);
    console.log(`User Tables: ${result?.user_tables || 'Unknown'}`);
    console.log(`User Indexes: ${result?.user_indexes || 'Unknown'}`);
    console.log(`Public Tables: ${result?.public_tables || 'Unknown'}`);
    
  } catch (err) {
    console.log('⚠️  Could not get database overview:', err.message);
  }
}

async function getCachePerformance() {
  console.log('\n💾 CACHE PERFORMANCE');
  console.log('-'.repeat(30));
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          'index hit rate' as name,
          (sum(idx_blks_hit)) / nullif(sum(idx_blks_hit + idx_blks_read), 0) * 100 as ratio
        FROM pg_statio_user_indexes
        UNION ALL
        SELECT 
          'table hit rate' as name,
          sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100 as ratio
        FROM pg_statio_user_tables
      `
    });
    
    if (error) throw error;
    const results = Array.isArray(data) ? data : [];
    
    results.forEach(rate => {
      const status = rate.ratio >= 99 ? '✅' : '⚠️';
      console.log(`${status} ${rate.name}: ${rate.ratio?.toFixed(2) || 'Unknown'}%`);
    });
    
  } catch (err) {
    console.log('⚠️  Could not get cache performance:', err.message);
  }
}

async function getIndexAnalysis() {
  console.log('\n🔍 INDEX ANALYSIS');
  console.log('-'.repeat(30));
  
  try {
    // Get unused indexes
    const { data: unused, error: unusedError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          indexname,
          pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as size
        FROM pg_stat_user_indexes 
        WHERE idx_scan = 0
        ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC
        LIMIT 10
      `
    });
    
    if (!unusedError) {
      const unusedResults = Array.isArray(unused) ? unused : [];
      if (unusedResults.length === 0) {
        console.log('✅ No unused indexes found');
      } else {
        console.log(`⚠️  Found ${unusedResults.length} unused indexes:`);
        unusedResults.forEach((index, i) => {
          console.log(`  ${i+1}. ${index.indexname} (${index.size})`);
        });
      }
    }
    
    // Get largest indexes
    const { data: largest, error: largestError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          indexname,
          pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as size,
          idx_scan as scans
        FROM pg_stat_user_indexes 
        ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC
        LIMIT 5
      `
    });
    
    if (!largestError) {
      const largestResults = Array.isArray(largest) ? largest : [];
      console.log('\nTop 5 indexes by size:');
      largestResults.forEach((index, i) => {
        console.log(`  ${i+1}. ${index.indexname} (${index.size}) - ${index.scans} scans`);
      });
    }
    
  } catch (err) {
    console.log('⚠️  Could not get index analysis:', err.message);
  }
}

async function getTableStatistics() {
  console.log('\n📋 TABLE STATISTICS');
  console.log('-'.repeat(30));
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          CASE 
            WHEN n_live_tup > 0 THEN (n_dead_tup::float / n_live_tup::float) * 100
            ELSE 0
          END as bloat_percentage
        FROM pg_stat_user_tables 
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `
    });
    
    if (error) throw error;
    const results = Array.isArray(data) ? data : [];
    
    console.log('Top 10 tables by size:');
    results.forEach((table, i) => {
      const bloatStatus = table.bloat_percentage > 10 ? '⚠️' : '✅';
      console.log(`  ${i+1}. ${table.schemaname}.${table.tablename} (${table.size}) ${bloatStatus}`);
      if (table.bloat_percentage > 10) {
        console.log(`     Bloat: ${table.bloat_percentage?.toFixed(2) || 'Unknown'}%`);
      }
    });
    
  } catch (err) {
    console.log('⚠️  Could not get table statistics:', err.message);
  }
}

async function getQueryPerformance() {
  console.log('\n⚡ QUERY PERFORMANCE');
  console.log('-'.repeat(30));
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          query,
          calls,
          total_exec_time,
          mean_exec_time,
          max_exec_time
        FROM pg_stat_statements 
        ORDER BY total_exec_time DESC 
        LIMIT 3
      `
    });
    
    if (error) throw error;
    const results = Array.isArray(data) ? data : [];
    
    if (results.length === 0) {
      console.log('ℹ️  No query performance data available (pg_stat_statements may not be enabled)');
    } else {
      console.log('Top 3 queries by total execution time:');
      results.forEach((query, i) => {
        const truncatedQuery = query.query.length > 80 ? query.query.substring(0, 80) + '...' : query.query;
        console.log(`  ${i+1}. ${truncatedQuery}`);
        console.log(`     Calls: ${query.calls}, Total: ${query.total_exec_time?.toFixed(2)}ms, Mean: ${query.mean_exec_time?.toFixed(2)}ms`);
      });
    }
    
  } catch (err) {
    console.log('ℹ️  Query performance data not available:', err.message);
  }
}

// Safe error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Unexpected error:', error.message);
  console.log('This is a safe error - no data was modified');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled promise rejection:', reason);
  console.log('This is a safe error - no data was modified');
  process.exit(1);
});

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };

