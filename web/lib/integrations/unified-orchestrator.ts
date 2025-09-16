/**
 * Unified Data Integration Orchestrator
 * 
 * Manages multiple data sources and provides unified access to government data
 * Implements data quality scoring, conflict resolution, and source prioritization
 * 
 * @author Agent E
 * @date 2025-01-15
 */

import { dev } from '@/lib/dev.logger';
import { createGoogleCivicClient } from './google-civic/client';
import { createCongressGovClient } from './congress-gov/client';
import { createOpenStatesClient } from './open-states/client';
import { createFECClient } from './fec/client';
import { createOpenSecretsClient } from './opensecrets/client';
import { createGovTrackClient } from './govtrack/client';
import { apiUsageMonitor } from './rate-limiting';

// Unified data types
export interface UnifiedRepresentative {
  // Primary Identifiers
  id: string;
  bioguideId?: string;
  openStatesId?: string;
  fecId?: string;
  crpId?: string;
  
  // Basic Information
  name: string;
  firstName: string;
  lastName: string;
  party: string;
  state: string;
  district?: string;
  chamber: 'federal' | 'state' | 'local';
  level: 'house' | 'senate' | 'assembly' | 'council';
  
  // Contact & Social
  email?: string;
  phone?: string;
  website?: string;
  socialMedia: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  
  // Data Sources
  dataSources: {
    congressGov: boolean;
    openStates: boolean;
    fec: boolean;
    openSecrets: boolean;
    googleCivic: boolean;
    govTrack: boolean;
  };
  
  // Metadata
  lastUpdated: string;
  dataQuality: 'high' | 'medium' | 'low';
  completeness: number; // 0-100%
  sourcePriority: number; // 0-100, higher = more reliable
}

export interface UnifiedVote {
  id: string;
  representativeId: string;
  
  // Vote Details
  billId?: string;
  billTitle?: string;
  question: string;
  description: string;
  vote: 'yes' | 'no' | 'abstain' | 'not_voting';
  result: 'passed' | 'failed' | 'tabled';
  
  // Context
  chamber: string;
  congress?: number;
  session?: string;
  date: string;
  partyLineVote: boolean;
  
  // Analysis
  constituentAlignment?: number; // -100 to +100
  partyAlignment: number;        // -100 to +100
  ideologyScore?: number;        // -100 to +100
  
  // Sources
  sources: string[];
  lastUpdated: string;
  dataQuality: 'high' | 'medium' | 'low';
}

export interface UnifiedCampaignFinance {
  id: string;
  representativeId: string;
  cycle: number;
  
  // Contributions
  totalRaised: number;
  individualContributions: number;
  pacContributions: number;
  corporateContributions: number;
  unionContributions: number;
  selfFunding: number;
  smallDonorPercentage: number; // <$200 donations percentage
  
  // Top Contributors
  topContributors: Array<{
    name: string;
    amount: number;
    type: 'individual' | 'pac' | 'corporate' | 'union';
    industry?: string;
    influenceScore: number; // 0-100
    issueAlignment?: number; // -100 to +100 for specific issues
  }>;
  
  // Analysis Scores
  independenceScore: number; // 0-100 (higher = more independent)
  corporateInfluence: number; // 0-100
  pacInfluence: number; // 0-100
  smallDonorInfluence: number; // 0-100
  
  // Expenditures
  totalSpent: number;
  advertising: number;
  staff: number;
  travel: number;
  fundraising: number;
  
  // Sources
  sources: string[];
  lastUpdated: string;
  dataQuality: 'high' | 'medium' | 'low';
}

export interface DataQualityScore {
  representativeId: string;
  scores: {
    basicInfo: number;        // Name, party, district
    votingRecord: number;     // Completeness of voting history
    campaignFinance: number;  // Financial data availability
    socialMedia: number;      // Social media presence
    publicStatements: number; // Public communication
  };
  overallScore: number;
  lastCalculated: string;
}

// Source priority configuration
const SOURCE_PRIORITY = {
  'congress-gov': 100,
  'fec': 100,
  'open-states': 95,
  'govtrack': 90,
  'opensecrets': 90,
  'ballotpedia': 85,
  'google-civic': 80,
  'twitter': 70,
  'facebook': 70,
  'manual': 50
} as const;

export class UnifiedDataOrchestrator {
  private clients: {
    googleCivic: ReturnType<typeof createGoogleCivicClient>;
    congressGov: ReturnType<typeof createCongressGovClient>;
    openStates: ReturnType<typeof createOpenStatesClient>;
    fec: ReturnType<typeof createFECClient>;
    openSecrets: ReturnType<typeof createOpenSecretsClient>;
    govTrack: ReturnType<typeof createGovTrackClient>;
  };

