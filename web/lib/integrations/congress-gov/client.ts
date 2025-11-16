/**
 * Congress.gov API Client
 * 
 * Official government data source for congressional information
 * Rate limits: 5,000 requests/day
 * 
 * @author Agent E
 * @date 2025-01-15
 */

import { logger } from '@/lib/utils/logger';

// Types for Congress.gov API responses
export type CongressGovCongress = {
  congress: number;
  name: string;
  startYear: string;
  endYear: string;
  sessions: Array<{
    chamber: string;
    number: number;
    startDate: string;
    type: string;
  }>;
}

export type CongressGovMember = {
  bioguideId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  party: string;
  state: string;
  district?: string;
  chamber: string;
  url: string;
  apiUri: string;
}

export type CongressGovBill = {
  congress: number;
  billId: string;
  billType: string;
  number: string;
  title: string;
  shortTitle?: string;
  introducedDate: string;
  sponsor: {
    bioguideId: string;
    fullName: string;
    party: string;
    state: string;
  };
  subjects: string[];
  summary?: {
    text: string;
    date: string;
  };
  url: string;
  apiUri: string;
}

export type CongressGovVote = {
  rollCall: number;
  congress: number;
  session: number;
  chamber: string;
  question: string;
  description: string;
  voteType: string;
  date: string;
  time: string;
  result: string;
  tieBreaker?: string;
  tieBreakerVote?: string;
  documentNumber?: string;
  documentTitle?: string;
  url: string;
  apiUri: string;
}

export type CongressGovApiResponse<T> = {
  results: T[];
  pagination?: {
    count: number;
    next?: string;
    previous?: string;
  };
}

export type CongressGovClientConfig = {
  apiKey: string;
  baseUrl?: string;
  rateLimit?: {
    requestsPerDay: number;
    requestsPerMinute: number;
  };
  timeout?: number;
}

export class CongressGovApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public apiResponse?: unknown
  ) {
    super(message);
    this.name = 'CongressGovApiError';
  }
}

export class CongressGovClient {
  private config: Required<CongressGovClientConfig>;
  private requestCount = 0;
  private lastRequestTime = 0;
  private dailyRequestCount = 0;
  private lastDailyReset = Date.now();

  constructor(config: CongressGovClientConfig) {
    this.config = Object.assign({
      baseUrl: 'https://api.congress.gov/v3',
      rateLimit: {
        requestsPerDay: 5000,
        requestsPerMinute: 100
      },
      timeout: 30000,
    }, config);

    // Reset daily counter at midnight
    this.scheduleDailyReset();
  }

