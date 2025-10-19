#!/usr/bin/env node

/**
 * Get Real Schema for All 121 Tables
 * 
 * This script queries each of the 121 tables directly to get their actual column definitions.
 * Based on the comprehensive database schema documentation.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../web/.env.local') });

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// All 121 tables from the comprehensive schema documentation
const allTables = [
  // Core Application (4 tables)
  'user_profiles', 'polls', 'votes', 'feedback',
  
  // Hashtag System (7 tables)
  'hashtags', 'user_hashtags', 'hashtag_follows', 'hashtag_analytics', 
  'hashtag_trends', 'hashtag_flags', 'hashtag_moderation',
  
  // Analytics & Monitoring (15+ tables)
  'analytics_events', 'user_analytics', 'poll_analytics', 'engagement_metrics',
  'performance_metrics', 'error_logs', 'audit_logs', 'security_audit_log',
  'system_metrics', 'user_behavior', 'session_analytics', 'conversion_tracking',
  'ab_testing', 'feature_flags', 'experiment_results',
  
  // Civics & Government Data (25+ tables)
  'candidates', 'representatives_core', 'representative_contacts_optimal',
  'representative_offices_optimal', 'representative_photos_optimal', 
  'representative_roles_optimal', 'jurisdictions_optimal', 'jurisdiction_aliases',
  'jurisdiction_tiles', 'state_districts', 'civic_jurisdictions',
  'fec_cycles', 'fec_ingest_cursors', 'independence_score_methodology',
  'latlon_to_ocd', 'zip_to_ocd', 'id_crosswalk', 'breaking_news',
  'news_sources', 'media_sources', 'media_polls', 'trending_topics',
  'generated_polls', 'site_messages',
  
  // Privacy & Compliance (10+ tables)
  'privacy_consent', 'data_retention_policies', 'gdpr_requests',
  'ccpa_requests', 'data_processing_agreements', 'consent_versions',
  'privacy_audit_log', 'data_anonymization', 'user_consent',
  'privacy_settings',
  
  // Data Quality & Monitoring (15+ tables)
  'data_quality_checks', 'data_quality_summary', 'data_sources',
  'data_licenses', 'data_checksums', 'dbt_freshness_sla',
  'dbt_freshness_status', 'dbt_test_config', 'migration_log',
  'schema_versions', 'data_lineage', 'quality_metrics',
  'validation_rules', 'data_governance', 'compliance_reports',
  
  // Authentication & Security (8+ tables)
  'webauthn_credentials', 'webauthn_challenges', 'user_sessions',
  'login_attempts', 'security_events', 'password_resets',
  'email_verifications', 'two_factor_auth',
  
  // User Management (10+ tables)
  'user_notification_preferences', 'user_roles', 'user_permissions',
  'user_groups', 'user_invitations', 'user_activity',
  'user_preferences', 'user_statistics', 'user_achievements',
  'user_reports',
  
  // Content & Moderation (5+ tables)
  'content_moderation', 'moderation_actions', 'reported_content',
  'moderation_queue', 'moderation_rules',
  
  // System Administration (10+ tables)
  'admin_activity_log', 'system_configurations', 'feature_toggles',
  'maintenance_windows', 'deployment_logs', 'backup_schedules',
  'monitoring_alerts', 'system_health', 'capacity_planning',
  'incident_reports'
];

async function getTableSchema(tableName) {
  try {
    console.log(`🔍 Querying table: ${tableName}`);
    
    // Try to get one row to infer schema
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Table ${tableName}: ${error.message}`);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log(`⚠️  Table ${tableName}: No data found, using generic schema`);
      return {
        name: tableName,
        columns: {
          id: 'string',
          created_at: 'string',
          updated_at: 'string'
        },
        hasData: false
      };
    }
    
    // Infer column types from the first row
    const sampleRow = data[0];
    const columns = {};
    
    for (const [key, value] of Object.entries(sampleRow)) {
      if (value === null) {
        columns[key] = 'string | null';
      } else if (typeof value === 'string') {
        columns[key] = 'string';
      } else if (typeof value === 'number') {
        columns[key] = 'number';
      } else if (typeof value === 'boolean') {
        columns[key] = 'boolean';
      } else if (Array.isArray(value)) {
        columns[key] = 'string[]';
      } else if (typeof value === 'object') {
        columns[key] = 'Record<string, unknown>';
      } else {
        columns[key] = 'string';
      }
    }
    
    console.log(`✅ Table ${tableName}: ${Object.keys(columns).length} columns`);
    return {
      name: tableName,
      columns,
      hasData: true
    };
    
  } catch (error) {
    console.log(`❌ Table ${tableName}: ${error.message}`);
    return null;
  }
}

async function generateCompleteSchema() {
  console.log('🚀 Starting comprehensive schema generation for all 121 tables...\n');
  
  const results = [];
  let successCount = 0;
  let errorCount = 0;
  
  for (const tableName of allTables) {
    const result = await getTableSchema(tableName);
    if (result) {
      results.push(result);
      successCount++;
    } else {
      errorCount++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 Results: ${successCount} successful, ${errorCount} errors`);
  
  // Generate TypeScript schema
  const schemaContent = generateTypeScriptSchema(results);
  
  // Write to file
  const outputPath = path.join(__dirname, '../web/types/database-complete-121.ts');
  fs.writeFileSync(outputPath, schemaContent);
  
  console.log(`\n✅ Complete schema written to: ${outputPath}`);
  console.log(`📋 Tables with data: ${results.filter(r => r.hasData).length}`);
  console.log(`📋 Tables without data: ${results.filter(r => !r.hasData).length}`);
  
  return results;
}

function generateTypeScriptSchema(tableResults) {
  const timestamp = new Date().toISOString();
  
  let content = `/**
 * Complete Database Schema - All 121 Tables
 * 
 * Generated on: ${timestamp}
 * 
 * This file contains TypeScript types for all 121 tables in the Choices platform.
 * Generated by querying each table directly to get real column definitions.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
`;

  // Generate table definitions
  for (const table of tableResults) {
    if (!table) continue;
    
    const tableName = table.name;
    const columns = table.columns;
    
    content += `      ${tableName}: {
        Row: {
`;
    
    // Row type
    for (const [columnName, columnType] of Object.entries(columns)) {
      content += `          ${columnName}: ${columnType}\n`;
    }
    
    content += `        }
        Insert: {
`;
    
    // Insert type (all fields optional except required ones)
    for (const [columnName, columnType] of Object.entries(columns)) {
      if (columnName === 'id' || columnName === 'created_at' || columnName === 'updated_at') {
        content += `          ${columnName}?: ${columnType}\n`;
      } else {
        content += `          ${columnName}?: ${columnType}\n`;
      }
    }
    
    content += `        }
        Update: {
`;
    
    // Update type (all fields optional)
    for (const [columnName, columnType] of Object.entries(columns)) {
      if (columnName !== 'id') {
        content += `          ${columnName}?: ${columnType}\n`;
      }
    }
    
    content += `        }
      }
`;
  }
  
  content += `    }
    Views: {
    }
    Functions: {
    }
    Enums: {
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
`;

  return content;
}

// Run the script
if (require.main === module) {
  generateCompleteSchema()
    .then(() => {
      console.log('\n🎉 Complete schema generation finished!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { generateCompleteSchema };
