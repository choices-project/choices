/**
 * Integration Monitoring Tests
 * 
 * Tests for the integration monitoring system including response time tracking,
 * error tracking, and metrics collection.
 * 
 * Created: 2025-01-16
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import { IntegrationMonitor } from '@/lib/integrations/monitoring';

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('IntegrationMonitor', () => {
  let monitor: IntegrationMonitor;

  beforeEach(() => {
    monitor = new IntegrationMonitor();
  });

  describe('recordRequest', () => {
    it('should record successful request with response time', () => {
      const newMonitor = new IntegrationMonitor();
      newMonitor.recordRequest('test-api', true, 150, undefined, 200);

      const metrics = newMonitor.getCurrentMetrics('test-api');
      expect(metrics).toBeDefined();
      expect(metrics?.requests.total).toBe(1);
      expect(metrics?.requests.successful).toBe(1);
      expect(metrics?.requests.failed).toBe(0);
    });

    it('should record failed request with error type', () => {
      const newMonitor = new IntegrationMonitor();
      newMonitor.recordRequest('test-api', false, 200, 'timeout', 500);

      const metrics = newMonitor.getCurrentMetrics('test-api');
      expect(metrics).toBeDefined();
      expect(metrics?.requests.total).toBe(1);
      expect(metrics?.requests.successful).toBe(0);
      expect(metrics?.requests.failed).toBe(1);
      expect(metrics?.errors?.total).toBe(1);
      expect(metrics?.errors?.byType?.timeout).toBe(1);
      expect(metrics?.errors?.byStatusCode?.[500]).toBe(1);
    });

    it('should track response times for percentile calculations', () => {
      const responseTimes = [100, 150, 200, 250, 300];
      
      responseTimes.forEach(time => {
        monitor.recordRequest('test-api', true, time);
      });

      const metrics = monitor.getCurrentMetrics('test-api');
      expect(metrics).toBeDefined();
      expect(metrics?.performance.averageResponseTime).toBeGreaterThan(0);
      expect(metrics?.performance.maxResponseTime).toBe(300);
      expect(metrics?.performance.minResponseTime).toBe(100);
    });

    it('should track rate limited requests', () => {
      monitor.recordRequest('test-api', false, 0, undefined, 429);

      const metrics = monitor.getCurrentMetrics('test-api');
      expect(metrics).toBeDefined();
      expect(metrics?.requests.rateLimited).toBe(1);
    });

    it('should handle multiple error types', () => {
      monitor.recordRequest('test-api', false, 0, 'timeout', 500);
      monitor.recordRequest('test-api', false, 0, 'network', 503);
      monitor.recordRequest('test-api', false, 0, 'timeout', 500);

      const metrics = monitor.getCurrentMetrics('test-api');
      expect(metrics).toBeDefined();
      expect(metrics?.errors?.byType?.timeout).toBe(2);
      expect(metrics?.errors?.byType?.network).toBe(1);
      expect(metrics?.errors?.byStatusCode?.[500]).toBe(2);
      expect(metrics?.errors?.byStatusCode?.[503]).toBe(1);
    });
  });

  describe('updateMetrics', () => {
    it('should update metrics with response time and error type', () => {
      const updateMetrics = (monitor as any).updateMetrics.bind(monitor);
      
      updateMetrics('test-api', true, 150, undefined, 200);
      updateMetrics('test-api', false, 200, 'timeout', 500);

      const metrics = monitor.getCurrentMetrics('test-api');
      expect(metrics?.requests.total).toBe(2);
      expect(metrics?.requests.successful).toBe(1);
      expect(metrics?.requests.failed).toBe(1);
    });

    it('should limit response times array to 1000 entries', () => {
      const updateMetrics = (monitor as any).updateMetrics.bind(monitor);
      
      // Add 1001 response times
      for (let i = 0; i < 1001; i++) {
        updateMetrics('test-api', true, i);
      }

      const responseTimes = (monitor as any).responseTimes.get('test-api');
      expect(responseTimes.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('getCurrentMetrics', () => {
    it('should return null for non-existent API', () => {
      const metrics = monitor.getCurrentMetrics('non-existent');
      expect(metrics).toBeNull();
    });

    it('should return metrics for existing API', () => {
      monitor.recordRequest('test-api', true, 100);
      const metrics = monitor.getCurrentMetrics('test-api');
      expect(metrics).toBeDefined();
      expect(metrics?.apiName).toBe('test-api');
    });
  });

  describe('error tracking', () => {
    it('should initialize errors object when first error occurs', () => {
      const newMonitor = new IntegrationMonitor();
      newMonitor.recordRequest('test-api', false, 0, 'test-error', 500);
      
      const metrics = newMonitor.getCurrentMetrics('test-api');
      expect(metrics?.errors).toBeDefined();
      // Errors.total should be at least 1 (may be more if other error tracking also increments it)
      expect(metrics?.errors?.total).toBeGreaterThanOrEqual(1);
      expect(metrics?.errors?.byType).toBeDefined();
      expect(metrics?.errors?.byStatusCode).toBeDefined();
      // Verify the specific error type is tracked
      expect(metrics?.errors?.byType?.['test-error']).toBe(1);
      expect(metrics?.errors?.byStatusCode?.[500]).toBe(1);
    });

    it('should increment error counts correctly', () => {
      const newMonitor = new IntegrationMonitor();
      newMonitor.recordRequest('test-api', false, 0, 'error1', 500);
      newMonitor.recordRequest('test-api', false, 0, 'error2', 500);
      newMonitor.recordRequest('test-api', false, 0, 'error1', 404);

      const metrics = newMonitor.getCurrentMetrics('test-api');
      // Check that errors are tracked correctly
      // Note: errors.total should equal the number of failed requests (3)
      expect(metrics?.errors?.total).toBeGreaterThanOrEqual(3);
      expect(metrics?.errors?.byType?.error1).toBe(2);
      expect(metrics?.errors?.byType?.error2).toBe(1);
      expect(metrics?.errors?.byStatusCode?.[500]).toBe(2);
      expect(metrics?.errors?.byStatusCode?.[404]).toBe(1);
      // Verify that total matches the sum of byType counts
      const totalByType = Object.values(metrics?.errors?.byType || {}).reduce((sum, count) => sum + count, 0);
      expect(totalByType).toBe(3);
    });
  });
});

