/**
 * Dynamic Open Graph Image Generation for Polls
 * 
 * Generates shareable images for social media platforms.
 * Optimized for WhatsApp (<300KB) and other platforms.
 */

import { ImageResponse } from 'next/og'
import { isFeatureEnabled } from '@/lib/core/feature-flags'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Mock poll data - replace with actual API call
async function getPollForOg(id: string) {
  // TODO: Replace with actual API call
  return {
    id,
    title: 'What should be our top priority for climate action?',
    topOptions: [
      { label: 'Renewable Energy', pct: 45 },
      { label: 'Carbon Tax', pct: 30 },
      { label: 'Green Jobs', pct: 20 },
      { label: 'Other', pct: 5 }
    ],
    totalVotes: 1247,
    isActive: true
  }
}

export default async function Image({ params }: { params: { id: string } }) {
  // Feature flag check - return placeholder if disabled
  if (!isFeatureEnabled('SOCIAL_SHARING_OG')) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0b1020 0%, #151c3b 100%)',
            color: '#fff',
            fontSize: 48,
            fontWeight: 800
          }}
        >
          Choices - Social Sharing Disabled
        </div>
      ),
      { ...size }
    )
  }

  try {
    const poll = await getPollForOg(params.id)
    const bars = poll.topOptions.slice(0, 3)

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: 48,
            background: 'linear-gradient(135deg, #0b1020 0%, #151c3b 100%)',
            color: '#fff',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          {/* Header */}
          <div style={{ 
            fontSize: 32, 
            opacity: 0.8,
            marginBottom: 16
          }}>
            Choices
          </div>

          {/* Poll Title */}
          <div style={{ 
            fontSize: 56, 
            fontWeight: 800, 
            lineHeight: 1.1, 
            marginBottom: 32,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {poll.title}
          </div>

          {/* Poll Results */}
          <div style={{ 
            marginTop: 28, 
            display: 'flex', 
            gap: 20, 
            flexDirection: 'column',
            flex: 1
          }}>
            {bars.map((option, index) => (
              <div key={option.label} style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <div style={{ 
                  fontSize: 28,
                  fontWeight: 600,
                  opacity: 0.9
                }}>
                  {option.label}
                </div>
                <div style={{ 
                  width: 800, 
                  height: 26, 
                  background: '#2b335c', 
                  borderRadius: 16,
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${Math.max(2, Math.min(100, option.pct))}%`,
                    height: '100%',
                    borderRadius: 16,
                    background: index === 0 ? '#7aa6ff' : index === 1 ? '#ff6b6b' : '#4ecdc4',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ 
                  fontSize: 24,
                  opacity: 0.9,
                  fontWeight: 600
                }}>
                  {option.pct}%
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ 
            marginTop: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 24,
            opacity: 0.85
          }}>
            <div>
              {poll.isActive ? 'Tap to vote' : 'View results'} • choices.app
            </div>
            <div style={{ 
              fontSize: 20,
              opacity: 0.7
            }}>
              {poll.totalVotes.toLocaleString()} votes
            </div>
          </div>
        </div>
      ),
      { 
        ...size,
        // Optimize for WhatsApp (<300KB)
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        }
      }
    )
  } catch (error) {
    // Fallback image on error
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0b1020 0%, #151c3b 100%)',
            color: '#fff',
            fontSize: 48,
            fontWeight: 800
          }}
        >
          Error loading poll
        </div>
      ),
      { ...size }
    )
  }
}
