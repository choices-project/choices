# ⚡ Civics Feature Performance Guidelines

**Date**: January 15, 2025  
**Status**: 🚀 **PERFORMANCE OPTIMIZATION REQUIREMENTS**  
**Scope**: Performance optimization for civics data ingestion and API integration

---

## 🎯 **Performance Overview**

The civics feature must handle high-volume requests for political data while maintaining sub-second response times. This document outlines performance requirements and optimization strategies.

---

## 📊 **Performance Requirements**

### **Response Time Targets**
- **Address Lookup**: < 500ms (95th percentile)
- **District Information**: < 200ms (95th percentile)
- **Representative Data**: < 300ms (95th percentile)
- **API Health Checks**: < 100ms (95th percentile)

### **Throughput Targets**
- **Concurrent Users**: 1,000+ simultaneous users
- **Requests per Second**: 500+ RPS sustained
- **Peak Load**: 2,000+ RPS for 5 minutes
- **Data Processing**: 10,000+ records per minute

### **Availability Targets**
- **Uptime**: 99.9% availability
- **Error Rate**: < 0.1% error rate
- **Recovery Time**: < 30 seconds for service recovery
- **Data Freshness**: < 5 minutes for cached data

---

## 🚨 **Current Performance Issues**

### **1. No Caching Strategy**
- **Issue**: Every request hits external APIs
- **Impact**: High latency, API rate limit exhaustion
- **Solution**: Implement multi-layer caching

### **2. Inefficient Database Queries**
- **Issue**: Missing indexes, inefficient queries
- **Impact**: Slow database responses
- **Solution**: Add proper indexes and optimize queries

### **3. No Connection Pooling**
- **Issue**: New connections for each request
- **Impact**: High connection overhead
- **Solution**: Implement connection pooling

### **4. Synchronous Processing**
- **Issue**: Blocking operations for all requests
- **Impact**: Poor concurrency, resource waste
- **Solution**: Implement async processing

---

## 🔧 **Performance Optimization Implementation**

### **1. Multi-Layer Caching Strategy**

#### **Redis Caching Layer**
```typescript
import Redis from 'ioredis';

export class CivicsCacheManager {
  private redis: Redis;
  private memoryCache: Map<string, CacheEntry> = new Map();
  
  constructor(redis: Redis) {
    this.redis = redis;
  }
  
  async get<T>(key: string): Promise<T | null> {
    // L1: Memory cache (fastest)
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      this.recordCacheHit('memory');
      return memoryEntry.data as T;
    }
    
    // L2: Redis cache (fast)
    const redisData = await this.redis.get(key);
    if (redisData) {
      const data = JSON.parse(redisData);
      this.memoryCache.set(key, { data, timestamp: Date.now() });
      this.recordCacheHit('redis');
      return data as T;
    }
    
    this.recordCacheMiss();
    return null;
  }
  
  async set<T>(key: string, data: T, ttl: number = 3600): Promise<void> {
    // Set in both caches
    this.memoryCache.set(key, { data, timestamp: Date.now() });
    await this.redis.setex(key, ttl, JSON.stringify(data));
  }
  
  async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttl: number = 3600
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;
    
    const data = await fetchFn();
    await this.set(key, data, ttl);
    return data;
  }
  
  private isExpired(entry: CacheEntry): boolean {
    const maxAge = 5 * 60 * 1000; // 5 minutes
    return Date.now() - entry.timestamp > maxAge;
  }
  
  private recordCacheHit(type: 'memory' | 'redis'): void {
    // Record metrics for monitoring
    this.metrics.increment(`cache_hits_total{type="${type}"}`);
  }
  
  private recordCacheMiss(): void {
    this.metrics.increment('cache_misses_total');
  }
}
```

#### **Cache Key Strategy**
```typescript
export class CivicsCacheKeys {
  static addressLookup(address: string): string {
    const hash = crypto.createHash('sha256').update(address.toLowerCase().trim()).digest('hex');
    return `civics:address:${hash}`;
  }
  
  static districtInfo(districtId: string): string {
    return `civics:district:${districtId}`;
  }
  
  static representatives(districtId: string): string {
    return `civics:representatives:${districtId}`;
  }
  
  static apiResponse(service: string, params: Record<string, unknown>): string {
    const paramHash = crypto.createHash('md5')
      .update(JSON.stringify(params))
      .digest('hex');
    return `civics:api:${service}:${paramHash}`;
  }
}
```

