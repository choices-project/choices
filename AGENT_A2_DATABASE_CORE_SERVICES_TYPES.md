# Agent A2: Database & Core Services Types

**Created**: 2025-09-16  
**Scope**: Fix TypeScript `any` types in database and core service modules  
**Files**: 12 files, ~60 errors  
**Estimated Time**: 4-5 hours

## Target Files & Error Counts

### High Priority (Critical Errors)
1. **`lib/core/database/optimizer.ts`** - 12+ `any` types + unused vars
2. **`lib/database/query-optimizer.ts`** - 8+ `any` types + unused vars
3. **`lib/core/feature-flags.ts`** - 10+ `any` types + unused vars
4. **`lib/core/services/real-time-news.ts`** - 10+ `any` types

### Medium Priority
5. **`lib/database/connection-pool.ts`** - 4+ `any` types
6. **`lib/database/performance-monitor.ts`** - 2+ `any` types + unused vars
7. **`lib/integrations/caching.ts`** - 6+ `any` types + unused vars
8. **`lib/deployment/pre-launch-checklist.ts`** - 4+ `any` types

### Lower Priority
9. **`lib/core/database/index.ts`** - 1+ `any` type
10. **`lib/core/services/hybrid-voting.ts`** - 1+ `any` type
11. **`lib/core/types/index.ts`** - 5+ `any` types
12. **`lib/integrations/monitoring.ts`** - unused imports

## Detailed Error Analysis

### `lib/core/database/optimizer.ts` (12+ errors)
```typescript
// Lines with `any` types:
88:21  Error: Unexpected any. Specify a different type.
90:25  Error: Unexpected any. Specify a different type.
286:38 Error: Unexpected any. Specify a different type.
287:41 Error: Unexpected any. Specify a different type.
287:52 Error: Unexpected any. Specify a different type.
318:52 Error: Unexpected any. Specify a different type.
335:46 Error: Unexpected any. Specify a different type.
393:53 Error: Unexpected any. Specify a different type.
429:17 Error: Unexpected any. Specify a different type.
495:25 Error: Unexpected any. Specify a different type.

// Unused vars:
329:14 Warning: '_error' is defined but never used.
346:14 Warning: '_error' is defined but never used.
```

**Key Tasks**:
1. Define database query result types
2. Type optimization metrics and statistics
3. Create proper error handling types
4. Fix unused error variables

### `lib/database/query-optimizer.ts` (8+ errors)
```typescript
// Lines with `any` types:
42:19  Error: Unexpected any. Specify a different type.
48:11  Error: Unexpected any. Specify a different type.
60:21  Error: Unexpected any. Specify a different type.
87:26  Error: Unexpected any. Specify a different type.
206:41 Error: Unexpected any. Specify a different type.
219:41 Error: Unexpected any. Specify a different type.
387:38 Error: Unexpected any. Specify a different type.
409:41 Error: Unexpected any. Specify a different type.

// Unused vars:
95:7  Warning: 'timeout' is assigned a value but never used.
111:11 Warning: 'fromCache' is assigned a value but never used.
112:11 Warning: 'cacheHit' is assigned a value but never used.
409:59 Warning: 'tags' is defined but never used.
```

**Key Tasks**:
1. Define query optimization result types
2. Type caching and performance metrics
3. Create proper timeout and cache configuration types
4. Fix unused variable warnings

### `lib/core/feature-flags.ts` (10+ errors)
```typescript
// Lines with `any` types:
35:25  Error: Unexpected any. Specify a different type.
52:25  Error: Unexpected any. Specify a different type.
60:25  Error: Unexpected any. Specify a different type.
68:25  Error: Unexpected any. Specify a different type.
151:33 Error: Unexpected any. Specify a different type.
156:65 Error: Unexpected any. Specify a different type.
164:25 Error: Unexpected any. Specify a different type.
167:21 Error: Unexpected any. Specify a different type.
175:26 Error: Unexpected any. Specify a different type.
180:29 Error: Unexpected any. Specify a different type.

// Unused vars:
18:6  Warning: 'KnownFlag' is defined but never used.
151:15 Warning: 'callback' is defined but never used.
```

**Key Tasks**:
1. Define feature flag configuration types
2. Type flag evaluation and callback functions
3. Create proper flag metadata types
4. Fix unused variable warnings

### `lib/core/services/real-time-news.ts` (10+ errors)
```typescript
// Lines with `any` types:
41:29  Error: Unexpected any. Specify a different type.
77:29  Error: Unexpected any. Specify a different type.
443:25 Error: Unexpected any. Specify a different type.
483:34 Error: Unexpected any. Specify a different type.
501:25 Error: Unexpected any. Specify a different type.
677:39 Error: Unexpected any. Specify a different type.
696:67 Error: Unexpected any. Specify a different type.
712:37 Error: Unexpected any. Specify a different type.
730:59 Error: Unexpected any. Specify a different type.
752:71 Error: Unexpected any. Specify a different type.
```

