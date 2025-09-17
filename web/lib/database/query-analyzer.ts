/**
 * Query Plan Analysis System
 * 
 * Advanced query analysis and optimization system that provides insights
 * into query performance and suggests optimizations.
 */

import { logger } from '@/lib/logger';
import { smartCache } from '@/lib/database/smart-cache';
import { withOptional } from '@/lib/util/objects';

/**
 * Query execution plan information
 */
export interface QueryPlan {
  /** Unique identifier for this query plan */
  id: string;
  /** The SQL query */
  query: string;
  /** Normalized query pattern */
  pattern: string;
  /** Execution time in milliseconds */
  executionTime: number;
  /** Number of rows returned */
  rowsReturned: number;
  /** Number of rows examined */
  rowsExamined: number;
  /** Whether the query used an index */
  usedIndex: boolean;
  /** Index name if used */
  indexName?: string;
  /** Query complexity score (1-10) */
  complexity: number;
  /** Optimization suggestions */
  suggestions: QueryOptimization[];
  /** Timestamp of analysis */
  timestamp: number;
}

/**
 * Query optimization suggestion
 */
export interface QueryOptimization {
  /** Type of optimization */
  type: 'index' | 'join' | 'filter' | 'limit' | 'select' | 'cache';
  /** Priority level (1-5, 5 being highest) */
  priority: number;
  /** Description of the optimization */
  description: string;
  /** Expected performance improvement percentage */
  expectedImprovement: number;
  /** SQL suggestion if applicable */
  sqlSuggestion?: string;
  /** Whether this optimization is automatically applicable */
  autoApplicable: boolean;
}

/**
 * Query performance metrics
 */
export interface QueryMetrics {
  /** Average execution time */
  averageExecutionTime: number;
  /** 95th percentile execution time */
  p95ExecutionTime: number;
  /** 99th percentile execution time */
  p99ExecutionTime: number;
  /** Total number of executions */
  totalExecutions: number;
  /** Cache hit rate */
  cacheHitRate: number;
  /** Most common optimization opportunities */
  commonOptimizations: Array<{ type: string; count: number; avgImprovement: number }>;
}

/**
 * Index recommendation
 */
export interface IndexRecommendation {
  /** Table name */
  table: string;
  /** Column names for the index */
  columns: string[];
  /** Index type */
  type: 'btree' | 'hash' | 'gin' | 'gist';
  /** Expected performance improvement */
  expectedImprovement: number;
  /** Query patterns that would benefit */
  benefitingQueries: string[];
  /** Priority level */
  priority: number;
}

/**
 * Query analyzer for performance optimization
 */
export class QueryAnalyzer {
  private queryHistory: QueryPlan[] = [];
  private performanceMetrics = new Map<string, QueryMetrics>();
  private indexRecommendations: IndexRecommendation[] = [];

  /**
   * Analyze a query execution
   */
  analyzeQuery(
    query: string,
    executionTime: number,
    rowsReturned: number,
    rowsExamined?: number,
    usedIndex?: boolean,
    indexName?: string
  ): QueryPlan {
    const pattern = this.normalizeQuery(query);
    const complexity = this.calculateComplexity(query);
    const suggestions = this.generateOptimizations(query, pattern, executionTime, rowsReturned, rowsExamined, usedIndex);

    const plan = withOptional({
      id: this.generateQueryId(query),
      query,
      pattern,
      executionTime,
      rowsReturned,
      rowsExamined: rowsExamined || rowsReturned,
      usedIndex: usedIndex || false,
      complexity,
      suggestions,
      timestamp: Date.now(),
    }, {
      indexName
    }) as QueryPlan;

    this.queryHistory.push(plan);
    this.updatePerformanceMetrics(pattern, plan);
    this.updateIndexRecommendations(plan);

    // Keep only last 10000 query plans
    if (this.queryHistory.length > 10000) {
      this.queryHistory = this.queryHistory.slice(-10000);
    }

    logger.debug('Query analyzed', {
      pattern,
      executionTime,
      complexity,
      suggestionsCount: suggestions.length,
    });

    return plan;
  }

  /**
   * Get performance metrics for a query pattern
   */
  getPerformanceMetrics(pattern: string): QueryMetrics | null {
    return this.performanceMetrics.get(pattern) || null;
  }

  /**
   * Get all performance metrics
   */
  getAllPerformanceMetrics(): Map<string, QueryMetrics> {
    return new Map(this.performanceMetrics);
  }

