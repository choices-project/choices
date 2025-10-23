/**
 * Social Sharing Hook
 * 
 * Unified social sharing functionality that can be used across all components.
 * Integrates with the existing PollShare component logic and provides
 * consistent sharing experience across the platform.
 * 
 * Created: January 23, 2025
 * Status: ✅ ACTIVE
 */

import { useState, useCallback, useMemo } from 'react';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { devLog } from '@/lib/utils/logger';

export interface SocialSharingOptions {
  title: string;
  description?: string;
  url: string;
  pollId?: string;
  contentType?: 'poll' | 'representative' | 'feed';
  placement?: string;
}

export interface SocialSharingResult {
  success: boolean;
  platform?: string;
  error?: string;
}

export function useSocialSharing() {
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const socialSharingEnabled = useMemo(() => isFeatureEnabled('SOCIAL_SHARING_POLLS'), []);

  const trackShareEvent = useCallback(async (platform: string, options: SocialSharingOptions) => {
    try {
      // Track share event for analytics
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          poll_id: options.pollId,
          placement: options.placement || 'feed',
          content_type: options.contentType || 'poll',
        }),
      });

      if (!response.ok) {
        devLog('Failed to track share event:', { platform, options });
      }
    } catch (error) {
      devLog('Error tracking share event:', { error, platform, options });
    }
  }, []);

  const shareToPlatform = useCallback(async (platform: string, options: SocialSharingOptions): Promise<SocialSharingResult> => {
    if (!socialSharingEnabled) {
      return { success: false, error: 'Social sharing is disabled' };
    }

    setIsSharing(true);
    setShareError(null);

    try {
      const encodedUrl = encodeURIComponent(options.url);
      const encodedTitle = encodeURIComponent(options.title);
      const encodedDescription = encodeURIComponent(options.description || '');

      let shareUrl = '';
      
      switch (platform) {
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
          break;
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
          break;
        case 'linkedin':
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
          break;
        case 'reddit':
          shareUrl = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
          break;
        case 'whatsapp':
          const whatsappMessage = `${options.title} - ${options.url}`;
          shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;
          break;
        case 'telegram':
          shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
          break;
        case 'email':
          shareUrl = `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${options.url}`;
          break;
        case 'sms':
          const smsMessage = `${options.title} - ${options.url}`;
          shareUrl = `sms:?body=${encodeURIComponent(smsMessage)}`;
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      // Open share URL
      window.open(shareUrl, '_blank', 'width=600,height=400');

      // Track the share event
      await trackShareEvent(platform, options);

      return { success: true, platform };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to share';
      setShareError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSharing(false);
    }
  }, [socialSharingEnabled, trackShareEvent]);

  const shareNative = useCallback(async (options: SocialSharingOptions): Promise<SocialSharingResult> => {
    if (typeof navigator === 'undefined' || !navigator.share) {
      return { success: false, error: 'Native sharing not supported' };
    }

    setIsSharing(true);
    setShareError(null);

    try {
      await navigator.share({
        title: options.title,
        text: options.description || '',
        url: options.url,
      });

      // Track native share event
      await trackShareEvent('native', options);

      return { success: true, platform: 'native' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to share';
      setShareError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSharing(false);
    }
  }, [trackShareEvent]);

  const copyToClipboard = useCallback(async (options: SocialSharingOptions): Promise<SocialSharingResult> => {
    setIsSharing(true);
    setShareError(null);

    try {
      await navigator.clipboard.writeText(options.url);
      
      // Track clipboard share event
      await trackShareEvent('clipboard', options);

      return { success: true, platform: 'clipboard' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to copy to clipboard';
      setShareError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSharing(false);
    }
  }, [trackShareEvent]);

  const clearError = useCallback(() => {
    setShareError(null);
  }, []);

  return {
    isSharing,
    shareError,
    socialSharingEnabled,
    shareToPlatform,
    shareNative,
    copyToClipboard,
    clearError,
  };
}