### **2. Database Optimization**

#### **Index Optimization**
```sql
-- Address lookup optimization
CREATE INDEX CONCURRENTLY idx_civics_addresses_hash ON civics_addresses USING hash (address_hash);
CREATE INDEX CONCURRENTLY idx_civics_addresses_geohash ON civics_addresses USING btree (geohash);

-- District optimization
CREATE INDEX CONCURRENTLY idx_civics_districts_state_district ON civics_districts (state, district_number) INCLUDE (id, name);
CREATE INDEX CONCURRENTLY idx_civics_districts_active ON civics_districts (active) WHERE active = true;

-- Representative optimization
CREATE INDEX CONCURRENTLY idx_civics_representatives_district ON civics_representatives (district_id, active);
CREATE INDEX CONCURRENTLY idx_civics_representatives_active ON civics_representatives (active) WHERE active = true;

-- Performance monitoring
CREATE INDEX CONCURRENTLY idx_civics_performance_timestamp ON civics_performance (timestamp DESC);
```

#### **Query Optimization**
```typescript
export class CivicsQueryOptimizer {
  async getDistrictInfo(districtId: string): Promise<DistrictInfo | null> {
    // Use prepared statement for better performance
    const query = `
      SELECT d.id, d.state, d.district_number, d.name,
             COUNT(r.id) as representative_count,
             MAX(r.last_updated) as last_updated
      FROM civics_districts d
      LEFT JOIN civics_representatives r ON d.id = r.district_id AND r.active = true
      WHERE d.id = $1
      GROUP BY d.id, d.state, d.district_number, d.name
    `;
    
    const result = await this.db.query(query, [districtId]);
    return result.rows[0] || null;
  }
  
  async getRepresentativesByDistrict(districtId: string): Promise<Representative[]> {
    // Optimized query with proper joins
    const query = `
      SELECT r.id, r.name, r.party, r.office, r.contact,
             d.state, d.district_number
      FROM civics_representatives r
      JOIN civics_districts d ON r.district_id = d.id
      WHERE r.district_id = $1 AND r.active = true
      ORDER BY r.office, r.name
    `;
    
    const result = await this.db.query(query, [districtId]);
    return result.rows;
  }
  
  async batchGetDistricts(districtIds: string[]): Promise<DistrictInfo[]> {
    // Batch query for multiple districts
    const query = `
      SELECT d.id, d.state, d.district_number, d.name,
             COUNT(r.id) as representative_count
      FROM civics_districts d
      LEFT JOIN civics_representatives r ON d.id = r.district_id AND r.active = true
      WHERE d.id = ANY($1)
      GROUP BY d.id, d.state, d.district_number, d.name
    `;
    
    const result = await this.db.query(query, [districtIds]);
    return result.rows;
  }
}
```

#### **Connection Pooling**
```typescript
import { Pool } from 'pg';

export class CivicsDatabase {
  private pool: Pool;
  
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20, // Maximum connections
      min: 5,  // Minimum connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
    });
  }
  
  async query(text: string, params?: unknown[]): Promise<QueryResult> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      // Record query performance
      this.recordQueryPerformance(text, duration, result.rowCount);
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.recordQueryError(text, duration, error);
      throw error;
    }
  }
  
  private recordQueryPerformance(query: string, duration: number, rowCount: number): void {
    this.metrics.observe('db_query_duration_seconds', duration / 1000);
    this.metrics.observe('db_query_rows', rowCount);
  }
}
```

### **3. API Performance Optimization**

