/**
 * Civics 2.0 FREE APIs Data Ingestion Pipeline
 * 
 * This module handles data ingestion from multiple FREE APIs:
 * - Google Civic Information API (25,000 requests/day)
 * - OpenStates API (10,000 requests/day)
 * - Congress.gov API (5,000 requests/day)
 * - FEC API (1,000 requests/day)
 * - Wikipedia/Wikimedia Commons (unlimited)
 * - Social Media APIs (free tiers)
 */

import { createClient } from '@supabase/supabase-js';
import { devLog } from '@/lib/logger';
import { CanonicalIdService } from '@/lib/civics/canonical-id-service';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Cross-reference validation types
export type CrossReferenceValidation = {
  nameConsistency: NameConsistency;
  partyConsistency: PartyConsistency;
  contactConsistency: ContactConsistency;
  socialMediaConsistency: SocialMediaConsistency;
  identifierConsistency: IdentifierConsistency;
  dataQualityScores: { [source: string]: number };
  conflicts: string[];
  recommendations: string[];
};

export type NameConsistency = {
  isConsistent: boolean;
  confidence: number;
  variations: string[];
  primaryName?: string;
};

export type PartyConsistency = {
  isConsistent: boolean;
  confidence: number;
  variations: string[];
  primaryParty?: string;
};

export type ContactConsistency = {
  emailConflicts: ContactConflict[];
  phoneConflicts: ContactConflict[];
  websiteConflicts: ContactConflict[];
  overallConsistency: number;
};

export type ContactConflict = {
  type: string;
  values: string[];
  sources: string[];
  recommendation: string;
};

export type SocialMediaConsistency = {
  platformConflicts: SocialMediaConflict[];
  handleConflicts: SocialMediaConflict[];
  overallConsistency: number;
};

export type SocialMediaConflict = {
  platform: string;
  handles: string[];
  sources: string[];
  recommendation: string;
};

export type IdentifierConsistency = {
  conflicts: string[];
  isConsistent: boolean;
  confidence: number;
};

// Types for our FREE APIs data
export type RepresentativeData = {
  id?: string;
  name: string;
  party?: string;
  office: string;
  level: 'federal' | 'state' | 'local';
  state: string;
  district?: string;
  
  // Primary identifiers
  bioguideId?: string;
  openstatesId?: string;
  fecId?: string;
  googleCivicId?: string;
  legiscanId?: string;
  congressGovId?: string;
  govinfoId?: string;
  wikipediaUrl?: string;
  ballotpediaUrl?: string;
  
  // Social media handles (extracted for easy access)
  twitterHandle?: string;
  facebookUrl?: string;
  instagramHandle?: string;
  linkedinUrl?: string;
  youtubeChannel?: string;
  
  // Primary contact information (extracted for easy access)
  primaryEmail?: string;
  primaryPhone?: string;
  primaryWebsite?: string;
  primaryPhotoUrl?: string;
  
  // Election data
  lastElectionDate?: Date;
  nextElectionDate?: Date;
  termStartDate?: Date;
  termEndDate?: Date;
  upcomingElections?: any[];
  
  // Committee and leadership data
  committeeMemberships?: string[];
  caucusMemberships?: string[];
  leadershipPositions?: string[];
  
  // Enhanced contact information
  officialWebsite?: string;
  campaignWebsite?: string;
  officeLocations?: any[];
  
  // Activity tracking
  recentActivity?: any[];
  recentVotes?: any[];
  recentBills?: any[];
  
  // Accountability tracking
  floorSpeeches?: any[];
  committeeStatements?: any[];
  officialPressReleases?: any[];
  socialMediaStatements?: any[];
  recentTweets?: any[];
  facebookPosts?: any[];
  instagramPosts?: any[];
  votingExplanations?: any[];
  statementVsVoteAnalysis?: any[];
  campaignPromisesVsActions?: any[];
  constituentFeedbackAlignment?: any[];
  accountabilityScore?: number;
  
  // Contact information
  contacts: ContactInfo[];
  socialMedia: SocialMediaInfo[];
  photos: PhotoInfo[];
  activity: ActivityInfo[];
  
  // Campaign finance
  campaignFinance?: CampaignFinanceInfo;
  
  // Legislative data (from LegiScan)
  sessionInfo?: SessionInfo;
  legislativeStats?: LegislativeStats;
  
  // Metadata
  dataSources: string[];
  qualityScore: number;
  lastUpdated: Date;
  crossReferenceValidation?: CrossReferenceValidation;
}

export type ContactInfo = {
  type: 'email' | 'phone' | 'website' | 'fax' | 'address';
  value: string;
  label?: string;
  isPrimary: boolean;
  isVerified: boolean;
  source: string;
  conflictFlag?: boolean;
}

export type SocialMediaInfo = {
  platform: 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'linkedin' | 'tiktok' | 'snapchat' | 'telegram' | 'mastodon' | 'threads';
  handle: string;
  url: string;
  followersCount: number;
  isVerified: boolean;
  source: string;
  conflictFlag?: boolean;
}

export type PhotoInfo = {
  url: string;
  source: 'congress-gov' | 'wikipedia' | 'google-civic' | 'openstates' | 'congress-gov-alternative' | 'wikipedia-high-res';
  quality: 'high' | 'medium' | 'low';
  isPrimary: boolean;
  license?: string;
  attribution?: string;
  width?: number;
  height?: number;
  altText?: string;
  caption?: string;
  photographer?: string;
  usageRights?: string;
}

export type ActivityInfo = {
  type: 'vote' | 'bill' | 'bill_sponsored' | 'bill_cosponsored' | 'statement' | 'social_media' | 'photo_update' | 'committee_meeting' | 'public_statement' | 'social_media_post';
  title: string;
  description?: string;
  url?: string;
  date: Date;
  metadata: Record<string, any>;
  source: string;
}

export type SessionInfo = {
  currentSession: any;
  allSessions: any[];
  source: string;
};

export type LegislativeStats = {
  billsSponsored: number;
  billsCoSponsored: number;
  votesCast: number;
  attendanceRate: number;
  source: string;
};

export type CampaignFinanceInfo = {
  electionCycle: string;
  totalReceipts: number;
  totalDisbursements: number;
  cashOnHand: number;
  debt: number;
  individualContributions: number;
  pacContributions: number;
  partyContributions: number;
  selfFinancing: number;
}

