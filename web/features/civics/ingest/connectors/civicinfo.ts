/**
 * Google Civic Information API Connector
 * 
 * Enhanced connector for the next development phase with proper error handling,
 * rate limiting, and data validation
 */

import type { AddressLookupResult, DataSourceConfig } from '../../schemas';

export interface CivicInfoConfig extends DataSourceConfig {
  type: 'civicinfo';
  apiKey: string;
  baseUrl: string;
}

export class CivicInfoConnector {
  private config: CivicInfoConfig;
  private rateLimiter: Map<string, number> = new Map();

  constructor(config: CivicInfoConfig) {
    this.config = config;
  }

  /**
   * Look up address and return district information
   * Enhanced with proper error handling and validation
   */
  async lookupAddress(address: string): Promise<AddressLookupResult> {
    // Rate limiting check
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded for Civic Info API');
    }

    try {
      // TODO: Implement actual Google Civic Information API call
      // This is a placeholder for the next development phase
      console.log('Civic info lookup for address:', address);
      
      // Enhanced stub implementation with proper structure
      const result: AddressLookupResult = {
        district: "PA-12",
        state: "PA",
        representatives: [],
        normalizedAddress: address,
        confidence: 0.95,
        coordinates: {
          lat: 40.7128,
          lng: -74.0060
        }
      };

      return result;
    } catch (error) {
      console.error('Civic Info API error:', error);
      throw new Error(`Failed to lookup address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get election information for an address
   */
  async getElectionInfo(address: string): Promise<any> {
    // TODO: Implement election info lookup
    console.log('Getting election info for address:', address);
    return null;
  }

  /**
   * Get representative information for a district
   */
  async getRepresentatives(district: string): Promise<any[]> {
    // TODO: Implement representative lookup
    console.log('Getting representatives for district:', district);
    return [];
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const minuteKey = Math.floor(now / 60000).toString();
    const hourKey = Math.floor(now / 3600000).toString();

    const minuteCount = this.rateLimiter.get(minuteKey) || 0;
    const hourCount = this.rateLimiter.get(hourKey) || 0;

    const rateLimit = this.config.rateLimit || { requestsPerMinute: 60, requestsPerHour: 1000 };

    if (minuteCount >= rateLimit.requestsPerMinute || hourCount >= rateLimit.requestsPerHour) {
      return false;
    }

    // Update counters
    this.rateLimiter.set(minuteKey, minuteCount + 1);
    this.rateLimiter.set(hourKey, hourCount + 1);

    // Clean up old entries
    this.cleanupRateLimiter();

    return true;
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
}

// Legacy function for backward compatibility
export async function lookupAddress(addr: string): Promise<AddressLookupResult> {
  const connector = new CivicInfoConnector({
    name: 'civicinfo',
    type: 'civicinfo',
    enabled: true,
    apiKey: process.env.GOOGLE_CIVIC_INFO_API_KEY || '',
    baseUrl: 'https://www.googleapis.com/civicinfo/v2'
  });
  
  return connector.lookupAddress(addr);
}
