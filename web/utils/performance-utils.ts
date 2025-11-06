/// <reference types="node" />

/**
 * Performance Utilities
 * 
 * Provides utility functions for performance optimization,
 * monitoring, and analysis.
 */

import { performanceMetrics } from '../lib/performance/performance-metrics';

/**
 * Debounce function to limit function calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

/**
 * Throttle function to limit function calls
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Measure function execution time
 */
export function measureTime<T extends (...args: unknown[]) => unknown>(
  func: T,
  name: string
): T {
  return ((...args: Parameters<T>) => {
    const startTime = performance.now();
    const result = func(...args);
    const endTime = performance.now();
    
    const executionTime = endTime - startTime;
    performanceMetrics.addMetric(`function-${name}`, executionTime);
    
    return result;
  }) as T;
}

/**
 * Create a performance timer
 */
export class PerformanceTimer {
  private startTime: number;
  private name: string;
  
  constructor(name: string) {
    this.name = name;
    this.startTime = performance.now();
  }
  
  end(): number {
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    
    performanceMetrics.addMetric(`timer-${this.name}`, duration);
    
    return duration;
  }
  
  mark(markName: string): number {
    const currentTime = performance.now();
    const duration = currentTime - this.startTime;
    
    performanceMetrics.addMetric(`timer-${this.name}-${markName}`, duration);
    
    return duration;
  }
}

/**
 * Create a performance timer with automatic cleanup
 */
export function withTimer<T>(
  name: string,
  fn: () => T
): T {
  const timer = new PerformanceTimer(name);
  try {
    return fn();
  } finally {
    timer.end();
  }
}

/**
 * Async performance timer
 */
export async function withAsyncTimer<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const timer = new PerformanceTimer(name);
  try {
    return await fn();
  } finally {
    timer.end();
  }
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    const cached = cache.get(key);
    if (cached !== undefined) {
      performanceMetrics.addMetric('memoize-hit', 1);
      return cached;
    }
    
    performanceMetrics.addMetric('memoize-miss', 1);
    const result = func(...args) as ReturnType<T>;
    cache.set(key, result);
    
    return result;
  }) as T;
}

/**
 * Create a cache with TTL (Time To Live)
 */
export class TTLCache<K, V> {
  private cache = new Map<K, { value: V; expires: number }>();
  private defaultTTL: number;
  
  constructor(defaultTTL: number = 60000) { // 1 minute default
    this.defaultTTL = defaultTTL;
  }
  
  set(key: K, value: V, ttl?: number): void {
    const expires = Date.now() + (ttl ?? this.defaultTTL);
    this.cache.set(key, { value, expires });
  }
  
