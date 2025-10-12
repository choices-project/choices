/**
 * OpenSecrets API Client
 * 
 * Enhanced campaign finance and lobbying data
 * Rate limits: 1,000 requests/day
 * 
 * @author Agent E
 * @date 2025-01-15
 */

import { devLog } from '@/lib/utils/logger';

// Types for OpenSecrets API responses
export interface OpenSecretsCandidate {
  cid: string;
  firstlast: string;
  lastname: string;
  firstname: string;
  party: string;
  office: string;
  gender: string;
  first_elected: string;
  exit_code: string;
  comments: string;
  phone: string;
  fax: string;
  website: string;
  webform: string;
  congress_office: string;
  bioguide_id: string;
  votesmart_id: string;
  feccandid: string;
  twitter_id: string;
  youtube_url: string;
  facebook_id: string;
  birthdate: string;
}

export interface OpenSecretsContributor {
  org_name: string;
  total: number;
  pacs: number;
  indivs: number;
  soft: number;
  tot527: number;
  dems: number;
  repubs: number;
  other: number;
  cycle: number;
}

export interface OpenSecretsIndustry {
  industry_code: string;
  industry_name: string;
  indivs: number;
  pacs: number;
  total: number;
  cycle: number;
}

export interface OpenSecretsLobbying {
  client: string;
  client_id: string;
  year: number;
  amount: number;
  type: string;
  specific_issue: string;
  general_issue: string;
  bill: string;
  bill_specific: string;
  report_type: string;
  report_year: number;
  report_type_long: string;
}

export interface OpenSecretsBill {
  bill_id: string;
  bill_number: string;
  bill_title: string;
  congress: number;
  session: number;
  introduced_date: string;
  sponsor: string;
  sponsor_id: string;
  sponsor_party: string;
  sponsor_state: string;
  cosponsors: number;
  subjects: string[];
  summary: string;
  latest_action: string;
  latest_action_date: string;
  status: string;
  status_date: string;
  committees: string[];
  related_bills: string[];
  votes: Array<{
    roll_call: number;
    date: string;
    question: string;
    result: string;
    vote_type: string;
    yea: number;
    nay: number;
    present: number;
    not_voting: number;
  }>;
}

export interface OpenSecretsApiResponse<T> {
  response: {
    legislator?: T[];
    contributors?: T[];
    industries?: T[];
    lobbying?: T[];
    bills?: T[];
    summary?: T;
  };
  error?: {
    message: string;
    code: string;
  };
}

export interface OpenSecretsClientConfig {
  apiKey: string;
  baseUrl?: string;
  rateLimit?: {
    requestsPerDay: number;
    requestsPerMinute: number;
  };
  timeout?: number;
}

export class OpenSecretsApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public apiResponse?: any
  ) {
    super(message);
    this.name = 'OpenSecretsApiError';
  }
}

export class OpenSecretsClient {
  private config: Required<OpenSecretsClientConfig>;
  private requestCount = 0;
  private lastRequestTime = 0;
  private dailyRequestCount = 0;
  private lastDailyReset = Date.now();

