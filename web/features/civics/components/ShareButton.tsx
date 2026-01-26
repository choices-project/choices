'use client';

import { Share2, Copy, Twitter, Facebook, Linkedin, Mail, Instagram } from 'lucide-react';
import React, { useCallback, useState } from 'react';

import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { devLog } from '@/lib/utils/logger';
import { useNotificationActions } from '@/lib/stores';

import { Button } from '@/components/ui/button';

type ShareButtonProps = {
  contentId: string;
  contentType: 'representative' | 'bill' | 'civic_action' | 'poll';
  title: string;
  description?: string;
  url: string;
  placement?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
};

/**
 * ShareButton Component
 *
 * Reusable sharing component for civics content (representatives, bills, civic actions).
 * Tracks sharing events to analytics_events table.
 *
 * Created: January 26, 2026
 * Status: ✅ ACTIVE
 */
export default function ShareButton({
  contentId,
  contentType,
  title,
  description,
  url,
  placement = 'civics_share_button',
  className = '',
  variant = 'outline',
  size = 'default',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const socialSharingEnabled = isFeatureEnabled('SOCIAL_SHARING');
  const notificationActions = useNotificationActions();

  const trackShare = useCallback(
    async (platform: string, placement: string) => {
      if (!socialSharingEnabled) return;

      try {
        await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform,
            poll_id: contentId, // API expects poll_id but we use it for any content
            placement,
            content_type: contentType,
          }),
        });
      } catch (error) {
        devLog('Failed to track share event', { error, platform, placement });
      }
    },
    [contentId, contentType, socialSharingEnabled],
  );

  const handleCopyLink = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        void trackShare('copy', placement);
      }
    } catch (error) {
      devLog('Failed to copy link:', { error });
    }
  }, [url, placement, trackShare]);

  const handleSocialShare = useCallback(
    async (platform: string) => {
      if (!socialSharingEnabled) return;

      const encodedUrl = encodeURIComponent(url);
      const encodedTitle = encodeURIComponent(title);
      const encodedDescription = description ? encodeURIComponent(description) : '';

      if (platform === 'instagram') {
        // Instagram doesn't support direct web sharing to stories/posts
        // Best approach: Copy link and show helpful notification
        try {
          if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
            
            // Show helpful notification
            notificationActions.addNotification({
              type: 'success',
              title: 'Link copied!',
              message: 'Open Instagram and paste the link in your story or post.',
              duration: 5000,
              source: 'system',
            });
          }
        } catch (error) {
          devLog('Failed to copy link for Instagram:', { error });
          notificationActions.addNotification({
            type: 'error',
            title: 'Failed to copy link',
            message: 'Please copy the link manually.',
            duration: 3000,
            source: 'system',
          });
        }
        void trackShare(platform, placement);
        return;
      }

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
        case 'email':
          shareUrl = `mailto:?subject=${encodedTitle}&body=${encodedDescription ? `${encodedDescription}%0A%0A` : ''}${encodedUrl}`;
          break;
      }

      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
        void trackShare(platform, placement);
      }
    },
    [socialSharingEnabled, url, title, description, placement, trackShare],
  );

  const handleNativeShare = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url,
        });
        void trackShare('system', placement);
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          devLog('Error sharing:', { error });
        }
      }
    }
  }, [title, description, url, placement, trackShare]);

  // Native share button (mobile)
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => void handleNativeShare()}
        className={className}
        aria-label="Share"
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>
    );
  }

  // Desktop: Show dropdown or individual buttons
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant={variant}
        size={size}
        onClick={() => void handleCopyLink()}
        aria-label={copied ? 'Copied!' : 'Copy link'}
      >
        <Copy className="h-4 w-4 mr-2" />
        {copied ? 'Copied!' : 'Copy'}
      </Button>

      {socialSharingEnabled && (
        <>
          <Button
            variant={variant}
            size={size}
            onClick={() => handleSocialShare('twitter')}
            aria-label="Share on Twitter"
          >
            <Twitter className="h-4 w-4" />
          </Button>
          <Button
            variant={variant}
            size={size}
            onClick={() => handleSocialShare('facebook')}
            aria-label="Share on Facebook"
          >
            <Facebook className="h-4 w-4" />
          </Button>
          <Button
            variant={variant}
            size={size}
            onClick={() => handleSocialShare('linkedin')}
            aria-label="Share on LinkedIn"
          >
            <Linkedin className="h-4 w-4" />
          </Button>
          <Button
            variant={variant}
            size={size}
            onClick={() => handleSocialShare('email')}
            aria-label="Share via email"
          >
            <Mail className="h-4 w-4" />
          </Button>
          <Button
            variant={variant}
            size={size}
            onClick={() => handleSocialShare('instagram')}
            aria-label="Share on Instagram"
          >
            <Instagram className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}
