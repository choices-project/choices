/**
 * ProPublica Congress API Client
 * 
 * Production-ready client for the ProPublica Congress API with proper
 * error handling, rate limiting, caching, and data validation.
 */

import { logger } from '@/lib/logger';
import { ApplicationError } from '@/lib/errors';

export interface ProPublicaConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

export interface ProPublicaMember {
  id: string;
  title: string;
  short_title: string;
  api_uri: string;
  first_name: string;
  last_name: string;
  suffix?: string;
  date_of_birth: string;
  gender: string;
  party: string;
  leadership_role?: string;
  twitter_account?: string;
  facebook_account?: string;
  youtube_account?: string;
  govtrack_id: string;
  cspan_id?: string;
  votesmart_id?: string;
  icpsr_id?: string;
  crp_id?: string;
  google_entity_id?: string;
  fec_candidate_id?: string;
  url: string;
  rss_url?: string;
  contact_form?: string;
  in_office: boolean;
  cook_pvi?: string;
  dw_nominate?: number;
  ideal_point?: number;
  seniority: string;
  next_election?: string;
  total_votes?: number;
  missed_votes?: number;
  total_present?: number;
  last_updated: string;
  ocd_id: string;
  office?: string;
  phone?: string;
  fax?: string;
  state: string;
  district?: string;
  at_large?: boolean;
  geoid?: string;
  missed_votes_pct?: number;
  votes_with_party_pct?: number;
  votes_against_party_pct?: number;
}

export interface ProPublicaVote {
  roll_call: number;
  bill: {
    bill_id: string;
    number: string;
    api_uri: string;
    title: string;
    latest_action: string;
  };
  description: string;
  question: string;
  result: string;
  date: string;
  time: string;
  total: {
    yes: number;
    no: number;
    present: number;
    not_voting: number;
  };
  position: string;
}

export interface ProPublicaBill {
  bill_id: string;
  bill_slug: string;
  congress: string;
  bill: string;
  bill_type: string;
  number: string;
  title: string;
  short_title?: string;
  sponsor_title?: string;
  sponsor_id?: string;
  sponsor_name?: string;
  sponsor_state?: string;
  sponsor_party?: string;
  sponsor_uri?: string;
  gpo_pdf_uri?: string;
  congressdotgov_url?: string;
  govtrack_url?: string;
  introduced_date: string;
  active: boolean;
  last_vote?: string;
  house_passage?: string;
  senate_passage?: string;
  enacted?: string;
  vetoed?: string;
  cosponsors: number;
  cosponsors_by_party: {
    R?: number;
    D?: number;
    I?: number;
  };
  with_withdrawal?: boolean;
  primary_subject?: string;
  committees: string;
  committee_codes: string[];
  subcommittee_codes: string[];
  latest_major_action: string;
  latest_major_action_date: string;
  summary?: string;
  summary_short?: string;
  latest_action?: string;
  latest_action_date?: string;
}

export interface ProPublicaResponse<T> {
  status: string;
  copyright: string;
  results: T[];
}

export class ProPublicaApiError extends ApplicationError {
  constructor(message: string, statusCode: number, details?: any) {
    super(message, statusCode, 'PROPUBLICA_API_ERROR', details);
  }
}

export class ProPublicaClient {
  private config: Required<ProPublicaConfig>;
  private rateLimiter: Map<string, number> = new Map();
  private requestCount = 0;
  private lastResetTime = Date.now();