  constructor() {
    try {
      this.clients = {
        googleCivic: createGoogleCivicClient(),
        congressGov: createCongressGovClient(),
        openStates: createOpenStatesClient(),
        fec: createFECClient(),
        openSecrets: createOpenSecretsClient(),
        govTrack: createGovTrackClient()
      };
    } catch (error) {
      dev.logger.warn('Some API clients failed to initialize', { error });
      // Initialize with available clients only
      this.clients = {} as any;
    }
  }

  /**
   * Get comprehensive representative data from all available sources
   */
  async getRepresentative(identifier: string, type: 'bioguide' | 'name' | 'state-district' = 'bioguide'): Promise<UnifiedRepresentative | null> {
    const dataFromSources: Array<{ source: string; data: any; priority: number }> = [];

    try {
      // Try Congress.gov first (highest priority for federal)
      if (this.clients.congressGov) {
        try {
          const congressData = await this.clients.congressGov.getMember(identifier);
          if (congressData) {
            dataFromSources.push({
              source: 'congress-gov',
              data: congressData,
              priority: SOURCE_PRIORITY['congress-gov']
            });
          }
        } catch (error) {
          dev.logger.debug('Congress.gov lookup failed', { identifier, error });
        }
      }

      // Try Open States for state legislators
      if (this.clients.openStates) {
        try {
          const openStatesData = await this.clients.openStates.getLegislator(identifier);
          if (openStatesData) {
            dataFromSources.push({
              source: 'open-states',
              data: openStatesData,
              priority: SOURCE_PRIORITY['open-states']
            });
          }
        } catch (error) {
          dev.logger.debug('Open States lookup failed', { identifier, error });
        }
      }

      // Try FEC for campaign finance data
      if (this.clients.fec) {
        try {
          const fecData = await this.clients.fec.getCandidate(identifier);
          if (fecData?.results?.[0]) {
            dataFromSources.push({
              source: 'fec',
              data: fecData.results[0],
              priority: SOURCE_PRIORITY['fec']
            });
          }
        } catch (error) {
          dev.logger.debug('FEC lookup failed', { identifier, error });
        }
      }

      // Try OpenSecrets for enhanced data
      if (this.clients.openSecrets) {
        try {
          const openSecretsData = await this.clients.openSecrets.getCandidate(identifier);
          if (openSecretsData?.response?.legislator?.[0]) {
            dataFromSources.push({
              source: 'opensecrets',
              data: openSecretsData.response.legislator[0],
              priority: SOURCE_PRIORITY['opensecrets']
            });
          }
        } catch (error) {
          dev.logger.debug('OpenSecrets lookup failed', { identifier, error });
        }
      }

      // Try GovTrack as fallback
      if (this.clients.govTrack) {
        try {
          const govTrackData = await this.clients.govTrack.getMember(parseInt(identifier));
          if (govTrackData) {
            dataFromSources.push({
              source: 'govtrack',
              data: govTrackData,
              priority: SOURCE_PRIORITY['govtrack']
            });
          }
        } catch (error) {
          dev.logger.debug('GovTrack lookup failed', { identifier, error });
        }
      }

      if (dataFromSources.length === 0) {
        return null;
      }

      // Merge data from all sources, prioritizing higher-priority sources
      return this.mergeRepresentativeData(dataFromSources);

    } catch (error) {
      dev.logger.error('Failed to get representative data', { identifier, error });
      return null;
    }
  }

  /**
   * Get voting record for a representative
   */
  async getVotingRecord(representativeId: string, congress?: number): Promise<UnifiedVote[]> {
    const votes: UnifiedVote[] = [];

    try {
      // Get votes from Congress.gov (primary source)
      if (this.clients.congressGov) {
        try {
          const congressVotes = await this.clients.congressGov.getVotes({
            congress,
            limit: 100
          });
          
          for (const vote of congressVotes) {
            votes.push({
              id: `${vote.congress}-${vote.session}-${vote.rollCall}`,
              representativeId,
              billId: vote.documentNumber,
              billTitle: vote.documentTitle,
              question: vote.question,
              description: vote.description,
              vote: this.mapVoteResult(vote.result),
              result: this.mapVoteOutcome(vote.result),
              chamber: vote.chamber,
              congress: vote.congress,
              session: vote.session.toString(),
              date: vote.date,
              partyLineVote: false, // Would need additional analysis
              partyAlignment: 0, // Would need additional analysis
              sources: ['congress-gov'],
              lastUpdated: new Date().toISOString(),
              dataQuality: 'high'
            });
          }
        } catch (error) {
          dev.logger.debug('Congress.gov voting record failed', { representativeId, error });
        }
      }

      // Get votes from Open States (for state legislators)
      if (this.clients.openStates) {
        try {
          const openStatesVotes = await this.clients.openStates.getVotes({
            limit: 100
          });
          
          for (const vote of openStatesVotes) {
            votes.push({
              id: vote.id,
              representativeId,
              billId: vote.bill_id,
              question: vote.motion,
              description: vote.motion,
              vote: this.mapVoteResult(vote.result),
              result: this.mapVoteOutcome(vote.result),
              chamber: vote.chamber,
              date: vote.date,
              partyLineVote: false,
              partyAlignment: 0,
              sources: ['open-states'],
              lastUpdated: new Date().toISOString(),
              dataQuality: 'high'
            });
          }
        } catch (error) {
          dev.logger.debug('Open States voting record failed', { representativeId, error });
        }
      }

      return votes;

    } catch (error) {
      dev.logger.error('Failed to get voting record', { representativeId, error });
      return [];
    }
  }

