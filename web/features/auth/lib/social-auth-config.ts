import type { SocialLoginOption } from '@/lib/core/types'

export const socialLoginOptions: SocialLoginOption[] = [
  {
    provider: 'google',
    label: 'Continue with Google',
    description: 'Sign in with your Google account',
    icon: 'Chrome',
    color: '#4285F4',
    bgColor: 'bg-white',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-900',
    hoverBgColor: 'hover:bg-gray-50',
    hoverTextColor: 'hover:text-gray-900'
  },
  {
    provider: 'github',
    label: 'Continue with GitHub',
    description: 'Sign in with your GitHub account',
    icon: 'Github',
    color: '#24292E',
    bgColor: 'bg-gray-900',
    borderColor: 'border-gray-900',
    textColor: 'text-white',
    hoverBgColor: 'hover:bg-gray-800',
    hoverTextColor: 'hover:text-white'
  },
  {
    provider: 'apple',
    label: 'Continue with Apple',
    description: 'Sign in with your Apple ID',
    icon: 'Apple',
    color: '#000000',
    bgColor: 'bg-black',
    borderColor: 'border-black',
    textColor: 'text-white',
    hoverBgColor: 'hover:bg-gray-900',
    hoverTextColor: 'hover:text-white'
  },
  {
    provider: 'facebook',
    label: 'Continue with Facebook',
    description: 'Sign in with your Facebook account',
    icon: 'Facebook',
    color: '#1877F2',
    bgColor: 'bg-blue-600',
    borderColor: 'border-blue-600',
    textColor: 'text-white',
    hoverBgColor: 'hover:bg-blue-700',
    hoverTextColor: 'hover:text-white'
  },
  {
    provider: 'twitter',
    label: 'Continue with X (Twitter)',
    description: 'Sign in with your X (Twitter) account',
    icon: 'Twitter',
    color: '#1DA1F2',
    bgColor: 'bg-sky-500',
    borderColor: 'border-sky-500',
    textColor: 'text-white',
    hoverBgColor: 'hover:bg-sky-600',
    hoverTextColor: 'hover:text-white'
  },
  {
    provider: 'linkedin',
    label: 'Continue with LinkedIn',
    description: 'Sign in with your LinkedIn account',
    icon: 'Linkedin',
    color: '#0A66C2',
    bgColor: 'bg-blue-700',
    borderColor: 'border-blue-700',
    textColor: 'text-white',
    hoverBgColor: 'hover:bg-blue-800',
    hoverTextColor: 'hover:text-white'
  },
  {
    provider: 'discord',
    label: 'Continue with Discord',
    description: 'Sign in with your Discord account',
    icon: 'MessageCircle',
    color: '#5865F2',
    bgColor: 'bg-indigo-600',
    borderColor: 'border-indigo-600',
    textColor: 'text-white',
    hoverBgColor: 'hover:bg-indigo-700',
    hoverTextColor: 'hover:text-white'
  },
  {
    provider: 'instagram',
    label: 'Continue with Instagram',
    description: 'Sign in with your Instagram account',
    icon: 'Instagram',
    color: '#E4405F',
    bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
    borderColor: 'border-purple-500',
    textColor: 'text-white',
    hoverBgColor: 'hover:from-purple-600 hover:to-pink-600',
    hoverTextColor: 'hover:text-white'
  },
  {
    provider: 'tiktok',
    label: 'Continue with TikTok',
    description: 'Sign in with your TikTok account',
    icon: 'Video',
    color: '#000000',
    bgColor: 'bg-black',
    borderColor: 'border-black',
    textColor: 'text-white',
    hoverBgColor: 'hover:bg-gray-900',
    hoverTextColor: 'hover:text-white'
  }
]

export const getSocialLoginOption = (provider: string): SocialLoginOption | undefined => {
  return socialLoginOptions.find(option => option.provider === provider)
}

export const getAvailableProviders = (): SocialLoginOption[] => {
  // Filter based on environment configuration
  // Default to Google if no env var is set (for production builds where env var wasn't set at build time)
  const envValue = process.env.NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS
  const enabledProviders = envValue && envValue.trim()
    ? envValue.split(',').map(p => p.trim()).filter(Boolean)
    : ['google'] // Default to Google OAuth if env var not set

  return socialLoginOptions.filter(option =>
    enabledProviders.includes(option.provider)
  )
}
