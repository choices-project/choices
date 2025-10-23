/**
 * Database Tracker
 * 
 * Tracks database table usage during E2E tests to identify
 * which tables are actively used by the application.
 * 
 * Created: January 27, 2025
 * Updated: January 27, 2025
 * Purpose: Database table usage auditing for E2E testing
 */

interface DatabaseQuery {
  table: string;
  operation: string;
  context: string;
  timestamp: Date;
}

interface DatabaseResults {
    totalTables: number;
    totalQueries: number;
    mostUsedTable: string;
  tablesUsed: string[];
  queries: DatabaseQuery[];
  verifiedTables: number;
  dataVerificationEntries: number;
}

export class DatabaseTracker {
  private static queries: DatabaseQuery[] = [];
  private static verifiedTables: Set<string> = new Set();
  private static dataVerificationEntries: number = 0;
  private static supabaseClient: any = null;

  /**
   * Track a database query
   */
  static trackQuery(table: string, operation: string, context: string): void {
    const query: DatabaseQuery = {
      table,
      operation,
      context,
      timestamp: new Date()
    };
    
    this.queries.push(query);
    console.log(`📊 Database Query: ${operation} on ${table} (${context})`);
  }

  /**
   * Mark a table as verified
   */
  static markTableVerified(table: string): void {
    this.verifiedTables.add(table);
    console.log(`✅ Table verified: ${table}`);
  }

  /**
   * Track data verification entry
   */
  static trackDataVerification(): void {
    this.dataVerificationEntries++;
    console.log(`🔍 Data verification entry tracked`);
  }

  /**
   * Get current results
   */
  static getResults(): DatabaseResults {
    const tablesUsed = Array.from(new Set(this.queries.map(q => q.table)));
    const tableCounts = tablesUsed.reduce((acc, table) => {
      acc[table] = this.queries.filter(q => q.table === table).length;
      return acc;
    }, {} as Record<string, number>);
    
    const mostUsedTable = Object.entries(tableCounts).reduce((a, b) => 
      tableCounts[a[0]] > tableCounts[b[0]] ? a : b, ['', 0]
    )[0];

    return {
      totalTables: tablesUsed.length,
      totalQueries: this.queries.length,
      mostUsedTable,
      tablesUsed,
      queries: Array.from(this.queries),
      verifiedTables: this.verifiedTables.size,
      dataVerificationEntries: this.dataVerificationEntries
    };
  }

  /**
   * Reset tracking data
   */
  static reset(): void {
    this.queries = [];
    this.verifiedTables.clear();
    this.dataVerificationEntries = 0;
    console.log('🔄 Enhanced database tracking reset');
  }

  /**
   * Get table usage statistics
   */
  static getTableStats(): Record<string, number> {
    const tableCounts = this.queries.reduce((acc, query) => {
      acc[query.table] = (acc[query.table] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return tableCounts;
  }

  /**
   * Get queries by table
   */
  static getQueriesByTable(table: string): DatabaseQuery[] {
    return this.queries.filter(q => q.table === table);
  }

  /**
   * Get queries by operation
   */
  static getQueriesByOperation(operation: string): DatabaseQuery[] {
    return this.queries.filter(q => q.operation === operation);
  }

  /**
   * Get queries by context
   */
  static getQueriesByContext(context: string): DatabaseQuery[] {
    return this.queries.filter(q => q.context === context);
  }

  /**
   * Initialize Supabase client for database tracking
   */
  static initializeSupabase(supabaseUrl: string, supabaseKey: string): void {
    console.log('🔌 Supabase client initialized for data verification');
    // Store the client for potential future use
    this.supabaseClient = { url: supabaseUrl, key: supabaseKey };
  }

  /**
   * Get Supabase client
   */
  static getSupabaseClient(): any {
    return this.supabaseClient;
  }

  /**
   * Get standardized report path for test results
   */
  static getReportPath(testName: string): string {
    const path = require('path');
    return path.join('/Users/alaughingkitsune/src/Choices/web/test-results', 'reports', `${testName}-database-report.json`);
  }

  /**
   * Get used tables (alias for getUsedTables)
   */
  static getUsedTables(): string[] {
    return Array.from(new Set(this.queries.map(q => q.table)));
  }

  /**
   * Get verified tables (alias for getVerifiedTables)
   */
  static getVerifiedTables(): string[] {
    return Array.from(this.verifiedTables);
  }

  /**
   * Get query log (alias for getQueryLog)
   */
  static getQueryLog(): DatabaseQuery[] {
    return Array.from(this.queries);
  }

  /**
   * Get data verification (alias for getDataVerification)
   */
  static getDataVerification(): any[] {
    return this.dataVerificationEntries;
  }

  /**
   * Generate report (alias for generateReport)
   */
  static generateReport(): DatabaseResults {
    return this.getResults();
  }

  /**
   * Save report (alias for saveReport)
   */
  static saveReport(reportPath: string, results: DatabaseResults): void {
    const fs = require('fs');
    const path = require('path');
    
    // Ensure directory exists
    const dir = path.dirname(reportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`📊 Database usage report saved to: ${reportPath}`);
  }
}

export default DatabaseTracker;