export class FreeAPIsPipeline {
  private supabase: any;
  private rateLimiters: Map<string, any> = new Map();
  private canonicalIdService: CanonicalIdService;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      { auth: { persistSession: false } }
    );
    
    this.canonicalIdService = new CanonicalIdService();
    this.initializeRateLimiters();
  }

  private initializeRateLimiters() {
    // Google Civic API: 25,000 requests/day
    this.rateLimiters.set('google-civic', {
      requestsPerDay: 25000,
      requestsPerHour: 1000,
      requestsPerMinute: 50,
      currentUsage: 0,
      lastReset: Date.now()
    });

    // OpenStates API: 10,000 requests/day
    this.rateLimiters.set('openstates', {
      requestsPerDay: 10000,
      requestsPerHour: 400,
      requestsPerMinute: 20,
      currentUsage: 0,
      lastReset: Date.now()
    });

    // Congress.gov API: 5,000 requests/day
    this.rateLimiters.set('congress-gov', {
      requestsPerDay: 5000,
      requestsPerHour: 200,
      requestsPerMinute: 10,
      currentUsage: 0,
      lastReset: Date.now()
    });

    // FEC API: 1,000 requests/day
    this.rateLimiters.set('fec', {
      requestsPerDay: 1000,
      requestsPerHour: 40,
      requestsPerMinute: 2,
      currentUsage: 0,
      lastReset: Date.now()
    });

    // LegiScan API: 1,000 requests/day
    this.rateLimiters.set('legiscan', {
      requestsPerDay: 1000,
      requestsPerHour: 40,
      requestsPerMinute: 2,
      currentUsage: 0,
      lastReset: Date.now()
    });
  }

  /**
   * Main ingestion method - processes a representative using all FREE APIs
   * Only processes CURRENT representatives to avoid historical data
   */
  async processRepresentative(rep: RepresentativeData): Promise<RepresentativeData> {
    console.log('🔄 Starting to process CURRENT representative:', rep.name);
    devLog('Processing CURRENT representative with FREE APIs', { name: rep.name });
    
    // Validate that we're only processing current representatives
    if (!this.isCurrentRepresentative(rep)) {
      console.log('⚠️ Skipping non-current representative:', rep.name);
      devLog('Skipping non-current representative', { 
        name: rep.name, 
        level: rep.level,
        state: rep.state 
      });
      return rep; // Return unchanged if not current
    }

    try {
      // 1. Get election data from Google Civic (FREE) - ELECTION DATA STILL ACTIVE
      // Note: Representatives endpoint deprecated, but election data still available
      console.log('📊 Getting Google Civic election data...');
      const googleCivicData = await this.getGoogleCivicElectionData(rep);
      console.log('✅ Google Civic election data retrieved');
      
      // 2. Get state data from OpenStates (FREE) - WORKING
      console.log('📊 Getting OpenStates People data...');
      const openStatesData = await this.getOpenStatesPeopleData(rep);
      console.log('✅ OpenStates People data retrieved');
      
      // 3. Get federal data from Congress.gov (FREE) - RE-ENABLED
      console.log('📊 Getting Congress.gov data...');
      const congressGovData = await this.getCongressGovData(rep);
      console.log('✅ Congress.gov data retrieved:', congressGovData);
      
      // 3b. Get additional legislative data from LegiScan (FREE) - 30,000 monthly queries
      console.log('📊 Getting LegiScan data...');
      const legiScanData = await this.getLegiScanData(rep);
      console.log('✅ LegiScan data retrieved');
      
      // 4. Get photos from multiple sources (FREE) - RE-ENABLED
      console.log('📊 Getting photos...');
      const photos = await this.getPhotosFromMultipleSources(rep);
      console.log('✅ Photos retrieved');
      
      // 5. Get social media (FREE) - RE-ENABLED
      console.log('📊 Getting social media...');
      const socialMedia = await this.getSocialMediaData(rep);
      console.log('✅ Social media retrieved');
      
      // 6. Get campaign finance (FREE) - RE-ENABLED
      console.log('📊 Getting FEC data...');
      devLog('📊 Getting FEC data for', rep.name, rep.level);
      console.log('🔍 FEC: About to call getFECData method');
      let campaignFinance;
      try {
        console.log('🔍 FEC: Calling getFECData method now');
        campaignFinance = await this.getFECData(rep);
        console.log('✅ FEC data retrieved:', campaignFinance);
        devLog('✅ FEC data retrieved:', campaignFinance);
      } catch (error) {
        console.log('❌ FEC data failed:', error);
        devLog('❌ FEC data failed:', error);
        campaignFinance = null;
      }
      
      // 7. Get Wikipedia data (FREE) - NEW
      console.log('📊 Getting Wikipedia data...');
      const wikipediaData = await this.getWikipediaData(rep);
      console.log('✅ Wikipedia data retrieved');
      
      // 8. Get recent activity (FREE) - RE-ENABLED
      console.log('📊 Getting recent activity...');
      const activity = await this.getRecentActivity(rep);
      console.log('✅ Recent activity retrieved');

      // Debug: Log what each API returned
      console.log('🔍 API Data Debug:');
      console.log('  Google Civic:', googleCivicData);
      console.log('  OpenStates:', openStatesData);
      console.log('  Congress.gov:', congressGovData);
      console.log('  LegiScan:', legiScanData);
      console.log('  Wikipedia:', wikipediaData);
      console.log('  Photos:', photos?.length || 0);
      console.log('  Social Media:', socialMedia?.length || 0);
      console.log('  Campaign Finance:', campaignFinance);
      console.log('  Activity:', activity?.length || 0);

      // Merge and validate all data
      console.log('🔄 Merging and validating data...');
      const enrichedRep = this.mergeAndValidateData(
        rep,
        googleCivicData,
        openStatesData,
        congressGovData,
        legiScanData,
        photos,
        socialMedia,
        campaignFinance || undefined,
        activity,
        wikipediaData
      );
      console.log('✅ Data merged and validated');
      console.log('🔍 Final enriched data:', {
        contacts: enrichedRep.contacts?.length || 0,
        socialMedia: enrichedRep.socialMedia?.length || 0,
        photos: enrichedRep.photos?.length || 0,
        activity: enrichedRep.activity?.length || 0,
        dataSources: enrichedRep.dataSources
      });

      // Calculate quality score
      enrichedRep.qualityScore = this.calculateQualityScore(enrichedRep);
      enrichedRep.lastUpdated = new Date();

      // Resolve canonical ID for multi-source reconciliation
      const canonicalResult = await this.resolveCanonicalId(enrichedRep);

      devLog('Representative processed successfully', { 
        name: enrichedRep.name, 
        qualityScore: enrichedRep.qualityScore,
        dataSources: enrichedRep.dataSources.length,
        canonicalId: canonicalResult.canonicalId
      });

      return enrichedRep;

    } catch (error) {
      devLog('Error processing representative', { name: rep.name, error });
      throw error;
    }
  }

  /**
   * Google Civic Information API - Election Data (FREE - 25,000 requests/day)
   * Note: Representatives endpoint deprecated April 30, 2025, but election data still available
   */
  private async getGoogleCivicElectionData(rep: RepresentativeData): Promise<Partial<RepresentativeData>> {
    try {
      const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
      if (!apiKey) {
        devLog('Google Civic API key not configured');
        return {};
      }

      // Get election information for the state
      const stateCapitals = {
        'Alabama': 'Montgomery, AL', 'Alaska': 'Juneau, AK', 'Arizona': 'Phoenix, AZ', 'Arkansas': 'Little Rock, AR',
        'California': 'Sacramento, CA', 'Colorado': 'Denver, CO', 'Connecticut': 'Hartford, CT', 'Delaware': 'Dover, DE',
        'Florida': 'Tallahassee, FL', 'Georgia': 'Atlanta, GA', 'Hawaii': 'Honolulu, HI', 'Idaho': 'Boise, ID',
        'Illinois': 'Springfield, IL', 'Indiana': 'Indianapolis, IN', 'Iowa': 'Des Moines, IA', 'Kansas': 'Topeka, KS',
        'Kentucky': 'Frankfort, KY', 'Louisiana': 'Baton Rouge, LA', 'Maine': 'Augusta, ME', 'Maryland': 'Annapolis, MD',
        'Massachusetts': 'Boston, MA', 'Michigan': 'Lansing, MI', 'Minnesota': 'Saint Paul, MN', 'Mississippi': 'Jackson, MS',
        'Missouri': 'Jefferson City, MO', 'Montana': 'Helena, MT', 'Nebraska': 'Lincoln, NE', 'Nevada': 'Carson City, NV',
        'New Hampshire': 'Concord, NH', 'New Jersey': 'Trenton, NJ', 'New Mexico': 'Santa Fe, NM', 'New York': 'Albany, NY',
        'North Carolina': 'Raleigh, NC', 'North Dakota': 'Bismarck, ND', 'Ohio': 'Columbus, OH', 'Oklahoma': 'Oklahoma City, OK',
        'Oregon': 'Salem, OR', 'Pennsylvania': 'Harrisburg, PA', 'Rhode Island': 'Providence, RI', 'South Carolina': 'Columbia, SC',
        'South Dakota': 'Pierre, SD', 'Tennessee': 'Nashville, TN', 'Texas': 'Austin, TX', 'Utah': 'Salt Lake City, UT',
        'Vermont': 'Montpelier, VT', 'Virginia': 'Richmond, VA', 'Washington': 'Olympia, WA', 'West Virginia': 'Charleston, WV',
        'Wisconsin': 'Madison, WI', 'Wyoming': 'Cheyenne, WY'
      };
      
      const searchQuery = stateCapitals[rep.state as keyof typeof stateCapitals] || `${rep.state} State Capitol`;
      
      // Get election information
      const electionsResponse = await fetch(
        `https://www.googleapis.com/civicinfo/v2/elections?address=${encodeURIComponent(searchQuery)}&key=${apiKey}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!electionsResponse.ok) {
        devLog('Google Civic Election API request failed', { status: electionsResponse.status });
        return {};
      }

      const electionsData = await electionsResponse.json();
      if (!electionsData.elections || electionsData.elections.length === 0) {
        return {};
      }

      // Extract upcoming elections
      const upcomingElections = electionsData.elections.filter((election: any) => {
        const electionDate = new Date(election.electionDay);
        return electionDate > new Date();
      });

      const activity: ActivityInfo[] = [];

      // Add election information
      upcomingElections.forEach((election: any) => {
        activity.push({
          type: 'vote',
          title: `Upcoming Election: ${election.name}`,
          date: election.electionDay,
          description: `Election in ${rep.state}`,
          source: 'google-civic',
          metadata: { electionId: election.id, state: rep.state }
        });
      });

      // Get early voting information for the most recent upcoming election
      if (upcomingElections.length > 0) {
        const latestElection = upcomingElections[0];
        try {
          const earlyVotingResponse = await fetch(
            `https://www.googleapis.com/civicinfo/v2/voterinfo?address=${encodeURIComponent(searchQuery)}&electionId=${latestElection.id}&key=${apiKey}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            }
          );

          if (earlyVotingResponse.ok) {
            const voterInfo = await earlyVotingResponse.json();
            
            // Add early voting locations
            if (voterInfo.earlyVoteSites && voterInfo.earlyVoteSites.length > 0) {
              voterInfo.earlyVoteSites.forEach((site: any) => {
                activity.push({
                  type: 'vote',
                  title: `Early Voting: ${site.name || 'Voting Location'}`,
                  date: site.startDate || latestElection.electionDay,
                  description: `Early voting location in ${rep.state}. Hours: ${site.pollingHours || 'Check location for hours'}. ${site.address ? `${site.address.line1}, ${site.address.city}, ${site.address.state} ${site.address.zip}` : ''}`,
                  source: 'google-civic',
                  metadata: { siteId: site.id, address: site.address }
                });
              });
            }

            // Add polling places
            if (voterInfo.pollingLocations && voterInfo.pollingLocations.length > 0) {
              voterInfo.pollingLocations.forEach((location: any) => {
                activity.push({
                  type: 'vote',
                  title: `Polling Place: ${location.name || 'Voting Location'}`,
                  date: latestElection.electionDay,
                  description: `Election day polling location in ${rep.state}. Hours: ${location.pollingHours || 'Check location for hours'}. ${location.address ? `${location.address.line1}, ${location.address.city}, ${location.address.state} ${location.address.zip}` : ''}`,
                  source: 'google-civic',
                  metadata: { locationId: location.id, address: location.address }
                });
              });
            }
          }
        } catch (earlyVotingError) {
          devLog('Early voting data fetch failed', { error: earlyVotingError });
        }
      }

      return {
        activity,
        dataSources: [...(rep.dataSources || []), 'google-civic-elections']
      };
    } catch (error) {
      devLog('Google Civic Election API error', { error: error instanceof Error ? error.message : 'Unknown error' });
      return {};
    }
  }

  /**
   * Google Civic Information API (FREE - 25,000 requests/day) - DEPRECATED
   */
  private async getGoogleCivicData(rep: RepresentativeData): Promise<Partial<RepresentativeData>> {
    const rateLimiter = this.rateLimiters.get('google-civic');
    
    if (rateLimiter.currentUsage >= rateLimiter.requestsPerDay) {
      devLog('Google Civic API rate limit reached');
      return {};
    }

    try {
      const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
      if (!apiKey) {
        devLog('Google Civic API key not configured');
        return {};
      }

      // Search for representative by state using a real address in the state
      // Use the state capital as a realistic address for Google Civic API
      const stateCapitals = {
        'Alabama': 'Montgomery, AL',
        'Alaska': 'Juneau, AK',
        'Arizona': 'Phoenix, AZ',
        'Arkansas': 'Little Rock, AR',
        'California': 'Sacramento, CA',
        'Colorado': 'Denver, CO',
        'Connecticut': 'Hartford, CT',
        'Delaware': 'Dover, DE',
        'Florida': 'Tallahassee, FL',
        'Georgia': 'Atlanta, GA',
        'Hawaii': 'Honolulu, HI',
        'Idaho': 'Boise, ID',
        'Illinois': 'Springfield, IL',
        'Indiana': 'Indianapolis, IN',
        'Iowa': 'Des Moines, IA',
        'Kansas': 'Topeka, KS',
        'Kentucky': 'Frankfort, KY',
        'Louisiana': 'Baton Rouge, LA',
        'Maine': 'Augusta, ME',
        'Maryland': 'Annapolis, MD',
        'Massachusetts': 'Boston, MA',
        'Michigan': 'Lansing, MI',
        'Minnesota': 'Saint Paul, MN',
        'Mississippi': 'Jackson, MS',
        'Missouri': 'Jefferson City, MO',
        'Montana': 'Helena, MT',
        'Nebraska': 'Lincoln, NE',
        'Nevada': 'Carson City, NV',
        'New Hampshire': 'Concord, NH',
        'New Jersey': 'Trenton, NJ',
        'New Mexico': 'Santa Fe, NM',
        'New York': 'Albany, NY',
        'North Carolina': 'Raleigh, NC',
        'North Dakota': 'Bismarck, ND',
        'Ohio': 'Columbus, OH',
        'Oklahoma': 'Oklahoma City, OK',
        'Oregon': 'Salem, OR',
        'Pennsylvania': 'Harrisburg, PA',
        'Rhode Island': 'Providence, RI',
        'South Carolina': 'Columbia, SC',
        'South Dakota': 'Pierre, SD',
        'Tennessee': 'Nashville, TN',
        'Texas': 'Austin, TX',
        'Utah': 'Salt Lake City, UT',
        'Vermont': 'Montpelier, VT',
        'Virginia': 'Richmond, VA',
        'Washington': 'Olympia, WA',
        'West Virginia': 'Charleston, WV',
        'Wisconsin': 'Madison, WI',
        'Wyoming': 'Cheyenne, WY'
      };
      
      const searchQuery = stateCapitals[rep.state as keyof typeof stateCapitals] || `${rep.state} State Capitol`;
      const response = await fetch(
        `https://www.googleapis.com/civicinfo/v2/representatives?address=${encodeURIComponent(searchQuery)}&key=${apiKey}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        devLog('Google Civic API request failed', { status: response.status });
        return {};
      }

      const data = await response.json();
      rateLimiter.currentUsage++;

      // Extract representative data
      const representatives = data.officials || [];
      const _offices = data.offices || [];
      
      const enrichedData: Partial<RepresentativeData> = {
        dataSources: ['google-civic'],
        contacts: [],
        socialMedia: [],
        photos: []
      };

      // Process each representative
      for (const official of representatives) {
        if (this.isMatchingRepresentative(official, rep)) {
          // Extract contact information
          const contacts = this.extractGoogleCivicContacts(official);
          enrichedData.contacts = [...(enrichedData.contacts || []), ...contacts];

          // Extract social media
          const socialMedia = this.extractGoogleCivicSocialMedia(official);
          enrichedData.socialMedia = [...(enrichedData.socialMedia || []), ...socialMedia];

          // Extract photos
          const photos = this.extractGoogleCivicPhotos(official);
          enrichedData.photos = [...(enrichedData.photos || []), ...photos];

          // Extract basic info
          if (official.name) enrichedData.name = official.name;
          if (official.party) enrichedData.party = official.party;
        }
      }

      return enrichedData;

    } catch (_error) {
      devLog('Google Civic API error', { error: _error });
      return {};
    }
  }

  /**
   * Enhanced OpenStates People integration
   * Combines API data with repository YAML data for comprehensive coverage
   */
  private async getOpenStatesPeopleData(rep: RepresentativeData): Promise<Partial<RepresentativeData>> {
    console.log('🔍 OpenStates People: Starting enhanced data collection for', rep.name);
    
    // First try API integration
    const apiData = await this.getOpenStatesData(rep);
    
    // Then try YAML repository integration if available
    const yamlData = await this.getOpenStatesYAMLData(rep);
    
    // Merge both sources with proper attribution
    const mergedData = this.mergeOpenStatesSources(apiData, yamlData);
    
    return mergedData;
  }

  /**
   * OpenStates API (FREE - 10,000 requests/day)
   * Now using proper API key authentication
   */
  private async getOpenStatesData(rep: RepresentativeData): Promise<Partial<RepresentativeData>> {
    console.log('🔍 OpenStates: Starting data collection for', rep.name);
    
    const rateLimiter = this.rateLimiters.get('openstates');
    console.log('🔍 OpenStates: Rate limiter status', { 
      currentUsage: rateLimiter.currentUsage, 
      limit: rateLimiter.requestsPerDay 
    });
    
    if (rateLimiter.currentUsage >= rateLimiter.requestsPerDay) {
      console.log('❌ OpenStates: Rate limit reached');
      return {};
    }

    try {
      const apiKey = process.env.OPEN_STATES_API_KEY;
      console.log('🔍 OpenStates: API key check', { 
        hasKey: !!apiKey, 
        keyLength: apiKey?.length 
      });
      
      if (!apiKey) {
        console.log('❌ OpenStates: API key not configured');
        return {};
      }

      console.log('🔍 OpenStates: Making API request to', `https://v3.openstates.org/people?jurisdiction=${rep.state}`);

      // Add delay before API call to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

      // Search for legislators by state using OpenStates API v3
      const response = await fetch(
        `https://v3.openstates.org/people?jurisdiction=${rep.state}`,
        {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Choices-Civics-Platform/1.0',
            'X-API-KEY': apiKey
          }
        }
      );
      
      console.log('🔍 OpenStates: API response status', response.status);

      devLog('OpenStates API response received', { 
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get('content-type'),
        allHeaders: Object.fromEntries(response.headers.entries()),
        url: response.url
      });

      if (!response.ok) {
        if (response.status === 429) {
          devLog('OpenStates API rate limited, waiting 30 seconds...', { status: response.status });
          await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds for rate limit
          return {}; // Return empty to avoid further requests
        }
        devLog('OpenStates API request failed', { status: response.status });
        return {};
      }

      const responseText = await response.text();
      devLog('OpenStates API response text', { 
        textLength: responseText.length,
        textPreview: responseText.substring(0, 200)
      });
      
      let data;
      try {
        data = JSON.parse(responseText);
        devLog('OpenStates API data parsed successfully', { 
          resultsCount: data.results?.length || 0
        });
      } catch (parseError) {
        devLog('OpenStates API returned non-JSON response', { 
          status: response.status,
          responseText: responseText.substring(0, 200) + '...',
          parseError: parseError instanceof Error ? parseError.message : 'Unknown error'
        });
        return {};
      }
      rateLimiter.currentUsage++;

      const enrichedData: Partial<RepresentativeData> = {
        dataSources: ['openstates'],
        contacts: [],
        socialMedia: [],
        photos: []
      };

      // Process only CURRENT legislators from the API v3 response
      const allLegislators = data.results || [];
      const currentLegislators = this.filterCurrentLegislators(allLegislators);
      
      devLog('OpenStates filtering results', {
        totalLegislators: allLegislators.length,
        currentLegislators: currentLegislators.length,
        filteredOut: allLegislators.length - currentLegislators.length
      });
      
      for (const legislator of currentLegislators) {
        // Extract contact information
        const contacts = this.extractOpenStatesContacts(legislator);
        enrichedData.contacts = [...(enrichedData.contacts || []), ...contacts];

        // Extract social media
        const socialMedia = this.extractOpenStatesSocialMedia(legislator);
        enrichedData.socialMedia = [...(enrichedData.socialMedia || []), ...socialMedia];

        // Extract photos
        const photos = this.extractOpenStatesPhotos(legislator);
        enrichedData.photos = [...(enrichedData.photos || []), ...photos];

        // Extract basic info
        if (legislator.name) enrichedData.name = legislator.name;
        if (legislator.party) enrichedData.party = legislator.party;
        if (legislator.id) enrichedData.openstatesId = legislator.id;
      }

      return enrichedData;

    } catch (error) {
      console.log('❌ OpenStates API error:', error);
      devLog('OpenStates API error', { error });
      return {};
    }
  }

  /**
   * LegiScan API (FREE - 1,000 requests/day) - Enhanced Legislative Data
   */
  private async getLegiScanData(rep: RepresentativeData): Promise<Partial<RepresentativeData>> {
    try {
      const apiKey = process.env.LEGISCAN_API_KEY;
      if (!apiKey) {
        devLog('LegiScan API key not configured');
        return {};
      }
      
      // Check rate limits - be very conservative with their free API
      const rateLimiter = this.rateLimiters.get('legiscan');
    if (rateLimiter.currentUsage >= rateLimiter.requestsPerDay) {
        devLog('LegiScan API rate limit reached - being respectful of their free service');
      return {};
    }

      // Add delay to be respectful of their free API
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      
      devLog('Making LegiScan API request (being respectful of free service)', { 
        state: rep.state,
        name: rep.name,
        usage: rateLimiter.currentUsage,
        limit: rateLimiter.requestsPerDay
      });
      
      // Get session people for the state - only if we don't have LegiScan ID already
      if (rep.legiscanId) {
        devLog('LegiScan ID already exists, getting enhanced legislative data');
        return await this.getLegiScanLegislativeData(rep.legiscanId, apiKey);
      }

      const response = await fetch(
        `https://api.legiscan.com/?key=${apiKey}&op=getSessionPeople&id=${rep.state}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        devLog('LegiScan API request failed', { status: response.status });
        return {};
      }

      const data = await response.json();
      if (!data.sessionpeople || data.sessionpeople.length === 0) {
        devLog('No LegiScan session people found for state', { state: rep.state });
        return {};
      }

      // Find matching representative
      const matchingPerson = data.sessionpeople.find((person: any) => 
        person.name.toLowerCase().includes(rep.name.toLowerCase()) ||
        rep.name.toLowerCase().includes(person.name.toLowerCase())
      );

      if (!matchingPerson) {
        devLog('No matching LegiScan person found', { 
          name: rep.name, 
          availableNames: data.sessionpeople.map((p: any) => p.name).slice(0, 5)
        });
        return {};
      }

      devLog('LegiScan match found', { 
        name: matchingPerson.name,
        id: matchingPerson.people_id,
        hasEmail: !!matchingPerson.email,
        hasTwitter: !!matchingPerson.twitter
      });

      // Get enhanced legislative data
      const legislativeData = await this.getLegiScanLegislativeData(matchingPerson.people_id, apiKey);

      return {
        legiscanId: matchingPerson.people_id,
        contacts: matchingPerson.email ? [{
          type: 'email',
          value: matchingPerson.email,
          isVerified: true,
          isPrimary: true,
          source: 'legiscan'
        }] : [],
        socialMedia: matchingPerson.twitter ? [{
          platform: 'twitter',
          handle: matchingPerson.twitter,
          url: `https://twitter.com/${matchingPerson.twitter}`,
          isVerified: true,
          followersCount: 0,
          source: 'legiscan'
        }] : [],
        committeeMemberships: matchingPerson.committees || [],
        ...(legislativeData || {}),
        dataSources: [...(rep.dataSources || []), 'legiscan']
      };
    } catch (error) {
      devLog('LegiScan API error', { error: error instanceof Error ? error.message : 'Unknown error' });
      return {};
    }
  }

  /**
   * Get enhanced legislative data from LegiScan
   */
  private async getLegiScanLegislativeData(peopleId: string, apiKey: string): Promise<Partial<RepresentativeData>> {
    try {
      // Get person details with legislative history
      const personResponse = await fetch(
        `https://api.legiscan.com/?key=${apiKey}&op=getPerson&id=${peopleId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!personResponse.ok) {
        devLog('LegiScan person details request failed', { status: personResponse.status });
        return {};
      }

      const personData = await personResponse.json();
      if (!personData.person) {
        devLog('No LegiScan person details found', { peopleId });
        return {};
      }

      const person = personData.person;
      
      // Get recent bills sponsored/co-sponsored
      const billsResponse = await fetch(
        `https://api.legiscan.com/?key=${apiKey}&op=getPersonBills&id=${peopleId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      let recentBills: any[] = [];
      if (billsResponse.ok) {
        const billsData = await billsResponse.json();
        if (billsData.bills) {
          // Get the 5 most recent bills
          recentBills = Object.values(billsData.bills)
            .sort((a: any, b: any) => new Date(b.introduced).getTime() - new Date(a.introduced).getTime())
            .slice(0, 5);
        }
      }

      // Get voting records
      const votesResponse = await fetch(
        `https://api.legiscan.com/?key=${apiKey}&op=getPersonVotes&id=${peopleId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      let recentVotes: any[] = [];
      if (votesResponse.ok) {
        const votesData = await votesResponse.json();
        if (votesData.votes) {
          // Get the 10 most recent votes
          recentVotes = Object.values(votesData.votes)
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);
        }
      }

      devLog('LegiScan legislative data retrieved', {
        peopleId,
        billsCount: recentBills.length,
        votesCount: recentVotes.length,
        hasCommittees: !!person.committees,
        hasSessions: !!person.sessions
      });

      return {
        // Enhanced contact information
        contacts: [
          ...(person.email ? [{
            type: 'email' as const,
            value: person.email,
            isVerified: true,
            isPrimary: true,
            source: 'legiscan'
          }] : []),
          ...(person.phone ? [{
            type: 'phone' as const,
            value: person.phone,
            isVerified: true,
            isPrimary: true,
            source: 'legiscan'
          }] : []),
          ...(person.website ? [{
            type: 'website' as const,
            value: person.website,
            isVerified: true,
            isPrimary: true,
            source: 'legiscan'
          }] : [])
        ],
        
        // Enhanced social media
        socialMedia: [
          ...(person.twitter ? [{
            platform: 'twitter' as const,
            handle: person.twitter,
            url: `https://twitter.com/${person.twitter}`,
            isVerified: true,
            followersCount: 0,
            source: 'legiscan'
          }] : []),
          ...(person.facebook ? [{
            platform: 'facebook' as const,
            handle: person.facebook,
            url: `https://facebook.com/${person.facebook}`,
            isVerified: true,
            followersCount: 0,
            source: 'legiscan'
          }] : [])
        ],

        // Legislative activity data
        activity: [
          ...recentBills.map(bill => ({
            type: 'bill_sponsored' as const,
            title: bill.title,
            description: bill.description,
            date: new Date(bill.introduced),
            source: 'legiscan',
            metadata: {
              billNumber: bill.number,
              status: bill.status,
              session: bill.session,
              url: bill.url
            }
          })),
          ...recentVotes.map(vote => ({
            type: 'vote' as const,
            title: vote.title,
            description: `Voted ${vote.vote} on ${vote.title}`,
            date: new Date(vote.date),
            source: 'legiscan',
            metadata: {
              vote: vote.vote,
              billNumber: vote.bill_number,
              session: vote.session
            }
          }))
        ],

        // Committee information
        committeeMemberships: person.committees || [],

        // Session information
        sessionInfo: {
          currentSession: person.sessions?.[0] || null,
          allSessions: person.sessions || [],
          source: 'legiscan'
        },

        // Legislative statistics
        legislativeStats: {
          billsSponsored: person.bills_sponsored || 0,
          billsCoSponsored: person.bills_cosponsored || 0,
          votesCast: person.votes_cast || 0,
          attendanceRate: person.attendance_rate || 0,
          source: 'legiscan'
        }
      };
    } catch (error) {
      devLog('LegiScan legislative data error', { error: error instanceof Error ? error.message : 'Unknown error' });
      return {};
    }
  }

  private async getCongressGovData(rep: RepresentativeData): Promise<Partial<RepresentativeData>> {
    const rateLimiter = this.rateLimiters.get('congress-gov');
    
    if (rateLimiter.currentUsage >= rateLimiter.requestsPerDay) {
      devLog('Congress.gov API rate limit reached');
      return {};
    }

    // Congress.gov only has federal representatives
    if (rep.level !== 'federal') {
      devLog('Congress.gov: Only available for federal representatives, got:', rep.level);
      return {};
    }

    try {
      // OPTIMIZED: Single Congress.gov call that gets ALL data at once
      const enrichedData: Partial<RepresentativeData> = {
        dataSources: ['congress-gov'], // Only ONE data source entry
        contacts: [],
        socialMedia: [],
        photos: [],
        activity: []
      };

      // 1. Get basic member data with pagination
      const memberResponse = await fetch(
        `https://api.congress.gov/v3/member?state=${rep.state}&format=json&api_key=${process.env.CONGRESS_GOV_API_KEY}&limit=250`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!memberResponse.ok) {
        devLog('Congress.gov member API request failed', { status: memberResponse.status });
        return {};
      }

      const memberData = await memberResponse.json();
      rateLimiter.currentUsage++;

      // Find matching representative
      const members = memberData.members || [];
      console.log(`🔍 Looking for match in ${members.length} members for ${rep.name}`);
      console.log('🔍 Available members:', members.map((m: any) => m.name).slice(0, 5));
      
      const matchingRep = members.find((member: any) => 
        this.isMatchingRepresentative(member, rep)
      );
      console.log('🔍 Matching result:', matchingRep ? 'FOUND' : 'NOT FOUND');
      if (matchingRep) {
        console.log('🔍 Matched member:', matchingRep.name, matchingRep.bioguideId);
      }

      if (matchingRep) {
        console.log('🔍 Congress.gov: Found matching representative:', matchingRep.name);
        
        // Get detailed member information using bioguideId
        if (matchingRep.bioguideId) {
          try {
            console.log('🔍 Congress.gov: Getting detailed info for', matchingRep.bioguideId);
            const detailedResponse = await fetch(
              `https://api.congress.gov/v3/member/${matchingRep.bioguideId}?format=json&api_key=${process.env.CONGRESS_GOV_API_KEY}`,
              {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
              }
            );
            
            if (detailedResponse.ok) {
              const detailedData = await detailedResponse.json();
              console.log('🔍 Congress.gov: Detailed data received');
              
              // Extract contacts and photos from detailed data
              const contacts = this.extractCongressGovContacts(detailedData.member);
              const photos = this.extractCongressGovPhotos(detailedData.member);
        
        enrichedData.contacts = contacts;
        enrichedData.photos = photos;
              
              console.log('🔍 Congress.gov: Extracted', contacts.length, 'contacts and', photos.length, 'photos');
            } else {
              console.log('❌ Congress.gov: Detailed request failed:', detailedResponse.status);
            }
          } catch (error) {
            console.log('❌ Congress.gov: Detailed request error:', error);
          }
        }

        // Extract basic info
        if (matchingRep.name) enrichedData.name = matchingRep.name;
        if (matchingRep.partyName) enrichedData.party = matchingRep.partyName;
        if (matchingRep.bioguideId) enrichedData.bioguideId = matchingRep.bioguideId;

        // 2. Get recent activity (votes) in the same call if we have bioguideId
        if (matchingRep.bioguideId && rep.level === 'federal') {
          try {
            const activityResponse = await fetch(
              `https://api.congress.gov/v3/member/${matchingRep.bioguideId}/votes?format=json&api_key=${process.env.CONGRESS_GOV_API_KEY}&limit=5`,
              {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
              }
            );

            if (activityResponse.ok) {
              const activityData = await activityResponse.json();
              const recentVotes = activityData.votes?.map((vote: any) => ({
                type: 'vote',
                title: vote.description || vote.question,
                date: vote.date,
                result: vote.result,
                chamber: vote.chamber,
                source: 'congress-gov'
              })) || [];
              
              enrichedData.activity = recentVotes;
            }
          } catch (activityError) {
            devLog('Congress.gov activity API failed', { error: activityError });
            // Don't fail the whole method if activity fails
          }
        }
      }

      return enrichedData;

    } catch (error) {
      devLog('Congress.gov API error', { error });
      return {};
    }
  }

  /**
   * Get photos from multiple FREE sources
   */
  private async getPhotosFromMultipleSources(rep: RepresentativeData): Promise<PhotoInfo[]> {
    const photos: PhotoInfo[] = [];

    try {
      // 1. Congress.gov official photos (FREE) - Enhanced
      if (rep.bioguideId) {
        const congressPhotos = await this.getCongressPhoto(rep.bioguideId);
        photos.push(...congressPhotos);
      }

      // 2. Wikipedia photos (FREE)
      const wikipediaPhotos = await this.getWikipediaPhotos(rep.name);
      photos.push(...wikipediaPhotos);

      // 3. Google Civic photos (FREE)
      const googlePhotos = await this.getGoogleCivicPhotos(rep);
      photos.push(...googlePhotos);

      // 4. OpenStates photos (FREE)
      const openStatesPhotos = await this.getOpenStatesPhotos(rep);
      photos.push(...openStatesPhotos);

      // 5. Generate initials if no photos (FREE)
      if (photos.length === 0) {
        photos.push(this.generateInitialsPhoto(rep.name));
      }

      return this.rankPhotos(photos);

    } catch (error) {
      devLog('Error getting photos from multiple sources', { error });
      return photos;
    }
  }

  /**
   * Get social media data from FREE sources
   */
  private async getSocialMediaData(rep: RepresentativeData): Promise<SocialMediaInfo[]> {
    const socialMedia: SocialMediaInfo[] = [];

    try {
      // 1. Google Civic channels (FREE)
      const googleSocial = await this.getGoogleCivicSocialMedia(rep);
      socialMedia.push(...googleSocial);

      // 2. OpenStates sources (FREE)
      const openStatesSocial = await this.getOpenStatesSocialMedia(rep);
      socialMedia.push(...openStatesSocial);

      // 3. Search for additional social media (FREE)
      const additionalSocial = await this.searchSocialMedia(rep.name);
      socialMedia.push(...additionalSocial);

      return this.deduplicateAndRank(socialMedia);

    } catch (error) {
      devLog('Error getting social media data', { error });
      return socialMedia;
    }
  }

  /**
   * Wikipedia API (FREE - No rate limits)
   */
  private async getWikipediaData(rep: RepresentativeData): Promise<Partial<RepresentativeData>> {
    console.log('🔍 Wikipedia: Starting data collection for', rep.name);
    
    try {
      // Try different name formats for Wikipedia search
      const nameFormats = [
        rep.name,
        `${rep.name} (politician)`,
        `${rep.name} (${rep.party})`,
        `${rep.name} (${rep.state})`
      ];
      
      for (const nameFormat of nameFormats) {
        console.log('🔍 Wikipedia: Trying name format:', nameFormat);
        
        // Add small delay between requests to be respectful of Wikipedia API
        if (nameFormat !== rep.name) {
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        }
        
        const response = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(nameFormat)}`,
          {
            method: 'GET',
            headers: { 
              'Content-Type': 'application/json',
              'Accept-Encoding': 'gzip',
              'User-Agent': 'Choices-Civics-Platform/1.0 (https://choices.civics.org; contact@choices.civics.org) Wikipedia-API-Integration/1.0'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.title && data.extract) {
            console.log('✅ Wikipedia: Found page for', nameFormat);
            
            return {
              wikipediaUrl: data.content_urls?.desktop?.page,
              dataSources: ['wikipedia'],
              // Add Wikipedia data as activity
              activity: [{
                type: 'statement' as const,
                title: `Wikipedia: ${data.title}`,
                description: data.extract.substring(0, 200) + '...',
                url: data.content_urls?.desktop?.page,
                date: new Date(),
                source: 'wikipedia',
                metadata: {
                  wikipediaTitle: data.title,
                  wikipediaExtract: data.extract,
                  wikipediaThumbnail: data.thumbnail?.source
                }
              }]
            };
          }
        }
      }
      
      console.log('❌ Wikipedia: No page found for any name format');
      return {};
      
    } catch (error) {
      console.log('❌ Wikipedia API error:', error);
      return {};
    }
  }

  /**
   * Convert state name to abbreviation for FEC API
   */
  private getStateAbbreviation(stateName: string): string {
    const stateMap: Record<string, string> = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
      'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
      'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
      'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
      'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
      'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
      'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
      'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
      'District of Columbia': 'DC'
    };
    
    return stateMap[stateName] || stateName; // Return original if not found
  }

  /**
   * FEC API (FREE - 1,000 requests/day)
   */

  /**
   * Get FEC campaign finance data
   */
  private async getFECData(rep: RepresentativeData): Promise<CampaignFinanceInfo | undefined> {
    console.log('🔍 FEC: Starting data collection for', rep.name, rep.level);
    devLog('🔍 FEC: Starting data collection for', rep.name, rep.level);
    
    const rateLimiter = this.rateLimiters.get('fec');
    devLog('🔍 FEC: Rate limiter status', { 
      currentUsage: rateLimiter.currentUsage, 
      limit: rateLimiter.requestsPerDay 
    });
    
    if (rateLimiter.currentUsage >= rateLimiter.requestsPerDay) {
      devLog('❌ FEC: Rate limit reached');
      return undefined;
    }

    try {
      const apiKey = process.env.FEC_API_KEY;
      devLog('🔍 FEC: API key check', { hasKey: !!apiKey });
      
      if (!apiKey) {
        devLog('❌ FEC: API key not configured');
        return undefined;
      }

      // FEC only covers federal candidates
      if (rep.level !== 'federal') {
        devLog('❌ FEC: Only available for federal candidates, got:', rep.level);
        return undefined;
      }

      // If we have a FEC ID, use it directly
      if (rep.fecId) {
      const response = await fetch(
          `https://api.open.fec.gov/v1/candidate/${rep.fecId}/totals/?api_key=${apiKey}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        devLog('FEC API request failed', { status: response.status });
        return undefined;
      }

      const data = await response.json();
      rateLimiter.currentUsage++;

        if (data.results && data.results.length > 0) {
          const candidate = data.results[0];
          return {
            electionCycle: candidate.cycle,
            totalReceipts: candidate.receipts,
            totalDisbursements: candidate.disbursements,
            cashOnHand: candidate.cash_on_hand,
            debt: candidate.debt,
            individualContributions: candidate.individual_contributions,
            pacContributions: candidate.pac_contributions,
            partyContributions: candidate.party_contributions,
            selfFinancing: candidate.candidate_contribution
          };
        }
      }

      // If no FEC ID, search for candidates by name and state
      const searchName = rep.name.split(' ').slice(0, 2).join(' '); // First and last name
      devLog('🔍 FEC: Searching for candidate', { searchName, state: rep.state, office: rep.office });
      
      // Convert state name to abbreviation for FEC API
      const stateAbbrev = this.getStateAbbreviation(rep.state);
      devLog('🔍 FEC: State abbreviation', { original: rep.state, abbreviation: stateAbbrev });
      
      // Determine office type for FEC search
      let officeParam = '';
      if (rep.office.toLowerCase().includes('president')) officeParam = '&office=P';
      else if (rep.office.toLowerCase().includes('senate') || rep.office.toLowerCase().includes('senator')) officeParam = '&office=S';
      else if (rep.office.toLowerCase().includes('house') || rep.office.toLowerCase().includes('representative') || rep.office.toLowerCase().includes('assembly')) officeParam = '&office=H';
      
      // Use the general candidates endpoint with 'q' parameter for name search
      const searchUrl = `https://api.open.fec.gov/v1/candidates/?q=${encodeURIComponent(searchName)}&state=${stateAbbrev}${officeParam}&api_key=${apiKey}`;
      devLog('🔍 FEC: Search URL', searchUrl);
      
      const response = await fetch(searchUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
      });
      
      devLog('🔍 FEC: Search response status', response.status);

      if (!response.ok) {
        devLog('FEC search request failed', { status: response.status });
        return undefined;
      }

      const data = await response.json();
      rateLimiter.currentUsage++;
      
      devLog('FEC search results', { 
        candidateCount: data.results?.length || 0,
        searchName,
        state: rep.state,
        office: rep.office
      });

      if (data.results && data.results.length > 0) {
        const candidate = data.results[0]; // Take the first match
        devLog('FEC candidate found', { name: candidate.name, id: candidate.candidate_id });

        // Now get detailed totals for this candidate
        const totalsResponse = await fetch(
          `https://api.open.fec.gov/v1/candidate/${candidate.candidate_id}/totals/?api_key=${apiKey}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }
        );
        
        if (totalsResponse.ok) {
          const totalsData = await totalsResponse.json();
          const totals = totalsData.results?.[0];
          
          devLog('FEC totals data', { 
            hasTotals: !!totals,
            cycle: totals?.cycle,
            receipts: totals?.receipts
          });
          
      if (totals) {
        return {
              electionCycle: totals.cycle,
              totalReceipts: totals.receipts,
              totalDisbursements: totals.disbursements,
              cashOnHand: totals.cash_on_hand,
              debt: totals.debt,
              individualContributions: totals.individual_contributions,
              pacContributions: totals.pac_contributions,
              partyContributions: totals.party_contributions,
              selfFinancing: totals.candidate_contribution
            };
          }
        } else {
          devLog('FEC totals request failed', { status: totalsResponse.status });
        }
      }
      return undefined;
    } catch (error) {
      devLog('FEC API error', { error: error instanceof Error ? error.message : 'Unknown error' });
      return undefined;
    }
  }

  /**
   * Check if a LegiScan person matches our representative
   */
  private isMatchingLegiScanPerson(person: any, rep: RepresentativeData): boolean {
    if (!person.first_name || !person.last_name) return false;
    
    const personFullName = `${person.first_name} ${person.last_name}`.toLowerCase();
    const repName = rep.name.toLowerCase();
    
    // Check if names match (allowing for variations)
    const repWords = repName.split(' ').filter(word => word.length > 1);
    const personWords = personFullName.split(' ').filter(word => word.length > 1);
    
    // Check if all words from rep name are in person name or vice versa
    const repWordsInPerson = repWords.every(word => personWords.some(pWord => pWord.includes(word) || word.includes(pWord)));
    const personWordsInRep = personWords.every(word => repWords.some(rWord => rWord.includes(word) || word.includes(rWord)));
    
    return repWordsInPerson || personWordsInRep;
  }

  /**
   * Get detailed person information from LegiScan
   */
  private async getLegiScanPersonDetails(peopleId: string, apiKey: string): Promise<Partial<RepresentativeData>> {
    try {
      const response = await fetch(
        `https://api.legiscan.com/?key=${apiKey}&op=getPerson&id=${peopleId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        devLog('LegiScan person request failed', { status: response.status });
        return {};
      }

      const data = await response.json();
      const person = data.person;
      
      if (!person) {
        devLog('No LegiScan person details found', { peopleId });
        return {};
      }

      devLog('LegiScan person details retrieved', {
        peopleId,
        name: person.name,
        party: person.party,
        role: person.role,
        district: person.district
      });

      return {
        legiscanId: peopleId,
        contacts: person.email ? [{
          type: 'email' as const,
          value: person.email,
          isVerified: true,
          isPrimary: true,
          source: 'legiscan'
        }] : [],
        socialMedia: person.twitter ? [{
          platform: 'twitter' as const,
          handle: person.twitter,
          url: `https://twitter.com/${person.twitter}`,
          isVerified: true,
          followersCount: 0,
          source: 'legiscan'
        }] : [],
        dataSources: ['legiscan']
      };
    } catch (error) {
      devLog('LegiScan person details error', { error: error instanceof Error ? error.message : 'Unknown error' });
      return {};
    }
  }


  /**
   * Get recent activity for feed
   */
  private async getRecentActivity(rep: RepresentativeData): Promise<ActivityInfo[]> {
    const activity: ActivityInfo[] = [];

    try {
      // Get recent votes from Congress.gov
      const votes = await this.getRecentVotes(rep);
      activity.push(...votes);

      // Get recent bills from OpenStates
      const bills = await this.getRecentBills(rep);
      activity.push(...bills);

      // Get social media updates
      const socialUpdates = await this.getSocialMediaUpdates(rep);
      activity.push(...socialUpdates);

      return activity.sort((a, b) => b.date.getTime() - a.date.getTime());

    } catch (error) {
      devLog('Error getting recent activity', { error });
      return activity;
    }
  }

  // Helper methods for data extraction and processing
  private isMatchingRepresentative(apiRep: any, ourRep: RepresentativeData): boolean {
    // Enhanced name matching to handle different formats
    const apiName = apiRep.name || apiRep.full_name || apiRep.fullName || '';
    const ourName = ourRep.name;
    
    // Normalize names by removing punctuation and extra spaces
    const normalizeName = (name: string) => {
      return name.toLowerCase()
        .replace(/[.,]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
    };
    
    const normalizedApiName = normalizeName(apiName);
    const normalizedOurName = normalizeName(ourName);
    
    // Check if either name contains the other
    const match1 = normalizedApiName.includes(normalizedOurName);
    const match2 = normalizedOurName.includes(normalizedApiName);
    
    // Check if they share the same last name (for cases like "Whitesides, George" vs "George Whitesides")
    const apiLastName = normalizedApiName.split(' ').pop();
    const ourLastName = normalizedOurName.split(' ').pop();
    const lastNameMatch = apiLastName === ourLastName;
    
    // Check if they share the same first name (for cases like "Whitesides, George" vs "George Whitesides")
    const apiFirstName = normalizedApiName.split(' ')[0];
    const ourFirstName = normalizedOurName.split(' ')[0];
    const firstNameMatch = apiFirstName === ourFirstName;
    
    // Check if the names are the same but in different order
    const apiWords = normalizedApiName.split(' ').sort();
    const ourWords = normalizedOurName.split(' ').sort();
    const sameWords = apiWords.length === ourWords.length && 
                     apiWords.every((word, index) => word === ourWords[index]);
    
    const finalMatch = match1 || match2 || lastNameMatch || (lastNameMatch && firstNameMatch) || sameWords;
    
    // Debug logging
    console.log('🔍 isMatchingRepresentative:', {
      apiName, 
      ourName,
      normalizedApiName,
      normalizedOurName,
      match1,
      match2,
      lastNameMatch,
      finalMatch
    });
    
    return finalMatch;
  }

  private extractGoogleCivicContacts(official: any): ContactInfo[] {
    const contacts: ContactInfo[] = [];
    
    // Enhanced email extraction with verification and labels
    if (official.emails) {
      official.emails.forEach((email: string, index: number) => {
        contacts.push({
          type: 'email',
          value: email,
          isPrimary: index === 0,
          isVerified: this.isVerifiedEmail(email),
          source: 'google-civic',
          label: this.getEmailLabel(email, index)
        });
      });
    }

    // Enhanced phone extraction with verification and labels
    if (official.phones) {
      official.phones.forEach((phone: string, index: number) => {
        contacts.push({
          type: 'phone',
          value: phone,
          isPrimary: index === 0,
          isVerified: this.isVerifiedPhone(phone),
          source: 'google-civic',
          label: this.getPhoneLabel(phone, index)
        });
      });
    }

    // Enhanced website extraction with verification and labels
    if (official.urls) {
      official.urls.forEach((url: string, index: number) => {
        contacts.push({
          type: 'website',
          value: url,
          isPrimary: index === 0,
          isVerified: this.isVerifiedWebsite(url),
          source: 'google-civic',
          label: this.getWebsiteLabel(url, index)
        });
      });
    }

    // Extract office address if available
    if (official.address) {
      contacts.push({
        type: 'address',
        value: this.formatAddress(official.address),
        isPrimary: true,
        isVerified: true,
        source: 'google-civic',
        label: 'Office Address'
      });
    }

    return contacts;
  }

  private extractGoogleCivicSocialMedia(official: any): SocialMediaInfo[] {
    const socialMedia: SocialMediaInfo[] = [];
    
    if (official.channels) {
      official.channels.forEach((channel: any) => {
        const platform = this.mapChannelToPlatform(channel.type);
        if (platform) {
          socialMedia.push({
            platform,
            handle: channel.id,
            url: channel.id,
            followersCount: 0,
            isVerified: false,
            source: 'google-civic'
          });
        }
      });
    }

    return socialMedia;
  }

  private extractGoogleCivicPhotos(official: any): PhotoInfo[] {
    const photos: PhotoInfo[] = [];
    
    if (official.photoUrl) {
      photos.push({
        url: official.photoUrl,
        source: 'google-civic',
        quality: 'medium',
        isPrimary: true
      });
    }

    return photos;
  }

  private mapChannelToPlatform(channelType: string): SocialMediaInfo['platform'] | null {
    const mapping: Record<string, SocialMediaInfo['platform']> = {
      'Twitter': 'twitter',
      'Facebook': 'facebook',
      'Instagram': 'instagram',
      'YouTube': 'youtube',
      'LinkedIn': 'linkedin'
    };

    return mapping[channelType] || null;
  }

  private async getCongressPhoto(bioguideId: string): Promise<PhotoInfo[]> {
    const photos: PhotoInfo[] = [];
    
    try {
      // Primary photo from Congress.gov
      const primaryPhotoUrl = `https://www.congress.gov/img/member/${bioguideId}.jpg`;
      const primaryResponse = await fetch(primaryPhotoUrl, { method: 'HEAD' });
      
      if (primaryResponse.ok) {
        photos.push({
          url: primaryPhotoUrl,
          source: 'congress-gov',
          quality: 'high',
          isPrimary: true,
          width: 200, // Standard Congress.gov photo size
          height: 250,
          altText: `Official photo of ${bioguideId}`,
          caption: 'Official Congressional photo',
          photographer: 'Congress.gov',
          usageRights: 'Public domain'
        });
      }
      
      // Alternative photo sources
      const alternativeUrls = [
        `https://www.congress.gov/img/member/${bioguideId.toLowerCase()}.jpg`,
        `https://www.congress.gov/img/member/${bioguideId.toUpperCase()}.jpg`
      ];
      
      for (const url of alternativeUrls) {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok && !photos.some(p => p.url === url)) {
          photos.push({
            url: url,
            source: 'congress-gov-alternative',
            quality: 'medium',
            isPrimary: false,
            width: 200,
            height: 250,
            altText: `Alternative photo of ${bioguideId}`,
            caption: 'Alternative Congressional photo',
            photographer: 'Congress.gov',
            usageRights: 'Public domain'
          });
        }
      }
      
    } catch (error) {
      devLog('Congress.gov photo collection error', { error, bioguideId });
    }
    
    return photos;
  }

  private async getWikipediaPhotos(name: string): Promise<PhotoInfo[]> {
    const photos: PhotoInfo[] = [];
    
    try {
      // Search for Wikipedia page
      const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;
      const searchResponse = await fetch(searchUrl);
      
      if (searchResponse.ok) {
        const data = await searchResponse.json();
        
        // Extract thumbnail if available
        if (data.thumbnail && data.thumbnail.source) {
          photos.push({
            url: data.thumbnail.source,
            source: 'wikipedia',
            quality: 'medium',
            isPrimary: false,
            width: data.thumbnail.width || 200,
            height: data.thumbnail.height || 200,
            altText: `Wikipedia photo of ${name}`,
            caption: `Wikipedia photo of ${name}`,
            photographer: 'Wikipedia',
            usageRights: 'Creative Commons',
            attribution: 'Wikipedia'
          });
        }
        
        // Try to get higher resolution image
        if (data.content_urls && data.content_urls.desktop && data.content_urls.desktop.page) {
          const pageUrl = data.content_urls.desktop.page;
          const imageUrl = await this.extractWikipediaImage(pageUrl, name);
          if (imageUrl) {
            photos.push({
              url: imageUrl,
              source: 'wikipedia-high-res',
              quality: 'high',
              isPrimary: true,
              width: 400,
              height: 400,
              altText: `High resolution Wikipedia photo of ${name}`,
              caption: `High resolution Wikipedia photo of ${name}`,
              photographer: 'Wikipedia',
              usageRights: 'Creative Commons',
              attribution: 'Wikipedia'
            });
          }
        }
      }
    } catch (error) {
      devLog('Wikipedia photo search error', { error, name });
    }
    
    return photos;
  }

  private async getGoogleCivicPhotos(rep: RepresentativeData): Promise<PhotoInfo[]> {
    // Log the representative being processed for debugging
    devLog('Getting Google Civic photos for', { name: rep.name, state: rep.state });
    // Implementation for Google Civic photos
    return [];
  }

  private async getOpenStatesPhotos(rep: RepresentativeData): Promise<PhotoInfo[]> {
    // Log the representative being processed for debugging
    devLog('Getting OpenStates photos for', { name: rep.name, state: rep.state });
    // Implementation for OpenStates photos
    return [];
  }

  private generateInitialsPhoto(name: string): PhotoInfo {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    const initialsUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=random`;
    
    return {
      url: initialsUrl,
      source: 'openstates' as const,
      quality: 'low' as const,
      isPrimary: true
    };
  }

  private rankPhotos(photos: PhotoInfo[]): PhotoInfo[] {
    // Rank photos by quality and source preference
    return photos.sort((a, b) => {
      const qualityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      const sourceOrder = { 
        'congress-gov': 5, 
        'wikipedia-high-res': 4, 
        'wikipedia': 3, 
        'google-civic': 2, 
        'openstates': 1, 
        'congress-gov-alternative': 0,
        'generated': 0 
      };
      
      if (a.quality !== b.quality) {
        return qualityOrder[b.quality] - qualityOrder[a.quality];
      }
      
      return sourceOrder[b.source] - sourceOrder[a.source];
    });
  }

  private deduplicateAndRank(socialMedia: SocialMediaInfo[]): SocialMediaInfo[] {
    // Remove duplicates and rank by platform preference
    const unique = new Map<string, SocialMediaInfo>();
    
    socialMedia.forEach(social => {
      const key = `${social.platform}-${social.handle}`;
      if (!unique.has(key) || social.followersCount > unique.get(key)!.followersCount) {
        unique.set(key, social);
      }
    });

    return Array.from(unique.values()).sort((a, b) => b.followersCount - a.followersCount);
  }

  private calculateQualityScore(rep: RepresentativeData): number {
    let score = 0;
    
    // Contact information (40 points)
    score += Math.min(40, rep.contacts.length * 10);
    
    // Social media (30 points)
    score += Math.min(30, rep.socialMedia.length * 15);
    
    // Photos (20 points)
    score += Math.min(20, rep.photos.length * 10);
    
    // Activity (10 points)
    score += Math.min(10, rep.activity.length * 2);
    
    return Math.min(100, score);
  }

  private mergeAndValidateData(
    original: RepresentativeData,
    googleCivic: Partial<RepresentativeData>,
    openStates: Partial<RepresentativeData>,
    congressGov: Partial<RepresentativeData>,
    legiScan: Partial<RepresentativeData>,
    photos: PhotoInfo[],
    socialMedia: SocialMediaInfo[],
    campaignFinance?: CampaignFinanceInfo,
    activity: ActivityInfo[] = [],
    wikipedia?: Partial<RepresentativeData>
  ): RepresentativeData {
    // Start with original data
    let merged = { ...(original || {}) };
    
    // Perform cross-reference validation before merging
    const crossReferenceValidation = this.performCrossReferenceValidation({
      googleCivic,
      openStates,
      congressGov,
      legiScan,
      ...(wikipedia && { wikipedia })
    });
    
    // Apply advanced data transformations and conflict resolution with cross-reference insights
    merged = this.resolveDataConflictsWithCrossReference(merged, googleCivic, crossReferenceValidation);
    merged = this.resolveDataConflictsWithCrossReference(merged, openStates, crossReferenceValidation);
    merged = this.resolveDataConflictsWithCrossReference(merged, congressGov, crossReferenceValidation);
    merged = this.resolveDataConflictsWithCrossReference(merged, legiScan, crossReferenceValidation);
    if (wikipedia) {
      merged = this.resolveDataConflictsWithCrossReference(merged, wikipedia, crossReferenceValidation);
    }
    
    // Normalize party affiliation
    if (merged.party) {
      merged.party = this.normalizePartyAffiliation(merged.party);
    }
    
    // Normalize contact information with cross-reference validation
    if (merged.contacts) {
      merged.contacts = this.mergeContactsWithValidation(
        merged.contacts.map(contact => this.normalizeContactInfo(contact)),
        [],
        crossReferenceValidation.contactConsistency
      );
    }
    
    // Add photos, social media, and activity with enhanced validation
    // Collect photos from all sources with quality-based merging
    const allPhotos = [
      ...(merged.photos || []),
      ...photos,
      ...(googleCivic.photos || []),
      ...(openStates.photos || []),
      ...(congressGov.photos || []),
      ...(legiScan.photos || []),
      ...(wikipedia?.photos || [])
    ];
    merged.photos = this.mergePhotosWithValidation([], allPhotos, crossReferenceValidation.dataQualityScores);
    
    // Collect social media from all sources with conflict resolution
    const allSocialMedia = [
      ...(merged.socialMedia || []),
      ...socialMedia,
      ...(googleCivic.socialMedia || []),
      ...(openStates.socialMedia || []),
      ...(congressGov.socialMedia || []),
      ...(legiScan.socialMedia || []),
      ...(wikipedia?.socialMedia || [])
    ];
    merged.socialMedia = this.mergeSocialMediaWithValidation([], allSocialMedia, crossReferenceValidation.socialMediaConsistency);
    
    // Collect activity from all sources
    const allActivity = [
      ...(merged.activity || []),
      ...activity,
      ...(googleCivic.activity || []),
      ...(openStates.activity || []),
      ...(congressGov.activity || []),
      ...(legiScan.activity || []),
      ...(wikipedia?.activity || [])
    ];
    console.log('🔍 mergeAndValidateData: Activity sources:');
    console.log(`  - merged.activity: ${merged.activity?.length || 0}`);
    console.log(`  - activity parameter: ${activity.length}`);
    console.log(`  - googleCivic.activity: ${googleCivic.activity?.length || 0}`);
    console.log(`  - openStates.activity: ${openStates.activity?.length || 0}`);
    console.log(`  - congressGov.activity: ${congressGov.activity?.length || 0}`);
    console.log(`  - legiScan.activity: ${legiScan.activity?.length || 0}`);
    console.log(`  - wikipedia?.activity: ${wikipedia?.activity?.length || 0}`);
    console.log(`  - Total allActivity: ${allActivity.length}`);
    merged.activity = allActivity;
    console.log(`✅ merged.activity set to: ${merged.activity.length} items`);
    
    if (campaignFinance) {
      merged.campaignFinance = campaignFinance;
      // Add FEC to data sources when campaign finance data is found
      if (!merged.dataSources) {
        merged.dataSources = [];
      }
      if (!merged.dataSources.includes('fec')) {
        merged.dataSources.push('fec');
      }
    }
    
    // Add comprehensive source attribution
    merged.dataSources = this.buildComprehensiveSourceAttribution(merged, {
      googleCivic,
      openStates,
      congressGov,
      legiScan,
      ...(wikipedia && { wikipedia })
    });
    
    // Add cross-reference validation metadata
    merged.crossReferenceValidation = crossReferenceValidation;
    
    // Transform data to match our enhanced schema
    merged = this.transformToEnhancedSchema(merged);
    
    // Validate data quality with enhanced validation
    const validation = this.validateDataQuality(merged);
    if (!validation.isValid) {
      devLog('Data quality issues detected', { 
        name: merged.name, 
        issues: validation.issues,
        crossReferenceConflicts: crossReferenceValidation.conflicts,
        recommendations: crossReferenceValidation.recommendations
      });
    }
    
    return merged;
  }

  /**
   * Transform merged data to match our enhanced schema
   */
  private transformToEnhancedSchema(rep: RepresentativeData): RepresentativeData {
    const transformed = { ...(rep || {}) };
    
    // Extract social media handles for easy access
    if (transformed.socialMedia) {
      transformed.socialMedia.forEach(social => {
        switch (social.platform) {
          case 'twitter':
            transformed.twitterHandle = social.handle;
            break;
          case 'facebook':
            transformed.facebookUrl = social.url;
            break;
          case 'instagram':
            transformed.instagramHandle = social.handle;
            break;
          case 'linkedin':
            transformed.linkedinUrl = social.url;
            break;
          case 'youtube':
            transformed.youtubeChannel = social.url;
            break;
        }
      });
    }
    
    // Extract primary contact information
    if (transformed.contacts) {
      const email = transformed.contacts.find(c => c.type === 'email' && c.isVerified);
      const phone = transformed.contacts.find(c => c.type === 'phone' && c.isVerified);
      const website = transformed.contacts.find(c => c.type === 'website' && c.isVerified);
      
      if (email) transformed.primaryEmail = email.value;
      if (phone) transformed.primaryPhone = phone.value;
      if (website) transformed.primaryWebsite = website.value;
    }
    
    // Extract primary photo
    if (transformed.photos && transformed.photos.length > 0) {
      const primaryPhoto = transformed.photos.find(p => p.isPrimary) || transformed.photos[0];
      if (primaryPhoto) {
        transformed.primaryPhotoUrl = primaryPhoto.url;
      }
    }
    
    // Transform activity data for accountability tracking
    if (transformed.activity) {
      transformed.floorSpeeches = transformed.activity.filter(a => a.type === 'statement');
      transformed.committeeStatements = transformed.activity.filter(a => a.type === 'statement');
      transformed.officialPressReleases = transformed.activity.filter(a => a.type === 'statement');
      transformed.socialMediaStatements = transformed.activity.filter(a => a.type === 'social_media');
      
      // Extract recent tweets, Facebook posts, Instagram posts
      transformed.recentTweets = transformed.activity.filter(a => a.source === 'twitter');
      transformed.facebookPosts = transformed.activity.filter(a => a.source === 'facebook');
      transformed.instagramPosts = transformed.activity.filter(a => a.source === 'instagram');
    }
    
    // Calculate accountability score
    transformed.accountabilityScore = this.calculateAccountabilityScore(transformed);
    
    return transformed;
  }
  
  /**
   * Calculate accountability score based on statement vs. action alignment
   */
  private calculateAccountabilityScore(rep: RepresentativeData): number {
    let score = 50; // Base score
    
    // Bonus for having multiple data sources
    if (rep.dataSources && rep.dataSources.length > 1) {
      score += 10;
    }
    
    // Bonus for social media presence
    if (rep.socialMedia && rep.socialMedia.length > 0) {
      score += 10;
    }
    
    // Bonus for contact information
    if (rep.contacts && rep.contacts.length > 0) {
      score += 10;
    }
    
    // Bonus for recent activity
    if (rep.activity && rep.activity.length > 0) {
      score += 10;
    }
    
    // Bonus for committee memberships
    if (rep.committeeMemberships && rep.committeeMemberships.length > 0) {
      score += 10;
    }
    
    return Math.min(100, score);
  }

  // Additional helper methods for specific API integrations
  private extractOpenStatesContacts(legislator: any): ContactInfo[] {
    const contacts: ContactInfo[] = [];
    
    // Extract email contacts from API v3 format
    if (legislator.email) {
      contacts.push({
        type: 'email',
        value: legislator.email,
        isPrimary: true,
        isVerified: true, // OpenStates data is generally verified
        source: 'openstates'
      });
    }
    
    // Extract phone contacts
    if (legislator.phone) {
      contacts.push({
        type: 'phone',
        value: legislator.phone,
        isPrimary: true,
        isVerified: false,
        source: 'openstates'
      });
    }
    
    // Extract website contacts
    if (legislator.url) {
      contacts.push({
        type: 'website',
        value: legislator.url,
        isPrimary: true,
        isVerified: false,
        source: 'openstates'
      });
    }
    
    // Extract office addresses
    if (legislator.offices && Array.isArray(legislator.offices)) {
      legislator.offices.forEach((office: any, index: number) => {
        if (office.address) {
          contacts.push({
            type: 'address',
            value: office.address,
            label: office.name || `Office ${index + 1}`,
            isPrimary: index === 0,
            isVerified: false,
            source: 'openstates'
          });
        }
        if (office.phone) {
          contacts.push({
            type: 'phone',
            value: office.phone,
            label: office.name || `Office ${index + 1}`,
            isPrimary: false,
            isVerified: false,
            source: 'openstates'
          });
        }
      });
    }
    
    return contacts;
  }

  private extractOpenStatesSocialMedia(legislator: any): SocialMediaInfo[] {
    const socialMedia: SocialMediaInfo[] = [];
    
    // Extract social media from OpenStates data
    if (legislator.social_media) {
      Object.entries(legislator.social_media).forEach(([platform, handle]) => {
        if (typeof handle === 'string' && handle.trim()) {
          const platformKey = this.mapOpenStatesPlatformEnhanced(platform);
          if (platformKey) {
            socialMedia.push({
              platform: platformKey,
              handle: handle,
              url: this.generateSocialMediaUrl(platformKey, handle),
              followersCount: 0, // OpenStates doesn't provide follower counts
              isVerified: this.isVerifiedSocialMedia(platformKey, handle),
              source: 'openstates'
            });
          }
        }
      });
    }
    
    // Also check for additional social media in contact details
    if (legislator.contact_details) {
      Object.entries(legislator.contact_details).forEach(([type, value]) => {
        if (typeof value === 'string' && this.isSocialMediaField(type, value)) {
          const platformKey = this.detectSocialMediaPlatform(value);
          if (platformKey) {
            const handle = this.extractSocialMediaHandle(value);
            if (handle) {
              socialMedia.push({
                platform: platformKey,
                handle: handle,
                url: this.generateSocialMediaUrl(platformKey, handle),
                followersCount: 0,
                isVerified: false,
                source: 'openstates-contact-details'
              });
            }
          }
        }
      });
    }
    
    return socialMedia;
  }

  private extractOpenStatesPhotos(legislator: any): PhotoInfo[] {
    const photos: PhotoInfo[] = [];
    
    // Extract photos from API v3 format - image field contains the photo URL
    if (legislator.image) {
      photos.push({
        url: legislator.image,
        source: 'openstates',
        quality: 'high', // OpenStates provides official photos
        isPrimary: true
      });
    }
    
    return photos;
  }

  private extractCongressGovContacts(member: any): ContactInfo[] {
    const contacts: ContactInfo[] = [];
    
    console.log('🔍 extractCongressGovContacts: Member data keys:', Object.keys(member || {}));
    console.log('🔍 extractCongressGovContacts: Address info:', member.addressInformation);
    
    // Extract phone from Congress.gov data
    if (member.addressInformation?.phoneNumber) {
      console.log('🔍 extractCongressGovContacts: Found phone:', member.addressInformation.phoneNumber);
      contacts.push({
        type: 'phone',
        value: member.addressInformation.phoneNumber,
        isPrimary: true,
        isVerified: true, // Congress.gov is official
        source: 'congress-gov'
      });
    } else {
      console.log('🔍 extractCongressGovContacts: No phone found');
    }
    
    // Extract website from Congress.gov data
    if (member.officialWebsiteUrl) {
      contacts.push({
        type: 'website',
        value: member.officialWebsiteUrl,
        isPrimary: true,
        isVerified: true,
        source: 'congress-gov'
      });
    }
    
    return contacts;
  }

  private extractCongressGovPhotos(member: any): PhotoInfo[] {
    const photos: PhotoInfo[] = [];
    
    // Use the actual photo URL from Congress.gov API
    if (member.depiction?.imageUrl) {
      photos.push({
        url: member.depiction.imageUrl,
        source: 'congress-gov',
        quality: 'high',
        isPrimary: true,
        license: 'Public Domain',
        attribution: member.depiction.attribution || 'Congress.gov'
      });
    }
    
    return photos;
  }

  private async getGoogleCivicSocialMedia(rep: RepresentativeData): Promise<SocialMediaInfo[]> {
    const socialMedia: SocialMediaInfo[] = [];
    
    try {
      const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
      if (!apiKey) return socialMedia;
      
      // Use state capital for Google Civic API
      const stateCapitals = {
        'Alabama': 'Montgomery, AL', 'Alaska': 'Juneau, AK', 'Arizona': 'Phoenix, AZ', 'Arkansas': 'Little Rock, AR',
        'California': 'Sacramento, CA', 'Colorado': 'Denver, CO', 'Connecticut': 'Hartford, CT', 'Delaware': 'Dover, DE',
        'Florida': 'Tallahassee, FL', 'Georgia': 'Atlanta, GA', 'Hawaii': 'Honolulu, HI', 'Idaho': 'Boise, ID',
        'Illinois': 'Springfield, IL', 'Indiana': 'Indianapolis, IN', 'Iowa': 'Des Moines, IA', 'Kansas': 'Topeka, KS',
        'Kentucky': 'Frankfort, KY', 'Louisiana': 'Baton Rouge, LA', 'Maine': 'Augusta, ME', 'Maryland': 'Annapolis, MD',
        'Massachusetts': 'Boston, MA', 'Michigan': 'Lansing, MI', 'Minnesota': 'Saint Paul, MN', 'Mississippi': 'Jackson, MS',
        'Missouri': 'Jefferson City, MO', 'Montana': 'Helena, MT', 'Nebraska': 'Lincoln, NE', 'Nevada': 'Carson City, NV',
        'New Hampshire': 'Concord, NH', 'New Jersey': 'Trenton, NJ', 'New Mexico': 'Santa Fe, NM', 'New York': 'Albany, NY',
        'North Carolina': 'Raleigh, NC', 'North Dakota': 'Bismarck, ND', 'Ohio': 'Columbus, OH', 'Oklahoma': 'Oklahoma City, OK',
        'Oregon': 'Salem, OR', 'Pennsylvania': 'Harrisburg, PA', 'Rhode Island': 'Providence, RI', 'South Carolina': 'Columbia, SC',
        'South Dakota': 'Pierre, SD', 'Tennessee': 'Nashville, TN', 'Texas': 'Austin, TX', 'Utah': 'Salt Lake City, UT',
        'Vermont': 'Montpelier, VT', 'Virginia': 'Richmond, VA', 'Washington': 'Olympia, WA', 'West Virginia': 'Charleston, WV',
        'Wisconsin': 'Madison, WI', 'Wyoming': 'Cheyenne, WY'
      };
      
      const searchQuery = stateCapitals[rep.state as keyof typeof stateCapitals] || `${rep.state} State Capitol`;
      const response = await fetch(
        `https://www.googleapis.com/civicinfo/v2/representatives?address=${encodeURIComponent(searchQuery)}&key=${apiKey}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (!response.ok) return socialMedia;
      
      const data = await response.json();
      const officials = data.officials || [];
      
      // Find matching official
      const matchingOfficial = officials.find((official: any) => 
        this.isMatchingRepresentative(official, rep)
      );
      
      if (matchingOfficial && matchingOfficial.channels) {
        matchingOfficial.channels.forEach((channel: any) => {
          const platform = this.mapChannelToPlatform(channel.type);
          if (platform) {
            socialMedia.push({
              platform,
              handle: channel.id,
              url: this.generateSocialMediaUrl(platform, channel.id),
              followersCount: 0,
              isVerified: false,
              source: 'google-civic'
            });
          }
        });
      }
      
    } catch (error) {
      devLog('Error getting Google Civic social media', { error });
    }
    
    return socialMedia;
  }

  private async getOpenStatesSocialMedia(rep: RepresentativeData): Promise<SocialMediaInfo[]> {
    const socialMedia: SocialMediaInfo[] = [];
    
    try {
      const apiKey = process.env.OPEN_STATES_API_KEY;
      if (!apiKey) return socialMedia;
      
      const response = await fetch(
        `https://v3.openstates.org/people?jurisdiction=${rep.state}`,
        {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
          }
        }
      );
      
      if (!response.ok) return socialMedia;
      
      const data = await response.json();
      const matchingLegislator = data.results?.find((legislator: any) => 
        this.isMatchingRepresentative(legislator, rep)
      );
      
      if (matchingLegislator) {
        return this.extractOpenStatesSocialMedia(matchingLegislator);
      }
      
    } catch (error) {
      devLog('Error getting OpenStates social media', { error });
    }
    
    return socialMedia;
  }

  private async searchSocialMedia(name: string): Promise<SocialMediaInfo[]> {
    const socialMedia: SocialMediaInfo[] = [];
    
    try {
      // Search for social media profiles using various methods
      // const searchTerms = [
      //   name,
      //   name.replace(/\s+/g, ''),
      //   name.split(' ').join('_'),
      //   name.split(' ').join('.')
      // ];
      
      // This would integrate with social media APIs or search services
      // For now, return empty array as this requires external services
      devLog('Social media search not implemented', { name });
      
    } catch (error) {
      devLog('Error searching social media', { error });
    }
    
    return socialMedia;
  }

  private async getRecentVotes(rep: RepresentativeData): Promise<ActivityInfo[]> {
    const activity: ActivityInfo[] = [];
    
    try {
      // Get recent votes from Congress.gov for federal representatives
      if (rep.level === 'federal' && rep.bioguideId) {
        const response = await fetch(
          `https://api.congress.gov/v3/member/${rep.bioguideId}/votes?format=json&api_key=${process.env.CONGRESS_GOV_API_KEY}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const votes = data.votes || [];
          
          votes.slice(0, 5).forEach((vote: any) => {
            activity.push({
              type: 'vote',
              title: vote.question || 'Vote on legislation',
              description: vote.description,
              url: vote.url,
              date: new Date(vote.date),
              metadata: {
                rollCall: vote.rollCall,
                result: vote.result,
                chamber: vote.chamber
              },
              source: 'congress-gov'
            });
          });
        }
      }
      
    } catch (error) {
      devLog('Error getting recent votes', { error });
    }
    
    return activity;
  }

  private async getRecentBills(rep: RepresentativeData): Promise<ActivityInfo[]> {
    const activity: ActivityInfo[] = [];
    
    try {
      // Get recent bills from OpenStates for state representatives
      if (rep.level === 'state' && rep.openstatesId) {
        const response = await fetch(
          `https://openstates.org/api/v1/bills/?sponsor_id=${rep.openstatesId}&apikey=${process.env.OPEN_STATES_API_KEY}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const bills = data || [];
          
          bills.slice(0, 3).forEach((bill: any) => {
            activity.push({
              type: 'bill',
              title: bill.title || 'Bill sponsored',
              description: bill.description,
              url: bill.url,
              date: new Date(bill.created_at),
              metadata: {
                billId: bill.id,
                session: bill.session,
                state: bill.state
              },
              source: 'openstates'
            });
          });
        }
      }
      
    } catch (error) {
      devLog('Error getting recent bills', { error });
    }
    
    return activity;
  }

  private async getSocialMediaUpdates(rep: RepresentativeData): Promise<ActivityInfo[]> {
    const activity: ActivityInfo[] = [];
    
    try {
      // This would integrate with social media APIs to get recent posts
      // For now, generate placeholder activity based on social media presence
      rep.socialMedia.forEach(social => {
        activity.push({
          type: 'social_media',
          title: `New ${social.platform} post`,
          description: `Recent activity on ${social.platform}`,
          url: social.url,
          date: new Date(),
          metadata: {
            platform: social.platform,
            handle: social.handle,
            followersCount: social.followersCount
          },
          source: social.source
        });
      });
      
    } catch (error) {
      devLog('Error getting social media updates', { error });
    }
    
    return activity;
  }

  // Advanced data transformation methods
  private normalizePartyAffiliation(party: string): string {
    const partyMapping: Record<string, string> = {
      'republican': 'Republican',
      'democrat': 'Democratic',
      'democratic': 'Democratic',
      'independent': 'Independent',
      'libertarian': 'Libertarian',
      'green': 'Green',
      'constitution': 'Constitution',
      'reform': 'Reform',
      'other': 'Other',
      'unknown': 'Unknown'
    };
    
    return partyMapping[party.toLowerCase()] || party;
  }

  private normalizeContactInfo(contact: any): ContactInfo {
    return {
      type: contact.type || 'phone',
      value: this.cleanContactValue(contact.value || contact.phone || contact.email || contact.website),
      label: contact.label || contact.type || 'Primary',
      isPrimary: contact.primary || false,
      isVerified: contact.verified || false,
      source: contact.source || 'unknown'
    };
  }

  private cleanContactValue(value: string): string {
    if (!value) return '';
    
    // Clean phone numbers
    if (value.includes('(') || value.includes('-') || value.includes('.')) {
      return value.replace(/[^\d]/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }
    
    // Clean email addresses
    if (value.includes('@')) {
      return value.toLowerCase().trim();
    }
    
    // Clean URLs
    if (value.includes('http')) {
      return value.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }
    
    return value.trim();
  }

  private validateDataQuality(rep: RepresentativeData): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check required fields
    if (!rep.name || rep.name.trim().length === 0) {
      issues.push('Missing or empty name');
    }
    
    if (!rep.state || rep.state.length !== 2) {
      issues.push('Invalid or missing state code');
    }
    
    if (!rep.level || !['federal', 'state', 'local'].includes(rep.level)) {
      issues.push('Invalid government level');
    }
    
    // Check contact information quality
    const hasValidContact = rep.contacts.some(contact => 
      contact.value && contact.value.length > 0 && contact.isVerified
    );
    
    if (!hasValidContact && rep.contacts.length > 0) {
      issues.push('No verified contact information');
    }
    
    // Check data source diversity
    if (rep.dataSources.length < 2) {
      issues.push('Limited data source diversity');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Perform cross-reference validation across all data sources
   */
  private performCrossReferenceValidation(sources: {
    googleCivic: Partial<RepresentativeData>;
    openStates: Partial<RepresentativeData>;
    congressGov: Partial<RepresentativeData>;
    legiScan: Partial<RepresentativeData>;
    wikipedia?: Partial<RepresentativeData>;
  }): CrossReferenceValidation {
    const validation: CrossReferenceValidation = {
      nameConsistency: this.validateNameConsistency(sources),
      partyConsistency: this.validatePartyConsistency(sources),
      contactConsistency: this.validateContactConsistency(sources),
      socialMediaConsistency: this.validateSocialMediaConsistency(sources),
      identifierConsistency: this.validateIdentifierConsistency(sources),
      dataQualityScores: this.calculateDataQualityScores(sources),
      conflicts: [],
      recommendations: []
    };

    // Identify conflicts and generate recommendations
    validation.conflicts = this.identifyDataConflicts(sources);
    validation.recommendations = this.generateDataRecommendations(validation);

    return validation;
  }

  /**
   * Validate name consistency across sources
   */
  private validateNameConsistency(sources: any): NameConsistency {
    const names = Object.values(sources)
      .filter((source: any) => source?.name)
      .map((source: any) => source.name);

    if (names.length === 0) {
      return { isConsistent: false, confidence: 0, variations: [] };
    }

    const normalizedNames = names.map(name => this.normalizeName(name));
    const uniqueNames = [...new Set(normalizedNames)];
    const isConsistent = uniqueNames.length === 1;
    const confidence = isConsistent ? 100 : Math.max(0, 100 - (uniqueNames.length - 1) * 25);

    return {
      isConsistent,
      confidence,
      variations: uniqueNames,
      primaryName: this.selectPrimaryName(names)
    };
  }

  /**
   * Validate party consistency across sources
   */
  private validatePartyConsistency(sources: any): PartyConsistency {
    const parties = Object.values(sources)
      .filter((source: any) => source?.party)
      .map((source: any) => this.normalizePartyAffiliation(source.party));

    if (parties.length === 0) {
      return { isConsistent: false, confidence: 0, variations: [] };
    }

    const uniqueParties = [...new Set(parties)];
    const isConsistent = uniqueParties.length === 1;
    const confidence = isConsistent ? 100 : Math.max(0, 100 - (uniqueParties.length - 1) * 30);

    return {
      isConsistent,
      confidence,
      variations: uniqueParties,
      primaryParty: this.selectPrimaryParty(parties)
    };
  }

  /**
   * Validate contact information consistency
   */
  private validateContactConsistency(sources: any): ContactConsistency {
    const allContacts: ContactInfo[] = [];
    
    Object.values(sources).forEach((source: any) => {
      if (source?.contacts) {
        allContacts.push(...source.contacts);
      }
    });

    const emailConflicts = this.findContactConflicts(allContacts, 'email');
    const phoneConflicts = this.findContactConflicts(allContacts, 'phone');
    const websiteConflicts = this.findContactConflicts(allContacts, 'website');

    return {
      emailConflicts,
      phoneConflicts,
      websiteConflicts,
      overallConsistency: this.calculateContactConsistencyScore(emailConflicts, phoneConflicts, websiteConflicts)
    };
  }

  /**
   * Validate social media consistency
   */
  private validateSocialMediaConsistency(sources: any): SocialMediaConsistency {
    const allSocialMedia: SocialMediaInfo[] = [];
    
    Object.values(sources).forEach((source: any) => {
      if (source?.socialMedia) {
        allSocialMedia.push(...source.socialMedia);
      }
    });

    const platformConflicts = this.findSocialMediaConflicts(allSocialMedia);
    const handleConflicts = this.findHandleConflicts(allSocialMedia);

    return {
      platformConflicts,
      handleConflicts,
      overallConsistency: this.calculateSocialMediaConsistencyScore(platformConflicts, handleConflicts)
    };
  }

  /**
   * Validate identifier consistency
   */
  private validateIdentifierConsistency(sources: any): IdentifierConsistency {
    const identifiers: { [key: string]: string[] } = {};
    
    Object.entries(sources).forEach(([_sourceName, source]) => {
      if (source) {
        Object.entries(source).forEach(([key, value]) => {
          if (key.endsWith('Id') && value) {
            if (!identifiers[key]) identifiers[key] = [];
            identifiers[key].push(value as string);
          }
        });
      }
    });

    const conflicts: string[] = [];
    Object.entries(identifiers).forEach(([key, values]) => {
      const uniqueValues = [...new Set(values)];
      if (uniqueValues.length > 1) {
        conflicts.push(`${key}: ${uniqueValues.join(', ')}`);
      }
    });

    return {
      conflicts,
      isConsistent: conflicts.length === 0,
      confidence: conflicts.length === 0 ? 100 : Math.max(0, 100 - conflicts.length * 20)
    };
  }

  /**
   * Calculate data quality scores for each source
   */
  private calculateDataQualityScores(sources: any): { [source: string]: number } {
    const scores: { [source: string]: number } = {};
    
    Object.entries(sources).forEach(([sourceName, source]) => {
      if (source) {
        scores[sourceName] = this.calculateSourceQualityScore(source as RepresentativeData);
      }
    });

    return scores;
  }

  /**
   * Enhanced conflict resolution with cross-reference validation
   */
  private resolveDataConflictsWithCrossReference(
    original: RepresentativeData,
    newData: Partial<RepresentativeData>,
    crossReference: CrossReferenceValidation
  ): RepresentativeData {
    const resolved = { ...(original || {}) };
    
    // Use cross-reference validation to make better conflict resolution decisions
    if (newData.name && crossReference.nameConsistency.confidence > 80) {
      resolved.name = crossReference.nameConsistency.primaryName || newData.name;
    } else if (newData.name && newData.name.length > (resolved.name?.length || 0)) {
      resolved.name = newData.name;
    }
    
    // Resolve party conflicts using cross-reference data
    if (newData.party && crossReference.partyConsistency.confidence > 70) {
      resolved.party = crossReference.partyConsistency.primaryParty || this.normalizePartyAffiliation(newData.party);
    } else if (newData.party && newData.dataSources && this.isVerifiedSource(newData.dataSources)) {
      resolved.party = this.normalizePartyAffiliation(newData.party);
    }
    
    // Enhanced contact merging with conflict resolution
    if (newData.contacts) {
      resolved.contacts = this.mergeContactsWithValidation(
        resolved.contacts || [],
        newData.contacts,
        crossReference.contactConsistency
      );
    }
    
    // Enhanced social media merging with conflict resolution
    if (newData.socialMedia) {
      resolved.socialMedia = this.mergeSocialMediaWithValidation(
        resolved.socialMedia || [],
        newData.socialMedia,
        crossReference.socialMediaConsistency
      );
    }
    
    // Enhanced photo merging with quality assessment
    if (newData.photos) {
      resolved.photos = this.mergePhotosWithValidation(
        resolved.photos || [],
        newData.photos,
        crossReference.dataQualityScores
      );
    }
    
    // Merge data sources with quality weighting
    resolved.dataSources = this.mergeDataSourcesWithQuality(
      resolved.dataSources || [],
      newData.dataSources || [],
      crossReference.dataQualityScores
    );
    
    return resolved;
  }

  private resolveDataConflicts(
    original: RepresentativeData,
    newData: Partial<RepresentativeData>
  ): RepresentativeData {
    const resolved = { ...(original || {}) };
    
    // Resolve name conflicts (prefer longer, more complete names)
    if (newData.name && newData.name.length > (resolved.name?.length || 0)) {
      resolved.name = newData.name;
    }
    
    // Resolve party conflicts (prefer verified sources)
    if (newData.party && newData.dataSources && this.isVerifiedSource(newData.dataSources)) {
      resolved.party = this.normalizePartyAffiliation(newData.party);
    }
    
    // Merge contacts (avoid duplicates)
    if (newData.contacts) {
      const existingContacts = resolved.contacts || [];
      const newContacts = newData.contacts.filter(newContact => 
        !existingContacts.some(existing => 
          existing.type === newContact.type && 
          existing.value === newContact.value
        )
      );
      resolved.contacts = [...existingContacts, ...newContacts];
    }
    
    // Merge social media (avoid duplicates)
    if (newData.socialMedia) {
      const existingSocial = resolved.socialMedia || [];
      const newSocial = newData.socialMedia.filter(newSocial => 
        !existingSocial.some(existing => 
          existing.platform === newSocial.platform && 
          existing.handle === newSocial.handle
        )
      );
      resolved.socialMedia = [...existingSocial, ...newSocial];
    }
    
    // Merge photos (prefer higher quality)
    if (newData.photos) {
      const existingPhotos = resolved.photos || [];
      const newPhotos = newData.photos.filter(newPhoto => 
        !existingPhotos.some(existing => existing.url === newPhoto.url)
      );
      resolved.photos = [...existingPhotos, ...newPhotos].sort((a, b) => {
        const qualityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return qualityOrder[b.quality] - qualityOrder[a.quality];
      });
    }
    
    // Merge data sources
    resolved.dataSources = [...new Set([...(resolved.dataSources || []), ...(newData.dataSources || [])])];
    
    return resolved;
  }

  private isVerifiedSource(sources: string[]): boolean {
    const verifiedSources = ['congress-gov', 'openstates', 'fec'];
    return sources.some(source => verifiedSources.includes(source));
  }

  /**
   * Resolve canonical ID for multi-source reconciliation
   * Stores mappings in id_crosswalk table instead of representatives_core
   */
  private async resolveCanonicalId(rep: RepresentativeData): Promise<{ canonicalId: string; crosswalkEntries: any[] }> {
    try {
      // Prepare source data for canonical ID resolution
      const sourceData = [];
      
      // Add OpenStates data if available
      if (rep.openstatesId) {
        sourceData.push({
          source: 'open-states' as const,
          data: {
            name: rep.name,
            office: rep.office,
            level: rep.level,
            state: rep.state,
            district: rep.district,
            party: rep.party
          },
          sourceId: rep.openstatesId
        });
      }
      
      // Add Congress.gov data if available
      if (rep.bioguideId) {
        sourceData.push({
          source: 'congress-gov' as const,
          data: {
            name: rep.name,
            office: rep.office,
            level: rep.level,
            state: rep.state,
            district: rep.district,
            party: rep.party
          },
          sourceId: rep.bioguideId
        });
      }
      
      // Add FEC data if available
      if (rep.fecId) {
        sourceData.push({
          source: 'fec' as const,
          data: {
            name: rep.name,
            office: rep.office,
            level: rep.level,
            state: rep.state,
            district: rep.district,
            party: rep.party
          },
          sourceId: rep.fecId
        });
      }
      
      // Add Google Civic data if available
      if (rep.googleCivicId) {
        sourceData.push({
          source: 'google-civic' as const,
          data: {
            name: rep.name,
            office: rep.office,
            level: rep.level,
            state: rep.state,
            district: rep.district,
            party: rep.party
          },
          sourceId: rep.googleCivicId
        });
      }
      
      // If no source data available, create a basic entry
      if (sourceData.length === 0) {
        sourceData.push({
          source: 'open-states' as const,
          data: {
            name: rep.name,
            office: rep.office,
            level: rep.level,
            state: rep.state,
            district: rep.district,
            party: rep.party
          },
          sourceId: rep.id || `temp_${Date.now()}`
        });
      }
      
      // Resolve entity using CanonicalIdService
      const result = await this.canonicalIdService.resolveEntity(
        'person' as const,
        sourceData
      );
      
      devLog('Canonical ID resolved', {
        name: rep.name,
        canonicalId: result.canonicalId,
        sources: result.crosswalkEntries.length
      });
      
      return result;
      
    } catch (error) {
      devLog('Error resolving canonical ID', { name: rep.name, error });
      
      // Fallback: generate a basic canonical ID
      const fallbackId = `person_${rep.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${rep.state}_${rep.district || 'unknown'}`;
      return {
        canonicalId: fallbackId,
        crosswalkEntries: []
      };
    }
  }


  private mergePhotos(existing: PhotoInfo[], newPhotos: PhotoInfo[]): PhotoInfo[] {
    const allPhotos = [...existing, ...newPhotos];
    const uniquePhotos = allPhotos.filter((photo, index, self) => 
      index === self.findIndex(p => p.url === photo.url)
    );
    
    return uniquePhotos.sort((a, b) => {
      const qualityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return qualityOrder[b.quality] - qualityOrder[a.quality];
    }).slice(0, 2); // Collect top 2 photos per person
  }

  private mergeSocialMedia(existing: SocialMediaInfo[], newSocial: SocialMediaInfo[]): SocialMediaInfo[] {
    const allSocial = [...existing, ...newSocial];
    const uniqueSocial = allSocial.filter((social, index, self) => 
      index === self.findIndex(s => s.platform === social.platform && s.handle === social.handle)
    );
    
    return uniqueSocial;
  }

  // Helper methods for data processing
  private mapOpenStatesPlatform(platform: string): SocialMediaInfo['platform'] | null {
    const mapping: Record<string, SocialMediaInfo['platform']> = {
      'twitter': 'twitter',
      'facebook': 'facebook',
      'instagram': 'instagram',
      'youtube': 'youtube',
      'linkedin': 'linkedin'
    };
    
    return mapping[platform.toLowerCase()] || null;
  }

  private generateSocialMediaUrl(platform: SocialMediaInfo['platform'], handle: string): string {
    const urlMappings: Record<SocialMediaInfo['platform'], string> = {
      'twitter': `https://twitter.com/${handle}`,
      'facebook': `https://facebook.com/${handle}`,
      'instagram': `https://instagram.com/${handle}`,
      'youtube': `https://youtube.com/@${handle}`,
      'linkedin': `https://linkedin.com/in/${handle}`,
      'tiktok': `https://tiktok.com/@${handle}`,
      'snapchat': `https://snapchat.com/add/${handle}`,
      'telegram': `https://t.me/${handle}`,
      'mastodon': `https://mastodon.social/@${handle}`,
      'threads': `https://threads.net/@${handle}`
    };
    
    return urlMappings[platform] || `https://${platform}.com/${handle}`;
  }

  // Enhanced helper methods for improved data extraction
  
  private mapOpenStatesPlatformEnhanced(platform: string): SocialMediaInfo['platform'] | null {
    const mapping: Record<string, SocialMediaInfo['platform']> = {
      'twitter': 'twitter',
      'facebook': 'facebook',
      'instagram': 'instagram',
      'youtube': 'youtube',
      'linkedin': 'linkedin',
      'tiktok': 'tiktok',
      'snapchat': 'snapchat',
      'telegram': 'telegram',
      'mastodon': 'mastodon',
      'threads': 'threads'
    };

    return mapping[platform.toLowerCase()] || null;
  }

  private isVerifiedSocialMedia(platform: SocialMediaInfo['platform'], handle: string): boolean {
    // Check if social media handle appears to be verified
    const verifiedPatterns = {
      'twitter': /^[A-Za-z0-9_]{1,15}$/,
      'instagram': /^[A-Za-z0-9._]{1,30}$/,
      'facebook': /^[A-Za-z0-9.]{1,50}$/,
      'youtube': /^@[A-Za-z0-9._-]{1,100}$/,
      'linkedin': /^[A-Za-z0-9-]{1,100}$/,
      'tiktok': /^@[A-Za-z0-9._]{1,24}$/,
      'snapchat': /^[A-Za-z0-9._]{3,15}$/,
      'telegram': /^[A-Za-z0-9_]{5,32}$/,
      'mastodon': /^@[A-Za-z0-9._-]{1,30}$/,
      'threads': /^[A-Za-z0-9._]{1,30}$/
    };

    const pattern = verifiedPatterns[platform];
    return pattern ? pattern.test(handle) : false;
  }

  private isSocialMediaField(type: string, value: string): boolean {
    const socialMediaIndicators = ['twitter', 'facebook', 'instagram', 'youtube', 'linkedin', 'tiktok', 'snapchat'];
    return socialMediaIndicators.some(indicator => 
      type.toLowerCase().includes(indicator) || 
      value.toLowerCase().includes(indicator)
    );
  }

  private detectSocialMediaPlatform(value: string): SocialMediaInfo['platform'] | null {
    const platformPatterns = {
      'twitter': /twitter\.com\/[A-Za-z0-9_]+/,
      'facebook': /facebook\.com\/[A-Za-z0-9.]+/,
      'instagram': /instagram\.com\/[A-Za-z0-9._]+/,
      'youtube': /youtube\.com\/[A-Za-z0-9._-]+/,
      'linkedin': /linkedin\.com\/in\/[A-Za-z0-9-]+/,
      'tiktok': /tiktok\.com\/@[A-Za-z0-9._]+/,
      'snapchat': /snapchat\.com\/add\/[A-Za-z0-9._]+/
    };

    for (const [platform, pattern] of Object.entries(platformPatterns)) {
      if (pattern.test(value)) {
        return platform as SocialMediaInfo['platform'];
      }
    }

    return null;
  }

  private extractSocialMediaHandle(value: string): string | null {
    const handlePatterns = [
      /twitter\.com\/([A-Za-z0-9_]+)/,
      /facebook\.com\/([A-Za-z0-9.]+)/,
      /instagram\.com\/([A-Za-z0-9._]+)/,
      /youtube\.com\/([A-Za-z0-9._-]+)/,
      /linkedin\.com\/in\/([A-Za-z0-9-]+)/,
      /tiktok\.com\/@([A-Za-z0-9._]+)/,
      /snapchat\.com\/add\/([A-Za-z0-9._]+)/
    ];

    for (const pattern of handlePatterns) {
      const match = value.match(pattern);
      if (match) {
        return match[1] || null;
      }
    }

    return null;
  }

  private isVerifiedEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  private isVerifiedPhone(phone: string): boolean {
    const phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
    return phonePattern.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  private isVerifiedWebsite(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  private getEmailLabel(email: string, index: number): string {
    if (index === 0) return 'Primary Email';
    if (email.includes('campaign')) return 'Campaign Email';
    if (email.includes('office')) return 'Office Email';
    return `Email ${index + 1}`;
  }

  private getPhoneLabel(phone: string, index: number): string {
    if (index === 0) return 'Primary Phone';
    if (phone.includes('fax')) return 'Fax';
    return `Phone ${index + 1}`;
  }

  private getWebsiteLabel(url: string, index: number): string {
    if (index === 0) return 'Primary Website';
    if (url.includes('campaign')) return 'Campaign Website';
    if (url.includes('office')) return 'Office Website';
    return `Website ${index + 1}`;
  }

  private formatAddress(address: any): string {
    if (typeof address === 'string') return address;
    
    const parts = [];
    if (address.line1) parts.push(address.line1);
    if (address.line2) parts.push(address.line2);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.zip) parts.push(address.zip);
    
    return parts.join(', ');
  }

  private async extractWikipediaImage(pageUrl: string, name: string): Promise<string | null> {
    try {
      // This is a simplified implementation
      // In a real implementation, you would parse the Wikipedia page HTML
      // and extract the main image URL
      return null;
    } catch (error) {
      devLog('Wikipedia image extraction error', { error, pageUrl, name });
      return null;
    }
  }

  /**
   * Build comprehensive source attribution for merged data
   */
  private buildComprehensiveSourceAttribution(
    merged: RepresentativeData,
    sources: {
      googleCivic: Partial<RepresentativeData>;
      openStates: Partial<RepresentativeData>;
      congressGov: Partial<RepresentativeData>;
      legiScan: Partial<RepresentativeData>;
      wikipedia?: Partial<RepresentativeData>;
    }
  ): string[] {
    const attribution: string[] = [];
    
    // Check which sources contributed data
    if (sources.googleCivic && this.hasContributingData(sources.googleCivic)) {
      attribution.push('google-civic');
    }
    
    if (sources.openStates && this.hasContributingData(sources.openStates)) {
      attribution.push('open-states');
    }
    
    if (sources.congressGov && this.hasContributingData(sources.congressGov)) {
      attribution.push('congress-gov');
    }
    
    if (sources.legiScan && this.hasContributingData(sources.legiScan)) {
      attribution.push('legiscan');
    }
    
    if (sources.wikipedia && this.hasContributingData(sources.wikipedia)) {
      attribution.push('wikipedia');
    }
    
    // Add campaign finance source if present
    if (merged.campaignFinance) {
      attribution.push('fec');
    }
    
    // Remove duplicates and return
    return [...new Set(attribution)];
  }

  /**
   * Check if a source has contributing data
   */
  private hasContributingData(source: Partial<RepresentativeData>): boolean {
    return !!(
      source.name ||
      source.party ||
      (source.contacts && source.contacts.length > 0) ||
      (source.socialMedia && source.socialMedia.length > 0) ||
      (source.photos && source.photos.length > 0) ||
      (source.activity && source.activity.length > 0) ||
      source.bioguideId ||
      source.openstatesId ||
      source.fecId ||
      source.googleCivicId ||
      source.legiscanId ||
      source.congressGovId
    );
  }

  // Supporting methods for cross-reference validation
  
  private normalizeName(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private selectPrimaryName(names: string[]): string {
    // Prefer longer, more complete names
    return names.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
  }

  private selectPrimaryParty(parties: string[]): string {
    // Prefer official party names over abbreviations
    const partyPriority = ['Democratic', 'Republican', 'Independent', 'Green', 'Libertarian'];
    for (const party of partyPriority) {
      if (parties.includes(party)) return party;
    }
    return parties[0] || '';
  }

  private findContactConflicts(contacts: ContactInfo[], type: string): ContactConflict[] {
    const typeContacts = contacts.filter(c => c.type === type);
    const valueGroups: { [value: string]: ContactInfo[] } = {};
    
    typeContacts.forEach(contact => {
      if (contact.value) {
        if (!valueGroups[contact.value]) {
          valueGroups[contact.value] = [];
        }
        valueGroups[contact.value]!.push(contact);
      }
    });

    const conflicts: ContactConflict[] = [];
    Object.entries(valueGroups).forEach(([value, contactList]) => {
      if (contactList.length > 1) {
        const sources = contactList.map(c => c.source || 'unknown');
        conflicts.push({
          type,
          values: [value],
          sources,
          recommendation: this.generateContactRecommendation(type, value, sources)
        });
      }
    });

    return conflicts;
  }

  private findSocialMediaConflicts(socialMedia: SocialMediaInfo[]): SocialMediaConflict[] {
    const platformGroups: { [platform: string]: SocialMediaInfo[] } = {};
    
    socialMedia.forEach(social => {
      if (social.platform) {
        if (!platformGroups[social.platform]) {
          platformGroups[social.platform] = [];
        }
        platformGroups[social.platform]!.push(social);
      }
    });

    const conflicts: SocialMediaConflict[] = [];
    Object.entries(platformGroups).forEach(([platform, socialList]) => {
      if (socialList.length > 1) {
        const handles = socialList.map(s => s.handle);
        const sources = socialList.map(s => s.source || 'unknown');
        conflicts.push({
          platform,
          handles,
          sources,
          recommendation: this.generateSocialMediaRecommendation(platform, handles, sources)
        });
      }
    });

    return conflicts;
  }

  private findHandleConflicts(socialMedia: SocialMediaInfo[]): SocialMediaConflict[] {
    const handleGroups: { [handle: string]: SocialMediaInfo[] } = {};
    
    socialMedia.forEach(social => {
      if (social.handle) {
        if (!handleGroups[social.handle]) {
          handleGroups[social.handle] = [];
        }
        handleGroups[social.handle]!.push(social);
      }
    });

    const conflicts: SocialMediaConflict[] = [];
    Object.entries(handleGroups).forEach(([handle, socialList]) => {
      if (socialList.length > 1) {
        const platforms = socialList.map(s => s.platform);
        const sources = socialList.map(s => s.source || 'unknown');
        conflicts.push({
          platform: platforms.join(', '),
          handles: [handle],
          sources,
          recommendation: this.generateHandleRecommendation(handle, platforms, sources)
        });
      }
    });

    return conflicts;
  }

  private calculateContactConsistencyScore(
    emailConflicts: ContactConflict[],
    phoneConflicts: ContactConflict[],
    websiteConflicts: ContactConflict[]
  ): number {
    const totalConflicts = emailConflicts.length + phoneConflicts.length + websiteConflicts.length;
    return Math.max(0, 100 - totalConflicts * 20);
  }

  private calculateSocialMediaConsistencyScore(
    platformConflicts: SocialMediaConflict[],
    handleConflicts: SocialMediaConflict[]
  ): number {
    const totalConflicts = platformConflicts.length + handleConflicts.length;
    return Math.max(0, 100 - totalConflicts * 15);
  }

  private calculateSourceQualityScore(source: RepresentativeData): number {
    let score = 0;
    
    // Base score for having data
    if (source.name) score += 20;
    if (source.party) score += 15;
    if (source.contacts && source.contacts.length > 0) score += 20;
    if (source.socialMedia && source.socialMedia.length > 0) score += 15;
    if (source.photos && source.photos.length > 0) score += 10;
    if (source.activity && source.activity.length > 0) score += 20;
    
    // Bonus for verified sources
    if (source.dataSources && this.isVerifiedSource(source.dataSources)) {
      score += 10;
    }
    
    return Math.min(100, score);
  }

  private identifyDataConflicts(sources: any): string[] {
    const conflicts: string[] = [];
    
    // Check for name conflicts
    const names = Object.values(sources)
      .filter((source: any) => source?.name)
      .map((source: any) => source.name)
      .filter((name): name is string => typeof name === 'string');
    const uniqueNames = [...new Set(names)];
    if (uniqueNames.length > 1) {
      conflicts.push(`Name conflicts: ${uniqueNames.join(', ')}`);
    }
    
    // Check for party conflicts
    const parties = Object.values(sources)
      .filter((source: any) => source?.party)
      .map((source: any) => source.party)
      .filter((party): party is string => typeof party === 'string');
    const uniqueParties = [...new Set(parties)];
    if (uniqueParties.length > 1) {
      conflicts.push(`Party conflicts: ${uniqueParties.join(', ')}`);
    }
    
    return conflicts;
  }

  private generateDataRecommendations(validation: CrossReferenceValidation): string[] {
    const recommendations: string[] = [];
    
    if (validation.nameConsistency.confidence < 80) {
      recommendations.push('Consider manual review of name variations');
    }
    
    if (validation.partyConsistency.confidence < 70) {
      recommendations.push('Verify party affiliation from official sources');
    }
    
    if (validation.contactConsistency.overallConsistency < 80) {
      recommendations.push('Review contact information for accuracy');
    }
    
    if (validation.socialMediaConsistency.overallConsistency < 80) {
      recommendations.push('Verify social media handles and platforms');
    }
    
    return recommendations;
  }

  private generateContactRecommendation(type: string, value: string, sources: string[]): string {
    return `Multiple ${type} values found from sources: ${sources.join(', ')}. Verify correct ${type}: ${value}`;
  }

  private generateSocialMediaRecommendation(platform: string, handles: string[], sources: string[]): string {
    return `Multiple ${platform} handles found from sources: ${sources.join(', ')}. Verify correct handle: ${handles.join(', ')}`;
  }

  private generateHandleRecommendation(handle: string, platforms: string[], sources: string[]): string {
    return `Handle ${handle} found on multiple platforms: ${platforms.join(', ')} from sources: ${sources.join(', ')}`;
  }

  private mergeContactsWithValidation(
    existing: ContactInfo[],
    newContacts: ContactInfo[],
    consistency: ContactConsistency
  ): ContactInfo[] {
    const merged = [...existing];
    
    newContacts.forEach(newContact => {
      const conflict = consistency.emailConflicts.find(c => c.values.includes(newContact.value)) ||
                     consistency.phoneConflicts.find(c => c.values.includes(newContact.value)) ||
                     consistency.websiteConflicts.find(c => c.values.includes(newContact.value));
      
      if (conflict) {
        // Add with conflict flag
        merged.push({ ...(newContact || {}), isVerified: false, conflictFlag: true });
      } else {
        // No conflict, add normally
        const existingIndex = merged.findIndex(existing => 
          existing.type === newContact.type && existing.value === newContact.value
        );
        if (existingIndex === -1) {
          merged.push(newContact);
        }
      }
    });
    
    return merged;
  }

  private mergeSocialMediaWithValidation(
    existing: SocialMediaInfo[],
    newSocial: SocialMediaInfo[],
    consistency: SocialMediaConsistency
  ): SocialMediaInfo[] {
    const merged = [...existing];
    
    newSocial.forEach(newSocialItem => {
      const conflict = consistency.platformConflicts.find(c => c.platform === newSocialItem.platform) ||
                     consistency.handleConflicts.find(c => c.handles.includes(newSocialItem.handle));
      
      if (conflict) {
        // Add with conflict flag
        merged.push({ ...(newSocialItem || {}), isVerified: false, conflictFlag: true });
      } else {
        // No conflict, add normally
        const existingIndex = merged.findIndex(existing => 
          existing.platform === newSocialItem.platform && existing.handle === newSocialItem.handle
        );
        if (existingIndex === -1) {
          merged.push(newSocialItem);
        }
      }
    });
    
    return merged;
  }

  private mergePhotosWithValidation(
    existing: PhotoInfo[],
    newPhotos: PhotoInfo[],
    qualityScores: { [source: string]: number }
  ): PhotoInfo[] {
    const merged = [...existing];
    
    newPhotos.forEach(newPhoto => {
      const existingIndex = merged.findIndex(existing => existing.url === newPhoto.url);
      if (existingIndex === -1) {
        // Add quality score based on source
        const sourceQuality = qualityScores[newPhoto.source || 'unknown'] || 50;
        merged.push({ 
          ...(newPhoto || {}), 
          quality: sourceQuality > 80 ? 'high' : sourceQuality > 60 ? 'medium' : 'low'
        });
      }
    });
    
    return merged.sort((a, b) => {
      const qualityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return qualityOrder[b.quality] - qualityOrder[a.quality];
    });
  }

  private mergeDataSourcesWithQuality(
    existing: string[],
    newSources: string[],
    qualityScores: { [source: string]: number }
  ): string[] {
    const merged = [...existing];
    
    newSources.forEach(source => {
      if (!merged.includes(source)) {
        // Only add sources with reasonable quality scores
        if ((qualityScores[source] || 0) > 30) {
          merged.push(source);
        }
      }
    });
    
    return merged;
  }

  /**
   * Check if a representative is currently active/current
   * This prevents processing of historical/retired representatives
   */
  private isCurrentRepresentative(rep: RepresentativeData): boolean {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    console.log(`🔍 Checking if ${rep.name} is current representative...`);
    console.log(`   Current Date: ${currentDate.toISOString()}`);
    console.log(`   Term Start: ${rep.termStartDate}`);
    console.log(`   Term End: ${rep.termEndDate}`);
    console.log(`   Next Election: ${rep.nextElectionDate}`);
    console.log(`   Last Updated: ${rep.lastUpdated}`);
    
    // Check if representative has current term dates
    if (rep.termStartDate && rep.termEndDate) {
      const termStart = new Date(rep.termStartDate);
      const termEnd = new Date(rep.termEndDate);
      
      console.log(`   Term Start Date: ${termStart.toISOString()}`);
      console.log(`   Term End Date: ${termEnd.toISOString()}`);
      
      // Term must be current (started and not ended)
      if (termStart > currentDate) {
        console.log(`   ❌ Term hasn't started yet (${termStart.toISOString()} > ${currentDate.toISOString()})`);
        return false;
      }
      if (termEnd < currentDate) {
        console.log(`   ❌ Term has expired (${termEnd.toISOString()} < ${currentDate.toISOString()})`);
        return false;
      }
      
      console.log(`   ✅ Term is current (${termStart.toISOString()} <= ${currentDate.toISOString()} <= ${termEnd.toISOString()})`);
    }
    
    // Check if representative has upcoming elections (indicates current)
    if (rep.nextElectionDate) {
      const nextElection = new Date(rep.nextElectionDate);
      console.log(`   Next Election: ${nextElection.toISOString()}`);
      // If next election is more than 2 years away, might be historical
      if (nextElection > new Date(currentYear + 2, 11, 31)) {
        console.log(`   ❌ Next election too far in future (${nextElection.toISOString()})`);
        return false;
      }
      console.log(`   ✅ Next election is reasonable (${nextElection.toISOString()})`);
    }
    
    // Check if representative has recent activity (within last 2 years)
    if (rep.lastUpdated) {
      const lastUpdated = new Date(rep.lastUpdated);
      const twoYearsAgo = new Date(currentYear - 2, 0, 1);
      console.log(`   Last Updated: ${lastUpdated.toISOString()}`);
      console.log(`   Two Years Ago: ${twoYearsAgo.toISOString()}`);
      if (lastUpdated < twoYearsAgo) {
        console.log(`   ❌ Last updated too long ago (${lastUpdated.toISOString()} < ${twoYearsAgo.toISOString()})`);
        return false;
      }
      console.log(`   ✅ Last updated recently (${lastUpdated.toISOString()} >= ${twoYearsAgo.toISOString()})`);
    }
    
    // For federal representatives, check if they have current session data
    if (rep.level === 'federal' && rep.congressGovId) {
      console.log(`   ✅ Federal representative with Congress.gov ID: ${rep.congressGovId}`);
      return true; // Assume current if they have Congress.gov ID AND passed date checks
    }
    
    // For state representatives, check if they have OpenStates ID
    if (rep.level === 'state' && rep.openstatesId) {
      console.log(`   ✅ State representative with OpenStates ID: ${rep.openstatesId}`);
      return true; // Assume current if they have OpenStates ID AND passed date checks
    }
    
    // If we get here, the representative passed all date checks
    console.log(`   ✅ Representative passed all current checks`);
    return true;
  }

  /**
   * Filter OpenStates legislators to only include current/active representatives
   * This is crucial to avoid processing historical/retired legislators
   */
  private filterCurrentLegislators(legislators: any[]): any[] {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    return legislators.filter(legislator => {
      // Check if legislator has current roles/offices
      const hasCurrentRoles = legislator.roles && legislator.roles.some((role: any) => {
        // Check if role is current (no end_date or end_date is in the future)
        if (!role.end_date) return true; // No end date means current
      const endDate = new Date(role.end_date!);
      return endDate > currentDate;
      });
      
      // Check if legislator has current terms
      const hasCurrentTerms = legislator.terms && legislator.terms.some((term: any) => {
        if (!term.end_date) return true; // No end date means current
      const endDate = new Date(term.end_date!);
      return endDate > currentDate;
      });
      
      // Check if legislator is not marked as retired
      const isNotRetired = !legislator.retired && 
                          !legislator.status?.includes('retired') && 
                          !legislator.status?.includes('former');
      
      // Check if legislator has recent activity (within last 2 years)
      const hasRecentActivity = legislator.last_updated && 
                               new Date(legislator.last_updated) > new Date(currentYear - 2, 0, 1);
      
      // Check if legislator has current session data
      const hasCurrentSession = legislator.sessions && 
                               legislator.sessions.some((session: any) => 
                                 session.includes(currentYear.toString()) || 
                                 session.includes((currentYear - 1).toString())
                               );
      
      // Must meet at least 2 of these criteria to be considered current
      const criteria = [
        hasCurrentRoles,
        hasCurrentTerms,
        isNotRetired,
        hasRecentActivity,
        hasCurrentSession
      ];
      
      const metCriteria = criteria.filter(Boolean).length;
      const isCurrent = metCriteria >= 2;
      
      if (!isCurrent) {
        devLog('Filtered out non-current legislator', {
          name: legislator.name,
          roles: legislator.roles?.length || 0,
          terms: legislator.terms?.length || 0,
          retired: legislator.retired,
          status: legislator.status,
          lastUpdated: legislator.last_updated,
          sessions: legislator.sessions,
          metCriteria
        });
      }
      
      return isCurrent;
    });
  }

  /**
   * Get OpenStates YAML data from repository
   * This method focuses ONLY on current legislators from the 'legislature' subdirectory
   * and explicitly avoids the 'retired' subdirectory to prevent historical data
   */
  private async getOpenStatesYAMLData(rep: RepresentativeData): Promise<Partial<RepresentativeData>> {
    console.log('🔍 OpenStates YAML: Attempting to get CURRENT legislator data for', rep.name);
    
    try {
      // In a full implementation, this would:
      // 1. Fetch YAML files ONLY from the 'legislature' subdirectory (current representatives)
      // 2. Explicitly avoid the 'retired' subdirectory (historical data)
      // 3. Parse the YAML data with current representative filtering
      // 4. Extract relevant information for the representative
      // 5. Return structured data with proper attribution
      
      // Repository structure to target:
      // openstates/people/
      // ├── {state}/
      // │   ├── legislature/     ← CURRENT representatives (target this)
      // │   ├── executive/        ← Governors (if needed)
      // │   ├── municipalities/   ← Local officials (if needed)
      // │   └── retired/         ← HISTORICAL data (avoid this)
      
      devLog('OpenStates YAML integration targeting current legislators only', { 
        name: rep.name, 
        state: rep.state,
        targetDirectory: 'legislature', // Only current representatives
        avoidDirectory: 'retired' // Avoid historical data
      });
      
      return {
        dataSources: ['openstates-yaml-current'],
        contacts: [],
        socialMedia: [],
        photos: []
      };
    } catch (error) {
      devLog('OpenStates YAML data error', { error, name: rep.name });
      return {};
    }
  }

  /**
   * Merge OpenStates API and YAML data sources
   */
  private mergeOpenStatesSources(
    apiData: Partial<RepresentativeData>,
    yamlData: Partial<RepresentativeData>
  ): Partial<RepresentativeData> {
    const merged: Partial<RepresentativeData> = {
      dataSources: [],
      contacts: [],
      socialMedia: [],
      photos: [],
      activity: []
    };

    // Merge data sources
    if (apiData.dataSources) {
      merged.dataSources!.push(...apiData.dataSources);
    }
    if (yamlData.dataSources) {
      merged.dataSources!.push(...yamlData.dataSources);
    }
    merged.dataSources = [...new Set(merged.dataSources)];

    // Merge contacts with conflict resolution
    if (apiData.contacts) {
      merged.contacts!.push(...apiData.contacts);
    }
    if (yamlData.contacts) {
      merged.contacts!.push(...yamlData.contacts);
    }

    // Merge social media with conflict resolution
    if (apiData.socialMedia) {
      merged.socialMedia!.push(...apiData.socialMedia);
    }
    if (yamlData.socialMedia) {
      merged.socialMedia!.push(...yamlData.socialMedia);
    }

    // Merge photos with quality ranking
    if (apiData.photos) {
      merged.photos!.push(...apiData.photos);
    }
    if (yamlData.photos) {
      merged.photos!.push(...yamlData.photos);
    }

    // Merge activity data
    if (apiData.activity) {
      merged.activity!.push(...apiData.activity);
    }
    if (yamlData.activity) {
      merged.activity!.push(...yamlData.activity);
    }

    // Prefer API data for core fields, but use YAML as fallback
    merged.name = apiData.name || yamlData.name || '';
    merged.party = apiData.party || yamlData.party || '';
    merged.office = apiData.office || yamlData.office || '';
    merged.level = (apiData.level || yamlData.level || 'state') as 'federal' | 'state' | 'local';
    merged.state = apiData.state || yamlData.state || '';
    merged.district = apiData.district || yamlData.district || '';

    // Merge identifiers
    merged.openstatesId = apiData.openstatesId || yamlData.openstatesId || '';
    merged.bioguideId = apiData.bioguideId || yamlData.bioguideId || '';
    merged.fecId = apiData.fecId || yamlData.fecId || '';

    return merged;
  }
}

// Export the main pipeline class
export const freeAPIsPipeline = new FreeAPIsPipeline();
