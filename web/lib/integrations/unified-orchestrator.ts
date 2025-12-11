/**
 * Unified Data Integration Orchestrator
 *
 * Manages multiple data sources and provides unified access to government data
 * Implements data quality scoring, conflict resolution, and source prioritization
 *
 * @author Agent E
 * @date 2025-01-15
 */


import {
  estimateDeadline,
  deriveKeyIssuesFromBills,
  determineOfficeCode,
  normalizeDistrict,
  getCurrentFecCycle,
  calculateCashOnHand,
  resolveLastFilingDate,
  buildCampaignActivity,
  createCampaignDataFallback,
  type CampaignCandidateSummary,
  type ActiveCampaignData,
  type RaceContext,
} from '@choices/civics-shared';

import { NotImplementedError } from '@/lib/errors';
import type {
  UserLocation,
  ElectoralRace,
  Representative,
  CampaignFinance,
} from '@/lib/types/electoral-unified';
import { logger } from '@/lib/utils/logger';

import { createCongressGovClient } from './congress-gov/client';
import { createFECClient } from './fec/client';
import { createGoogleCivicClient } from './google-civic/client';
import { createGovTrackClient } from './govtrack/client';
import { createOpenStatesClient } from './open-states/client';
import { createOpenSecretsClient } from './opensecrets/client';

import type { FECCandidate } from './fec/client';
import type { GoogleCivicElectionInfo } from '@/types/external/google-civic';

