// API utility functions for communicating with backend services

const IA_BASE_URL = 'http://localhost:8081/api'
const PO_BASE_URL = 'http://localhost:8082/api'

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

// IA Service API functions
export const iaApi = {
  // Get token for voting
  async getToken(userStableId: string, pollId: string, tier: string = 'T1'): Promise<TokenResponse> {
    const response = await fetch(`${IA_BASE_URL}/v1/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

  // Get public key
  async getPublicKey(): Promise<{ public_key: string }> {
    const response = await fetch(`${IA_BASE_URL}/v1/public-key`)
    
    if (!response.ok) {
      throw new Error(`Failed to get public key: ${response.statusText}`)
    }

    return response.json()
  },

  // WebAuthn registration
  async beginRegistration(userStableId: string, email?: string) {
    const response = await fetch(`${IA_BASE_URL}/v1/webauthn/register/begin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const apiResponse = await fetch(`${IA_BASE_URL}/v1/webauthn/register/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

  // WebAuthn login
  async beginLogin(userStableId: string) {
    const response = await fetch(`${IA_BASE_URL}/v1/webauthn/login/begin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const apiResponse = await fetch(`${IA_BASE_URL}/v1/webauthn/login/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

// PO Service API functions
export const poApi = {
  // Get all polls
  async getPolls(): Promise<Poll[]> {
    const response = await fetch(`${PO_BASE_URL}/v1/polls/list`)
    
    if (!response.ok) {
      throw new Error(`Failed to get polls: ${response.statusText}`)
    }

    return response.json()
  },

  // Get specific poll
  async getPoll(pollId: string): Promise<Poll> {
    const response = await fetch(`${PO_BASE_URL}/v1/polls/get?id=${pollId}`)
    
    if (!response.ok) {
      throw new Error(`Failed to get poll: ${response.statusText}`)
    }

    return response.json()
  },

  // Create poll (admin function)
  async createPoll(pollData: {
    title: string
    description: string
    options: string[]
    start_time: string
    end_time: string
    sponsors?: string[]
  }): Promise<Poll> {
    const response = await fetch(`${PO_BASE_URL}/v1/polls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pollData),
    })

    if (!response.ok) {
      throw new Error(`Failed to create poll: ${response.statusText}`)
    }

    return response.json()
  },

  // Activate poll
  async activatePoll(pollId: string): Promise<void> {
    const response = await fetch(`${PO_BASE_URL}/v1/polls/activate?poll_id=${pollId}`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`Failed to activate poll: ${response.statusText}`)
    }
  },

  // Close poll
  async closePoll(pollId: string): Promise<void> {
    const response = await fetch(`${PO_BASE_URL}/v1/polls/close?poll_id=${pollId}`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`Failed to close poll: ${response.statusText}`)
    }
  },

  // Submit vote
  async submitVote(pollId: string, token: string, tag: string, choice: number): Promise<Vote> {
    const response = await fetch(`${PO_BASE_URL}/v1/votes?poll_id=${pollId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

  // Get tally
  async getTally(pollId: string): Promise<Tally> {
    const response = await fetch(`${PO_BASE_URL}/v1/tally?poll_id=${pollId}`)
    
    if (!response.ok) {
      throw new Error(`Failed to get tally: ${response.statusText}`)
    }

    return response.json()
  },

  // Get commitment log
  async getCommitmentLog(pollId: string): Promise<CommitmentLog> {
    const response = await fetch(`${PO_BASE_URL}/v1/commitment?poll_id=${pollId}`)
    
    if (!response.ok) {
      throw new Error(`Failed to get commitment log: ${response.statusText}`)
    }

    return response.json()
  },

  // Verify vote proof
  async verifyVoteProof(pollId: string, merkleLeaf: string, merkleProof: string[]): Promise<boolean> {
    const response = await fetch(`${PO_BASE_URL}/v1/verify?poll_id=${pollId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

  // Get dashboard data
  async getDashboardData(): Promise<any> {
    const response = await fetch(`${PO_BASE_URL}/v1/dashboard`)
    
    if (!response.ok) {
      throw new Error(`Failed to get dashboard data: ${response.statusText}`)
    }

    return response.json()
  },

  // Get geographic data
  async getGeographicData(): Promise<any> {
    const response = await fetch(`${PO_BASE_URL}/v1/dashboard/geographic`)
    
    if (!response.ok) {
      throw new Error(`Failed to get geographic data: ${response.statusText}`)
    }

    return response.json()
  },

  // Get demographics data
  async getDemographicsData(): Promise<any> {
    const response = await fetch(`${PO_BASE_URL}/v1/dashboard/demographics`)
    
    if (!response.ok) {
      throw new Error(`Failed to get demographics data: ${response.statusText}`)
    }

    return response.json()
  },

  // Get engagement data
  async getEngagementData(): Promise<any> {
    const response = await fetch(`${PO_BASE_URL}/v1/dashboard/engagement`)
    
    if (!response.ok) {
      throw new Error(`Failed to get engagement data: ${response.statusText}`)
    }

    return response.json()
  },
}

// Utility function to handle API errors
export const handleApiError = (error: any): string => {
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}
