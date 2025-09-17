/**
 * Database Types
 * 
 * Comprehensive type definitions for database operations, query results,
 * and performance monitoring in the Choices platform.
 * 
 * Created: 2025-09-16
 * Agent A2 - Database & Core Services Types
 */

// ============================================================================
// CORE DATABASE TYPES
// ============================================================================

export interface QueryResult<T = unknown> {
  data: T[];
  count: number;
  error: Error | null;
}

export interface OptimizationMetrics {
  queryTime: number;
  cacheHit: boolean;
  fromCache: boolean;
  rowsAffected: number;
  memoryUsage: number;
}

export interface ConnectionPoolConfig {
  min: number;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  totalQueries: number;
  cacheHitRate: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

// ============================================================================
// QUERY OPTIMIZER TYPES
// ============================================================================

export interface QueryPlan {
  id: string;
  query: string;
  estimatedCost: number;
  executionTime: number;
  indexes: string[];
  tables: string[];
}

export interface CacheConfig {
  ttl: number;
  maxSize: number;
  strategy: 'lru' | 'fifo' | 'ttl';
}

export interface QueryOptions {
  useCache?: boolean;
  cacheTTL?: number;
  cacheTags?: string[];
  timeout?: number;
  retries?: number;
  explain?: boolean;
  analyze?: boolean;
}

export interface QueryMetrics {
  query: string;
  executionTime: number;
  rowsReturned: number;
  cacheHit: boolean;
  fromCache: boolean;
  error?: string;
  timestamp: number;
}

export interface OptimizationResult {
  originalQuery: string;
  optimizedQuery: string;
  optimizations: string[];
  estimatedImprovement: number;
  executionPlan?: QueryPlan;
}

export interface QueryCacheEntry<T = unknown> {
  query: string;
  result: T;
  timestamp: number;
  ttl: number;
  hitCount: number;
}

// ============================================================================
// CONNECTION POOL TYPES
// ============================================================================

export interface PoolConfig {
  minConnections: number;
  maxConnections: number;
  acquireTimeoutMillis: number;
  idleTimeoutMillis: number;
  maxLifetimeMillis: number;
  validationQuery: string;
  validationQueryTimeout: number;
  leakDetectionThreshold: number;
  connectionTimeoutMillis: number;
}

export interface PoolMetrics {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  pendingRequests: number;
  connectionWaitTime: number;
  connectionAcquisitionTime: number;
  connectionLeaks: number;
  connectionTimeouts: number;
  validationFailures: number;
  lastValidationTime: number;
}

export interface ConnectionWrapper {
  id: string;
  connection: SupabaseClient;
  createdAt: number;
  lastUsed: number;
  isActive: boolean;
  isIdle: boolean;
  validationCount: number;
  lastValidation: number;
}

export interface PoolStats {
  totalCreated: number;
  totalDestroyed: number;
  totalAcquired: number;
  totalReleased: number;
  totalValidated: number;
  totalLeaked: number;
  totalTimeouts: number;
  connectionAcquisitionTime: number;
  validationFailures: number;
}

// ============================================================================
// PERFORMANCE MONITORING TYPES
// ============================================================================

export interface DatabaseMetrics {
  connectionCount: number;
  activeConnections: number;
  idleConnections: number;
  queryCount: number;
  averageQueryTime: number;
  slowQueries: number;
  errorCount: number;
  cacheHitRate: number;
  memoryUsage: number;
  diskUsage: number;
  cpuUsage: number;
  timestamp: number;
}

export interface QueryPerformanceMetrics {
  query: string;
  executionTime: number;
  rowsReturned: number;
  cacheHit: boolean;
  error?: string;
  timestamp: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  resolved: boolean;
}

export interface PerformanceRecommendation {
  id: string;
  type: 'index' | 'query' | 'configuration' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  estimatedImprovement: number;
  timestamp: number;
}

export interface PerformanceThresholds {
  slowQueryThreshold: number;
  errorRateThreshold: number;
  connectionUtilizationThreshold: number;
  memoryUsageThreshold: number;
  diskUsageThreshold: number;
  cacheHitRateThreshold: number;
}

// ============================================================================
// SUPABASE CLIENT TYPES
// ============================================================================

export interface SupabaseClient {
  from: (table: string) => SupabaseQueryBuilder;
  rpc: (fn: string, params?: Record<string, unknown>) => SupabaseRPCBuilder;
  close: () => Promise<void>;
}

export interface SupabaseQueryBuilder {
  select: (columns?: string) => SupabaseQueryBuilder;
  insert: (data: unknown) => SupabaseQueryBuilder;
  update: (data: unknown) => SupabaseQueryBuilder;
  delete: () => SupabaseQueryBuilder;
  eq: (column: string, value: unknown) => SupabaseQueryBuilder;
  neq: (column: string, value: unknown) => SupabaseQueryBuilder;
  gt: (column: string, value: unknown) => SupabaseQueryBuilder;
  gte: (column: string, value: unknown) => SupabaseQueryBuilder;
  lt: (column: string, value: unknown) => SupabaseQueryBuilder;
  lte: (column: string, value: unknown) => SupabaseQueryBuilder;
  like: (column: string, pattern: string) => SupabaseQueryBuilder;
  ilike: (column: string, pattern: string) => SupabaseQueryBuilder;
  is: (column: string, value: unknown) => SupabaseQueryBuilder;
  in: (column: string, values: unknown[]) => SupabaseQueryBuilder;
  contains: (column: string, value: unknown) => SupabaseQueryBuilder;
  containedBy: (column: string, value: unknown) => SupabaseQueryBuilder;
  rangeGt: (column: string, value: unknown) => SupabaseQueryBuilder;
  rangeGte: (column: string, value: unknown) => SupabaseQueryBuilder;
  rangeLt: (column: string, value: unknown) => SupabaseQueryBuilder;
  rangeLte: (column: string, value: unknown) => SupabaseQueryBuilder;
  rangeAdjacent: (column: string, value: unknown) => SupabaseQueryBuilder;
  overlaps: (column: string, value: unknown) => SupabaseQueryBuilder;
  textSearch: (column: string, query: string) => SupabaseQueryBuilder;
  match: (query: Record<string, unknown>) => SupabaseQueryBuilder;
  not: (column: string, operator: string, value: unknown) => SupabaseQueryBuilder;
  or: (filters: string) => SupabaseQueryBuilder;
  filter: (column: string, operator: string, value: unknown) => SupabaseQueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => SupabaseQueryBuilder;
  limit: (count: number) => SupabaseQueryBuilder;
  range: (from: number, to: number) => SupabaseQueryBuilder;
  single: () => Promise<{ data: unknown; error: Error | null }>;
  maybeSingle: () => Promise<{ data: unknown; error: Error | null }>;
  csv: () => Promise<{ data: string; error: Error | null }>;
  geojson: () => Promise<{ data: unknown; error: Error | null }>;
  explain: (options?: { analyze?: boolean; verbose?: boolean; buffers?: boolean; format?: string }) => Promise<{ data: unknown; error: Error | null }>;
  rollback: () => SupabaseQueryBuilder;
  returns: (columns: string) => SupabaseQueryBuilder;
  timeout: (ms: number) => SupabaseQueryBuilder;
  then: (onfulfilled?: (value: { data: unknown; error: Error | null }) => unknown, onrejected?: (reason: unknown) => unknown) => Promise<unknown>;
}

export interface SupabaseRPCBuilder {
  single: () => Promise<{ data: unknown; error: Error | null }>;
  maybeSingle: () => Promise<{ data: unknown; error: Error | null }>;
  then: (onfulfilled?: (value: { data: unknown; error: Error | null }) => unknown, onrejected?: (reason: unknown) => unknown) => Promise<unknown>;
}

// ============================================================================
// DATABASE HEALTH CHECK TYPES
// ============================================================================

export interface DatabaseHealthCheck {
  test: string;
  status: 'healthy' | 'unhealthy';
  error: string | null;
}

export interface DatabaseHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  healthPercentage: number;
  responseTime: string;
  tests: DatabaseHealthCheck[];
  queryStats: {
    totalQueries: number;
    averageQueryTime: number;
    slowQueries: number;
    topSlowQueries: Array<{
      sql: string;
      avgTime: number;
      count: number;
    }>;
  };
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface AnalyticsData {
  period: string;
  summary: {
    totalUsers: number;
    totalPolls: number;
    totalVotes: number;
    activeUsers: number;
    newPolls: number;
    newVotes: number;
  };
  trends: {
    userGrowth: Array<{ date: string; count: number }>;
    pollActivity: Array<{ date: string; count: number }>;
    voteActivity: Array<{ date: string; count: number }>;
  };
}

// ============================================================================
// CACHE TYPES
// ============================================================================

export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  ttl: number;
  createdAt: Date;
  accessedAt: Date;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  memoryUsage: number;
}

