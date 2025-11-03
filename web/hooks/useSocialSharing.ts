/**
 * Social Sharing Hook
 * 
 * Complete implementation for social sharing functionality
 * Supports Web Share API, platform-specific sharing, and clipboard fallback
 * 
 * Created: January 26, 2025
 * Status: ✅ IMPLEMENTED
 */

import { useState } from 'react';

export type SocialSharingOptions = {
  title?: string;
  text?: string;
  url?: string;
  hashtags?: string[];
}

type ShareResult = {
  success: boolean;
  platform?: string;
  error?: string;
}

export const useSocialSharing = () => {
  const [isSharing, setIsSharing] = useState(false);

  /**
   * Use Web Share API if available (mobile browsers, PWA)
   */
  const share = async (options: SocialSharingOptions): Promise<ShareResult> => {
    if (!navigator.share) {
      // Fallback to platform-specific sharing
      return { success: false, error: 'Web Share API not supported' };
    }

    setIsSharing(true);
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url,
      });
      setIsSharing(false);
      return { success: true, platform: 'native' };
    } catch (error: unknown) {
      setIsSharing(false);
      // User cancelled sharing - not an error
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Share cancelled' };
      }
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  /**
   * Share to Twitter/X
   */
  const shareToTwitter = (options: SocialSharingOptions): ShareResult => {
    try {
      const { title, text, url, hashtags } = options;
      const tweetText = [title, text].filter(Boolean).join(' - ');
      const hashtagString = hashtags?.length ? ` #${hashtags.join(' #')}` : '';
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText + hashtagString)}&url=${encodeURIComponent(url ?? '')}`;
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
      return { success: true, platform: 'twitter' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error', platform: 'twitter' };
    }
  };

  /**
   * Share to Facebook
   */
  const shareToFacebook = (options: SocialSharingOptions): ShareResult => {
    try {
      const { url } = options;
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url ?? '')}`;
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
      return { success: true, platform: 'facebook' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error', platform: 'facebook' };
    }
  };

  /**
   * Share to LinkedIn
   */
  const shareToLinkedIn = (options: SocialSharingOptions): ShareResult => {
    try {
      const { title, text, url } = options;
      const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url ?? '')}&title=${encodeURIComponent(title ?? '')}&summary=${encodeURIComponent(text ?? '')}`;
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
      return { success: true, platform: 'linkedin' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error', platform: 'linkedin' };
    }
  };

  /**
   * Share to Reddit
   */
  const shareToReddit = (options: SocialSharingOptions): ShareResult => {
    try {
      const { title, url } = options;
      const shareUrl = `https://www.reddit.com/submit?title=${encodeURIComponent(title ?? '')}&url=${encodeURIComponent(url ?? '')}`;
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
      return { success: true, platform: 'reddit' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error', platform: 'reddit' };
    }
  };

  /**
   * Copy text to clipboard
   */
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  };

  /**
   * Share URL to clipboard and return formatted share text
   */
  const shareToClipboard = async (options: SocialSharingOptions): Promise<ShareResult> => {
    const shareText = [options.title, options.text, options.url]
      .filter(Boolean)
      .join('\n\n');
    
    const success = await copyToClipboard(shareText);
    return {
      success,
      platform: 'clipboard',
      error: success ? undefined : 'Failed to copy to clipboard',
    };
  };

  return {
    share,
    shareToTwitter,
    shareToFacebook,
    shareToLinkedIn,
    shareToReddit,
    copyToClipboard,
    shareToClipboard,
    isSharing,
  };
};
