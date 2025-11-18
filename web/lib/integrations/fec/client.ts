/**
 * FEC (Federal Election Commission) API Client
 * 
 * Official campaign finance data for federal elections
 * Rate limits: 1,000 requests/hour
 * 
 * @author Agent E
 * @date 2025-01-15
 */

import { logger } from '@/lib/utils/logger';

// Types for FEC API responses
export type FECCandidate = {
  candidate_id: string;
  name: string;
  party: string;
  party_full: string;
  state: string;
  district?: string;
  office: string;
  office_full: string;
  incumbent_challenge: string;
  candidate_status: string;
  cycles: number[];
  election_years: number[];
  election_districts: string[];
  first_file_date: string;
  last_file_date: string;
  last_f2_date: string;
  principal_committee_id?: string;
  principal_committee_name?: string;
}

export type FECCommittee = {
  committee_id: string;
  name: string;
  committee_type: string;
  committee_type_full: string;
  party: string;
  party_full: string;
  state: string;
  treasurer_name: string;
  organization_type: string;
  organization_type_full: string;
  designation: string;
  designation_full: string;
  committee_designation: string;
  committee_designation_full: string;
  filing_frequency: string;
  filing_frequency_full: string;
  party_type: string;
  party_type_full: string;
  cycles: number[];
  first_file_date: string;
  last_file_date: string;
  last_f1_date: string;
}

export type FECContribution = {
  committee_id: string;
  committee_name: string;
  contributor_id?: string;
  contributor_name: string;
  contributor_first_name?: string;
  contributor_middle_name?: string;
  contributor_last_name?: string;
  contributor_prefix?: string;
  contributor_suffix?: string;
  contributor_street_1?: string;
  contributor_city?: string;
  contributor_state?: string;
  contributor_zip?: string;
  contributor_employer?: string;
  contributor_occupation?: string;
  contributor_aggregate_ytd: number;
  contribution_receipt_amount: number;
  contribution_receipt_date: string;
  contribution_receipt_type: string;
  contribution_receipt_type_full: string;
  line_number: string;
  memo_code?: string;
  memo_text?: string;
  pdf_url?: string;
  receipt_type: string;
  receipt_type_full: string;
  report_type: string;
  report_type_full: string;
  schedule_type: string;
  schedule_type_full: string;
  sub_id: string;
  transaction_id: string;
  two_year_transaction_period: number;
  is_individual: boolean;
  entity_type: string;
  entity_type_desc: string;
  back_reference_schedule_name?: string;
  back_reference_transaction_id?: string;
}

export type FECExpenditure = {
  committee_id: string;
  committee_name: string;
  payee_id?: string;
  payee_name: string;
  payee_first_name?: string;
  payee_middle_name?: string;
  payee_last_name?: string;
  payee_prefix?: string;
  payee_suffix?: string;
  payee_street_1?: string;
  payee_city?: string;
  payee_state?: string;
  payee_zip?: string;
  expenditure_amount: number;
  expenditure_date: string;
  expenditure_purpose: string;
  expenditure_purpose_full: string;
  expenditure_type: string;
  expenditure_type_full: string;
  line_number: string;
  memo_code?: string;
  memo_text?: string;
  pdf_url?: string;
  receipt_type: string;
  receipt_type_full: string;
  report_type: string;
  report_type_full: string;
  schedule_type: string;
  schedule_type_full: string;
  sub_id: string;
  transaction_id: string;
  two_year_transaction_period: number;
  entity_type: string;
  entity_type_desc: string;
  back_reference_schedule_name?: string;
  back_reference_transaction_id?: string;
}

export type FECApiResponse<T> = {
  results: T[];
  pagination: {
    count: number;
    page: number;
    per_page: number;
    pages: number;
  };
}

export type FECClientConfig = {
  apiKey?: string;
  baseUrl?: string;
  rateLimit?: {
    requestsPerHour: number;
    requestsPerMinute: number;
  };
  timeout?: number;
}

export class FECApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public apiResponse?: unknown
  ) {
    super(message);
    this.name = 'FECApiError';
  }
}

export class FECClient {
  private config: Required<FECClientConfig>;
  private requestCount = 0;
  private lastRequestTime = 0;
  private hourlyRequestCount = 0;
  private lastHourlyReset = Date.now();

