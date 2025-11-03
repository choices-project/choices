/**
 * Geographic-Based Electoral Feed System
 * 
 * Transforms user location into comprehensive electoral landscape
 * Shows current officials, upcoming races, and all candidates
 * 
 * @author Agent E
 * @date 2025-01-15
 */

import { dev } from '../dev.logger';
import { createUnifiedDataOrchestrator } from '../integrations/unified-orchestrator';
import type {
  UserLocation,
  ElectoralRace,
  Representative,
  Candidate,
  CampaignFinance,
  Activity
} from '../types/electoral-unified';
import { withOptional } from '../util/objects';

// Geographic and electoral types (using imported types from electoral-types.ts)

// ElectoralRace interface is imported from electoral-types.ts

// Representative interface is imported from electoral-types.ts

// Candidate interface is imported from electoral-types.ts

// CampaignFinance, Contributor, Vote, and Activity interfaces are imported from electoral-types.ts

export type ElectoralFeed = {
  userId: string;
  location: UserLocation;
  generatedAt: string;
  
  // Current Officials
  currentOfficials: {
    federal: Representative[];
    state: Representative[];
    local: Representative[];
  };
  
  // Upcoming Elections
  upcomingElections: ElectoralRace[];
  
  // Active Races
  activeRaces: ElectoralRace[];
  
  // Key Issues
  keyIssues: Array<{
    issue: string;
    importance: 'high' | 'medium' | 'low';
    candidates: string[];
    recentActivity: Activity[];
  }>;
  
  // Engagement Opportunities
  engagementOpportunities: Array<{
    type: 'question' | 'endorsement' | 'concern' | 'suggestion';
    target: string;
    description: string;
    urgency: 'high' | 'medium' | 'low';
  }>;
}

export class GeographicElectoralFeed {
  private orchestrator: ReturnType<typeof createUnifiedDataOrchestrator>;

  constructor() {
    this.orchestrator = createUnifiedDataOrchestrator();
  }

