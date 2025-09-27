import { logger } from '@/lib/logger';
import { devLog } from '@/lib/logger';

// Types
export type Poll = {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'closed' | 'draft';
  options: string[];
  total_votes: number;
  participation: number;
  sponsors: string[];
  created_at: string;
  end_time: string;
  results?: PollResults;
  category?: string;
  tags?: string[];
  is_mock?: boolean; // Flag to identify mock data
  created_by?: string; // User ID for user-generated polls
}

export type PollResults = {
  [key: number]: number;
  total: number;
}

export type CreatePollRequest = {
  title: string;
  description: string;
  options: string[];
  end_time: string;
  category?: string;
  tags?: string[];
  sponsors?: string[];
}

export type VoteRequest = {
  pollId: string;
  choice: number;
}

export type VoteResponse = {
  success: boolean;
  voteId: string;
  message: string;
  verificationToken?: string;
}

export type VerificationResponse = {
  success: boolean;
  verified: boolean;
  message: string;
  merkleProof?: string[];
}

// Mock data for testing
const mockPolls: Poll[] = [
  {
    id: 'mock-1',
    title: 'Climate Action 2024',
    description: 'Which climate initiatives should be prioritized in the coming year?',
    status: 'active',
    options: [
      'Renewable Energy Investment',
      'Carbon Tax Implementation', 
      'Electric Vehicle Infrastructure',
      'Green Building Standards',
      'Public Transportation'
    ],
    total_votes: 2847,
    participation: 78,
    sponsors: ['Environmental Coalition', 'Green Future Initiative'],
    created_at: '2024-01-15T10:00:00Z',
    end_time: '2024-02-15T23:59:59Z',
    category: 'climate',
    is_mock: true,
    results: {
      0: 1281, // 45%
      1: 655,  // 23%
      2: 512,  // 18%
      3: 256,  // 9%
      4: 143,  // 5%
      total: 2847
    }
  },
  {
    id: 'mock-2',
    title: 'Technology Priorities',
    description: 'What emerging technologies should receive government funding?',
    status: 'active',
    options: [
      'Artificial Intelligence Research',
      'Quantum Computing Development',
      'Cybersecurity Infrastructure',
      'Digital Privacy Tools',
      'Blockchain Applications'
    ],
    total_votes: 1956,
    participation: 65,
    sponsors: ['Tech Innovation Council'],
    created_at: '2024-01-10T14:30:00Z',
    end_time: '2024-02-10T23:59:59Z',
    category: 'technology',
    is_mock: true,
    results: {
      0: 782,  // 40%
      1: 391,  // 20%
      2: 391,  // 20%
      3: 195,  // 10%
      4: 197,  // 10%
      total: 1956
    }
  },
  {
    id: 'mock-3',
    title: 'Education Reform',
    description: 'Which educational improvements should be implemented first?',
    status: 'active',
    options: [
      'Digital Learning Platforms',
      'Teacher Training Programs',
      'Student Mental Health Support',
      'STEM Curriculum Enhancement',
      'Accessibility Improvements'
    ],
    total_votes: 3421,
    participation: 82,
    sponsors: ['Education Foundation', 'Teachers Union'],
    created_at: '2024-01-05T09:15:00Z',
    end_time: '2024-02-05T23:59:59Z',
    category: 'education',
    is_mock: true,
    results: {
      0: 1368, // 40%
      1: 1026, // 30%
      2: 684,  // 20%
      3: 342,  // 10%
      4: 1,    // 0%
      total: 3421
    }
  },
  {
    id: 'mock-4',
    title: 'Healthcare Access',
    description: 'How should we improve healthcare accessibility?',
    status: 'closed',
    options: [
      'Universal Healthcare Coverage',
      'Telemedicine Expansion',
      'Mental Health Services',
      'Preventive Care Programs',
      'Rural Healthcare Centers'
    ],
    total_votes: 4123,
    participation: 91,
    sponsors: ['Healthcare Alliance'],
    created_at: '2023-12-01T08:00:00Z',
    end_time: '2024-01-01T23:59:59Z',
    category: 'healthcare',
    is_mock: true,
    results: {
      0: 1855, // 45%
      1: 1237, // 30%
      2: 824,  // 20%
      3: 206,  // 5%
      4: 1,    // 0%
      total: 4123
    }
  },
  {
    id: 'mock-5',
    title: 'Public Transportation',
    description: 'Which transportation improvements are most needed?',
    status: 'active',
    options: [
      'Electric Bus Fleet',
      'Bike Lane Network',
      'Subway System Expansion',
      'High-Speed Rail',
      'Car-Sharing Programs'
    ],
    total_votes: 1567,
    participation: 58,
    sponsors: ['Transportation Authority'],
    created_at: '2024-01-12T11:45:00Z',
    end_time: '2024-02-12T23:59:59Z',
    category: 'transportation',
    is_mock: true,
    results: {
      0: 627,  // 40%
      1: 470,  // 30%
      2: 313,  // 20%
      3: 157,  // 10%
      4: 0,    // 0%
      total: 1567
    }
  },
  {
    id: 'mock-6',
    title: 'Digital Privacy Rights',
    description: 'What privacy protections should be prioritized?',
    status: 'draft',
    options: [
      'Data Encryption Standards',
      'Consent Management',
      'Right to be Forgotten',
      'Transparency Requirements',
      'Privacy by Design'
    ],
    total_votes: 0,
    participation: 0,
    sponsors: ['Digital Rights Foundation'],
    created_at: '2024-01-18T16:20:00Z',
    end_time: '2024-03-18T23:59:59Z',
    category: 'privacy',
    is_mock: true
  }
];