  constructor(config: FECClientConfig = {}) {
    this.config = Object.assign({
      apiKey: config.apiKey ?? '',
      baseUrl: 'https://api.open.fec.gov/v1',
      rateLimit: {
        requestsPerHour: 1000,
        requestsPerMinute: 20
      },
      timeout: 30000,
    }, config);

    // Reset hourly counter
    this.scheduleHourlyReset();
  }

  private scheduleHourlyReset(): void {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    
    const msUntilNextHour = nextHour.getTime() - now.getTime();
    
    setTimeout(() => {
      this.hourlyRequestCount = 0;
      this.lastHourlyReset = Date.now();
      this.scheduleHourlyReset();
    }, msUntilNextHour);
  }

  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, string | number> = {}
  ): Promise<T> {
    // Check rate limits
    this.checkRateLimits();

    const url = new URL(`${this.config.baseUrl}${endpoint}`);
    
    // Add API key if provided
    if (this.config.apiKey) {
      url.searchParams.set('api_key', this.config.apiKey);
    }
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    const startTime = Date.now();
    
    try {
      logger.debug('Making FEC API request', {
        endpoint,
        params,
        url: url.toString().replace(this.config.apiKey, '***'),
        requestCount: this.requestCount + 1,
        hourlyRequestCount: this.hourlyRequestCount + 1
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
      this.hourlyRequestCount++;
      this.lastRequestTime = Date.now();

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new FECApiError(
          `FEC API error: ${response.status} ${response.statusText}`,
          response.status,
          errorData
        );
      }

      const data = await response.json();

      logger.debug('FEC API response received', {
        endpoint,
        responseTime,
        status: response.status,
        resultCount: data.results?.length || 0,
        requestCount: this.requestCount,
        hourlyRequestCount: this.hourlyRequestCount
      });

      return data;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof FECApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new FECApiError(
          `Request timeout after ${this.config.timeout}ms`,
          408
        );
      }

      logger.error('FEC API request failed', {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      });

      throw new FECApiError(
        `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  private checkRateLimits(): void {
    const now = Date.now();
    
    // Check if hourly reset is needed (1 hour has passed since last reset)
    const timeSinceLastReset = now - this.lastHourlyReset;
    if (timeSinceLastReset >= 60 * 60 * 1000) {
      this.hourlyRequestCount = 0;
      this.lastHourlyReset = now;
      logger.debug('Hourly request counter reset', { lastReset: this.lastHourlyReset });
    }
    
    // Check hourly limit
    if (this.hourlyRequestCount >= this.config.rateLimit.requestsPerHour) {
      throw new FECApiError(
        `Hourly rate limit exceeded: ${this.config.rateLimit.requestsPerHour} requests/hour`,
        429
      );
    }

    // Check per-minute limit
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < 60000 && this.requestCount >= this.config.rateLimit.requestsPerMinute) {
      const waitTime = 60000 - timeSinceLastRequest;
      throw new FECApiError(
        `Rate limit exceeded: ${this.config.rateLimit.requestsPerMinute} requests/minute. Wait ${Math.ceil(waitTime / 1000)} seconds`,
        429
      );
    }
  }

  // Candidate information
  async getCandidates(params: {
    name?: string;
    state?: string;
    district?: string;
    office?: string;
    party?: string;
    cycle?: number;
    year?: number;
    limit?: number;
    page?: number;
  } = {}): Promise<FECApiResponse<FECCandidate>> {
    return await this.makeRequest<FECApiResponse<FECCandidate>>('/candidates/', params);
  }

  async getCandidate(candidateId: string): Promise<FECApiResponse<FECCandidate>> {
    return await this.makeRequest<FECApiResponse<FECCandidate>>(`/candidate/${candidateId}/`);
  }

  async getCandidatesByState(state: string, office?: string): Promise<FECApiResponse<FECCandidate>> {
    const params: Record<string, string> = { state };
    if (office) params.office = office;
    return await this.makeRequest<FECApiResponse<FECCandidate>>('/candidates/', params);
  }

  // Committee information
  async getCommittees(params: {
    name?: string;
    state?: string;
    committee_type?: string;
    party?: string;
    cycle?: number;
    year?: number;
    limit?: number;
    page?: number;
  } = {}): Promise<FECApiResponse<FECCommittee>> {
    return await this.makeRequest<FECApiResponse<FECCommittee>>('/committees/', params);
  }

  async getCommittee(committeeId: string): Promise<FECApiResponse<FECCommittee>> {
    return await this.makeRequest<FECApiResponse<FECCommittee>>(`/committee/${committeeId}/`);
  }

  // Contribution information
  async getContributions(params: {
    committee_id?: string;
    contributor_id?: string;
    contributor_name?: string;
    contributor_state?: string;
    contributor_employer?: string;
    contribution_receipt_amount?: number;
    contribution_receipt_date?: string;
    two_year_transaction_period?: number;
    limit?: number;
    page?: number;
  } = {}): Promise<FECApiResponse<FECContribution>> {
    return await this.makeRequest<FECApiResponse<FECContribution>>('/schedules/schedule_a/', params);
  }

  async getContributionsByCommittee(committeeId: string, params: {
    two_year_transaction_period?: number;
    limit?: number;
    page?: number;
  } = {}): Promise<FECApiResponse<FECContribution>> {
    return await this.makeRequest<FECApiResponse<FECContribution>>(`/committee/${committeeId}/schedules/schedule_a/`, params);
  }

  async getContributionsByCandidate(candidateId: string, params: {
    two_year_transaction_period?: number;
    limit?: number;
    page?: number;
  } = {}): Promise<FECApiResponse<FECContribution>> {
    return await this.makeRequest<FECApiResponse<FECContribution>>(`/candidate/${candidateId}/schedules/schedule_a/`, params);
  }

  // Expenditure information
  async getExpenditures(params: {
    committee_id?: string;
    payee_id?: string;
    payee_name?: string;
    payee_state?: string;
    expenditure_amount?: number;
    expenditure_date?: string;
    two_year_transaction_period?: number;
    limit?: number;
    page?: number;
  } = {}): Promise<FECApiResponse<FECExpenditure>> {
    return await this.makeRequest<FECApiResponse<FECExpenditure>>('/schedules/schedule_b/', params);
  }

  async getExpendituresByCommittee(committeeId: string, params: {
    two_year_transaction_period?: number;
    limit?: number;
    page?: number;
  } = {}): Promise<FECApiResponse<FECExpenditure>> {
    return await this.makeRequest<FECApiResponse<FECExpenditure>>(`/committee/${committeeId}/schedules/schedule_b/`, params);
  }

  // Financial summaries
  async getCandidateFinancialSummary(candidateId: string, cycle: number): Promise<unknown> {
    return await this.makeRequest(`/candidate/${candidateId}/totals/`, { cycle });
  }

  async getCommitteeFinancialSummary(committeeId: string, cycle: number): Promise<unknown> {
    return await this.makeRequest(`/committee/${committeeId}/totals/`, { cycle });
  }

  // Utility methods
  getUsageMetrics(): {
    totalRequests: number;
    hourlyRequests: number;
    hourlyLimit: number;
    requestsPerMinute: number;
    lastRequestTime: number;
  } {
    return {
      totalRequests: this.requestCount,
      hourlyRequests: this.hourlyRequestCount,
      hourlyLimit: this.config.rateLimit.requestsPerHour,
      requestsPerMinute: this.config.rateLimit.requestsPerMinute,
      lastRequestTime: this.lastRequestTime
    };
  }

  getRateLimitStatus(): {
    hourlyRemaining: number;
    hourlyUsed: number;
    hourlyLimit: number;
    canMakeRequest: boolean;
  } {
    const hourlyRemaining = this.config.rateLimit.requestsPerHour - this.hourlyRequestCount;
    const canMakeRequest = hourlyRemaining > 0;

    return {
      hourlyRemaining,
      hourlyUsed: this.hourlyRequestCount,
      hourlyLimit: this.config.rateLimit.requestsPerHour,
      canMakeRequest
    };
  }
}

/**
 * Create an FEC API client with default configuration
 */
export function createFECClient(): FECClient {
  const apiKey = process.env.FEC_API_KEY; // Optional for FEC API
  
  return new FECClient(
    {
      rateLimit: {
        requestsPerHour: 1000, // Official limit
        requestsPerMinute: 20 // Conservative limit
      },
      ...(apiKey ? { apiKey } : {})
    }
  );
}
