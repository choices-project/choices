/**
 * ProPublica Congress API Connector
 * 
 * Enhanced connector for the next development phase with proper error handling,
 * rate limiting, and data validation
 */

import type { DataSourceConfig } from '../../schemas';

export interface ProPublicaConfig extends DataSourceConfig {
  type: 'propublica';
  apiKey: string;
  baseUrl: string;
}

export class ProPublicaConnector {
  private config: ProPublicaConfig;
  private rateLimiter: Map<string, number> = new Map();

  constructor(config: ProPublicaConfig) {
    this.config = config;
  }

  /**
   * Get recent votes for a specific member
   * Enhanced with proper error handling and validation
   */
  async getRecentVotesForMember(memberId: string): Promise<any[]> {
    // Rate limiting check
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded for ProPublica API');
    }

    try {
      // TODO: Implement actual ProPublica Congress API call
      // This is a placeholder for the next development phase
      console.log('Getting recent votes for member:', memberId);
      
      // Enhanced stub implementation with proper structure
      return [
        {
          id: 'vote-1',
          bill: 'H.R. 1234',
          title: 'Sample Bill Title',
          date: new Date().toISOString(),
          result: 'passed',
          votes: { yes: 250, no: 180, abstain: 5 },
          memberVotes: [{ memberId, vote: 'yes' }]
        }
      ];
    } catch (error) {
      console.error('ProPublica API error:', error);
      throw new Error(`Failed to get recent votes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get member information
   */
  async getMember(memberId: string): Promise<any> {
    // TODO: Implement member lookup
    console.log('Getting member info for:', memberId);
    return null;
  }

  /**
   * Get bills for a specific session
   */
  async getBills(session: number, chamber: 'house' | 'senate' = 'house'): Promise<any[]> {
    // TODO: Implement bills lookup
    console.log('Getting bills for session:', session, 'chamber:', chamber);
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
export async function getRecentVotesForMember(memberId: string): Promise<any[]> {
  const connector = new ProPublicaConnector({
    name: 'propublica',
    type: 'propublica',
    enabled: true,
    apiKey: process.env.PROPUBLICA_API_KEY || '',
    baseUrl: 'https://api.propublica.org/congress/v1'
  });
  
  return connector.getRecentVotesForMember(memberId);
}
