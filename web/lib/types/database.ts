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

export type QueryResult<T = unknown> = {
  data: T[];
  count: number;
  error: Error | null;
}

export type OptimizationMetrics = {
  queryTime: number;
  cacheHit: boolean;
  fromCache: boolean;
  rowsAffected: number;
  memoryUsage: number;
}

export type ConnectionPoolConfig = {
  min: number;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

export type PerformanceMetrics = {
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

export type QueryPlan = {
  id: string;
  query: string;
  estimatedCost: number;
  executionTime: number;
  indexes: string[];
  tables: string[];
}

export type CacheConfig = {
  ttl: number;
  maxSize: number;
  strategy: 'lru' | 'fifo' | 'ttl';
}

export type QueryOptions = {
  useCache?: boolean;
  cacheTTL?: number;
  cacheTags?: string[];
  timeout?: number;
  retries?: number;
  explain?: boolean;
  analyze?: boolean;
}

export type QueryMetrics = {
  query: string;
  executionTime: number;
  rowsReturned: number;
  cacheHit: boolean;
  fromCache: boolean;
  error?: string;
  timestamp: number;
}

export type OptimizationResult = {
  originalQuery: string;
  optimizedQuery: string;
  optimizations: string[];
  estimatedImprovement: number;
  executionPlan?: QueryPlan;
}

export type QueryCacheEntry<T = unknown> = {
  query: string;
  result: T;
  timestamp: number;
  ttl: number;
  hitCount: number;
}

// ============================================================================
// CONNECTION POOL TYPES
// ============================================================================

export type PoolConfig = {
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

export type PoolMetrics = {
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

export type ConnectionWrapper = {
  id: string;
  connection: SupabaseClient;
  createdAt: number;
  lastUsed: number;
  isActive: boolean;
  isIdle: boolean;
  validationCount: number;
  lastValidation: number;
}

export type PoolStats = {
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

export type DatabaseMetrics = {
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

export type QueryPerformanceMetrics = {
  query: string;
  executionTime: number;
  rowsReturned: number;
  cacheHit: boolean;
  error?: string;
  timestamp: number;
}

export type PerformanceAlert = {
  id: string;
  type: 'warning' | 'error' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  resolved: boolean;
}

export type PerformanceRecommendation = {
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

export type PerformanceThresholds = {
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

export type SupabaseClient = {
  from: (table: string) => SupabaseQueryBuilder;
  rpc: (fn: string, params?: Record<string, unknown>) => SupabaseRPCBuilder;
  close: () => Promise<void>;
}

export type SupabaseQueryBuilder = {
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

export type SupabaseRPCBuilder = {
  single: () => Promise<{ data: unknown; error: Error | null }>;
  maybeSingle: () => Promise<{ data: unknown; error: Error | null }>;
  then: (onfulfilled?: (value: { data: unknown; error: Error | null }) => unknown, onrejected?: (reason: unknown) => unknown) => Promise<unknown>;
}

// ============================================================================
// DATABASE HEALTH CHECK TYPES
// ============================================================================

export type DatabaseHealthCheck = {
  test: string;
  status: 'healthy' | 'unhealthy';
  error: string | null;
}

export type DatabaseHealthStatus = {
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

export type AnalyticsData = {
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

export type CacheEntry<T = unknown> = {
  key: string;
  value: T;
  ttl: number;
  createdAt: Date;
  accessedAt: Date;
}

export type CacheStats = {
  hits: number;
  misses: number;
  size: number;
  memoryUsage: number;
}

// ============================================================================
// USER PROFILE TYPES
// ============================================================================

export type UserProfile = {
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

export type Poll = {
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

export type PollWithVotes = {
  votes: Array<{
    count: number;
  }>;
} & Poll

export type PollPagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export type PollsResponse = {
  polls: PollWithVotes[];
  pagination: PollPagination;
}

// ============================================================================
// VOTE TYPES
// ============================================================================

export type Vote = {
  id: string;
  poll_id: string;
  user_id?: string;
  choice: string;
  created_at: string;
}

export type VoteWithUserInfo = {
  user_profiles: {
    username: string;
    trust_tier: string;
  };
} & Vote

export type VoteGroupedByChoice = {
  choice: string;
  count: number;
}

export type VoteInsert = {
  poll_id: string;
  user_id?: string;
  choice: string;
  created_at?: string;
}

// ============================================================================
// CACHE DATABASE TYPES
// ============================================================================

export type CacheDatabaseEntry = {
  key: string;
  value: string;
  expires_at: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DatabaseTable = 'user_profiles' | 'polls' | 'votes' | 'cache' | 'breaking_news' | 'news_sources';

export type DatabaseOperation = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';

export type DatabaseError = {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}
