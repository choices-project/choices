import { logger } from '@/lib/utils/logger';
/**
 * Client-Side Session Management
 * Handles authentication state and session management on the client side
 */

export interface ClientUser {
  id: string
  stableId: string
  username: string
  displayName?: string
  email?: string
  verificationTier: string
  isActive: boolean
  twoFactorEnabled: boolean
  createdAt: string
  updatedAt: string
}

class ClientSessionManager {
  private getCsrfToken(): string | null {
    if (typeof document === "undefined") return null
    const cookies = document.cookie.split(";")
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=")
      // Support both development and production cookie names
      if ((name === "choices_csrf" || name === "__Host-choices_csrf") && value) {
        return decodeURIComponent(value)
      }
    }
    return null
  }

  private user: ClientUser | null = null
  private loading = true
  private listeners: Set<(user: ClientUser | null) => void> = new Set()

  constructor() {
    // Only initialize session on client side
    if (typeof window !== 'undefined') {
      this.initializeSession()
    }
  }

  private async initializeSession() {
    try {
      logger.info('Client session: Initializing session...')
      
      // Only run on client side
      if (typeof window === 'undefined') {
        logger.info('Client session: Skipping initialization on server side')
        this.loading = false
        return
      }
      
      const response = await fetch('/api/profile', {
        method: 'GET',
        credentials: 'include', // Ensure cookies are sent
        headers: {
          "X-CSRF-Token": this.getCsrfToken() ?? "",
          'Content-Type': 'application/json',
        },
      })

      logger.info('Client session: Response status', { status: response.status })

      if (response.ok) {
        const profileData = await response.json()
        if (profileData.profile) {
          // Transform profile data to match ClientUser interface
          const userData: ClientUser = {
            id: profileData.profile.user_id,
            stableId: profileData.profile.user_id, // Use user_id as stableId
            username: profileData.profile.username,
            displayName: profileData.profile.display_name,
            email: profileData.email,
            verificationTier: profileData.profile.trust_tier || 'T0',
            isActive: profileData.profile.is_active,
            twoFactorEnabled: false, // Not implemented yet
            createdAt: profileData.profile.created_at,
            updatedAt: profileData.profile.updated_at
          }
          logger.info('Client session: User data received:', { username: userData.username })
          this.user = userData
          this.notifyListeners(userData)
        } else {
          logger.info('Client session: No profile data found')
          this.user = null
          this.notifyListeners(null)
        }
      } else {
        logger.info('Client session: No valid session found')
        this.user = null
        this.notifyListeners(null)
      }
    } catch (error) {
      logger.error('Client session: Failed to initialize session:', error instanceof Error ? error : new Error(String(error)))
      this.user = null
      this.notifyListeners(null)
    } finally {
      this.loading = false
    }
  }

  private notifyListeners(user: ClientUser | null) {
    this.listeners.forEach(listener => listener(user))
  }

  public subscribe(listener: (user: ClientUser | null) => void) {
    this.listeners.add(listener)
    // Immediately call with current state
    if (!this.loading) {
      listener(this.user)
    }
    return () => this.listeners.delete(listener)
  }

  public async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          "X-CSRF-Token": this.getCsrfToken() ?? "",
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Re-fetch user data to update session
        await this.initializeSession()
        return { success: true }
      } else {
        return { success: false, error: data.message ?? 'Login failed' }
      }
    } catch (error) {
      logger.error('Login error:', error instanceof Error ? error : new Error(String(error)))
      return { success: false, error: 'Network error' }
    }
  }

  public async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      logger.error('Logout error:', error instanceof Error ? error : new Error(String(error)))
    } finally {
      this.user = null
      this.notifyListeners(null)
    }
  }

  public async register(userData: {
    username: string
    password?: string
    enableBiometric?: boolean
    enableDeviceFlow?: boolean
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/auth/register-ia', {
        method: 'POST',
        credentials: 'include',
        headers: {
          "X-CSRF-Token": this.getCsrfToken() ?? "",
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (response.ok) {
        // Re-fetch user data to update session
        await this.initializeSession()
        return { success: true }
      } else {
        return { success: false, error: data.message || 'Registration failed' }
      }
    } catch (error) {
      logger.error('Registration error:', error instanceof Error ? error : new Error(String(error)))
      return { success: false, error: 'Network error' }
    }
  }

  public getUser(): ClientUser | null {
    return this.user
  }

  public isLoading(): boolean {
    return this.loading
  }

  public isAuthenticated(): boolean {
    return this.user !== null
  }

  public async refreshSession(): Promise<void> {
    logger.info('Client session: Refreshing session...')
    await this.initializeSession()
  }
}

// Create singleton instance
let clientSessionInstance: ClientSessionManager | null = null

export function getClientSession(): ClientSessionManager {
  if (typeof window === 'undefined') {
    // Return a mock instance for server-side rendering
    return {
      user: null,
      loading: true,
      listeners: new Set(),
      subscribe: () => () => {},
      login: async () => ({ success: false, error: 'Server side' }),
      logout: async () => {},
      register: async () => ({ success: false, error: 'Server side' }),
      getUser: () => null,
      isLoading: () => true,
      isAuthenticated: () => false,
      refreshSession: async () => {}
    } as any
  }
  
  if (!clientSessionInstance) {
    clientSessionInstance = new ClientSessionManager()
  }
  return clientSessionInstance
}

export const clientSession = getClientSession()
