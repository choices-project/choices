/**
 * Database Tracker - E2E Testing Utility
 * 
 * Tracks all database table usage during E2E tests
 * Provides comprehensive reporting on which tables are actually used
 * 
 * Created: January 19, 2025
 * Status: ✅ ACTIVE
 */

import { createClient } from '@supabase/supabase-js';

export interface QueryLogEntry {
  table: string;
  operation: string;
  timestamp: Date;
  context: string;
  stackTrace?: string;
}

export interface TableUsageReport {
  summary: {
    totalTables: number;
    totalQueries: number;
    mostUsedTable: string;
    operations: Record<string, number>;
  };
  usedTables: string[];
  tableUsage: Array<{
    table: string;
    count: number;
    operations: string[];
    contexts: string[];
  }>;
  queryLog: QueryLogEntry[];
}

export class DatabaseTracker {
  private static usedTables = new Set<string>();
  private static queryLog: QueryLogEntry[] = [];
  
  /**
   * Track a database query
   */
  static trackQuery(
    tableName: string, 
    operation: string = 'unknown', 
    context: string = '',
    stackTrace?: string
  ) {
    this.usedTables.add(tableName);
    this.queryLog.push({
      table: tableName,
      operation,
      timestamp: new Date(),
      context,
      stackTrace
    });
    console.log(`🔍 Table accessed: ${tableName} (${operation}) - ${context}`);
  }
  
  /**
   * Get all unique tables that were accessed
   */
  static getUsedTables(): string[] {
    return Array.from(this.usedTables);
  }
  
  /**
   * Get complete query log
   */
  static getQueryLog(): QueryLogEntry[] {
    return this.queryLog;
  }
  
  /**
   * Reset tracking state
   */
  static reset() {
    this.usedTables.clear();
    this.queryLog = [];
    console.log('🔄 Database tracking reset');
  }
  
  /**
   * Generate comprehensive usage report
   */
  static generateReport(): TableUsageReport {
    const usedTables = this.getUsedTables();
    const queryLog = this.getQueryLog();
    
    // Group by table
    const tableUsage = queryLog.reduce((acc, log) => {
      if (!acc[log.table]) {
        acc[log.table] = {
          count: 0,
          operations: new Set(),
          contexts: new Set()
        };
      }
      if (acc[log.table]) {
        acc[log.table]!.count++;
        acc[log.table]!.operations.add(log.operation);
        acc[log.table]!.contexts.add(log.context);
      }
      return acc;
    }, {} as Record<string, { count: number; operations: Set<string>; contexts: Set<string> }>);
    
    return {
      summary: {
        totalTables: usedTables.length,
        totalQueries: queryLog.length,
        mostUsedTable: this.getMostUsedTable(),
        operations: this.getOperationSummary()
      },
      usedTables: usedTables.sort(),
      tableUsage: Object.entries(tableUsage).map(([table, usage]) => ({
        table,
        count: usage.count,
        operations: Array.from(usage.operations),
        contexts: Array.from(usage.contexts)
      })).sort((a, b) => b.count - a.count),
      queryLog: queryLog
    };
  }
  
