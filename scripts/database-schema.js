#!/usr/bin/env node

/**
 * Database Schema Inspector
 * 
 * Queries the database directly to generate a comprehensive schema
 * including tables, columns, indexes, constraints, and relationships.
 * 
 * SAFETY: Read-only operations only
 * 
 * Usage:
 *   node scripts/database-schema.js
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
  console.log('🔍 Database Schema Inspector');
  console.log('=' .repeat(50));
  console.log('⚠️  This script performs READ-ONLY operations only');
  console.log('');

  try {
    // 1. Get all tables
    const tables = await getTables();
    
    // 2. Get detailed table information
    const tableDetails = await getTableDetails(tables);
    
    // 3. Get indexes
    const indexes = await getIndexes();
    
    // 4. Get foreign keys
    const foreignKeys = await getForeignKeys();
    
    // 5. Get RLS policies
    const rlsPolicies = await getRLSPolicies();
    
    // 6. Generate schema documentation
    await generateSchemaDocumentation(tableDetails, indexes, foreignKeys, rlsPolicies);
    
    console.log('\n✅ Schema inspection complete - no data was modified');
    console.log('📄 Schema documentation saved to: docs/DATABASE_SCHEMA.md');
    
  } catch (error) {
    console.error('❌ Schema inspection failed:', error.message);
    process.exit(1);
  }
}

async function getTables() {
  console.log('📋 Getting table list...');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          tableowner,
          hasindexes,
          hasrules,
          hastriggers,
          rowsecurity
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
      `
    });
    
    if (data && Array.isArray(data)) {
      console.log(`✅ Found ${data.length} tables in public schema`);
      return data;
    }
    console.log('⚠️  No tables found or data format unexpected');
    return [];
  } catch (err) {
    console.log('⚠️  Could not get tables:', err.message);
    return [];
  }
}

async function getTableDetails(tables) {
  console.log('🔍 Getting detailed table information...');
  
  const tableDetails = [];
  
  if (!Array.isArray(tables)) {
    console.log('⚠️  Tables data is not an array, skipping detailed analysis');
    return tableDetails;
  }
  
  for (const table of tables) {
    try {
      // Get columns
      const { data: columns, error: colError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale,
            ordinal_position
          FROM information_schema.columns 
          WHERE table_schema = '${table.schemaname}' 
            AND table_name = '${table.tablename}'
          ORDER BY ordinal_position
        `
      });
      
      // Get constraints
      const { data: constraints, error: constError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            constraint_name,
            constraint_type,
            column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.constraint_column_usage ccu 
            ON tc.constraint_name = ccu.constraint_name
          WHERE tc.table_schema = '${table.schemaname}' 
            AND tc.table_name = '${table.tablename}'
        `
      });
      
      // Get table size
      const { data: size, error: sizeError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            pg_size_pretty(pg_total_relation_size('${table.schemaname}.${table.tablename}')) as size,
            n_live_tup as live_tuples,
            n_dead_tup as dead_tuples
          FROM pg_stat_user_tables 
          WHERE schemaname = '${table.schemaname}' 
            AND relname = '${table.tablename}'
        `
      });
      
      tableDetails.push({
        ...table,
        columns: columns || [],
        constraints: constraints || [],
        size: size?.[0] || {}
      });
      
    } catch (err) {
      console.log(`⚠️  Could not get details for ${table.tablename}:`, err.message);
    }
  }
  
  return tableDetails;
}

async function getIndexes() {
  console.log('🔍 Getting indexes...');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef,
          pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as size,
          idx_scan as scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes 
        ORDER BY schemaname, tablename, indexname
      `
    });
    
    if (data) {
      console.log(`✅ Found ${data.length} indexes`);
      return data;
    }
    return [];
  } catch (err) {
    console.log('⚠️  Could not get indexes:', err.message);
    return [];
  }
}

async function getForeignKeys() {
  console.log('🔍 Getting foreign keys...');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          tc.table_name,
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          tc.is_deferrable,
          tc.initially_deferred
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name, tc.constraint_name
      `
    });
    
    if (data) {
      console.log(`✅ Found ${data.length} foreign key constraints`);
      return data;
    }
    return [];
  } catch (err) {
    console.log('⚠️  Could not get foreign keys:', err.message);
    return [];
  }
}

async function getRLSPolicies() {
  console.log('🔍 Getting RLS policies...');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies 
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname
      `
    });
    
    if (data) {
      console.log(`✅ Found ${data.length} RLS policies`);
      return data;
    }
    return [];
  } catch (err) {
    console.log('⚠️  Could not get RLS policies:', err.message);
    return [];
  }
}

async function generateSchemaDocumentation(tableDetails, indexes, foreignKeys, rlsPolicies) {
  console.log('📄 Generating schema documentation...');
  
  const schemaDoc = `# Database Schema Documentation

Generated on: ${new Date().toISOString()}
Database: ${SUPABASE_URL}

## Overview

This document provides a comprehensive view of the database schema including tables, columns, indexes, constraints, and security policies.

## Tables

${tableDetails.map(table => generateTableDocumentation(table)).join('\n')}

## Indexes

${generateIndexesDocumentation(indexes)}

## Foreign Key Relationships

${generateForeignKeysDocumentation(foreignKeys)}

## Row Level Security (RLS) Policies

${generateRLSPoliciesDocumentation(rlsPolicies)}

## Summary

- **Total Tables**: ${tableDetails.length}
- **Total Indexes**: ${indexes.length}
- **Total Foreign Keys**: ${foreignKeys.length}
- **Total RLS Policies**: ${rlsPolicies.length}

---
*This documentation was generated automatically by the database schema inspector.*
`;

  // Ensure docs directory exists
  const docsDir = path.join(__dirname, '../docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  // Write documentation
  fs.writeFileSync(path.join(docsDir, 'DATABASE_SCHEMA.md'), schemaDoc);
}

function generateTableDocumentation(table) {
  const columns = table.columns.map(col => {
    const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
    const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
    const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
    return `  - **${col.column_name}**: ${col.data_type}${length} ${nullable}${defaultVal}`;
  }).join('\n');
  
  const constraints = table.constraints.map(constraint => {
    return `  - **${constraint.constraint_name}**: ${constraint.constraint_type} on ${constraint.column_name}`;
  }).join('\n');
  
  const size = table.size.size || 'Unknown';
  const liveTuples = table.size.live_tuples || 0;
  const deadTuples = table.size.dead_tuples || 0;
  
  return `### ${table.tablename}

**Schema**: ${table.schemaname}  
**Owner**: ${table.tableowner}  
**Size**: ${size}  
**Live Tuples**: ${liveTuples}  
**Dead Tuples**: ${deadTuples}  
**Row Security**: ${table.rowsecurity ? 'Enabled' : 'Disabled'}

#### Columns
${columns}

#### Constraints
${constraints || 'None'}

---
`;
}

function generateIndexesDocumentation(indexes) {
  if (indexes.length === 0) {
    return 'No indexes found.';
  }
  
  const groupedIndexes = indexes.reduce((acc, index) => {
    const key = `${index.schemaname}.${index.tablename}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(index);
    return acc;
  }, {});
  
  return Object.entries(groupedIndexes).map(([table, tableIndexes]) => {
    const indexList = tableIndexes.map(index => {
      const usage = index.scans > 0 ? `✅ Used (${index.scans} scans)` : '⚠️ Unused';
      return `  - **${index.indexname}**: ${index.size} - ${usage}`;
    }).join('\n');
    
    return `#### ${table}\n${indexList}`;
  }).join('\n\n');
}

function generateForeignKeysDocumentation(foreignKeys) {
  if (foreignKeys.length === 0) {
    return 'No foreign key constraints found.';
  }
  
  const groupedFKs = foreignKeys.reduce((acc, fk) => {
    const key = fk.table_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(fk);
    return acc;
  }, {});
  
  return Object.entries(groupedFKs).map(([table, fks]) => {
    const fkList = fks.map(fk => {
      return `  - **${fk.constraint_name}**: ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`;
    }).join('\n');
    
    return `#### ${table}\n${fkList}`;
  }).join('\n\n');
}

function generateRLSPoliciesDocumentation(rlsPolicies) {
  if (rlsPolicies.length === 0) {
    return 'No RLS policies found.';
  }
  
  const groupedPolicies = rlsPolicies.reduce((acc, policy) => {
    const key = `${policy.schemaname}.${policy.tablename}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(policy);
    return acc;
  }, {});
  
  return Object.entries(groupedPolicies).map(([table, policies]) => {
    const policyList = policies.map(policy => {
      const permissive = policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE';
      return `  - **${policy.policyname}**: ${policy.cmd} (${permissive})`;
    }).join('\n');
    
    return `#### ${table}\n${policyList}`;
  }).join('\n\n');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