// ============================================================================
// USER PROFILE TYPES
// ============================================================================

export interface UserProfile {
  user_id: string;
  username: string;
  email: string;
  trust_tier: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// POLL TYPES
// ============================================================================

export interface Poll {
  id: string;
  title: string;
  description: string;
  options: string[];
  category: string;
  privacy_level: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface PollWithVotes extends Poll {
  votes: Array<{
    count: number;
  }>;
}

export interface PollPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PollsResponse {
  polls: PollWithVotes[];
  pagination: PollPagination;
}

// ============================================================================
// VOTE TYPES
// ============================================================================

export interface Vote {
  id: string;
  poll_id: string;
  user_id?: string;
  choice: string;
  created_at: string;
}

export interface VoteWithUserInfo extends Vote {
  user_profiles: {
    username: string;
    trust_tier: string;
  };
}

export interface VoteGroupedByChoice {
  choice: string;
  count: number;
}

export interface VoteInsert {
  poll_id: string;
  user_id?: string;
  choice: string;
  created_at?: string;
}

// ============================================================================
// CACHE DATABASE TYPES
// ============================================================================

export interface CacheDatabaseEntry {
  key: string;
  value: string;
  expires_at: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DatabaseTable = 'user_profiles' | 'polls' | 'votes' | 'cache' | 'breaking_news' | 'news_sources';

export type DatabaseOperation = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';

export interface DatabaseError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}