// In-memory storage for user-generated polls (will be replaced by backend)
const userPolls: Poll[] = [];

// Configuration
const config = {
  useMockData: true, // Toggle between mock and real data
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
  enableUserPolls: true, // Allow user-generated polls
  mockDataEnabled: true // Keep mock data available for testing
};

class PollService {
  constructor() {
    // Removed IA/PO auth manager dependency
  }

  // Get all polls (mock + user-generated)
  async getPolls(): Promise<Poll[]> {
    try {
      let polls: Poll[] = [];

      // Add mock data if enabled
      if (config.mockDataEnabled) {
        polls = [...mockPolls];
      }

      // Add user-generated polls
      if (config.enableUserPolls) {
        const userPollsData = await this.getUserPolls();
        polls = [...polls, ...userPollsData];
      }

      // If not using mock data, fetch from API
      if (!config.useMockData) {
        const apiPolls = await this.fetchPollsFromAPI();
        polls = [...polls, ...apiPolls];
      }

      return polls.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      devLog('Error fetching polls:', error);
      // Fallback to mock data if API fails
      return config.mockDataEnabled ? mockPolls : [];
    }
  }

  // Get a specific poll
  async getPoll(id: string): Promise<Poll | null> {
    try {
      // Check mock data first
      const mockPoll = mockPolls.find(poll => poll.id === id);
      if (mockPoll) return mockPoll;

      // Check user-generated polls
      const userPoll = userPolls.find(poll => poll.id === id);
      if (userPoll) return userPoll;

      // Fetch from API if not found locally
      if (!config.useMockData) {
        return await this.fetchPollFromAPI(id);
      }

      return null;
    } catch (error) {
      devLog('Error fetching poll:', error);
      return null;
    }
  }

  // Create a new poll
  async createPoll(pollData: CreatePollRequest): Promise<Poll | null> {
    try {
      if (!config.enableUserPolls) {
        throw new Error('User-generated polls are disabled');
      }

      const newPoll: Poll = Object.assign({
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'active' as const,
        total_votes: 0,
        participation: 0,
        sponsors: pollData.sponsors || [],
        created_at: new Date().toISOString(),
        is_mock: false,
        created_by: await this.getCurrentUserId()
      }, pollData);

      // Add to local storage (will be replaced by API call)
      userPolls.push(newPoll);

      // If API is available, also save to backend
      if (!config.useMockData) {
        await this.savePollToAPI(newPoll);
      }

      return newPoll;
    } catch (error) {
      devLog('Error creating poll:', error);
      return null;
    }
  }

  // Submit a vote
  async submitVote(pollId: string, choice: number): Promise<VoteResponse> {
    try {
      // Check if poll exists
      const poll = await this.getPoll(pollId);
      if (!poll) {
        throw new Error('Poll not found');
      }

      if (poll.status !== 'active') {
        throw new Error('Poll is not active');
      }

      // If it's a mock poll, simulate voting
      if (poll.is_mock) {
        return await this.simulateMockVote(pollId, choice);
      }

      // For user-generated polls, use API
      if (!config.useMockData) {
        return await this.submitVoteToAPI(pollId, choice);
      }

      // Fallback to local storage for user polls
      return await this.submitVoteToLocal(pollId, choice);
    } catch (error) {
      devLog('Error submitting vote:', error);
      return {
        success: false,
        voteId: '',
        message: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : 'Failed to submit vote'
      };
    }
  }

  // Verify a vote
  async verifyVote(voteId: string): Promise<VerificationResponse> {
    try {
      // For now, simulate verification
      // In real implementation, this would call the verification API
      await new Promise(resolve => setTimeout(resolve, 500));

      devLog(`Verifying vote: ${voteId}`);

      return {
        success: true,
        verified: true,
        message: `Vote ${voteId} verified successfully with Merkle proof`,
        merkleProof: ['hash1', 'hash2', 'hash3']
      };
    } catch (error) {
      devLog('Error verifying vote:', error);
      return {
        success: false,
        verified: false,
        message: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : 'Verification failed'
      };
    }
  }