  get(key: K): V | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      performanceMetrics.addMetric('ttl-cache-miss', 1);
      return undefined;
    }
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      performanceMetrics.addMetric('ttl-cache-expired', 1);
      return undefined;
    }
    
    performanceMetrics.addMetric('ttl-cache-hit', 1);
    return item.value;
  }
  
  has(key: K): boolean {
    const item = this.cache.get(key);
    
    if (!item) return false;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  delete(key: K): boolean {
    return this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
  
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of Array.from(this.cache.entries())) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Batch operations for better performance
 */
export class BatchProcessor<T> {
  private batch: T[] = [];
  private batchSize: number;
  private processFn: (items: T[]) => void | Promise<void>;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private timeoutMs: number;
  
  constructor(
    processFn: (items: T[]) => void | Promise<void>,
    batchSize: number = 10,
    timeoutMs: number = 100
  ) {
    this.processFn = processFn;
    this.batchSize = batchSize;
    this.timeoutMs = timeoutMs;
  }
  
  add(item: T): void {
    this.batch.push(item);
    
    if (this.batch.length >= this.batchSize) {
      this.flush();
    } else if (!this.timeout) {
      this.timeout = setTimeout(() => this.flush(), this.timeoutMs);
    }
  }
  
  async flush(): Promise<void> {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    
    if (this.batch.length === 0) return;
    
    const items = [...this.batch];
    this.batch = [];
    
    const startTime = performance.now();
    try {
      await this.processFn(items);
      const endTime = performance.now();
      performanceMetrics.addMetric('batch-process', endTime - startTime);
    } catch (error) {
      performanceMetrics.addMetric('batch-process-error', 1);
      throw error;
    }
  }
}

/**
 * Create a virtual list for large datasets
 */
export type VirtualListOptions = {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export class VirtualList<T> {
  private items: T[];
  private options: VirtualListOptions;
  private scrollTop: number = 0;
  
  constructor(items: T[], options: VirtualListOptions) {
    this.items = items;
    this.options = Object.assign({
      overscan: 5,
    }, options);
  }
  
  getVisibleRange(): { start: number; end: number } {
    const { itemHeight, containerHeight, overscan = 5 } = this.options;
    
    const start = Math.floor(this.scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      this.items.length
    );
    
    return { start, end };
  }
  
  getVisibleItems(): T[] {
    const { start, end } = this.getVisibleRange();
    return this.items.slice(start, end);
  }
  
  getTotalHeight(): number {
    return this.items.length * this.options.itemHeight;
  }
  
  getOffsetY(): number {
    const { start } = this.getVisibleRange();
    return start * this.options.itemHeight;
  }
  
  updateScrollTop(scrollTop: number): void {
    this.scrollTop = scrollTop;
  }
  
  updateItems(items: T[]): void {
    this.items = items;
  }
}

/**
 * Create a performance observer for specific metrics
 */
export class PerformanceObserver {
  private observers: Map<string, (value: number) => void> = new Map();
  
  observe(name: string, callback: (value: number) => void): () => void {
    this.observers.set(name, callback);
    
    return () => {
      this.observers.delete(name);
    };
  }
  
  notify(name: string, value: number): void {
    const callback = this.observers.get(name);
    if (callback) {
      callback(value);
    }
  }
}

/**
 * Create a performance budget checker
 */
export type PerformanceBudget = {
  name: string;
  threshold: number;
  type: 'max' | 'min';
}

export class PerformanceBudgetChecker {
  private budgets: PerformanceBudget[] = [];
  
  addBudget(budget: PerformanceBudget): void {
    this.budgets.push(budget);
  }
  
  checkMetric(name: string, value: number): boolean {
    const budget = this.budgets.find(b => b.name === name);
    if (!budget) return true;
    
    const passes = budget.type === 'max' ? value <= budget.threshold : value >= budget.threshold;
    
    if (!passes) {
      performanceMetrics.addMetric(`budget-violation-${name}`, 1);
    }
    
    return passes;
  }
  
  getViolations(): PerformanceBudget[] {
    return this.budgets.filter(budget => {
      const metrics = performanceMetrics.getMetricsByName(budget.name);
      if (metrics.length === 0) return false;
      
      const latestValue = metrics[metrics.length - 1]?.value;
      if (latestValue === undefined) return false;
      return !this.checkMetric(budget.name, latestValue);
    });
  }
}

/**
 * Create a performance profiler
 */
export class PerformanceProfiler {
  private profiles: Map<string, number[]> = new Map();
  
  start(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      let durations = this.profiles.get(name);
      if (!durations) {
        durations = [];
        this.profiles.set(name, durations);
      }
      
      durations.push(duration);
      performanceMetrics.addMetric(`profile-${name}`, duration);
    };
  }
  
  getProfile(name: string): {
    count: number;
    total: number;
    average: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  } | null {
    const durations = this.profiles.get(name);
    if (!durations || durations.length === 0) return null;
    
    const sorted = [...durations].sort((a, b) => a - b);
    const count = durations.length;
    const total = durations.reduce((sum, duration) => sum + duration, 0);
    const average = total / count;
    const min = sorted[0] ?? 0;
    const max = sorted[sorted.length - 1] ?? 0;
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);
    
    return {
      count,
      total,
      average,
      min,
      max,
      p95: sorted[p95Index] || 0,
      p99: sorted[p99Index] || 0,
    };
  }
  
  getAllProfiles(): Record<string, ReturnType<PerformanceProfiler['getProfile']>> {
    const result: Record<string, ReturnType<PerformanceProfiler['getProfile']>> = {};
    
    for (const name of Array.from(this.profiles.keys())) {
      result[name] = this.getProfile(name);
    }
    
    return result;
  }
  
  clear(): void {
    this.profiles.clear();
  }
}

// Create singleton instances
export const performanceTimer = new PerformanceTimer('global');
export const performanceObserver = new PerformanceObserver();
export const performanceBudgetChecker = new PerformanceBudgetChecker();
export const performanceProfiler = new PerformanceProfiler();
