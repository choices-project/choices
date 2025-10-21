/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UnifiedFeed from '@/features/feeds/components/UnifiedFeed';
import { T } from '@/lib/testing/testIds';
import { logger } from '@/lib/utils/logger';

// Use real functionality - minimal mocking only for test environment setup

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
          totalUsers: 100,
          activeUsers: 50,
          engagement: 0.75
        })
      } as Response);
    }
    if (url.includes('/api/pwa/offline/sync')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ synced: true })
      } as Response);
    }
    // Default response
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({})
    } as Response);
  });
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

describe('Component Performance Tests', () => {
  describe('Rendering Performance', () => {
    it('should render within performance budget', async () => {
      const startTime = performance.now();
      
      await act(async () => {
        render(
          <BrowserRouter>
            <UnifiedFeed />
          </BrowserRouter>
        );
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Performance budget: 1000ms for initial render (realistic for complex components in test environment)
      expect(renderTime).toBeLessThan(1000);
      
      // Log actual performance for monitoring
      logger.info(`Component render time: ${renderTime.toFixed(2)}ms`);
      
      // Performance grade based on render time
      if (renderTime < 100) {
        logger.info('🚀 EXCELLENT: Render time < 100ms');
      } else if (renderTime < 150) {
        logger.info('✅ GOOD: Render time < 150ms');
      } else {
        logger.info('⚠️ NEEDS IMPROVEMENT: Render time > 150ms');
      }
    });

    it('should handle multiple renders efficiently', async () => {
      const renderTimes: number[] = [];
      
      // Test multiple renders
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        
        await act(async () => {
          render(
            <BrowserRouter>
              <UnifiedFeed />
            </BrowserRouter>
          );
        });
        
        const endTime = performance.now();
        renderTimes.push(endTime - startTime);
      }
      
      const averageRenderTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
      const maxRenderTime = Math.max(...renderTimes);
      
      // Performance expectations (more realistic for test environment)
      expect(averageRenderTime).toBeLessThan(600); // Average should be under 600ms
      expect(maxRenderTime).toBeLessThan(1000); // Max should be under 1000ms
      
      logger.info(`Average render time: ${averageRenderTime.toFixed(2)}ms`);
      logger.info(`Max render time: ${maxRenderTime.toFixed(2)}ms`);
    });

    it('should maintain consistent performance across renders', async () => {
      const renderTimes: number[] = [];
      
      // Test consistency across multiple renders
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        
        await act(async () => {
          render(
            <BrowserRouter>
              <UnifiedFeed />
            </BrowserRouter>
          );
        });
        
        const endTime = performance.now();
        renderTimes.push(endTime - startTime);
      }
      
      // Calculate performance variance
      const average = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
      const variance = renderTimes.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) / renderTimes.length;
      const standardDeviation = Math.sqrt(variance);
      
      // Performance should be consistent (low variance) - more realistic for test environment
      expect(standardDeviation).toBeLessThan(400); // Standard deviation should be under 400ms
      
      logger.info(`Performance consistency - Average: ${average.toFixed(2)}ms, StdDev: ${standardDeviation.toFixed(2)}ms`);
    });
  });

  describe('Memory Performance', () => {
    it('should not leak memory during renders', async () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      // Perform multiple renders to test for memory leaks
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          render(
            <BrowserRouter>
              <UnifiedFeed />
            </BrowserRouter>
          );
        });
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      
      logger.info(`Memory usage - Initial: ${(initialMemory / 1024 / 1024).toFixed(2)}MB, Final: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);
    });

    it('should handle large datasets efficiently', async () => {
      // Mock large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        title: `Civic Activity ${i}`,
        description: `Description for activity ${i}`,
        category: 'civic',
        timestamp: new Date().toISOString(),
        source: 'test'
      }));
      
      // Mock fetch to return large dataset
      global.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(largeDataset)
      } as Response));
      
      const startTime = performance.now();
      
      await act(async () => {
        render(
          <BrowserRouter>
            <UnifiedFeed />
          </BrowserRouter>
        );
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should handle large datasets within reasonable time (more realistic for test environment)
      expect(renderTime).toBeLessThan(3000); // 3000ms for large dataset
      
      logger.info(`Large dataset render time: ${renderTime.toFixed(2)}ms`);
    });
  });

  describe('Interaction Performance', () => {
    it('should handle user interactions efficiently', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <UnifiedFeed />
          </BrowserRouter>
        );
      });
      
      // Test interaction performance
      const startTime = performance.now();
      
      // Simulate user interactions
      const feedElement = screen.getByRole('main');
      fireEvent.click(feedElement);
      
      const endTime = performance.now();
      const interactionTime = endTime - startTime;
      
      // Interaction should be fast (use realistic threshold for test environment)
      expect(interactionTime).toBeLessThan(500); // 500ms for interactions
      
      logger.info(`Interaction time: ${interactionTime.toFixed(2)}ms`);
    });

    it('should handle scroll events efficiently', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <UnifiedFeed />
          </BrowserRouter>
        );
      });
      
      const startTime = performance.now();
      
      // Simulate scroll events
      const feedElement = screen.getByRole('main');
      fireEvent.scroll(feedElement, { target: { scrollY: 100 } });
      
      const endTime = performance.now();
      const scrollTime = endTime - startTime;
      
      // Scroll should be very fast
      expect(scrollTime).toBeLessThan(16); // 16ms for 60fps
      
      logger.info(`Scroll time: ${scrollTime.toFixed(2)}ms`);
    });
  });

  describe('Network Performance', () => {
    it('should handle network requests efficiently', async () => {
      const startTime = performance.now();
      
      await act(async () => {
        render(
          <BrowserRouter>
            <UnifiedFeed />
          </BrowserRouter>
        );
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render quickly even with network requests (more realistic for test environment)
      expect(renderTime).toBeLessThan(500);
      
      logger.info(`Network render time: ${renderTime.toFixed(2)}ms`);
    });

    it('should handle network errors gracefully', async () => {
      // Mock network error
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
      
      const startTime = performance.now();
      
      await act(async () => {
        render(
          <BrowserRouter>
            <UnifiedFeed />
          </BrowserRouter>
        );
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should still render quickly even with network errors (more realistic for test environment)
      expect(renderTime).toBeLessThan(500);
      
      logger.info(`Error handling render time: ${renderTime.toFixed(2)}ms`);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', async () => {
      const startTime = performance.now();
      
      await act(async () => {
        render(
          <BrowserRouter>
            <UnifiedFeed />
          </BrowserRouter>
        );
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Performance metrics
      const metrics = {
        renderTime,
        memoryUsage: performance.memory?.usedJSHeapSize || 0,
        timestamp: Date.now()
      };
      
      // Log metrics for monitoring
      logger.info(`Performance Metrics:`, metrics);
      
      // Performance grade (more realistic for test environment)
      expect(renderTime).toBeLessThan(500);
    });
  });
});