  /**
   * Get index recommendations
   */
  getIndexRecommendations(): IndexRecommendation[] {
    return [...this.indexRecommendations].sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get slow queries
   */
  getSlowQueries(threshold: number = 1000): QueryPlan[] {
    return this.queryHistory
      .filter(plan => plan.executionTime > threshold)
      .sort((a, b) => b.executionTime - a.executionTime);
  }

  /**
   * Get queries with optimization opportunities
   */
  getOptimizableQueries(): QueryPlan[] {
    return this.queryHistory
      .filter(plan => plan.suggestions.length > 0)
      .sort((a, b) => b.suggestions.length - a.suggestions.length);
  }

  /**
   * Get query patterns by frequency
   */
  getQueryPatterns(): Array<{ pattern: string; frequency: number; avgExecutionTime: number }> {
    const patternStats = new Map<string, { count: number; totalTime: number }>();

    for (const plan of this.queryHistory) {
      const stats = patternStats.get(plan.pattern) || { count: 0, totalTime: 0 };
      stats.count++;
      stats.totalTime += plan.executionTime;
      patternStats.set(plan.pattern, stats);
    }

    return Array.from(patternStats.entries())
      .map(([pattern, stats]) => ({
        pattern,
        frequency: stats.count,
        avgExecutionTime: stats.totalTime / stats.count,
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Generate optimization report
   */
  generateOptimizationReport(): {
    summary: {
      totalQueries: number;
      slowQueries: number;
      optimizableQueries: number;
      averageExecutionTime: number;
      topOptimizations: Array<{ type: string; count: number; avgImprovement: number }>;
    };
    recommendations: IndexRecommendation[];
    slowQueries: QueryPlan[];
    optimizableQueries: QueryPlan[];
  } {
    const totalQueries = this.queryHistory.length;
    const slowQueries = this.getSlowQueries();
    const optimizableQueries = this.getOptimizableQueries();
    const averageExecutionTime = this.queryHistory.reduce((sum, plan) => sum + plan.executionTime, 0) / totalQueries;

    // Calculate top optimizations
    const optimizationCounts = new Map<string, { count: number; totalImprovement: number }>();
    for (const plan of this.queryHistory) {
      for (const suggestion of plan.suggestions) {
        const stats = optimizationCounts.get(suggestion.type) || { count: 0, totalImprovement: 0 };
        stats.count++;
        stats.totalImprovement += suggestion.expectedImprovement;
        optimizationCounts.set(suggestion.type, stats);
      }
    }

    const topOptimizations = Array.from(optimizationCounts.entries())
      .map(([type, stats]) => ({
        type,
        count: stats.count,
        avgImprovement: stats.totalImprovement / stats.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      summary: {
        totalQueries,
        slowQueries: slowQueries.length,
        optimizableQueries: optimizableQueries.length,
        averageExecutionTime,
        topOptimizations,
      },
      recommendations: this.getIndexRecommendations(),
      slowQueries: slowQueries.slice(0, 10),
      optimizableQueries: optimizableQueries.slice(0, 10),
    };
  }

  /**
   * Clear all analysis data
   */
  clear(): void {
    this.queryHistory = [];
    this.performanceMetrics.clear();
    this.indexRecommendations = [];
    logger.info('Query analysis data cleared');
  }

  // Private methods

  private normalizeQuery(query: string): string {
    return query
      .replace(/\s+/g, ' ')
      .replace(/\d+/g, '?')
      .replace(/'[^']*'/g, '?')
      .replace(/"[^"]*"/g, '?')
      .trim()
      .toLowerCase();
  }

  private calculateComplexity(query: string): number {
    let complexity = 1;
    
    // Add complexity for joins
    const joinCount = (query.match(/\bjoin\b/gi) || []).length;
    complexity += joinCount * 2;
    
    // Add complexity for subqueries
    const subqueryCount = (query.match(/\([^)]*select[^)]*\)/gi) || []).length;
    complexity += subqueryCount * 3;
    
    // Add complexity for aggregations
    const aggCount = (query.match(/\b(count|sum|avg|min|max|group by)\b/gi) || []).length;
    complexity += aggCount;
    
    // Add complexity for ordering
    if (query.includes('order by')) complexity += 1;
    
    // Add complexity for grouping
    if (query.includes('group by')) complexity += 2;
    
    return Math.min(complexity, 10);
  }

  private generateOptimizations(
    query: string,
    pattern: string,
    executionTime: number,
    rowsReturned: number,
    rowsExamined?: number,
    usedIndex?: boolean
  ): QueryOptimization[] {
    const optimizations: QueryOptimization[] = [];

    // Check for missing indexes
    if (!usedIndex && this.hasWhereClause(query)) {
      const table = this.extractTableName(query);
      const columns = this.extractWhereColumns(query);
      
      if (table && columns.length > 0) {
        optimizations.push({
          type: 'index',
          priority: 5,
          description: `Add index on ${table}.${columns.join(', ')}`,
          expectedImprovement: Math.min(80, executionTime * 0.8),
          sqlSuggestion: `CREATE INDEX idx_${table}_${columns.join('_')} ON ${table} (${columns.join(', ')});`,
          autoApplicable: false,
        });
      }
    }

    // Check for inefficient joins
    if (this.hasInefficientJoins(query)) {
      optimizations.push({
        type: 'join',
        priority: 4,
        description: 'Optimize join order or add join conditions',
        expectedImprovement: 30,
        autoApplicable: false,
      });
    }

    // Check for missing LIMIT clause
    if (!query.includes('limit') && rowsReturned > 100) {
      optimizations.push({
        type: 'limit',
        priority: 3,
        description: 'Add LIMIT clause to prevent large result sets',
        expectedImprovement: 20,
        autoApplicable: true,
      });
    }

    // Check for SELECT * usage
    if (query.includes('select *')) {
      optimizations.push({
        type: 'select',
        priority: 2,
        description: 'Replace SELECT * with specific columns',
        expectedImprovement: 15,
        autoApplicable: true,
      });
    }

    // Check for cache opportunities
    if (executionTime > 100 && this.isCacheableQuery(query)) {
      optimizations.push({
        type: 'cache',
        priority: 3,
        description: 'Enable caching for this query pattern',
        expectedImprovement: 90,
        autoApplicable: true,
      });
    }

    // Check for inefficient filtering
    if (rowsExamined && rowsExamined > rowsReturned * 10) {
      optimizations.push({
        type: 'filter',
        priority: 4,
        description: 'Add more selective filters to reduce rows examined',
        expectedImprovement: 40,
        autoApplicable: false,
      });
    }

    return optimizations;
  }

  private hasWhereClause(query: string): boolean {
    return /\bwhere\b/i.test(query);
  }

  private hasInefficientJoins(query: string): boolean {
    const joinCount = (query.match(/\bjoin\b/gi) || []).length;
    return joinCount > 3;
  }

  private isCacheableQuery(query: string): boolean {
    // Queries that are good candidates for caching
    const cacheablePatterns = [
      /select.*from.*where/i,
      /select.*count/i,
      /select.*from.*order by/i,
    ];
    
    return cacheablePatterns.some(pattern => pattern.test(query));
  }

  private extractTableName(query: string): string | null {
    const match = query.match(/from\s+(\w+)/i);
    return match?.[1] ?? null;
  }

  private extractWhereColumns(query: string): string[] {
    const whereMatch = query.match(/where\s+(.+?)(?:\s+order|\s+group|\s+limit|$)/i);
    if (!whereMatch) return [];
    
    const whereClause = whereMatch[1];
    if (!whereClause) return [];
    
    const columnMatches = whereClause.match(/(\w+)\s*[=<>!]/g);
    
    return columnMatches ? columnMatches.map(match => match.split(/\s*[=<>!]/)[0]).filter((col): col is string => Boolean(col)) : [];
  }

  private generateQueryId(query: string): string {
    // Generate a unique ID based on query hash
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `query_${Math.abs(hash).toString(36)}`;
  }

  private updatePerformanceMetrics(pattern: string, plan: QueryPlan): void {
    const existing = this.performanceMetrics.get(pattern);
    
    if (existing) {
      const totalTime = existing.averageExecutionTime * existing.totalExecutions + plan.executionTime;
      existing.totalExecutions++;
      existing.averageExecutionTime = totalTime / existing.totalExecutions;
      
      // Update percentiles (simplified calculation)
      if (plan.executionTime > existing.p95ExecutionTime) {
        existing.p95ExecutionTime = plan.executionTime;
      }
      if (plan.executionTime > existing.p99ExecutionTime) {
        existing.p99ExecutionTime = plan.executionTime;
      }
    } else {
      this.performanceMetrics.set(pattern, {
        averageExecutionTime: plan.executionTime,
        p95ExecutionTime: plan.executionTime,
        p99ExecutionTime: plan.executionTime,
        totalExecutions: 1,
        cacheHitRate: 0,
        commonOptimizations: [],
      });
    }
  }

  private updateIndexRecommendations(plan: QueryPlan): void {
    for (const suggestion of plan.suggestions) {
      if (suggestion.type === 'index' && suggestion.sqlSuggestion) {
        const table = this.extractTableName(plan.query);
        if (table) {
          const columns = this.extractWhereColumns(plan.query);
          const existing = this.indexRecommendations.find(
            rec => rec.table === table && 
            rec.columns.length === columns.length && 
            rec.columns.every(col => columns.includes(col))
          );
          
          if (existing) {
            existing.priority = Math.max(existing.priority, suggestion.priority);
            existing.expectedImprovement = Math.max(existing.expectedImprovement, suggestion.expectedImprovement);
            existing.benefitingQueries.push(plan.pattern);
          } else {
            this.indexRecommendations.push({
              table,
              columns,
              type: 'btree',
              expectedImprovement: suggestion.expectedImprovement,
              benefitingQueries: [plan.pattern],
              priority: suggestion.priority,
            });
          }
        }
      }
    }
  }
}

// Global query analyzer instance
export const queryAnalyzer = new QueryAnalyzer();


