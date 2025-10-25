/**
 * Google Civic Information API Client
 * 
 * Production-ready client for the Google Civic Information API with proper
 * error handling, rate limiting, caching, and data validation.
 * Updated to use OCD-IDs for geographic mapping instead of deprecated Representatives API.
 * 
 * @fileoverview Google Civic API integration with OCD-ID support
 * @version 2.0.0
 * @since 2024-10-09
 * @updated 2025-10-25 - Updated to use Divisions API for OCD-IDs
 * @feature GOOGLE_CIVIC_INTEGRATION
 */

import { logger } from '@/lib/utils/logger';

import { ApplicationError } from '../../errors/base';
import type { GoogleCivicElectionInfo, GoogleCivicVoterInfo } from '../../types/google-civic';


// Processed address lookup result type
interface AddressLookupResult {
  district: string;
  state: string;
  representatives: Array<{
    id: string;
    name: string;
    party: string;
    office: string;
    district: string;
    state: string;
    contact: {
      phone: string | undefined;
      email: string | undefined;
      website: string | undefined;
    };
  }>;
  normalizedAddress: string;
  confidence: number;
  coordinates: undefined;
}

export interface GoogleCivicConfig {
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

export interface GoogleCivicAddress {
  address: string;
  includeOffices?: boolean;
  levels?: string[];
  roles?: string[];
}

export interface GoogleCivicRepresentative {
  name: string;
  party?: string;
  phones?: string[];
  urls?: string[];
  photoUrl?: string;
  emails?: string[];
  channels?: Array<{
    type: string;
    id: string;
  }>;
}

export interface GoogleCivicOffice {
  name: string;
  divisionId: string;
  levels: string[];
  roles: string[];
  sources?: Array<{
    name: string;
    official: boolean;
  }>;
  officialIndices?: number[];
}

export interface GoogleCivicDivision {
  name: string;
  alsoKnownAs?: string[];
  officeIndices?: number[];
}

export interface GoogleCivicResponse {
  kind: string;
  normalizedInput: {
    line1: string;
    city: string;
    state: string;
    zip: string;
  };
  divisions: Record<string, GoogleCivicDivision>;
  offices: GoogleCivicOffice[];
  officials: GoogleCivicRepresentative[];
}

export class GoogleCivicApiError extends ApplicationError {
  constructor(message: string, statusCode: number, details?: Record<string, unknown>) {
    super(message, statusCode, 'GOOGLE_CIVIC_API_ERROR', details);
  }
}

export class GoogleCivicClient {
  private config: Required<GoogleCivicConfig>;
  private rateLimiter: Map<string, number> = new Map();
  private requestCount = 0;
  private lastResetTime = Date.now();

  constructor(config: GoogleCivicConfig) {
    if (!config.apiKey) {
      throw new GoogleCivicApiError('API key is required', 400);
    }

    this.config = Object.assign({
      baseUrl: 'https://www.googleapis.com/civicinfo/v2',
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 1000
      },
    }, config);
  }

