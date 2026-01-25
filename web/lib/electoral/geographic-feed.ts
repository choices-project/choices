/**
 * Geographic-Based Electoral Feed System
 *
 * Transforms user location into comprehensive electoral landscape
 * Shows current officials, upcoming races, and all candidates
 *
 * @author Agent E
 * @date 2025-01-15
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { NotImplementedError } from '@/lib/errors';
import { formatISODateOnly, nowISO } from '@/lib/utils/format-utils';
import { logger } from '@/lib/utils/logger';

import { createUnifiedDataOrchestrator } from '../integrations/unified-orchestrator';

import type { ElectoralRace as SchemaElectoralRace } from './schemas';
import type {
  UserLocation,
  ElectoralRace as UnifiedElectoralRace,
  Representative,
  Candidate,
  CampaignFinance,
  Activity
} from '../types/electoral-unified';
// withOptional removed - using explicit builders


type ElectoralRace = UnifiedElectoralRace;

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

  // Best-effort analytics logger (non-blocking)
  private async logAnalytics(metricName: string, dimensions: Record<string, unknown>) {
    try {
      const supabase = await getSupabaseServerClient();
      if (!supabase) return;
      await (supabase as any)
        .from('platform_analytics')
        .insert({
          metric_name: metricName,
          metric_value: 1,
          metric_type: 'counter',
          dimensions,
          category: 'civics',
          source: 'geographic_feed'
        });
    } catch {
      // swallow
    }
  }

  // Local helpers (avoid depending on orchestrator internals)
  private resolveStateCode(location: UserLocation): string | null {
    if (location.stateCode) {
      return location.stateCode.toUpperCase();
    }
    const federalDistrict = (location as any).federal?.house?.district as string | undefined;
    if (federalDistrict && federalDistrict.includes('-')) {
      const code = federalDistrict.split('-')[0];
      return code ? code.toUpperCase() : null;
    }
    return null;
  }

  private estimateDeadline(dateString: string, offsetDays: number): string {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return formatISODateOnly(nowISO());
    }
    const adjusted = new Date(date);
    adjusted.setUTCDate(date.getUTCDate() - offsetDays);
    return adjusted.toISOString().slice(0, 10);
  }

  /**
   * DB-first: Fetch upcoming elections from our comprehensive civics database
   */
  private async fetchUpcomingElectionsFromDB(location: UserLocation): Promise<ElectoralRace[]> {
    try {
      const supabase = await getSupabaseServerClient();
      if (!supabase) {
        return [];
      }

      const stateCode = location.stateCode ?? this.resolveStateCode(location) ?? null;
      const today = formatISODateOnly(nowISO());

      // civic_elections schema (columns): election_id, name, ocd_division_id, election_day, fetched_at, raw_payload
      let query: any = (supabase as any)
        .from('civic_elections')
        .select('election_id, name, ocd_division_id, election_day')
        .gte('election_day', today)
        .order('election_day', { ascending: true })
        .limit(50);

      if (stateCode) {
        // Filter by state in division when possible
        query = query.like('ocd_division_id', `%state:${stateCode.toUpperCase()}%`);
      }

      const { data, error } = await query;
      if (error) {
        logger.error('DB elections query failed', { error, stateCode, today });
        return [];
      }

      const rows = Array.isArray(data) ? data : [];

      // Prefetch representatives mapped to divisions for these elections
      const divisionIds: string[] = Array.from(
        new Set(
          rows
            .map((r: any) => String(r.ocd_division_id ?? ''))
            .filter((d) => d.length > 0),
        ),
      );

      const divisionToReps = new Map<string, Array<{ id: number; name: string; party: string | null; office: string }>>();
      if (divisionIds.length > 0) {
        try {
          // First, get all representatives that match the divisions and are active
          // Query representative_divisions to get rep IDs for these divisions
          const { data: divRows, error: divErr } = await (supabase as any)
            .from('representative_divisions')
            .select('division_id, representative_id')
            .in('division_id', divisionIds)
            .limit(5000);
          
          if (divErr) {
            logger.warn('representative_divisions prefetch failed', { error: divErr.message });
          } else if (Array.isArray(divRows)) {
            // Get unique representative IDs
            const repIds = Array.from(new Set(
              divRows
                .map((r: any) => r.representative_id)
                .filter((id: any): id is number => id != null && typeof id === 'number')
            ));
            
            if (repIds.length > 0) {
              // Query representatives_core with status filter
              const { data: repRows, error: repErr } = await (supabase as any)
                .from('representatives_core')
                .select('id, name, party, office')
                .eq('status', 'active') // Filter by status field
                .in('id', repIds)
                .limit(5000);
              
              if (!repErr && Array.isArray(repRows)) {
                // Create a map of rep ID to rep data
                const repMap = new Map<number, { id: number; name: string; party: string | null; office: string }>();
                for (const rep of repRows) {
                  repMap.set(rep.id, {
                    id: rep.id,
                    name: rep.name,
                    party: rep.party ?? null,
                    office: rep.office,
                  });
                }
                
                // Now map divisions to representatives
                for (const divRow of divRows) {
                  const divisionId = String(divRow.division_id ?? '');
                  const repId = divRow.representative_id;
                  if (!divisionId || !repId) continue;
                  
                  const rep = repMap.get(repId);
                  if (rep) {
                    if (!divisionToReps.has(divisionId)) {
                      divisionToReps.set(divisionId, []);
                    }
                    const list = divisionToReps.get(divisionId);
                    if (list && !list.some(r => r.id === rep.id)) {
                      list.push(rep);
                    }
                  }
                }
              } else if (repErr) {
                logger.warn('representatives_core prefetch failed', { error: repErr.message });
              }
            }
          }
        } catch (e) {
          logger.warn('representative_divisions prefetch exception', { error: e instanceof Error ? e.message : 'unknown' });
        }
      }

      // Prefetch campaign finance for these representatives
      const allRepIds = Array.from(divisionToReps.values()).flat().map((r) => r.id);
      const uniqueRepIds = Array.from(new Set(allRepIds));
      const repIdToFinance = new Map<number, {
        total_raised: number | null;
        total_spent: number | null;
        small_donor_percentage: number | null;
        sources: string[] | null;
        updated_at: string | null;
        cycle: number | null;
      }>();
      if (uniqueRepIds.length > 0) {
        try {
          const { data: finRows, error: finErr } = await (supabase as any)
            .from('representative_campaign_finance')
            .select('representative_id, total_raised, total_spent, small_donor_percentage, sources, updated_at, cycle')
            .in('representative_id', uniqueRepIds)
            .limit(5000);
          if (!finErr && Array.isArray(finRows)) {
            for (const row of finRows as Array<{
              representative_id: number | null;
              total_raised: number | null;
              total_spent: number | null;
              small_donor_percentage: number | null;
              sources: string[] | null;
              updated_at: string | null;
              cycle: number | null;
            }>) {
              if (row.representative_id != null) {
                repIdToFinance.set(row.representative_id, {
                  total_raised: row.total_raised,
                  total_spent: row.total_spent,
                  small_donor_percentage: row.small_donor_percentage,
                  sources: row.sources,
                  updated_at: row.updated_at,
                  cycle: row.cycle,
                });
              }
            }
          } else if (finErr) {
            logger.warn('representative_campaign_finance prefetch failed', { error: finErr.message });
          }
        } catch (e) {
          logger.warn('representative_campaign_finance prefetch exception', { error: e instanceof Error ? e.message : 'unknown' });
        }
      }

      // Prefetch public candidate profiles related to these divisions (best-effort)
      type CandidateProfileRow = {
        id: string;
        slug: string;
        display_name: string;
        office: string | null;
        jurisdiction: string | null;
        party: string | null;
        website: string | null;
        social: Record<string, string> | null;
        filing_status: 'not_started' | 'in_progress' | 'filed' | 'verified';
        representative_id: number | null;
      };
      let publicCandidates: CandidateProfileRow[] = [];
      try {
        const { data: candRows, error: candErr } = await (supabase as any)
          .from('candidate_profiles')
          .select('id, slug, display_name, office, jurisdiction, party, website, social, filing_status, representative_id')
          .eq('is_public', true)
          .limit(5000);
        if (!candErr && Array.isArray(candRows)) {
          publicCandidates = candRows as CandidateProfileRow[];
        } else if (candErr) {
          logger.warn('candidate_profiles prefetch failed', { error: candErr.message });
        }
      } catch (e) {
        logger.warn('candidate_profiles prefetch exception', { error: e instanceof Error ? e.message : 'unknown' });
      }

      const races: ElectoralRace[] = rows.map((row: any) => {
        const electionDate = String(row.election_day ?? today);
        const divisionId = String(row.ocd_division_id ?? (stateCode ? `ocd-division/country:us/state:${stateCode}` : 'ocd-division/country:us'));
        const reps = divisionToReps.get(divisionId) ?? [];
        const incumbentBasic = reps[0];

        const makeFinance = (repId: string, repNumericId?: number): CampaignFinance => {
          const f = repNumericId != null ? repIdToFinance.get(repNumericId) : undefined;
          return {
            id: `finance-${repId}-${row.election_id}`,
            representativeId: repId,
            cycle: f?.cycle ?? new Date(electionDate).getUTCFullYear(),
            totalRaised: f?.total_raised ?? 0,
            individualContributions: 0,
            pacContributions: 0,
            corporateContributions: 0,
            unionContributions: 0,
            selfFunding: 0,
            smallDonorPercentage: f?.small_donor_percentage ?? 0,
            topContributors: [],
            independenceScore: 0,
            corporateInfluence: 0,
            pacInfluence: 0,
            smallDonorInfluence: 0,
            totalSpent: f?.total_spent ?? 0,
            advertising: 0,
            staff: 0,
            travel: 0,
            fundraising: 0,
            sources: Array.isArray(f?.sources) ? (f?.sources as string[]) : ['db'],
            lastUpdated: f?.updated_at ?? nowISO(),
            dataQuality: f ? 'high' : 'medium',
          };
        };

        const incumbent: Representative = incumbentBasic
          ? {
              id: String(incumbentBasic.id),
              name: incumbentBasic.name,
              party: incumbentBasic.party ?? 'Unknown',
              office: incumbentBasic.office ?? String(row.name ?? 'Election'),
              jurisdiction: divisionId,
              socialMedia: {},
              votingRecord: { totalVotes: 0, partyLineVotes: 0, constituentAlignment: 0, keyVotes: [] },
              campaignFinance: makeFinance(String(incumbentBasic.id), incumbentBasic.id),
              engagement: { responseRate: 0, averageResponseTime: 0, constituentQuestions: 0, publicStatements: 0 },
              walk_the_talk_score: { overall: 0, promise_fulfillment: 0, constituentAlignment: 0, financial_independence: 0 },
              recentActivity: [],
              platform: []
            }
          : {
              id: `incumbent-${row.election_id}`,
              name: 'Incumbent',
              party: 'Unknown',
              office: String(row.name ?? 'Election'),
              jurisdiction: divisionId,
              socialMedia: {},
              votingRecord: { totalVotes: 0, partyLineVotes: 0, constituentAlignment: 0, keyVotes: [] },
              campaignFinance: makeFinance(`incumbent-${row.election_id}`),
              engagement: { responseRate: 0, averageResponseTime: 0, constituentQuestions: 0, publicStatements: 0 },
              walk_the_talk_score: { overall: 0, promise_fulfillment: 0, constituentAlignment: 0, financial_independence: 0 },
              recentActivity: [],
              platform: []
            };

        // Derive challengers from the rest of reps in the division
        const challengerBasics = reps.slice(1);
        const repChallengers: Representative[] = challengerBasics.map((c) => ({
          id: String(c.id),
          name: c.name,
          party: c.party ?? 'Unknown',
          office: c.office,
          jurisdiction: divisionId,
          socialMedia: {},
          votingRecord: { totalVotes: 0, partyLineVotes: 0, constituentAlignment: 0, keyVotes: [] },
          campaignFinance: makeFinance(String(c.id), c.id),
          engagement: { responseRate: 0, averageResponseTime: 0, constituentQuestions: 0, publicStatements: 0 },
          walk_the_talk_score: { overall: 0, promise_fulfillment: 0, constituentAlignment: 0, financial_independence: 0 },
          recentActivity: [],
          platform: [],
        }));

        // Add public candidate profiles as challengers when office/jurisdiction align
        const candidateChallengers: Representative[] = publicCandidates
          .filter((cp) => {
            // Match by jurisdiction or by state code seen in divisionId; also approximate by office name
            const j = (cp.jurisdiction ?? '').toLowerCase();
            const o = (cp.office ?? '').toLowerCase();
            const div = divisionId.toLowerCase();
            const nameMatch = String(row.name ?? '').toLowerCase();
            const officeMatch = o.length > 0 && (nameMatch.includes(o) || o.includes(nameMatch));
            const divisionMatch = j.length > 0 && (div.includes(j) || j.includes(div));
            return divisionMatch || officeMatch;
          })
          .map((cp) => {
            const repId = cp.representative_id != null ? String(cp.representative_id) : `candidate:${cp.id}`;
            const socialMedia: Record<string, string> =
              cp.social != null && typeof cp.social === 'object' ? cp.social : {};
            return {
              id: repId,
              name: cp.display_name,
              party: cp.party ?? 'Unknown',
              office: String(cp.office ?? row.name ?? 'Candidate'),
              jurisdiction: divisionId,
              email: '',
              phone: '',
              website: cp.website ?? '',
              socialMedia,
              votingRecord: {
                totalVotes: 0,
                partyLineVotes: 0,
                constituentAlignment: 0,
                keyVotes: [],
              },
              campaignFinance: makeFinance(repId, cp.representative_id ?? undefined),
              engagement: { responseRate: 0, averageResponseTime: 0, constituentQuestions: 0, publicStatements: 0 },
              walk_the_talk_score: { overall: 0, promise_fulfillment: 0, constituentAlignment: 0, financial_independence: 0 },
              recentActivity: [],
              platform: [],
            } as Representative;
          });

        const challengers = [...repChallengers];
        // Merge in candidates, avoiding duplicates by id
        const seenIds = new Set(challengers.map((c) => c.id));
        for (const c of candidateChallengers) {
          if (!seenIds.has(c.id) && c.id !== incumbent.id) {
            challengers.push(c);
            seenIds.add(c.id);
          }
        }

        // Deadlines are not in civic_elections; estimate conservatively
        const voterReg = this.estimateDeadline(electionDate, 21);
        const earlyVote = this.estimateDeadline(electionDate, -14);
        const absentee = this.estimateDeadline(electionDate, 7);

        return {
          raceId: String(row.election_id),
          office: String(row.name ?? 'Election'),
          jurisdiction: divisionId,
          electionDate,
          incumbent,
          challengers,
          allCandidates: [],
          keyIssues: [],
          campaignFinance: incumbent.campaignFinance,
          pollingData: null,
          voterRegistrationDeadline: voterReg,
          earlyVotingStart: earlyVote,
          absenteeBallotDeadline: absentee,
          recentActivity: [],
          constituentQuestions: 0,
          candidateResponses: 0,
          status: 'upcoming',
          importance: 'medium'
        } as ElectoralRace;
      });

      return races;
    } catch (error) {
      logger.error('Failed DB-first elections fetch', { error });
      return [];
    }
  }

  /**
   * Generate comprehensive electoral feed for user location.
   * We never save or use address. Prefer district (e.g. CA-11 from Civics lookup or manual);
   * zipCode opt-in only for geocode when district missing; coordinates as fallback.
   */
  async generateElectoralFeed(
    userId: string,
    locationInput: {
      district?: string;
      zipCode?: string;
      coordinates?: { lat: number; lng: number };
    }
  ): Promise<ElectoralFeed> {
    try {
      logger.info('Generating electoral feed', { userId, locationInput });

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
        generatedAt: nowISO(),
        currentOfficials,
        upcomingElections,
        activeRaces,
        keyIssues,
        engagementOpportunities
      };

      logger.info('Electoral feed generated successfully', {
        userId,
        officialsCount: Object.values(currentOfficials).flat().length,
        upcomingElectionsCount: upcomingElections.length,
        activeRacesCount: activeRaces.length,
        keyIssuesCount: keyIssues.length
      });

      return feed;

    } catch (error) {
      logger.error('Failed to generate electoral feed', { userId, error });
      throw new Error(`Failed to generate electoral feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Resolve location input to jurisdiction data. We never save or use address.
   * Prefer district (Civics lookup or manual); else zipCode (opt-in) or coordinates for geocode only.
   */
  private async resolveLocation(locationInput: {
    district?: string;
    zipCode?: string;
    coordinates?: { lat: number; lng: number };
  }): Promise<UserLocation> {
    const emptyState = {
      governor: '',
      legislature: { house: { district: '', representative: '' }, senate: { district: '', representative: '' } },
    };
    const emptyLocal = {
      county: { executive: '', commissioners: [] },
      city: { mayor: '', council: [] },
      school: { board: [] },
    };

    // 1. District first (from Civics lookup or manual). Never use address.
    const district = locationInput.district?.trim();
    if (district && district.length > 0) {
      const stateCode = district.includes('-')
        ? (district.split('-')[0] ?? '').toUpperCase()
        : '';
      return {
        ...(locationInput.zipCode && { zipCode: locationInput.zipCode }),
        ...(stateCode ? { stateCode } : {}),
        federal: { house: { district, representative: '' }, senate: { senators: [] } },
        state: emptyState,
        local: emptyLocal,
      };
    }

    // 2. Geocode via zipCode (opt-in) or coordinates only
    try {
      const { locationService } = await import('../services/location-service');
      const geocodeTarget = locationInput.zipCode ? String(locationInput.zipCode) : undefined;

      let geo = null as Awaited<ReturnType<typeof locationService.geocodeAddress>> | null;
      if (geocodeTarget) {
        geo = await locationService.geocodeAddress(geocodeTarget);
      } else if (locationInput.coordinates) {
        geo = await locationService.findRepresentativesByCoordinates(
          locationInput.coordinates.lat,
          locationInput.coordinates.lng,
        )?.then((res) => res?.location ?? null);
      }

      if (geo) {
        const stateCode = geo.state;
        const federalDistrict = geo.district ? `${stateCode}-${geo.district}` : '';
        return {
          ...(locationInput.zipCode && { zipCode: locationInput.zipCode }),
          ...(locationInput.coordinates && { coordinates: locationInput.coordinates }),
          ...(stateCode ? { stateCode } : {}),
          federal: { house: { district: federalDistrict, representative: '' }, senate: { senators: [] } },
          state: emptyState,
          local: emptyLocal,
        };
      }
    } catch {
      // fall through to mock
    }

    return {
      ...(locationInput.zipCode && { zipCode: locationInput.zipCode }),
      ...(locationInput.coordinates && { coordinates: locationInput.coordinates }),
      stateCode: 'CA',
      federal: { house: { district: 'CA-12', representative: '' }, senate: { senators: [] } },
      state: emptyState,
      local: emptyLocal,
    };
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

      // Get state officials (state is object with legislature; narrow to avoid string | undefined)
      const stateLevel = location.state;
      if (
        stateLevel != null &&
        typeof stateLevel === 'object' &&
        'legislature' in stateLevel &&
        stateLevel.legislature != null
      ) {
        const house = (stateLevel.legislature as { house?: { representative?: string } }).house;
        const repId = house?.representative;
        if (repId) {
          const stateRep = await this.orchestrator.getRepresentative(repId);
          if (stateRep) {
            officials.state.push(await this.enrichRepresentative(stateRep, 'state', 'house'));
          }
        }
      }

      // Get local officials (would need additional data sources)
      // This would integrate with local government APIs or manual data collection

    } catch (error) {
      logger.error('Failed to get current officials', { error });
    }

    return officials;
  }

  /**
   * Get upcoming elections for the jurisdiction
   */
  private async getUpcomingElections(location: UserLocation): Promise<ElectoralRace[]> {
    try {
      logger.info('Getting upcoming elections for location', { location: this.getLocationSummary(location) });

      // 1) DB-first: use comprehensive civics database
      const dbRaces = await this.fetchUpcomingElectionsFromDB(location);
      if (dbRaces.length > 0) {
        return dbRaces;
      }

      // 2) Orchestrator fallback when DB has no records
      const orchestrator = await createUnifiedDataOrchestrator();
      const electionData = await orchestrator.getUpcomingElections(location);

      if (electionData && Array.isArray(electionData)) {
        // Use runtime validation instead of unsafe type casts
        const { parseArrayFiltered } = await import('./schemas')
        const { ElectoralRaceSchema } = await import('./schemas')

        const validRaces = parseArrayFiltered(
          ElectoralRaceSchema,
          electionData,
          'getUpcomingElections'
        );

        // If no valid races, return mock data
        if (validRaces.length === 0) {
          logger.warn('No valid upcoming elections returned; using fallback', {
            location: this.getLocationSummary(location)
          });
          return [await this.getMockElectoralRace()];
        }

        return Promise.all(validRaces.map((race) => this.normalizeSchemaRace(race)));
      }

      // Fallback to mock data if no real data available

      const summary = this.getLocationSummary(location);
      logger.warn('Orchestrator returned no election data; using fallback', { location: summary });
      void this.logAnalytics('elections_fallback', { reason: 'empty', ...summary });
      return [await this.getMockElectoralRace()];
    } catch (error) {
      if (error instanceof NotImplementedError) {
        const summary = this.getLocationSummary(location);
        logger.warn('Upcoming election pipeline not implemented, falling back to mock data', {
          location: summary,
          reason: error.message
        });
        void this.logAnalytics('elections_fallback', { reason: 'not_implemented', ...summary });
        return [await this.getMockElectoralRace()];
      }

      logger.error('Failed to get upcoming elections', { error });
      void this.logAnalytics('elections_fallback', { reason: 'error', error: error instanceof Error ? error.message : String(error) });
      return [await this.getMockElectoralRace()];
    }
  }

  /**
   * Get active races (currently campaigning)
   */
  private async getActiveRaces(location: UserLocation): Promise<ElectoralRace[]> {
    try {
      logger.info('Getting active races for location', { location });

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
          if (error instanceof NotImplementedError) {
            logger.warn('Campaign enrichment not implemented; returning base race data', {
              raceId: race.raceId,
              reason: error.message
            });
            void this.logAnalytics('campaign_enrichment_fallback', { reason: 'not_implemented', raceId: race.raceId });
          } else {
            logger.error('Failed to enrich race with campaign data', { raceId: race.raceId, error });
            void this.logAnalytics('campaign_enrichment_fallback', { reason: 'error', raceId: race.raceId, error: error instanceof Error ? error.message : String(error) });
          }
        }

        return Object.assign({}, race, {
          status: 'active' as const
        });
      }));

      return enrichedRaces;
    } catch (error) {
      logger.error('Failed to get active races', { error });
      void this.logAnalytics('campaign_enrichment_fallback', { reason: 'outer_error', error: error instanceof Error ? error.message : String(error) });
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
      logger.info('Identifying key issues for jurisdiction', { location });

      const issues: Array<{ issue: string; importance: 'high' | 'medium' | 'low'; candidates: string[]; recentActivity: Activity[] }> = [];

      // Get issue data from orchestrator
      let issueData: unknown[] | undefined;
      try {
        const orchestrator = await createUnifiedDataOrchestrator();
        issueData = await orchestrator.getJurisdictionKeyIssues(location);
      } catch (error) {
        if (error instanceof NotImplementedError) {
          logger.warn('Jurisdiction key issues not implemented, falling back to heuristic analysis', {
            location: this.getLocationSummary(location),
            reason: error.message
          });
          issueData = [];
        } else {
          throw error;
        }
      }

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
      logger.error('Failed to identify key issues', { error });
      return [];
    }
  }

  private getLocationSummary(location: UserLocation) {
    return {
      stateCode: location.stateCode,
      zipCode: location.zipCode,
      hasCoordinates: Boolean(location.coordinates),
    };
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

    // Log location context for engagement opportunities (avoid logging full state object)
    logger.debug('Generating engagement opportunities', {
      location: this.getLocationSummary(location),
      officialsCount: {
        federal: currentOfficials.federal.length,
        state: currentOfficials.state.length,
        local: currentOfficials.local.length
      },
      activeRacesCount: activeRaces.length
    });

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

    const socialMedia: Record<string, string> =
      representative.socialMedia != null && typeof representative.socialMedia === 'object'
        ? (representative.socialMedia as Record<string, string>)
        : {};
    return {
        id: representative.id,
        name: representative.name,
        party: representative.party,
        office: `${chamber} ${level}`,
        jurisdiction: representative.state,
        socialMedia,
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
      ,
      ...(representative.district ? { district: representative.district } : {}),
      ...(representative.email ? { email: representative.email } : {}),
      ...(representative.phone ? { phone: representative.phone } : {}),
      ...(representative.website ? { website: representative.website } : {}),
    };
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
  private async getMockRepresentative(name: string, role: 'incumbent' | 'challenger' = 'incumbent'): Promise<Representative> {
    const safeName = name.toLowerCase().replace(/\s+/g, '-');
    const isIncumbent = role === 'incumbent';
    const finance = await this.getMockCampaignFinance(role);

    return {
      id: `mock-${safeName}`,
      name,
      party: isIncumbent ? 'Democratic' : 'Independent',
      office: 'U.S. House of Representatives',
      jurisdiction: 'CA-12',
      district: '12',
      email: `${safeName.replace('-', '.')}@house.gov`,
      phone: isIncumbent ? '(202) 555-0123' : '(415) 555-0101',
      website: `https://${safeName}.house.gov`,
      socialMedia: {
        twitter: `@${safeName}`,
        facebook: `https://facebook.com/${safeName}`,
        instagram: `https://instagram.com/${safeName}`,
        youtube: `https://youtube.com/${safeName}`,
      },
      votingRecord: {
        totalVotes: isIncumbent ? 150 : 25,
        partyLineVotes: isIncumbent ? 120 : 15,
        constituentAlignment: isIncumbent ? 75 : 85,
        keyVotes: [],
      },
      campaignFinance: finance,
      engagement: {
        responseRate: isIncumbent ? 85 : 92,
        averageResponseTime: isIncumbent ? 2 : 1,
        constituentQuestions: isIncumbent ? 150 : 80,
        publicStatements: isIncumbent ? 25 : 18,
      },
      walk_the_talk_score: {
        overall: isIncumbent ? 75 : 88,
        promise_fulfillment: isIncumbent ? 80 : 90,
        constituentAlignment: isIncumbent ? 70 : 85,
        financial_independence: isIncumbent ? 75 : 82,
      },
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
      incumbent: await this.getMockRepresentative('Mock Incumbent', 'incumbent'),
      challengers: [
        await this.getMockRepresentative('Mock Challenger 1', 'challenger'),
        await this.getMockRepresentative('Mock Challenger 2', 'challenger')
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

  private async normalizeSchemaRace(race: SchemaElectoralRace): Promise<ElectoralRace> {
    const template = await this.getMockElectoralRace();

    const campaignFinance = race.campaignFinance
      ? {
          ...template.campaignFinance,
          totalRaised: race.campaignFinance.raised,
          totalSpent: race.campaignFinance.spent,
          individualContributions: race.campaignFinance.individualContributions ?? 0,
          pacContributions: race.campaignFinance.pacContributions ?? 0,
          selfFunding: race.campaignFinance.selfFunding ?? race.campaignFinance.cash ?? 0,
          sources: template.campaignFinance.sources.includes('schema')
            ? template.campaignFinance.sources
            : [...template.campaignFinance.sources, 'schema'],
          lastUpdated: race.campaignFinance.lastUpdated ?? new Date().toISOString(),
        }
      : template.campaignFinance;

    return {
      ...template,
      raceId: race.raceId,
      office: race.office,
      jurisdiction: race.jurisdiction ?? 'US',
      electionDate: race.electionDate,
      keyIssues: race.keyIssues.length > 0 ? race.keyIssues : template.keyIssues,
      campaignFinance,
      pollingData: race.pollingData,
      voterRegistrationDeadline: race.voterRegistrationDeadline ?? this.estimateDeadline(race.electionDate, 21),
      earlyVotingStart: race.earlyVotingStart ?? this.estimateDeadline(race.electionDate, -14),
      absenteeBallotDeadline: race.absenteeBallotDeadline ?? this.estimateDeadline(race.electionDate, 7),
      recentActivity: template.recentActivity,
      constituentQuestions: race.constituentQuestions,
      candidateResponses: race.candidateResponses,
      status: race.status,
      importance: race.importance,
    };
  }
}

/**
 * Create a geographic electoral feed instance
 */
export function createGeographicElectoralFeed(): GeographicElectoralFeed {
  return new GeographicElectoralFeed();
}
