'use client'

import dynamic from 'next/dynamic'
import React from 'react';


const PWABackground = dynamic(() => import('@/features/pwa/components/PWABackground'), {
  ssr: false,
  loading: () => null
})

export default function PWABackgroundWrapper() {
  return <PWABackground />
}
