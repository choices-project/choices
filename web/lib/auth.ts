// Authentication System for Choices Platform
// Progressive authentication: Email/password + 2FA for basic users, WebAuthn for advanced users

export interface User {
  id: string
  email: string
  stableId: string
  verificationTier: 'T0' | 'T1' | 'T2' | 'T3'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  authLevel: 'basic' | 'advanced' // New field for auth level
  webAuthnEnabled?: boolean
}

export interface AuthSession {
  user: User
  token: string
  expiresAt: Date
  refreshToken: string
}

export interface LoginCredentials {
  email: string
  password: string
  twoFactorCode?: string
  useWebAuthn?: boolean // New option to use WebAuthn
}

export interface RegisterData {
  email: string
  password: string
  confirmPassword: string
  twoFactorEnabled?: boolean
  enableWebAuthn?: boolean // New option to enable WebAuthn
}

export class AuthError extends Error {
  code: string
  field?: string

  constructor(code: string, message: string, field?: string) {
    super(message)
    this.name = 'AuthError'
    this.code = code
    this.field = field
  }
}

export interface WebAuthnCredential {
  id: string
  publicKey: string
  signCount: number
}

export class AuthService {
  private baseUrl: string
  private tokenKey = 'choices_auth_token'
  private refreshTokenKey = 'choices_refresh_token'
  private userKey = 'choices_user'

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
  }

  // Register a new user
  async register(data: RegisterData): Promise<AuthSession> {
    // Validate input
    this.validateRegistrationData(data)

    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email.toLowerCase().trim(),
        password: data.password,
        twoFactorEnabled: data.twoFactorEnabled || false,
        enableWebAuthn: data.enableWebAuthn || false,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new AuthError(error.code, error.message)
    }

    const session = await response.json()
    this.storeSession(session)
    return session
  }

  // Login user with progressive authentication
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    // Validate input
    this.validateLoginCredentials(credentials)

    // If WebAuthn is requested and available, try WebAuthn first
    if (credentials.useWebAuthn && this.isWebAuthnSupported()) {
      try {
        return await this.loginWithWebAuthn(credentials.email)
      } catch (error) {
        console.log('WebAuthn login failed, falling back to password:', error)
        // Fall back to password authentication
      }
    }

    // Standard password-based login
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password,
        twoFactorCode: credentials.twoFactorCode,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new AuthError(error.code, error.message)
    }

    const session = await response.json()
    this.storeSession(session)
    return session
  }

  // WebAuthn-based login
  async loginWithWebAuthn(email: string): Promise<AuthSession> {
    // Import PWA WebAuthn manager dynamically
    const { getPWAWebAuthn } = await import('./pwa-utils')
    const pwaWebAuthn = getPWAWebAuthn()

    // Get user's WebAuthn credentials
    const response = await fetch(`${this.baseUrl}/auth/webauthn/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      throw new AuthError('WEBAUTHN_NOT_SETUP', 'WebAuthn not set up for this user')
    }

    const { credentials } = await response.json()

    // Authenticate with WebAuthn
    const credential = await pwaWebAuthn.authenticateUser(
      new Uint8Array(credentials[0].id).buffer
    )

    if (!credential) {
      throw new AuthError('WEBAUTHN_FAILED', 'WebAuthn authentication failed')
    }

    // Complete WebAuthn login
    const publicKeyCredential = credential as PublicKeyCredential
    const loginResponse = await fetch(`${this.baseUrl}/auth/webauthn/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        credential: {
          id: publicKeyCredential.id,
          type: publicKeyCredential.type,
          rawId: Array.from(new Uint8Array(publicKeyCredential.rawId)),
          response: {
            clientDataJSON: Array.from(new Uint8Array((publicKeyCredential.response as AuthenticatorAssertionResponse).clientDataJSON)),
            authenticatorData: Array.from(new Uint8Array((publicKeyCredential.response as AuthenticatorAssertionResponse).authenticatorData)),
            signature: Array.from(new Uint8Array((publicKeyCredential.response as AuthenticatorAssertionResponse).signature)),
            userHandle: (publicKeyCredential.response as AuthenticatorAssertionResponse).userHandle ? 
              Array.from(new Uint8Array((publicKeyCredential.response as AuthenticatorAssertionResponse).userHandle!)) : undefined,
          },
        },
      }),
    })

    if (!loginResponse.ok) {
      const error = await loginResponse.json()
      throw new AuthError(error.code, error.message)
    }

    const session = await loginResponse.json()
    this.storeSession(session)
    return session
  }

  // Enable WebAuthn for existing user
  async enableWebAuthn(): Promise<{ qrCode: string; credentials: WebAuthnCredential[] }> {
    const token = this.getToken()
    if (!token) {
      throw new AuthError('NOT_AUTHENTICATED', 'User not authenticated')
    }

    // Import PWA WebAuthn manager dynamically
    const { getPWAWebAuthn } = await import('./pwa-utils')
    const pwaWebAuthn = getPWAWebAuthn()

    // Get user info for WebAuthn registration
    const user = this.getStoredUser()
    if (!user) {
      throw new AuthError('USER_NOT_FOUND', 'User not found')
    }

    // Create WebAuthn credentials
    const credential = await pwaWebAuthn.registerUser(user.stableId)
    if (!credential) {
      throw new AuthError('WEBAUTHN_REGISTRATION_FAILED', 'WebAuthn registration failed')
    }

    // Send credentials to server
    const publicKeyCredential = credential as PublicKeyCredential
    const response = await fetch(`${this.baseUrl}/auth/webauthn/enable`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        credential: {
          id: publicKeyCredential.id,
          type: publicKeyCredential.type,
          rawId: Array.from(new Uint8Array(publicKeyCredential.rawId)),
          response: {
            clientDataJSON: Array.from(new Uint8Array((publicKeyCredential.response as AuthenticatorAttestationResponse).clientDataJSON)),
            attestationObject: Array.from(new Uint8Array((publicKeyCredential.response as AuthenticatorAttestationResponse).attestationObject)),
          },
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new AuthError(error.code, error.message)
    }

    return await response.json()
  }

  // Check if WebAuthn is supported
  isWebAuthnSupported(): boolean {
    if (typeof window === 'undefined') return false
    return 'PublicKeyCredential' in window && 'credentials' in navigator
  }

  // Check if user has WebAuthn enabled
  async hasWebAuthnEnabled(email: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/webauthn/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      if (response.ok) {
        const { enabled } = await response.json()
        return enabled
      }
      return false
    } catch (error) {
      return false
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      const token = this.getToken()
      if (token) {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.clearSession()
    }
  }

  // Refresh authentication token
  async refreshToken(): Promise<AuthSession> {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      throw new AuthError('NO_REFRESH_TOKEN', 'No refresh token available')
    }

    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken,
      }),
    })

    if (!response.ok) {
      this.clearSession()
      throw new AuthError('REFRESH_FAILED', 'Failed to refresh token')
    }

    const session = await response.json()
    this.storeSession(session)
    return session
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken()
    if (!token) {
      return null
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh token
          try {
            await this.refreshToken()
            return this.getCurrentUser()
          } catch (error) {
            this.clearSession()
            return null
          }
        }
        throw new AuthError('FETCH_USER_FAILED', 'Failed to fetch user')
      }

      const user = await response.json()
      this.storeUser(user)
      return user
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<void> {
    if (!email || !this.isValidEmail(email)) {
      throw new AuthError('INVALID_EMAIL', 'Invalid email address')
    }

    const response = await fetch(`${this.baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new AuthError(error.code, error.message)
    }
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token || !newPassword) {
      throw new AuthError('INVALID_INPUT', 'Token and new password are required')
    }

    if (!this.isValidPassword(newPassword)) {
      throw new AuthError('INVALID_PASSWORD', 'Password does not meet requirements')
    }

    const response = await fetch(`${this.baseUrl}/auth/reset-password/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        newPassword,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new AuthError(error.code, error.message)
    }
  }

  // Enable 2FA
  async enableTwoFactor(): Promise<{ qrCode: string; secret: string }> {
    const token = this.getToken()
    if (!token) {
      throw new AuthError('NOT_AUTHENTICATED', 'User not authenticated')
    }

    const response = await fetch(`${this.baseUrl}/auth/2fa/enable`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new AuthError(error.code, error.message)
    }

    return await response.json()
  }

  // Disable 2FA
  async disableTwoFactor(code: string): Promise<void> {
    const token = this.getToken()
    if (!token) {
      throw new AuthError('NOT_AUTHENTICATED', 'User not authenticated')
    }

    const response = await fetch(`${this.baseUrl}/auth/2fa/disable`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new AuthError(error.code, error.message)
    }
  }

  // Verify 2FA code
  async verifyTwoFactor(code: string): Promise<boolean> {
    const token = this.getToken()
    if (!token) {
      throw new AuthError('NOT_AUTHENTICATED', 'User not authenticated')
    }

    const response = await fetch(`${this.baseUrl}/auth/2fa/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new AuthError(error.code, error.message)
    }

    return true
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken()
    if (!token) {
      return false
    }

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expiresAt = new Date(payload.exp * 1000)
      return expiresAt > new Date()
    } catch (error) {
      return false
    }
  }

  // Get stored token
  getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(this.tokenKey)
  }

  // Get stored refresh token
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(this.refreshTokenKey)
  }

  // Get stored user
  getStoredUser(): User | null {
    if (typeof window === 'undefined') return null
    const userStr = localStorage.getItem(this.userKey)
    if (!userStr) return null
    try {
      return JSON.parse(userStr)
    } catch (error) {
      return null
    }
  }

  // Store session data
  private storeSession(session: AuthSession): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.tokenKey, session.token)
    localStorage.setItem(this.refreshTokenKey, session.refreshToken)
    localStorage.setItem(this.userKey, JSON.stringify(session.user))
  }

  // Store user data
  private storeUser(user: User): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.userKey, JSON.stringify(user))
  }

  // Clear session data
  private clearSession(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.tokenKey)
    localStorage.removeItem(this.refreshTokenKey)
    localStorage.removeItem(this.userKey)
  }

  // Validation methods
  private validateRegistrationData(data: RegisterData): void {
    if (!data.email || !this.isValidEmail(data.email)) {
      throw new AuthError('INVALID_EMAIL', 'Valid email is required')
    }

    if (!data.password || !this.isValidPassword(data.password)) {
      throw new AuthError('INVALID_PASSWORD', 'Password must be at least 8 characters with uppercase, lowercase, number, and special character')
    }

    if (data.password !== data.confirmPassword) {
      throw new AuthError('PASSWORD_MISMATCH', 'Passwords do not match')
    }
  }

  private validateLoginCredentials(credentials: LoginCredentials): void {
    if (!credentials.email || !this.isValidEmail(credentials.email)) {
      throw new AuthError('INVALID_EMAIL', 'Valid email is required')
    }

    if (!credentials.useWebAuthn && !credentials.password) {
      throw new AuthError('INVALID_PASSWORD', 'Password is required')
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private isValidPassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return passwordRegex.test(password)
  }
}

// Create singleton instance
let authServiceInstance: AuthService | null = null

export const getAuthService = (): AuthService => {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService()
  }
  return authServiceInstance
}

// Export for backward compatibility
export const authService = typeof window !== 'undefined' ? getAuthService() : null
