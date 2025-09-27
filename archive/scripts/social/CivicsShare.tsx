/**
 * Civics Share Component
 * 
 * Feature-flagged component for sharing representative information.
 * Returns null when feature is disabled (zero bundle impact).
 */

'use client'

import { useState } from 'react'
import { isFeatureEnabled } from '@/lib/core/feature-flags'
import { buildShareUrl, generateShareText, PLATFORM_CONFIG, type SharePlatform } from '@/lib/share'
import { Share2, Copy, X, Facebook, Linkedin, MessageCircle, Mail, Smartphone } from 'lucide-react'

type CivicsShareProps = {
  representative: {
    name: string
    office: string
    party?: string
    level: 'federal' | 'state' | 'local'
    jurisdiction: string
    district?: string
    contact?: {
      email?: string
      phone?: string
      website?: string
    }
  }
  placement?: string
}

export default function CivicsShare({ representative, placement = 'civics-page' }: CivicsShareProps) {
  const [copied, setCopied] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  // Feature flag check
  if (!isFeatureEnabled('SOCIAL_SHARING') || !isFeatureEnabled('SOCIAL_SHARING_CIVICS')) {
    return null
  }

  const civicsUrl = `${window.location.origin}/civics`
  const repName = representative.name
  const office = representative.office
  
  // Generate platform-specific share text
  const baseText = `🏛️ Meet your representative: ${repName} (${office})`
  const hashtags = ['ChoicesApp', 'KnowYourReps', 'CivicEngagement']
  const via = 'choicesapp'

  const handleShare = async (platform: SharePlatform) => {
    setIsSharing(true)

    try {
      // Generate share text for platform
      const shareText = generateShareText(platform, baseText, hashtags, via)
      
      // Build share URL
      const shareUrl = buildShareUrl(platform, {
        url: civicsUrl,
        text: shareText,
        hashtags: platform === 'x' ? hashtags : undefined,
        via: platform === 'x' ? via : undefined
      })

      // Track share event
      await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          representative_id: representative.name,
          placement,
          content_type: 'civics'
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
      await navigator.clipboard.writeText(civicsUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  const platforms: SharePlatform[] = ['x', 'facebook', 'linkedin', 'whatsapp', 'email', 'sms']

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Share2 className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Share representative info</h3>
      </div>

      {/* Representative info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-lg">{representative.name}</h4>
        <p className="text-gray-600">{representative.office}</p>
        {representative.party && (
          <p className="text-sm text-gray-500">{representative.party}</p>
        )}
        <p className="text-sm text-gray-500">
          {representative.level} • {representative.jurisdiction}
          {representative.district && ` • ${representative.district}`}
        </p>
      </div>

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
          value={civicsUrl}
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

      {/* Contact info */}
      {representative.contact && (
        <div className="text-sm text-gray-600">
          <p>Contact: {representative.contact.email || representative.contact.phone || 'See website'}</p>
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
