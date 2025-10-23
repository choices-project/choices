/**
 * useSocialSharing Hook Tests
 * 
 * Comprehensive tests for the social sharing hook functionality
 * including platform-specific sharing, native sharing, and analytics tracking.
 * 
 * Created: January 23, 2025
 * Status: ✅ ACTIVE
 */

import { renderHook, act } from '@testing-library/react';
import { useSocialSharing } from '@/hooks/useSocialSharing';

// Mock the feature flags module
jest.mock('@/lib/core/feature-flags', () => ({
  isFeatureEnabled: jest.fn(() => true)
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock navigator.share
Object.defineProperty(navigator, 'share', {
  value: jest.fn(),
  writable: true,
});

// Mock window.open
Object.defineProperty(window, 'open', {
  value: jest.fn(),
  writable: true,
});

describe('useSocialSharing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    // Ensure feature flag is enabled by default
    const { isFeatureEnabled } = require('@/lib/core/feature-flags');
    isFeatureEnabled.mockReturnValue(true);
  });

  describe('Platform-specific sharing', () => {
    it('should share to Twitter', async () => {
      const { result } = renderHook(() => useSocialSharing());
      
      const sharingOptions = {
        title: 'Test Poll',
        description: 'Check out this poll!',
        url: 'https://choices.app/polls/123',
        pollId: '123',
        contentType: 'poll' as const,
        placement: 'feed'
      };

      await act(async () => {
        const response = await result.current.shareToPlatform('twitter', sharingOptions);
        expect(response.success).toBe(true);
        expect(response.platform).toBe('twitter');
      });

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        'width=600,height=400'
      );
    });

    it('should share to Facebook', async () => {
      const { result } = renderHook(() => useSocialSharing());
      
      const sharingOptions = {
        title: 'Test Poll',
        url: 'https://choices.app/polls/123',
        pollId: '123',
        contentType: 'poll' as const
      };

      await act(async () => {
        const response = await result.current.shareToPlatform('facebook', sharingOptions);
        expect(response.success).toBe(true);
        expect(response.platform).toBe('facebook');
      });

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('facebook.com/sharer'),
        '_blank',
        'width=600,height=400'
      );
    });

    it('should share to LinkedIn', async () => {
      const { result } = renderHook(() => useSocialSharing());
      
      const sharingOptions = {
        title: 'Test Poll',
        url: 'https://choices.app/polls/123',
        pollId: '123',
        contentType: 'poll' as const
      };

      await act(async () => {
        const response = await result.current.shareToPlatform('linkedin', sharingOptions);
        expect(response.success).toBe(true);
        expect(response.platform).toBe('linkedin');
      });

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('linkedin.com/sharing'),
        '_blank',
        'width=600,height=400'
      );
    });

    it('should share via email', async () => {
      const { result } = renderHook(() => useSocialSharing());
      
      const sharingOptions = {
        title: 'Test Poll',
        description: 'Check out this poll!',
        url: 'https://choices.app/polls/123',
        pollId: '123',
        contentType: 'poll' as const
      };

      await act(async () => {
        const response = await result.current.shareToPlatform('email', sharingOptions);
        expect(response.success).toBe(true);
        expect(response.platform).toBe('email');
      });

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('mailto:'),
        '_blank',
        'width=600,height=400'
      );
    });

    it('should handle unsupported platform', async () => {
      const { result } = renderHook(() => useSocialSharing());
      
      const sharingOptions = {
        title: 'Test Poll',
        url: 'https://choices.app/polls/123',
        pollId: '123',
        contentType: 'poll' as const
      };

      await act(async () => {
        const response = await result.current.shareToPlatform('unsupported' as any, sharingOptions);
        expect(response.success).toBe(false);
        expect(response.error).toContain('Unsupported platform');
      });
    });
  });

  describe('Native sharing', () => {
    it('should use native sharing when available', async () => {
      const mockShare = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
      });

      const { result } = renderHook(() => useSocialSharing());
      
      const sharingOptions = {
        title: 'Test Poll',
        description: 'Check out this poll!',
        url: 'https://choices.app/polls/123',
        pollId: '123',
        contentType: 'poll' as const
      };

      await act(async () => {
        const response = await result.current.shareNative(sharingOptions);
        expect(response.success).toBe(true);
        expect(response.platform).toBe('native');
      });

      expect(mockShare).toHaveBeenCalledWith({
        title: 'Test Poll',
        text: 'Check out this poll!',
        url: 'https://choices.app/polls/123'
      });
    });

    it('should handle native sharing rejection', async () => {
      const mockShare = jest.fn().mockRejectedValue(new Error('User cancelled'));
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
      });

      const { result } = renderHook(() => useSocialSharing());
      
      const sharingOptions = {
        title: 'Test Poll',
        url: 'https://choices.app/polls/123',
        pollId: '123',
        contentType: 'poll' as const
      };

      await act(async () => {
        const response = await result.current.shareNative(sharingOptions);
        expect(response.success).toBe(false);
        expect(response.error).toContain('User cancelled');
      });
    });

    it('should handle missing native sharing', async () => {
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        writable: true,
      });

      const { result } = renderHook(() => useSocialSharing());
      
      const sharingOptions = {
        title: 'Test Poll',
        url: 'https://choices.app/polls/123',
        pollId: '123',
        contentType: 'poll' as const
      };

      await act(async () => {
        const response = await result.current.shareNative(sharingOptions);
        expect(response.success).toBe(false);
        expect(response.error).toContain('Native sharing not supported');
      });
    });
  });

  describe('Clipboard sharing', () => {
    it('should copy to clipboard', async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      });

      const { result } = renderHook(() => useSocialSharing());
      
      const sharingOptions = {
        title: 'Test Poll',
        url: 'https://choices.app/polls/123',
        pollId: '123',
        contentType: 'poll' as const
      };

      await act(async () => {
        const response = await result.current.copyToClipboard(sharingOptions);
        expect(response.success).toBe(true);
        expect(response.platform).toBe('clipboard');
      });

      expect(mockWriteText).toHaveBeenCalledWith('https://choices.app/polls/123');
    });

    it('should handle clipboard errors', async () => {
      const mockWriteText = jest.fn().mockRejectedValue(new Error('Clipboard access denied'));
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      });

      const { result } = renderHook(() => useSocialSharing());
      
      const sharingOptions = {
        title: 'Test Poll',
        url: 'https://choices.app/polls/123',
        pollId: '123',
        contentType: 'poll' as const
      };

      await act(async () => {
        const response = await result.current.copyToClipboard(sharingOptions);
        expect(response.success).toBe(false);
        expect(response.error).toContain('Clipboard access denied');
      });
    });
  });

  describe('Analytics tracking', () => {
    it('should track share events', async () => {
      const { result } = renderHook(() => useSocialSharing());
      
      const sharingOptions = {
        title: 'Test Poll',
        url: 'https://choices.app/polls/123',
        pollId: '123',
        contentType: 'poll' as const,
        placement: 'feed'
      };

      await act(async () => {
        await result.current.shareToPlatform('twitter', sharingOptions);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: 'twitter',
          poll_id: '123',
          placement: 'feed',
          content_type: 'poll',
        }),
      });
    });

    it('should handle analytics errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSocialSharing());
      
      const sharingOptions = {
        title: 'Test Poll',
        url: 'https://choices.app/polls/123',
        pollId: '123',
        contentType: 'poll' as const
      };

      await act(async () => {
        const response = await result.current.shareToPlatform('twitter', sharingOptions);
        // Should still succeed even if analytics fails
        expect(response.success).toBe(true);
      });
    });
  });

  describe('Error handling', () => {
    it('should clear errors', () => {
      const { result } = renderHook(() => useSocialSharing());
      
      act(() => {
        result.current.clearError();
      });

      expect(result.current.shareError).toBe(null);
    });

    it('should handle sharing when disabled', async () => {
      // Mock feature flag as disabled for this test
      const { isFeatureEnabled } = require('@/lib/core/feature-flags');
      isFeatureEnabled.mockReturnValue(false);

      const { result } = renderHook(() => useSocialSharing());
      
      const sharingOptions = {
        title: 'Test Poll',
        url: 'https://choices.app/polls/123',
        pollId: '123',
        contentType: 'poll' as const
      };

      await act(async () => {
        const response = await result.current.shareToPlatform('twitter', sharingOptions);
        expect(response.success).toBe(false);
        expect(response.error).toContain('Social sharing is disabled');
      });

      // Reset mock
      isFeatureEnabled.mockReturnValue(true);
    });
  });

  describe('Loading states', () => {
    it('should track loading state during sharing', async () => {
      const { result } = renderHook(() => useSocialSharing());
      
      expect(result.current.isSharing).toBe(false);

      const sharingOptions = {
        title: 'Test Poll',
        url: 'https://choices.app/polls/123',
        pollId: '123',
        contentType: 'poll' as const
      };

      // Mock fetch to return a delayed promise
      let resolveFetch: (value: any) => void;
      const fetchPromise = new Promise(resolve => {
        resolveFetch = resolve;
      });
      (global.fetch as jest.Mock).mockReturnValue(fetchPromise);

      // Start sharing
      let sharePromise: Promise<any>;
      await act(async () => {
        sharePromise = result.current.shareToPlatform('twitter', sharingOptions);
      });
      
      // Check loading state during sharing (before fetch resolves)
      expect(result.current.isSharing).toBe(true);
      
      // Resolve the fetch promise
      resolveFetch!({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
      
      // Wait for sharing to complete
      await act(async () => {
        await sharePromise;
      });

      // Check loading state after sharing
      expect(result.current.isSharing).toBe(false);
    });
  });
});
