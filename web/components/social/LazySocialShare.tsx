/**
 * Lazy Social Share Wrapper
 * 
 * Provides lazy loading for all social sharing components.
 * Returns null when features are disabled (zero bundle impact).
 */

'use client'

import { lazy, Suspense } from 'react'
import { isFeatureEnabled } from '@/lib/core/feature-flags'

// Lazy load social components only when features are enabled
const EnhancedPollShare = lazy(() => import('./EnhancedPollShare'))

type LazySocialShareProps = {
  type: 'poll'
  pollId?: string
  poll?: any
  placement?: string
  [key: string]: any
}

export function LazySocialShare({ type, ...props }: LazySocialShareProps) {
  // Master feature flag check - return null if disabled (zero bundle impact)
  if (!isFeatureEnabled('SOCIAL_SHARING')) {
    return null
  }

  // Type-specific feature flag checks
  const isPollSharingEnabled = isFeatureEnabled('SOCIAL_SHARING_POLLS')

  // Return null if specific feature is disabled
  if (type === 'poll' && !isPollSharingEnabled) return null

  return (
    <Suspense fallback={
      <div className="bg-white rounded-lg border p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    }>
      {type === 'poll' && <EnhancedPollShare {...props} />}
    </Suspense>
  )
}

// Convenience exports for specific types
export const LazyPollShare = (props: Omit<LazySocialShareProps, 'type'>) => (
  <LazySocialShare type="poll" {...props} />
)
