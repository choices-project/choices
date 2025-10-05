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

export type ContactInfo = {
  type: 'email' | 'phone' | 'website' | 'fax' | 'address';
  value: string;
  label?: string;
  isPrimary: boolean;
  isVerified: boolean;
  source: string;
}

export type SocialMediaInfo = {
  platform: 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'linkedin';
  handle: string;
  url: string;
  followersCount: number;
  isVerified: boolean;
  source: string;
}

export type PhotoInfo = {
  url: string;
  source: 'congress-gov' | 'wikipedia' | 'google-civic' | 'openstates';
  quality: 'high' | 'medium' | 'low';
  isPrimary: boolean;
  license?: string;
  attribution?: string;
  width?: number;
  height?: number;
}

export type ActivityInfo = {
  type: 'vote' | 'bill' | 'statement' | 'social_media' | 'photo_update';
  title: string;
  description?: string;
  url?: string;
  date: Date;
  metadata: Record<string, any>;
  source: string;
}

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
  }

  /**
   * Main ingestion method - processes a representative using all FREE APIs
   */
  async processRepresentative(rep: RepresentativeData): Promise<RepresentativeData> {
    console.log('🔄 Starting to process representative:', rep.name);
    devLog('Processing representative with FREE APIs', { name: rep.name });

    try {
      // 1. Get basic info from Google Civic (FREE)
      console.log('📊 Getting Google Civic data...');
      const googleCivicData = await this.getGoogleCivicData(rep);
      console.log('✅ Google Civic data retrieved');
      
      // 2. Get state data from OpenStates (FREE) - Temporarily disabled
      console.log('📊 Getting OpenStates data...');
      const openStatesData = await this.getOpenStatesData(rep);
      console.log('✅ OpenStates data retrieved');
      
      // 3. Get federal data from Congress.gov (FREE)
      console.log('📊 Getting Congress.gov data...');
      const congressGovData = await this.getCongressGovData(rep);
      console.log('✅ Congress.gov data retrieved');
      
      // 4. Get photos from multiple sources (FREE)
      console.log('📊 Getting photos...');
      const photos = await this.getPhotosFromMultipleSources(rep);
      console.log('✅ Photos retrieved');
      
      // 5. Get social media (FREE)
      console.log('📊 Getting social media...');
      const socialMedia = await this.getSocialMediaData(rep);
      console.log('✅ Social media retrieved');
      
      // 6. Get campaign finance (FREE)
      console.log('📊 Getting FEC data...');
      const campaignFinance = await this.getFECData(rep);
      console.log('✅ FEC data retrieved');
      
      // 7. Get recent activity (FREE)
      console.log('📊 Getting recent activity...');
      const activity = await this.getRecentActivity(rep);
      console.log('✅ Recent activity retrieved');

      // Merge and validate all data
      console.log('🔄 Merging and validating data...');
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
      console.log('✅ Data merged and validated');

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
   * OpenStates API (FREE - 10,000 requests/day)
   * Now using proper API key authentication
   */
  private async getOpenStatesData(rep: RepresentativeData): Promise<Partial<RepresentativeData>> {
    const rateLimiter = this.rateLimiters.get('openstates');
    
    if (rateLimiter.currentUsage >= rateLimiter.requestsPerDay) {
      devLog('OpenStates API rate limit reached');
      return {};
    }

    try {
      const apiKey = process.env.OPEN_STATES_API_KEY;
      if (!apiKey) {
        devLog('OpenStates API key not configured');
        return {};
      }

      // Search for legislators by state using OpenStates API v3
      const response = await fetch(
        `https://v3.openstates.org/people?jurisdiction=${rep.state.toLowerCase()}`,
        {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-API-KEY': apiKey
          }
        }
      );

      if (!response.ok) {
        devLog('OpenStates API request failed', { status: response.status });
        return {};
      }

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
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

      // Process all legislators from the API v3 response
      const legislators = data.results || [];
      
      for (const legislator of legislators) {
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

      const enrichedData: Partial<RepresentativeData> = {
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
        enrichedData.contacts = [...(enrichedData.contacts || []), ...contacts];

        // Extract photos
        const photos = this.extractCongressGovPhotos(matchingRep);
        enrichedData.photos = [...(enrichedData.photos || []), ...photos];

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

  private async getOpenStatesPhotos(_rep: RepresentativeData): Promise<PhotoInfo[]> {
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
    // Start with original data
    let merged = { ...original };
    
    // Apply advanced data transformations and conflict resolution
    merged = this.resolveDataConflicts(merged, googleCivic);
    merged = this.resolveDataConflicts(merged, openStates);
    merged = this.resolveDataConflicts(merged, congressGov);
    
    // Normalize party affiliation
    if (merged.party) {
      merged.party = this.normalizePartyAffiliation(merged.party);
    }
    
    // Normalize contact information
    if (merged.contacts) {
      merged.contacts = merged.contacts.map(contact => this.normalizeContactInfo(contact));
    }
    
    // Add photos, social media, and activity with deduplication
    merged.photos = this.mergePhotos(merged.photos || [], photos);
    merged.socialMedia = this.mergeSocialMedia(merged.socialMedia || [], socialMedia);
    merged.activity = [...(merged.activity || []), ...activity];
    
    if (campaignFinance) {
      merged.campaignFinance = campaignFinance;
    }
    
    // Validate data quality
    const validation = this.validateDataQuality(merged);
    if (!validation.isValid) {
      devLog('Data quality issues detected', { 
        name: merged.name, 
        issues: validation.issues 
      });
    }
    
    return merged;
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
          const platformKey = this.mapOpenStatesPlatform(platform);
          if (platformKey) {
            socialMedia.push({
              platform: platformKey,
              handle: handle,
              url: this.generateSocialMediaUrl(platformKey, handle),
              followersCount: 0, // OpenStates doesn't provide follower counts
              isVerified: false,
              source: 'openstates'
            });
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
    
    // Extract email from Congress.gov data
    if (member.email) {
      contacts.push({
        type: 'email',
        value: member.email,
        isPrimary: true,
        isVerified: true, // Congress.gov is official
        source: 'congress-gov'
      });
    }
    
    // Extract phone from Congress.gov data
    if (member.phone) {
      contacts.push({
        type: 'phone',
        value: member.phone,
        isPrimary: true,
        isVerified: true,
        source: 'congress-gov'
      });
    }
    
    // Extract website from Congress.gov data
    if (member.url) {
      contacts.push({
        type: 'website',
        value: member.url,
        isPrimary: true,
        isVerified: true,
        source: 'congress-gov'
      });
    }
    
    return contacts;
  }

  private extractCongressGovPhotos(member: any): PhotoInfo[] {
    const photos: PhotoInfo[] = [];
    
    // Congress.gov provides official photos via bioguide_id
    if (member.bioguideId) {
      const photoUrl = `https://www.congress.gov/img/member/${member.bioguideId}.jpg`;
      photos.push({
        url: photoUrl,
        source: 'congress-gov',
        quality: 'high',
        isPrimary: true,
        license: 'Public Domain',
        attribution: 'Congress.gov'
      });
    }
    
    return photos;
  }

  private async getGoogleCivicSocialMedia(rep: RepresentativeData): Promise<SocialMediaInfo[]> {
    const socialMedia: SocialMediaInfo[] = [];
    
    try {
      const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
      if (!apiKey) return socialMedia;
      
      const searchQuery = `123 Main St, ${rep.state}`;
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
        `https://openstates.org/api/v1/legislators/?state=${rep.state.toLowerCase()}&apikey=${apiKey}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (!response.ok) return socialMedia;
      
      const data = await response.json();
      const matchingLegislator = data.find((legislator: any) => 
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
      const searchTerms = [
        name,
        name.replace(/\s+/g, ''),
        name.split(' ').join('_'),
        name.split(' ').join('.')
      ];
      
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

  private resolveDataConflicts(
    original: RepresentativeData,
    newData: Partial<RepresentativeData>
  ): RepresentativeData {
    const resolved = { ...original };
    
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
      'linkedin': `https://linkedin.com/in/${handle}`
    };
    
    return urlMappings[platform] || `https://${platform}.com/${handle}`;
  }
}

// Export the main pipeline class
export const freeAPIsPipeline = new FreeAPIsPipeline();
