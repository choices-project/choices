/**
 * Performance and Load Tests for Stores
 * 
 * Tests store performance under load, memory usage, and optimization scenarios
 * to ensure stores remain performant as data grows.
 * 
 * Created: November 30, 2025
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { act } from '@testing-library/react';

import { useAppStore } from '@/lib/stores/appStore';
import { useNotificationStore } from '@/lib/stores/notificationStore';
import { usePollsStore } from '@/lib/stores/pollsStore';

describe('Store Performance', () => {
  beforeEach(() => {
    act(() => {
      usePollsStore.getState().resetPollsState();
      useNotificationStore.getState().clearAll();
    });
  });

  describe('Large Dataset Performance', () => {
    it('should handle 10,000 polls efficiently', () => {
      const startTime = performance.now();
      
      const largePollArray = Array.from({ length: 10000 }, (_, i) => ({
        id: `poll-${i}`,
        title: `Poll ${i}`,
        description: `Description for poll ${i}`,
        status: i % 2 === 0 ? 'active' : 'closed',
        created_at: new Date().toISOString(),
        total_votes: Math.floor(Math.random() * 1000),
      })) as any;

      act(() => {
        usePollsStore.getState().setPolls(largePollArray);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(usePollsStore.getState().polls.length).toBe(10000);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should filter large datasets efficiently', () => {
      const largePollArray = Array.from({ length: 5000 }, (_, i) => ({
        id: `poll-${i}`,
        title: `Poll ${i}`,
        status: i % 3 === 0 ? 'active' : i % 3 === 1 ? 'closed' : 'archived',
        created_at: new Date().toISOString(),
      })) as any;

      act(() => {
        usePollsStore.getState().setPolls(largePollArray);
        usePollsStore.getState().setFilters({ status: ['active'] });
      });

      const startTime = performance.now();
      const filtered = usePollsStore.getState().getFilteredPolls();
      const endTime = performance.now();

      expect(filtered.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(100); // Should filter in under 100ms
    });

    it('should search large datasets efficiently', () => {
      const largePollArray = Array.from({ length: 5000 }, (_, i) => ({
        id: `poll-${i}`,
        title: `Poll about topic ${i}`,
        description: `This is a description for poll ${i}`,
        status: 'active',
        created_at: new Date().toISOString(),
      })) as any;

      act(() => {
        usePollsStore.getState().setPolls(largePollArray);
        usePollsStore.getState().setSearchQuery('topic 100');
      });

      const startTime = performance.now();
      const filtered = usePollsStore.getState().getFilteredPolls();
      const endTime = performance.now();

      expect(filtered.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(200); // Should search in under 200ms
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory with rapid state updates', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform many rapid updates
      for (let i = 0; i < 1000; i++) {
        act(() => {
          useAppStore.getState().setLoading(i % 2 === 0);
          useAppStore.getState().setError(i % 10 === 0 ? `Error ${i}` : null);
        });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Memory should not grow excessively (allowing for some growth)
      if (initialMemory > 0 && finalMemory > 0) {
        const growth = finalMemory - initialMemory;
        const growthPercent = (growth / initialMemory) * 100;
        expect(growthPercent).toBeLessThan(50); // Should not grow more than 50%
      }
    });

    it('should clean up old notifications', () => {
      const MAX_NOTIFICATIONS = 100;

      act(() => {
        useNotificationStore.getState().updateSettings({ maxNotifications: MAX_NOTIFICATIONS });
      });

      // Add more notifications than limit
      for (let i = 0; i < MAX_NOTIFICATIONS * 2; i++) {
        act(() => {
          useNotificationStore.getState().addNotification({
            id: `notif-${i}`,
            title: `Notification ${i}`,
            message: `Message ${i}`,
            type: 'info',
          });
        });
      }

      const notifications = useNotificationStore.getState().notifications;
      expect(notifications.length).toBeLessThanOrEqual(MAX_NOTIFICATIONS);
    });
  });

  describe('Rapid Updates Performance', () => {
    it('should handle 1000 rapid filter changes', () => {
      const pollArray = Array.from({ length: 100 }, (_, i) => ({
        id: `poll-${i}`,
        title: `Poll ${i}`,
        status: 'active',
      })) as any;

      act(() => {
        usePollsStore.getState().setPolls(pollArray);
      });

      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        act(() => {
          usePollsStore.getState().setFilters({ 
            status: i % 2 === 0 ? ['active'] : ['closed'] 
          });
        });
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete in under 2 seconds
    });

    it('should handle concurrent store updates', async () => {
      const updates = Array.from({ length: 100 }, (_, i) => 
        Promise.resolve().then(() => {
          act(() => {
            useAppStore.getState().setLoading(i % 2 === 0);
          });
        })
      );

      const startTime = performance.now();
      await Promise.all(updates);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Selector Performance', () => {
    it('should efficiently select from large state', () => {
      const largePollArray = Array.from({ length: 5000 }, (_, i) => ({
        id: `poll-${i}`,
        title: `Poll ${i}`,
        status: 'active',
        total_votes: i,
      })) as any;

      act(() => {
        usePollsStore.getState().setPolls(largePollArray);
      });

      const startTime = performance.now();
      
      // Perform many selector calls
      for (let i = 0; i < 100; i++) {
        const polls = usePollsStore.getState().polls;
        const count = polls.length;
        expect(count).toBe(5000);
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });

    it('should efficiently compute filtered polls', () => {
      const pollArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `poll-${i}`,
        title: `Poll ${i}`,
        status: i % 2 === 0 ? 'active' : 'closed',
        total_votes: i * 10,
      })) as any;

      act(() => {
        usePollsStore.getState().setPolls(pollArray);
        usePollsStore.getState().setFilters({ status: ['active'] });
      });

      // First computation
      const start1 = performance.now();
      const active1 = usePollsStore.getState().getFilteredPolls();
      const end1 = performance.now();
      const time1 = end1 - start1;

      // Second computation
      const start2 = performance.now();
      const active2 = usePollsStore.getState().getFilteredPolls();
      const end2 = performance.now();
      const time2 = end2 - start2;

      expect(active1.length).toBe(active2.length);
      expect(active1.length).toBeGreaterThan(0);
      // Both should complete reasonably quickly
      expect(time1).toBeLessThan(500);
      expect(time2).toBeLessThan(500);
    });
  });

  describe('Batch Operations', () => {
    it('should batch multiple poll additions efficiently', () => {
      const pollArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `poll-${i}`,
        title: `Poll ${i}`,
        status: 'active',
      })) as any;

      const startTime = performance.now();

      act(() => {
        // Batch add all polls at once
        usePollsStore.getState().setPolls(pollArray);
      });

      const endTime = performance.now();

      expect(usePollsStore.getState().polls.length).toBe(1000);
      expect(endTime - startTime).toBeLessThan(500); // Should be fast for batch operation
    });

    it('should handle bulk filter updates efficiently', () => {
      const pollArray = Array.from({ length: 500 }, (_, i) => ({
        id: `poll-${i}`,
        title: `Poll ${i}`,
        status: 'active',
        category: `category-${i % 10}`,
        tags: [`tag-${i % 5}`],
      })) as any;

      act(() => {
        usePollsStore.getState().setPolls(pollArray);
      });

      const startTime = performance.now();

      act(() => {
        // Apply multiple filters at once
        usePollsStore.getState().setFilters({
          status: ['active'],
          category: ['category-1', 'category-2'],
          tags: ['tag-1'],
        });
      });

      const endTime = performance.now();

      const filtered = usePollsStore.getState().getFilteredPolls();
      expect(filtered.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Debouncing and Throttling', () => {
    it('should handle rapid search queries efficiently', () => {
      const pollArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `poll-${i}`,
        title: `Poll about topic ${i}`,
        status: 'active',
      })) as any;

      act(() => {
        usePollsStore.getState().setPolls(pollArray);
      });

      const startTime = performance.now();

      // Simulate rapid typing (many search updates)
      for (let i = 0; i < 100; i++) {
        act(() => {
          usePollsStore.getState().setSearchQuery(`topic ${i}`);
        });
      }

      const endTime = performance.now();

      // Should handle rapid updates without significant performance degradation
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});

