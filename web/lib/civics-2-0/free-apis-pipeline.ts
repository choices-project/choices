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

// Types for our FREE APIs data
export interface RepresentativeData {
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
  
  // Contact information
  contacts: ContactInfo[];
  socialMedia: SocialMediaInfo[];
  photos: PhotoInfo[];
  activity: ActivityInfo[];
  
  // Campaign finance
  campaignFinance?: CampaignFinanceInfo;
  
  // Metadata
  dataSources: string[];
  qualityScore: number;
  lastUpdated: Date;
}

export interface ContactInfo {
  type: 'email' | 'phone' | 'website' | 'fax' | 'address';
  value: string;
  label?: string;
  isPrimary: boolean;
  isVerified: boolean;
  source: string;
}

export interface SocialMediaInfo {
  platform: 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'linkedin';
  handle: string;
  url: string;
  followersCount: number;
  isVerified: boolean;
  source: string;
}

export interface PhotoInfo {
  url: string;
  source: 'congress-gov' | 'wikipedia' | 'google-civic' | 'openstates';
  quality: 'high' | 'medium' | 'low';
  isPrimary: boolean;
  license?: string;
  attribution?: string;
  width?: number;
  height?: number;
}

export interface ActivityInfo {
  type: 'vote' | 'bill' | 'statement' | 'social_media' | 'photo_update';
  title: string;
  description?: string;
  url?: string;
  date: Date;
  metadata: Record<string, any>;
  source: string;
}

