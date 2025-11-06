/**
 * Open States API Client
 * 
 * State legislature data source for comprehensive state government information
 * Rate limits: 10,000 requests/day
 * 
 * @author Agent E
 * @date 2025-01-15
 */

import { logger } from '@/lib/utils/logger';

// Types for Open States API responses
export type OpenStatesState = {
  abbreviation: string;
  name: string;
  legislature_name: string;
  legislature_url: string;
  capitol_timezone: string;
  latest_update: string;
  session_details: Array<{
    session: string;
    start_date: string;
    end_date: string;
    display_name: string;
    type: string;
  }>;
  feature_flags: string[];
  chambers: {
    [chamber: string]: {
      name: string;
      title: string;
      type: string;
    };
  };
}

export type OpenStatesLegislator = {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  full_name: string;
  party: string;
  chamber: string;
  district: string;
  state: string;
  url: string;
  photo_url?: string;
  email?: string;
  offices: Array<{
    type: string;
    name: string;
    address: string;
    phone?: string;
    email?: string;
    fax?: string;
  }>;
  roles: Array<{
    type: string;
    title: string;
    jurisdiction: string;
    start_date: string;
    end_date?: string;
  }>;
  sources: Array<{
    url: string;
    note: string;
  }>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type OpenStatesBill = {
  id: string;
  title: string;
  chamber: string;
  session: string;
  state: string;
  bill_id: string;
  bill_type: string;
  subjects: string[];
  type: string[];
  sponsors: Array<{
    name: string;
    chamber: string;
    district: string;
    type: string;
  }>;
  actions: Array<{
    date: string;
    action: string;
    actor: string;
    type: string;
    classification: string[];
  }>;
  versions: Array<{
    date: string;
    note: string;
    links: Array<{
      media_type: string;
      url: string;
    }>;
  }>;
  documents: Array<{
    date: string;
    note: string;
    links: Array<{
      media_type: string;
      url: string;
    }>;
  }>;
  votes: Array<{
    date: string;
    motion: string;
    result: string;
    total_yes: number;
    total_no: number;
    total_other: number;
    other_count: number;
    yes_count: number;
    no_count: number;
  }>;
  sources: Array<{
    url: string;
    note: string;
  }>;
  created_at: string;
  updated_at: string;
}

export type OpenStatesVote = {
  id: string;
  bill_id: string;
  chamber: string;
  session: string;
  state: string;
  date: string;
  motion: string;
  result: string;
  total_yes: number;
  total_no: number;
  total_other: number;
  other_count: number;
  yes_count: number;
  no_count: number;
  votes: Array<{
    legislator: string;
    vote: string;
    name: string;
  }>;
  sources: Array<{
    url: string;
    note: string;
  }>;
  created_at: string;
  updated_at: string;
}

export type OpenStatesCommittee = {
  id: string;
  name: string;
  chamber: string;
  state: string;
  subcommittee: boolean;
  parent_id?: string;
  members: Array<{
    name: string;
    role: string;
    legislator: string;
  }>;
  sources: Array<{
    url: string;
    note: string;
  }>;
  created_at: string;
  updated_at: string;
}

export type OpenStatesClientConfig = {
  apiKey: string;
  baseUrl?: string;
  rateLimit?: {
    requestsPerDay: number;
    requestsPerMinute: number;
  };
  timeout?: number;
}

export class OpenStatesApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public apiResponse?: unknown
  ) {
    super(message);
    this.name = 'OpenStatesApiError';
  }
}

export class OpenStatesClient {
  private config: Required<OpenStatesClientConfig>;
  private requestCount = 0;
  private lastRequestTime = 0;
  private dailyRequestCount = 0;
  private lastDailyReset = Date.now();