  // Get user-generated polls
  private async getUserPolls(): Promise<Poll[]> {
    // For now, return from local storage
    // In real implementation, this would fetch from API
    return userPolls;
  }

  // Get current user ID
  private async getCurrentUserId(): Promise<string> {
    // TODO: Implement with Supabase auth
    return 'anonymous';
  }

  // Simulate mock vote
  private async simulateMockVote(pollId: string, choice: number): Promise<VoteResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

    // Log the mock vote for debugging
    devLog(`Mock vote submitted for poll ${pollId}, choice ${choice}`);

    return {
      success: true,
      voteId: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: `Vote submitted successfully for poll ${pollId}!`
    };
  }

  // Submit vote to local storage
  private async submitVoteToLocal(pollId: string, choice: number): Promise<VoteResponse> {
    const pollIndex = userPolls.findIndex(poll => poll.id === pollId);
    if (pollIndex === -1) {
      throw new Error('Poll not found');
    }

    const poll = userPolls[pollIndex];
    if (!poll) {
      throw new Error('Poll not found');
    }
    poll.total_votes += 1;

    // Initialize results if not exists
    if (!poll.results) {
      poll.results = { total: 0 };
    }

    poll.results[choice] = (poll.results[choice] || 0) + 1;
    poll.results.total += 1;

    // Update participation rate
    poll.participation = Math.round((poll.total_votes / 100) * 100); // Simplified calculation

    return {
      success: true,
      voteId: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: 'Vote submitted successfully!'
    };
  }

  // API methods (API-001 integration)
  private async fetchPollsFromAPI(): Promise<Poll[]> {
    try {
      const response = await fetch('/api/polls');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch polls: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch polls');
      }
      
      // Transform API response to match Poll interface
      return data.polls?.map((apiPoll: any) => ({
        id: apiPoll.poll_id,
        title: apiPoll.title,
        description: apiPoll.description || '',
        status: apiPoll.status || 'active',
        options: apiPoll.options || [],
        total_votes: apiPoll.total_votes || 0,
        participation: apiPoll.participation_rate || 0,
        sponsors: [],
        created_at: apiPoll.created_at || new Date().toISOString(),
        end_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
        category: apiPoll.category,
        tags: apiPoll.tags || [],
        is_mock: false
      })) || [];
    } catch (error) {
      logger.error('Error fetching polls from API:', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  private async fetchPollFromAPI(id: string): Promise<Poll | null> {
    try {
      const response = await fetch(`/api/polls/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch poll: ${response.statusText}`);
      }
      
      const apiPoll = await response.json();
      
      // Transform API response to match Poll interface
      return {
        id: apiPoll.poll_id,
        title: apiPoll.title,
        description: apiPoll.description || '',
        status: apiPoll.status || 'active',
        options: apiPoll.options || [],
        total_votes: apiPoll.total_votes || 0,
        participation: apiPoll.participation_rate || 0,
        sponsors: [],
        created_at: apiPoll.created_at || new Date().toISOString(),
        end_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
        category: apiPoll.category,
        tags: apiPoll.tags || [],
        is_mock: false
      };
    } catch (error) {
      logger.error('Error fetching poll from API:', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  private async savePollToAPI(poll: Poll): Promise<void> {
    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: poll.title,
          description: poll.description,
          options: poll.options,
          end_time: poll.end_time,
          category: poll.category,
          tags: poll.tags,
          sponsors: poll.sponsors
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save poll: ${response.statusText}`);
      }
      
      devLog('Poll saved to API successfully');
    } catch (error) {
      logger.error('Error saving poll to API:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private async submitVoteToAPI(pollId: string, choice: number): Promise<VoteResponse> {
    try {
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          choice,
          privacy_level: 'public'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to submit vote: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      return {
        success: result.success || true,
        voteId: result.vote_id || `vote_${Date.now()}`,
        message: result.message || 'Vote submitted successfully!'
      };
    } catch (error) {
      logger.error('Error submitting vote to API:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  // Configuration methods
  setUseMockData(useMock: boolean) {
    config.useMockData = useMock;
  }

  setEnableUserPolls(enable: boolean) {
    config.enableUserPolls = enable;
  }

  setMockDataEnabled(enabled: boolean) {
    config.mockDataEnabled = enabled;
  }

  getConfig() {
    return Object.assign({}, config);
  }
}

// Export singleton instance
export const pollService = new PollService();
export default pollService;
