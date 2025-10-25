/**
 * Database Tracker Utility
 * 
 * Comprehensive database tracking system for E2E tests to monitor
 * which tables and queries are actually used during testing.
 * 
 * @fileoverview Database tracking and analysis for E2E testing
 * @author Choices Platform Team
 * @created 2025-10-24
 * @updated 2025-10-24
 * @status ACTIVE
 * @version 1.0.0
 * 
 * @requires @supabase/supabase-js
 * @requires fs
 * @requires path
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Interface for database query tracking
 */
export interface DatabaseQuery {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete';
  context: string;
  timestamp: Date;
}

/**
 * Interface for database results
 */
export interface DatabaseResults {
  queries: DatabaseQuery[];
  tablesUsed: Set<string>;
  operationsCount: Map<string, number>;
  contextCount: Map<string, number>;
}

/**
 * Database Tracker Class
 * 
 * Tracks all database interactions during E2E testing to identify
 * which tables and operations are actually used in production.
 */
export class DatabaseTracker {
  private static instance: DatabaseTracker;
  private queries: DatabaseQuery[] = [];
  private supabase: SupabaseClient | null = null;
  private logFile: string;

  /**
   * Constructor for DatabaseTracker
   * @param logFile - Path to log file for tracking
   */
  constructor(logFile?: string) {
    this.logFile = logFile || path.join(process.cwd(), 'database-tracking.log');
    this.initializeSupabase();
  }

  /**
   * Get singleton instance of DatabaseTracker
   * @returns DatabaseTracker instance
   */
  public static getInstance(): DatabaseTracker {
    if (!DatabaseTracker.instance) {
      DatabaseTracker.instance = new DatabaseTracker();
    }
    return DatabaseTracker.instance;
  }

  /**
   * Initialize Supabase client for database operations
   * @private
   */
  private initializeSupabase(): void {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.warn('⚠️  Supabase credentials not found, database tracking limited');
        return;
      }