  /**
   * Get campaign finance data for a representative
   */
  async getCampaignFinance(representativeId: string, cycle: number): Promise<UnifiedCampaignFinance | null> {
    const financeData: any = {};

    try {
      // Get FEC data (primary source)
      if (this.clients.fec) {
        try {
          const fecSummary = await this.clients.fec.getCandidateFinancialSummary(representativeId, cycle);
          if (fecSummary) {
            financeData.fec = fecSummary;
          }
        } catch (error) {
          dev.logger.debug('FEC campaign finance failed', { representativeId, error });
        }
      }

      // Get OpenSecrets data (enhanced source)
      if (this.clients.openSecrets) {
        try {
          const openSecretsSummary = await this.clients.openSecrets.getCandidateSummary(representativeId, cycle);
          if (openSecretsSummary) {
            financeData.openSecrets = openSecretsSummary;
          }
        } catch (error) {
          dev.logger.debug('OpenSecrets campaign finance failed', { representativeId, error });
        }
      }

      if (Object.keys(financeData).length === 0) {
        return null;
      }

      return this.mergeCampaignFinanceData(financeData, representativeId, cycle);

    } catch (error) {
      dev.logger.error('Failed to get campaign finance data', { representativeId, error });
      return null;
    }
  }

  /**
   * Calculate data quality score for a representative
   */
  async calculateDataQuality(representativeId: string): Promise<DataQualityScore> {
    const scores = {
      basicInfo: 0,
      votingRecord: 0,
      campaignFinance: 0,
      socialMedia: 0,
      publicStatements: 0
    };

    try {
      // Get representative data
      const representative = await this.getRepresentative(representativeId);
      if (representative) {
        // Basic info score
        scores.basicInfo = this.calculateBasicInfoScore(representative);
        
        // Voting record score
        const votes = await this.getVotingRecord(representativeId);
        scores.votingRecord = this.calculateVotingRecordScore(votes);
        
        // Campaign finance score
        const finance = await this.getCampaignFinance(representativeId, 2024);
        scores.campaignFinance = this.calculateCampaignFinanceScore(finance);
        
        // Social media score
        scores.socialMedia = this.calculateSocialMediaScore(representative);
        
        // Public statements score (placeholder)
        scores.publicStatements = 0; // Would need social media integration
      }

      const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;

      return {
        representativeId,
        scores,
        overallScore,
        lastCalculated: new Date().toISOString()
      };

    } catch (error) {
      dev.logger.error('Failed to calculate data quality', { representativeId, error });
      return {
        representativeId,
        scores,
        overallScore: 0,
        lastCalculated: new Date().toISOString()
      };
    }
  }

  /**
   * Get API usage metrics across all sources
   */
  getUsageMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {};
    
    if (this.clients.congressGov) {
      metrics['congress-gov'] = this.clients.congressGov.getUsageMetrics();
    }
    if (this.clients.openStates) {
      metrics['open-states'] = this.clients.openStates.getUsageMetrics();
    }
    if (this.clients.fec) {
      metrics['fec'] = this.clients.fec.getUsageMetrics();
    }
    if (this.clients.openSecrets) {
      metrics['open-secrets'] = this.clients.openSecrets.getUsageMetrics();
    }
    