export interface CampaignFinanceInfo {
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

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      { auth: { persistSession: false } }
    );
    
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
  }

  /**
   * Main ingestion method - processes a representative using all FREE APIs
   */
  async processRepresentative(rep: RepresentativeData): Promise<RepresentativeData> {
    devLog('Processing representative with FREE APIs', { name: rep.name });

    try {
      // 1. Get basic info from Google Civic (FREE)
      const googleCivicData = await this.getGoogleCivicData(rep);
      
      // 2. Get state data from OpenStates (FREE)
      const openStatesData = await this.getOpenStatesData(rep);
      
      // 3. Get federal data from Congress.gov (FREE)
      const congressGovData = await this.getCongressGovData(rep);
      
      // 4. Get photos from multiple sources (FREE)
      const photos = await this.getPhotosFromMultipleSources(rep);
      
      // 5. Get social media (FREE)
      const socialMedia = await this.getSocialMediaData(rep);
      
      // 6. Get campaign finance (FREE)
      const campaignFinance = await this.getFECData(rep);
      
      // 7. Get recent activity (FREE)
      const activity = await this.getRecentActivity(rep);

      // Merge and validate all data
      const enrichedRep = this.mergeAndValidateData(
        rep,
        googleCivicData,
        openStatesData,
        congressGovData,
        photos,
        socialMedia,
        campaignFinance,
        activity
      );

      // Calculate quality score
      enrichedRep.qualityScore = this.calculateQualityScore(enrichedRep);
      enrichedRep.lastUpdated = new Date();

      devLog('Representative processed successfully', { 
        name: enrichedRep.name, 
        qualityScore: enrichedRep.qualityScore,
        dataSources: enrichedRep.dataSources.length
      });

      return enrichedRep;

    } catch (error) {
      devLog('Error processing representative', { name: rep.name, error });
      throw error;
    }
  }

  /**
   * Google Civic Information API (FREE - 25,000 requests/day)
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

      // Search for representative by state (Google Civic needs a proper address)
      const searchQuery = `123 Main St, ${rep.state}`;
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
      const offices = data.offices || [];
      
      let enrichedData: Partial<RepresentativeData> = {
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

    } catch (error) {
      devLog('Google Civic API error', { error });
      return {};
    }
  }

  /**
   * OpenStates API (FREE - 10,000 requests/day)
   */
  private async getOpenStatesData(rep: RepresentativeData): Promise<Partial<RepresentativeData>> {
    const rateLimiter = this.rateLimiters.get('openstates');
    
    if (rateLimiter.currentUsage >= rateLimiter.requestsPerDay) {
      devLog('OpenStates API rate limit reached');
      return {};
    }

    try {
      const apiKey = process.env.OPENSTATES_API_KEY;
      if (!apiKey) {
        devLog('OpenStates API key not configured');
        return {};
      }

      // Search for legislators by state
      const response = await fetch(
        `https://openstates.org/api/v1/legislators/?state=${rep.state.toLowerCase()}&apikey=${apiKey}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        devLog('OpenStates API request failed', { status: response.status });
        return {};
      }

      const data = await response.json();
      rateLimiter.currentUsage++;

      let enrichedData: Partial<RepresentativeData> = {
        dataSources: ['openstates'],
        contacts: [],
        socialMedia: [],
        photos: []
      };

      // Find matching representative
      const matchingRep = data.find((legislator: any) => 
        this.isMatchingRepresentative(legislator, rep)
      );

      if (matchingRep) {
        // Extract contact information
        const contacts = this.extractOpenStatesContacts(matchingRep);
        enrichedData.contacts = contacts;

        // Extract social media
        const socialMedia = this.extractOpenStatesSocialMedia(matchingRep);
        enrichedData.socialMedia = socialMedia;

        // Extract photos
        const photos = this.extractOpenStatesPhotos(matchingRep);
        enrichedData.photos = photos;

        // Extract basic info
        if (matchingRep.full_name) enrichedData.name = matchingRep.full_name;
        if (matchingRep.party) enrichedData.party = matchingRep.party;
        if (matchingRep.openstates_id) enrichedData.openstatesId = matchingRep.openstates_id;
      }

      return enrichedData;

    } catch (error) {
      devLog('OpenStates API error', { error });
      return {};
    }
  }

  /**
   * Congress.gov API (FREE - 5,000 requests/day)
   */
  private async getCongressGovData(rep: RepresentativeData): Promise<Partial<RepresentativeData>> {
    const rateLimiter = this.rateLimiters.get('congress-gov');
    
    if (rateLimiter.currentUsage >= rateLimiter.requestsPerDay) {
      devLog('Congress.gov API rate limit reached');
      return {};
    }

    try {
      // Search for members by state
      const response = await fetch(
        `https://api.congress.gov/v3/member?state=${rep.state}&format=json&api_key=${process.env.CONGRESS_GOV_API_KEY}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        devLog('Congress.gov API request failed', { status: response.status });
        return {};
      }

      const data = await response.json();
      rateLimiter.currentUsage++;

      let enrichedData: Partial<RepresentativeData> = {
        dataSources: ['congress-gov'],
        contacts: [],
        socialMedia: [],
        photos: []
      };

      // Find matching representative
      const members = data.members || [];
      const matchingRep = members.find((member: any) => 
        this.isMatchingRepresentative(member, rep)
      );

      if (matchingRep) {
        // Extract contact information
        const contacts = this.extractCongressGovContacts(matchingRep);
        enrichedData.contacts = contacts;

        // Extract photos
        const photos = this.extractCongressGovPhotos(matchingRep);
        enrichedData.photos = photos;

        // Extract basic info
        if (matchingRep.fullName) enrichedData.name = matchingRep.fullName;
        if (matchingRep.party) enrichedData.party = matchingRep.party;
        if (matchingRep.bioguideId) enrichedData.bioguideId = matchingRep.bioguideId;
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
      // 1. Congress.gov official photos (FREE)
      if (rep.bioguideId) {
        const congressPhoto = await this.getCongressPhoto(rep.bioguideId);
        if (congressPhoto) photos.push(congressPhoto);
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
   * FEC API (FREE - 1,000 requests/day)
   */
  private async getFECData(rep: RepresentativeData): Promise<CampaignFinanceInfo | undefined> {
    const rateLimiter = this.rateLimiters.get('fec');
    
    if (rateLimiter.currentUsage >= rateLimiter.requestsPerDay) {
      devLog('FEC API rate limit reached');
      return undefined;
    }

    try {
      if (!rep.fecId) {
        devLog('No FEC ID available for representative', { name: rep.name });
        return undefined;
      }

      const response = await fetch(
        `https://api.open.fec.gov/v1/candidate/${rep.fecId}/totals/?api_key=${process.env.FEC_API_KEY}`,
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

      // Extract campaign finance data
      const totals = data.results?.[0];
      if (totals) {
        return {
          electionCycle: totals.cycle || '2024',
          totalReceipts: totals.receipts || 0,
          totalDisbursements: totals.disbursements || 0,
          cashOnHand: totals.cash_on_hand_end_period || 0,
          debt: totals.debts_owed_by_committee || 0,
          individualContributions: totals.individual_contributions || 0,
          pacContributions: totals.political_party_committee_contributions || 0,
          partyContributions: totals.political_party_committee_contributions || 0,
          selfFinancing: totals.candidate_contribution || 0
        };
      }

      return undefined;

    } catch (error) {
      devLog('FEC API error', { error });
      return undefined;
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
    // Simple name matching - can be enhanced with fuzzy matching
    const apiName = apiRep.name || apiRep.full_name || apiRep.fullName || '';
    const ourName = ourRep.name;
    
    return apiName.toLowerCase().includes(ourName.toLowerCase()) ||
           ourName.toLowerCase().includes(apiName.toLowerCase());
  }

  private extractGoogleCivicContacts(official: any): ContactInfo[] {
    const contacts: ContactInfo[] = [];
    
    if (official.emails) {
      official.emails.forEach((email: string) => {
        contacts.push({
          type: 'email',
          value: email,
          isPrimary: true,
          isVerified: false,
          source: 'google-civic'
        });
      });
    }

    if (official.phones) {
      official.phones.forEach((phone: string) => {
        contacts.push({
          type: 'phone',
          value: phone,
          isPrimary: true,
          isVerified: false,
          source: 'google-civic'
        });
      });
    }

    if (official.urls) {
      official.urls.forEach((url: string) => {
        contacts.push({
          type: 'website',
          value: url,
          isPrimary: true,
          isVerified: false,
          source: 'google-civic'
        });
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

  private async getCongressPhoto(bioguideId: string): Promise<PhotoInfo | null> {
    try {
      const photoUrl = `https://www.congress.gov/img/member/${bioguideId}.jpg`;
      
      // Test if photo exists
      const response = await fetch(photoUrl, { method: 'HEAD' });
      if (response.ok) {
        return {
          url: photoUrl,
          source: 'congress-gov',
          quality: 'high',
          isPrimary: true
        };
      }
    } catch (error) {
      devLog('Congress photo not available', { bioguideId });
    }

    return null;
  }

  private async getWikipediaPhotos(name: string): Promise<PhotoInfo[]> {
    // Implementation for Wikipedia photo search
    // This would use the Wikipedia API to search for photos
    return [];
  }

  private async getGoogleCivicPhotos(rep: RepresentativeData): Promise<PhotoInfo[]> {
    // Implementation for Google Civic photos
    return [];
  }

  private async getOpenStatesPhotos(rep: RepresentativeData): Promise<PhotoInfo[]> {
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
      const sourceOrder = { 'congress-gov': 4, 'wikipedia': 3, 'google-civic': 2, 'openstates': 1, 'generated': 0 };
      
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
    photos: PhotoInfo[],
    socialMedia: SocialMediaInfo[],
    campaignFinance?: CampaignFinanceInfo,
    activity: ActivityInfo[] = []
  ): RepresentativeData {
    return {
      ...original,
      ...googleCivic,
      ...openStates,
      ...congressGov,
      contacts: [
        ...(original.contacts || []),
        ...(googleCivic.contacts || []),
        ...(openStates.contacts || []),
        ...(congressGov.contacts || [])
      ],
      socialMedia: [
        ...(original.socialMedia || []),
        ...socialMedia
      ],
      photos: [
        ...(original.photos || []),
        ...photos
      ],
      activity: [
        ...(original.activity || []),
        ...activity
      ],
      campaignFinance: campaignFinance || {
        totalReceipts: 0,
        totalDisbursements: 0,
        cashOnHand: 0,
        debt: 0,
        electionCycle: '2024',
        individualContributions: 0,
        pacContributions: 0,
        partyContributions: 0,
        selfFinancing: 0
      },
      dataSources: [
        ...(original.dataSources || []),
        ...(googleCivic.dataSources || []),
        ...(openStates.dataSources || []),
        ...(congressGov.dataSources || [])
      ]
    };
  }

  // Additional helper methods for specific API integrations
  private extractOpenStatesContacts(legislator: any): ContactInfo[] {
    // Implementation for OpenStates contact extraction
    return [];
  }

  private extractOpenStatesSocialMedia(legislator: any): SocialMediaInfo[] {
    // Implementation for OpenStates social media extraction
    return [];
  }

  private extractOpenStatesPhotos(legislator: any): PhotoInfo[] {
    // Implementation for OpenStates photo extraction
    return [];
  }

  private extractCongressGovContacts(member: any): ContactInfo[] {
    // Implementation for Congress.gov contact extraction
    return [];
  }

  private extractCongressGovPhotos(member: any): PhotoInfo[] {
    // Implementation for Congress.gov photo extraction
    return [];
  }

  private async getGoogleCivicSocialMedia(rep: RepresentativeData): Promise<SocialMediaInfo[]> {
    // Implementation for Google Civic social media
    return [];
  }

  private async getOpenStatesSocialMedia(rep: RepresentativeData): Promise<SocialMediaInfo[]> {
    // Implementation for OpenStates social media
    return [];
  }

  private async searchSocialMedia(name: string): Promise<SocialMediaInfo[]> {
    // Implementation for social media search
    return [];
  }

  private async getRecentVotes(rep: RepresentativeData): Promise<ActivityInfo[]> {
    // Implementation for recent votes
    return [];
  }

  private async getRecentBills(rep: RepresentativeData): Promise<ActivityInfo[]> {
    // Implementation for recent bills
    return [];
  }

  private async getSocialMediaUpdates(rep: RepresentativeData): Promise<ActivityInfo[]> {
    // Implementation for social media updates
    return [];
  }
}

// Export the main pipeline class
export const freeAPIsPipeline = new FreeAPIsPipeline();
