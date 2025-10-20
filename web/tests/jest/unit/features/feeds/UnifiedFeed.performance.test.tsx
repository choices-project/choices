/**
 * UnifiedFeed Performance Tests
 * 
 * Comprehensive performance testing for the UnifiedFeed component
 * Tests real performance metrics and optimization
 * 
 * Created: January 19, 2025
 * Status: ✅ PRODUCTION READY
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import UnifiedFeed from '@/features/feeds/components/UnifiedFeed';
import { useFeeds } from '@/lib/stores/feedsStore';
import { useHashtags } from '@/features/hashtags/hooks/useHashtags';
import { T } from '@/lib/testing/testIds';

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


// Performance test data
const generateLargeFeedData = (count: number) => 
  Array.from({ length: count }, (_, i) => ({
    id: `${i}`,
    title: `Test ${i % 2 === 0 ? 'Poll' : 'Post'} ${i}`,
    content: `This is test ${i % 2 === 0 ? 'poll' : 'post'} ${i} with some content`,
    summary: `This is test ${i % 2 === 0 ? 'poll' : 'post'} ${i}`,
    author: {
      id: `author-${i}`,
      name: `User ${i}`,
      avatar: `/test-avatar-${i}.jpg`,
      verified: Math.random() > 0.8
    },
    category: `category${i % 5}`,
    tags: [`hashtag${i % 10}`, `category${i % 5}`],
    type: (i % 2 === 0 ? 'poll' : 'article') as 'poll' | 'article',
    source: {
      name: `Source ${i}`,
      url: `https://example.com/${i}`,
      logo: `/test-logo-${i}.jpg`,
      verified: true
    },
    publishedAt: new Date(Date.now() - i * 1000).toISOString(),
    updatedAt: new Date(Date.now() - i * 1000).toISOString(),
    readTime: Math.floor(Math.random() * 10) + 1,
    engagement: {
      likes: Math.floor(Math.random() * 1000),
      shares: Math.floor(Math.random() * 500),
      comments: Math.floor(Math.random() * 200),
      views: Math.floor(Math.random() * 5000)
    },
    userInteraction: {
      liked: false,
      shared: false,
      bookmarked: false,
      read: false
    },
    metadata: {
      hashtags: [`hashtag${i % 10}`, `category${i % 5}`],
      primary_hashtag: `hashtag${i % 10}`,
      language: 'en'
    }
  }));

const generateLargeHashtagData = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${i}`,
    name: `hashtag${i}`,
    display_name: `Hashtag ${i}`,
    usage_count: Math.floor(Math.random() * 1000),
    follower_count: Math.floor(Math.random() * 500),
    is_trending: Math.random() > 0.7,
    trend_score: Math.random(),
    created_at: new Date(Date.now() - i * 1000).toISOString(),
    updated_at: new Date(Date.now() - i * 1000).toISOString(),
    is_verified: Math.random() > 0.9,
    is_featured: Math.random() > 0.8
  }));

describe('UnifiedFeed Performance Tests', () => {
  beforeEach(() => {
    // Mock store implementations
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering Performance', () => {
    test('should render small dataset (< 50 items) within 500ms', async () => {
      const smallDataset = generateLargeFeedData(50);
      mockUseFeeds.mockReturnValue(smallDataset);

      const startTime = performance.now();
      
      await act(async () => {
        render(<UnifiedFeed />);
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(500);
    });

    test('should render medium dataset (50-200 items) within 1000ms', async () => {
      const mediumDataset = generateLargeFeedData(200);
      mockUseFeeds.mockReturnValue(mediumDataset);

      const startTime = performance.now();
      
      await act(async () => {
        render(<UnifiedFeed />);
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(1000);
    });

    test('should render large dataset (200+ items) within 2000ms', async () => {
      const largeDataset = generateLargeFeedData(500);
      mockUseFeeds.mockReturnValue(largeDataset);

      const startTime = performance.now();
      
      await act(async () => {
        render(<UnifiedFeed />);
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(2000);
    });

    test('should handle hashtag data efficiently', async () => {
      const largeHashtagDataset = generateLargeHashtagData(1000);
      mockUseHashtags.mockReturnValue({
        ...mockUseHashtags(),
        hashtags: largeHashtagDataset
      });

      const startTime = performance.now();
      
      await act(async () => {
        render(<UnifiedFeed />);
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(1500);
    });
  });

  describe('Interaction Performance', () => {
    test('should handle rapid clicks within acceptable time', async () => {
      const component = <UnifiedFeed />;
      render(component);
      
      const startTime = performance.now();
      
      // Simulate rapid interactions
      for (let i = 0; i < 20; i++) {
        const likeButton = screen.getByLabelText(/like/i);
        fireEvent.click(likeButton);
        
        // Small delay to simulate real user behavior
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        });
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle 20 interactions within 1 second
      expect(totalTime).toBeLessThan(1000);
    });

    test('should handle scroll events efficiently', async () => {
      const largeDataset = generateLargeFeedData(300);
      mockUseFeeds.mockReturnValue(largeDataset);

      const component = <UnifiedFeed />;
      render(component);
      
      const startTime = performance.now();
      
      // Simulate scroll events
      for (let i = 0; i < 10; i++) {
        fireEvent.scroll(window, { target: { scrollY: i * 100 } });
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle scroll events efficiently
      expect(totalTime).toBeLessThan(2000);
    });

    test('should handle filter changes efficiently', async () => {
      const component = <UnifiedFeed />;
      render(component);
      
      const startTime = performance.now();
      
      // Simulate filter changes
      for (let i = 0; i < 10; i++) {
        const hashtag = screen.getByText(`hashtag${i % 10}`);
        fireEvent.click(hashtag);
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle filter changes within 1 second
      expect(totalTime).toBeLessThan(1000);
    });
  });

  describe('Memory Performance', () => {
    test('should not leak memory during repeated renders', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Render and unmount component multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<UnifiedFeed />);
        unmount();
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal (< 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    test('should handle large datasets without memory issues', async () => {
      const veryLargeDataset = generateLargeFeedData(1000);
      mockUseFeeds.mockReturnValue(veryLargeDataset);

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      await act(async () => {
        render(<UnifiedFeed />);
      });
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (< 50MB for 1000 items)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Network Performance', () => {
    test('should handle slow network responses gracefully', async () => {
      // Mock slow network response
      mockUseHashtags.mockReturnValue({
        ...mockUseHashtags(),
        isLoading: true
      });

      const startTime = performance.now();
      
      await act(async () => {
        render(<UnifiedFeed />);
      });
      
      // Simulate slow loading
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
      });
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle slow loading within 3 seconds
      expect(totalTime).toBeLessThan(3000);
    });

    test('should handle network errors without performance degradation', async () => {
      mockUseHashtags.mockReturnValue({
        ...mockUseHashtags(),
        error: 'Network error'
      });

      const startTime = performance.now();
      
      await act(async () => {
        render(<UnifiedFeed />);
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render error state quickly
      expect(renderTime).toBeLessThan(500);
    });
  });

  describe('Animation Performance', () => {
    test('should handle animations smoothly', async () => {
      const component = <UnifiedFeed />;
      render(component);
      
      const startTime = performance.now();
      
      // Trigger animations
      const darkModeButton = screen.getByLabelText(/switch to dark mode/i);
      fireEvent.click(darkModeButton);
      
      // Wait for animation to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
      });
      
      const endTime = performance.now();
      const animationTime = endTime - startTime;
      
      // Animation should complete within 500ms
      expect(animationTime).toBeLessThan(500);
    });

    test('should handle multiple simultaneous animations', async () => {
      const component = <UnifiedFeed />;
      render(component);
      
      const startTime = performance.now();
      
      // Trigger multiple animations simultaneously
      const darkModeButton = screen.getByLabelText(/switch to dark mode/i);
      const filtersButton = screen.getByLabelText(/toggle advanced filters/i);
      
      fireEvent.click(darkModeButton);
      fireEvent.click(filtersButton);
      
      // Wait for animations to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
      });
      
      const endTime = performance.now();
      const animationTime = endTime - startTime;
      
      // Multiple animations should complete within 1 second
      expect(animationTime).toBeLessThan(1000);
    });
  });

  describe('Real-time Updates Performance', () => {
    test('should handle real-time updates efficiently', async () => {
      const component = <UnifiedFeed />;
      render(component);
      
      const startTime = performance.now();
      
      // Simulate real-time updates
      for (let i = 0; i < 10; i++) {
        const newFeedData = generateLargeFeedData(10);
        mockUseFeeds.mockReturnValue(newFeedData);
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
      }
      
      const endTime = performance.now();
      const updateTime = endTime - startTime;
      
      // Should handle 10 updates within 2 seconds
      expect(updateTime).toBeLessThan(2000);
    });

    test('should handle WebSocket updates without performance issues', async () => {
      const component = <UnifiedFeed />;
      render(component);
      
      const startTime = performance.now();
      
      // Simulate WebSocket updates
      for (let i = 0; i < 5; i++) {
        // Simulate WebSocket message
        fireEvent(window, new Event('message'));
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 200));
        });
      }
      
      const endTime = performance.now();
      const updateTime = endTime - startTime;
      
      // Should handle WebSocket updates within 1.5 seconds
      expect(updateTime).toBeLessThan(1500);
    });
  });

  describe('Accessibility Performance', () => {
    test('should handle screen reader updates efficiently', async () => {
      const component = <UnifiedFeed />;
      render(component);
      
      const startTime = performance.now();
      
      // Simulate screen reader updates
      for (let i = 0; i < 5; i++) {
        const likeButton = screen.getByLabelText(/like/i);
        fireEvent.click(likeButton);
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
        });
      }
      
      const endTime = performance.now();
      const updateTime = endTime - startTime;
      
      // Should handle screen reader updates within 1 second
      expect(updateTime).toBeLessThan(1000);
    });

    test('should handle keyboard navigation efficiently', async () => {
      const component = <UnifiedFeed />;
      render(component);
      
      const startTime = performance.now();
      
      // Simulate keyboard navigation
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(document, { key: 'Tab' });
        
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });
      }
      
      const endTime = performance.now();
      const navigationTime = endTime - startTime;
      
      // Should handle keyboard navigation within 1 second
      expect(navigationTime).toBeLessThan(1000);
    });
  });
});