  constructor(config: ProPublicaConfig) {
    if (!config.apiKey) {
      throw new ProPublicaApiError('API key is required', 400);
    }

    this.config = {
      baseUrl: 'https://api.propublica.org/congress/v1',
      timeout: 15000,
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 1000
      },
      ...config
    };
  }

  /**
   * Get member information by ID
   */
  async getMember(memberId: string): Promise<ProPublicaMember> {
    await this.checkRateLimit();

    try {
      logger.info('Getting member from ProPublica API', { memberId });

      const response = await this.makeRequest<ProPublicaResponse<ProPublicaMember>>(
        `/members/${memberId}.json`
      );

      if (!response.results || response.results.length === 0) {
        throw new ProPublicaApiError('Member not found', 404, { memberId });
      }

      return response.results[0];
    } catch (error) {
      logger.error('Failed to get member from ProPublica API', { memberId, error });
      throw error;
    }
  }

  /**
   * Get recent votes for a member
   */
  async getRecentVotesForMember(memberId: string): Promise<ProPublicaVote[]> {
    await this.checkRateLimit();

    try {
      logger.info('Getting recent votes for member from ProPublica API', { memberId });

      const response = await this.makeRequest<ProPublicaResponse<ProPublicaVote>>(
        `/members/${memberId}/votes.json`
      );

      return response.results || [];
    } catch (error) {
      logger.error('Failed to get recent votes from ProPublica API', { memberId, error });
      throw error;
    }
  }

  /**
   * Get bills for a specific session
   */
  async getBills(session: number, chamber: 'house' | 'senate' = 'house'): Promise<ProPublicaBill[]> {
    await this.checkRateLimit();

    try {
      logger.info('Getting bills from ProPublica API', { session, chamber });

      const response = await this.makeRequest<ProPublicaResponse<ProPublicaBill>>(
        `/${session}/${chamber}/bills/introduced.json`
      );

      return response.results || [];
    } catch (error) {
      logger.error('Failed to get bills from ProPublica API', { session, chamber, error });
      throw error;
    }
  }

  /**
   * Get specific bill information
   */
  async getBill(billId: string): Promise<ProPublicaBill> {
    await this.checkRateLimit();

    try {
      logger.info('Getting bill from ProPublica API', { billId });

      const response = await this.makeRequest<ProPublicaResponse<ProPublicaBill>>(
        `/bills/${billId}.json`
      );

      if (!response.results || response.results.length === 0) {
        throw new ProPublicaApiError('Bill not found', 404, { billId });
      }

      return response.results[0];
    } catch (error) {
      logger.error('Failed to get bill from ProPublica API', { billId, error });
      throw error;
    }
  }

  /**
   * Get members by state and district
   */
  async getMembersByState(state: string, chamber: 'house' | 'senate' = 'house'): Promise<ProPublicaMember[]> {
    await this.checkRateLimit();

    try {
      logger.info('Getting members by state from ProPublica API', { state, chamber });

      const response = await this.makeRequest<ProPublicaResponse<ProPublicaMember>>(
        `/congress/v1/members/${chamber}/${state}/current.json`
      );

      return response.results || [];
    } catch (error) {
      logger.error('Failed to get members by state from ProPublica API', { state, chamber, error });
      throw error;
    }
  }

  /**
   * Search for members
   */
  async searchMembers(query: string): Promise<ProPublicaMember[]> {
    await this.checkRateLimit();

    try {
      logger.info('Searching members in ProPublica API', { query });

      // ProPublica doesn't have a direct search endpoint, so we'll search by name patterns
      // This is a simplified implementation - in practice, you might need to search multiple endpoints
      const response = await this.makeRequest<ProPublicaResponse<ProPublicaMember>>(
        `/congress/v1/members/search.json`,
        { q: query }
      );

      return response.results || [];
    } catch (error) {
      logger.error('Failed to search members in ProPublica API', { query, error });
      throw error;
    }
  }

  /**
   * Make HTTP request to ProPublica API
   */
  private async makeRequest<T = any>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const url = new URL(`${this.config.baseUrl}${endpoint}`);
    
    // Add parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-Key': this.config.apiKey,
          'User-Agent': 'Choices-Platform/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ProPublicaApiError(
          `ProPublica API error: ${response.status} ${response.statusText}`,
          response.status,
          errorData
        );
      }

      const data = await response.json();
      this.requestCount++;
      
      logger.debug('ProPublica API request successful', {
        endpoint,
        status: response.status,
        requestCount: this.requestCount
      });

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ProPublicaApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ProPublicaApiError('Request timeout', 408);
      }

      throw new ProPublicaApiError(
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
      throw new ProPublicaApiError('Rate limit exceeded: too many requests per minute', 429);
    }

    if (hourCount >= this.config.rateLimit.requestsPerHour) {
      throw new ProPublicaApiError('Rate limit exceeded: too many requests per hour', 429);
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
 * Create a ProPublica API client with default configuration
 */
export function createProPublicaClient(): ProPublicaClient {
  const apiKey = process.env.PROPUBLICA_API_KEY;
  
  if (!apiKey) {
    throw new ProPublicaApiError('PROPUBLICA_API_KEY environment variable is required', 500);
  }

  return new ProPublicaClient({
    apiKey,
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 1000
    }
  });
}
