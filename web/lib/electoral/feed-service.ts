/**
 * Electoral Feed Service
 * 
 * Generates feeds from public jurisdiction IDs only.
 * No plaintext address or GPS ever received by server.
 */

import { JurisdictionID } from '../privacy/location-resolver';
import { logger } from '@/lib/logger';

export interface ElectoralFeed {
  jurisdictionId: JurisdictionID;
  level: 'federal' | 'state' | 'local';
  currentOfficials: Official[];
  upcomingRaces: Race[];
  keyIssues: Issue[];
  lastUpdated: string;
}

export interface Official {
  id: string;
  name: string;
  office: string;
  party?: string;
  contactInfo: {
    email?: string;
    phone?: string;
    website?: string;
  };
  socialMedia?: {
    twitter?: string;
    facebook?: string;
  };
  independenceScore?: number; // 0-100%
  transparencyScore?: number; // 0-100%
}

export interface Race {
  id: string;
  office: string;
  electionDate: string;
  candidates: Candidate[];
  keyIssues: string[];
}

export interface Candidate {
  id: string;
  name: string;
  party?: string;
  isIncumbent: boolean;
  contactInfo: {
    email?: string;
    website?: string;
  };
  independenceScore?: number;
  transparencyScore?: number;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  relevance: 'high' | 'medium' | 'low';
  lastUpdated: string;
}

export class ElectoralFeedService {
  private cache = new Map<string, ElectoralFeed>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get electoral feed for jurisdiction IDs
   * Only accepts public jurisdiction IDs - no addresses or GPS
   */
  async getFeed(ids: JurisdictionID[], version = 'v1'): Promise<ElectoralFeed[]> {
    // Validate jurisdiction IDs
    for (const id of ids) {
      if (!this.isValidJurisdictionId(id)) {
        throw new Error(`Invalid jurisdiction ID: ${id}`);
      }
    }

    const feeds: ElectoralFeed[] = [];
    
    for (const id of ids) {
      try {
        const feed = await this.getOrBuildFeed(id, version);
        feeds.push(feed);
      } catch (error) {
        logger.error('Failed to build feed for jurisdiction', { 
          jurisdictionId: id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        // Continue with other jurisdictions
      }
    }

    return feeds;
  }

  /**
   * Get or build feed for a single jurisdiction
   */
  private async getOrBuildFeed(jurisdictionId: JurisdictionID, version: string): Promise<ElectoralFeed> {
    const cacheKey = `${jurisdictionId}:${version}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    // Build new feed
    const feed = await this.buildFeed(jurisdictionId, version);
    
    // Cache the result
    this.cache.set(cacheKey, feed);
    
    return feed;
  }

  /**
   * Build feed from jurisdiction ID
   */
  private async buildFeed(jurisdictionId: JurisdictionID, version: string): Promise<ElectoralFeed> {
    const level = this.determineLevel(jurisdictionId);
    
    // Build feed components
    const [currentOfficials, upcomingRaces, keyIssues] = await Promise.all([
      this.getCurrentOfficials(jurisdictionId),
      this.getUpcomingRaces(jurisdictionId),
      this.getKeyIssues(jurisdictionId)
    ]);

    return {
      jurisdictionId,
      level,
      currentOfficials,
      upcomingRaces,
      keyIssues,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get current officials for jurisdiction
   */
  private async getCurrentOfficials(jurisdictionId: JurisdictionID): Promise<Official[]> {
    // This would integrate with our multi-source data system
    // For now, return placeholder data
    return [
      {
        id: 'official-1',
        name: 'John Smith',
        office: 'Mayor',
        party: 'Independent',
        contactInfo: {
          email: 'mayor@city.gov',
          phone: '(555) 123-4567',
          website: 'https://mayor.city.gov'
        },
        socialMedia: {
          twitter: '@mayorjohnsmith'
        },
        independenceScore: 85,
        transparencyScore: 90
      }
    ];
  }

  /**
   * Get upcoming races for jurisdiction
   */
  private async getUpcomingRaces(jurisdictionId: JurisdictionID): Promise<Race[]> {
    // This would integrate with our multi-source data system
    // For now, return placeholder data
    return [
      {
        id: 'race-1',
        office: 'City Council District 1',
        electionDate: '2024-11-05',
        candidates: [
          {
            id: 'candidate-1',
            name: 'Jane Doe',
            party: 'Green',
            isIncumbent: false,
            contactInfo: {
              email: 'jane@janedoe2024.com',
              website: 'https://janedoe2024.com'
            },
            independenceScore: 95,
            transparencyScore: 88
          },
          {
            id: 'candidate-2',
            name: 'Bob Johnson',
            party: 'Republican',
            isIncumbent: true,
            contactInfo: {
              email: 'bob@bobjohnson2024.com',
              website: 'https://bobjohnson2024.com'
            },
            independenceScore: 45,
            transparencyScore: 60
          }
        ],
        keyIssues: ['Housing', 'Transportation', 'Environment']
      }
    ];
  }

  /**
   * Get key issues for jurisdiction
   */
  private async getKeyIssues(jurisdictionId: JurisdictionID): Promise<Issue[]> {
    // This would integrate with our multi-source data system
    // For now, return placeholder data
    return [
      {
        id: 'issue-1',
        title: 'Affordable Housing',
        description: 'Addressing the housing crisis and ensuring affordable housing for all residents',
        relevance: 'high',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'issue-2',
        title: 'Public Transportation',
        description: 'Improving public transit infrastructure and accessibility',
        relevance: 'high',
        lastUpdated: new Date().toISOString()
      }
    ];
  }

  /**
   * Determine jurisdiction level from ID
   */
  private determineLevel(jurisdictionId: JurisdictionID): 'federal' | 'state' | 'local' {
    if (jurisdictionId.includes('/county:') || jurisdictionId.includes('/place:')) {
      return 'local';
    } else if (jurisdictionId.includes('/state:')) {
      return 'state';
    } else {
      return 'federal';
    }
  }

  /**
   * Validate jurisdiction ID format
   */
  private isValidJurisdictionId(id: string): boolean {
    // Allowlist regex for OCD format
    const ocdPattern = /^ocd-division\/country:us(\/state:[a-z]{2})?(\/county:[a-z0-9_-]+)?(\/place:[a-z0-9_-]+)?$/;
    return ocdPattern.test(id);
  }

  /**
   * Check if cached feed is still valid
   */
  private isCacheValid(feed: ElectoralFeed): boolean {
    const now = new Date().getTime();
    const lastUpdated = new Date(feed.lastUpdated).getTime();
    return (now - lastUpdated) < this.CACHE_TTL;
  }

  /**
   * Clear cache for a jurisdiction
   */
  clearCache(jurisdictionId: JurisdictionID): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.startsWith(`${jurisdictionId}:`)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
  }
}
