/**
 * Enhanced Database Tracker
 * 
 * Enhanced database tracking system for comprehensive E2E test coverage
 * 
 * Created: October 26, 2025
 * Status: ENHANCED
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

export interface EnhancedDatabaseQuery {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete';
  context: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  error?: string;
  testId: string;
  component: string;
  userJourney: string;
}

export interface ComponentUsage {
  component: string;
  tablesUsed: string[];
  operations: string[];
  testCoverage: number;
  lastUsed: Date;
}

export class EnhancedDatabaseTracker {
  private queries: EnhancedDatabaseQuery[] = [];
  private componentUsage: Map<string, ComponentUsage> = new Map();
  private testId: string;

  constructor(private supabase: SupabaseClient, testId: string) {
    this.testId = testId;
  }

  /**
   * Track a database query with enhanced context
   */
  trackQuery(
    table: string,
    operation: 'select' | 'insert' | 'update' | 'delete',
    context: string,
    duration: number,
    success: boolean,
    error?: string,
    component?: string,
    userJourney?: string
  ) {
    const query: EnhancedDatabaseQuery = {
      table,
      operation,
      context,
      timestamp: new Date(),
      duration,
      success,
      error,
      testId: this.testId,
      component: component || 'unknown',
      userJourney: userJourney || 'unknown'
    };

    this.queries.push(query);
    this.updateComponentUsage(query);
  }

  /**
   * Update component usage tracking
   */
  private updateComponentUsage(query: EnhancedDatabaseQuery) {
    const component = query.component;
    
    if (!this.componentUsage.has(component)) {
      this.componentUsage.set(component, {
        component,
        tablesUsed: [],
        operations: [],
        testCoverage: 0,
        lastUsed: new Date()
      });
    }

    const usage = this.componentUsage.get(component)!;
    
    if (!usage.tablesUsed.includes(query.table)) {
      usage.tablesUsed.push(query.table);
    }
    
    if (!usage.operations.includes(query.operation)) {
      usage.operations.push(query.operation);
    }
    
    usage.lastUsed = new Date();
    usage.testCoverage = this.calculateTestCoverage(component);
  }

  /**
   * Calculate test coverage for a component
   */
  private calculateTestCoverage(component: string): number {
    const componentQueries = this.queries.filter(q => q.component === component);
    const uniqueTables = new Set(componentQueries.map(q => q.table)).size;
    const uniqueOperations = new Set(componentQueries.map(q => q.operation)).size;
    
    // Simple coverage calculation based on table and operation diversity
    return Math.min(100, (uniqueTables * 10) + (uniqueOperations * 5));
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport(): string {
    const report = {
      testId: this.testId,
      totalQueries: this.queries.length,
      successfulQueries: this.queries.filter(q => q.success).length,
      failedQueries: this.queries.filter(q => !q.success).length,
      averageDuration: this.queries.reduce((sum, q) => sum + q.duration, 0) / this.queries.length,
      componentUsage: Array.from(this.componentUsage.values()),
      tableUsage: this.getTableUsageStats(),
      operationStats: this.getOperationStats()
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Get table usage statistics
   */
  private getTableUsageStats() {
    const tableStats = new Map<string, number>();
    
    this.queries.forEach(query => {
      const count = tableStats.get(query.table) || 0;
      tableStats.set(query.table, count + 1);
    });

    return Array.from(tableStats.entries()).map(([table, count]) => ({
      table,
      usageCount: count,
      percentage: (count / this.queries.length) * 100
    }));
  }

  /**
   * Get operation statistics
   */
  private getOperationStats() {
    const operationStats = new Map<string, number>();
    
    this.queries.forEach(query => {
      const count = operationStats.get(query.operation) || 0;
      operationStats.set(query.operation, count + 1);
    });

    return Array.from(operationStats.entries()).map(([operation, count]) => ({
      operation,
      usageCount: count,
      percentage: (count / this.queries.length) * 100
    }));
  }

  /**
   * Save test report to file
   */
  async saveTestReport(filename?: string) {
    const report = this.generateTestReport();
    const reportPath = path.join(
      process.cwd(),
      'test-results',
      filename || `test-report-${this.testId}-${Date.now()}.json`
    );
    
    execSync(`mkdir -p "${path.dirname(reportPath)}"`, { stdio: 'inherit' });
    fs.writeFileSync(reportPath, report);
    
    return reportPath;
  }
}

export default EnhancedDatabaseTracker;