#### **Request Batching**
```typescript
export class CivicsBatchProcessor {
  private batchQueue: Map<string, BatchRequest[]> = new Map();
  private batchTimeout: NodeJS.Timeout | null = null;
  
  async processRequest<T>(key: string, request: BatchRequest): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.batchQueue.has(key)) {
        this.batchQueue.set(key, []);
      }
      
      this.batchQueue.get(key)!.push({
        ...request,
        resolve,
        reject
      });
      
      this.scheduleBatchProcessing();
    });
  }
  
  private scheduleBatchProcessing(): void {
    if (this.batchTimeout) return;
    
    this.batchTimeout = setTimeout(() => {
      this.processBatches();
      this.batchTimeout = null;
    }, 100); // Process batches every 100ms
  }
  
  private async processBatches(): Promise<void> {
    const batches = Array.from(this.batchQueue.entries());
    this.batchQueue.clear();
    
    const promises = batches.map(([key, requests]) => 
      this.processBatch(key, requests)
    );
    
    await Promise.all(promises);
  }
  
  private async processBatch(key: string, requests: BatchRequest[]): Promise<void> {
    try {
      const results = await this.executeBatch(key, requests);
      
      requests.forEach((request, index) => {
        request.resolve(results[index]);
      });
    } catch (error) {
      requests.forEach(request => {
        request.reject(error);
      });
    }
  }
}
```

#### **API Response Caching**
```typescript
export class CivicsApiCache {
  private cache: CivicsCacheManager;
  
  async getCachedApiResponse<T>(
    service: string, 
    endpoint: string, 
    params: Record<string, unknown>,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cacheKey = CivicsCacheKeys.apiResponse(service, { endpoint, params });
    const ttl = this.getCacheTTL(service, endpoint);
    
    return await this.cache.getOrSet(cacheKey, fetchFn, ttl);
  }
  
  private getCacheTTL(service: string, endpoint: string): number {
    const ttlMap: Record<string, Record<string, number>> = {
      'google-civic': {
        'voterinfo': 3600, // 1 hour
        'representatives': 1800, // 30 minutes
        'elections': 86400 // 24 hours
      },
      'congress-gov': {
        'members': 1800, // 30 minutes
        'bills': 900, // 15 minutes
        'votes': 300 // 5 minutes
      },
      'fec': {
        'candidates': 3600, // 1 hour
        'committees': 3600, // 1 hour
        'contributions': 1800 // 30 minutes
      }
    };
    
    return ttlMap[service]?.[endpoint] || 1800; // Default 30 minutes
  }
}
```

### **4. Async Processing**

#### **Background Job Processing**
```typescript
import Bull from 'bull';

export class CivicsJobProcessor {
  private addressLookupQueue: Bull.Queue;
  private dataUpdateQueue: Bull.Queue;
  
  constructor() {
    this.addressLookupQueue = new Bull('address-lookup', {
      redis: { host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT || '6379') },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });
    
    this.dataUpdateQueue = new Bull('data-update', {
      redis: { host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT || '6379') },
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 25,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    });
    
    this.setupJobProcessors();
  }
  
  async queueAddressLookup(address: string, userId: string): Promise<void> {
    await this.addressLookupQueue.add('lookup', {
      address,
      userId,
      timestamp: Date.now()
    }, {
      priority: this.getPriority(userId),
      delay: this.getDelay(userId)
    });
  }
  
  async queueDataUpdate(districtId: string, dataType: string): Promise<void> {
    await this.dataUpdateQueue.add('update', {
      districtId,
      dataType,
      timestamp: Date.now()
    }, {
      priority: 1,
      delay: 0
    });
  }
  
  private setupJobProcessors(): void {
    this.addressLookupQueue.process('lookup', 10, async (job) => {
      const { address, userId } = job.data;
      return await this.processAddressLookup(address, userId);
    });
    
    this.dataUpdateQueue.process('update', 5, async (job) => {
      const { districtId, dataType } = job.data;
      return await this.processDataUpdate(districtId, dataType);
    });
  }
  
  private getPriority(userId: string): number {
    // Higher priority for verified users
    return this.isVerifiedUser(userId) ? 1 : 5;
  }
  
  private getDelay(userId: string): number {
    // Delay for rate limiting
    return this.isVerifiedUser(userId) ? 0 : 1000;
  }
}
```

### **5. Performance Monitoring**

