/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SuperiorMobileFeed from '@/features/feeds/components/SuperiorMobileFeed';
import { testMonitor, calculatePerformanceGrade, PERFORMANCE_BUDGETS } from './test-monitoring';
import { PerformanceDashboard, PerformanceMetricsTable } from './performance-dashboard';
import { logger } from '@/lib/utils/logger';

// Setup minimal mocks for test environment
beforeAll(() => {
  // Mock localStorage for component functionality
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });
  
  // Mock navigator for online status
  Object.defineProperty(navigator, 'onLine', {
    value: true,
    writable: true,
  });

  // Mock fetch to handle API calls
  global.fetch = jest.fn((url: string) => {
    if (url.includes('/api/feeds')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          {
            id: '1',
            title: 'Sample Civic Activity',
            description: 'A sample civic activity for testing',
            category: 'civic',
            timestamp: new Date().toISOString(),
            source: 'test'
          }
        ])
      } as Response);
    }
    if (url.includes('/api/civics/analytics')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          analytics: {
            totalViews: 100,
            engagement: 0.75,
            userSatisfaction: 0.85
          }
        })
      } as Response);
    }
    if (url.includes('/api/pwa/offline/sync')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({})
    } as Response);
  });
});

describe('Performance Monitoring Tests', () => {
  beforeEach(() => {
    // Clear test monitor before each test
    testMonitor.clear();
  });

  describe('Performance Metrics Collection', () => {
    it('should collect comprehensive performance metrics', async () => {
      const startTime = performance.now();
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      await act(async () => {
        render(
          <BrowserRouter>
            <SuperiorMobileFeed />
          </BrowserRouter>
        );
      });
      
      const endTime = performance.now();
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      
      const renderTime = endTime - startTime;
      const memoryUsage = (finalMemory - initialMemory) / (1024 * 1024);
      const performanceGrade = calculatePerformanceGrade(renderTime, memoryUsage);
      
      // Record metrics
      testMonitor.recordMetrics({
        testName: 'should collect comprehensive performance metrics',
        testSuite: 'Performance Monitoring Tests',
        duration: renderTime,
        memoryUsage,
        renderTime,
        networkTime: 0,
        apiTime: 0,
        accessibilityTime: 0,
        performanceGrade,
        status: 'PASS',
      });
      
      logger.info(`📊 Performance Metrics Collected:`);
      logger.info(`- Render Time: ${renderTime.toFixed(2)}ms`);
      logger.info(`- Memory Usage: ${memoryUsage.toFixed(2)}MB`);
      logger.info(`- Performance Grade: ${performanceGrade}`);
      
      expect(renderTime).toBeLessThan(PERFORMANCE_BUDGETS.RENDER_TIME);
      expect(memoryUsage).toBeLessThan(PERFORMANCE_BUDGETS.MEMORY_USAGE);
      expect(performanceGrade).toMatch(/^[A-F][+]?$/);
    });

    it('should track performance across multiple test runs', async () => {
      const testRuns = 3;
      
      for (let i = 0; i < testRuns; i++) {
        const startTime = performance.now();
        const initialMemory = performance.memory?.usedJSHeapSize || 0;
        
        await act(async () => {
          render(
            <BrowserRouter>
              <SuperiorMobileFeed />
            </BrowserRouter>
          );
        });
        
        const endTime = performance.now();
        const finalMemory = performance.memory?.usedJSHeapSize || 0;
        
        const renderTime = endTime - startTime;
        const memoryUsage = (finalMemory - initialMemory) / (1024 * 1024);
        const performanceGrade = calculatePerformanceGrade(renderTime, memoryUsage);
        
        testMonitor.recordMetrics({
          testName: `Performance Test Run ${i + 1}`,
          testSuite: 'Performance Monitoring Tests',
          duration: renderTime,
          memoryUsage,
          renderTime,
          networkTime: 0,
          apiTime: 0,
          accessibilityTime: 0,
          performanceGrade,
          status: 'PASS',
        });
      }
      
      const report = testMonitor.generateReport();
      
      logger.info(`📊 Multi-Run Performance Report:`);
      logger.info(`- Total Tests: ${report.totalTests}`);
      logger.info(`- Average Render Time: ${report.averageRenderTime.toFixed(2)}ms`);
      logger.info(`- Average Memory Usage: ${report.averageMemoryUsage.toFixed(2)}MB`);
      logger.info(`- Overall Grade: ${report.performanceGrade}`);
      
      expect(report.totalTests).toBe(testRuns);
      expect(report.passedTests).toBe(testRuns);
      expect(report.performanceGrade).toMatch(/^[A-F][+]?$/);
    });

    it('should generate performance alerts for poor performance', async () => {
      // Simulate poor performance
      const startTime = performance.now();
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      await act(async () => {
        render(
          <BrowserRouter>
            <SuperiorMobileFeed />
          </BrowserRouter>
        );
      });
      
      const endTime = performance.now();
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      
      const renderTime = endTime - startTime;
      const memoryUsage = (finalMemory - initialMemory) / (1024 * 1024);
      
      // Record metrics with artificially poor performance for testing
      testMonitor.recordMetrics({
        testName: 'Poor Performance Test',
        testSuite: 'Performance Monitoring Tests',
        duration: renderTime,
        memoryUsage: memoryUsage > 5 ? memoryUsage : 15, // Force high memory usage
        renderTime: renderTime > 200 ? renderTime : 300, // Force slow render
        networkTime: 600, // Force slow network
        apiTime: 0,
        accessibilityTime: 0,
        performanceGrade: 'D',
        status: 'PASS',
      });
      
      const alerts = testMonitor.getAlerts();
      
      logger.info(`🚨 Performance Alerts Generated: ${alerts.length}`);
      alerts.forEach(alert => logger.info(`- ${alert}`));
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(alert => alert.includes('SLOW RENDER'))).toBe(true);
      expect(alerts.some(alert => alert.includes('HIGH MEMORY'))).toBe(true);
      expect(alerts.some(alert => alert.includes('SLOW NETWORK'))).toBe(true);
    });
  });

  describe('Performance Reporting', () => {
    it('should generate comprehensive performance report', async () => {
      // Record multiple test metrics
      const testMetrics = [
        {
          testName: 'Fast Test',
          testSuite: 'Performance Monitoring Tests',
          duration: 50,
          memoryUsage: 1,
          renderTime: 50,
          networkTime: 100,
          apiTime: 50,
          accessibilityTime: 25,
          performanceGrade: 'A+' as const,
          status: 'PASS' as const,
        },
        {
          testName: 'Medium Test',
          testSuite: 'Performance Monitoring Tests',
          duration: 150,
          memoryUsage: 3,
          renderTime: 150,
          networkTime: 200,
          apiTime: 100,
          accessibilityTime: 50,
          performanceGrade: 'B' as const,
          status: 'PASS' as const,
        },
        {
          testName: 'Slow Test',
          testSuite: 'Performance Monitoring Tests',
          duration: 300,
          memoryUsage: 8,
          renderTime: 300,
          networkTime: 400,
          apiTime: 200,
          accessibilityTime: 100,
          performanceGrade: 'D' as const,
          status: 'FAIL' as const,
          errorMessage: 'Performance budget exceeded',
        },
      ];

      testMetrics.forEach(metrics => {
        testMonitor.recordMetrics(metrics);
      });

      const report = testMonitor.generateReport();
      
      logger.info(`📊 Comprehensive Performance Report:`);
      logger.info(`- Total Tests: ${report.totalTests}`);
      logger.info(`- Passed: ${report.passedTests}`);
      logger.info(`- Failed: ${report.failedTests}`);
      logger.info(`- Average Render Time: ${report.averageRenderTime.toFixed(2)}ms`);
      logger.info(`- Average Memory Usage: ${report.averageMemoryUsage.toFixed(2)}MB`);
      logger.info(`- Performance Grade: ${report.performanceGrade}`);
      logger.info(`- Recommendations: ${report.recommendations.length}`);
      
      expect(report.totalTests).toBe(3);
      expect(report.passedTests).toBe(2);
      expect(report.failedTests).toBe(1);
      expect(report.averageRenderTime).toBeCloseTo(166.67, 1);
      expect(report.averageMemoryUsage).toBeCloseTo(4, 1);
      expect(report.performanceGrade).toMatch(/^[A-F][+]?$/);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should export metrics to JSON format', async () => {
      // Record some test metrics
      testMonitor.recordMetrics({
        testName: 'Export Test',
        testSuite: 'Performance Monitoring Tests',
        duration: 100,
        memoryUsage: 2,
        renderTime: 100,
        networkTime: 150,
        apiTime: 75,
        accessibilityTime: 25,
        performanceGrade: 'A',
        status: 'PASS',
      });

      const exportedData = testMonitor.exportMetrics();
      const parsedData = JSON.parse(exportedData);
      
      logger.info(`📤 Exported Metrics:`);
      logger.info(`- Metrics Count: ${parsedData.metrics.length}`);
      logger.info(`- Alerts Count: ${parsedData.alerts.length}`);
      logger.info(`- Report Generated: ${!!parsedData.report}`);
      
      expect(parsedData.metrics).toHaveLength(1);
      expect(parsedData.metrics[0].testName).toBe('Export Test');
      expect(parsedData.report).toBeDefined();
      expect(parsedData.report.totalTests).toBe(1);
    });
  });

  describe('Performance Dashboard Integration', () => {
    it('should render performance dashboard with metrics', async () => {
      // Record some test metrics
      testMonitor.recordMetrics({
        testName: 'Dashboard Test',
        testSuite: 'Performance Monitoring Tests',
        duration: 120,
        memoryUsage: 2.5,
        renderTime: 120,
        networkTime: 180,
        apiTime: 90,
        accessibilityTime: 30,
        performanceGrade: 'A',
        status: 'PASS',
      });

      const { container } = render(<PerformanceDashboard monitor={testMonitor} />);
      
      // Check if dashboard renders without errors
      expect(container).toBeInTheDocument();
      
      // Check for key dashboard elements
      expect(screen.getByText('🚀 Performance Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Tests')).toBeInTheDocument();
      expect(screen.getByText('Passed')).toBeInTheDocument();
      expect(screen.getByText('Performance Grade')).toBeInTheDocument();
      
      logger.info(`📊 Performance Dashboard rendered successfully`);
    });

    it('should display performance metrics table', async () => {
      // Record multiple test metrics
      const metrics = [
        {
          testName: 'Test 1',
          testSuite: 'Performance Monitoring Tests',
          duration: 80,
          memoryUsage: 1.5,
          renderTime: 80,
          networkTime: 120,
          apiTime: 60,
          accessibilityTime: 20,
          performanceGrade: 'A+' as const,
          status: 'PASS' as const,
          timestamp: new Date(),
        },
        {
          testName: 'Test 2',
          testSuite: 'Performance Monitoring Tests',
          duration: 200,
          memoryUsage: 4,
          renderTime: 200,
          networkTime: 300,
          apiTime: 150,
          accessibilityTime: 50,
          performanceGrade: 'C' as const,
          status: 'PASS' as const,
          timestamp: new Date(),
        },
      ];

      const { container } = render(<PerformanceMetricsTable metrics={metrics} />);
      
      // Check if table renders without errors
      expect(container).toBeInTheDocument();
      
      // Check for table headers
      expect(screen.getByText('Test Name')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Render Time')).toBeInTheDocument();
      expect(screen.getByText('Memory')).toBeInTheDocument();
      expect(screen.getByText('Grade')).toBeInTheDocument();
      
      logger.info(`📊 Performance Metrics Table rendered successfully`);
    });
  });
});