**Key Tasks**:
1. Define news API response types
2. Type real-time data structures
3. Create proper news article and source types
4. Type external API integrations

## Implementation Strategy

### 1. Create Database Type Definitions
Create `lib/database/types.ts`:
```typescript
// Database Types
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

// Query Optimizer Types
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
```

### 2. Create Core Service Types
Create `lib/core/services/types.ts`:
```typescript
// Feature Flags Types
export interface FeatureFlag {
  name: string;
  enabled: boolean;
  value: string | number | boolean;
  description: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FlagEvaluation {
  flag: string;
  value: boolean;
  reason: 'default' | 'targeting' | 'override';
  timestamp: Date;
}

export interface FlagCallback {
  (flag: string, value: boolean): void;
}

// Real-time News Types
export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  author: string;
  publishedAt: Date;
  source: string;
  url: string;
  tags: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  reliability: number;
  bias: 'left' | 'center' | 'right';
  lastUpdated: Date;
}

export interface NewsAPIResponse {
  articles: NewsArticle[];
  totalResults: number;
  page: number;
  pageSize: number;
}
```

### 3. Create Integration Types
Create `lib/integrations/types.ts`:
```typescript
// Caching Types
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

// Monitoring Types
export interface MonitoringMetrics {
  timestamp: Date;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  requests: number;
  errors: number;
}

export interface AlertConfig {
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq';
  duration: number;
  enabled: boolean;
}
```

### 4. Type Implementation Examples

#### Before (with `any`):
```typescript
export async function optimizeQuery(query: string): Promise<any> {
  const result = await executeQuery(query);
  return {
    data: result.data,
    metrics: result.metrics
  };
}
```

#### After (properly typed):
```typescript
export async function optimizeQuery(
  query: string
): Promise<QueryResult & { metrics: OptimizationMetrics }> {
  const result = await executeQuery(query);
  return {
    data: result.data,
    count: result.count,
    error: result.error,
    metrics: result.metrics
  };
}
```

## Testing Strategy

### 1. Unit Tests
- Test database query optimization functions
- Test feature flag evaluation logic
- Test caching and monitoring services
- Verify type safety at compile time

### 2. Integration Tests
- Test database connection pooling
- Test real-time news service integration
- Test performance monitoring
- Test feature flag toggling

### 3. Performance Tests
- Test query optimization performance
- Test caching effectiveness
- Test monitoring overhead
- Test memory usage

## Success Criteria

### Phase 1: Critical Fixes
- [ ] Zero `any` types in `database/optimizer.ts`
- [ ] Zero `any` types in `query-optimizer.ts`
- [ ] Zero `any` types in `feature-flags.ts`
- [ ] Zero `any` types in `real-time-news.ts`

### Phase 2: Complete Module
- [ ] All 12 files have zero `any` types
- [ ] All unused variables prefixed with `_` or removed
- [ ] All unused imports removed
- [ ] Build passes for database and core service modules

### Phase 3: Validation
- [ ] `npm run build` completes successfully
- [ ] `npm run lint` passes with zero errors
- [ ] All TypeScript strict mode checks pass
- [ ] Database and core services work correctly

## File-by-File Checklist

### High Priority Files
- [ ] `lib/core/database/optimizer.ts` - 12+ `any` types + unused vars → 0
- [ ] `lib/database/query-optimizer.ts` - 8+ `any` types + unused vars → 0
- [ ] `lib/core/feature-flags.ts` - 10+ `any` types + unused vars → 0
- [ ] `lib/core/services/real-time-news.ts` - 10+ `any` types → 0

### Medium Priority Files
- [ ] `lib/database/connection-pool.ts` - 4+ `any` types → 0
- [ ] `lib/database/performance-monitor.ts` - 2+ `any` types + unused vars → 0
- [ ] `lib/integrations/caching.ts` - 6+ `any` types + unused vars → 0
- [ ] `lib/deployment/pre-launch-checklist.ts` - 4+ `any` types → 0

### Lower Priority Files
- [ ] `lib/core/database/index.ts` - 1+ `any` type → 0
- [ ] `lib/core/services/hybrid-voting.ts` - 1+ `any` type → 0
- [ ] `lib/core/types/index.ts` - 5+ `any` types → 0
- [ ] `lib/integrations/monitoring.ts` - unused imports → 0

## Notes

- Focus on database performance and optimization types
- Maintain compatibility with existing Supabase queries
- Test thoroughly as database changes can affect performance
- Coordinate with other agents for shared type definitions
- Use existing database schema types where possible
