'use client'

import { useState } from 'react'
import { getAvailableProviders } from '@/lib/social-auth-config'
import { OAuthProvider } from '@/types/auth'
import { 
  Chrome, 
  Github, 
  Facebook, 
  Twitter, 
  Linkedin, 
  MessageCircle, 
  Instagram, 
  Video 
} from 'lucide-react'

interface SocialLoginButtonsProps {
  onProviderClick: (provider: OAuthProvider) => Promise<void>
  redirectTo?: string
  isLoading?: boolean
  className?: string
}

const iconMap = {
  Chrome,
  Github,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  Instagram,
  Video
}

export default function SocialLoginButtons({ 
  onProviderClick, 
  isLoading = false,
  className = ''
}: SocialLoginButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null)
  const availableProviders = getAvailableProviders()

  const handleProviderClick = async (provider: OAuthProvider) => {
    if (isLoading || loadingProvider) return
    
    setLoadingProvider(provider)
    try {
      await onProviderClick(provider)
    } finally {
      setLoadingProvider(null)
    }
  }

  if (availableProviders.length === 0) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {availableProviders.map((option) => {
        const IconComponent = iconMap[option.icon as keyof typeof iconMap]
        const isCurrentLoading = loadingProvider === option.provider
        
        return (
          <button
            key={option.provider}
            onClick={() => handleProviderClick(option.provider)}
            disabled={isLoading || isCurrentLoading}
            className={`
              w-full py-2 px-4 rounded-md border transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-3
              ${option.bgColor} ${option.borderColor} ${option.textColor}
              ${option.hoverBgColor} ${option.hoverTextColor}
            `}
          >
            {IconComponent && <IconComponent className="h-4 w-4" />}
            <span className="font-medium">
              {isCurrentLoading ? 'Connecting...' : option.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