// Unified data types
export type UnifiedRepresentative = {
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

export type UnifiedVote = {
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

export type UnifiedCampaignFinance = {
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

type OrchestratorCandidateSummary = CampaignCandidateSummary & {
  finance: UnifiedCampaignFinance | null;
  totalRaised: number | null;
  totalSpent: number | null;
  cashOnHand: number | null;
  smallDonorPercentage: number | null;
  party: string | null;
  status: string | null;
  incumbentStatus: string | null;
  lastFilingDate: string | null;
};

type OrchestratorCampaignData = ActiveCampaignData & {
  candidates: OrchestratorCandidateSummary[];
};

export type DataQualityScore = {
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

type OrchestratorClients = {
  googleCivic?: ReturnType<typeof createGoogleCivicClient>;
  congressGov?: ReturnType<typeof createCongressGovClient>;
  openStates?: ReturnType<typeof createOpenStatesClient>;
  fec?: ReturnType<typeof createFECClient>;
  openSecrets?: ReturnType<typeof createOpenSecretsClient>;
  govTrack?: ReturnType<typeof createGovTrackClient>;
};

const toOrchestratorCampaignData = (data: ActiveCampaignData): OrchestratorCampaignData => ({
  ...data,
  candidates: (data.candidates ?? []).map((candidate) => ({
    candidateId: candidate.candidateId,
    name: candidate.name,
    party: candidate.party ?? null,
    status: candidate.status ?? null,
    incumbentStatus: candidate.incumbentStatus ?? null,
    totalRaised: candidate.totalRaised ?? null,
    totalSpent: candidate.totalSpent ?? null,
    cashOnHand: candidate.cashOnHand ?? null,
    smallDonorPercentage: candidate.smallDonorPercentage ?? null,
    lastFilingDate: candidate.lastFilingDate ?? null,
    finance: (candidate.finance as UnifiedCampaignFinance | null) ?? null,
  })),
});

export class UnifiedDataOrchestrator {
  private clients: OrchestratorClients;
  private electionContext: Map<string, RaceContext>;

  constructor() {
    this.clients = {};
    this.electionContext = new Map();
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
      logger.warn('Some API clients failed to initialize', { error });
      // Initialize with available clients only
      this.clients = {};
    }
  }

  /**
   * Get comprehensive representative data from all available sources
   */
  async getRepresentative(identifier: string, _type: 'bioguide' | 'name' | 'state-district' = 'bioguide'): Promise<UnifiedRepresentative | null> {
    const dataFromSources: Array<{ source: string; data: unknown; priority: number }> = [];

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
          logger.debug('Congress.gov lookup failed', { identifier, error });
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
          logger.debug('Open States lookup failed', { identifier, error });
        }
      }

      // Try FEC for campaign finance data
      if (this.clients.fec) {
        try {
          const fecData = await this.clients.fec.getCandidate(identifier);
          if (fecData.results[0]) {
            dataFromSources.push({
              source: 'fec',
              data: fecData.results[0],
              priority: SOURCE_PRIORITY['fec']
            });
          }
        } catch (error) {
          logger.debug('FEC lookup failed', { identifier, error });
        }
      }

      // Try OpenSecrets for enhanced data
      if (this.clients.openSecrets) {
        try {
          const openSecretsData = await this.clients.openSecrets.getCandidate(identifier);
          if (openSecretsData.response.legislator?.[0]) {
            dataFromSources.push({
              source: 'opensecrets',
              data: openSecretsData.response.legislator[0],
              priority: SOURCE_PRIORITY['opensecrets']
            });
          }
        } catch (error) {
          logger.debug('OpenSecrets lookup failed', { identifier, error });
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
          logger.debug('GovTrack lookup failed', { identifier, error });
        }
      }

      if (dataFromSources.length === 0) {
        return null;
      }

      // Merge data from all sources, prioritizing higher-priority sources
      return this.mergeRepresentativeData(dataFromSources);

    } catch (error) {
      logger.error('Failed to get representative data', { identifier, error });
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
            ...(congress !== undefined && { congress }),
            limit: 100
          });

          for (const vote of congressVotes) {
            votes.push({
              id: `${vote.congress}-${vote.session}-${vote.rollCall}`,
              representativeId,
              ...(vote.documentNumber && { billId: vote.documentNumber }),
              ...(vote.documentTitle && { billTitle: vote.documentTitle }),
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
          logger.debug('Congress.gov voting record failed', { representativeId, error });
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
          logger.debug('Open States voting record failed', { representativeId, error });
        }
      }

      return votes;

    } catch (error) {
      logger.error('Failed to get voting record', { representativeId, error });
      return [];
    }
  }

  /**
   * Get campaign finance data for a representative
   */
  async getCampaignFinance(representativeId: string, cycle: number): Promise<UnifiedCampaignFinance | null> {
    const financeData: Record<string, unknown> = {};

    try {
      // Get FEC data (primary source)
      if (this.clients.fec) {
        try {
          const fecSummary = await this.clients.fec.getCandidateFinancialSummary(representativeId, cycle);
          if (fecSummary) {
            financeData.fec = fecSummary;
          }
        } catch (error) {
          logger.debug('FEC campaign finance failed', { representativeId, error });
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
          logger.debug('OpenSecrets campaign finance failed', { representativeId, error });
        }
      }

      if (Object.keys(financeData).length === 0) {
        return null;
      }

      return this.mergeCampaignFinanceData(financeData, representativeId, cycle);

    } catch (error) {
      logger.error('Failed to get campaign finance data', { representativeId, error });
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
      logger.error('Failed to calculate data quality', { representativeId, error });
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
  getUsageMetrics(): Record<string, unknown> {
    const metrics: Record<string, unknown> = {};

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
  private mergeRepresentativeData(sources: Array<{ source: string; data: unknown; priority: number }>): UnifiedRepresentative {
    // Sort by priority (highest first)
    sources.sort((a, b) => b.priority - a.priority);

    const firstSource = sources[0];
    if (!firstSource) {
      throw new Error('No data sources provided for merge');
    }

    // Type guard for representative data from various sources
    const sourceData = firstSource.data as Record<string, unknown>;
    const merged: Partial<UnifiedRepresentative> & Record<string, unknown> = {
      id: (sourceData.bioguideId as string | undefined) ?? (sourceData.id as string | undefined) ?? `unknown-${Date.now()}`,
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
      sourcePriority: firstSource.priority
    };

    // Merge data from all sources
    for (const { source, data } of sources) {
      const sourceName = source.replace('-', '') as keyof UnifiedRepresentative['dataSources'];
      if (merged.dataSources && sourceName in merged.dataSources) {
        (merged.dataSources)[sourceName] = true;
      }

      const dataRecord = data as Record<string, unknown>;
      // Merge basic info (prioritize higher-priority sources)
      if (!merged.name && dataRecord.fullName) merged.name = dataRecord.fullName as string;
      if (!merged.firstName && dataRecord.firstName) merged.firstName = dataRecord.firstName as string;
      if (!merged.lastName && dataRecord.lastName) merged.lastName = dataRecord.lastName as string;
      if (!merged.party && dataRecord.party) merged.party = dataRecord.party as string;
      if (!merged.state && dataRecord.state) merged.state = dataRecord.state as string;
      if (!merged.district && dataRecord.district) merged.district = dataRecord.district as string;
      if (!merged.email && dataRecord.email) merged.email = dataRecord.email as string;
      if (!merged.phone && dataRecord.phone) merged.phone = dataRecord.phone as string;
      if (!merged.website && dataRecord.website) merged.website = dataRecord.website as string;

      // Merge social media
      if (merged.socialMedia && dataRecord.twitter_id) merged.socialMedia.twitter = dataRecord.twitter_id as string;
      if (merged.socialMedia && dataRecord.facebook_id) merged.socialMedia.facebook = dataRecord.facebook_id as string;
      if (merged.socialMedia && dataRecord.youtube_url) merged.socialMedia.youtube = dataRecord.youtube_url as string;
    }

    // Calculate completeness
    merged.completeness = this.calculateCompleteness(merged);

    // Determine data quality
    if (merged.completeness >= 80) merged.dataQuality = 'high';
    else if (merged.completeness >= 60) merged.dataQuality = 'medium';
    else merged.dataQuality = 'low';

    return merged as UnifiedRepresentative;
  }

  private mergeCampaignFinanceData(financeData: Record<string, unknown>, representativeId: string, cycle: number): UnifiedCampaignFinance {
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

  private calculateCompleteness(representative: Partial<UnifiedRepresentative>): number {
    const fields: Array<keyof UnifiedRepresentative> = ['name', 'firstName', 'lastName', 'party', 'state', 'chamber', 'email', 'phone', 'website'];
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

  private summarizeLocation(location?: UserLocation) {
    if (!location) {
      return undefined;
    }

    return {
      stateCode: location.stateCode,
      zipCode: location.zipCode,
      hasCoordinates: Boolean(location.coordinates),
      hasAddress: Boolean(location.address),
    };
  }

  private throwNotImplemented(method: string, extras?: Record<string, unknown>): never {
    const message = `${method} is not yet wired to the civics data pipeline.`;

    if (extras) {
      logger.warn('UnifiedDataOrchestrator method not implemented', { method, extras });
      throw new NotImplementedError(message, {
        context: { method: `UnifiedDataOrchestrator.${method}` },
        value: extras,
      });
    }

    logger.warn('UnifiedDataOrchestrator method not implemented', { method });
    throw new NotImplementedError(message, {
      context: { method: `UnifiedDataOrchestrator.${method}` },
    });
  }

  // Explicitly surface missing implementations so callers can degrade gracefully
  async getUpcomingElections(location: UserLocation): Promise<ElectoralRace[]> {
    const address = this.buildLookupAddress(location);

    if (!this.clients.googleCivic) {
      logger.warn('Google Civic client not available when requesting upcoming elections');
      return [await this.buildFallbackRace(location)];
    }

    if (!address) {
      logger.warn('Unable to derive address for upcoming elections lookup', {
        location: this.summarizeLocation(location),
      });
      return [await this.buildFallbackRace(location)];
    }

    try {
      const electionInfo = await this.clients.googleCivic.getElectionInfo(address);
      const elections = electionInfo?.elections ?? [];

      if (elections.length === 0) {
        logger.info('No upcoming elections returned for location', {
          location: this.summarizeLocation(location),
        });
        return [await this.buildFallbackRace(location)];
      }

      const races = await Promise.all(
        elections.map((election) => this.transformElection(election, location)),
      );

      // Filter out any elections we failed to transform
      const validRaces = races.filter((race): race is ElectoralRace => Boolean(race));

      if (validRaces.length === 0) {
        logger.warn('Election transformation produced no valid races, using fallback', {
          location: this.summarizeLocation(location),
        });
        return [await this.buildFallbackRace(location)];
      }

      return validRaces;
    } catch (error) {
      logger.error('Failed to load upcoming elections from Google Civic', {
        location: this.summarizeLocation(location),
        error,
      });
      return [await this.buildFallbackRace(location)];
    }
  }

  async getActiveCampaignData(raceId: string): Promise<OrchestratorCampaignData> {
    const context = this.electionContext.get(raceId);

    if (!context) {
      logger.warn('No election context available for race', { raceId });
      return toOrchestratorCampaignData(createCampaignDataFallback(raceId));
    }

    if (!this.clients.fec) {
      logger.warn('FEC client unavailable when requesting campaign data', { raceId });
      return toOrchestratorCampaignData(createCampaignDataFallback(raceId));
    }

    const stateCode = context.stateCode;
    const officeCode = determineOfficeCode(context.office);

    if (!stateCode || !officeCode) {
      logger.warn('Insufficient data to determine campaign query parameters', {
        raceId,
        context,
      });
      return toOrchestratorCampaignData(createCampaignDataFallback(raceId));
    }

    const cycle = getCurrentFecCycle();
    const params: {
      state: string;
      office: string;
      cycle: number;
      limit: number;
      district?: string;
    } = {
      state: stateCode,
      office: officeCode,
      cycle,
      limit: 25,
    };

    if (officeCode === 'H') {
      const normalizedDistrict = normalizeDistrict(context.district);
      if (normalizedDistrict) {
        params.district = normalizedDistrict;
      }
    }

    let candidateResults: FECCandidate[] = [];
    try {
      const candidatesResponse = await this.clients.fec.getCandidates(params);
      candidateResults = (candidatesResponse?.results ?? []) as FECCandidate[];
    } catch (error) {
      logger.error('FEC candidate lookup failed', { raceId, params, error });
      return toOrchestratorCampaignData(createCampaignDataFallback(raceId));
    }

    if (candidateResults.length === 0) {
      logger.info('FEC returned no candidates for race', { raceId, params });
      return toOrchestratorCampaignData(createCampaignDataFallback(raceId));
    }

    const topCandidates = candidateResults.slice(0, 5);
    const candidateSummaries: OrchestratorCandidateSummary[] = [];

    for (const candidate of topCandidates) {
      let finance: UnifiedCampaignFinance | null = null;

      try {
        finance = (await this.getCampaignFinance(candidate.candidate_id, cycle)) ?? null;
      } catch (error) {
        logger.debug('Campaign finance lookup failed for candidate', {
          candidateId: candidate.candidate_id,
          error,
        });
      }

      candidateSummaries.push({
        candidateId: candidate.candidate_id,
        name: candidate.name,
        party: candidate.party_full ?? candidate.party ?? null,
        status: candidate.candidate_status ?? null,
        incumbentStatus: candidate.incumbent_challenge ?? null,
        totalRaised: finance ? finance.totalRaised : null,
        totalSpent: finance ? finance.totalSpent : null,
        cashOnHand: finance ? calculateCashOnHand(finance) : null,
        smallDonorPercentage: finance ? finance.smallDonorPercentage : null,
        lastFilingDate: resolveLastFilingDate(finance, candidate),
        finance,
      });
    }

    const recentActivity = buildCampaignActivity(candidateSummaries, cycle);

    const campaignData: OrchestratorCampaignData = {
      source: 'fec',
      fetchedAt: new Date().toISOString(),
      cycle,
      candidates: candidateSummaries,
      recentActivity,
      constituentQuestions: 0,
      candidateResponses: 0,
    };

    return campaignData;
  }

  async getJurisdictionKeyIssues(
    location: UserLocation,
  ): Promise<Array<{ issue: string; mentions: number; source?: string; latestAction?: string }>> {
    const stateCode = this.resolveStateCode(location);

    if (!stateCode) {
      logger.warn('Unable to determine state code for jurisdiction issue lookup', {
        location: this.summarizeLocation(location),
      });
      return [];
    }

    if (!this.clients.openStates) {
      logger.warn('OpenStates client unavailable for jurisdiction issue lookup');
      return [];
    }

    try {
      const bills = await this.clients.openStates.getBills({
        state: stateCode.toLowerCase(),
        limit: 50,
      });

      if (!bills || bills.length === 0) {
        logger.info('OpenStates returned no bills for state', { stateCode });
        return [];
      }

      const signals = deriveKeyIssuesFromBills(bills, {
        source: 'openstates',
        limit: 8,
      });

      if (signals.length === 0) {
        logger.warn('No subjects derived from OpenStates bills', { stateCode });
      }

      return signals;
    } catch (error) {
      logger.error('Failed to derive jurisdiction key issues from OpenStates', {
        stateCode,
        error,
      });
      return [];
    }
  }

  async getCandidatePostGovernmentEmployment(candidateId: string): Promise<unknown[]> {
    logger.warn('getCandidatePostGovernmentEmployment not wired; returning empty result', { candidateId });
    return [];
  }

  async getCandidateCorporateConnections(candidateId: string): Promise<unknown[]> {
    return this.throwNotImplemented('getCandidateCorporateConnections', { candidateId });
  }

  async getCandidatePolicyPositions(candidateId: string): Promise<unknown[]> {
    return this.throwNotImplemented('getCandidatePolicyPositions', { candidateId });
  }

  private buildLookupAddress(location: UserLocation): string | null {
    if (location.address) {
      return location.address;
    }

    const segments: string[] = [];
    if (location.city) {
      segments.push(location.city);
    }
    if (location.stateCode) {
      segments.push(location.stateCode);
    }
    if (location.zipCode) {
      segments.push(location.zipCode);
    }

    if (segments.length > 0) {
      return segments.join(', ');
    }

    if (location.coordinates) {
      return `${location.coordinates.lat}, ${location.coordinates.lng}`;
    }

    return null;
  }

  private async transformElection(
    election: GoogleCivicElectionInfo['elections'][number],
    location: UserLocation,
  ): Promise<ElectoralRace | null> {
    const { stateCode, district, jurisdiction } = this.extractDivisionMetadata(
      election.ocdDivisionId,
      location.stateCode,
    );

    const electionDate = election.electionDay;
    const cycle = this.extractElectionCycle(electionDate);

    const incumbent = this.createPlaceholderRepresentative({
      id: `incumbent-${election.id}`,
      name: 'Incumbent (Pending)',
      party: 'Unknown',
      office: election.name,
      jurisdiction,
      ...(stateCode ? { state: stateCode } : location.stateCode ? { state: location.stateCode } : {}),
      ...(district ? { district } : {}),
    });

    const raceFinance = this.createPlaceholderCampaignFinance(`race-${election.id}`, cycle, 'google-civic');

    const race: ElectoralRace = {
      raceId: election.id,
      office: election.name,
      jurisdiction,
      electionDate,
      incumbent,
      challengers: [],
      allCandidates: [],
      keyIssues: [],
      campaignFinance: raceFinance,
      pollingData: null,
      voterRegistrationDeadline: estimateDeadline(electionDate, 21), // ~3 weeks prior
      earlyVotingStart: estimateDeadline(electionDate, -14), // ~2 weeks after (placeholder)
      absenteeBallotDeadline: estimateDeadline(electionDate, 7), // ~1 week prior
      recentActivity: [],
      constituentQuestions: 0,
      candidateResponses: 0,
      status: 'upcoming',
      importance: this.determineRaceImportance(election.name, jurisdiction),
    };

    const electionContext = {
      jurisdiction,
      office: election.name,
    } as { jurisdiction: string; stateCode?: string; district?: string; office?: string };

    if (stateCode) {
      electionContext.stateCode = stateCode;
    }
    if (district) {
      electionContext.district = district;
    }

    this.electionContext.set(election.id, electionContext);

    return race;
  }

  private extractElectionCycle(electionDate: string | undefined): number {
    if (!electionDate) {
      return new Date().getFullYear();
    }

    const parsed = new Date(electionDate);
    if (Number.isNaN(parsed.getTime())) {
      return new Date().getFullYear();
    }

    return parsed.getUTCFullYear();
  }

  private determineRaceImportance(
    electionName: string,
    jurisdiction: string,
  ): 'high' | 'medium' | 'low' {
    const normalizedName = electionName.toLowerCase();

    if (
      normalizedName.includes('presidential') ||
      normalizedName.includes('general') ||
      normalizedName.includes('federal')
    ) {
      return 'high';
    }

    if (normalizedName.includes('primary') || normalizedName.includes('statewide')) {
      return 'medium';
    }

    if (jurisdiction.toLowerCase().includes('municipal')) {
      return 'low';
    }

    return 'medium';
  }

  private estimateDeadline(dateString: string, offsetDays: number): string {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return '' as unknown as string; // use nullish at call sites instead of placeholder text
    }

    const adjusted = new Date(date);
    adjusted.setUTCDate(date.getUTCDate() - offsetDays);
    return adjusted.toISOString().slice(0, 10);
  }

  private extractDivisionMetadata(
    divisionId: string | undefined,
    fallbackState?: string,
  ): {
    stateCode?: string;
    district?: string;
    jurisdiction: string;
  } {
    if (!divisionId) {
      const base: { jurisdiction: string; stateCode?: string } = {
        jurisdiction: fallbackState ?? 'US',
      };
      if (fallbackState) {
        base.stateCode = fallbackState.toUpperCase();
      }
      return base;
    }

    const stateMatch = divisionId.match(/state:([a-z]{2})/i);
    const districtMatch = divisionId.match(/(?:cd|sldl|sldu):([a-z0-9]+)/i);
    const countyMatch = divisionId.match(/county:([a-z_]+)/i);
    const localityMatch = divisionId.match(/place:([a-z_]+)/i);

    const stateCode =
      stateMatch?.[1]?.toUpperCase() ?? (fallbackState ? fallbackState.toUpperCase() : undefined);
    const district = districtMatch?.[1]?.toUpperCase();

    const jurisdictionSegments = [
      'ocd-division',
      stateCode ? `state:${stateCode}` : null,
      countyMatch ? `county:${countyMatch[1]}` : null,
      localityMatch ? `locality:${localityMatch[1]}` : null,
      district ? `district:${district}` : null,
    ].filter(Boolean) as string[];

    const result: { jurisdiction: string; stateCode?: string; district?: string } = {
      jurisdiction: jurisdictionSegments.join('/'),
    };

    if (stateCode) {
      result.stateCode = stateCode;
    }
    if (district) {
      result.district = district;
    }

    return result;
  }

  private resolveStateCode(location: UserLocation): string | null {
    if (location.stateCode) {
      return location.stateCode.toUpperCase();
    }

    const federalDistrict = location.federal?.house?.district;
    if (federalDistrict && federalDistrict.includes('-')) {
      return federalDistrict.split('-')[0]?.toUpperCase() ?? null;
    }

    const locality = location.local?.city?.mayor;
    if (locality) {
      const match = locality.match(/\b([A-Z]{2})\b/);
      if (match?.[1]) {
        return match[1].toUpperCase();
      }
    }

    return null;
  }

  private createPlaceholderRepresentative(options: {
    id: string;
    name: string;
    party?: string;
    office?: string;
    jurisdiction?: string;
    state?: string;
    district?: string;
  }): Representative {
    const campaignFinance = this.createPlaceholderCampaignFinance(
      options.id,
      new Date().getFullYear(),
      'placeholder',
    );

    const representative: Representative = {
      id: options.id,
      name: options.name,
      party: options.party ?? 'Unknown',
      office: options.office ?? 'Unknown Office',
      jurisdiction: options.jurisdiction ?? options.state ?? 'US',
      socialMedia: {},
      votingRecord: {
        totalVotes: 0,
        partyLineVotes: 0,
        constituentAlignment: 0,
        keyVotes: [],
      },
      campaignFinance,
      engagement: {
        responseRate: 0,
        averageResponseTime: 0,
        constituentQuestions: 0,
        publicStatements: 0,
      },
      walk_the_talk_score: {
        overall: 0,
        promise_fulfillment: 0,
        constituentAlignment: 0,
        financial_independence: 0,
      },
      recentActivity: [],
      platform: [],
    };

    if (options.district) {
      representative.district = options.district;
    }
    if (options.state && !options.jurisdiction) {
      representative.jurisdiction = options.state;
    }

    return representative;
  }

  private createPlaceholderCampaignFinance(
    id: string,
    cycle: number,
    source: string,
  ): CampaignFinance {
    return {
      id,
      representativeId: id,
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
      sources: [source],
      lastUpdated: new Date().toISOString(),
      dataQuality: 'low',
    };
  }

  private async buildFallbackRace(location: UserLocation): Promise<ElectoralRace> {
    const placeholderRepresentative = this.createPlaceholderRepresentative({
      id: 'placeholder-incumbent',
      name: 'Information Pending',
      jurisdiction: location.stateCode ?? 'US',
      ...(location.stateCode ? { state: location.stateCode } : {}),
    });

    const fallbackContext = {
      jurisdiction: location.stateCode ?? 'US',
      office: 'Upcoming Election',
    } as { jurisdiction: string; stateCode?: string; office?: string };

    if (location.stateCode) {
      fallbackContext.stateCode = location.stateCode.toUpperCase();
    }

    this.electionContext.set('placeholder-race', fallbackContext);

    const electionDate = new Date().toISOString().slice(0, 10);
    const voterRegistrationDeadline = this.estimateDeadline(electionDate, 21);
    const earlyVotingStart = this.estimateDeadline(electionDate, -14);
    const absenteeBallotDeadline = this.estimateDeadline(electionDate, 7);

    return {
      raceId: 'placeholder-race',
      office: 'Upcoming Election',
      jurisdiction: location.stateCode ?? 'US',
      electionDate,
      incumbent: placeholderRepresentative,
      challengers: [],
      allCandidates: [],
      keyIssues: [],
      campaignFinance: this.createPlaceholderCampaignFinance(
        'placeholder-race',
        new Date().getFullYear(),
        'placeholder',
      ),
      pollingData: null,
      voterRegistrationDeadline,
      earlyVotingStart,
      absenteeBallotDeadline,
      recentActivity: [],
      constituentQuestions: 0,
      candidateResponses: 0,
      status: 'upcoming',
      importance: 'medium',
    };
  }
}

/**
 * Create a unified data orchestrator instance
 */
export function createUnifiedDataOrchestrator(): UnifiedDataOrchestrator {
  return new UnifiedDataOrchestrator();
}
