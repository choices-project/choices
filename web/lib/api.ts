// API utility functions for communicating with backend services
// Integrated with Authentication System (AUTH-001)

import { getAuthService, AuthSession, User, AuthError } from './auth';

const IA_BASE_URL = 'http://localhost:8081/api'
const PO_BASE_URL = 'http://localhost:8082/api'

// Interface Contract for Auth ↔ API Integration
// Note: AuthToken and UserContext are imported from './auth'

export interface ApiAuthContext {
  token: AuthSession
  user: User
  isAuthenticated: boolean
}

export interface ApiRequest {
  headers: {
    Authorization: string
    'Content-Type': string
  }
  body?: any
}

// API Authentication Manager
export class ApiAuthManager {
  private authService = getAuthService()

  // Get current authentication context
  async getAuthContext(): Promise<ApiAuthContext | null> {
    if (!this.authService.isAuthenticated()) {
      return null
    }

    const token = this.authService.getToken()
    const user = this.authService.getStoredUser()

    if (!token || !user) {
      return null
    }

    // Parse token to get expiration
    let expiresAt: number
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      expiresAt = payload.exp * 1000
    } catch (_error) {
      return null
    }

    const authSession: AuthSession = {
      user,
      token,
      expiresAt: new Date(expiresAt),
      refreshToken: this.authService.getRefreshToken() || '',
    }

    return {
      token: authSession,
      user,
      isAuthenticated: true,
    }
  }

  // Get permissions based on verification tier
  private getPermissionsForTier(tier: string): string[] {
    switch (tier) {
      case 'T3':
        return ['read', 'write', 'admin', 'create_polls', 'manage_users']
      case 'T2':
        return ['read', 'write', 'create_polls']
      case 'T1':
        return ['read', 'write']
      case 'T0':
        return ['read']
      default:
        return ['read']
    }
  }

  // Create authenticated API request
  async createAuthenticatedRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiRequest> {
    // Validate URL format
    if (!url || typeof url !== 'string') {
      throw new AuthError('INVALID_URL', 'Valid URL is required')
    }
    
    const authContext = await this.getAuthContext()
    
    if (!authContext) {
      throw new AuthError('NOT_AUTHENTICATED', 'User not authenticated')
    }

    // Check if token is expired and refresh if needed
    if (authContext.token.expiresAt.getTime() < Date.now()) {
      try {
        await this.authService.refreshToken()
        // Get updated auth context after refresh
        const updatedContext = await this.getAuthContext()
        if (!updatedContext) {
          throw new AuthError('REFRESH_FAILED', 'Failed to refresh authentication')
        }
        authContext.token = updatedContext.token
        authContext.user = updatedContext.user
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Token refresh failed:', err);
        throw new AuthError('REFRESH_FAILED', 'Failed to refresh authentication')
      }
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${authContext.token.token}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    return {
      headers: {
        Authorization: headers.Authorization,
        'Content-Type': headers['Content-Type'],
      },
      body: options.body,
    }
  }

  // Make authenticated API call
  async authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const authRequest = await this.createAuthenticatedRequest(url, options)
    
    return fetch(url, {
      ...options,
      headers: authRequest.headers,
      body: authRequest.body,
    })
  }
}

// Create singleton instance
let apiAuthManagerInstance: ApiAuthManager | null = null

export const getApiAuthManager = (): ApiAuthManager => {
  if (!apiAuthManagerInstance) {
    apiAuthManagerInstance = new ApiAuthManager()
  }
  return apiAuthManagerInstance
}

// Legacy interfaces for backward compatibility
export interface TokenResponse {
  token: string
  tag: string
  issued_at: string
  expires_at: string
  tier: string
  scope: string
  public_key: string
}

export interface Poll {
  id: string
  title: string
  description: string
  options: string[]
  status: 'draft' | 'active' | 'closed'
  start_time: string
  end_time: string
  sponsors: string[]
  created_at: string
}

export interface Vote {
  poll_id: string
  token: string
  tag: string
  choice: number
  voted_at: string
  merkle_leaf: string
  merkle_proof: string[]
}

export interface Tally {
  [key: number]: number
}

export interface CommitmentLog {
  leaf_count: number
  root: string
  timestamp: string
}

