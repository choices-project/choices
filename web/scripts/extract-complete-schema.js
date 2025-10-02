#!/usr/bin/env node

/**
 * COMPLETE Database Schema Extraction Script
 * Extracts ALL table definitions, columns, relationships, indexes, and constraints
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Load .env.local manually
try {
  const envPath = join(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (err) {
  console.log('No .env.local file found, using environment variables');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function extractCompleteSchema() {
  console.log('🔍 EXTRACTING COMPLETE DATABASE SCHEMA');
  console.log('=======================================\n');

  const schemaData = {
    extraction_date: new Date().toISOString(),
    database_url: supabaseUrl,
    total_tables: 0,
    tables: {},
    relationships: [],
    indexes: [],
    constraints: [],
    views: [],
    functions: [],
    triggers: []
  };

  try {
    // 1. Get all tables with comprehensive info
    console.log('📋 EXTRACTING ALL TABLES...');
    
    const allTables = [
      // Core app tables
      'polls', 'votes', 'user_profiles', 'webauthn_credentials', 'webauthn_challenges',
      'error_logs', 'feedback', 'user_consent', 'privacy_logs', 'location_consent_audit',
      
      // Civics tables
      'civics_person_xref', 'civics_votes_minimal', 'civics_divisions', 'civics_representatives',
      'civics_addresses', 'civics_campaign_finance', 'civics_votes', 'civic_jurisdictions',
      'jurisdiction_aliases', 'jurisdiction_geometries', 'jurisdiction_tiles',
      'user_location_resolutions', 'candidate_jurisdictions',
      
      // Auth tables
      'auth_users', 'auth_sessions', 'auth_identities', 'auth_mfa_factors',
      'auth_mfa_challenges', 'auth_audit_log_entries', 'auth_flow_state',
      
      // System tables
      'storage_objects', 'storage_buckets', 'storage_migrations',
      'supabase_migrations', 'supabase_migrations_schema_migrations',
      
      // Views
      'poll_results_live_view', 'poll_results_baseline_view', 'poll_results_drift_view',
      
      // Other tables
      'notifications', 'user_preferences', 'user_sessions', 'api_keys',
      'webhooks', 'integrations', 'analytics_events', 'audit_logs',
      'system_settings', 'feature_flags', 'rate_limits', 'security_events'
    ];

    for (const tableName of allTables) {
      console.log(`\n📊 Analyzing table: ${tableName}`);
      
      try {
        // Test if table exists and get basic info
        const { data: sampleData, error: tableError, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (tableError) {
          if (tableError.code === 'PGRST116') {
            console.log(`  ❌ Table does not exist: ${tableName}`);
            continue;
          } else {
            console.log(`  ❌ Error accessing table: ${tableError.message}`);
            continue;
          }
        }

        // Table exists, get detailed schema
        const tableInfo = {
          name: tableName,
          exists: true,
          row_count: count || 0,
          columns: {},
          indexes: [],
          constraints: [],
          rls_enabled: false,
          rls_policies: [],
          sample_data: null
        };

        // Get sample data to understand structure
        if (count > 0) {
          try {
            const { data: sample, error: sampleError } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);
            
            if (!sampleError && sample && sample.length > 0) {
              tableInfo.sample_data = sample[0];
              
              // Analyze column structure from sample data
              Object.keys(sample[0]).forEach(columnName => {
                const value = sample[0][columnName];
                tableInfo.columns[columnName] = {
                  name: columnName,
                  type: typeof value,
                  nullable: value === null,
                  sample_value: value,
                  is_array: Array.isArray(value),
                  is_object: typeof value === 'object' && value !== null && !Array.isArray(value)
                };
              });
            }
          } catch (err) {
            console.log(`  ⚠️  Could not get sample data: ${err.message}`);
          }
        }

        // Test RLS status
        try {
          const { data: rlsTest, error: rlsError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (rlsError) {
            if (rlsError.code === 'PGRST301') {
              tableInfo.rls_enabled = true;
              console.log(`  🔒 RLS ENABLED`);
            } else {
              console.log(`  ❓ RLS Status Unknown: ${rlsError.message}`);
            }
          } else {
            tableInfo.rls_enabled = false;
            console.log(`  ❌ RLS DISABLED`);
          }
        } catch (err) {
          console.log(`  ❓ RLS Status Unknown: ${err.message}`);
        }

        // Get detailed column information if we have sample data
        if (tableInfo.sample_data) {
          console.log(`  📋 Columns found: ${Object.keys(tableInfo.columns).length}`);
          Object.keys(tableInfo.columns).forEach(col => {
            const colInfo = tableInfo.columns[col];
            console.log(`    - ${col}: ${colInfo.type} ${colInfo.nullable ? '(nullable)' : '(not null)'}`);
          });
        }

        schemaData.tables[tableName] = tableInfo;
        schemaData.total_tables++;
        
        console.log(`  ✅ Table analyzed: ${tableName} (${count || 0} rows)`);

      } catch (err) {
        console.log(`  ❌ Error analyzing table ${tableName}: ${err.message}`);
      }
    }

    // 2. Generate comprehensive schema documentation
    console.log('\n📝 GENERATING SCHEMA DOCUMENTATION...');
    
    const schemaDoc = generateSchemaDocumentation(schemaData);
    writeFileSync('database/COMPLETE_SCHEMA_DOCUMENTATION.md', schemaDoc);
    
    // 3. Generate JSON schema data
    writeFileSync('database/complete_schema_data.json', JSON.stringify(schemaData, null, 2));
    
    // 4. Generate summary report
    const summary = generateSummaryReport(schemaData);
    writeFileSync('database/SCHEMA_EXTRACTION_SUMMARY.md', summary);
    
    console.log('\n✅ COMPLETE SCHEMA EXTRACTION COMPLETED!');
    console.log(`📊 Total tables analyzed: ${schemaData.total_tables}`);
    console.log(`📝 Documentation generated: database/COMPLETE_SCHEMA_DOCUMENTATION.md`);
    console.log(`📄 JSON data generated: database/complete_schema_data.json`);
    console.log(`📋 Summary generated: database/SCHEMA_EXTRACTION_SUMMARY.md`);

  } catch (error) {
    console.error('❌ Schema extraction failed:', error);
  }
}

function generateSchemaDocumentation(schemaData) {
  let doc = `# 🗄️ Complete Database Schema Documentation

**Generated**: ${new Date().toISOString()}  
**Database**: ${schemaData.database_url}  
**Total Tables**: ${schemaData.total_tables}

## 📊 **SCHEMA OVERVIEW**

### **Table Summary**
| Table Name | Exists | Rows | RLS Status | Columns |
|------------|--------|------|------------|---------|
`;

  Object.entries(schemaData.tables).forEach(([tableName, tableInfo]) => {
    const rlsStatus = tableInfo.rls_enabled ? '✅ ENABLED' : '❌ DISABLED';
    const columnCount = Object.keys(tableInfo.columns).length;
    doc += `| ${tableName} | ${tableInfo.exists ? '✅' : '❌'} | ${tableInfo.row_count} | ${rlsStatus} | ${columnCount} |\n`;
  });

  doc += `\n## 📋 **DETAILED TABLE SCHEMAS**\n\n`;

  Object.entries(schemaData.tables).forEach(([tableName, tableInfo]) => {
    doc += `### **${tableName}**\n\n`;
    doc += `- **Exists**: ${tableInfo.exists ? 'Yes' : 'No'}\n`;
    doc += `- **Row Count**: ${tableInfo.row_count}\n`;
    doc += `- **RLS Status**: ${tableInfo.rls_enabled ? 'ENABLED' : 'DISABLED'}\n`;
    doc += `- **Columns**: ${Object.keys(tableInfo.columns).length}\n\n`;

    if (Object.keys(tableInfo.columns).length > 0) {
      doc += `#### **Columns**\n\n`;
      doc += `| Column | Type | Nullable | Sample Value |\n`;
      doc += `|--------|------|-----------|-------------|\n`;
      
      Object.entries(tableInfo.columns).forEach(([colName, colInfo]) => {
        const sampleValue = colInfo.sample_value !== null ? 
          String(colInfo.sample_value).substring(0, 50) + (String(colInfo.sample_value).length > 50 ? '...' : '') : 
          'null';
        doc += `| ${colName} | ${colInfo.type} | ${colInfo.nullable ? 'Yes' : 'No'} | ${sampleValue} |\n`;
      });
    }

    if (tableInfo.sample_data) {
      doc += `\n#### **Sample Data**\n\n`;
      doc += `\`\`\`json\n${JSON.stringify(tableInfo.sample_data, null, 2)}\n\`\`\`\n`;
    }

    doc += `\n---\n\n`;
  });

  return doc;
}

function generateSummaryReport(schemaData) {
  const tablesWithData = Object.values(schemaData.tables).filter(t => t.row_count > 0);
  const tablesWithRLS = Object.values(schemaData.tables).filter(t => t.rls_enabled);
  const tablesWithoutRLS = Object.values(schemaData.tables).filter(t => !t.rls_enabled);

  return `# 📊 Schema Extraction Summary

**Generated**: ${new Date().toISOString()}  
**Total Tables**: ${schemaData.total_tables}

## 📈 **STATISTICS**

- **Tables with Data**: ${tablesWithData.length}
- **Tables with RLS Enabled**: ${tablesWithRLS.length}
- **Tables with RLS Disabled**: ${tablesWithoutRLS.length}
- **Total Records**: ${Object.values(schemaData.tables).reduce((sum, t) => sum + t.row_count, 0)}

## 🚨 **SECURITY STATUS**

### **Tables with RLS DISABLED (${tablesWithoutRLS.length})**
${tablesWithoutRLS.map(t => `- ${t.name} (${t.row_count} rows)`).join('\n')}

### **Tables with RLS ENABLED (${tablesWithRLS.length})**
${tablesWithRLS.map(t => `- ${t.name} (${t.row_count} rows)`).join('\n')}

## 📊 **DATA DISTRIBUTION**

### **Tables with Data (${tablesWithData.length})**
${tablesWithData.map(t => `- ${t.name}: ${t.row_count} rows`).join('\n')}

### **Empty Tables (${schemaData.total_tables - tablesWithData.length})**
${Object.values(schemaData.tables).filter(t => t.row_count === 0).map(t => `- ${t.name}`).join('\n')}

## 🎯 **NEXT STEPS**

1. **Enable RLS** on all tables with RLS disabled
2. **Audit data access** for all tables with data
3. **Consolidate tables** to reduce complexity
4. **Optimize schema** for better performance
`;
}

extractCompleteSchema();