      this.supabase = createClient(supabaseUrl, supabaseKey);
      console.log('🔌 Supabase client initialized for data verification');
    } catch (error) {
      console.error('❌ Error initializing Supabase client:', error);
    }
  }

  /**
   * Initialize Supabase client with custom credentials
   * @param supabaseUrl - Supabase URL
   * @param supabaseKey - Supabase key
   */
  public static initializeSupabase(supabaseUrl: string, supabaseKey: string): void {
    const tracker = DatabaseTracker.getInstance();
    try {
      tracker.supabase = createClient(supabaseUrl, supabaseKey);
      console.log('🔌 Supabase client initialized for data verification');
    } catch (error) {
      console.error('❌ Error initializing Supabase client:', error);
    }
  }

  /**
   * Reset database tracking
   */
  public static reset(): void {
    const tracker = DatabaseTracker.getInstance();
    tracker.queries = [];
    console.log('🔄 Enhanced database tracking reset');
  }

  /**
   * Track a database query
   * @param table - Database table name
   * @param operation - Database operation type
   * @param context - Context where query was made
   */
  public static trackQuery(table: string, operation: DatabaseQuery['operation'], context: string): void {
    const tracker = DatabaseTracker.getInstance();
    
    const query: DatabaseQuery = {
      table,
      operation,
      context,
      timestamp: new Date()
    };

    tracker.queries.push(query);
    
    // Log to file
    const logEntry = `[${query.timestamp.toISOString()}] ${operation.toUpperCase()} ${table} - ${context}\n`;
    fs.appendFileSync(tracker.logFile, logEntry);
    
    console.log(`📊 Database Query: ${operation} on ${table} (${context})`);
  }

  /**
   * Get all tracked queries
   * @returns Array of database queries
   */
  public static getQueries(): DatabaseQuery[] {
    return DatabaseTracker.getInstance().queries;
  }

  /**
   * Get unique tables used
   * @returns Set of table names
   */
  public static getTablesUsed(): Set<string> {
    const queries = DatabaseTracker.getQueries();
    return new Set(queries.map(q => q.table));
  }

  /**
   * Get operation counts
   * @returns Map of operation counts
   */
  public static getOperationCounts(): Map<string, number> {
    const queries = DatabaseTracker.getQueries();
    const counts = new Map<string, number>();
    
    queries.forEach(query => {
      const key = `${query.operation}_${query.table}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    
    return counts;
  }

  /**
   * Get context counts
   * @returns Map of context counts
   */
  public static getContextCounts(): Map<string, number> {
    const queries = DatabaseTracker.getQueries();
    const counts = new Map<string, number>();
    
    queries.forEach(query => {
      counts.set(query.context, (counts.get(query.context) || 0) + 1);
    });
    
    return counts;
  }

  /**
   * Generate comprehensive report
   * @returns Database results summary
   */
  public static generateReport(): DatabaseResults {
    const queries = DatabaseTracker.getQueries();
    const tablesUsed = DatabaseTracker.getTablesUsed();
    const operationsCount = DatabaseTracker.getOperationCounts();
    const contextCount = DatabaseTracker.getContextCounts();

    return {
      queries,
      tablesUsed,
      operationsCount,
      contextCount
    };
  }

  /**
   * Save tracking report to file
   * @param filename - Output filename
   */
  public static async saveReport(filename: string): Promise<void> {
    try {
      const report = DatabaseTracker.generateReport();
      const reportPath = path.join(process.cwd(), filename);
      
      const reportData = {
        timestamp: new Date().toISOString(),
        summary: {
          totalQueries: report.queries.length,
          uniqueTables: report.tablesUsed.size,
          operationsCount: Object.fromEntries(report.operationsCount),
          contextCount: Object.fromEntries(report.contextCount)
        },
        queries: report.queries,
        tablesUsed: Array.from(report.tablesUsed),
        recommendations: DatabaseTracker.generateRecommendations(report)
      };
      
      fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
      console.log(`📄 Database tracking report saved to: ${reportPath}`);
    } catch (error) {
      console.error('❌ Error saving database report:', error);
    }
  }

  /**
   * Generate recommendations based on tracking data
   * @param results - Database results
   * @returns Array of recommendations
   */
  public static generateRecommendations(results: DatabaseResults): string[] {
    const recommendations: string[] = [];
    
    // Tables with high usage
    const highUsageTables = Array.from(results.tablesUsed).filter(table => {
      const count = results.queries.filter(q => q.table === table).length;
      return count > 5;
    });
    
    if (highUsageTables.length > 0) {
      recommendations.push(`High usage tables: ${highUsageTables.join(', ')}`);
    }
    
    // Tables with low usage
    const lowUsageTables = Array.from(results.tablesUsed).filter(table => {
      const count = results.queries.filter(q => q.table === table).length;
      return count <= 2;
    });
    
    if (lowUsageTables.length > 0) {
      recommendations.push(`Low usage tables (consider optimization): ${lowUsageTables.join(', ')}`);
    }
    
    // Operation patterns
    const selectCount = results.queries.filter(q => q.operation === 'select').length;
    const writeCount = results.queries.filter(q => ['insert', 'update', 'delete'].includes(q.operation)).length;
    
    if (selectCount > writeCount * 3) {
      recommendations.push('Read-heavy workload detected - consider read replicas');
    }
    
    return recommendations;
  }
}

/**
 * Table Usage Analyzer
 * 
 * Analyzes database table usage patterns and provides insights
 * for optimization and schema design.
 */
class TableUsageAnalyzer {
  /**
   * Analyze table usage patterns
   * @param usedTables - Set of used table names
   * @param allTables - Array of all available tables
   * @returns Analysis results
   */
  public static analyzeUsage(usedTables: Set<string>, allTables: string[]): {
    summary: {
      usagePercentage: number;
      unusedTables: number;
      usedTables: number;
    };
    recommendations: {
      safeToRemove: string[];
      reviewNeeded: string[];
      optimize: string[];
    };
  } {
    const usedTablesArray = Array.from(usedTables);
    const unusedTables = allTables.filter(table => !usedTables.has(table));
    const usagePercentage = (usedTablesArray.length / allTables.length) * 100;
    
    return {
      summary: {
        usagePercentage,
        unusedTables: unusedTables.length,
        usedTables: usedTablesArray.length
      },
      recommendations: {
        safeToRemove: unusedTables.filter(table => 
          !table.includes('auth') && 
          !table.includes('user') && 
          !table.includes('session')
        ),
        reviewNeeded: unusedTables.filter(table => 
          table.includes('auth') || 
          table.includes('user') || 
          table.includes('session')
        ),
        optimize: usedTablesArray.filter(table => {
          const count = DatabaseTracker.getQueries().filter(q => q.table === table).length;
          return count > 10;
        })
      }
    };
  }
}

export default DatabaseTracker;