#### **Metrics Collection**
```typescript
export class CivicsPerformanceMetrics {
  private metrics: Map<string, number> = new Map();
  
  recordApiCall(service: string, endpoint: string, duration: number, success: boolean): void {
    this.increment(`api_calls_total{service="${service}",endpoint="${endpoint}",success="${success}"}`);
    this.observe(`api_duration_seconds{service="${service}",endpoint="${endpoint}"}`, duration);
  }
  
  recordCacheHit(cacheType: string): void {
    this.increment(`cache_hits_total{type="${cacheType}"}`);
  }
  
  recordCacheMiss(cacheType: string): void {
    this.increment(`cache_misses_total{type="${cacheType}"}`);
  }
  
  recordDatabaseQuery(query: string, duration: number, rowCount: number): void {
    this.observe('db_query_duration_seconds', duration);
    this.observe('db_query_rows', rowCount);
  }
  
  recordResponseTime(endpoint: string, duration: number): void {
    this.observe(`response_time_seconds{endpoint="${endpoint}"}`, duration);
  }
  
  recordConcurrentUsers(count: number): void {
    this.gauge('concurrent_users', count);
  }
  
  private increment(metric: string): void {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + 1);
  }
  
  private observe(metric: string, value: number): void {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + value);
  }
  
  private gauge(metric: string, value: number): void {
    this.metrics.set(metric, value);
  }
}
```

#### **Performance Alerts**
```typescript
export class CivicsPerformanceAlerts {
  async checkPerformanceAlerts(): Promise<void> {
    const metrics = await this.getPerformanceMetrics();
    
    // High response time alert
    if (metrics.avgResponseTime > 1000) { // 1 second
      await this.sendAlert('HIGH_RESPONSE_TIME', {
        responseTime: metrics.avgResponseTime,
        threshold: 1000
      });
    }
    
    // Low cache hit rate alert
    if (metrics.cacheHitRate < 0.8) { // 80%
      await this.sendAlert('LOW_CACHE_HIT_RATE', {
        hitRate: metrics.cacheHitRate,
        threshold: 0.8
      });
    }
    
    // High error rate alert
    if (metrics.errorRate > 0.01) { // 1%
      await this.sendAlert('HIGH_ERROR_RATE', {
        errorRate: metrics.errorRate,
        threshold: 0.01
      });
    }
    
    // High concurrent users alert
    if (metrics.concurrentUsers > 2000) {
      await this.sendAlert('HIGH_CONCURRENT_USERS', {
        users: metrics.concurrentUsers,
        threshold: 2000
      });
    }
  }
}
```

---

## 🧪 **Performance Testing**

### **1. Load Testing**
```typescript
import { performance } from 'perf_hooks';

describe('Civics Performance Tests', () => {
  it('should handle 100 concurrent address lookups', async () => {
    const requests = Array(100).fill(null).map(() => 
      request(app)
        .get('/api/district')
        .query({ addr: '123 Main St, San Francisco, CA 94102' })
    );
    
    const start = performance.now();
    const responses = await Promise.all(requests);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    expect(responses.every(r => r.status === 200)).toBe(true);
  });
  
  it('should maintain response time under 500ms', async () => {
    const start = performance.now();
    const response = await request(app)
      .get('/api/district')
      .query({ addr: '123 Main St, San Francisco, CA 94102' })
      .expect(200);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(500); // Should respond within 500ms
  });
});
```

### **2. Cache Performance Testing**
```typescript
describe('Civics Cache Performance', () => {
  it('should cache address lookups', async () => {
    const address = '123 Main St, San Francisco, CA 94102';
    
    // First request (cache miss)
    const start1 = performance.now();
    await request(app)
      .get('/api/district')
      .query({ addr: address })
      .expect(200);
    const duration1 = performance.now() - start1;
    
    // Second request (cache hit)
    const start2 = performance.now();
    await request(app)
      .get('/api/district')
      .query({ addr: address })
      .expect(200);
    const duration2 = performance.now() - start2;
    
    expect(duration2).toBeLessThan(duration1 * 0.5); // Cache should be at least 2x faster
  });
});
```

### **3. Database Performance Testing**
```typescript
describe('Civics Database Performance', () => {
  it('should handle batch district queries efficiently', async () => {
    const districtIds = Array(50).fill(null).map((_, i) => `CA-${i + 1}`);
    
    const start = performance.now();
    const response = await request(app)
      .post('/api/districts/batch')
      .send({ districtIds })
      .expect(200);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(1000); // Should complete within 1 second
    expect(response.body.districts).toHaveLength(50);
  });
});
```