  constructor(config: OpenSecretsClientConfig) {
    this.config = Object.assign({
      baseUrl: 'https://www.opensecrets.org/api',
      rateLimit: {
        requestsPerDay: 1000,
        requestsPerMinute: 20
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
    url.searchParams.set('output', 'json');
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    const startTime = Date.now();
    
    try {
      devLog('Making OpenSecrets API request', {
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
        throw new OpenSecretsApiError(
          `OpenSecrets API error: ${response.status} ${response.statusText}`,
          response.status,
          errorData
        );
      }

      const data = await response.json();

      // Check for API-level errors
      if (data.error) {
        throw new OpenSecretsApiError(
          `OpenSecrets API error: ${data.error.message}`,
          400,
          data.error
        );
      }

      devLog('OpenSecrets API response received', {
        endpoint,
        responseTime,
        status: response.status,
        hasData: !!data.response,
        requestCount: this.requestCount,
        dailyRequestCount: this.dailyRequestCount
      });

      return data;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof OpenSecretsApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new OpenSecretsApiError(
          `Request timeout after ${this.config.timeout}ms`,
          408
        );
      }

      devLog('OpenSecrets API request failed', {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      });

      throw new OpenSecretsApiError(
        `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  private checkRateLimits(): void {
    const now = Date.now();
    
    // Check daily limit
    if (this.dailyRequestCount >= this.config.rateLimit.requestsPerDay) {
      throw new OpenSecretsApiError(
        `Daily rate limit exceeded: ${this.config.rateLimit.requestsPerDay} requests/day`,
        429
      );
    }

    // Check per-minute limit
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < 60000 && this.requestCount >= this.config.rateLimit.requestsPerMinute) {
      const waitTime = 60000 - timeSinceLastRequest;
      throw new OpenSecretsApiError(
        `Rate limit exceeded: ${this.config.rateLimit.requestsPerMinute} requests/minute. Wait ${Math.ceil(waitTime / 1000)} seconds`,
        429
      );
    }
  }

  // Candidate information
  async getCandidate(cid: string): Promise<OpenSecretsApiResponse<OpenSecretsCandidate>> {
    return await this.makeRequest<OpenSecretsApiResponse<OpenSecretsCandidate>>('/getLegislators', { id: cid });
  }

  async getCandidatesByState(state: string): Promise<OpenSecretsApiResponse<OpenSecretsCandidate>> {
    return await this.makeRequest<OpenSecretsApiResponse<OpenSecretsCandidate>>('/getLegislators', { id: state });
  }

  // Contribution information
  async getTopContributors(cid: string, cycle: number): Promise<OpenSecretsApiResponse<OpenSecretsContributor>> {
    return await this.makeRequest<OpenSecretsApiResponse<OpenSecretsContributor>>('/getOrgs', { 
      method: 'candContrib',
      cid,
      cycle
    });
  }

  async getTopIndustries(cid: string, cycle: number): Promise<OpenSecretsApiResponse<OpenSecretsIndustry>> {
    return await this.makeRequest<OpenSecretsApiResponse<OpenSecretsIndustry>>('/getOrgs', { 
      method: 'candIndustry',
      cid,
      cycle
    });
  }

  async getCandidateSummary(cid: string, cycle: number): Promise<OpenSecretsApiResponse<any>> {
    return await this.makeRequest<OpenSecretsApiResponse<any>>('/getOrgs', { 
      method: 'candSummary',
      cid,
      cycle
    });
  }

  // Lobbying information
  async getLobbyingByClient(clientId: string, year: number): Promise<OpenSecretsApiResponse<OpenSecretsLobbying>> {
    return await this.makeRequest<OpenSecretsApiResponse<OpenSecretsLobbying>>('/getOrgs', { 
      method: 'lobbying',
      id: clientId,
      year
    });
  }

  async getLobbyingByIssue(issue: string, year: number): Promise<OpenSecretsApiResponse<OpenSecretsLobbying>> {
    return await this.makeRequest<OpenSecretsApiResponse<OpenSecretsLobbying>>('/getOrgs', { 
      method: 'lobbying',
      issue,
      year
    });
  }

  // Bill information
  async getBill(billId: string): Promise<OpenSecretsApiResponse<OpenSecretsBill>> {
    return await this.makeRequest<OpenSecretsApiResponse<OpenSecretsBill>>('/getBill', { id: billId });
  }

  async getBillsBySubject(subject: string, congress: number): Promise<OpenSecretsApiResponse<OpenSecretsBill>> {
    return await this.makeRequest<OpenSecretsApiResponse<OpenSecretsBill>>('/getBills', { 
      subject,
      congress
    });
  }

  // Organization information
  async getOrganization(orgId: string): Promise<OpenSecretsApiResponse<any>> {
    return await this.makeRequest<OpenSecretsApiResponse<any>>('/getOrgs', { 
      method: 'orgSummary',
      id: orgId
    });
  }

  async getOrganizationContributions(orgId: string, cycle: number): Promise<OpenSecretsApiResponse<any>> {
    return await this.makeRequest<OpenSecretsApiResponse<any>>('/getOrgs', { 
      method: 'orgContrib',
      id: orgId,
      cycle
    });
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
 * Create an OpenSecrets API client with default configuration
 */
export function createOpenSecretsClient(): OpenSecretsClient {
  const apiKey = process.env.OPENSECRETS_API_KEY;
  
  if (!apiKey) {
    throw new OpenSecretsApiError('OPENSECRETS_API_KEY environment variable is required', 500);
  }

  return new OpenSecretsClient({
    apiKey,
    rateLimit: {
      requestsPerDay: 1000, // Official limit
      requestsPerMinute: 20 // Conservative limit
    }
  });
}
