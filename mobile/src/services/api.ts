import { 
  TokenResponse, 
  Poll, 
  Tally, 
  CommitmentLog, 
  DashboardData,
  Vote 
} from '../types';

// Network configuration - use your computer's IP address for mobile device access
// If you're testing on the same computer, use localhost
// If you're testing on a phone, use your computer's IP address
const getBaseUrls = () => {
  // You can change this to 'localhost' if testing on the same computer
  const host = '10.0.0.184'; // Your computer's IP address
  return {
    IA_BASE_URL: `http://${host}:8081/api`,
    PO_BASE_URL: `http://${host}:8082/api`
  };
};

const { IA_BASE_URL, PO_BASE_URL } = getBaseUrls();

class ApiService {
  // IA Service API functions
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
    });

    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.statusText}`);
    }

    return response.json();
  }

  async getPublicKey(): Promise<{ public_key: string }> {
    const response = await fetch(`${IA_BASE_URL}/v1/public-key`);
    
    if (!response.ok) {
      throw new Error(`Failed to get public key: ${response.statusText}`);
    }

    return response.json();
  }

  // PO Service API functions
  async getPolls(): Promise<Poll[]> {
    const response = await fetch(`${PO_BASE_URL}/v1/polls/list`);
    
    if (!response.ok) {
      throw new Error(`Failed to get polls: ${response.statusText}`);
    }

    return response.json();
  }

  async getPoll(pollId: string): Promise<Poll> {
    const response = await fetch(`${PO_BASE_URL}/v1/polls/get?id=${pollId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get poll: ${response.statusText}`);
    }

    return response.json();
  }

  async submitVote(vote: Vote): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${PO_BASE_URL}/v1/votes?poll_id=${vote.poll_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vote),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit vote: ${response.statusText}`);
    }

    return response.json();
  }

  async getTally(pollId: string): Promise<Tally> {
    const response = await fetch(`${PO_BASE_URL}/v1/tally?poll_id=${pollId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get tally: ${response.statusText}`);
    }

    return response.json();
  }

  async getCommitmentLog(pollId: string): Promise<CommitmentLog> {
    const response = await fetch(`${PO_BASE_URL}/v1/commitment?poll_id=${pollId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get commitment log: ${response.statusText}`);
    }

    return response.json();
  }

  async verifyVote(pollId: string, voteData: any): Promise<{ verified: boolean }> {
    const response = await fetch(`${PO_BASE_URL}/v1/verify?poll_id=${pollId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(voteData),
    });

    if (!response.ok) {
      throw new Error(`Failed to verify vote: ${response.statusText}`);
    }

    return response.json();
  }

  // Dashboard API functions
  async getDashboardData(): Promise<DashboardData> {
    const response = await fetch(`${PO_BASE_URL}/v1/dashboard`);
    
    if (!response.ok) {
      throw new Error(`Failed to get dashboard data: ${response.statusText}`);
    }

    return response.json();
  }

  async getPollMetrics(pollId: string): Promise<any> {
    const response = await fetch(`${PO_BASE_URL}/v1/dashboard/metrics?poll_id=${pollId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get poll metrics: ${response.statusText}`);
    }

    return response.json();
  }

  async getGeographicData(pollId: string): Promise<any> {
    const response = await fetch(`${PO_BASE_URL}/v1/dashboard/geographic?poll_id=${pollId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get geographic data: ${response.statusText}`);
    }

    return response.json();
  }

  async getDemographics(pollId: string): Promise<any> {
    const response = await fetch(`${PO_BASE_URL}/v1/dashboard/demographics?poll_id=${pollId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get demographics: ${response.statusText}`);
    }

    return response.json();
  }

  async getEngagementMetrics(): Promise<any> {
    const response = await fetch(`${PO_BASE_URL}/v1/dashboard/engagement`);
    
    if (!response.ok) {
      throw new Error(`Failed to get engagement metrics: ${response.statusText}`);
    }

    return response.json();
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${PO_BASE_URL}/healthz`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiService = new ApiService();
