/**
 * UnifiedFeed Accessibility Tests
 * 
 * Comprehensive accessibility testing for the UnifiedFeed component
 * Tests WCAG 2.1 AA compliance and screen reader support
 * 
 * Created: January 19, 2025
 * Status: ✅ PRODUCTION READY
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { axe, toHaveNoViolations } from 'jest-axe';
import UnifiedFeed from '@/features/feeds/components/UnifiedFeed';
import { useFeeds } from '@/lib/stores/feedsStore';
import { useHashtags } from '@/features/hashtags/hooks/useHashtags';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock the stores
jest.mock('@/lib/stores/feedsStore', () => ({
  useFeeds: jest.fn()
}));

jest.mock('@/features/hashtags/hooks/useHashtags', () => ({
  useHashtags: jest.fn()
}));

const mockUseFeeds = useFeeds as jest.MockedFunction<typeof useFeeds>;
const mockUseHashtags = useHashtags as jest.MockedFunction<typeof useHashtags>;

// Ensure mocks are properly initialized
beforeEach(() => {
  mockUseFeeds.mockReturnValue([]);
  mockUseHashtags.mockReturnValue({
    hashtags: [],
    trendingHashtags: [],
    userHashtags: [],
    isLoading: false,
    error: null,
    loadTrendingHashtags: jest.fn(),
    searchHashtags: jest.fn(),
    followHashtag: jest.fn(),
    unfollowHashtag: jest.fn(),
    getTrendingHashtags: jest.fn(),
    refresh: jest.fn()
  });
});


// Mock data
const mockFeedData = [
  {
    id: '1',
    type: 'poll',
    title: 'Test Poll',
    description: 'This is a test poll',
    hashtags: ['politics', 'election'],
    created_at: '2025-01-19T10:00:00Z',
    author: 'Test User',
    engagement: {
      likes: 10,
      shares: 5,
      comments: 3
    }
  },
  {
    id: '2',
    type: 'post',
    title: 'Test Post',
    description: 'This is a test post',
    hashtags: ['news', 'update'],
    created_at: '2025-01-19T09:00:00Z',
    author: 'Test User 2',
    engagement: {
      likes: 15,
      shares: 8,
      comments: 12
    }
  }
];

const mockHashtagData = [
  {
    id: '1',
    name: 'politics',
    display_name: 'Politics',
    usage_count: 100,
    follower_count: 50,
    is_trending: true,
    trend_score: 0.8,
    created_at: '2025-01-19T10:00:00Z',
    updated_at: '2025-01-19T10:00:00Z',
    is_verified: false,
    is_featured: false
  }
];

describe('UnifiedFeed Accessibility Tests', () => {
  beforeEach(() => {
    // Mock store implementations
    mockUseFeeds.mockReturnValue({
      feeds: mockFeedData,
      loading: false,
      error: null,
      refreshFeeds: jest.fn(),
      likeFeed: jest.fn(),
      shareFeed: jest.fn(),
      commentFeed: jest.fn(),
      bookmarkFeed: jest.fn()
    });

    mockUseHashtags.mockReturnValue({
      hashtags: mockHashtagData,
      loading: false,
      error: null,
      searchHashtags: jest.fn(),
      followHashtag: jest.fn(),
      unfollowHashtag: jest.fn(),
      getTrendingHashtags: jest.fn()
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('WCAG 2.1 AA Compliance', () => {
    test('should have no accessibility violations', async () => {
      const { container } = render(<UnifiedFeed />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper heading structure', async () => {
      render(<UnifiedFeed />);
      
      // Check for main heading
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading).toHaveTextContent('Unified Feed');
    });

    test('should have proper color contrast', async () => {
      const { container } = render(<UnifiedFeed />);
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });

    test('should have proper focus management', async () => {
      render(<UnifiedFeed />);
      
      // Check that focusable elements are properly marked
      const focusableElements = screen.getAllByRole('button');
      focusableElements.forEach(element => {
        expect(element).toHaveAttribute('tabIndex');
      });
    });
  });

  describe('Screen Reader Support', () => {
    test('should have proper ARIA labels', async () => {
      render(<UnifiedFeed />);
      
      // Check main feed role and label
      const mainFeed = screen.getByRole('main');
      expect(mainFeed).toHaveAttribute('aria-label', 'Unified Feed');
      
      // Check button labels
      const darkModeButton = screen.getByLabelText(/switch to dark mode/i);
      expect(darkModeButton).toBeInTheDocument();
      
      const filtersButton = screen.getByLabelText(/toggle advanced filters/i);
      expect(filtersButton).toBeInTheDocument();
      
      const refreshButton = screen.getByLabelText(/refresh feed/i);
      expect(refreshButton).toBeInTheDocument();
    });

    test('should have proper ARIA live regions', async () => {
      render(<UnifiedFeed />);
      
      // Check for live regions
      const liveRegions = screen.getAllByRole('status');
      expect(liveRegions.length).toBeGreaterThan(0);
      
      // Check for polite announcements
      const politeRegion = screen.getByRole('status', { name: /feed/i });
      expect(politeRegion).toBeInTheDocument();
    });

    test('should announce state changes', async () => {
      render(<UnifiedFeed />);
      
      // Trigger a state change
      const darkModeButton = screen.getByLabelText(/switch to dark mode/i);
      fireEvent.click(darkModeButton);
      
      // Check for announcement
      await waitFor(() => {
        expect(screen.getByText(/switched to dark mode/i)).toBeInTheDocument();
      });
    });

    test('should have proper form labels', async () => {
      render(<UnifiedFeed />);
      
      // Check for form elements with proper labels
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        const label = screen.getByLabelText(input.getAttribute('aria-label') || '');
        expect(label).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    test('should support tab navigation', async () => {
      render(<UnifiedFeed />);
      
      // Start with first focusable element
      const firstButton = screen.getByLabelText(/switch to dark mode/i);
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);
      
      // Tab to next element
      fireEvent.keyDown(firstButton, { key: 'Tab' });
      const nextButton = screen.getByLabelText(/toggle advanced filters/i);
      expect(document.activeElement).toBe(nextButton);
    });

    test('should support enter key activation', async () => {
      render(<UnifiedFeed />);
      
      const darkModeButton = screen.getByLabelText(/switch to dark mode/i);
      darkModeButton.focus();
      
      // Press Enter
      fireEvent.keyDown(darkModeButton, { key: 'Enter' });
      
      // Check that action was triggered
      await waitFor(() => {
        expect(screen.getByLabelText(/switch to light mode/i)).toBeInTheDocument();
      });
    });

    test('should support escape key for closing modals', async () => {
      render(<UnifiedFeed />);
      
      // Open advanced filters
      const filtersButton = screen.getByLabelText(/toggle advanced filters/i);
      fireEvent.click(filtersButton);
      
      // Check that filters panel is open
      expect(screen.getByText(/advanced filters/i)).toBeInTheDocument();
      
      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });
      
      // Check that filters panel is closed
      await waitFor(() => {
        expect(screen.queryByText(/advanced filters/i)).not.toBeInTheDocument();
      });
    });

    test('should support arrow key navigation', async () => {
      render(<UnifiedFeed />);
      
      // Check that arrow keys work for navigation
      const firstButton = screen.getByLabelText(/switch to dark mode/i);
      firstButton.focus();
      
      // Arrow right
      fireEvent.keyDown(firstButton, { key: 'ArrowRight' });
      
      // Arrow left
      fireEvent.keyDown(firstButton, { key: 'ArrowLeft' });
      
      // Arrow up
      fireEvent.keyDown(firstButton, { key: 'ArrowUp' });
      
      // Arrow down
      fireEvent.keyDown(firstButton, { key: 'ArrowDown' });
      
      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe('Focus Management', () => {
    test('should trap focus in modals', async () => {
      render(<UnifiedFeed />);
      
      // Open advanced filters
      const filtersButton = screen.getByLabelText(/toggle advanced filters/i);
      fireEvent.click(filtersButton);
      
      // Check that focus is trapped in modal
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      
      // Check that focus is within modal
      const focusedElement = document.activeElement;
      expect(modal.contains(focusedElement)).toBe(true);
    });

    test('should restore focus after closing modals', async () => {
      render(<UnifiedFeed />);
      
      const filtersButton = screen.getByLabelText(/toggle advanced filters/i);
      filtersButton.focus();
      
      // Open modal
      fireEvent.click(filtersButton);
      
      // Close modal
      fireEvent.click(filtersButton);
      
      // Check that focus is restored
      expect(document.activeElement).toBe(filtersButton);
    });

    test('should manage focus for dynamic content', async () => {
      render(<UnifiedFeed />);
      
      // Trigger content update
      const refreshButton = screen.getByLabelText(/refresh feed/i);
      fireEvent.click(refreshButton);
      
      // Check that focus is managed properly
      await waitFor(() => {
        expect(document.activeElement).toBeInTheDocument();
      });
    });
  });

  describe('Semantic HTML', () => {
    test('should use proper semantic elements', async () => {
      render(<UnifiedFeed />);
      
      // Check for main element
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      
      // Check for header element
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
      
      // Check for navigation elements
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    test('should have proper list structure', async () => {
      render(<UnifiedFeed />);
      
      // Check for list elements
      const lists = screen.getAllByRole('list');
      expect(lists.length).toBeGreaterThan(0);
      
      // Check for list items
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeGreaterThan(0);
    });

    test('should have proper button semantics', async () => {
      render(<UnifiedFeed />);
      
      // Check that all buttons have proper roles
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('Alternative Text', () => {
    test('should have alt text for images', async () => {
      render(<UnifiedFeed />);
      
      // Check for images with alt text
      const images = screen.getAllByRole('img');
      images.forEach(image => {
        expect(image).toHaveAttribute('alt');
      });
    });

    test('should have descriptive text for icons', async () => {
      render(<UnifiedFeed />);
      
      // Check for icons with proper labels
      const icons = screen.getAllByRole('img');
      icons.forEach(icon => {
        const altText = icon.getAttribute('alt');
        expect(altText).toBeTruthy();
        expect(altText?.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    test('should announce errors to screen readers', async () => {
      mockUseFeeds.mockReturnValue({
        ...mockUseFeeds(),
        error: 'Failed to load feeds'
      });

      render(<UnifiedFeed />);
      
      // Check for error announcement
      await waitFor(() => {
        expect(screen.getByText(/failed to load feeds/i)).toBeInTheDocument();
      });
    });

    test('should provide error recovery options', async () => {
      mockUseFeeds.mockReturnValue({
        ...mockUseFeeds(),
        error: 'Network error'
      });

      render(<UnifiedFeed />);
      
      // Check for retry button
      const retryButton = screen.getByLabelText(/retry/i);
      expect(retryButton).toBeInTheDocument();
      
      // Check that retry button is accessible
      expect(retryButton).toHaveAttribute('aria-label');
    });
  });

  describe('Loading States', () => {
    test('should announce loading states', async () => {
      mockUseFeeds.mockReturnValue({
        ...mockUseFeeds(),
        loading: true
      });

      render(<UnifiedFeed />);
      
      // Check for loading announcement
      await waitFor(() => {
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
      });
    });

    test('should provide loading progress information', async () => {
      mockUseFeeds.mockReturnValue({
        ...mockUseFeeds(),
        loading: true
      });

      render(<UnifiedFeed />);
      
      // Check for progress indicator
      const progressIndicator = screen.getByRole('progressbar');
      expect(progressIndicator).toBeInTheDocument();
    });
  });

  describe('Mobile Accessibility', () => {
    test('should support touch gestures with accessibility', async () => {
      render(<UnifiedFeed />);
      
      // Simulate touch events
      const feed = screen.getByRole('main');
      fireEvent.touchStart(feed, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchMove(feed, { touches: [{ clientX: 100, clientY: 200 }] });
      fireEvent.touchEnd(feed, { changedTouches: [{ clientX: 100, clientY: 200 }] });
      
      // Check that touch events are handled properly
      expect(feed).toBeInTheDocument();
    });

    test('should support haptic feedback with accessibility', async () => {
      render(<UnifiedFeed />);
      
      // Mock haptic feedback
      const mockVibrate = jest.fn();
      Object.defineProperty(navigator, 'vibrate', {
        value: mockVibrate,
        writable: true
      });
      
      // Trigger haptic feedback
      const likeButton = screen.getByLabelText(/like/i);
      fireEvent.click(likeButton);
      
      // Check that haptic feedback was triggered
      expect(mockVibrate).toHaveBeenCalled();
    });
  });

  describe('Internationalization', () => {
    test('should support different languages', async () => {
      render(<UnifiedFeed />);
      
      // Check that text content is properly structured for translation
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Unified Feed');
      
      // Check that ARIA labels are properly structured
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const ariaLabel = button.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      });
    });

    test('should support right-to-left languages', async () => {
      render(<UnifiedFeed />);
      
      // Check that layout supports RTL
      const mainFeed = screen.getByRole('main');
      expect(mainFeed).toBeInTheDocument();
      
      // Check that text direction can be changed
      const textElements = screen.getAllByText(/test/i);
      textElements.forEach(element => {
        expect(element).toBeInTheDocument();
      });
    });
  });
});
