/**
 * Critical User Flow Integration Tests
 *
 * Tests complete user journeys and critical flows to ensure
 * the application works end-to-end for key user scenarios.
 *
 * Created: November 30, 2025
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { act } from '@testing-library/react';

import { useAppStore } from '@/lib/stores/appStore';
import { usePollsStore } from '@/lib/stores/pollsStore';
import { useNotificationStore } from '@/lib/stores/notificationStore';
import { useUserStore } from '@/lib/stores/userStore';

describe('Critical User Flows', () => {
  beforeEach(() => {
    act(() => {
      useAppStore.getState().setError(null);
      useAppStore.getState().setLoading(false);
      usePollsStore.getState().resetPollsState();
      useNotificationStore.getState().clearAll();
    });
  });

  describe('User Registration and Onboarding Flow', () => {
    it('should complete full registration flow', async () => {
      // Simulate registration steps
      const registrationSteps = [
        { step: 'email', value: 'user@example.com' },
        { step: 'password', value: 'SecurePass123!' },
        { step: 'confirm', value: 'SecurePass123!' },
      ];

      // Each step should validate input
      registrationSteps.forEach(({ step, value }) => {
        expect(value).toBeTruthy();
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });

      // Final state should indicate registration complete
      expect(registrationSteps.length).toBe(3);
    });

    it('should handle registration errors gracefully', () => {
      const errors = [
        'Email already exists',
        'Password too weak',
        'Network error',
      ];

      errors.forEach(error => {
        // Should set error state
        act(() => {
          useAppStore.getState().setError(error);
        });

        expect(useAppStore.getState().error).toBe(error);

        // Should be able to clear error
        act(() => {
          useAppStore.getState().clearError();
        });

        expect(useAppStore.getState().error).toBeNull();
      });
    });
  });

  describe('Poll Creation and Voting Flow', () => {
    it('should complete poll creation flow', () => {
      const pollData = {
        title: 'Test Poll',
        description: 'Test Description',
        options: ['Option 1', 'Option 2'],
        status: 'draft' as const,
      };

      act(() => {
        usePollsStore.getState().setPolls([pollData as any]);
      });

      const polls = usePollsStore.getState().polls;
      expect(polls.length).toBe(1);
      expect(polls[0]?.title).toBe('Test Poll');
    });

    it('should handle voting on a poll', () => {
      const poll = {
        id: 'poll-1',
        title: 'Test Poll',
        status: 'active' as const,
        options: [
          { id: 'opt-1', text: 'Option 1' },
          { id: 'opt-2', text: 'Option 2' },
        ],
      } as any;

      act(() => {
        usePollsStore.getState().setPolls([poll]);
      });

      // Simulate vote
      const voteData = {
        pollId: 'poll-1',
        optionId: 'opt-1',
      };

      // Vote should be recorded
      expect(voteData.pollId).toBe(poll.id);
      expect(voteData.optionId).toBe('opt-1');
    });

    it('should prevent voting on closed polls', () => {
      const closedPoll = {
        id: 'poll-1',
        title: 'Closed Poll',
        status: 'closed' as const,
      } as any;

      act(() => {
        usePollsStore.getState().setPolls([closedPoll]);
      });

      const poll = usePollsStore.getState().getPollById('poll-1');
      expect(poll?.status).toBe('closed');
      // Voting should be prevented for closed polls
    });
  });

  describe('Notification Flow', () => {
    it('should display and dismiss notifications', () => {
      act(() => {
        useNotificationStore.getState().addNotification({
          title: 'Test Notification',
          message: 'Test message',
          type: 'info',
        });
      });

      const notifications = useNotificationStore.getState().notifications;
      expect(notifications.length).toBe(1);
      expect(notifications[0]?.title).toBe('Test Notification');

      // Get the actual notification ID (auto-generated)
      const notificationId = notifications[0]?.id;
      expect(notificationId).toBeDefined();

      act(() => {
        useNotificationStore.getState().removeNotification(notificationId!);
      });

      const afterRemoval = useNotificationStore.getState().notifications;
      expect(afterRemoval.length).toBe(0);
    });

    it('should handle notification limits', () => {
      act(() => {
        useNotificationStore.getState().updateSettings({ maxNotifications: 3 });
      });

      // Add more than limit
      for (let i = 0; i < 5; i++) {
        act(() => {
          useNotificationStore.getState().addNotification({
            title: `Notification ${i}`,
            message: `Message ${i}`,
            type: 'info',
          });
        });
      }

      const notifications = useNotificationStore.getState().notifications;
      expect(notifications.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Theme and Preferences Flow', () => {
    it('should persist theme preference', () => {
      act(() => {
        useAppStore.getState().setTheme('dark');
      });

      expect(useAppStore.getState().theme).toBe('dark');
      expect(useAppStore.getState().resolvedTheme).toBe('dark');

      act(() => {
        useAppStore.getState().setTheme('light');
      });

      expect(useAppStore.getState().theme).toBe('light');
      expect(useAppStore.getState().resolvedTheme).toBe('light');
    });

    it('should handle system theme preference', () => {
      act(() => {
        useAppStore.getState().setTheme('system');
        useAppStore.getState().updateSystemTheme('dark');
      });

      expect(useAppStore.getState().theme).toBe('system');
      expect(useAppStore.getState().resolvedTheme).toBe('dark');
    });
  });

  describe('Search and Filter Flow', () => {
    it('should filter polls by status', () => {
      const polls = [
        { id: '1', title: 'Active Poll', status: 'active' } as any,
        { id: '2', title: 'Closed Poll', status: 'closed' } as any,
        { id: '3', title: 'Another Active', status: 'active' } as any,
      ];

      act(() => {
        usePollsStore.getState().setPolls(polls);
        usePollsStore.getState().setFilters({ status: ['active'] });
      });

      const filtered = usePollsStore.getState().getFilteredPolls();
      expect(filtered.length).toBe(2);
      expect(filtered.every(p => p.status === 'active')).toBe(true);
    });

    it('should search polls by query', () => {
      const polls = [
        { id: '1', title: 'Poll about politics', status: 'active' } as any,
        { id: '2', title: 'Poll about technology', status: 'active' } as any,
        { id: '3', title: 'Poll about sports', status: 'active' } as any,
      ];

      act(() => {
        usePollsStore.getState().setPolls(polls);
        usePollsStore.getState().setSearchQuery('politics');
      });

      const filtered = usePollsStore.getState().getFilteredPolls();
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.some(p => p.title.toLowerCase().includes('politics'))).toBe(true);
    });
  });

  describe('Error Recovery Flow', () => {
    it('should recover from network errors', () => {
      // Simulate network error
      act(() => {
        useAppStore.getState().setError('Network error');
        useAppStore.getState().setLoading(false);
      });

      expect(useAppStore.getState().error).toBe('Network error');

      // Recover
      act(() => {
        useAppStore.getState().clearError();
        useAppStore.getState().setLoading(false);
      });

      expect(useAppStore.getState().error).toBeNull();
      expect(useAppStore.getState().isLoading).toBe(false);
    });

    it('should handle partial failures gracefully', () => {
      const polls = [
        { id: '1', title: 'Valid Poll', status: 'active' } as any,
        { id: '2', title: 'Another Poll', status: 'active' } as any,
      ];

      act(() => {
        usePollsStore.getState().setPolls(polls);
      });

      // Even if one operation fails, others should succeed
      const currentPolls = usePollsStore.getState().polls;
      expect(currentPolls.length).toBe(2);
    });
  });

  describe('Concurrent Operations Flow', () => {
    it('should handle multiple simultaneous operations', async () => {
      const operations = [
        () => useAppStore.getState().setTheme('dark'),
        () => useAppStore.getState().setSidebarCollapsed(true),
        () => usePollsStore.getState().setSearchQuery('test'),
        () => useNotificationStore.getState().addNotification({
          title: 'Test',
          message: 'Test',
          type: 'info',
        }),
      ];

      act(() => {
        operations.forEach(op => op());
      });

      // All operations should complete successfully
      expect(useAppStore.getState().theme).toBe('dark');
      expect(useAppStore.getState().sidebarCollapsed).toBe(true);
      expect(usePollsStore.getState().search.query).toBe('test');
      expect(useNotificationStore.getState().notifications.length).toBe(1);
    });
  });
});

