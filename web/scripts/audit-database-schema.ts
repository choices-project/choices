#!/usr/bin/env tsx
/**
 * Database Schema Audit Script
 * Queries Supabase directly to verify actual schema vs. code expectations
 */

import { createClient } from '@supabase/supabase-js';

import type { Database } from '../utils/supabase/database.types';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

type TableInfo = {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

type FunctionInfo = {
  routine_name: string;
  routine_type: string;
}

type TableColumn = {
  name: string;
  type: string;
  nullable: boolean;
  default: string | null;
}

type AuditResult = {
  tables: Record<string, TableColumn[]>;
  functions: string[];
  missingTables: string[];
  missingColumns: Record<string, string[]>;
  missingFunctions: string[];
  redundantImplementations: string[];
}

async function queryTables(): Promise<Record<string, TableColumn[]>> {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name NOT LIKE 'pg_%'
        AND table_name NOT LIKE '_prisma_%'
      ORDER BY table_name, ordinal_position;
    `
  });

  if (error) {
    console.error('Error querying tables:', error);
    return {};
  }

  const tables: Record<string, TableColumn[]> = {};
  
  if (data && Array.isArray(data)) {
    (data as unknown as TableInfo[]).forEach((row) => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      tables[row.table_name].push({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        default: row.column_default
      });
    });
  }

  return tables;
}

async function queryFunctions(): Promise<string[]> {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        routine_name,
        routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
      ORDER BY routine_name;
    `
  });

  if (error) {
    console.error('Error querying functions:', error);
    return [];
  }

  if (data && Array.isArray(data)) {
    return (data as unknown as FunctionInfo[]).map(f => f.routine_name);
  }

  return [];
}

async function checkTableExists(tableName: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      );
    `
  });

  if (error) {
    return false;
  }

  return data === true || (Array.isArray(data) && data.length > 0);
}

async function auditSchema(): Promise<AuditResult> {
  console.log('🔍 Querying Supabase database schema...\n');

  const tables = await queryTables();
  const functions = await queryFunctions();

  console.log(`✅ Found ${Object.keys(tables).length} tables`);
  console.log(`✅ Found ${functions.length} functions\n`);

  // Check for tables referenced in code
  const expectedTables = [
    'performance_metrics',
    'query_performance_log',
    'cache_performance_log',
    'user_consent',
    'trust_tier_analytics',
    'polls',
    'votes',
    'civic_actions'
  ];

  const missingTables: string[] = [];
  for (const table of expectedTables) {
    if (!tables[table]) {
      missingTables.push(table);
    }
  }

  // Check for missing columns
  const missingColumns: Record<string, string[]> = {};

  // Check trust_tier_analytics columns
  if (tables['trust_tier_analytics']) {
    const expectedColumns = [
      'poll_id',
      'age_group',
      'geographic_region',
      'education_level',
      'income_bracket',
      'political_affiliation',
      'voting_history_count',
      'biometric_verified',
      'phone_verified',
      'identity_verified',
      'verification_methods',
      'data_quality_score',
      'confidence_level',
      'last_activity'
    ];
    const existingColumns = tables['trust_tier_analytics'].map(c => c.name);
    missingColumns['trust_tier_analytics'] = expectedColumns.filter(
      col => !existingColumns.includes(col)
    );
  }

  // Check polls columns
  if (tables['polls']) {
    const expectedColumns = ['allow_multiple_votes'];
    const existingColumns = tables['polls'].map(c => c.name);
    missingColumns['polls'] = expectedColumns.filter(
      col => !existingColumns.includes(col)
    );
  }

  // Check civic_actions columns
  if (tables['civic_actions']) {
    const expectedColumns = ['category'];
    const existingColumns = tables['civic_actions'].map(c => c.name);
    missingColumns['civic_actions'] = expectedColumns.filter(
      col => !existingColumns.includes(col)
    );
  }

  // Check for missing RPC functions
  const expectedFunctions = [
    'analyze_query_performance',
    'update_cache_performance_metrics',
    'run_maintenance_job',
    'get_performance_recommendations',
    'cleanup_performance_data'
  ];

  const missingFunctions = expectedFunctions.filter(
    func => !functions.includes(func)
  );

  return {
    tables,
    functions,
    missingTables,
    missingColumns,
    missingFunctions,
    redundantImplementations: [] // Will be populated by code analysis
  };
}

async function main() {
  try {
    const result = await auditSchema();

    console.log('\n📊 AUDIT RESULTS\n');
    console.log('='.repeat(60));

    // Missing Tables
    console.log('\n❌ MISSING TABLES:');
    if (result.missingTables.length === 0) {
      console.log('  ✅ All expected tables exist');
    } else {
      result.missingTables.forEach(table => {
        console.log(`  - ${table}`);
      });
    }

    // Missing Columns
    console.log('\n❌ MISSING COLUMNS:');
    const hasMissingColumns = Object.keys(result.missingColumns).some(
      table => result.missingColumns[table].length > 0
    );
    if (!hasMissingColumns) {
      console.log('  ✅ All expected columns exist');
    } else {
      Object.entries(result.missingColumns).forEach(([table, columns]) => {
        if (columns.length > 0) {
          console.log(`  ${table}:`);
          columns.forEach(col => console.log(`    - ${col}`));
        }
      });
    }

    // Missing Functions
    console.log('\n❌ MISSING RPC FUNCTIONS:');
    if (result.missingFunctions.length === 0) {
      console.log('  ✅ All expected functions exist');
    } else {
      result.missingFunctions.forEach(func => {
        console.log(`  - ${func}`);
      });
    }

    // Existing Tables Summary
    console.log('\n✅ EXISTING TABLES:');
    const tableNames = Object.keys(result.tables).sort();
    tableNames.forEach(table => {
      const columnCount = result.tables[table].length;
      console.log(`  - ${table} (${columnCount} columns)`);
    });

    // Existing Functions Summary
    console.log('\n✅ EXISTING RPC FUNCTIONS:');
    if (result.functions.length === 0) {
      console.log('  (none found)');
    } else {
      result.functions.slice(0, 20).forEach(func => {
        console.log(`  - ${func}`);
      });
      if (result.functions.length > 20) {
        console.log(`  ... and ${result.functions.length - 20} more`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📝 Detailed schema information saved to audit-results.json\n');

    // Save detailed results
    const fs = await import('fs/promises');
    await fs.writeFile(
      'audit-results.json',
      JSON.stringify(result, null, 2)
    );

  } catch (error) {
    console.error('Error during audit:', error);
    process.exit(1);
  }
}

main();

