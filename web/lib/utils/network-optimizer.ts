/**
 * Network Optimization Utilities
 * 
 * Provides utilities for optimizing network requests, caching,
 * and reducing API calls for better performance.
 * 
 * Created: January 27, 2025
 * Status: ✅ ACTIVE
 */

// Import React for the hook
import React from 'react';

export type CacheConfig = {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum cache size
  strategy: 'memory' | 'localStorage' | 'sessionStorage';
}

export type RequestConfig = {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  cache?: CacheConfig;
  retries?: number;
  timeout?: number;
}

export type NetworkMetrics = {
  totalRequests: number;
  cachedRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalDataTransferred: number;
}

/**
 * Network Optimizer Class
 */
export class NetworkOptimizer {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private requestQueue = new Map<string, Promise<any>>();
  private metrics: NetworkMetrics = {
    totalRequests: 0,
    cachedRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    totalDataTransferred: 0,
  };

  constructor(private defaultConfig: Partial<RequestConfig> = {}) {}

  /**
   * Make an optimized network request
   */
  async request<T>(config: RequestConfig): Promise<T> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(config);

    // Check cache first
    if (config.method === 'GET' && config.cache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.metrics.cachedRequests++;
        return cached;
      }
    }

    // Check if request is already in progress
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey)!;
    }

    // Make the request
    const requestPromise = this.makeRequest<T>(config, startTime);
    this.requestQueue.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache the result if configured
      if (config.method === 'GET' && config.cache && result) {
        this.setCache(cacheKey, result, config.cache);
      }

      return result;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  /**
   * Make the actual network request
   */
  private async makeRequest<T>(config: RequestConfig, startTime: number): Promise<T> {
    const { url, method, headers = {}, body, retries = 3, timeout = 10000 } = config;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const responseTime = Date.now() - startTime;

        // Update metrics
        this.metrics.totalRequests++;
        this.metrics.averageResponseTime = 
          (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
          this.metrics.totalRequests;
        this.metrics.totalDataTransferred += JSON.stringify(data).length;

        return data;
      } catch (error) {
        if (attempt === retries) {
          this.metrics.failedRequests++;
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(config: RequestConfig): string {
    return `${config.method}:${config.url}:${JSON.stringify(config.body || {})}`;
  }

  /**
   * Get data from cache
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set data in cache
   */
  private setCache(key: string, data: any, config: CacheConfig): void {
    // Check cache size limit
    if (this.cache.size >= config.maxSize) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey!);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: config.ttl,
    });
  }

  /**
   * Batch multiple requests
   */
  async batch<T>(requests: RequestConfig[]): Promise<T[]> {
    const promises = requests.map(config => this.request<T>(config));
    return Promise.all(promises);
  }

  /**
   * Debounce requests to prevent excessive API calls
   */
  debounce<T>(
    key: string,
    config: RequestConfig,
    delay = 300
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(async () => {
        try {
          const result = await this.request<T>(config);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);

      // Store timeout ID for potential cancellation
      (config as any).timeoutId = timeoutId;
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get network metrics
   */
  getMetrics(): NetworkMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      cachedRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalDataTransferred: 0,
    };
  }
}

/**
 * Global network optimizer instance
 */
export const networkOptimizer = new NetworkOptimizer({
  cache: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    strategy: 'memory',
  },
  retries: 2,
  timeout: 10000,
});

/**
 * Optimized API client for common operations
 */
export class OptimizedAPIClient {
  constructor(private baseURL: string, private optimizer: NetworkOptimizer = networkOptimizer) {}

  /**
   * Get data with caching
   */
  async get<T>(endpoint: string, options: Partial<RequestConfig> = {}): Promise<T> {
    return this.optimizer.request<T>({
      url: `${this.baseURL}${endpoint}`,
      method: 'GET',
      cache: {
        ttl: 5 * 60 * 1000, // 5 minutes
        maxSize: 100,
        strategy: 'memory',
      },
      ...options,
    });
  }

  /**
   * Post data without caching
   */
  async post<T>(endpoint: string, data: any, options: Partial<RequestConfig> = {}): Promise<T> {
    return this.optimizer.request<T>({
      url: `${this.baseURL}${endpoint}`,
      method: 'POST',
      body: data,
      ...options,
    });
  }

  /**
   * Batch get requests
   */
  async batchGet<T>(endpoints: string[], options: Partial<RequestConfig> = {}): Promise<T[]> {
    const requests = endpoints.map(endpoint => ({
      url: `${this.baseURL}${endpoint}`,
      method: 'GET' as const,
      cache: {
        ttl: 5 * 60 * 1000,
        maxSize: 100,
        strategy: 'memory' as const,
      },
      ...options,
    }));

    return this.optimizer.batch<T>(requests);
  }
}

/**
 * Hook for using network optimization in React components
 */
export function useNetworkOptimization() {
  const [metrics, setMetrics] = React.useState<NetworkMetrics>(networkOptimizer.getMetrics());
  const [isLoading, setIsLoading] = React.useState(false);

  const makeRequest = React.useCallback(async <T>(config: RequestConfig): Promise<T> => {
    setIsLoading(true);
    try {
      const result = await networkOptimizer.request<T>(config);
      setMetrics(networkOptimizer.getMetrics());
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCache = React.useCallback(() => {
    networkOptimizer.clearCache();
    setMetrics(networkOptimizer.getMetrics());
  }, []);

  const resetMetrics = React.useCallback(() => {
    networkOptimizer.resetMetrics();
    setMetrics(networkOptimizer.getMetrics());
  }, []);

  return {
    metrics,
    isLoading,
    makeRequest,
    clearCache,
    resetMetrics,
  };
}

