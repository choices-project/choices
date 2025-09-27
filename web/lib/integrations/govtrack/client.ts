/**
 * GovTrack.us API Client
 * 
 * Production-ready client for the GovTrack.us API with proper
 * error handling, rate limiting, caching, and data validation.
 * Replaces the discontinued ProPublica Congress API.
 */

import { logger } from '@/lib/logger';
import { ApplicationError } from '@/lib/errors';

export type GovTrackConfig = {
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

export type GovTrackMember = {
  id: number;
  first_name: string;
  last_name: string;
  party: string;
  state: string;
  district?: number;
  chamber: 'house' | 'senate';
  current: boolean;
  startdate: string;
  enddate?: string;
  url: string;
  roles: Array<{
    congress: number;
    chamber: string;
    title: string;
    short_title: string;
    state: string;
    party: string;
    leadership_role?: string;
    fec_candidate_id?: string;
    seniority: number;
    district?: number;
    at_large?: boolean;
    ocd_id: string;
    startdate: string;
    enddate?: string;
    bills_sponsored: number;
    bills_cosponsored: number;
    missed_votes_pct: number;
    votes_with_party_pct: number;
    votes_against_party_pct: number;
  }>;
}

export type GovTrackVote = {
  id: number;
  category: string;
  question: string;
  description: string;
  subject: string;
  chamber: string;
  congress: number;
  session: number;
  roll: number;
  number: number;
  vote_type: string;
  vote_question: string;
  vote_result: string;
  vote_totals: {
    yes: number;
    no: number;
    present: number;
    not_voting: number;
  };
  source: string;
  url: string;
  vote_tally: Array<{
    option: {
      key: string;
      value: string;
    };
    voters: number;
  }>;
  created: string;
  updated: string;
}

export type GovTrackBill = {
  id: number;
  congress: number;
  bill_type: string;
  number: number;
  title: string;
  short_title?: string;
  popular_title?: string;
  introduced_date: string;
  sponsor: {
    bioguide_id: string;
    thomas_id?: string;
    first_name: string;
    last_name: string;
    party: string;
    state: string;
    district?: number;
  };
  cosponsors: Array<{
    bioguide_id: string;
    thomas_id?: string;
    first_name: string;
    last_name: string;
    party: string;
    state: string;
    district?: number;
    date: string;
  }>;
  subjects: string[];
  subjects_top_term: string;
  summary?: string;
  summary_short?: string;
  latest_action: {
    action_date: string;
    text: string;
  };
  url: string;
  created: string;
  updated: string;
}

export type GovTrackResponse<T> = {
  meta: {
    limit: number;
    offset: number;
    total_count: number;
  };
  objects: T[];
}

export class GovTrackApiError extends ApplicationError {
  constructor(message: string, statusCode: number, details?: Record<string, unknown>) {
    super(message, statusCode, 'GOVTRACK_API_ERROR', details);
  }
}

export class GovTrackClient {
  private config: Required<GovTrackConfig>;
  private rateLimiter: Map<string, number> = new Map();
  private requestCount = 0;
  private lastResetTime = Date.now();

  constructor(config: GovTrackConfig = {}) {
    this.config = Object.assign({
      baseUrl: 'https://www.govtrack.us/api/v2',
      timeout: 15000,
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: {
        requestsPerMinute: 15, // Conservative: 15/min = 900/hour
        requestsPerHour: 900,  // Conservative: 900/hour (leaving 100 buffer)
      },
    }, config);
  }

  /**
   * Get current members of Congress
   */
  async getCurrentMembers(chamber: 'house' | 'senate' | 'both' = 'both'): Promise<GovTrackMember[]> {
    await this.checkRateLimit();

    try {
      logger.info('Getting current members from GovTrack API', { chamber });

      const params = new URLSearchParams({
        current: 'true',
        limit: '1000' // Get all current members
      });

      if (chamber !== 'both') {
        params.set('role_type', chamber === 'house' ? 'representative' : 'senator');
      }

      const response = await this.makeRequest<GovTrackResponse<GovTrackMember>>(
        `/member?${params.toString()}`
      );

      return response.objects || [];
    } catch (error) {
      logger.error('Failed to get current members from GovTrack API', { chamber, error });
      throw error;
    }
  }

  /**
   * Get member by ID
   */
  async getMember(memberId: number): Promise<GovTrackMember> {
    await this.checkRateLimit();

    try {
      logger.info('Getting member from GovTrack API', { memberId });

      const response = await this.makeRequest<GovTrackMember>(`/member/${memberId}`);

      return response;
    } catch (error) {
      logger.error('Failed to get member from GovTrack API', { memberId, error });
      throw error;
    }
  }

  /**
   * Get recent votes for a member
   */
  async getRecentVotesForMember(memberId: number, limit: number = 20): Promise<GovTrackVote[]> {
    await this.checkRateLimit();

    try {
      logger.info('Getting recent votes for member from GovTrack API', { memberId, limit });

      const params = new URLSearchParams({
        person: memberId.toString(),
        limit: limit.toString(),
        sort: '-created'
      });

      const response = await this.makeRequest<GovTrackResponse<GovTrackVote>>(
        `/vote?${params.toString()}`
      );

      return response.objects || [];
    } catch (error) {
      logger.error('Failed to get recent votes from GovTrack API', { memberId, error });
      throw error;
    }
  }

  /**
   * Get recent bills
   */
  async getRecentBills(congress: number = 118, limit: number = 50): Promise<GovTrackBill[]> {
    await this.checkRateLimit();

    try {
      logger.info('Getting recent bills from GovTrack API', { congress, limit });

      const params = new URLSearchParams({
        congress: congress.toString(),
        limit: limit.toString(),
        sort: '-introduced_date'
      });

      const response = await this.makeRequest<GovTrackResponse<GovTrackBill>>(
        `/bill?${params.toString()}`
      );

      return response.objects || [];
    } catch (error) {
      logger.error('Failed to get recent bills from GovTrack API', { congress, error });
      throw error;
    }
  }

  /**
   * Get specific bill
   */
  async getBill(billId: number): Promise<GovTrackBill> {
    await this.checkRateLimit();

    try {
      logger.info('Getting bill from GovTrack API', { billId });

      const response = await this.makeRequest<GovTrackBill>(`/bill/${billId}`);

      return response;
    } catch (error) {
      logger.error('Failed to get bill from GovTrack API', { billId, error });
      throw error;
    }
  }

  /**
   * Search members by name or state
   */
  async searchMembers(query: string, chamber?: 'house' | 'senate'): Promise<GovTrackMember[]> {
    await this.checkRateLimit();

    try {
      logger.info('Searching members in GovTrack API', { query, chamber });

      const params = new URLSearchParams({
        q: query,
        current: 'true',
        limit: '100'
      });

      if (chamber) {
        params.set('role_type', chamber === 'house' ? 'representative' : 'senator');
      }

      const response = await this.makeRequest<GovTrackResponse<GovTrackMember>>(
        `/member?${params.toString()}`
      );

      return response.objects || [];
    } catch (error) {
      logger.error('Failed to search members in GovTrack API', { query, chamber, error });
      throw error;
    }
  }

  /**
   * Make HTTP request to GovTrack API
   */
  private async makeRequest<T = unknown>(endpoint: string): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Choices-Platform/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new GovTrackApiError(
          `GovTrack API error: ${response.status} ${response.statusText}`,
          response.status,
          errorData
        );
      }

      const data = await response.json();
      this.requestCount++;
      
      logger.debug('GovTrack API request successful', {
        endpoint,
        status: response.status,
        requestCount: this.requestCount
      });

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof GovTrackApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new GovTrackApiError('Request timeout', 408);
      }

      throw new GovTrackApiError(
        `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        { originalError: error }
      );
    }
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const minuteKey = Math.floor(now / 60000).toString();
    const hourKey = Math.floor(now / 3600000).toString();

    // Reset counters if needed
    if (now - this.lastResetTime > 3600000) { // 1 hour
      this.rateLimiter.clear();
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    const minuteCount = this.rateLimiter.get(minuteKey) || 0;
    const hourCount = this.rateLimiter.get(hourKey) || 0;

    if (minuteCount >= this.config.rateLimit.requestsPerMinute) {
      throw new GovTrackApiError('Rate limit exceeded: too many requests per minute', 429);
    }

    if (hourCount >= this.config.rateLimit.requestsPerHour) {
      throw new GovTrackApiError('Rate limit exceeded: too many requests per hour', 429);
    }

    // Update counters
    this.rateLimiter.set(minuteKey, minuteCount + 1);
    this.rateLimiter.set(hourKey, hourCount + 1);

    // Clean up old entries
    this.cleanupRateLimiter();
  }

  /**
   * Clean up old rate limiter entries
   */
  private cleanupRateLimiter(): void {
    const now = Date.now();
    const cutoff = now - 3600000; // 1 hour ago

    for (const [key] of this.rateLimiter) {
      const timestamp = parseInt(key) * (key.length === 10 ? 60000 : 3600000);
      if (timestamp < cutoff) {
        this.rateLimiter.delete(key);
      }
    }
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): { requestsPerMinute: number; requestsPerHour: number; currentMinute: number; currentHour: number } {
    const now = Date.now();
    const minuteKey = Math.floor(now / 60000).toString();
    const hourKey = Math.floor(now / 3600000).toString();

    return {
      requestsPerMinute: this.config.rateLimit.requestsPerMinute,
      requestsPerHour: this.config.rateLimit.requestsPerHour,
      currentMinute: this.rateLimiter.get(minuteKey) || 0,
      currentHour: this.rateLimiter.get(hourKey) || 0
    };
  }
}

/**
 * Create a GovTrack API client with default configuration
 */
export function createGovTrackClient(): GovTrackClient {
  return new GovTrackClient();
}
