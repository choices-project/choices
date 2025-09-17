export type OAuthProvider = 
  | 'google' 
  | 'github' 
  | 'facebook' 
  | 'twitter' 
  | 'linkedin' 
  | 'discord' 
  | 'instagram' 
  | 'tiktok'

export type SocialLoginOption = {
  provider: OAuthProvider
  label: string
  description: string
  icon: string
  color: string
  bgColor: string
  borderColor: string
  textColor: string
  hoverBgColor: string
  hoverTextColor: string
}

export type AuthError = {
  code: string
  message: string
}

export type AuthSession = {
  user: {
    id: string
    email: string
    stableId: string
    verificationTier: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
  accessToken: string
  refreshToken: string
  expiresAt: number
}