// IA Service API functions with authentication
export const iaApi = {
  // Get token for voting (requires authentication)
  async getToken(userStableId: string, pollId: string, tier: string = 'T1'): Promise<TokenResponse> {
    const authManager = getApiAuthManager()
    const response = await authManager.authenticatedFetch(`${IA_BASE_URL}/v1/tokens`, {
      method: 'POST',
      body: JSON.stringify({
        user_stable_id: userStableId,
        poll_id: pollId,
        tier,
        scope: `poll:${pollId}`,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.statusText}`)
    }

    return response.json()
  },

  // Get public key (no authentication required)
  async getPublicKey(): Promise<{ public_key: string }> {
    const response = await fetch(`${IA_BASE_URL}/v1/public-key`)
    
    if (!response.ok) {
      throw new Error(`Failed to get public key: ${response.statusText}`)
    }

    return response.json()
  },

  // WebAuthn registration (requires authentication)
  async beginRegistration(userStableId: string, email?: string) {
    const authManager = getApiAuthManager()
    const response = await authManager.authenticatedFetch(`${IA_BASE_URL}/v1/webauthn/register/begin`, {
      method: 'POST',
      body: JSON.stringify({
        user_stable_id: userStableId,
        email,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to begin registration: ${response.statusText}`)
    }

    return response.json()
  },

  async finishRegistration(userStableId: string, session: any, response: any) {
    const authManager = getApiAuthManager()
    const apiResponse = await authManager.authenticatedFetch(`${IA_BASE_URL}/v1/webauthn/register/finish`, {
      method: 'POST',
      body: JSON.stringify({
        user_stable_id: userStableId,
        session,
        response,
      }),
    })

    if (!apiResponse.ok) {
      throw new Error(`Failed to finish registration: ${apiResponse.statusText}`)
    }

    return apiResponse.json()
  },

  // WebAuthn login (requires authentication)
  async beginLogin(userStableId: string) {
    const authManager = getApiAuthManager()
    const response = await authManager.authenticatedFetch(`${IA_BASE_URL}/v1/webauthn/login/begin`, {
      method: 'POST',
      body: JSON.stringify({
        user_stable_id: userStableId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to begin login: ${response.statusText}`)
    }

    return response.json()
  },

  async finishLogin(userStableId: string, session: any, response: any) {
    const authManager = getApiAuthManager()
    const apiResponse = await authManager.authenticatedFetch(`${IA_BASE_URL}/v1/webauthn/login/finish`, {
      method: 'POST',
      body: JSON.stringify({
        user_stable_id: userStableId,
        session,
        response,
      }),
    })

    if (!apiResponse.ok) {
      throw new Error(`Failed to finish login: ${apiResponse.statusText}`)
    }

    return apiResponse.json()
  },
}

// PO Service API functions with authentication
export const poApi = {
  // Get all polls (requires authentication)
  async getPolls(): Promise<Poll[]> {
    const authManager = getApiAuthManager()
    const response = await authManager.authenticatedFetch(`${PO_BASE_URL}/v1/polls/list`)
    
    if (!response.ok) {
      throw new Error(`Failed to get polls: ${response.statusText}`)
    }

    return response.json()
  },

  // Get specific poll (requires authentication)
  async getPoll(pollId: string): Promise<Poll> {
    const authManager = getApiAuthManager()
    const response = await authManager.authenticatedFetch(`${PO_BASE_URL}/v1/polls/get?id=${pollId}`)
    
    if (!response.ok) {
      throw new Error(`Failed to get poll: ${response.statusText}`)
    }

    return response.json()
  },

  // Create poll (admin function - requires admin permissions)
  async createPoll(pollData: {
    title: string
    description: string
    options: string[]
    start_time: string
    end_time: string
    sponsors?: string[]
  }): Promise<Poll> {
    const authManager = getApiAuthManager()
    const authContext = await authManager.getAuthContext()
    
    if (!authContext) {
      throw new Error('User not authenticated')
    }
    
    // Check permissions based on verification tier
    const userTier = authContext.user.verificationTier
    const canCreatePolls = userTier === 'T2' || userTier === 'T3'
    
    if (!canCreatePolls) {
      throw new Error('Insufficient permissions to create polls')
    }

    const response = await authManager.authenticatedFetch(`${PO_BASE_URL}/v1/polls`, {
      method: 'POST',
      body: JSON.stringify(pollData),
    })

    if (!response.ok) {
      throw new Error(`Failed to create poll: ${response.statusText}`)
    }

    return response.json()
  },

  // Activate poll (admin function - requires admin permissions)
  async activatePoll(pollId: string): Promise<void> {
    const authManager = getApiAuthManager()
    const authContext = await authManager.getAuthContext()
    
    if (!authContext) {
      throw new Error('User not authenticated')
    }
    
    // Check permissions based on verification tier
    const userTier = authContext.user.verificationTier
    const canActivatePolls = userTier === 'T3'
    
    if (!canActivatePolls) {
      throw new Error('Insufficient permissions to activate polls')
    }

    const response = await authManager.authenticatedFetch(`${PO_BASE_URL}/v1/polls/activate?poll_id=${pollId}`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`Failed to activate poll: ${response.statusText}`)
    }
  },

  // Close poll (admin function - requires admin permissions)
  async closePoll(pollId: string): Promise<void> {
    const authManager = getApiAuthManager()
    const authContext = await authManager.getAuthContext()
    
    if (!authContext) {
      throw new Error('User not authenticated')
    }
    
    // Check permissions based on verification tier
    const userTier = authContext.user.verificationTier
    const canClosePolls = userTier === 'T3'
    
    if (!canClosePolls) {
      throw new Error('Insufficient permissions to close polls')
    }

    const response = await authManager.authenticatedFetch(`${PO_BASE_URL}/v1/polls/close?poll_id=${pollId}`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`Failed to close poll: ${response.statusText}`)
    }
  },

  // Submit vote (requires authentication)
  async submitVote(pollId: string, token: string, tag: string, choice: number): Promise<Vote> {
    const authManager = getApiAuthManager()
    const response = await authManager.authenticatedFetch(`${PO_BASE_URL}/v1/votes?poll_id=${pollId}`, {
      method: 'POST',
      body: JSON.stringify({
        token,
        tag,
        choice,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to submit vote: ${response.statusText}`)
    }

    return response.json()
  },

  // Get tally (requires authentication)
  async getTally(pollId: string): Promise<Tally> {
    const authManager = getApiAuthManager()
    const response = await authManager.authenticatedFetch(`${PO_BASE_URL}/v1/tally?poll_id=${pollId}`)
    
    if (!response.ok) {
      throw new Error(`Failed to get tally: ${response.statusText}`)
    }

    return response.json()
  },

  // Get commitment log (requires authentication)
  async getCommitmentLog(pollId: string): Promise<CommitmentLog> {
    const authManager = getApiAuthManager()
    const response = await authManager.authenticatedFetch(`${PO_BASE_URL}/v1/commitment?poll_id=${pollId}`)
    
    if (!response.ok) {
      throw new Error(`Failed to get commitment log: ${response.statusText}`)
    }

    return response.json()
  },

  // Verify vote proof (requires authentication)
  async verifyVoteProof(pollId: string, merkleLeaf: string, merkleProof: string[]): Promise<boolean> {
    const authManager = getApiAuthManager()
    const response = await authManager.authenticatedFetch(`${PO_BASE_URL}/v1/verify?poll_id=${pollId}`, {
      method: 'POST',
      body: JSON.stringify({
        merkle_leaf: merkleLeaf,
        merkle_proof: merkleProof,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to verify vote proof: ${response.statusText}`)
    }

    const result = await response.json()
    return result.verified || false
  },

  // Get dashboard data (requires authentication)
  async getDashboardData(): Promise<any> {
    const authManager = getApiAuthManager()
    const response = await authManager.authenticatedFetch(`${PO_BASE_URL}/v1/dashboard`)
    
    if (!response.ok) {
      throw new Error(`Failed to get dashboard data: ${response.statusText}`)
    }

    return response.json()
  },

  // Get geographic data (requires authentication)
  async getGeographicData(): Promise<any> {
    const authManager = getApiAuthManager()
    const response = await authManager.authenticatedFetch(`${PO_BASE_URL}/v1/dashboard/geographic`)
    
    if (!response.ok) {
      throw new Error(`Failed to get geographic data: ${response.statusText}`)
    }

    return response.json()
  },

  // Get demographics data (requires authentication)
  async getDemographicsData(): Promise<any> {
    const authManager = getApiAuthManager()
    const response = await authManager.authenticatedFetch(`${PO_BASE_URL}/v1/dashboard/demographics`)
    
    if (!response.ok) {
      throw new Error(`Failed to get demographics data: ${response.statusText}`)
    }

    return response.json()
  },

  // Get engagement data (requires authentication)
  async getEngagementData(): Promise<any> {
    const authManager = getApiAuthManager()
    const response = await authManager.authenticatedFetch(`${PO_BASE_URL}/v1/dashboard/engagement`)
    
    if (!response.ok) {
      throw new Error(`Failed to get engagement data: ${response.statusText}`)
    }

    return response.json()
  },
}

// Utility function to handle API errors
export const handleApiError = (error: any): string => {
  if (error instanceof AuthError) {
    return error instanceof Error ? error.message : "Unknown error"
  }
  if (error instanceof Error) {
    return error instanceof Error ? error.message : "Unknown error"
  }
  return 'An unexpected error occurred'
}

// Export for backward compatibility
export const apiAuthManager = typeof window !== 'undefined' ? getApiAuthManager() : null
