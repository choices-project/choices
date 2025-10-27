'use client'

import dynamic from 'next/dynamic'

const PWABackground = dynamic(() => import('@/features/pwa/components/PWABackground'), {
  ssr: false,
  loading: () => null
})

export default function PWABackgroundWrapper() {
  return <PWABackground />
}
