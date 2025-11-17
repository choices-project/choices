'use client'


import { Share2, Copy, Link, Twitter, Facebook, Linkedin, Mail, QrCode, Download } from 'lucide-react'
import Image from 'next/image'
import QRCode from 'qrcode'
import React, { useState, useEffect } from 'react';

import { useI18n } from '@/hooks/useI18n';
import { isFeatureEnabled } from '@/lib/core/feature-flags'
import { devLog } from '@/lib/utils/logger';

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

  const trackShare = async (platform: string, placement: string) => {
    try {
      await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          poll_id: pollId,
          placement,
          content_type: 'poll'
        })
      });
    } catch (error) {
      devLog('Failed to track share event', { error, platform, placement });
    }
  }

  const handleCopyLink = async () => {
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
  }

  const handleDownloadQR = async () => {
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
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
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
  }

  const handleSocialShare = (platform: string) => {
    if (!socialSharingEnabled) return
    
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
  }

  return (
    <div className="space-y-6">
      {/* Share Options */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('polls.share.title')}</h3>
        
        {/* Direct Link */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('polls.share.directLink.label')}
          </label>
          <div className="flex">
            <input
              type="text"
              value={pollUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-gray-900"
            />
            <button
              onClick={() => void handleCopyLink()}
              className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>{copied ? t('polls.share.copied') : t('polls.share.copy')}</span>
            </button>
          </div>
        </div>

        {/* Social Media Buttons - Only show when social sharing is enabled */}
        {socialSharingEnabled && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => handleSocialShare('twitter')}
              className="flex items-center justify-center space-x-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Twitter className="w-5 h-5" />
              <span className="text-sm font-medium">{t('polls.share.social.twitter')}</span>
            </button>
            
            <button
              onClick={() => handleSocialShare('facebook')}
              className="flex items-center justify-center space-x-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Facebook className="w-5 h-5" />
              <span className="text-sm font-medium">{t('polls.share.social.facebook')}</span>
            </button>
            
            <button
              onClick={() => handleSocialShare('linkedin')}
              className="flex items-center justify-center space-x-2 p-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              <Linkedin className="w-5 h-5" />
              <span className="text-sm font-medium">{t('polls.share.social.linkedin')}</span>
            </button>
            
            <button
              onClick={() => handleSocialShare('email')}
              className="flex items-center justify-center space-x-2 p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Mail className="w-5 h-5" />
              <span className="text-sm font-medium">{t('polls.share.social.email')}</span>
            </button>
          </div>
        )}

        {/* Native Share (Mobile) */}
        {'share' in navigator && (
          <div className="mt-4">
            <button
              onClick={() => void handleNativeShare()}
              className="w-full flex items-center justify-center space-x-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span className="font-medium">{t('polls.share.nativeShare')}</span>
            </button>
          </div>
        )}
      </div>

      {/* QR Code */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('polls.share.qrCode.title')}</h3>
          <button
            onClick={() => setShowQR(!showQR)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <QrCode className="w-5 h-5" />
            <span className="text-sm font-medium">{showQR ? t('polls.share.qrCode.hide') : t('polls.share.qrCode.show')}</span>
          </button>
        </div>
        
        {showQR && (
          <div className="text-center">
            <div className="inline-block p-4 bg-gray-100 rounded-lg">
              <div className="w-48 h-48 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                {qrCodeDataUrl ? (
                  <Image 
                    src={qrCodeDataUrl} 
                    alt={t('polls.share.qrCode.alt')} 
                    width={192}
                    height={192}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <QrCode className="w-16 h-16 mx-auto mb-2" />
                    <p className="text-sm">{t('polls.share.qrCode.generating')}</p>
                  </div>
                )}
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {t('polls.share.qrCode.scanHint')}
            </p>
            <div className="mt-4 flex justify-center space-x-3">
              <button
                onClick={() => void handleDownloadQR()}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                <span>{t('polls.share.qrCode.download')}</span>
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                <Link className="w-4 h-4" />
                <span>{t('polls.share.qrCode.copyLink')}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Embed Options */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('polls.share.embed.title')}</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('polls.share.embed.codeLabel')}
            </label>
            <textarea
              readOnly
              value={`<iframe src="${pollUrl}/embed" width="100%" height="600" frameborder="0"></iframe>`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-sm font-mono"
              rows={3}
            />
          </div>
          
          <button
            onClick={() => {
              void navigator.clipboard.writeText(`<iframe src="${pollUrl}/embed" width="100%" height="600" frameborder="0"></iframe>`)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>{copied ? t('polls.share.copied') : t('polls.share.embed.copyCode')}</span>
          </button>
        </div>
      </div>

    </div>
  )
}
