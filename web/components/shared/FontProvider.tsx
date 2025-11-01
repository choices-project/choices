 'use client'

import React, { useEffect } from 'react';

type FontProviderProps = {
  children: React.ReactNode
}

export default function FontProvider({ children }: FontProviderProps) {
  useEffect(() => {
    // Apply Inter font via CSS class on client side
    document.body.className = 'font-inter'
    
    // Load Inter font from Google Fonts
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }, [])

  return <>{children}</>
}