  private scheduleDailyReset(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.dailyRequestCount = 0;
      this.lastDailyReset = Date.now();
      this.scheduleDailyReset();
    }, msUntilMidnight);
  }

  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, string | number> = {}
  ): Promise<T> {
    // Check rate limits
    this.checkRateLimits();

    const url = new URL(`${this.config.baseUrl}${endpoint}`);
    url.searchParams.set('api_key', this.config.apiKey);
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    const startTime = Date.now();
    
    try {
      logger.debug('Making Congress.gov API request', {
        endpoint,
        params,
        url: url.toString().replace(this.config.apiKey, '***'),
        requestCount: this.requestCount + 1,
        dailyRequestCount: this.dailyRequestCount + 1
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Choices-Platform/1.0'
        }
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      this.requestCount++;
      this.dailyRequestCount++;
      this.lastRequestTime = Date.now();

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new CongressGovApiError(
          `Congress.gov API error: ${response.status} ${response.statusText}`,
          response.status,
          errorData
        );
      }

      const data = await response.json();

      logger.debug('Congress.gov API response received', {
        endpoint,
        responseTime,
        status: response.status,
        dataKeys: Object.keys(data),
        requestCount: this.requestCount,
        dailyRequestCount: this.dailyRequestCount
      });

      return data;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof CongressGovApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new CongressGovApiError(
          `Request timeout after ${this.config.timeout}ms`,
          408
        );
      }

      logger.error('Congress.gov API request failed', {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      });

      throw new CongressGovApiError(
        `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  private checkRateLimits(): void {
    const now = Date.now();
    
    // Check if daily reset is needed (24 hours have passed since last reset)
    const timeSinceLastReset = now - this.lastDailyReset;
    if (timeSinceLastReset >= 24 * 60 * 60 * 1000) {
      this.dailyRequestCount = 0;
      this.lastDailyReset = now;
      logger.debug('Daily request counter reset', { lastReset: this.lastDailyReset });
    }
    
    // Check daily limit
    if (this.dailyRequestCount >= this.config.rateLimit.requestsPerDay) {
      throw new CongressGovApiError(
        `Daily rate limit exceeded: ${this.config.rateLimit.requestsPerDay} requests/day`,
        429
      );
    }

    // Check per-minute limit
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < 60000 && this.requestCount >= this.config.rateLimit.requestsPerMinute) {
      const waitTime = 60000 - timeSinceLastRequest;
      throw new CongressGovApiError(
        `Rate limit exceeded: ${this.config.rateLimit.requestsPerMinute} requests/minute. Wait ${Math.ceil(waitTime / 1000)} seconds`,
        429
      );
    }
  }

  // Congress information
  async getCongresses(): Promise<CongressGovCongress[]> {
    const response = await this.makeRequest<CongressGovApiResponse<CongressGovCongress>>('/congress');
    return response.results ?? [];
  }

  async getCurrentCongress(): Promise<CongressGovCongress> {
    const response = await this.getCongresses();
    const currentCongress = response[0]; // Most recent congress
    if (!currentCongress) {
      throw new Error('No congress data available');
    }
    return currentCongress;
  }

  // Member information
  async getMembers(params: {
    chamber?: 'house' | 'senate';
    congress?: number;
    limit?: number;
    offset?: number;
  } = {}): Promise<CongressGovMember[]> {
    const response = await this.makeRequest<CongressGovApiResponse<CongressGovMember>>('/member', params);
    return response.results ?? [];
  }

  async getMember(bioguideId: string): Promise<CongressGovMember> {
    const response = await this.makeRequest<CongressGovApiResponse<CongressGovMember>>(`/member/${bioguideId}`);
    const member = response.results[0];
    if (!member) {
      throw new Error(`Member with bioguide ID ${bioguideId} not found`);
    }
    return member;
  }

  async getMembersByState(state: string, chamber?: 'house' | 'senate'): Promise<CongressGovMember[]> {
    const params: Record<string, string> = { state };
    if (chamber) params.chamber = chamber;
    
    const response = await this.makeRequest<CongressGovApiResponse<CongressGovMember>>('/member', params);
    return response.results ?? [];
  }

  // Bill information
  async getBills(params: {
    congress?: number;
    billType?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<CongressGovBill[]> {
    const response = await this.makeRequest<CongressGovApiResponse<CongressGovBill>>('/bill', params);
    return response.results ?? [];
  }

  async getBill(congress: number, billId: string): Promise<CongressGovBill> {
    const response = await this.makeRequest<CongressGovApiResponse<CongressGovBill>>(`/bill/${congress}/${billId}`);
    const bill = response.results[0];
    if (!bill) {
      throw new Error(`Bill ${billId} in congress ${congress} not found`);
    }
    return bill;
  }

  async getBillsByMember(bioguideId: string, params: {
    congress?: number;
    limit?: number;
    offset?: number;
  } = {}): Promise<CongressGovBill[]> {
    const response = await this.makeRequest<CongressGovApiResponse<CongressGovBill>>(`/member/${bioguideId}/bills`, params);
    return response.results ?? [];
  }

  // Vote information
  async getVotes(params: {
    congress?: number;
    chamber?: 'house' | 'senate';
    limit?: number;
    offset?: number;
  } = {}): Promise<CongressGovVote[]> {
    const response = await this.makeRequest<CongressGovApiResponse<CongressGovVote>>('/vote', params);
    return response.results ?? [];
  }

  async getVote(congress: number, session: number, rollCall: number): Promise<CongressGovVote> {
    const response = await this.makeRequest<CongressGovApiResponse<CongressGovVote>>(`/vote/${congress}/${session}/${rollCall}`);
    const vote = response.results[0];
    if (!vote) {
      throw new Error(`Vote ${rollCall} in congress ${congress}, session ${session} not found`);
    }
    return vote;
  }

  // Utility methods
  getUsageMetrics(): {
    totalRequests: number;
    dailyRequests: number;
    dailyLimit: number;
    requestsPerMinute: number;
    lastRequestTime: number;
  } {
    return {
      totalRequests: this.requestCount,
      dailyRequests: this.dailyRequestCount,
      dailyLimit: this.config.rateLimit.requestsPerDay,
      requestsPerMinute: this.config.rateLimit.requestsPerMinute,
      lastRequestTime: this.lastRequestTime
    };
  }

  getRateLimitStatus(): {
    dailyRemaining: number;
    dailyUsed: number;
    dailyLimit: number;
    canMakeRequest: boolean;
  } {
    const dailyRemaining = this.config.rateLimit.requestsPerDay - this.dailyRequestCount;
    const canMakeRequest = dailyRemaining > 0;

    return {
      dailyRemaining,
      dailyUsed: this.dailyRequestCount,
      dailyLimit: this.config.rateLimit.requestsPerDay,
      canMakeRequest
    };
  }
}

/**
 * Create a Congress.gov API client with default configuration
 */
export function createCongressGovClient(): CongressGovClient {
  const apiKey = process.env.CONGRESS_GOV_API_KEY;
  
  if (!apiKey) {
    throw new CongressGovApiError('CONGRESS_GOV_API_KEY environment variable is required', 500);
  }

  return new CongressGovClient({
    apiKey,
    rateLimit: {
      requestsPerDay: 5000, // Official limit
      requestsPerMinute: 100 // Conservative limit
    }
  });
}
