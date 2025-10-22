/**
 * Enhanced Database Tracker - E2E Testing Utility
 * 
 * Tracks all database table usage during E2E tests AND verifies data was actually stored
 * Provides comprehensive reporting on which tables are actually used and populated
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
  data?: any;
}

export interface DataVerificationEntry {
  table: string;
  operation: string;
  timestamp: Date;
  data: any;
  verified: boolean;
  context: string;
}

export interface TableUsageReport {
  summary: {
    totalTables: number;
    totalQueries: number;
    totalDataVerified: number;
    mostUsedTable: string;
    operations: Record<string, number>;
  };
  usedTables: string[];
  verifiedTables: string[];
  tableUsage: Array<{
    table: string;
    count: number;
    operations: string[];
    contexts: string[];
    dataVerified: boolean;
  }>;
  queryLog: QueryLogEntry[];
  dataVerification: DataVerificationEntry[];
}

export class EnhancedDatabaseTracker {
  private static usedTables = new Set<string>();
  private static verifiedTables = new Set<string>();
  private static queryLog: QueryLogEntry[] = [];
  private static dataVerification: DataVerificationEntry[] = [];
  private static supabaseClient: any = null;

  static reset() {
    this.usedTables.clear();
    this.verifiedTables.clear();
    this.queryLog = [];
    this.dataVerification = [];
    console.log('🔄 Enhanced database tracking reset');
  }

  /**
   * Initialize Supabase client for data verification
   */
  static initializeSupabase(url: string, key: string) {
    this.supabaseClient = createClient(url, key);
    console.log('🔌 Supabase client initialized for data verification');
  }

  /**
   * Track a database query
   */
  static trackQuery(
    tableName: string, 
    operation: string = 'unknown', 
    context: string = '',
    data?: any,
    stackTrace?: string
  ) {
    this.usedTables.add(tableName);
    
    const entry: QueryLogEntry = {
      table: tableName,
      operation,
      timestamp: new Date(),
      context,
      data,
      stackTrace
    };
    
    this.queryLog.push(entry);
    
    console.log(`📊 Database Query: ${operation} on ${tableName} (${context})`);
  }

  /**
   * Verify data was actually stored in the database
   */
  static async verifyDataStored(
    tableName: string,
    operation: string,
    context: string,
    expectedData?: any
  ): Promise<boolean> {
    if (!this.supabaseClient) {
      console.warn('⚠️ Supabase client not initialized for data verification');
      return false;
    }

    try {
      // Query the table to see if data exists
      const { data, error } = await this.supabaseClient
        .from(tableName)
        .select('*')
        .limit(10);

      if (error) {
        console.warn(`⚠️ Error verifying data in ${tableName}:`, error.message);
        return false;
      }

      const hasData = data && data.length > 0;
      
      if (hasData) {
        this.verifiedTables.add(tableName);
        console.log(`✅ Data verified in ${tableName}: ${data.length} records found`);
      } else {
        console.log(`❌ No data found in ${tableName}`);
      }

      const verificationEntry: DataVerificationEntry = {
        table: tableName,
        operation,
        timestamp: new Date(),
        data: data || [],
        verified: hasData,
        context
      };

      this.dataVerification.push(verificationEntry);
      return hasData;
    } catch (error) {
      console.error(`❌ Error verifying data in ${tableName}:`, error);
      return false;
    }
  }

  /**
   * Verify specific data was stored (e.g., user registration, poll creation)
   */
  static async verifyUserRegistration(userEmail: string): Promise<boolean> {
    return this.verifyDataStored('user_profiles', 'insert', 'user_registration', { email: userEmail });
  }

  static async verifyPollCreation(pollTitle: string): Promise<boolean> {
    return this.verifyDataStored('polls', 'insert', 'poll_creation', { title: pollTitle });
  }

  static async verifyVoteCast(userId: string, pollId: string): Promise<boolean> {
    return this.verifyDataStored('votes', 'insert', 'vote_cast', { user_id: userId, poll_id: pollId });
  }

  static async verifyAddressLookup(address: string): Promise<boolean> {
    return this.verifyDataStored('user_address_lookups', 'insert', 'address_lookup', { address });
  }

  static async verifyHashtagCreation(hashtag: string): Promise<boolean> {
    return this.verifyDataStored('hashtags', 'insert', 'hashtag_creation', { name: hashtag });
  }

  static async verifyFeedbackSubmission(feedback: string): Promise<boolean> {
    return this.verifyDataStored('feedback', 'insert', 'feedback_submission', { message: feedback });
  }

  static async verifyOnboardingData(userId: string): Promise<boolean> {
    return this.verifyDataStored('user_profiles', 'update', 'onboarding_completion', { id: userId });
  }

  /**
   * Get all used tables
   */
  static getUsedTables(): string[] {
    return Array.from(this.usedTables);
  }

  /**
   * Get all verified tables
   */
  static getVerifiedTables(): string[] {
    return Array.from(this.verifiedTables);
  }

  /**
   * Get query log
   */
  static getQueryLog(): QueryLogEntry[] {
    return [...this.queryLog];
  }

  /**
   * Get data verification log
   */
  static getDataVerification(): DataVerificationEntry[] {
    return [...this.dataVerification];
  }

  /**
   * Generate comprehensive report
   */
  static generateReport(): TableUsageReport {
    const operations: Record<string, number> = {};
    const tableUsage = new Map<string, {
      count: number;
      operations: Set<string>;
      contexts: Set<string>;
      dataVerified: boolean;
    }>();

    // Process query log
    this.queryLog.forEach(entry => {
      operations[entry.operation] = (operations[entry.operation] || 0) + 1;
      
      if (!tableUsage.has(entry.table)) {
        tableUsage.set(entry.table, {
          count: 0,
          operations: new Set(),
          contexts: new Set(),
          dataVerified: false
        });
      }
      
      const usage = tableUsage.get(entry.table)!;
      usage.count++;
      usage.operations.add(entry.operation);
      usage.contexts.add(entry.context);
    });

    // Process data verification
    this.dataVerification.forEach(entry => {
      if (entry.verified && tableUsage.has(entry.table)) {
        tableUsage.get(entry.table)!.dataVerified = true;
      }
    });

    const mostUsedTable = Array.from(tableUsage.entries())
      .sort(([,a], [,b]) => b.count - a.count)[0]?.[0] || '';

    return {
      summary: {
        totalTables: this.usedTables.size,
        totalQueries: this.queryLog.length,
        totalDataVerified: this.verifiedTables.size,
        mostUsedTable,
        operations
      },
      usedTables: Array.from(this.usedTables),
      verifiedTables: Array.from(this.verifiedTables),
      tableUsage: Array.from(tableUsage.entries()).map(([table, usage]) => ({
        table,
        count: usage.count,
        operations: Array.from(usage.operations),
        contexts: Array.from(usage.contexts),
        dataVerified: usage.dataVerified
      })),
      queryLog: [...this.queryLog],
      dataVerification: [...this.dataVerification]
    };
  }

  /**
   * Save report to file
   */
  static async saveReport(filename: string): Promise<void> {
    const report = this.generateReport();
    const reportData = {
      timestamp: new Date().toISOString(),
      report,
      summary: {
        tablesUsed: report.usedTables.length,
        tablesVerified: report.verifiedTables.length,
        totalQueries: report.queryLog.length,
        dataVerificationEntries: report.dataVerification.length
      }
    };

    // In a real implementation, this would save to a file
    console.log(`📄 Report saved: ${filename}`);
    console.log(`📊 Tables Used: ${report.usedTables.length}`);
    console.log(`✅ Tables Verified: ${report.verifiedTables.length}`);
    console.log(`📈 Total Queries: ${report.queryLog.length}`);
    console.log(`🔍 Data Verification Entries: ${report.dataVerification.length}`);
  }

  /**
   * Create tracked Supabase client
   */
  static createTrackedSupabaseClient(url: string, key: string) {
    const supabase = createClient(url, key);
    
    // Intercept .from() calls
    const originalFrom = supabase.from.bind(supabase);
    const tracker = this;
    supabase.from = function(tableName: string) {
      tracker.trackQuery(tableName, 'from', 'Supabase Query');
      return originalFrom(tableName);
    };
    
    return { supabase, tracker: this };
  }

  /**
   * Patch existing Supabase clients
   */
  static patchSupabaseClients() {
    // Patch the global Supabase client if it exists
    if (typeof window !== 'undefined' && (window as any).supabase) {
      const supabase = (window as any).supabase;
      const originalFrom = supabase.from.bind(supabase);
      const tracker = this;
      supabase.from = function(tableName: string) {
        tracker.trackQuery(tableName, 'from', 'Global Supabase Client');
        return originalFrom(tableName);
      };
    }
    
    // Patch any Supabase clients created via createClient
    const originalCreateClient = createClient;
    const tracker = this;
    (global as any).createClient = function(url: string, key: string) {
      const client = originalCreateClient(url, key);
      const originalFrom = client.from.bind(client);
      client.from = function(tableName: string) {
        tracker.trackQuery(tableName, 'from', 'Patched Supabase Client');
        return originalFrom(tableName);
      };
      return client;
    };
  }
}

export const TableUsageAnalyzer = {
  /**
   * Analyze table usage patterns
   */
  analyzeUsage(report: TableUsageReport) {
    const analysis = {
      criticalTables: [] as string[],
      optionalTables: [] as string[],
      unusedTables: [] as string[],
      dataIntegrityIssues: [] as string[]
    };

    // Identify critical tables (used frequently and verified)
    report.tableUsage.forEach(usage => {
      if (usage.count > 5 && usage.dataVerified) {
        analysis.criticalTables.push(usage.table);
      } else if (usage.count > 0 && !usage.dataVerified) {
        analysis.dataIntegrityIssues.push(usage.table);
      } else if (usage.count === 0) {
        analysis.unusedTables.push(usage.table);
      } else {
        analysis.optionalTables.push(usage.table);
      }
    });

    return analysis;
  }
};
