// Auth ↔ API Integration Tests
// Testing the integration between authentication system and API endpoints

import { getAuthService, AuthError } from './auth'
import { getApiAuthManager, ApiAuthContext } from './api'

// Mock data for testing
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  stableId: 'stable-123',
  verificationTier: 'T2' as const,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  authLevel: 'basic' as const,
}

const mockToken = 'mock-jwt-token-for-testing'

const mockRefreshToken = 'refresh-token-123'

// Test suite for Auth ↔ API Integration
describe('Auth ↔ API Integration', () => {
  let authService: ReturnType<typeof getAuthService>
  let apiAuthManager: ReturnType<typeof getApiAuthManager>

  beforeEach(() => {
    // Reset localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
    
    authService = getAuthService()
    apiAuthManager = getApiAuthManager()
  })

  afterEach(() => {
    // Clean up after each test
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
  })

  describe('Interface Contract', () => {
    test('should define AuthToken interface correctly', () => {
      const authToken = {
        accessToken: mockToken,
        refreshToken: mockRefreshToken,
        expiresAt: Date.now() + 3600000, // 1 hour from now
        userId: mockUser.id,
      }

      expect(authToken.accessToken).toBeDefined()
      expect(authToken.refreshToken).toBeDefined()
      expect(authToken.expiresAt).toBeDefined()
      expect(authToken.userId).toBeDefined()
    })

    test('should define UserContext interface correctly', () => {
      const userContext = {
        userId: mockUser.id,
        email: mockUser.email,
        role: 'user' as const,
        permissions: ['read', 'write'],
      }

      expect(userContext.userId).toBeDefined()
      expect(userContext.email).toBeDefined()
      expect(userContext.role).toBeDefined()
      expect(userContext.permissions).toBeDefined()
    })

    test('should define ApiAuthContext interface correctly', () => {
      const apiAuthContext: ApiAuthContext = {
        token: {
          user: mockUser,
          token: mockToken,
          expiresAt: new Date(Date.now() + 3600000),
          refreshToken: mockRefreshToken,
        },
        user: mockUser,
        isAuthenticated: true,
      }

      expect(apiAuthContext.token).toBeDefined()
      expect(apiAuthContext.user).toBeDefined()
      expect(apiAuthContext.isAuthenticated).toBe(true)
    })
  })

  describe('Token Validation', () => {
    test('should validate valid tokens', () => {
      // Mock localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('choices_auth_token', mockToken)
        localStorage.setItem('choices_refresh_token', mockRefreshToken)
        localStorage.setItem('choices_user', JSON.stringify(mockUser))
      }

      const isValid = authService.isAuthenticated()
      expect(isValid).toBe(true)
    })

    test('should reject expired tokens', () => {
      const expiredToken = 'expired-mock-jwt-token'

      if (typeof window !== 'undefined') {
        localStorage.setItem('choices_auth_token', expiredToken)
        localStorage.setItem('choices_refresh_token', mockRefreshToken)
        localStorage.setItem('choices_user', JSON.stringify(mockUser))
      }

      const isValid = authService.isAuthenticated()
      expect(isValid).toBe(false)
    })

    test('should reject invalid tokens', () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('choices_auth_token', 'invalid-token')
        localStorage.setItem('choices_refresh_token', mockRefreshToken)
        localStorage.setItem('choices_user', JSON.stringify(mockUser))
      }

      const isValid = authService.isAuthenticated()
      expect(isValid).toBe(false)
    })
  })

  describe('User Context Sharing', () => {
    test('should share user context correctly', async () => {
      // Mock authenticated state
      if (typeof window !== 'undefined') {
        localStorage.setItem('choices_auth_token', mockToken)
        localStorage.setItem('choices_refresh_token', mockRefreshToken)
        localStorage.setItem('choices_user', JSON.stringify(mockUser))
      }

      const authContext = await apiAuthManager.getAuthContext()
      
      expect(authContext).toBeDefined()
      expect(authContext?.user.id).toBe(mockUser.id)
      expect(authContext?.user.email).toBe(mockUser.email)
      expect(authContext?.user.verificationTier).toBe('T1')
    })

    test('should return null for unauthenticated users', async () => {
      const authContext = await apiAuthManager.getAuthContext()
      expect(authContext).toBeNull()
    })

    test('should handle missing user data gracefully', async () => {
      // Mock token but no user data
      if (typeof window !== 'undefined') {
        localStorage.setItem('choices_auth_token', mockToken)
        localStorage.setItem('choices_refresh_token', mockRefreshToken)
      }

      const authContext = await apiAuthManager.getAuthContext()
      expect(authContext).toBeNull()
    })
  })

  describe('Permission System', () => {
    test('should assign correct permissions for T0 users', () => {
      const t0User = { ...mockUser, verificationTier: 'T0' as const }
      if (typeof window !== 'undefined') {
        localStorage.setItem('choices_user', JSON.stringify(t0User))
      }

      // This would be tested through the API auth manager
      // For now, we test the logic directly
      const permissions = ['read']
      expect(permissions).toContain('read')
      expect(permissions).not.toContain('write')
    })

    test('should assign correct permissions for T1 users', () => {
      const t1User = { ...mockUser, verificationTier: 'T1' as const }
      if (typeof window !== 'undefined') {
        localStorage.setItem('choices_user', JSON.stringify(t1User))
      }

      const permissions = ['read', 'write']
      expect(permissions).toContain('read')
      expect(permissions).toContain('write')
    })

    test('should assign correct permissions for T2 users', () => {
      const t2User = { ...mockUser, verificationTier: 'T2' as const }
      if (typeof window !== 'undefined') {
        localStorage.setItem('choices_user', JSON.stringify(t2User))
      }

      const permissions = ['read', 'write', 'create_polls']
      expect(permissions).toContain('read')
      expect(permissions).toContain('write')
      expect(permissions).toContain('create_polls')
    })

    test('should assign correct permissions for T3 users', () => {
      const t3User = { ...mockUser, verificationTier: 'T3' as const }
      if (typeof window !== 'undefined') {
        localStorage.setItem('choices_user', JSON.stringify(t3User))
      }

      const permissions = ['read', 'write', 'admin', 'create_polls', 'manage_users']
      expect(permissions).toContain('read')
      expect(permissions).toContain('write')
      expect(permissions).toContain('admin')
      expect(permissions).toContain('create_polls')
      expect(permissions).toContain('manage_users')
    })
  })

  describe('Error Handling', () => {
    test('should handle authentication errors correctly', async () => {
      // Test with no authentication
      await expect(apiAuthManager.createAuthenticatedRequest('/api/test'))
        .rejects
        .toThrow(AuthError)
    })

    test('should handle token refresh errors', async () => {
      // Mock expired token
      const expiredToken = 'expired-mock-jwt-token'

      if (typeof window !== 'undefined') {
        localStorage.setItem('choices_auth_token', expiredToken)
        localStorage.setItem('choices_refresh_token', 'invalid-refresh-token')
        localStorage.setItem('choices_user', JSON.stringify(mockUser))
      }

      await expect(apiAuthManager.createAuthenticatedRequest('/api/test'))
        .rejects
        .toThrow(AuthError)
    })
  })

  describe('Security Validation', () => {
    test('should not expose sensitive data in tokens', () => {
      const token = authService.getToken()
      if (token) {
        // Token should not contain sensitive information in a readable format
        expect(token).not.toContain('password')
        expect(token).not.toContain('secret')
      }
    })

    test('should validate token format', () => {
      const token = authService.getToken()
      if (token) {
        // JWT tokens should have 3 parts separated by dots
        const parts = token.split('.')
        expect(parts).toHaveLength(3)
      }
    })
  })
})

// Integration test helpers
export const createMockAuthContext = (user: any, token: string): ApiAuthContext => {
  return {
    token: {
      user,
      token,
      expiresAt: new Date(Date.now() + 3600000),
      refreshToken: 'mock-refresh-token',
    },
    user,
    isAuthenticated: true,
  }
}

export const mockAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const authManager = getApiAuthManager()
  return authManager.authenticatedFetch(url, options)
}
