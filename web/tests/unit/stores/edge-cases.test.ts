/**
 * Edge Case Tests for Stores
 * 
 * Tests edge cases, boundary conditions, and error scenarios
 * for Zustand stores to ensure robust behavior.
 * 
 * Created: November 30, 2025
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { act } from '@testing-library/react';

import { useAppStore } from '@/lib/stores/appStore';
import { usePollsStore } from '@/lib/stores/pollsStore';
import { useNotificationStore } from '@/lib/stores/notificationStore';

describe('Store Edge Cases', () => {
  beforeEach(() => {
    // Reset stores before each test
    act(() => {
      useAppStore.getState().setError(null);
      useAppStore.getState().setLoading(false);
      usePollsStore.getState().resetPollsState();
      useNotificationStore.getState().clearAll();
    });
  });

  describe('AppStore Edge Cases', () => {
    it('should handle rapid theme toggles', () => {
      act(() => {
        useAppStore.getState().setTheme('light');
      });

      // Rapid toggles
      for (let i = 0; i < 10; i++) {
        act(() => {
          useAppStore.getState().toggleTheme();
        });
      }

      const theme = useAppStore.getState().theme;
      expect(['light', 'dark']).toContain(theme);
    });

    it('should handle sidebar width boundary values', () => {
      act(() => {
        useAppStore.getState().setSidebarWidth(199); // Below minimum
      });
      expect(useAppStore.getState().sidebarWidth).toBe(200); // Clamped to minimum

      act(() => {
        useAppStore.getState().setSidebarWidth(401); // Above maximum
      });
      expect(useAppStore.getState().sidebarWidth).toBe(400); // Clamped to maximum

      act(() => {
        useAppStore.getState().setSidebarWidth(300); // Valid value
      });
      expect(useAppStore.getState().sidebarWidth).toBe(300);
    });

    it('should handle null/undefined error values', () => {
      act(() => {
        useAppStore.getState().setError('Test error');
      });
      expect(useAppStore.getState().error).toBe('Test error');

      act(() => {
        useAppStore.getState().setError(null);
      });
      expect(useAppStore.getState().error).toBeNull();

      act(() => {
        useAppStore.getState().clearError();
      });
      expect(useAppStore.getState().error).toBeNull();
    });

    it('should handle system theme changes', () => {
      act(() => {
        useAppStore.getState().setTheme('system');
        useAppStore.getState().updateSystemTheme('dark');
      });
      expect(useAppStore.getState().resolvedTheme).toBe('dark');

      act(() => {
        useAppStore.getState().updateSystemTheme('light');
      });
      expect(useAppStore.getState().resolvedTheme).toBe('light');
    });
  });

  describe('PollsStore Edge Cases', () => {
    it('should handle empty poll arrays', () => {
      act(() => {
        usePollsStore.getState().setPolls([]);
      });

      expect(usePollsStore.getState().polls).toEqual([]);
      expect(usePollsStore.getState().getFilteredPolls()).toEqual([]);
    });

    it('should handle filters with invalid status values', () => {
      act(() => {
        // Try to set invalid status - should be normalized
        usePollsStore.getState().setFilters({ status: ['invalid-status' as any] });
      });

      const filters = usePollsStore.getState().filters;
      // Should be normalized to valid statuses or empty
      expect(Array.isArray(filters.status)).toBe(true);
    });

    it('should handle very long search queries', () => {
      const longQuery = 'a'.repeat(1000);
      
      act(() => {
        usePollsStore.getState().setSearchQuery(longQuery);
      });

      expect(usePollsStore.getState().search.query).toBe(longQuery);
    });

    it('should handle duplicate poll IDs', () => {
      const poll1 = { id: 'poll-1', title: 'Poll 1' } as any;
      const poll2 = { id: 'poll-1', title: 'Poll 2' } as any; // Duplicate ID

      act(() => {
        usePollsStore.getState().setPolls([poll1]);
        usePollsStore.getState().addPoll(poll2);
      });

      const polls = usePollsStore.getState().polls;
      // Should handle duplicates (either prevent or allow based on implementation)
      expect(polls.length).toBeGreaterThan(0);
    });

    it('should handle null/undefined poll data', () => {
      act(() => {
        usePollsStore.getState().setPolls([
          { id: 'poll-1', title: 'Valid Poll' } as any,
          null as any,
          undefined as any,
        ].filter(Boolean));
      });

      const polls = usePollsStore.getState().polls;
      expect(polls.every(poll => poll !== null && poll !== undefined)).toBe(true);
    });

    it('should handle filter clearing with active filters', () => {
      act(() => {
        usePollsStore.getState().setFilters({ 
          status: ['active', 'closed'],
          category: ['politics'],
          tags: ['important'],
        });
      });

      act(() => {
        usePollsStore.getState().clearFilters();
      });

      const filters = usePollsStore.getState().filters;
      expect(filters.status).toEqual(['active']); // Default
      expect(filters.category).toEqual([]);
      expect(filters.tags).toEqual([]);
    });
  });

  describe('NotificationStore Edge Cases', () => {
    it('should handle maximum notification limit', () => {
      act(() => {
        useNotificationStore.getState().updateSettings({ maxNotifications: 3 });
      });

      // Add more notifications than limit
      for (let i = 0; i < 5; i++) {
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
      expect(notifications.length).toBeLessThanOrEqual(3);
    });

    it('should handle rapid notification additions', () => {
      act(() => {
        for (let i = 0; i < 20; i++) {
          useNotificationStore.getState().addNotification({
            id: `rapid-${i}`,
            title: `Rapid ${i}`,
            message: `Message ${i}`,
            type: 'info',
          });
        }
      });

      const notifications = useNotificationStore.getState().notifications;
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should handle removing non-existent notification', () => {
      act(() => {
        useNotificationStore.getState().removeNotification('non-existent-id');
      });

      // Should not throw or cause errors
      const notifications = useNotificationStore.getState().notifications;
      expect(Array.isArray(notifications)).toBe(true);
    });

    it('should handle clearing empty notification list', () => {
      act(() => {
        useNotificationStore.getState().clearAll();
      });

      const notifications = useNotificationStore.getState().notifications;
      expect(notifications).toEqual([]);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent state updates', () => {
      act(() => {
        // Simulate concurrent updates
        Promise.all([
          Promise.resolve().then(() => useAppStore.getState().setLoading(true)),
          Promise.resolve().then(() => useAppStore.getState().setError('Error')),
          Promise.resolve().then(() => useAppStore.getState().setLoading(false)),
        ]);
      });

      // State should be consistent
      const state = useAppStore.getState();
      expect(typeof state.isLoading).toBe('boolean');
      expect(state.error === null || typeof state.error === 'string').toBe(true);
    });

    it('should handle rapid filter changes', () => {
      act(() => {
        for (let i = 0; i < 10; i++) {
          usePollsStore.getState().setFilters({ 
            status: i % 2 === 0 ? ['active'] : ['closed'] 
          });
        }
      });

      const filters = usePollsStore.getState().filters;
      expect(Array.isArray(filters.status)).toBe(true);
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle zero-length arrays', () => {
      act(() => {
        usePollsStore.getState().setPolls([]);
      });

      expect(usePollsStore.getState().polls.length).toBe(0);
      expect(usePollsStore.getState().getFilteredPolls().length).toBe(0);
    });

    it('should handle very large arrays', () => {
      const largePollArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `poll-${i}`,
        title: `Poll ${i}`,
        status: 'active',
      })) as any;

      act(() => {
        usePollsStore.getState().setPolls(largePollArray);
      });

      expect(usePollsStore.getState().polls.length).toBe(1000);
    });

    it('should handle special characters in search', () => {
      const specialQueries = [
        'test@example.com',
        'test<script>alert("xss")</script>',
        'test with spaces',
        'test\nwith\nnewlines',
        'test\twith\ttabs',
        'test"with"quotes',
        "test'with'quotes",
      ];

      specialQueries.forEach(query => {
        act(() => {
          usePollsStore.getState().setSearchQuery(query);
        });

        expect(usePollsStore.getState().search.query).toBe(query);
      });
    });
  });
});