---

## 📊 **Performance Monitoring Dashboard**

### **1. Key Metrics to Monitor**
- **Response Time**: P50, P95, P99 percentiles
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests
- **Cache Hit Rate**: Percentage of cache hits
- **Database Performance**: Query duration, connection pool usage
- **API Performance**: External API response times
- **Resource Usage**: CPU, memory, disk I/O

### **2. Alerting Thresholds**
- **Response Time**: > 1 second (P95)
- **Error Rate**: > 1%
- **Cache Hit Rate**: < 80%
- **Database Query Time**: > 500ms
- **API Response Time**: > 2 seconds
- **Memory Usage**: > 80%
- **CPU Usage**: > 80%

### **3. Performance Reports**
- **Daily Performance Summary**: Response times, error rates, cache performance
- **Weekly Trend Analysis**: Performance trends over time
- **Monthly Capacity Planning**: Growth projections and scaling needs
- **Incident Reports**: Performance issues and resolutions

---

## 🎯 **Performance Implementation Checklist**

### **Phase 1: Critical Performance Fixes**
- [ ] **Caching Layer** - Implement Redis caching for API responses
- [ ] **Database Optimization** - Add proper indexes and optimize queries
- [ ] **Connection Pooling** - Implement database connection pooling
- [ ] **Response Time Monitoring** - Add performance metrics collection

### **Phase 2: Advanced Performance**
- [ ] **Request Batching** - Implement batch processing for multiple requests
- [ ] **Async Processing** - Background job processing for heavy operations
- [ ] **Load Balancing** - Distribute load across multiple instances
- [ ] **CDN Integration** - Cache static data at edge locations

### **Phase 3: Performance Optimization**
- [ ] **Query Optimization** - Optimize database queries and add materialized views
- [ ] **Memory Optimization** - Optimize memory usage and garbage collection
- [ ] **Network Optimization** - Optimize API calls and reduce payload sizes
- [ ] **Performance Testing** - Comprehensive load and stress testing

### **Phase 4: Performance Monitoring**
- [ ] **Real-time Monitoring** - Live performance dashboards
- [ ] **Automated Alerting** - Performance threshold alerts
- [ ] **Performance Analytics** - Trend analysis and capacity planning
- [ ] **Performance Optimization** - Continuous performance improvement

---

## 📋 **Performance Best Practices**

### **1. Development**
- Use async/await for all I/O operations
- Implement proper error handling and timeouts
- Use connection pooling for database connections
- Implement caching at multiple levels
- Optimize database queries and add proper indexes

### **2. Deployment**
- Use horizontal scaling for high availability
- Implement load balancing across multiple instances
- Use CDN for static content delivery
- Monitor resource usage and scale accordingly
- Implement proper logging and monitoring

### **3. Operations**
- Monitor performance metrics continuously
- Set up automated alerting for performance issues
- Conduct regular performance testing
- Optimize based on real-world usage patterns
- Plan for capacity growth and scaling

---

## 🚨 **Performance Incident Response**

### **1. Performance Issue Classification**
- **Critical**: Service unavailable, response time > 5 seconds
- **High**: Response time > 2 seconds, error rate > 5%
- **Medium**: Response time > 1 second, error rate > 1%
- **Low**: Response time > 500ms, cache hit rate < 80%

### **2. Response Procedures**
1. **Immediate Response**: Scale up resources, enable caching
2. **Assessment**: Identify root cause and impact
3. **Containment**: Implement temporary fixes
4. **Recovery**: Restore normal performance
5. **Post-Incident**: Analyze and implement permanent fixes

### **3. Performance Optimization**
- Identify bottlenecks and optimize accordingly
- Implement additional caching layers
- Optimize database queries and indexes
- Scale resources based on demand
- Implement performance monitoring and alerting

---

## 📚 **References**

- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)
- [Redis Performance Optimization](https://redis.io/docs/manual/performance/)
- [Web Performance Best Practices](https://web.dev/performance/)

---

**Document Generated**: January 15, 2025  
**Status**: 🚀 **PERFORMANCE OPTIMIZATION REQUIREMENTS**  
**Next Review**: After Phase 1 implementation