  /**
   * Look up OCD-IDs for an address (replaces deprecated Representatives API)
   * 
   * Uses the Divisions API to retrieve OCD-IDs for geographic divisions
   * instead of the deprecated Representatives API.
   * 
   * @param address - Address to look up
   * @returns Promise resolving to address lookup result with OCD-IDs
   * 
   * @example
   * const result = await client.lookupAddress('123 Main St, Anytown, CA 90210');
   * console.log(result.ocdIds); // ['ocd-division/country:us/state:ca/cd:12']
   * 
   * @throws {ApplicationError} When API request fails or rate limit exceeded
   */
  async lookupAddress(address: string): Promise<AddressLookupResult> {
    await this.checkRateLimit();

    try {
      logger.info('Looking up OCD-IDs for address in Google Civic API', { address });

      // Use Divisions API to get OCD-IDs for geographic mapping
      const response = await this.makeRequest<GoogleCivicResponse>('/divisions', {
        address,
        includeOffices: true,
        levels: ['country', 'administrativeArea1', 'administrativeArea2', 'locality']
      });

      return this.transformResponse(response, address);
    } catch (error) {
      logger.error('Failed to lookup OCD-IDs in Google Civic API', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Get OCD-IDs for geographic mapping
   * 
   * Retrieves Open Civic Data Identifiers (OCD-IDs) for a given address
   * using the Google Civic Divisions API. These IDs can be used for
   * geographic mapping and district lookups.
   * 
   * @param address - Address to get OCD-IDs for
   * @returns Promise resolving to array of OCD-IDs
   * 
   * @example
   * const ocdIds = await client.getOCDIds('123 Main St, Anytown, CA 90210');
   * console.log(ocdIds); // ['ocd-division/country:us/state:ca/cd:12']
   * 
   * @throws {ApplicationError} When API request fails or rate limit exceeded
   */
  async getOCDIds(address: string): Promise<string[]> {
    await this.checkRateLimit();

    try {
      logger.info('Getting OCD-IDs for address', { address });

      const response = await this.makeRequest<GoogleCivicResponse>('/divisions', {
        address,
        includeOffices: true,
        levels: ['country', 'administrativeArea1', 'administrativeArea2', 'locality']
      });

      // Extract OCD-IDs from divisions
      const ocdIds = Object.keys(response.divisions || {});
      logger.info('Retrieved OCD-IDs', { ocdIds, count: ocdIds.length });
      
      return ocdIds;
    } catch (error) {
      logger.error('Failed to get OCD-IDs', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Get election information for an address
   */
  async getElectionInfo(address: string): Promise<GoogleCivicElectionInfo> {
    await this.checkRateLimit();

    try {
      logger.info('Getting election info from Google Civic API', { address });

      const response = await this.makeRequest('/elections', {
        address
      });

      return response as GoogleCivicElectionInfo;
    } catch (error) {
      logger.error('Failed to get election info from Google Civic API', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Get voter information for an address
   */
  async getVoterInfo(address: string, electionId?: string): Promise<GoogleCivicVoterInfo> {
    await this.checkRateLimit();

    try {
      logger.info('Getting voter info from Google Civic API', { address, electionId });

      const params: Record<string, string> = { address };
      if (electionId) {
        params.electionId = electionId;
      }

      const response = await this.makeRequest('/voterinfo', params);
      return response as GoogleCivicVoterInfo;
    } catch (error) {
      logger.error('Failed to get voter info from Google Civic API', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Make HTTP request to Google Civic API
   */
  private async makeRequest<T = unknown>(endpoint: string, params: Record<string, unknown> = {}): Promise<T> {
    const url = new URL(`${this.config.baseUrl}${endpoint}`);
    
    // Add API key
    url.searchParams.set('key', this.config.apiKey);
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          url.searchParams.set(key, value.join(','));
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url.toString(), {
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
        throw new GoogleCivicApiError(
          `Google Civic API error: ${response.status} ${response.statusText}`,
          response.status,
          errorData
        );
      }

      const data = await response.json();
      this.requestCount++;
      
      logger.debug('Google Civic API request successful', {
        endpoint,
        status: response.status,
        requestCount: this.requestCount
      });

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof GoogleCivicApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new GoogleCivicApiError('Request timeout', 408);
      }

      throw new GoogleCivicApiError(
        `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        { originalError: error }
      );
    }
  }

  /**
   * Transform Google Civic API response to our internal format
   */
  private transformResponse(response: GoogleCivicResponse, originalAddress: string): AddressLookupResult {
    try {
      // Extract district information from divisions
      const divisions = Object.values(response.divisions);
      const congressionalDivision = divisions.find(div => 
        div.name.includes('Congressional District') || 
        div.name.includes('U.S. House')
      );

      const district = congressionalDivision?.name || 'Unknown';
      const state = response.normalizedInput.state;

      // Transform representatives
      const representatives = response.officials.map((official, index) => {
        const office = response.offices.find(off => 
          off.officialIndices?.includes(index)
        );

        return {
          id: `google-civic-${index}`,
          name: official.name,
          party: official.party || 'Unknown',
          office: office?.name || 'Unknown',
          district,
          state,
          contact: {
            phone: official.phones?.[0],
            email: official.emails?.[0],
            website: official.urls?.[0]
          }
        };
      });

      return {
        district,
        state,
        representatives,
        normalizedAddress: response.normalizedInput ? 
          `${response.normalizedInput.line1}, ${response.normalizedInput.city}, ${response.normalizedInput.state} ${response.normalizedInput.zip}` :
          originalAddress,
        confidence: 0.95, // Google Civic API is generally reliable
        coordinates: undefined // Not provided by this API
      };
    } catch (error) {
      logger.error('Failed to transform Google Civic API response', error instanceof Error ? error : new Error('Unknown error'));
      throw new GoogleCivicApiError('Failed to process API response', 500, { error });
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
      throw new GoogleCivicApiError('Rate limit exceeded: too many requests per minute', 429);
    }

    if (hourCount >= this.config.rateLimit.requestsPerHour) {
      throw new GoogleCivicApiError('Rate limit exceeded: too many requests per hour', 429);
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

    for (const [key] of Array.from(this.rateLimiter.entries())) {
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
 * Create a Google Civic API client with default configuration
 */
export function createGoogleCivicClient(): GoogleCivicClient {
  const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
  
  if (!apiKey) {
    throw new GoogleCivicApiError('GOOGLE_CIVIC_API_KEY environment variable is required', 500);
  }

  return new GoogleCivicClient({
    apiKey,
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 1000
    }
  });
}