  /**
   * Generate comprehensive electoral feed for user location
   */
  async generateElectoralFeed(
    userId: string,
    locationInput: { zipCode?: string; address?: string; coordinates?: { lat: number; lng: number } }
  ): Promise<ElectoralFeed> {
    try {
      dev.logger.info('Generating electoral feed', { userId, locationInput });

      // Step 1: Resolve location to jurisdictions
      const location = await this.resolveLocation(locationInput);
      
      // Step 2: Get current officials
      const currentOfficials = await this.getCurrentOfficials(location);
      
      // Step 3: Get upcoming elections
      const upcomingElections = await this.getUpcomingElections(location);
      
      // Step 4: Get active races
      const activeRaces = await this.getActiveRaces(location);
      
      // Step 5: Identify key issues
      const keyIssues = await this.identifyKeyIssues(location, currentOfficials, activeRaces);
      
      // Step 6: Generate engagement opportunities
      const engagementOpportunities = await this.generateEngagementOpportunities(
        location,
        currentOfficials,
        activeRaces
      );

      const feed: ElectoralFeed = {
        userId,
        location,
        generatedAt: new Date().toISOString(),
        currentOfficials,
        upcomingElections,
        activeRaces,
        keyIssues,
        engagementOpportunities
      };

      dev.logger.info('Electoral feed generated successfully', {
        userId,
        officialsCount: Object.values(currentOfficials).flat().length,
        upcomingElectionsCount: upcomingElections.length,
        activeRacesCount: activeRaces.length,
        keyIssuesCount: keyIssues.length
      });

      return feed;

    } catch (error) {
      dev.logger.error('Failed to generate electoral feed', { userId, error });
      throw new Error(`Failed to generate electoral feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Resolve location input to comprehensive jurisdiction data
   */
  private async resolveLocation(locationInput: { zipCode?: string; address?: string; coordinates?: { lat: number; lng: number } }): Promise<UserLocation> {
    // This would integrate with Google Civic API or similar geocoding service
    // For now, return a mock structure
    
    const location: UserLocation = {
      ...(locationInput.zipCode && { zipCode: locationInput.zipCode }),
      ...(locationInput.address && { address: locationInput.address }),
      ...(locationInput.coordinates && { coordinates: locationInput.coordinates }),
      stateCode: 'CA',
      federal: {
        house: { district: 'CA-12', representative: 'Nancy Pelosi' },
        senate: { senators: ['Dianne Feinstein', 'Alex Padilla'] }
      },
      state: {
        governor: 'Gavin Newsom',
        legislature: {
          house: { district: 'CA-17', representative: 'David Chiu' },
          senate: { district: 'CA-11', representative: 'Scott Wiener' }
        }
      },
      local: {
        county: { executive: 'London Breed', commissioners: [] },
        city: { mayor: 'London Breed', council: [] },
        school: { board: [] }
      }
    };

    return location;
  }

  /**
   * Get current officials for all jurisdictions
   */
  private async getCurrentOfficials(location: UserLocation): Promise<{
    federal: Representative[];
    state: Representative[];
    local: Representative[];
  }> {
    const officials = {
      federal: [] as Representative[],
      state: [] as Representative[],
      local: [] as Representative[]
    };

    try {
      // Get federal officials
      if (location.federal.house.representative) {
        const houseRep = await this.orchestrator.getRepresentative(location.federal.house.representative);
        if (houseRep) {
          officials.federal.push(await this.enrichRepresentative(houseRep, 'federal', 'house'));
        }
      }

      // Get state officials
      if (location.state && typeof location.state === 'object' && 'legislature' in location.state) {
        const state = location.state as { legislature: { house: { representative: string } } };
        if (state.legislature.house.representative) {
          const stateRep = await this.orchestrator.getRepresentative(state.legislature.house.representative);
          if (stateRep) {
            officials.state.push(await this.enrichRepresentative(stateRep, 'state', 'house'));
          }
        }
      }

      // Get local officials (would need additional data sources)
      // This would integrate with local government APIs or manual data collection

    } catch (error) {
      dev.logger.error('Failed to get current officials', { error });
    }

    return officials;
  }

  /**
   * Get upcoming elections for the jurisdiction
   */
  private async getUpcomingElections(location: UserLocation): Promise<ElectoralRace[]> {
    const elections: ElectoralRace[] = [];

    try {
      dev.logger.info('Getting upcoming elections for location', { location });
      
      // Get election data from orchestrator
      const orchestrator = await createUnifiedDataOrchestrator();
      const electionData = await orchestrator.getUpcomingElections(location);
      
      if (electionData && Array.isArray(electionData)) {
        return Promise.all(electionData.map(async (election: unknown) => {
          if (election && typeof election === 'object') {
            const race = election as Record<string, unknown>;
            return {
              raceId: (race.raceId as string) ?? '',
              office: (race.office as string) ?? '',
              jurisdiction: (race.jurisdiction as string) ?? '',
              electionDate: (race.electionDate as string) ?? '',
              incumbent: (race.incumbent as Representative) ?? await this.getMockRepresentative('Unknown'),
              challengers: (race.challengers as Representative[]) ?? [],
              allCandidates: (race.allCandidates as Candidate[]) ?? [],
              keyIssues: (race.keyIssues as string[]) ?? [],
              campaignFinance: (race.campaignFinance as CampaignFinance) ?? await this.getMockCampaignFinance('unknown'),
              pollingData: race.pollingData ?? null,
              voterRegistrationDeadline: (race.voterRegistrationDeadline as string) ?? '',
              earlyVotingStart: (race.earlyVotingStart as string) ?? '',
              absenteeBallotDeadline: (race.absenteeBallotDeadline as string) ?? '',
              recentActivity: [],
              constituentQuestions: 0,
              candidateResponses: 0,
              status: 'upcoming' as const,
              importance: 'medium' as const
            };
          }
          return this.getMockElectoralRace();
        }));
      }
      
      // Fallback to mock data if no real data available
      
      elections.push({
        raceId: 'ca-12-house-2024',
        office: 'U.S. House of Representatives',
        jurisdiction: 'CA-12',
        electionDate: '2024-11-05',
        incumbent: await this.getMockRepresentative('Nancy Pelosi'),
        challengers: [
          await this.getMockRepresentative('John Smith'),
          await this.getMockRepresentative('Jane Doe')
        ],
        allCandidates: [],
        keyIssues: ['Healthcare', 'Climate Change', 'Housing'],
        campaignFinance: await this.getMockCampaignFinance('incumbent'),
        recentActivity: [],
        constituentQuestions: 0,
        candidateResponses: 0,
        status: 'upcoming',
        importance: 'high',
        voterRegistrationDeadline: '2024-10-15',
        earlyVotingStart: '2024-10-20',
        absenteeBallotDeadline: '2024-10-30'
      });

    } catch (error) {
      dev.logger.error('Failed to get upcoming elections', { error });
    }

    return elections;
  }

  /**
   * Get active races (currently campaigning)
   */
  private async getActiveRaces(location: UserLocation): Promise<ElectoralRace[]> {
    try {
      dev.logger.info('Getting active races for location', { location });
      
      // Get all upcoming elections first
      const upcomingElections = await this.getUpcomingElections(location);
      
      // Filter for races that are currently in active campaign phase
      const activeRaces = upcomingElections.filter(race => {
        const electionDate = new Date(race.electionDate);
        const now = new Date();
        const daysUntilElection = Math.ceil((electionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Consider a race "active" if it's within 6 months of the election
        return daysUntilElection > 0 && daysUntilElection <= 180;
      });
      
      // Enrich active races with additional campaign data
      const enrichedRaces = await Promise.all(activeRaces.map(async (race) => {
        try {
          const orchestrator = await createUnifiedDataOrchestrator();
          const campaignData = await orchestrator.getActiveCampaignData(race.raceId);
          
          if (campaignData && typeof campaignData === 'object') {
            const data = campaignData as Record<string, unknown>;
            return Object.assign({}, race, {
              recentActivity: (data.recentActivity as Activity[]) ?? race.recentActivity,
              constituentQuestions: (data.constituentQuestions as number) ?? race.constituentQuestions,
              candidateResponses: (data.candidateResponses as number) ?? race.candidateResponses,
              status: 'active' as const
            });
          }
        } catch (error) {
          dev.logger.error('Failed to enrich race with campaign data', { raceId: race.raceId, error });
        }
        
        return Object.assign({}, race, {
          status: 'active' as const
        });
      }));
      
      return enrichedRaces;
    } catch (error) {
      dev.logger.error('Failed to get active races', { error });
      return [];
    }
  }

  /**
   * Identify key issues for the jurisdiction
   */
  private async identifyKeyIssues(
    location: UserLocation,
    currentOfficials: {
      federal: Representative[];
      state: Representative[];
      local: Representative[];
    },
    activeRaces: ElectoralRace[]
  ): Promise<Array<{ issue: string; importance: 'high' | 'medium' | 'low'; candidates: string[]; recentActivity: Activity[] }>> {
    try {
      dev.logger.info('Identifying key issues for jurisdiction', { location });
      
      const issues: Array<{ issue: string; importance: 'high' | 'medium' | 'low'; candidates: string[]; recentActivity: Activity[] }> = [];
      
      // Get issue data from orchestrator
      const orchestrator = await createUnifiedDataOrchestrator();
      const issueData = await orchestrator.getJurisdictionKeyIssues(location);
      
      if (issueData && Array.isArray(issueData)) {
        for (const issueItem of issueData) {
          if (issueItem && typeof issueItem === 'object') {
            const item = issueItem as Record<string, unknown>;
            
            // Get candidates who have positions on this issue
            const candidates = await this.getCandidatesForIssue(item.issue as string, activeRaces);
            
            // Get recent activity related to this issue
            const recentActivity = await this.getRecentActivityForIssue(item.issue as string, currentOfficials);
            
            issues.push({
              issue: (item.issue as string) ?? 'Unknown Issue',
              importance: this.determineIssueImportance(item.issue as string, (item.mentions as number) ?? 0),
              candidates,
              recentActivity
            });
          }
        }
      }
      
      // If no data from orchestrator, analyze from available data
      if (issues.length === 0) {
        issues.push(...await this.analyzeIssuesFromData(currentOfficials, activeRaces));
      }
      
      // Sort by importance
      return issues.sort((a, b) => {
        const importanceOrder = { high: 3, medium: 2, low: 1 };
        return importanceOrder[b.importance] - importanceOrder[a.importance];
      });
    } catch (error) {
      dev.logger.error('Failed to identify key issues', { error });
      return [];
    }
  }

  /**
   * Generate engagement opportunities for the user
   */
  private async generateEngagementOpportunities(
    location: UserLocation,
    currentOfficials: {
      federal: Representative[];
      state: Representative[];
      local: Representative[];
    },
    activeRaces: ElectoralRace[]
  ): Promise<Array<{ type: 'question' | 'endorsement' | 'concern' | 'suggestion'; target: string; description: string; urgency: 'high' | 'medium' | 'low' }>> {
    const opportunities = [];

    // Add opportunities based on current officials
    for (const official of Object.values(currentOfficials).flat()) {
      if (official && typeof official === 'object' && 'name' in official) {
        opportunities.push({
          type: 'question' as const,
          target: (official as any).name,
          description: `Ask ${(official as any).name} about their position on key issues`,
          urgency: 'medium' as const
        });
      }
    }

    // Add opportunities based on active races
    for (const race of activeRaces) {
      for (const candidate of race.allCandidates) {
        opportunities.push({
          type: 'question' as const,
          target: candidate.name,
          description: `Ask ${candidate.name} about their platform`,
          urgency: 'high' as const
        });
      }
    }

    return opportunities;
  }

  /**
   * Enrich representative data with additional information
   */
  private async enrichRepresentative(
    representative: { id: string; name: string; party: string; state: string; district?: string; email?: string; phone?: string; website?: string; socialMedia?: Record<string, string> },
    chamber: 'federal' | 'state' | 'local',
    level: 'house' | 'senate' | 'assembly' | 'council'
  ): Promise<Representative> {
    // Get voting record
    const votes = await this.orchestrator.getVotingRecord(representative.id);
    
    // Get campaign finance
    const campaignFinance = await this.orchestrator.getCampaignFinance(representative.id, 2024);
    
    // Calculate "Walk the Talk" score
    const walkTheTalkScore = await this.calculateWalkTheTalkScore(representative.id);

    return withOptional(
      {
        id: representative.id,
        name: representative.name,
        party: representative.party,
        office: `${chamber} ${level}`,
        jurisdiction: representative.state,
        socialMedia: representative.socialMedia ?? {},
      votingRecord: {
        totalVotes: votes.length,
        partyLineVotes: votes.filter(v => v.partyLineVote).length,
        constituentAlignment: votes.length > 0 ? votes.reduce((sum, v) => sum + (v.constituentAlignment ?? 0), 0) / votes.length : 0,
        keyVotes: votes.slice(0, 10).map(vote => ({
          id: vote.id,
          billId: vote.billId ?? 'unknown',
          billTitle: vote.billTitle ?? vote.question,
          question: vote.question,
          vote: vote.vote,
          result: vote.result,
          date: vote.date,
          partyLineVote: vote.partyLineVote,
          constituentAlignment: vote.constituentAlignment ?? 0
        }))
      },
      campaignFinance: campaignFinance ?? await this.getMockCampaignFinance('incumbent'),
      engagement: {
        responseRate: 0, // Would need additional data
        averageResponseTime: 0,
        constituentQuestions: 0,
        publicStatements: 0
      },
        walk_the_talk_score: walkTheTalkScore
      },
      {
        district: representative.district,
        email: representative.email,
        phone: representative.phone,
        website: representative.website
      }
    );
  }

  /**
   * Calculate "Walk the Talk" score for a representative
   */
  private async calculateWalkTheTalkScore(representativeId: string): Promise<{
    overall: number;
    promise_fulfillment: number;
    constituentAlignment: number;
    financial_independence: number;
  }> {
    // This would implement the comprehensive "Walk the Talk" analysis
    // For now, return mock data based on representative ID for consistency
    const hash = representativeId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const baseScore = Math.abs(hash) % 30 + 60; // Score between 60-90
    
    return {
      overall: baseScore,
      promise_fulfillment: baseScore + 5,
      constituentAlignment: baseScore - 5,
      financial_independence: baseScore
    };
  }

  // Mock data methods (to be replaced with real data)
  private async getMockRepresentative(name: string): Promise<Representative> {
    return {
      id: `mock-${name.toLowerCase().replace(' ', '-')}`,
      name,
      party: 'Democratic',
      office: 'U.S. House of Representatives',
      jurisdiction: 'CA-12',
      district: '12',
      email: `${name.toLowerCase().replace(' ', '.')}@house.gov`,
      phone: '(202) 555-0123',
      website: `https://${name.toLowerCase().replace(' ', '')}.house.gov`,
      socialMedia: {
        twitter: `@${name.toLowerCase().replace(' ', '')}`,
        facebook: `https://facebook.com/${name.toLowerCase().replace(' ', '')}`
      },
      votingRecord: {
        totalVotes: 150,
        partyLineVotes: 120,
        constituentAlignment: 75,
        keyVotes: []
      },
      campaignFinance: await this.getMockCampaignFinance('incumbent'),
      engagement: {
        responseRate: 85,
        averageResponseTime: 2,
        constituentQuestions: 150,
        publicStatements: 25
      },
      walk_the_talk_score: {
        overall: 75,
        promise_fulfillment: 80,
        constituentAlignment: 70,
        financial_independence: 75
      }
    };
  }

  private async getMockCandidate(name: string, party: string): Promise<Candidate> {
    return {
      id: `mock-candidate-${name.toLowerCase().replace(' ', '-')}`,
      name,
      party,
      office: 'U.S. House of Representatives',
      jurisdiction: 'CA-12',
      district: '12',
      campaign: {
        status: 'active',
        filingDate: '2024-01-15',
        electionDate: '2024-11-05',
        keyIssues: ['Healthcare', 'Climate Change', 'Housing'],
        platform: ['Universal Healthcare', 'Green New Deal', 'Affordable Housing']
      },
      email: `${name.toLowerCase().replace(' ', '.')}@campaign.com`,
      phone: '(555) 555-0123',
      website: `https://${name.toLowerCase().replace(' ', '')}2024.com`,
      socialMedia: {
        twitter: `@${name.toLowerCase().replace(' ', '')}2024`,
        facebook: `https://facebook.com/${name.toLowerCase().replace(' ', '')}2024`
      },
      campaignFinance: await this.getMockCampaignFinance('challenger'),
      platform_access: {
        is_verified: true,
        verification_method: 'filing_document',
        can_post: true,
        can_respond: true,
        can_engage: true
      },
      engagement: {
        posts: 25,
        responses: 50,
        constituentQuestions: 75,
        responseRate: 95
      }
    };
  }

  private async getMockCampaignFinance(type: string): Promise<CampaignFinance> {
    return {
      id: `mock-${type}-finance`,
      representativeId: `mock-${type}-rep`,
      cycle: 2024,
      totalRaised: type === 'incumbent' ? 2500000 : 500000,
      individualContributions: type === 'incumbent' ? 1500000 : 400000,
      pacContributions: type === 'incumbent' ? 800000 : 50000,
      corporateContributions: type === 'incumbent' ? 200000 : 10000,
      unionContributions: type === 'incumbent' ? 100000 : 20000,
      selfFunding: type === 'incumbent' ? 0 : 20000,
      smallDonorPercentage: type === 'incumbent' ? 40 : 85,
      topContributors: [],
      independenceScore: type === 'incumbent' ? 60 : 90,
      corporateInfluence: type === 'incumbent' ? 40 : 10,
      pacInfluence: type === 'incumbent' ? 35 : 15,
      smallDonorInfluence: type === 'incumbent' ? 25 : 75,
      totalSpent: type === 'incumbent' ? 2000000 : 400000,
      advertising: type === 'incumbent' ? 800000 : 150000,
      staff: type === 'incumbent' ? 600000 : 100000,
      travel: type === 'incumbent' ? 200000 : 50000,
      fundraising: type === 'incumbent' ? 400000 : 100000,
      sources: ['mock-data'],
      lastUpdated: new Date().toISOString(),
      dataQuality: 'low' as const
    };
  }

  private async getMockElectoralRace(): Promise<ElectoralRace> {
    return {
      raceId: 'mock-race-1',
      office: 'Mock Office',
      jurisdiction: 'Mock Jurisdiction',
      electionDate: '2024-11-05',
      incumbent: await this.getMockRepresentative('Mock Incumbent'),
      challengers: [
        await this.getMockRepresentative('Mock Challenger 1'),
        await this.getMockRepresentative('Mock Challenger 2')
      ],
      allCandidates: [
        await this.getMockCandidate('Mock Candidate 1', 'Democratic'),
        await this.getMockCandidate('Mock Candidate 2', 'Republican')
      ],
      keyIssues: ['Mock Issue 1', 'Mock Issue 2'],
      campaignFinance: await this.getMockCampaignFinance('mock'),
      pollingData: null,
      voterRegistrationDeadline: '2024-10-15',
      earlyVotingStart: '2024-10-20',
      absenteeBallotDeadline: '2024-11-01',
      recentActivity: [],
      constituentQuestions: 0,
      candidateResponses: 0,
      status: 'upcoming',
      importance: 'medium'
    };
  }
  
  // Helper methods for issue identification
  private async getCandidatesForIssue(issue: string, activeRaces: ElectoralRace[]): Promise<string[]> {
    const candidates: string[] = [];
    
    for (const race of activeRaces) {
      // Check if any candidates have positions on this issue
      for (const candidate of race.allCandidates) {
        if (candidate.platform?.includes(issue.toLowerCase())) {
          candidates.push(candidate.name);
        }
      }
      
      // Also check challengers
      for (const challenger of race.challengers) {
        if (challenger.platform?.includes(issue.toLowerCase())) {
          candidates.push(challenger.name);
        }
      }
    }
    
    return Array.from(new Set(candidates)); // Remove duplicates
  }
  
  private async getRecentActivityForIssue(issue: string, currentOfficials: {
    federal: Representative[];
    state: Representative[];
    local: Representative[];
  }): Promise<Activity[]> {
    const activities: Activity[] = [];
    
    // Check all officials for recent activity on this issue
    const allOfficials = [...currentOfficials.federal, ...currentOfficials.state, ...currentOfficials.local];
    
    for (const official of allOfficials) {
      if (official.recentActivity) {
        const relevantActivities = official.recentActivity.filter(activity => 
          activity.description.toLowerCase().includes(issue.toLowerCase()) ||
          activity.title.toLowerCase().includes(issue.toLowerCase())
        );
        activities.push(...relevantActivities);
      }
    }
    
    // Sort by date (most recent first) and limit to 10
    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }
  
  private determineIssueImportance(issue: string, mentions: number): 'high' | 'medium' | 'low' {
    // Base importance on mention count and issue type
    const highPriorityIssues = ['healthcare', 'climate', 'economy', 'education', 'security'];
    const isHighPriority = highPriorityIssues.some(priority => 
      issue.toLowerCase().includes(priority)
    );
    
    if (isHighPriority || mentions > 100) return 'high';
    if (mentions > 50) return 'medium';
    return 'low';
  }
  
  private async analyzeIssuesFromData(currentOfficials: {
    federal: Representative[];
    state: Representative[];
    local: Representative[];
  }, activeRaces: ElectoralRace[]): Promise<Array<{ issue: string; importance: 'high' | 'medium' | 'low'; candidates: string[]; recentActivity: Activity[] }>> {
    const issues: Array<{ issue: string; importance: 'high' | 'medium' | 'low'; candidates: string[]; recentActivity: Activity[] }> = [];
    
    // Common issues to check for
    const commonIssues = ['Healthcare', 'Climate Change', 'Economy', 'Education', 'Housing', 'Transportation'];
    
    for (const issue of commonIssues) {
      const candidates = await this.getCandidatesForIssue(issue, activeRaces);
      const recentActivity = await this.getRecentActivityForIssue(issue, currentOfficials);
      
      if (candidates.length > 0 || recentActivity.length > 0) {
        issues.push({
          issue,
          importance: this.determineIssueImportance(issue, recentActivity.length * 10),
          candidates,
          recentActivity
        });
      }
    }
    
    return issues;
  }
}

/**
 * Create a geographic electoral feed instance
 */
export function createGeographicElectoralFeed(): GeographicElectoralFeed {
  return new GeographicElectoralFeed();
}