  /**
   * Get the most frequently used table
   */
  private static getMostUsedTable(): string {
    const counts = this.queryLog.reduce((acc, log) => {
      acc[log.table] = (acc[log.table] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';
  }
  
  /**
   * Get operation summary
   */
  private static getOperationSummary(): Record<string, number> {
    const operations = this.queryLog.reduce((acc, log) => {
      acc[log.operation] = (acc[log.operation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return operations;
  }
  
  /**
   * Save report to file
   */
  static async saveReport(filename: string = 'table-usage-report.json'): Promise<void> {
    const report = this.generateReport();
    const fs = await import('fs/promises');
    await fs.writeFile(filename, JSON.stringify(report, null, 2));
    console.log(`📊 Report saved to ${filename}`);
  }
}

/**
 * Create a tracked Supabase client
 */
export function createTrackedSupabaseClient(url: string, key: string) {
  const supabase = createClient(url, key);
  
  // Intercept .from() calls
  const originalFrom = supabase.from.bind(supabase);
  supabase.from = function(tableName: string) {
    DatabaseTracker.trackQuery(tableName, 'from', 'Supabase Query');
    return originalFrom(tableName);
  };
  
  return { supabase, tracker: DatabaseTracker };
}

/**
 * Monkey patch existing Supabase clients to track queries
 */
export function patchSupabaseClients() {
  // Patch the global Supabase client if it exists
  if (typeof window !== 'undefined' && (window as any).supabase) {
    const supabase = (window as any).supabase;
    const originalFrom = supabase.from.bind(supabase);
    supabase.from = function(tableName: string) {
      DatabaseTracker.trackQuery(tableName, 'from', 'Global Supabase Client');
      return originalFrom(tableName);
    };
  }
  
  // Patch any Supabase clients created via createClient
  const originalCreateClient = createClient;
  (global as any).createClient = function(url: string, key: string) {
    const client = originalCreateClient(url, key);
    const originalFrom = client.from.bind(client);
    client.from = function(tableName: string) {
      DatabaseTracker.trackQuery(tableName, 'from', 'Patched Supabase Client');
      return originalFrom(tableName);
    };
    return client;
  };
}

/**
 * Table Usage Analyzer
 */
export class TableUsageAnalyzer {
  static analyzeUsage(usedTables: string[], allTables: string[]) {
    const unusedTables = allTables.filter(table => !usedTables.includes(table));
    
    return {
      summary: {
        totalTables: allTables.length,
        usedTables: usedTables.length,
        unusedTables: unusedTables.length,
        usagePercentage: (usedTables.length / allTables.length) * 100
      },
      usedTables: usedTables.sort(),
      unusedTables: unusedTables.sort(),
      recommendations: {
        safeToRemove: unusedTables,
        keepEssential: usedTables,
        reviewNeeded: this.getReviewNeededTables(usedTables, allTables)
      },
      featureMapping: this.mapTablesToFeatures(usedTables)
    };
  }
  
  private static getReviewNeededTables(usedTables: string[], allTables: string[]): string[] {
    // Tables that might be used but weren't caught in E2E tests
    const potentiallyUsed = allTables.filter(table => 
      table.includes('analytics') || 
      table.includes('audit') || 
      table.includes('log') ||
      table.includes('system') ||
      table.includes('admin') ||
      table.includes('privacy') ||
      table.includes('data_quality')
    );
    
    return potentiallyUsed.filter(table => !usedTables.includes(table));
  }
  
  private static mapTablesToFeatures(usedTables: string[]) {
    const featureMapping = {
      'Authentication': ['user_profiles', 'webauthn_credentials', 'webauthn_challenges', 'privacy_consent_records'],
      'Polls': ['polls', 'votes', 'poll_analytics', 'poll_contexts', 'poll_generation_logs'],
      'Hashtags': ['hashtags', 'hashtag_usage', 'hashtag_engagement', 'hashtag_content', 'hashtag_co_occurrence', 'hashtag_trending_history', 'hashtag_trends', 'hashtag_analytics', 'hashtag_flags', 'user_hashtags', 'hashtag_user_preferences'],
      'Civics': ['representatives_core', 'user_address_lookups', 'geographic_lookups', 'zip_to_ocd', 'latlon_to_ocd', 'state_districts', 'representative_contacts_optimal', 'representative_offices_optimal', 'representative_photos_optimal', 'representative_social_media_optimal', 'representative_activity_enhanced', 'representative_campaign_finance', 'representative_committees', 'representative_leadership', 'representative_roles_optimal', 'voting_records', 'campaign_finance', 'fec_candidates', 'fec_committees', 'fec_contributions', 'id_crosswalk'],
      'Analytics': ['analytics_events', 'trust_tier_analytics', 'analytics_contributions', 'analytics_demographics', 'analytics_user_engagement', 'analytics_page_views', 'analytics_sessions', 'demographic_analytics', 'data_quality_checks', 'data_quality_metrics', 'data_quality_summary'],
      'Admin': ['admin_activity_log', 'audit_logs', 'system_health', 'security_audit_log', 'privacy_audit_logs', 'error_logs', 'migration_log', 'site_messages'],
      'Feeds': ['feeds', 'feed_interactions', 'trending_topics', 'user_hashtags', 'hashtag_trends', 'geographic_lookups', 'location_consent_audit'],
      'PWA': ['push_subscriptions', 'notification_history', 'cache', 'rate_limits'],
      'Onboarding': ['user_consent', 'private_user_data', 'user_notification_preferences', 'location_consent_audit'],
      'Voting': ['polls', 'votes', 'poll_analytics', 'poll_contexts', 'analytics_events', 'trust_tier_analytics', 'analytics_contributions', 'analytics_demographics']
    };
    
    return Object.entries(featureMapping).map(([feature, tables]) => ({
      feature,
      tables: tables.filter(table => usedTables.includes(table)),
      usage: tables.filter(table => usedTables.includes(table)).length / tables.length
    }));
  }
}

export { DatabaseTracker as default };
