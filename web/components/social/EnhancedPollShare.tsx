/**
 * Enhanced Poll Share Component
 * 
 * Feature-flagged social sharing with platform-specific optimization.
 * Uses hardened share URL builder and tracks analytics.
 */

'use client'

import { useState } from 'react'
import { isFeatureEnabled } from '@/lib/core/feature-flags'
import { buildShareUrl, generateShareText, PLATFORM_CONFIG, type SharePlatform } from '@/lib/share'
import { Share2, Copy, X, Facebook, Linkedin, MessageCircle, Mail, Smartphone, Send } from 'lucide-react'

type EnhancedPollShareProps = {
  pollId?: string | undefined
  poll?: {
    title: string
    description?: string
    totalVotes?: number
    isActive?: boolean
    options?: string[]
  } | undefined
  placement?: string | undefined
}

export default function EnhancedPollShare({ pollId, poll, placement = 'poll-page' }: EnhancedPollShareProps) {
  const [copied, setCopied] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  // Feature flag check
  if (!isFeatureEnabled('SOCIAL_SHARING') || !isFeatureEnabled('SOCIAL_SHARING_POLLS')) {
    return null
  }

  // Handle missing pollId
  if (!pollId) {
    return null
  }

  const pollUrl = `${window.location.origin}/p/${pollId}`
  const pollTitle = poll?.title || 'Check out this poll!'
  
  // Generate platform-specific share text
  const baseText = `🗳️ ${pollTitle}`
  const hashtags = ['ChoicesApp', 'VoteNow', 'Democracy']
  const via = 'choicesapp'

  const handleShare = async (platform: SharePlatform) => {
    setIsSharing(true)

    try {
      // Generate share text for platform
      const shareText = generateShareText(platform, baseText, hashtags, via)
      
      // Build share URL
      const shareUrl = buildShareUrl(platform, {
        url: pollUrl,
        text: shareText,
        hashtags: platform === 'x' ? hashtags : [],
        via: platform === 'x' ? via : ''
      })

      // Track share event
      await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          poll_id: pollId,
          placement,
          content_type: 'poll'
        })
      })

      // Handle platform-specific sharing
      if (platform === 'email' || platform === 'sms') {
        // Open native app
        window.location.href = shareUrl
      } else if (platform === 'whatsapp' || platform === 'telegram') {
        // Open in new window
        window.open(shareUrl, '_blank', 'width=600,height=400')
      } else {
        // Standard social platforms
        window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes')
      }

    } catch (error) {
      console.error('Share failed:', error)
    } finally {
      setIsSharing(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pollUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  const handleWebShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: pollTitle,
          text: baseText,
          url: pollUrl
        })
      } catch (error) {
        console.error('Web share failed:', error)
      }
    }
  }

  const platforms: SharePlatform[] = ['x', 'facebook', 'linkedin', 'whatsapp', 'email', 'sms']

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Share2 className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Share this poll</h3>
      </div>

      {/* Web Share API (mobile) */}
      {typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function' && (
        <button
          onClick={handleWebShare}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      )}

      {/* Platform-specific share buttons */}
      <div className="grid grid-cols-2 gap-3">
        {platforms.map((platform) => {
          const config = PLATFORM_CONFIG[platform]
          const IconComponent = getIconComponent(platform)
          
          return (
            <button
              key={platform}
              onClick={() => handleShare(platform)}
              disabled={isSharing}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors disabled:opacity-50"
              aria-label={`Share to ${config.name}`}
            >
              <IconComponent 
                className="h-5 w-5" 
                style={{ color: config.color }}
              />
              <span className="text-sm font-medium">{config.name}</span>
            </button>
          )
        })}
      </div>

      {/* Copy link */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <input
          type="text"
          value={pollUrl}
          readOnly
          className="flex-1 px-3 py-2 border rounded-lg text-sm bg-gray-50"
        />
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          aria-label="Copy link"
        >
          <Copy className="h-4 w-4" />
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Share stats */}
      {poll?.totalVotes && (
        <div className="text-sm text-gray-600 text-center">
          {poll.totalVotes.toLocaleString()} votes • Share to help it grow
        </div>
      )}
    </div>
  )
}

// Icon component mapping
function getIconComponent(platform: SharePlatform) {
  switch (platform) {
    case 'x': return X
    case 'facebook': return Facebook
    case 'linkedin': return Linkedin
    case 'whatsapp': return MessageCircle
    case 'email': return Mail
    case 'sms': return Smartphone
    default: return Share2
  }
}
