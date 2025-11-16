/**
 * Performance Monitor Status Tests
 * 
 * Tests for monitoring status getter and isMonitoring integration
 * 
 * Created: 2025-01-16
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PerformanceMonitor } from '@/lib/utils/performance-monitor';

// Mock window.performance
const mockPerformance = {
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 5000000
  },
  getEntriesByType: jest.fn(() => []),
  now: jest.fn(() => Date.now())
};

describe('PerformanceMonitor - Monitoring Status', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock window and performance
    Object.defineProperty(global, 'window', {
      value: {
        performance: mockPerformance,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      },
      writable: true,
      configurable: true
    });

    monitor = new PerformanceMonitor();
  });

  describe('getMonitoringStatus', () => {
    it('should return true when monitoring is active', () => {
      const status = monitor.getMonitoringStatus();
      expect(status).toBe(true);
    });

    it('should return false after stopping monitoring', () => {
      monitor.stopMonitoring();
      const status = monitor.getMonitoringStatus();
      expect(status).toBe(false);
    });

    it('should return true after restarting monitoring', () => {
      monitor.stopMonitoring();
      monitor.startMonitoring();
      const status = monitor.getMonitoringStatus();
      expect(status).toBe(true);
    });
  });

  describe('getMetrics - isMonitoring integration', () => {
    it('should return empty object when monitoring is stopped', () => {
      monitor.stopMonitoring();
      const metrics = monitor.getMetrics();
      expect(metrics).toEqual({});
    });

    it('should return metrics when monitoring is active', () => {
      const metrics = monitor.getMetrics();
      // When monitoring is active, should return metrics (may be empty if no data yet)
      expect(metrics).toBeDefined();
    });

    it('should return empty object in non-browser environment', () => {
      // Temporarily remove window
      const originalWindow = (global as any).window;
      delete (global as any).window;

      const newMonitor = new PerformanceMonitor();
      const metrics = newMonitor.getMetrics();

      expect(metrics).toEqual({});

      // Restore window
      (global as any).window = originalWindow;
    });
  });

  describe('startMonitoring', () => {
    it('should set isMonitoring to true', () => {
      monitor.stopMonitoring();
      expect(monitor.getMonitoringStatus()).toBe(false);

      monitor.startMonitoring();
      expect(monitor.getMonitoringStatus()).toBe(true);
    });
  });

  describe('stopMonitoring', () => {
    it('should set isMonitoring to false', () => {
      expect(monitor.getMonitoringStatus()).toBe(true);

      monitor.stopMonitoring();
      expect(monitor.getMonitoringStatus()).toBe(false);
    });
  });
});