  constructor(config: OpenStatesClientConfig) {
    this.config = Object.assign({
      baseUrl: 'https://open.pluralpolicy.com/api/v1',
      rateLimit: {
        requestsPerDay: 10000,
        requestsPerMinute: 200
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
    url.searchParams.set('apikey', this.config.apiKey);
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    const startTime = Date.now();
    
    try {
      logger.debug('Making Open States API request', {
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
        throw new OpenStatesApiError(
          `Open States API error: ${response.status} ${response.statusText}`,
          response.status,
          errorData
        );
      }

      const data = await response.json();

      logger.debug('Open States API response received', {
        endpoint,
        responseTime,
        status: response.status,
        dataType: Array.isArray(data) ? 'array' : typeof data,
        dataLength: Array.isArray(data) ? data.length : Object.keys(data).length,
        requestCount: this.requestCount,
        dailyRequestCount: this.dailyRequestCount
      });

      return data;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof OpenStatesApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new OpenStatesApiError(
          `Request timeout after ${this.config.timeout}ms`,
          408
        );
      }

      logger.error('Open States API request failed', {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      });

      throw new OpenStatesApiError(
        `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  private checkRateLimits(): void {
    const now = Date.now();
    
    // Check daily limit
    if (this.dailyRequestCount >= this.config.rateLimit.requestsPerDay) {
      throw new OpenStatesApiError(
        `Daily rate limit exceeded: ${this.config.rateLimit.requestsPerDay} requests/day`,
        429
      );
    }

    // Check per-minute limit
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < 60000 && this.requestCount >= this.config.rateLimit.requestsPerMinute) {
      const waitTime = 60000 - timeSinceLastRequest;
      throw new OpenStatesApiError(
        `Rate limit exceeded: ${this.config.rateLimit.requestsPerMinute} requests/minute. Wait ${Math.ceil(waitTime / 1000)} seconds`,
        429
      );
    }
  }

  // State information
  async getStates(): Promise<OpenStatesState[]> {
    return await this.makeRequest<OpenStatesState[]>('/metadata/');
  }

  async getState(abbreviation: string): Promise<OpenStatesState> {
    const states = await this.getStates();
    const state = states.find(s => s.abbreviation.toLowerCase() === abbreviation.toLowerCase());
    if (!state) {
      throw new OpenStatesApiError(`State not found: ${abbreviation}`, 404);
    }
    return state;
  }

  // Legislator information
  async getLegislators(params: {
    state?: string;
    chamber?: string;
    active?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<OpenStatesLegislator[]> {
    const queryParams: Record<string, string | number> = {};
    if (params.state) queryParams.state = params.state;
    if (params.chamber) queryParams.chamber = params.chamber;
    if (params.active !== undefined) queryParams.active = params.active ? 'true' : 'false';
    if (params.limit) queryParams.limit = params.limit;
    if (params.offset) queryParams.offset = params.offset;
    
    return await this.makeRequest<OpenStatesLegislator[]>('/legislators/', queryParams);
  }

  async getLegislator(id: string): Promise<OpenStatesLegislator> {
    return await this.makeRequest<OpenStatesLegislator>(`/legislators/${id}/`);
  }

  async getLegislatorsByState(state: string, chamber?: string): Promise<OpenStatesLegislator[]> {
    const params: Record<string, string> = { state };
    if (chamber) params.chamber = chamber;
    return await this.makeRequest<OpenStatesLegislator[]>('/legislators/', params);
  }

  // Bill information
  async getBills(params: {
    state?: string;
    chamber?: string;
    session?: string;
    subject?: string;
    sponsor?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<OpenStatesBill[]> {
    return await this.makeRequest<OpenStatesBill[]>('/bills/', params);
  }

  async getBill(id: string): Promise<OpenStatesBill> {
    return await this.makeRequest<OpenStatesBill>(`/bills/${id}/`);
  }

  async getBillsByState(state: string, session?: string): Promise<OpenStatesBill[]> {
    const params: Record<string, string> = { state };
    if (session) params.session = session;
    return await this.makeRequest<OpenStatesBill[]>('/bills/', params);
  }

  async getBillsByLegislator(legislatorId: string, params: {
    state?: string;
    session?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<OpenStatesBill[]> {
    return await this.makeRequest<OpenStatesBill[]>(`/legislators/${legislatorId}/bills/`, params);
  }

  // Vote information
  async getVotes(params: {
    state?: string;
    chamber?: string;
    session?: string;
    bill?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<OpenStatesVote[]> {
    return await this.makeRequest<OpenStatesVote[]>('/votes/', params);
  }

  async getVote(id: string): Promise<OpenStatesVote> {
    return await this.makeRequest<OpenStatesVote>(`/votes/${id}/`);
  }

  async getVotesByBill(billId: string): Promise<OpenStatesVote[]> {
    return await this.makeRequest<OpenStatesVote[]>('/votes/', { bill: billId });
  }

  // Committee information
  async getCommittees(params: {
    state?: string;
    chamber?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<OpenStatesCommittee[]> {
    return await this.makeRequest<OpenStatesCommittee[]>('/committees/', params);
  }

  async getCommittee(id: string): Promise<OpenStatesCommittee> {
    return await this.makeRequest<OpenStatesCommittee>(`/committees/${id}/`);
  }

  async getCommitteesByState(state: string, chamber?: string): Promise<OpenStatesCommittee[]> {
    const params: Record<string, string> = { state };
    if (chamber) params.chamber = chamber;
    return await this.makeRequest<OpenStatesCommittee[]>('/committees/', params);
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
 * Create an Open States API client with default configuration
 */
export function createOpenStatesClient(): OpenStatesClient {
  const apiKey = process.env.OPEN_STATES_API_KEY;
  
  if (!apiKey) {
    throw new OpenStatesApiError('OPEN_STATES_API_KEY environment variable is required', 500);
  }

  return new OpenStatesClient({
    apiKey,
    rateLimit: {
      requestsPerDay: 10000, // Official limit
      requestsPerMinute: 200 // Conservative limit
    }
  });
}