describe('Performance Monitoring Tests', () => {
  beforeEach(() => {
    // Clear test monitor before each test
    testMonitor.clear();
  });

  describe('Performance Metrics Collection', () => {
    it('should collect comprehensive performance metrics', async () => {
      const startTime = performance.now();
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      await act(async () => {
        render(
          <BrowserRouter>
            <SuperiorMobileFeed />
          </BrowserRouter>
        );
      });
      
      const endTime = performance.now();
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      
      const renderTime = endTime - startTime;
      const memoryUsage = (finalMemory - initialMemory) / (1024 * 1024);
      const performanceGrade = calculatePerformanceGrade(renderTime, memoryUsage);
      
      // Record metrics
      testMonitor.recordMetrics({
        testName: 'should collect comprehensive performance metrics',
        testSuite: 'Performance Monitoring Tests',
        duration: renderTime,
        memoryUsage,
        renderTime,
        networkTime: 0,
        apiTime: 0,
        accessibilityTime: 0,
        performanceGrade,
        status: 'PASS',
      });
      
      logger.info(`📊 Performance Metrics Collected:`);
      logger.info(`- Render Time: ${renderTime.toFixed(2)}ms`);
      logger.info(`- Memory Usage: ${memoryUsage.toFixed(2)}MB`);
      logger.info(`- Performance Grade: ${performanceGrade}`);
      
      expect(renderTime).toBeLessThan(PERFORMANCE_BUDGETS.RENDER_TIME);
      expect(memoryUsage).toBeLessThan(PERFORMANCE_BUDGETS.MEMORY_USAGE);
      expect(performanceGrade).toMatch(/^[A-F][+]?$/);
    });

    it('should track performance across multiple test runs', async () => {
      const testRuns = 3;
      
      for (let i = 0; i < testRuns; i++) {
        const startTime = performance.now();
        const initialMemory = performance.memory?.usedJSHeapSize || 0;
        
        await act(async () => {
          render(
            <BrowserRouter>
              <SuperiorMobileFeed />
            </BrowserRouter>
          );
        });
        
        const endTime = performance.now();
        const finalMemory = performance.memory?.usedJSHeapSize || 0;
        
        const renderTime = endTime - startTime;
        const memoryUsage = (finalMemory - initialMemory) / (1024 * 1024);
        const performanceGrade = calculatePerformanceGrade(renderTime, memoryUsage);
        
        testMonitor.recordMetrics({
          testName: `Performance Test Run ${i + 1}`,
          testSuite: 'Performance Monitoring Tests',
          duration: renderTime,
          memoryUsage,
          renderTime,
          networkTime: 0,
          apiTime: 0,
          accessibilityTime: 0,
          performanceGrade,
          status: 'PASS',
        });
      }
      
      const report = testMonitor.generateReport();
      
      logger.info(`📊 Multi-Run Performance Report:`);
      logger.info(`- Total Tests: ${report.totalTests}`);
      logger.info(`- Average Render Time: ${report.averageRenderTime.toFixed(2)}ms`);
      logger.info(`- Average Memory Usage: ${report.averageMemoryUsage.toFixed(2)}MB`);
      logger.info(`- Overall Grade: ${report.performanceGrade}`);
      
      expect(report.totalTests).toBe(testRuns);
      expect(report.passedTests).toBe(testRuns);
      expect(report.performanceGrade).toMatch(/^[A-F][+]?$/);
    });

    it('should generate performance alerts for poor performance', async () => {
      // Simulate poor performance
      const startTime = performance.now();
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      await act(async () => {
        render(
          <BrowserRouter>
            <SuperiorMobileFeed />
          </BrowserRouter>
        );
      });
      
      const endTime = performance.now();
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      
      const renderTime = endTime - startTime;
      const memoryUsage = (finalMemory - initialMemory) / (1024 * 1024);
      
      // Record metrics with artificially poor performance for testing
      testMonitor.recordMetrics({
        testName: 'Poor Performance Test',
        testSuite: 'Performance Monitoring Tests',
        duration: renderTime,
        memoryUsage: memoryUsage > 5 ? memoryUsage : 15, // Force high memory usage
        renderTime: renderTime > 200 ? renderTime : 300, // Force slow render
        networkTime: 600, // Force slow network
        apiTime: 0,
        accessibilityTime: 0,
        performanceGrade: 'D',
        status: 'PASS',
      });
      
      const alerts = testMonitor.getAlerts();
      
      logger.info(`🚨 Performance Alerts Generated: ${alerts.length}`);
      alerts.forEach(alert => logger.info(`- ${alert}`));
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(alert => alert.includes('SLOW RENDER'))).toBe(true);
      expect(alerts.some(alert => alert.includes('HIGH MEMORY'))).toBe(true);
      expect(alerts.some(alert => alert.includes('SLOW NETWORK'))).toBe(true);
    });
  });

  describe('Performance Reporting', () => {
    it('should generate comprehensive performance report', async () => {
      // Record multiple test metrics
      const testMetrics = [
        {
          testName: 'Fast Test',
          testSuite: 'Performance Monitoring Tests',
          duration: 50,
          memoryUsage: 1,
          renderTime: 50,
          networkTime: 100,
          apiTime: 50,
          accessibilityTime: 25,
          performanceGrade: 'A+' as const,
          status: 'PASS' as const,
        },
        {
          testName: 'Medium Test',
          testSuite: 'Performance Monitoring Tests',
          duration: 150,
          memoryUsage: 3,
          renderTime: 150,
          networkTime: 200,
          apiTime: 100,
          accessibilityTime: 50,
          performanceGrade: 'B' as const,
          status: 'PASS' as const,
        },
        {
          testName: 'Slow Test',
          testSuite: 'Performance Monitoring Tests',
          duration: 300,
          memoryUsage: 8,
          renderTime: 300,
          networkTime: 400,
          apiTime: 200,
          accessibilityTime: 100,
          performanceGrade: 'D' as const,
          status: 'FAIL' as const,
          errorMessage: 'Performance budget exceeded',
        },
      ];

      testMetrics.forEach(metrics => {
        testMonitor.recordMetrics(metrics);
      });

      const report = testMonitor.generateReport();
      
      logger.info(`📊 Comprehensive Performance Report:`);
      logger.info(`- Total Tests: ${report.totalTests}`);
      logger.info(`- Passed: ${report.passedTests}`);
      logger.info(`- Failed: ${report.failedTests}`);
      logger.info(`- Average Render Time: ${report.averageRenderTime.toFixed(2)}ms`);
      logger.info(`- Average Memory Usage: ${report.averageMemoryUsage.toFixed(2)}MB`);
      logger.info(`- Performance Grade: ${report.performanceGrade}`);
      logger.info(`- Recommendations: ${report.recommendations.length}`);
      
      expect(report.totalTests).toBe(3);
      expect(report.passedTests).toBe(2);
      expect(report.failedTests).toBe(1);
      expect(report.averageRenderTime).toBeCloseTo(166.67, 1);
      expect(report.averageMemoryUsage).toBeCloseTo(4, 1);
      expect(report.performanceGrade).toMatch(/^[A-F][+]?$/);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should export metrics to JSON format', async () => {
      // Record some test metrics
      testMonitor.recordMetrics({
        testName: 'Export Test',
        testSuite: 'Performance Monitoring Tests',
        duration: 100,
        memoryUsage: 2,
        renderTime: 100,
        networkTime: 150,
        apiTime: 75,
        accessibilityTime: 25,
        performanceGrade: 'A',
        status: 'PASS',
      });

      const exportedData = testMonitor.exportMetrics();
      const parsedData = JSON.parse(exportedData);
      
      logger.info(`📤 Exported Metrics:`);
      logger.info(`- Metrics Count: ${parsedData.metrics.length}`);
      logger.info(`- Alerts Count: ${parsedData.alerts.length}`);
      logger.info(`- Report Generated: ${!!parsedData.report}`);
      
      expect(parsedData.metrics).toHaveLength(1);
      expect(parsedData.metrics[0].testName).toBe('Export Test');
      expect(parsedData.report).toBeDefined();
      expect(parsedData.report.totalTests).toBe(1);
    });
  });

  describe('Performance Dashboard Integration', () => {
    it('should render performance dashboard with metrics', async () => {
      // Record some test metrics
      testMonitor.recordMetrics({
        testName: 'Dashboard Test',
        testSuite: 'Performance Monitoring Tests',
        duration: 120,
        memoryUsage: 2.5,
        renderTime: 120,
        networkTime: 180,
        apiTime: 90,
        accessibilityTime: 30,
        performanceGrade: 'A',
        status: 'PASS',
      });

      const { container } = render(<PerformanceDashboard monitor={testMonitor} />);
      
      // Check if dashboard renders without errors
      expect(container).toBeInTheDocument();
      
      // Check for key dashboard elements
      expect(screen.getByText('🚀 Performance Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Tests')).toBeInTheDocument();
      expect(screen.getByText('Passed')).toBeInTheDocument();
      expect(screen.getByText('Performance Grade')).toBeInTheDocument();
      
      logger.info(`📊 Performance Dashboard rendered successfully`);
    });

    it('should display performance metrics table', async () => {
      // Record multiple test metrics
      const metrics = [
        {
          testName: 'Test 1',
          testSuite: 'Performance Monitoring Tests',
          duration: 80,
          memoryUsage: 1.5,
          renderTime: 80,
          networkTime: 120,
          apiTime: 60,
          accessibilityTime: 20,
          performanceGrade: 'A+' as const,
          status: 'PASS' as const,
          timestamp: new Date(),
        },
        {
          testName: 'Test 2',
          testSuite: 'Performance Monitoring Tests',
          duration: 200,
          memoryUsage: 4,
          renderTime: 200,
          networkTime: 300,
          apiTime: 150,
          accessibilityTime: 50,
          performanceGrade: 'C' as const,
          status: 'PASS' as const,
          timestamp: new Date(),
        },
      ];

      const { container } = render(<PerformanceMetricsTable metrics={metrics} />);
      
      // Check if table renders without errors
      expect(container).toBeInTheDocument();
      
      // Check for table headers
      expect(screen.getByText('Test Name')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Render Time')).toBeInTheDocument();
      expect(screen.getByText('Memory')).toBeInTheDocument();
      expect(screen.getByText('Grade')).toBeInTheDocument();
      
      logger.info(`📊 Performance Metrics Table rendered successfully`);
    });
  });
});