    return metrics;
  }

  // Private helper methods
  private mergeRepresentativeData(sources: Array<{ source: string; data: any; priority: number }>): UnifiedRepresentative {
    // Sort by priority (highest first)
    sources.sort((a, b) => b.priority - a.priority);
    
    const merged: any = {
      id: sources[0].data.bioguideId || sources[0].data.id || `unknown-${Date.now()}`,
      dataSources: {
        congressGov: false,
        openStates: false,
        fec: false,
        openSecrets: false,
        googleCivic: false,
        govTrack: false
      },
      socialMedia: {},
      lastUpdated: new Date().toISOString(),
      dataQuality: 'medium',
      completeness: 0,
      sourcePriority: sources[0].priority
    };

    // Merge data from all sources
    for (const { source, data } of sources) {
      merged.dataSources[source.replace('-', '')] = true;
      
      // Merge basic info (prioritize higher-priority sources)
      if (!merged.name && data.fullName) merged.name = data.fullName;
      if (!merged.firstName && data.firstName) merged.firstName = data.firstName;
      if (!merged.lastName && data.lastName) merged.lastName = data.lastName;
      if (!merged.party && data.party) merged.party = data.party;
      if (!merged.state && data.state) merged.state = data.state;
      if (!merged.district && data.district) merged.district = data.district;
      if (!merged.email && data.email) merged.email = data.email;
      if (!merged.phone && data.phone) merged.phone = data.phone;
      if (!merged.website && data.website) merged.website = data.website;
      
      // Merge social media
      if (data.twitter_id) merged.socialMedia.twitter = data.twitter_id;
      if (data.facebook_id) merged.socialMedia.facebook = data.facebook_id;
      if (data.youtube_url) merged.socialMedia.youtube = data.youtube_url;
    }

    // Calculate completeness
    merged.completeness = this.calculateCompleteness(merged);
    
    // Determine data quality
    if (merged.completeness >= 80) merged.dataQuality = 'high';
    else if (merged.completeness >= 60) merged.dataQuality = 'medium';
    else merged.dataQuality = 'low';

    return merged as UnifiedRepresentative;
  }

  private mergeCampaignFinanceData(financeData: any, representativeId: string, cycle: number): UnifiedCampaignFinance {
    const merged: UnifiedCampaignFinance = {
      id: `${representativeId}-${cycle}`,
      representativeId,
      cycle,
      totalRaised: 0,
      individualContributions: 0,
      pacContributions: 0,
      corporateContributions: 0,
      unionContributions: 0,
      selfFunding: 0,
      smallDonorPercentage: 0,
      topContributors: [],
      independenceScore: 0,
      corporateInfluence: 0,
      pacInfluence: 0,
      smallDonorInfluence: 0,
      totalSpent: 0,
      advertising: 0,
      staff: 0,
      travel: 0,
      fundraising: 0,
      sources: [],
      lastUpdated: new Date().toISOString(),
      dataQuality: 'medium'
    };

    // Merge FEC data
    if (financeData.fec) {
      merged.sources.push('fec');
      // Map FEC fields to unified format
      // This would need to be implemented based on actual FEC response structure
    }

    // Merge OpenSecrets data
    if (financeData.openSecrets) {
      merged.sources.push('opensecrets');
      // Map OpenSecrets fields to unified format
      // This would need to be implemented based on actual OpenSecrets response structure
    }

    return merged;
  }

  private mapVoteResult(result: string): 'yes' | 'no' | 'abstain' | 'not_voting' {
    const lower = result.toLowerCase();
    if (lower.includes('yea') || lower.includes('yes')) return 'yes';
    if (lower.includes('nay') || lower.includes('no')) return 'no';
    if (lower.includes('abstain') || lower.includes('present')) return 'abstain';
    return 'not_voting';
  }

  private mapVoteOutcome(result: string): 'passed' | 'failed' | 'tabled' {
    const lower = result.toLowerCase();
    if (lower.includes('passed') || lower.includes('agreed')) return 'passed';
    if (lower.includes('failed') || lower.includes('rejected')) return 'failed';
    return 'tabled';
  }

  private calculateCompleteness(representative: any): number {
    const fields = ['name', 'firstName', 'lastName', 'party', 'state', 'chamber', 'email', 'phone', 'website'];
    const filledFields = fields.filter(field => representative[field]).length;
    return Math.round((filledFields / fields.length) * 100);
  }

  private calculateBasicInfoScore(representative: UnifiedRepresentative): number {
    return representative.completeness;
  }

  private calculateVotingRecordScore(votes: UnifiedVote[]): number {
    if (votes.length === 0) return 0;
    if (votes.length >= 100) return 100;
    return Math.round((votes.length / 100) * 100);
  }

  private calculateCampaignFinanceScore(finance: UnifiedCampaignFinance | null): number {
    if (!finance) return 0;
    if (finance.totalRaised > 0) return 100;
    return 0;
  }

  private calculateSocialMediaScore(representative: UnifiedRepresentative): number {
    const socialPlatforms = Object.keys(representative.socialMedia).length;
    return Math.round((socialPlatforms / 4) * 100); // 4 main platforms
  }
}

/**
 * Create a unified data orchestrator instance
 */
export function createUnifiedDataOrchestrator(): UnifiedDataOrchestrator {
  return new UnifiedDataOrchestrator();
}
