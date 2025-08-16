// PWA Authentication Integration for Choices Platform
// Combines WebAuthn with privacy-first user management

import { pwaManager, pwaWebAuthn, privacyStorage } from './pwa-utils'
import { pwaAnalytics } from './pwa-analytics'

export interface PWAUser {
  stableId: string
  pseudonym?: string
  trustTier: 'T0' | 'T1' | 'T2' | 'T3'
  verificationScore: number
  profileVisibility: 'anonymous' | 'pseudonymous' | 'public'
  dataSharingLevel: 'minimal' | 'demographic' | 'full'
  webauthnCredentials?: ArrayBuffer[]
  deviceBindings?: string[]
  createdAt: string
  lastActivity: string
  pwaFeatures?: {
    webAuthnEnabled: boolean
    pushNotificationsEnabled: boolean
    offlineVotingEnabled: boolean
    encryptedStorageEnabled: boolean
  }
}

export interface PWAAuthSession {
  userId: string
  sessionId: string
  deviceFingerprint: any
  webauthnVerified: boolean
  trustScore: number
  expiresAt: number
  offlineCapable: boolean
}

export class PWAAuthIntegration {
  private currentUser: PWAUser | null = null
  private currentSession: PWAAuthSession | null = null
  private isInitialized = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize()
    }
  }

  private async initialize() {
    try {
      // Check for existing session
      const session = await this.getStoredSession()
      if (session && session.expiresAt > Date.now()) {
        this.currentSession = session
        const user = await this.getUser(session.userId)
        if (user) {
          this.currentUser = user
        }
      }

      // Track analytics
      pwaAnalytics.trackFeatureUsage('pwa_auth_initialized')
      this.isInitialized = true
    } catch (error) {
      console.error('PWA Auth initialization failed:', error)
    }
  }

  // Create new user with PWA enhancements
  async createUser(pseudonym?: string): Promise<PWAUser> {
    try {
      const deviceFingerprint = await pwaManager.getDeviceFingerprint()
      
      // Generate stable ID
      const stableId = this.generateStableId(deviceFingerprint)
      
      // Create user object
      const user: PWAUser = {
        stableId,
        pseudonym,
        trustTier: 'T0',
        verificationScore: 0,
        profileVisibility: 'anonymous',
        dataSharingLevel: 'minimal',
        webauthnCredentials: [],
        deviceBindings: [this.hashDeviceFingerprint(deviceFingerprint)],
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        pwaFeatures: {
          webAuthnEnabled: false,
          pushNotificationsEnabled: false,
          offlineVotingEnabled: true,
          encryptedStorageEnabled: true
        }
      }

      // Store user locally
      await this.storeUser(user)
      
      // Create session
      await this.createSession(user)
      
      this.currentUser = user
      
      // Track analytics
      pwaAnalytics.trackFeatureUsage('user_created')
      pwaAnalytics.trackDataCollection(['stableId', 'pseudonym', 'trustTier'], false)
      
      return user
    } catch (error) {
      console.error('Failed to create user:', error)
      throw error
    }
  }

  // Authenticate user with WebAuthn
  async authenticateUser(userId: string): Promise<boolean> {
    try {
      const user = await this.getUser(userId)
      if (!user) {
        throw new Error('User not found')
      }

      // Check if WebAuthn is enabled
      if (!user.pwaFeatures?.webAuthnEnabled || !user.webauthnCredentials?.length) {
        // Fallback to device fingerprint verification
        return await this.verifyDeviceFingerprint(user)
      }

      // WebAuthn authentication
      const deviceFingerprint = await pwaManager.getDeviceFingerprint()
      const credential = await pwaWebAuthn.authenticateUser(user.webauthnCredentials[0])
      
      if (credential) {
        // Update user activity
        user.lastActivity = new Date().toISOString()
        await this.storeUser(user)
        
        // Create session
        await this.createSession(user)
        
        this.currentUser = user
        
        // Track analytics
        pwaAnalytics.trackWebAuthnUsage(true)
        pwaAnalytics.trackFeatureUsage('webauthn_auth_success')
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Authentication failed:', error)
      pwaAnalytics.trackWebAuthnUsage(false)
      pwaAnalytics.trackFeatureUsage('webauthn_auth_failed')
      return false
    }
  }

  // Enable WebAuthn for user
  async enableWebAuthn(userId: string): Promise<boolean> {
    try {
      const user = await this.getUser(userId)
      if (!user) {
        throw new Error('User not found')
      }

      // Register WebAuthn credential
      const credential = await pwaWebAuthn.registerUser(user.pseudonym || user.stableId)
      
      if (credential) {
        // Update user
        user.webauthnCredentials = [credential.id as unknown as ArrayBuffer]
        user.pwaFeatures = {
          ...user.pwaFeatures,
          webAuthnEnabled: true
        }
        user.trustTier = this.calculateTrustTier(user)
        
        await this.storeUser(user)
        
        // Track analytics
        pwaAnalytics.trackFeatureUsage('webauthn_enabled')
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Failed to enable WebAuthn:', error)
      return false
    }
  }

  // Enable push notifications
  async enablePushNotifications(userId: string): Promise<boolean> {
    try {
      const user = await this.getUser(userId)
      if (!user) {
        throw new Error('User not found')
      }

      const granted = await pwaManager.requestNotificationPermission()
      if (granted) {
        const subscription = await pwaManager.subscribeToPushNotifications()
        
        if (subscription) {
          // Update user
          user.pwaFeatures = {
            ...user.pwaFeatures,
            pushNotificationsEnabled: true
          }
          
          await this.storeUser(user)
          
          // Track analytics
          pwaAnalytics.trackFeatureUsage('push_notifications_enabled')
          
          return true
        }
      }
      
      return false
    } catch (error) {
      console.error('Failed to enable push notifications:', error)
      return false
    }
  }

  // Vote with PWA enhancements
  async vote(pollId: string, choice: number, offline: boolean = false): Promise<boolean> {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user')
      }

      const voteData = {
        pollId,
        choice,
        userId: this.currentUser.stableId,
        timestamp: Date.now(),
        deviceFingerprint: await pwaManager.getDeviceFingerprint(),
        offline,
        sessionId: this.currentSession?.sessionId
      }

      if (offline || !navigator.onLine) {
        // Store offline vote
        await pwaManager.storeOfflineVote({
          pollId,
          choice
        })
        
        // Track analytics
        pwaAnalytics.trackOfflineAction('vote', voteData)
        pwaAnalytics.trackFeatureUsage('offline_vote')
        
        return true
      } else {
        // Send vote to server
        const response = await fetch('/api/votes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(voteData)
        })
        
        if (response.ok) {
          // Update user activity
          this.currentUser.lastActivity = new Date().toISOString()
          await this.storeUser(this.currentUser)
          
          // Track analytics
          pwaAnalytics.trackFeatureUsage('online_vote')
          
          return true
        }
        
        return false
      }
    } catch (error) {
      console.error('Vote failed:', error)
      return false
    }
  }

  // Get current user
  getCurrentUser(): PWAUser | null {
    return this.currentUser
  }

  // Get current session
  getCurrentSession(): PWAAuthSession | null {
    return this.currentSession
  }

  // Update user profile
  async updateUserProfile(updates: Partial<PWAUser>): Promise<boolean> {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user')
      }

      // Update user
      this.currentUser = {
        ...this.currentUser,
        ...updates,
        lastActivity: new Date().toISOString()
      }

      // Recalculate trust tier
      this.currentUser.trustTier = this.calculateTrustTier(this.currentUser)
      
      await this.storeUser(this.currentUser)
      
      // Track analytics
      pwaAnalytics.trackFeatureUsage('profile_updated')
      
      return true
    } catch (error) {
      console.error('Failed to update profile:', error)
      return false
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Clear session
      await this.clearSession()
      
      this.currentUser = null
      this.currentSession = null
      
      // Track analytics
      pwaAnalytics.trackFeatureUsage('user_logout')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Export user data
  async exportUserData(): Promise<any> {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user')
      }

      const exportData = {
        user: this.currentUser,
        session: this.currentSession,
        analytics: pwaAnalytics.exportUserData(),
        deviceInfo: await pwaManager.getDeviceFingerprint(),
        timestamp: new Date().toISOString()
      }

      return exportData
    } catch (error) {
      console.error('Failed to export user data:', error)
      throw error
    }
  }

  // Delete user data
  async deleteUserData(): Promise<boolean> {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user')
      }

      // Clear all stored data
      await privacyStorage.clearAllEncryptedData()
      await this.clearSession()
      
      // Clear analytics
      pwaAnalytics.clearData()
      
      this.currentUser = null
      this.currentSession = null
      
      // Track analytics (before clearing)
      pwaAnalytics.trackFeatureUsage('user_data_deleted')
      
      return true
    } catch (error) {
      console.error('Failed to delete user data:', error)
      return false
    }
  }

  // Private helper methods
  private generateStableId(deviceFingerprint: any): string {
    const data = `${deviceFingerprint.platform}-${deviceFingerprint.screenResolution}-${deviceFingerprint.timezone}`
    return this.hashString(data).substring(0, 16)
  }

  private hashDeviceFingerprint(deviceFingerprint: any): string {
    return this.hashString(JSON.stringify(deviceFingerprint))
  }

  private async verifyDeviceFingerprint(user: PWAUser): Promise<boolean> {
    const currentFingerprint = await pwaManager.getDeviceFingerprint()
    const currentHash = this.hashDeviceFingerprint(currentFingerprint)
    
    return user.deviceBindings?.includes(currentHash) || false
  }

  private calculateTrustTier(user: PWAUser): 'T0' | 'T1' | 'T2' | 'T3' {
    let score = 0
    
    // WebAuthn enabled
    if (user.pwaFeatures?.webAuthnEnabled) score += 30
    
    // Push notifications enabled
    if (user.pwaFeatures?.pushNotificationsEnabled) score += 10
    
    // Device bindings
    score += (user.deviceBindings?.length || 0) * 5
    
    // Activity duration
    const daysActive = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    score += Math.min(daysActive * 2, 20)
    
    if (score >= 60) return 'T3'
    if (score >= 40) return 'T2'
    if (score >= 20) return 'T1'
    return 'T0'
  }

  private async storeUser(user: PWAUser): Promise<void> {
    await privacyStorage.storeEncryptedData(`user_${user.stableId}`, user)
  }

  private async getUser(userId: string): Promise<PWAUser | null> {
    return await privacyStorage.getEncryptedData(`user_${userId}`)
  }

  private async createSession(user: PWAUser): Promise<void> {
    const deviceFingerprint = await pwaManager.getDeviceFingerprint()
    
    const session: PWAAuthSession = {
      userId: user.stableId,
      sessionId: this.generateSessionId(),
      deviceFingerprint,
      webauthnVerified: user.pwaFeatures?.webAuthnEnabled || false,
      trustScore: user.verificationScore,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      offlineCapable: true
    }
    
    await privacyStorage.storeEncryptedData(`session_${session.sessionId}`, session)
    this.currentSession = session
  }

  private async getStoredSession(): Promise<PWAAuthSession | null> {
    const sessionKeys = Object.keys(localStorage).filter(key => key.startsWith('encrypted_session_'))
    
    for (const key of sessionKeys) {
      const session = await privacyStorage.getEncryptedData(key)
      if (session && session.expiresAt > Date.now()) {
        return session
      }
    }
    
    return null
  }

  private async clearSession(): Promise<void> {
    if (this.currentSession) {
      await privacyStorage.clearEncryptedData(`session_${this.currentSession.sessionId}`)
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(36)
  }
}

// Singleton instance
// Lazy initialization for PWA auth
let pwaAuthInstance: PWAAuthIntegration | null = null

export const getPWAAuth = (): PWAAuthIntegration => {
  if (!pwaAuthInstance && typeof window !== 'undefined') {
    pwaAuthInstance = new PWAAuthIntegration()
  }
  return pwaAuthInstance!
}

// For backward compatibility - only call getter in browser
export const pwaAuth = typeof window !== 'undefined' ? getPWAAuth() : null
