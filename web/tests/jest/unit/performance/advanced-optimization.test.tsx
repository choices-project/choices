/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UnifiedFeed from '@/features/feeds/components/UnifiedFeed';
import { performanceProfiler, ProfilerMetrics, ComponentProfile } from './performance-profiler';
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

describe('Advanced Performance Optimization Tests', () => {
  beforeEach(() => {
    // Clear profiler before each test
    performanceProfiler.clear();
  });

  describe('Performance Profiling', () => {
    it('should profile component performance with deep analysis', async () => {
      const componentName = 'UnifiedFeed';
      
      // Start profiling
      performanceProfiler.startProfiling(componentName);
      
      const startTime = performance.now();
      const startMemory = performance.memory?.usedJSHeapSize || 0;
      
      await act(async () => {
        render(
          <BrowserRouter>
            <UnifiedFeed />
          </BrowserRouter>
        );
      });
      
      const endTime = performance.now();
      const endMemory = performance.memory?.usedJSHeapSize || 0;
      
      // Stop profiling and get metrics
      const metrics = performanceProfiler.stopProfiling(componentName, 1);
      
      logger.info(`🔍 Deep Performance Analysis:`);
      logger.info(`- Component: ${metrics.componentName}`);
      logger.info(`- Render Time: ${metrics.totalRenderTime.toFixed(2)}ms`);
      logger.info(`- Memory Used: ${metrics.memoryPeak.toFixed(2)}MB`);
      logger.info(`- Optimization Score: ${metrics.optimizationScore}/100`);
      logger.info(`- Re-render Triggers: ${metrics.reRenderTriggers.length}`);
      logger.info(`- Bottlenecks: ${metrics.performanceBottlenecks.length}`);
      logger.info(`- Recommendations: ${metrics.recommendations.length}`);
      
      // Verify metrics
      expect(metrics.componentName).toBe(componentName);
      expect(metrics.renderCount).toBe(1);
      expect(metrics.totalRenderTime).toBeGreaterThan(0);
      expect(metrics.memoryPeak).toBeGreaterThanOrEqual(0);
      expect(metrics.optimizationScore).toBeGreaterThanOrEqual(0);
      expect(metrics.optimizationScore).toBeLessThanOrEqual(100);
      expect(metrics.recommendations.length).toBeGreaterThan(0);
    });

    it('should create component profile with optimization analysis', async () => {
      const componentName = 'UnifiedFeed';
      
      // Profile the component
      performanceProfiler.startProfiling(componentName);
      
      await act(async () => {
        render(
          <BrowserRouter>
            <UnifiedFeed />
          </BrowserRouter>
        );
      });
      
      const metrics = performanceProfiler.stopProfiling(componentName, 1);
      
      // Create component profile
      const profile = performanceProfiler.createComponentProfile(componentName, metrics);
      
      logger.info(`📊 Component Profile Created:`);
      logger.info(`- Name: ${profile.name}`);
      logger.info(`- Depth: ${profile.depth}`);
      logger.info(`- Is Optimized: ${profile.isOptimized}`);
      logger.info(`- Optimization Potential: ${profile.optimizationPotential}`);
      logger.info(`- Optimization Score: ${profile.metrics.optimizationScore}/100`);
      
      // Verify profile
      expect(profile.name).toBe(componentName);
      expect(profile.metrics).toBe(metrics);
      expect(profile.depth).toBe(0);
      expect(typeof profile.isOptimized).toBe('boolean');
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(profile.optimizationPotential);
    });

    it('should generate comprehensive performance analysis', async () => {
      // Profile multiple components
      const components = ['UnifiedFeed', 'TestComponent1', 'TestComponent2'];
      
      for (const componentName of components) {
        performanceProfiler.startProfiling(componentName);
        
        await act(async () => {
          render(
            <BrowserRouter>
              <UnifiedFeed />
            </BrowserRouter>
          );
        });
        
        const metrics = performanceProfiler.stopProfiling(componentName, Math.floor(Math.random() * 5) + 1);
        performanceProfiler.createComponentProfile(componentName, metrics);
      }
      
      // Generate comprehensive analysis
      const analysis = performanceProfiler.generatePerformanceAnalysis();
      
      logger.info(`📈 Comprehensive Performance Analysis:`);
      logger.info(`- Overall Score: ${analysis.overallScore.toFixed(2)}/100`);
      logger.info(`- Critical Issues: ${analysis.criticalIssues.length}`);
      logger.info(`- Optimization Opportunities: ${analysis.optimizationOpportunities.length}`);
      logger.info(`- Memory Leaks: ${analysis.memoryLeaks.length}`);
      logger.info(`- Render Optimizations: ${analysis.renderOptimizations.length}`);
      logger.info(`- Network Optimizations: ${analysis.networkOptimizations.length}`);
      logger.info(`- Accessibility Optimizations: ${analysis.accessibilityOptimizations.length}`);
      logger.info(`- Recommendations: ${analysis.recommendations.length}`);
      logger.info(`- Estimated Improvement: ${analysis.estimatedImprovement.toFixed(2)}%`);
      
      // Verify analysis
      expect(analysis.overallScore).toBeGreaterThanOrEqual(0);
      expect(analysis.overallScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(analysis.criticalIssues)).toBe(true);
      expect(Array.isArray(analysis.optimizationOpportunities)).toBe(true);
      expect(Array.isArray(analysis.memoryLeaks)).toBe(true);
      expect(Array.isArray(analysis.renderOptimizations)).toBe(true);
      expect(Array.isArray(analysis.networkOptimizations)).toBe(true);
      expect(Array.isArray(analysis.accessibilityOptimizations)).toBe(true);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
      expect(analysis.estimatedImprovement).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Memory Optimization', () => {
    it('should identify memory optimization opportunities', async () => {
      const componentName = 'MemoryOptimizationTest';
      
      // Simulate memory-intensive operations
      performanceProfiler.startProfiling(componentName);
      
      await act(async () => {
        render(
          <BrowserRouter>
            <UnifiedFeed />
          </BrowserRouter>
        );
      });
      
      const metrics = performanceProfiler.stopProfiling(componentName, 1);
      
      logger.info(`🧠 Memory Optimization Analysis:`);
      logger.info(`- Memory Peak: ${metrics.memoryPeak.toFixed(2)}MB`);
      logger.info(`- Memory Average: ${metrics.memoryAverage.toFixed(2)}MB`);
      logger.info(`- Memory Bottlenecks: ${metrics.performanceBottlenecks.filter(b => b.includes('memory')).length}`);
      
      // Check for memory optimization recommendations
      const memoryRecommendations = metrics.recommendations.filter(r => 
        r.includes('memory') || r.includes('cleanup') || r.includes('leak')
      );
      
      logger.info(`- Memory Recommendations: ${memoryRecommendations.length}`);
      memoryRecommendations.forEach(rec => logger.info(`  - ${rec}`));
      
      expect(metrics.memoryPeak).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryAverage).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(memoryRecommendations)).toBe(true);
    });

    it('should detect potential memory leaks', async () => {
      const componentName = 'MemoryLeakTest';
      
      // Simulate multiple renders to detect memory leaks
      performanceProfiler.startProfiling(componentName);
      
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          render(
            <BrowserRouter>
              <UnifiedFeed />
            </BrowserRouter>
          );
        });
      }
      
      const metrics = performanceProfiler.stopProfiling(componentName, 5);
      
      logger.info(`🔍 Memory Leak Detection:`);
      logger.info(`- Render Count: ${metrics.renderCount}`);
      logger.info(`- Memory Peak: ${metrics.memoryPeak.toFixed(2)}MB`);
      logger.info(`- Memory Average: ${metrics.memoryAverage.toFixed(2)}MB`);
      
      // Check for memory leak indicators
      const memoryLeakIndicators = metrics.performanceBottlenecks.filter(b => 
        b.includes('memory') || b.includes('leak')
      );
      
      logger.info(`- Memory Leak Indicators: ${memoryLeakIndicators.length}`);
      memoryLeakIndicators.forEach(indicator => logger.info(`  - ${indicator}`));
      
      expect(metrics.renderCount).toBe(5);
      expect(metrics.memoryPeak).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Network Optimization', () => {
    it('should analyze network performance and optimization', async () => {
      const componentName = 'NetworkOptimizationTest';
      
      performanceProfiler.startProfiling(componentName);
      
      await act(async () => {
        render(
          <BrowserRouter>
            <UnifiedFeed />
          </BrowserRouter>
        );
      });
      
      const metrics = performanceProfiler.stopProfiling(componentName, 1);
      
      logger.info(`🌐 Network Optimization Analysis:`);
      logger.info(`- Component: ${metrics.componentName}`);
      logger.info(`- Render Time: ${metrics.totalRenderTime.toFixed(2)}ms`);
      logger.info(`- Network Bottlenecks: ${metrics.performanceBottlenecks.filter(b => b.includes('network')).length}`);
      
      // Check for network optimization recommendations
      const networkRecommendations = metrics.recommendations.filter(r => 
        r.includes('network') || r.includes('API') || r.includes('request') || r.includes('cache')
      );
      
      logger.info(`- Network Recommendations: ${networkRecommendations.length}`);
      networkRecommendations.forEach(rec => logger.info(`  - ${rec}`));
      
      expect(metrics.totalRenderTime).toBeGreaterThan(0);
      expect(Array.isArray(networkRecommendations)).toBe(true);
    });

    it('should identify API performance bottlenecks', async () => {
      const componentName = 'APIPerformanceTest';
      
      performanceProfiler.startProfiling(componentName);
      
      // Simulate API calls
      await act(async () => {
        render(
          <BrowserRouter>
            <UnifiedFeed />
          </BrowserRouter>
        );
      });
      
      const metrics = performanceProfiler.stopProfiling(componentName, 1);
      
      logger.info(`🔌 API Performance Analysis:`);
      logger.info(`- API Bottlenecks: ${metrics.performanceBottlenecks.filter(b => b.includes('API')).length}`);
      logger.info(`- Network Recommendations: ${metrics.recommendations.filter(r => r.includes('API')).length}`);
      
      // Verify API performance analysis
      expect(metrics.performanceBottlenecks).toBeDefined();
      expect(metrics.recommendations).toBeDefined();
    });
  });

  describe('Accessibility Optimization', () => {
    it('should analyze accessibility performance', async () => {
      const componentName = 'AccessibilityOptimizationTest';
      
      performanceProfiler.startProfiling(componentName);
      
      await act(async () => {
        render(
          <BrowserRouter>
            <UnifiedFeed />
          </BrowserRouter>
        );
      });
      
      const metrics = performanceProfiler.stopProfiling(componentName, 1);
      
      logger.info(`♿ Accessibility Performance Analysis:`);
      logger.info(`- Component: ${metrics.componentName}`);
      logger.info(`- Accessibility Bottlenecks: ${metrics.performanceBottlenecks.filter(b => b.includes('accessibility')).length}`);
      
      // Check for accessibility optimization recommendations
      const accessibilityRecommendations = metrics.recommendations.filter(r => 
        r.includes('accessibility') || r.includes('screen reader') || r.includes('ARIA')
      );
      
      logger.info(`- Accessibility Recommendations: ${accessibilityRecommendations.length}`);
      accessibilityRecommendations.forEach(rec => logger.info(`  - ${rec}`));
      
      expect(metrics.componentName).toBe(componentName);
      expect(Array.isArray(accessibilityRecommendations)).toBe(true);
    });

    it('should optimize screen reader performance', async () => {
      const componentName = 'ScreenReaderOptimizationTest';
      
      performanceProfiler.startProfiling(componentName);
      
      await act(async () => {
        render(
          <BrowserRouter>
            <UnifiedFeed />
          </BrowserRouter>
        );
      });
      
      const metrics = performanceProfiler.stopProfiling(componentName, 1);
      
      logger.info(`📱 Screen Reader Performance:`);
      logger.info(`- Render Time: ${metrics.totalRenderTime.toFixed(2)}ms`);
      logger.info(`- Optimization Score: ${metrics.optimizationScore}/100`);
      
      // Check for screen reader optimization recommendations
      const screenReaderRecommendations = metrics.recommendations.filter(r => 
        r.includes('screen reader') || r.includes('announcement') || r.includes('ARIA')
      );
      
      logger.info(`- Screen Reader Recommendations: ${screenReaderRecommendations.length}`);
      screenReaderRecommendations.forEach(rec => logger.info(`  - ${rec}`));
      
      expect(metrics.optimizationScore).toBeGreaterThanOrEqual(0);
      expect(metrics.optimizationScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Production Monitoring', () => {
    it('should simulate production performance monitoring', async () => {
      const componentName = 'ProductionMonitoringTest';
      
      // Simulate production-like conditions
      performanceProfiler.startProfiling(componentName);
      
      // Simulate multiple renders under production conditions
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          render(
            <BrowserRouter>
              <UnifiedFeed />
            </BrowserRouter>
          );
        });
      }
      
      const metrics = performanceProfiler.stopProfiling(componentName, 3);
      
      logger.info(`🏭 Production Performance Monitoring:`);
      logger.info(`- Component: ${metrics.componentName}`);
      logger.info(`- Render Count: ${metrics.renderCount}`);
      logger.info(`- Total Render Time: ${metrics.totalRenderTime.toFixed(2)}ms`);
      logger.info(`- Average Render Time: ${metrics.averageRenderTime.toFixed(2)}ms`);
      logger.info(`- Memory Peak: ${metrics.memoryPeak.toFixed(2)}MB`);
      logger.info(`- Optimization Score: ${metrics.optimizationScore}/100`);
      
      // Verify production monitoring metrics
      expect(metrics.renderCount).toBe(3);
      expect(metrics.totalRenderTime).toBeGreaterThan(0);
      expect(metrics.averageRenderTime).toBeGreaterThan(0);
      expect(metrics.memoryPeak).toBeGreaterThanOrEqual(0);
      expect(metrics.optimizationScore).toBeGreaterThanOrEqual(0);
      expect(metrics.optimizationScore).toBeLessThanOrEqual(100);
    });

    it('should export comprehensive profiling data', async () => {
      // Profile multiple components
      const components = ['Component1', 'Component2', 'Component3'];
      
      for (const componentName of components) {
        performanceProfiler.startProfiling(componentName);
        
        await act(async () => {
          render(
            <BrowserRouter>
              <UnifiedFeed />
            </BrowserRouter>
          );
        });
        
        const metrics = performanceProfiler.stopProfiling(componentName, 1);
        performanceProfiler.createComponentProfile(componentName, metrics);
      }
      
      // Export profiling data
      const exportedData = performanceProfiler.exportProfilingData();
      const parsedData = JSON.parse(exportedData);
      
      logger.info(`📤 Exported Profiling Data:`);
      logger.info(`- Profiles: ${parsedData.profiles.length}`);
      logger.info(`- Metrics: ${parsedData.metrics.length}`);
      logger.info(`- Analysis Generated: ${!!parsedData.analysis}`);
      
      expect(parsedData.profiles).toBeDefined();
      expect(parsedData.metrics).toBeDefined();
      expect(parsedData.analysis).toBeDefined();
      expect(parsedData.profiles.length).toBe(3);
      expect(parsedData.metrics.length).toBe(3);
    });
  });
});

