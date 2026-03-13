'use client'

import { Share2, Copy, Link, Twitter, Facebook, Linkedin, Mail, Instagram, QrCode, Download } from 'lucide-react'
import Image from 'next/image'
import QRCode from 'qrcode'
import React, { useState, useEffect, useCallback } from 'react';

import { BottomSheet } from '@/components/shared/BottomSheet';
import { Button } from '@/components/ui/button'

import { isFeatureEnabled } from '@/lib/core/feature-flags'
import { haptic } from '@/lib/haptics';
import { useNotificationActions } from '@/lib/stores';
import { devLog } from '@/lib/utils/logger';

import { useI18n } from '@/hooks/useI18n';

type PollShareProps = {
  pollId: string
  poll?: {
    title: string;
    description?: string;
  }
}

export default function PollShare({ pollId, poll }: PollShareProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showMobileSheet, setShowMobileSheet] = useState(false)
  const notificationActions = useNotificationActions();
  const [pollUrl, setPollUrl] = useState('')
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')

  useEffect(() => {
    // Use SSR-safe browser API access
    const initUrl = async () => {
      const { safeWindow } = await import('@/lib/utils/ssr-safe');
      const origin = safeWindow(w => w.location?.origin, '');
      const url = `${origin}/polls/${pollId}`;
      setPollUrl(url);

      // Generate QR code
      try {
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 192,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeDataUrl(qrDataUrl);
      } catch (error) {
        devLog('Failed to generate QR code:', { error });
      }
    };
    void initUrl();
  }, [pollId]);
  const pollTitle = poll?.title ?? t('polls.share.defaultTitle')
  const socialSharingEnabled = isFeatureEnabled('SOCIAL_SHARING_POLLS')

  const trackShare = useCallback(async (platform: string, placement: string) => {
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          poll_id: pollId,
          placement,
          content_type: 'poll'
        })
      });
      if (!res.ok) throw new Error('Failed to share');
    } catch (error) {
      devLog('Failed to track share event', { error, platform, placement });
      notificationActions.addNotification({
        type: 'error',
        title: 'Share failed',
        message: 'Failed to share poll. Please try again.',
        source: 'system',
      });
    }
  }, [pollId, notificationActions])

  const handleCopyLink = useCallback(async () => {
    try {
      const { safeNavigator } = await import('@/lib/utils/ssr-safe');
      const clipboard = safeNavigator(n => n.clipboard);
      if (clipboard?.writeText) {
        await clipboard.writeText(pollUrl);
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      void trackShare('copy', 'poll_share_direct_link');
    } catch (error) {
      devLog('Failed to copy link:', { error })
    }
  }, [pollUrl, trackShare])

  const handleDownloadQR = useCallback(async () => {
    if (!qrCodeDataUrl) {
      devLog('QR code not available for download', {})
      return
    }

    try {
      const { safeDocument } = await import('@/lib/utils/ssr-safe');
      const link = safeDocument(d => d.createElement?.('a')) as HTMLAnchorElement;
      if (!link) {
        devLog('Link element not available')
        return
      }

      link.href = qrCodeDataUrl
      link.download = `poll-${pollId}-qr-code.png`
      link.click()
    } catch (error) {
      devLog('Failed to download QR code:', { error })
    }
  }, [qrCodeDataUrl, pollId])

  const handleNativeShare = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: pollTitle,
          text: t('polls.share.nativeShareText'),
          url: pollUrl
        })
        void trackShare('system', 'poll_share_native');
      } catch (error) {
        devLog('Error sharing:', { error })
      }
    }
  }, [pollTitle, pollUrl, t, trackShare])

  const handleSocialShare = useCallback(async (platform: string) => {
    if (!socialSharingEnabled) return

    if (platform === 'instagram') {
      // Instagram doesn't support direct web sharing to stories/posts
      // Best approach: Copy link and show helpful notification
      try {
        const { safeNavigator } = await import('@/lib/utils/ssr-safe');
        const clipboard = safeNavigator(n => n.clipboard);
        if (clipboard?.writeText) {
          await clipboard.writeText(pollUrl);
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
      void trackShare(platform, 'poll_share_social');
      return;
    }

    const encodedUrl = encodeURIComponent(pollUrl)
    const encodedTitle = encodeURIComponent(pollTitle)

    let shareUrl = ''
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        break
      case 'email':
        shareUrl = `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(t('polls.share.emailBody', { url: pollUrl }))}`
        break
    }

    if (shareUrl) {
      window.open(shareUrl, 'blank', 'width=600,height=400')
      void trackShare(platform, 'poll_share_social');
    }
  }, [socialSharingEnabled, pollUrl, pollTitle, t, trackShare, notificationActions])

  const shareButtons = (
    <div className="grid grid-cols-2 gap-3">
      <Button
        onClick={() => { void handleCopyLink(); haptic('light'); }}
        variant="outline"
        className="flex items-center justify-center gap-2 min-h-[44px]"
      >
        <Copy className="w-4 h-4" />
        <span>{copied ? t('polls.share.copied') : t('polls.share.copy')}</span>
      </Button>
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <Button
          onClick={() => { void handleNativeShare(); haptic('light'); }}
          className="flex items-center justify-center gap-2 min-h-[44px] bg-green-600 hover:bg-green-700 text-white"
        >
          <Share2 className="w-4 h-4" />
          <span>{t('polls.share.nativeShare')}</span>
        </Button>
      )}
      {socialSharingEnabled && (
        <>
          <Button onClick={() => handleSocialShare('twitter')} className="flex items-center justify-center gap-2 min-h-[44px] bg-primary hover:bg-primary/90 text-primary-foreground">
            <Twitter className="w-4 h-4" />
            <span className="text-sm">{t('polls.share.social.twitter')}</span>
          </Button>
          <Button onClick={() => handleSocialShare('facebook')} className="flex items-center justify-center gap-2 min-h-[44px] bg-primary hover:bg-primary/90 text-primary-foreground">
            <Facebook className="w-4 h-4" />
            <span className="text-sm">{t('polls.share.social.facebook')}</span>
          </Button>
          <Button onClick={() => handleSocialShare('email')} className="flex items-center justify-center gap-2 min-h-[44px] bg-gray-600 hover:bg-gray-700 text-white">
            <Mail className="w-4 h-4" />
            <span className="text-sm">{t('polls.share.social.email')}</span>
          </Button>
          <Button onClick={() => handleSocialShare('instagram')} className="flex items-center justify-center gap-2 min-h-[44px] bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
            <Instagram className="w-4 h-4" />
            <span className="text-sm">Instagram</span>
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Mobile: Share trigger button that opens BottomSheet */}
      <div className="md:hidden">
        <Button
          onClick={() => { setShowMobileSheet(true); haptic('light'); }}
          className="w-full flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          <span>{t('polls.share.title')}</span>
        </Button>
        <BottomSheet
          open={showMobileSheet}
          onClose={() => setShowMobileSheet(false)}
          title={t('polls.share.title')}
        >
          <div className="space-y-4">
            {shareButtons}
          </div>
        </BottomSheet>
      </div>

      {/* Desktop: Inline share options */}
      <div className="hidden md:block bg-card rounded-xl shadow-sm border border-border p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4">{t('polls.share.title')}</h3>

        {/* Direct Link */}
        <div className="mb-6">
          <label htmlFor="poll-share-url-input" className="block text-sm font-medium text-foreground/80 mb-2">
            {t('polls.share.directLink.label')}
          </label>
          <div className="flex">
            <input
              id="poll-share-url-input"
              type="text"
              value={pollUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-border rounded-l-lg bg-muted text-foreground"
              aria-label={t('polls.share.directLink.label')}
            />
            <Button
              onClick={() => void handleCopyLink()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-r-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>{copied ? t('polls.share.copied') : t('polls.share.copy')}</span>
            </Button>
          </div>
        </div>

        {/* Social Media Buttons - Only show when social sharing is enabled */}
        {socialSharingEnabled && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={() => handleSocialShare('twitter')}
              className="flex items-center justify-center space-x-2 p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Twitter className="w-5 h-5" />
              <span className="text-sm font-medium">{t('polls.share.social.twitter')}</span>
            </Button>

            <Button
              onClick={() => handleSocialShare('facebook')}
              className="flex items-center justify-center space-x-2 p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Facebook className="w-5 h-5" />
              <span className="text-sm font-medium">{t('polls.share.social.facebook')}</span>
            </Button>

            <Button
              onClick={() => handleSocialShare('linkedin')}
              className="flex items-center justify-center space-x-2 p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Linkedin className="w-5 h-5" />
              <span className="text-sm font-medium">{t('polls.share.social.linkedin')}</span>
            </Button>

            <Button
              onClick={() => handleSocialShare('email')}
              className="flex items-center justify-center space-x-2 p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Mail className="w-5 h-5" />
              <span className="text-sm font-medium">{t('polls.share.social.email')}</span>
            </Button>

            <Button
              onClick={() => handleSocialShare('instagram')}
              className="flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
            >
              <Instagram className="w-5 h-5" />
              <span className="text-sm font-medium">Instagram</span>
            </Button>
          </div>
        )}

        {/* Native Share (Mobile) */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <div className="mt-4">
            <Button
              onClick={() => void handleNativeShare()}
              className="w-full flex items-center justify-center space-x-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span className="font-medium">{t('polls.share.nativeShare')}</span>
            </Button>
          </div>
        )}
      </div>

      {/* QR Code */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">{t('polls.share.qrCode.title')}</h3>
          <Button
            variant="ghost"
            onClick={() => setShowQR(!showQR)}
            className="flex items-center space-x-2 text-primary hover:text-primary/90 transition-colors"
          >
            <QrCode className="w-5 h-5" />
            <span className="text-sm font-medium">{showQR ? t('polls.share.qrCode.hide') : t('polls.share.qrCode.show')}</span>
          </Button>
        </div>

        {showQR && (
          <div className="text-center">
            <div className="inline-block p-4 bg-muted rounded-lg">
                <div className="w-48 h-48 bg-card border-2 border-border rounded-lg flex items-center justify-center">
                {qrCodeDataUrl ? (
                  <Image
                    src={qrCodeDataUrl}
                    alt={t('polls.share.qrCode.alt')}
                    width={192}
                    height={192}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <QrCode className="w-16 h-16 mx-auto mb-2" />
                    <p className="text-sm">{t('polls.share.qrCode.generating')}</p>
                  </div>
                )}
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('polls.share.qrCode.scanHint')}
            </p>
            <div className="mt-4 flex justify-center space-x-3">
              <Button
                onClick={() => void handleDownloadQR()}
                className="flex items-center space-x-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                <span>{t('polls.share.qrCode.download')}</span>
              </Button>
              <Button
                onClick={handleCopyLink}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                <Link className="w-4 h-4" />
                <span>{t('polls.share.qrCode.copyLink')}</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Embed Options (desktop only) */}
      <div className="hidden md:block bg-card rounded-xl shadow-sm border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">{t('polls.share.embed.title')}</h3>

        <div className="space-y-3">
          <div>
            <label htmlFor="embed-code-textarea" className="block text-sm font-medium text-foreground/80 mb-2">
              {t('polls.share.embed.codeLabel')}
            </label>
            <textarea
              id="embed-code-textarea"
              readOnly
              value={`<iframe src="${pollUrl}/embed" width="100%" height="600" frameborder="0"></iframe>`}
              className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-foreground text-sm font-mono"
              rows={3}
              aria-label={t('polls.share.embed.codeLabel')}
            />
          </div>

          <Button
            onClick={() => {
              void navigator.clipboard.writeText(`<iframe src="${pollUrl}/embed" width="100%" height="600" frameborder="0"></iframe>`)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>{copied ? t('polls.share.copied') : t('polls.share.embed.copyCode')}</span>
          </Button>
        </div>
      </div>

    </div>
  )
}
