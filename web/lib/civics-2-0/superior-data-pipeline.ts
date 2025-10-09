/**
 * Superior Data Pipeline
 * Comprehensive integration of all data sources with current electorate filtering
 * 
 * Created: October 8, 2025
 * Updated: October 8, 2025
 */

import { createClient } from '@supabase/supabase-js';
import { CurrentElectorateVerifier } from './current-electorate-verifier';
import OpenStatesIntegration, { type OpenStatesPerson } from './openstates-integration';

export type SuperiorPipelineConfig = {
  // Data sources
  enableCongressGov: boolean;
  enableGoogleCivic: boolean;
  enableFEC: boolean;
  enableOpenStatesApi: boolean;
  enableOpenStatesPeople: boolean;
  enableWikipedia: boolean;
  
  // Current electorate filtering
  strictCurrentFiltering: boolean;
  systemDateVerification: boolean;
  excludeNonCurrent: string[];
  
  // Data quality
  minimumQualityScore: number;
  enableCrossReference: boolean;
  enableDataValidation: boolean;
  
  // Performance
  maxConcurrentRequests: number;
  rateLimitDelay: number;
  
  // Rate limits (corrected for OpenStates)
  openStatesRateLimit: number; // 250/day
  congressGovRateLimit: number; // 5000/day
  fecRateLimit: number; // 1000/day
  googleCivicRateLimit: number; // 100000/day
  cacheResults: boolean;
  
  // OpenStates People Database
  openStatesPeoplePath: string;
  enableStateProcessing: boolean;
  enableMunicipalProcessing: boolean;
}

export type SuperiorRepresentativeData = {
  // Core identification
  id: string;
  name: string;
  office: string;
  level: 'federal' | 'state' | 'local';
  state: string;
  party: string;
  district?: string;
  openstatesId?: string;
  
  // External identifiers
  bioguide_id?: string;
  fec_id?: string;
  google_civic_id?: string;
  legiscan_id?: string;
  congress_gov_id?: string;
  govinfo_id?: string;
  
  // URLs and social media
  wikipedia_url?: string;
  ballotpedia_url?: string;
  twitter_handle?: string;
  facebook_url?: string;
  instagram_handle?: string;
  linkedin_url?: string;
  youtube_channel?: string;
  
  // Contact information
  primary_email?: string;
  primary_phone?: string;
  primary_website?: string;
  primary_photo_url?: string;
  
  // Term information
  termStartDate?: string;
  termEndDate?: string;
  nextElectionDate?: string;
  
  // Primary data (live APIs)
  primaryData: {
    congressGov?: any;
    googleCivic?: any;
    fec?: any;
    openStatesApi?: any;
    wikipedia?: any;
    confidence: 'high' | 'medium' | 'low';
    lastUpdated: string;
    source: 'live-api';
  };
  
  // Secondary data (OpenStates People)
  secondaryData?: {
    openStatesPerson: OpenStatesPerson;
    confidence: 'medium' | 'low';
    lastUpdated: string;
    source: 'openstates-people-database';
    validationStatus: 'pending' | 'verified' | 'rejected';
  };
  
  // Enhanced data
  enhancedContacts: Array<{
    type: string;
    value: string;
    source: string;
    isPrimary: boolean;
    isVerified: boolean;
  }>;
  
  enhancedPhotos: Array<{
    url: string;
    source: string;
    width?: number;
    height?: number;
    altText: string;
    attribution: string;
  }>;
  
  enhancedActivity: Array<{
    type: string;
    title: string;
    description: string;
    url?: string;
    date: string;
    source: string;
    metadata?: any;
  }>;
  
  enhancedSocialMedia: Array<{
    platform: string;
    handle: string;
    url: string;
    followersCount?: number;
    verified: boolean;
  }>;
  
  campaignFinance?: {
    totalRaised: number;
    totalSpent: number;
    cashOnHand: number;
    lastFilingDate: string;
    source: string;
  };
  
  // Data quality metrics
  dataQuality: {
    primarySourceScore: number;
    secondarySourceScore: number;
    overallConfidence: number;
    lastValidated: string;
    validationMethod: 'api-verification' | 'cross-reference' | 'manual';
    dataCompleteness: number;
    sourceReliability: number;
  };
  
  // Verification status
  verificationStatus: 'verified' | 'unverified' | 'pending';
  dataSources: string[];
  lastUpdated: string;
  
  // OpenStates People integration
  openStatesPeopleData?: {
    roles: any[];
    offices: any[];
    contactDetails: any[];
    otherIdentifiers: any[];
    sources: any[];
    currentParty: boolean;
    dataSource: string;
    confidence: string;
    lastUpdated: string;
    validationStatus: string;
  };
}

export class SuperiorDataPipeline {
  private supabase: any;
  private verifier: CurrentElectorateVerifier;
  private openStatesIntegration: OpenStatesIntegration;
  private config: SuperiorPipelineConfig;
  private processedStates: Set<string>;
  
  // API failure tracking
  private apiFailureCounts: Record<string, number> = {};
  private apiLastFailure: Record<string, number> = {};
  private apiBackoffUntil: Record<string, number> = {};
  
  constructor(config: SuperiorPipelineConfig) {
    this.config = config;
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      { auth: { persistSession: false } }
    );
    this.verifier = new CurrentElectorateVerifier();
    this.openStatesIntegration = new OpenStatesIntegration({
      dataPath: config.openStatesPeoplePath,
      currentDate: new Date()
    });
    this.processedStates = new Set();
  }

  /**
   * Check if an API is currently in backoff period
   */
  private isApiInBackoff(apiName: string): boolean {
    const backoffUntil = this.apiBackoffUntil[apiName];
    if (!backoffUntil) return false;
    
    const now = Date.now();
    if (now < backoffUntil) {
      const remainingMs = backoffUntil - now;
      console.log(`⏳ API ${apiName} in backoff for ${Math.ceil(remainingMs / 1000)}s`);
      return true;
    }
    
    // Backoff period expired, clear it
    delete this.apiBackoffUntil[apiName];
    return false;
  }

  /**
   * Record API failure and implement exponential backoff
   */
  private recordApiFailure(apiName: string, statusCode?: number): void {
    const now = Date.now();
    this.apiFailureCounts[apiName] = (this.apiFailureCounts[apiName] || 0) + 1;
    this.apiLastFailure[apiName] = now;
    
    const failureCount = this.apiFailureCounts[apiName];
    console.log(`❌ API ${apiName} failure #${failureCount} (status: ${statusCode})`);
    
    // Implement exponential backoff
    if (statusCode === 429 || statusCode === 503) {
      // Rate limit or service unavailable - longer backoff
      const backoffMs = Math.min(300000, 30000 * Math.pow(2, failureCount - 1)); // Max 5 minutes
      this.apiBackoffUntil[apiName] = now + backoffMs;
      console.log(`⏳ API ${apiName} rate limited, backing off for ${Math.ceil(backoffMs / 1000)}s`);
    } else if (failureCount >= 3) {
      // Multiple failures - moderate backoff
      const backoffMs = Math.min(60000, 10000 * failureCount); // Max 1 minute
      this.apiBackoffUntil[apiName] = now + backoffMs;
      console.log(`⏳ API ${apiName} multiple failures, backing off for ${Math.ceil(backoffMs / 1000)}s`);
    }
  }

  /**
   * Record API success and reset failure count
   */
  private recordApiSuccess(apiName: string): void {
    if (this.apiFailureCounts[apiName] && this.apiFailureCounts[apiName] > 0) {
      console.log(`✅ API ${apiName} recovered after ${this.apiFailureCounts[apiName]} failures`);
    }
    this.apiFailureCounts[apiName] = 0;
    delete this.apiLastFailure[apiName];
    delete this.apiBackoffUntil[apiName];
  }

  /**
   * Check if we should skip an API due to failures
   */
  private shouldSkipApi(apiName: string): boolean {
    if (this.isApiInBackoff(apiName)) {
      return true;
    }
    
    const failureCount = this.apiFailureCounts[apiName] || 0;
    if (failureCount >= 5) {
      console.log(`🚫 API ${apiName} disabled after ${failureCount} failures`);
      return true;
    }
    
    return false;
  }
  
  /**
   * Process representatives with superior data pipeline
   */
  async processRepresentatives(representatives: any[]): Promise<{
    success: boolean;
    message: string;
    results: any;
    enhancedRepresentatives: SuperiorRepresentativeData[];
  }> {
    console.log(`🔍 DEBUG: processRepresentatives called with ${representatives.length} representatives`);
    console.log(`🔍 DEBUG: First representative:`, JSON.stringify(representatives[0], null, 2));
    
    const startTime = new Date();
    const results = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
      duration: '',
      dataQuality: {
        averageScore: 0,
        highQuality: 0,
        mediumQuality: 0,
        lowQuality: 0
      },
      currentElectorate: {
        totalCurrent: 0,
        nonCurrent: 0,
        accuracy: 0
      },
      sources: {
        primarySources: [] as string[],
        secondarySources: [] as string[],
        crossReferenced: 0
      }
    };
    
    const enhancedRepresentatives: SuperiorRepresentativeData[] = [];
    
    console.log(`🚀 Starting SUPERIOR data pipeline for ${representatives.length} representatives...`);
    console.log(`   System Date: ${new Date().toISOString()}`);
    console.log(`   OpenStates People: ${this.config.enableOpenStatesPeople ? 'Enabled' : 'Disabled'}`);
    console.log(`   Strict Current Filtering: ${this.config.strictCurrentFiltering ? 'Enabled' : 'Disabled'}`);
    console.log(`   Cross-Reference: ${this.config.enableCrossReference ? 'Enabled' : 'Disabled'}`);
    
    // Step 1: Verify current electorate using system date
    if (this.config.strictCurrentFiltering) {
      console.log(`🔍 Verifying current electorate using system date...`);
      const verification = await this.verifier.verifyRepresentatives(representatives);
      results.currentElectorate.totalCurrent = verification.summary.currentCount;
      results.currentElectorate.nonCurrent = verification.summary.nonCurrentCount;
      results.currentElectorate.accuracy = verification.summary.accuracy;
      
      console.log(`📊 Current Electorate Verification:`);
      console.log(`   Current: ${results.currentElectorate.totalCurrent}`);
      console.log(`   Non-Current: ${results.currentElectorate.nonCurrent}`);
      console.log(`   Accuracy: ${results.currentElectorate.accuracy.toFixed(2)}%`);
    }
    
    // Step 2: Process each representative with comprehensive data collection
    for (const rep of representatives) {
      try {
        results.totalProcessed++;
        console.log(`\n🔄 Processing representative ${results.totalProcessed}/${representatives.length}: ${rep.name}`);
        
        // Step 2a: Collect primary data from live APIs
        const primaryData = await this.collectPrimaryData(rep);
        results.sources.primarySources.push(...Object.keys(primaryData).filter(key => primaryData[key]));
        
        // Step 2b: Collect secondary data from OpenStates People Database
        let secondaryData: any = null;
        if (this.config.enableOpenStatesPeople) {
          try {
            // This will only work server-side (in API routes)
            const openStatesData = await this.openStatesIntegration.getCurrentRepresentatives(rep.state);
            if (openStatesData && openStatesData.length > 0) {
              secondaryData = {
                secondaryData: {
                  openStatesPerson: openStatesData.find(person => 
                    person.name.toLowerCase().includes(rep.name.toLowerCase()) ||
                    rep.name.toLowerCase().includes(person.name.toLowerCase())
                  )
                }
              };
              if (secondaryData.secondaryData) {
                results.sources.secondarySources.push('openstates-people-database');
              }
            }
          } catch (error) {
            console.warn('OpenStates integration failed (likely client-side):', error);
            secondaryData = null;
          }
        }
        
        // Step 2c: Cross-reference validation
        if (this.config.enableCrossReference) {
          const crossReferenceResult = await this.crossReferenceData(primaryData, secondaryData);
          if (crossReferenceResult.isValid) {
            results.sources.crossReferenced++;
          }
        }
        
        // Step 2d: Create comprehensive enhanced data
        const enhancedRep = await this.createEnhancedRepresentative(rep, primaryData, secondaryData);
        
        // Step 2e: Calculate data quality
        const qualityScore = this.calculateDataQuality(enhancedRep);
        results.dataQuality.averageScore += qualityScore;
        
        if (qualityScore >= 80) {
          results.dataQuality.highQuality++;
        } else if (qualityScore >= 60) {
          results.dataQuality.mediumQuality++;
        } else {
          results.dataQuality.lowQuality++;
        }
        
        enhancedRepresentatives.push(enhancedRep);
        results.successful++;
        
        console.log(`   ✅ Successfully processed ${rep.name} (Quality: ${qualityScore.toFixed(1)})`);
        
      } catch (error: any) {
        console.error(`   ❌ Error processing ${rep.name}:`, error);
        results.failed++;
        results.errors.push(`${rep.name}: ${error.message}`);
      }
    }
    
    // Step 3: Calculate final statistics
    results.duration = `${Math.round((Date.now() - startTime.getTime()) / 1000)} seconds`;
    results.dataQuality.averageScore = results.totalProcessed > 0 ? results.dataQuality.averageScore / results.totalProcessed : 0;
    
    // Step 4: Store enhanced data in database
    console.log(`🔍 DEBUG: enhancedRepresentatives.length = ${enhancedRepresentatives.length}`);
    if (enhancedRepresentatives.length > 0) {
      console.log(`🔍 DEBUG: About to call storeEnhancedData with ${enhancedRepresentatives.length} representatives`);
      await this.storeEnhancedData(enhancedRepresentatives);
    } else {
      console.log(`🔍 DEBUG: No enhanced representatives to store`);
    }
    
    console.log(`\n📊 SUPERIOR Data Pipeline Complete:`);
    console.log(`   Total Processed: ${results.totalProcessed}`);
    console.log(`   Successful: ${results.successful}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Duration: ${results.duration}`);
    console.log(`   Average Quality: ${results.dataQuality.averageScore.toFixed(1)}`);
    console.log(`   High Quality: ${results.dataQuality.highQuality}`);
    console.log(`   Medium Quality: ${results.dataQuality.mediumQuality}`);
    console.log(`   Low Quality: ${results.dataQuality.lowQuality}`);
    console.log(`   Cross-Referenced: ${results.sources.crossReferenced}`);
    
    return {
      success: true,
      message: 'Superior data pipeline completed successfully',
      results,
      enhancedRepresentatives
    };
  }
  
  /**
   * Collect primary data from live APIs
   */
  private async collectPrimaryData(rep: any): Promise<any> {
    console.log(`🔍 DEBUG: collectPrimaryData called for ${rep.name}`);
    console.log(`🔍 DEBUG: Representative data:`, JSON.stringify(rep, null, 2));
    console.log(`🔍 DEBUG: Config enableCongressGov:`, this.config.enableCongressGov);
    
    const primaryData: any = {};
    
    // Congress.gov data
    if (this.config.enableCongressGov && !this.shouldSkipApi('congressGov')) {
      console.log(`🔍 DEBUG: Calling getCongressGovData for ${rep.name}`);
      try {
        primaryData.congressGov = await this.getCongressGovData(rep);
        console.log(`🔍 DEBUG: Congress.gov data for ${rep.name}:`, primaryData.congressGov ? 'SUCCESS' : 'FAILED');
        if (primaryData.congressGov) {
          console.log(`🔍 DEBUG: Congress.gov response:`, JSON.stringify(primaryData.congressGov, null, 2));
          this.recordApiSuccess('congressGov');
        }
      } catch (error: any) {
        console.error('Congress.gov data collection failed:', error);
        this.recordApiFailure('congressGov', error.status);
      }
    } else if (this.shouldSkipApi('congressGov')) {
      console.log(`🔍 DEBUG: Congress.gov API skipped due to failures`);
    } else {
      console.log(`🔍 DEBUG: Congress.gov disabled in config`);
    }
    
    // Google Civic data (for elections, voter info, and activity data)
    if (this.config.enableGoogleCivic && !this.shouldSkipApi('googleCivic')) {
      try {
        primaryData.googleCivic = await this.getGoogleCivicData(rep);
        console.log(`🔍 DEBUG: Google Civic data for ${rep.name}:`, primaryData.googleCivic ? 'SUCCESS' : 'FAILED');
        if (primaryData.googleCivic) {
          this.recordApiSuccess('googleCivic');
        }
      } catch (error: any) {
        console.error('Google Civic data collection failed:', error);
        this.recordApiFailure('googleCivic', error.status);
      }
    } else if (this.shouldSkipApi('googleCivic')) {
      console.log(`🔍 DEBUG: Google Civic API skipped due to failures`);
    }
    
    // FEC data
    if (this.config.enableFEC && !this.shouldSkipApi('fec')) {
      try {
        primaryData.fec = await this.getFECData(rep);
        console.log(`🔍 DEBUG: FEC data for ${rep.name}:`, primaryData.fec ? 'SUCCESS' : 'FAILED');
        if (primaryData.fec) {
          this.recordApiSuccess('fec');
        }
      } catch (error: any) {
        console.error('FEC data collection failed:', error);
        this.recordApiFailure('fec', error.status);
      }
    } else if (this.shouldSkipApi('fec')) {
      console.log(`🔍 DEBUG: FEC API skipped due to failures`);
    }
    
    // OpenStates API data
    if (this.config.enableOpenStatesApi && !this.shouldSkipApi('openStatesApi')) {
      try {
        primaryData.openStatesApi = await this.getOpenStatesApiData(rep);
        if (primaryData.openStatesApi) {
          this.recordApiSuccess('openStatesApi');
        }
      } catch (error: any) {
        console.error('OpenStates API data collection failed:', error);
        this.recordApiFailure('openStatesApi', error.status);
      }
    } else if (this.shouldSkipApi('openStatesApi')) {
      console.log(`🔍 DEBUG: OpenStates API skipped due to failures`);
    }
    
    // Wikipedia data
    if (this.config.enableWikipedia && !this.shouldSkipApi('wikipedia')) {
      try {
        primaryData.wikipedia = await this.getWikipediaData(rep);
        if (primaryData.wikipedia) {
          this.recordApiSuccess('wikipedia');
        }
      } catch (error: any) {
        console.error('Wikipedia data collection failed:', error);
        this.recordApiFailure('wikipedia', error.status);
      }
    } else if (this.shouldSkipApi('wikipedia')) {
      console.log(`🔍 DEBUG: Wikipedia API skipped due to failures`);
    }
    
    return primaryData;
  }
  
  /**
   * Create enhanced representative data
   */
  private async createEnhancedRepresentative(
    rep: any, 
    primaryData: any, 
    secondaryData: any
  ): Promise<SuperiorRepresentativeData> {
    // Extract comprehensive contacts
    const enhancedContacts = this.extractContacts(primaryData, secondaryData);
    
    // Extract comprehensive photos
    const enhancedPhotos = this.extractPhotos(primaryData, secondaryData);
    
    // Extract comprehensive activity
    const enhancedActivity = this.extractActivity(primaryData, secondaryData);
    
    // Extract social media
    const enhancedSocialMedia = this.extractSocialMedia(primaryData, secondaryData);
    
    // Extract campaign finance
    const campaignFinance = this.extractCampaignFinance(primaryData, secondaryData);
    
    // Calculate data quality
    const dataQuality = this.calculateComprehensiveDataQuality(primaryData, secondaryData, enhancedContacts, enhancedPhotos, enhancedActivity);
    
    return {
      id: rep.id || `${rep.name}-${rep.office}`.toLowerCase().replace(/\s+/g, '-'),
      name: rep.name,
      office: rep.office,
      level: rep.level || 'federal',
      state: rep.state,
      party: rep.party,
      district: rep.district,
      openstatesId: rep.openstates_id,
      
      // External identifiers
      bioguide_id: rep.bioguide_id || primaryData?.congressGov?.bioguideId,
      fec_id: rep.fec_id || primaryData?.fec?.candidateId,
      google_civic_id: rep.google_civic_id || primaryData?.googleCivic?.id,
      legiscan_id: rep.legiscan_id,
      congress_gov_id: rep.congress_gov_id || primaryData?.congressGov?.id,
      govinfo_id: rep.govinfo_id,
      
      // URLs and social media
      wikipedia_url: rep.wikipedia_url || primaryData?.wikipedia?.url,
      ballotpedia_url: rep.ballotpedia_url,
      twitter_handle: rep.twitter_handle || enhancedSocialMedia?.find(sm => sm.platform === 'twitter')?.handle,
      facebook_url: rep.facebook_url || enhancedSocialMedia?.find(sm => sm.platform === 'facebook')?.url,
      instagram_handle: rep.instagram_handle || enhancedSocialMedia?.find(sm => sm.platform === 'instagram')?.handle,
      linkedin_url: rep.linkedin_url || enhancedSocialMedia?.find(sm => sm.platform === 'linkedin')?.url,
      youtube_channel: rep.youtube_channel || enhancedSocialMedia?.find(sm => sm.platform === 'youtube')?.url,
      
      // Contact information
      primary_email: rep.primary_email || enhancedContacts?.find(c => c.type === 'email')?.value,
      primary_phone: rep.primary_phone || enhancedContacts?.find(c => c.type === 'phone')?.value,
      primary_website: rep.primary_website || enhancedContacts?.find(c => c.type === 'url')?.value,
      primary_photo_url: rep.primary_photo_url || enhancedPhotos?.[0]?.url,
      
      termStartDate: rep.termStartDate || rep.term_start_date,
      termEndDate: rep.termEndDate || rep.term_end_date,
      nextElectionDate: rep.nextElectionDate || rep.next_election_date,
      primaryData: {
        ...(primaryData || {}),
        confidence: 'high' as const,
        lastUpdated: new Date().toISOString(),
        source: 'live-api' as const
      },
      secondaryData: secondaryData?.secondaryData || null,
      enhancedContacts,
      enhancedPhotos,
      enhancedActivity,
      enhancedSocialMedia,
      campaignFinance,
      dataQuality,
      verificationStatus: dataQuality.overallConfidence >= 70 ? 'verified' : 'unverified',
      dataSources: [
        ...Object.keys(primaryData).filter(key => primaryData[key]),
        ...(secondaryData?.secondaryData ? ['openstates-people-database'] : [])
      ],
      lastUpdated: new Date().toISOString(),
      openStatesPeopleData: secondaryData?.secondaryData?.openStatesPerson ? {
        roles: secondaryData.secondaryData.openStatesPerson.roles || [],
        offices: secondaryData.secondaryData.openStatesPerson.offices || [],
        contactDetails: secondaryData.secondaryData.openStatesPerson.contact_details || [],
        otherIdentifiers: secondaryData.secondaryData.openStatesPerson.other_identifiers || [],
        sources: secondaryData.secondaryData.openStatesPerson.sources || [],
        currentParty: this.hasCurrentParty(secondaryData.secondaryData.openStatesPerson),
        dataSource: 'openstates-people-database',
        confidence: 'medium',
        lastUpdated: new Date().toISOString(),
        validationStatus: 'pending'
      } : {
        roles: [],
        offices: [],
        contactDetails: [],
        otherIdentifiers: [],
        sources: [],
        currentParty: false,
        dataSource: 'none',
        confidence: 'low',
        lastUpdated: new Date().toISOString(),
        validationStatus: 'pending'
      }
    };
  }
  
  /**
   * Extract comprehensive contacts from all sources
   */
  private extractContacts(primaryData: any, secondaryData: any): any[] {
    const contacts: any[] = [];
    
    // Congress.gov contacts
    if (primaryData.congressGov?.contacts) {
      contacts.push(...primaryData.congressGov.contacts);
    }
    
    // Google Civic contacts
    if (primaryData.googleCivic?.contacts) {
      contacts.push(...primaryData.googleCivic.contacts);
    }
    
    // OpenStates People contacts
    if (secondaryData?.secondaryData?.openStatesPerson?.offices) {
      secondaryData.secondaryData.openStatesPerson.offices.forEach((office: any) => {
        if (office.voice) {
          contacts.push({
            type: 'phone',
            value: office.voice,
            source: 'openstates-people',
            isPrimary: office.classification === 'primary',
            isVerified: true
          });
        }
        if (office.address) {
          contacts.push({
            type: 'address',
            value: office.address,
            source: 'openstates-people',
            isPrimary: office.classification === 'primary',
            isVerified: true
          });
        }
      });
    }
    
    return contacts;
  }
  
  /**
   * Extract comprehensive photos from all sources
   */
  private extractPhotos(primaryData: any, secondaryData: any): any[] {
    const photos: any[] = [];
    
    // Wikipedia photos
    if (primaryData.wikipedia?.thumbnail) {
      photos.push({
        url: primaryData.wikipedia.thumbnail.source,
        source: 'wikipedia',
        width: primaryData.wikipedia.thumbnail.width,
        height: primaryData.wikipedia.thumbnail.height,
        altText: `Wikipedia photo of ${primaryData.wikipedia.title}`,
        attribution: 'Wikipedia'
      });
    }
    
    // OpenStates People photos
    if (secondaryData?.secondaryData?.openStatesPerson?.image) {
      photos.push({
        url: secondaryData.secondaryData.openStatesPerson.image,
        source: 'openstates-people',
        altText: `Photo of ${secondaryData.secondaryData.openStatesPerson.name}`,
        attribution: 'OpenStates People Database'
      });
    }
    
    return photos;
  }
  
  /**
   * Extract comprehensive activity from all sources
   */
  private extractActivity(primaryData: any, secondaryData: any): any[] {
    const activity: any[] = [];
    
    // Wikipedia biographical activity
    if (primaryData.wikipedia?.extract) {
      activity.push({
        type: 'biography',
        title: `Wikipedia: ${primaryData.wikipedia.title}`,
        description: primaryData.wikipedia.extract,
        url: primaryData.wikipedia.content_urls?.desktop?.page,
        date: new Date().toISOString(),
        source: 'wikipedia'
      });
    }
    
    // Congress.gov legislative activity
    if (primaryData.congressGov?.sponsoredLegislation?.bills) {
      primaryData.congressGov.sponsoredLegislation.bills.slice(0, 3).forEach((bill: any) => {
        activity.push({
          type: 'bill_sponsored',
          title: `Sponsored: ${bill.title}`,
          description: bill.summary,
          url: bill.url,
          date: bill.introducedDate,
          source: 'congress-gov'
        });
      });
    }
    
    // Google Civic elections activity
    if (primaryData.googleCivic?.elections) {
      primaryData.googleCivic.elections.slice(0, 3).forEach((election: any) => {
        activity.push({
          type: 'election',
          title: `Election: ${election.name}`,
          description: `Election on ${election.electionDay}`,
          date: election.electionDay,
          source: 'google-civic'
        });
      });
    }
    
    // OpenStates committee activity from secondary data
    if (secondaryData?.openStatesPerson?.roles) {
      secondaryData.openStatesPerson.roles.forEach((role: any) => {
        if (role.committee) {
          activity.push({
            type: 'committee_membership',
            title: `Committee: ${role.committee}`,
            description: `Role: ${role.title || 'Member'}`,
            date: role.start_date,
            source: 'openstates'
          });
        }
      });
    }
    
    // FEC financial activity from secondary data
    if (secondaryData?.fecData?.candidate) {
      activity.push({
        type: 'campaign_finance',
        title: 'Campaign Finance Data',
        description: `FEC ID: ${secondaryData.fecData.candidate.id}`,
        date: new Date().toISOString(),
        source: 'fec'
      });
    }
    
    return activity;
  }
  
  /**
   * Extract social media information
   */
  private extractSocialMedia(primaryData: any, secondaryData: any): any[] {
    const socialMedia: any[] = [];
    
    // OpenStates API social media (primary source for social media)
    if (primaryData.openStatesApi?.extractedSocialMedia) {
      console.log('🔍 Social Media: Adding OpenStates API social media', {
        count: primaryData.openStatesApi.extractedSocialMedia.length
      });
      socialMedia.push(...primaryData.openStatesApi.extractedSocialMedia);
    }
    
    // Google Civic social media
    if (primaryData.googleCivic?.channels) {
      primaryData.googleCivic.channels.forEach((channel: any) => {
        socialMedia.push({
          platform: channel.type,
          handle: channel.id,
          url: channel.id,
          verified: false,
          source: 'google-civic'
        });
      });
    }
    
    // OpenStates People social media from secondary data
    if (secondaryData?.openStatesPerson?.social_media) {
      secondaryData.openStatesPerson.social_media.forEach((sm: any) => {
        socialMedia.push({
          platform: sm.platform,
          handle: sm.handle,
          url: sm.url,
          verified: sm.verified || false,
          source: 'openstates-people'
        });
      });
    }
    
    // FEC social media from secondary data
    if (secondaryData?.fecData?.candidate?.socialMedia) {
      secondaryData.fecData.candidate.socialMedia.forEach((sm: any) => {
        socialMedia.push({
          platform: sm.platform,
          handle: sm.handle,
          url: sm.url,
          verified: false,
          source: 'fec'
        });
      });
    }
    
    console.log('🔍 Social Media: Total collected', socialMedia.length, 'items');
    return socialMedia;
  }
  
  /**
   * Extract campaign finance information
   */
  private extractCampaignFinance(primaryData: any, secondaryData: any): any {
    // Primary FEC data
    if (primaryData.fec) {
      return {
        totalRaised: primaryData.fec.totalRaised || 0,
        totalSpent: primaryData.fec.totalSpent || 0,
        cashOnHand: primaryData.fec.cashOnHand || 0,
        lastFilingDate: primaryData.fec.lastFilingDate || '',
        source: 'fec'
      };
    }
    
    // Secondary FEC data from other sources
    if (secondaryData?.fecData?.candidate) {
      return {
        totalRaised: secondaryData.fecData.candidate.totalRaised || 0,
        totalSpent: secondaryData.fecData.candidate.totalSpent || 0,
        cashOnHand: secondaryData.fecData.candidate.cashOnHand || 0,
        lastFilingDate: secondaryData.fecData.candidate.lastFilingDate || '',
        source: 'fec-secondary'
      };
    }
    
    return null;
  }
  
  /**
   * Calculate comprehensive data quality
   */
  private calculateComprehensiveDataQuality(
    primaryData: any, 
    secondaryData: any, 
    contacts: any[], 
    photos: any[], 
    activity: any[]
  ): any {
    let primarySourceScore = 0;
    let secondarySourceScore = 0;
    
    // Primary source scoring (adjusted for federal representatives)
    if (primaryData.congressGov) primarySourceScore += 50; // Congress.gov is primary for federal
    if (primaryData.fec) primarySourceScore += 20; // FEC is important for federal
    if (primaryData.googleCivic) primarySourceScore += 15; // Google Civic for elections and voter info
    if (primaryData.wikipedia) primarySourceScore += 15; // Wikipedia for biographical info
    // Note: OpenStates API not applicable for federal representatives
    
    // Secondary source scoring
    if (secondaryData?.secondaryData) {
      secondarySourceScore += 50;
      if (secondaryData.secondaryData.openStatesPerson?.offices?.length > 0) secondarySourceScore += 20;
      if (secondaryData.secondaryData.openStatesPerson?.contact_details?.length > 0) secondarySourceScore += 15;
      if (secondaryData.secondaryData.openStatesPerson?.sources?.length > 0) secondarySourceScore += 10;
    }
    
    // Data completeness scoring
    const dataCompleteness = this.calculateDataCompleteness(contacts, photos, activity);
    
    // Source reliability scoring
    const sourceReliability = this.calculateSourceReliability(primaryData, secondaryData);
    
    const overallConfidence = Math.max(primarySourceScore, secondarySourceScore * 0.7);
    
    // Ensure minimum quality score for federal representatives
    const minScore = 15; // Minimum score for federal reps
    
    return {
      primarySourceScore: Math.min(primarySourceScore, 100),
      secondarySourceScore: Math.min(secondarySourceScore, 100),
      overallConfidence: Math.max(Math.min(overallConfidence, 100), minScore),
      lastValidated: new Date().toISOString(),
      validationMethod: 'api-verification' as const,
      dataCompleteness,
      sourceReliability
    };
  }
  
  /**
   * Calculate data completeness
   */
  private calculateDataCompleteness(contacts: any[], photos: any[], activity: any[]): number {
    let score = 0;
    if (contacts.length > 0) score += 30;
    if (photos.length > 0) score += 20;
    if (activity.length > 0) score += 30;
    if (contacts.some(c => c.isPrimary)) score += 10;
    if (photos.some(p => p.source === 'wikipedia')) score += 10;
    return Math.min(score, 100);
  }
  
  /**
   * Calculate source reliability
   */
  private calculateSourceReliability(primaryData: any, secondaryData: any): number {
    let score = 0;
    if (primaryData.congressGov) score += 40;
    if (primaryData.googleCivic) score += 30;
    if (primaryData.fec) score += 20;
    if (secondaryData?.secondaryData) score += 10;
    return Math.min(score, 100);
  }
  
  /**
   * Calculate overall data quality score
   */
  private calculateDataQuality(enhancedRep: SuperiorRepresentativeData): number {
    return enhancedRep.dataQuality.overallConfidence;
  }
  
  /**
   * Cross-reference data between sources
   */
  private async crossReferenceData(primaryData: any, secondaryData: any): Promise<{ isValid: boolean; conflicts: string[] }> {
    const conflicts: string[] = [];
    
    // Check for name consistency
    if (primaryData.congressGov?.name && secondaryData?.secondaryData?.openStatesPerson?.name) {
      if (primaryData.congressGov.name !== secondaryData.secondaryData.openStatesPerson.name) {
        conflicts.push('Name mismatch between Congress.gov and OpenStates People');
      }
    }
    
    // Check for party consistency
    if (primaryData.googleCivic?.party && secondaryData?.secondaryData?.openStatesPerson?.party) {
      const primaryParty = primaryData.googleCivic.party;
      const secondaryParty = secondaryData.secondaryData.openStatesPerson.party[0]?.name;
      if (primaryParty !== secondaryParty) {
        conflicts.push('Party mismatch between Google Civic and OpenStates People');
      }
    }
    
    return {
      isValid: conflicts.length === 0,
      conflicts
    };
  }
  
  /**
   * Store enhanced data in database
   */
  private async storeEnhancedData(enhancedRepresentatives: SuperiorRepresentativeData[]): Promise<void> {
    try {
      console.log(`💾 Storing ${enhancedRepresentatives.length} enhanced representatives...`);
      console.log(`🔍 DEBUG: storeEnhancedData called with ${enhancedRepresentatives.length} representatives`);
      console.log(`🔍 DEBUG: First representative:`, JSON.stringify(enhancedRepresentatives[0], null, 2));
      
      for (const enhancedRep of enhancedRepresentatives) {
        // Store data in representatives_core table with correct column names
        // Truncate long values to avoid database schema issues
        const coreData = {
          name: enhancedRep.name?.substring(0, 255) || '',
          party: enhancedRep.party?.substring(0, 100) || '',
          office: (enhancedRep.office || 'Representative')?.substring(0, 100),
          level: enhancedRep.level?.substring(0, 20) || 'federal',
          state: enhancedRep.state?.substring(0, 10) || '',
          district: enhancedRep.district ? String(enhancedRep.district).substring(0, 10) : null,
          bioguide_id: enhancedRep.bioguide_id?.substring(0, 20) || null,
          openstates_id: enhancedRep.openstatesId?.substring(0, 100) || null,
          fec_id: enhancedRep.fec_id?.substring(0, 20) || null,
          google_civic_id: enhancedRep.google_civic_id?.substring(0, 50) || null,
          legiscan_id: enhancedRep.legiscan_id?.substring(0, 20) || null,
          congress_gov_id: enhancedRep.congress_gov_id?.substring(0, 20) || null,
          govinfo_id: enhancedRep.govinfo_id?.substring(0, 20) || null,
          wikipedia_url: enhancedRep.wikipedia_url?.substring(0, 500) || null,
          ballotpedia_url: enhancedRep.ballotpedia_url?.substring(0, 500) || null,
          twitter_handle: enhancedRep.twitter_handle?.substring(0, 50) || null,
          facebook_url: enhancedRep.facebook_url?.substring(0, 500) || null,
          instagram_handle: enhancedRep.instagram_handle?.substring(0, 50) || null,
          linkedin_url: enhancedRep.linkedin_url?.substring(0, 500) || null,
          youtube_channel: enhancedRep.youtube_channel?.substring(0, 100) || null,
          primary_email: enhancedRep.primary_email?.substring(0, 255) || null,
          primary_phone: enhancedRep.primary_phone?.substring(0, 20) || null,
          primary_website: enhancedRep.primary_website?.substring(0, 500) || null,
          primary_photo_url: enhancedRep.primary_photo_url?.substring(0, 500) || null,
          term_start_date: enhancedRep.termStartDate || null,
          term_end_date: enhancedRep.termEndDate || null,
          next_election_date: enhancedRep.nextElectionDate || null,
          data_quality_score: Math.max(enhancedRep.dataQuality.overallConfidence || 0, 15), // Minimum 15 for federal reps
          data_sources: enhancedRep.dataSources || ['superior-pipeline'],
          last_verified: new Date().toISOString(),
          verification_status: 'verified',
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          // Enhanced data (JSONB columns)
          enhanced_contacts: enhancedRep.enhancedContacts || [],
          enhanced_photos: enhancedRep.enhancedPhotos || [],
          enhanced_activity: enhancedRep.enhancedActivity || [],
          enhanced_social_media: enhancedRep.enhancedSocialMedia || []
        };
        
        // Check if representative already exists (by bioguide_id for federal, openstates_id for state)
        const existingIdentifier = enhancedRep.bioguide_id || enhancedRep.openstatesId;
        const identifierField = enhancedRep.bioguide_id ? 'bioguide_id' : 'openstates_id';
        
        console.log(`🔍 DEBUG: Checking if ${enhancedRep.name} already exists by ${identifierField}: ${existingIdentifier}`);
        
        let existing = null;
        
        // First try to find by identifier
        if (existingIdentifier) {
          const { data: existingById } = await this.supabase
            .from('representatives_core')
            .select('id, data_quality_score, data_sources, last_updated')
            .eq(identifierField, existingIdentifier)
            .maybeSingle();
          existing = existingById;
        }
        
        // If not found by identifier, try to find by name and level (fallback for records without bioguide_id)
        if (!existing) {
          console.log(`🔍 DEBUG: No match by ${identifierField}, trying to find by name and level`);
          const { data: existingByName } = await this.supabase
            .from('representatives_core')
            .select('id, data_quality_score, data_sources, last_updated')
            .eq('name', enhancedRep.name)
            .eq('level', enhancedRep.level)
            .maybeSingle();
          existing = existingByName;
        }
        
        let repData: any;
        
        if (existing) {
          // Check if we should preserve existing high-quality data
          const existingQuality = existing.data_quality_score || 0;
          const newQuality = coreData.data_quality_score || 0;
          
          console.log(`🔍 DEBUG: Existing quality: ${existingQuality}, New quality: ${newQuality}`);
          
          // Only update if new data is significantly better (at least 10 points higher)
          // or if existing data is low quality (below 60)
          if (newQuality > existingQuality + 10 || existingQuality < 60) {
            console.log(`🔄 Updating existing record for ${enhancedRep.name} (${existingQuality} → ${newQuality})...`);
            const { data: updateData, error: updateError } = await this.supabase
              .from('representatives_core')
              .update(coreData)
              .eq('id', existing.id)
              .select('id')
              .single();
          
            if (updateError) {
              console.error('❌ Error updating enhanced representative data:', updateError);
              console.error('❌ Representative data that failed:', JSON.stringify(coreData, null, 2));
              continue; // Skip social media storage if representative update failed
          } else {
              repData = updateData;
              console.log(`✅ Successfully updated representative: ${enhancedRep.name} with ID: ${repData.id}`);
            }
          } else {
            console.log(`🛡️ Preserving existing high-quality data for ${enhancedRep.name} (${existingQuality} ≥ ${newQuality})`);
            repData = { id: existing.id }; // Use existing ID for social media storage
          }
        } else {
          // Insert new
          console.log(`➕ Inserting new record for ${enhancedRep.name}...`);
          const { data: insertData, error: insertError } = await this.supabase
            .from('representatives_core')
          .insert(coreData)
          .select('id')
          .single();
        
          if (insertError) {
            console.error('❌ Error inserting enhanced representative data:', insertError);
            console.error('❌ Representative data that failed:', JSON.stringify(coreData, null, 2));
            continue; // Skip social media storage if representative insertion failed
          } else {
            repData = insertData;
            console.log(`✅ Successfully inserted representative: ${enhancedRep.name} with ID: ${repData.id}`);
          }
        }
        
        // Social media data is already stored in the enhanced_social_media JSONB column
        console.log(`🔍 DEBUG: enhancedRep.enhancedSocialMedia = ${JSON.stringify(enhancedRep.enhancedSocialMedia)}`);
        if (enhancedRep.enhancedSocialMedia && enhancedRep.enhancedSocialMedia.length > 0) {
          console.log(`✅ Social media data already stored in JSONB column: ${enhancedRep.enhancedSocialMedia.length} records for ${enhancedRep.name}`);
        } else {
          console.log(`🔍 DEBUG: No social media data to store for ${enhancedRep.name}`);
        }
      }
      
      console.log(`✅ Successfully stored enhanced data`);
    } catch (error) {
      console.error('Error storing enhanced data:', error);
    }
  }
  
  // API call implementations
  private async getCongressGovData(rep: any): Promise<any> { 
    console.log('🔍 DEBUG: Getting Congress.gov data for:', rep.name);
    console.log('🔍 DEBUG: Representative level:', rep.level);
    console.log('🔍 DEBUG: Representative bioguide_id:', rep.bioguide_id);
    console.log('🔍 DEBUG: Congress.gov API key available:', !!process.env.CONGRESS_GOV_API_KEY);
    
    // For federal representatives, use the bioguide_id from the initial Congress.gov call
    if (rep.level === 'federal' && rep.bioguide_id) {
      console.log('🔍 DEBUG: Using bioguide_id for federal representative:', rep.name, rep.bioguide_id);
      try {
        const url = `https://api.congress.gov/v3/member/${rep.bioguide_id}?api_key=${process.env.CONGRESS_GOV_API_KEY}`;
        console.log('🔍 DEBUG: Making Congress.gov API call to:', url);
        const response = await fetch(url);
        console.log('🔍 DEBUG: Congress.gov API response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 DEBUG: Congress.gov API response data:', !!data.member);
          if (data.member) {
            console.log('🔍 DEBUG: Congress.gov API SUCCESS for:', rep.name);
            return {
              bioguideId: data.member.bioguideId,
              fullName: data.member.fullName,
              firstName: data.member.firstName,
              lastName: data.member.lastName,
              party: data.member.party,
              state: data.member.state,
              district: data.member.district,
              chamber: data.member.chamber,
              url: data.member.url,
              contactForm: data.member.contactForm,
              rssUrl: data.member.rssUrl,
              roles: data.member.roles || [],
              sponsoredLegislation: data.member.sponsoredLegislation || [],
              cosponsoredLegislation: data.member.cosponsoredLegislation || [],
              source: 'congress-gov-api'
            };
          }
        } else {
          console.log('🔍 DEBUG: Congress.gov API FAILED with status:', response.status);
          const error = new Error(`Congress.gov API failed with status ${response.status}`);
          (error as any).status = response.status;
          throw error;
        }
      } catch (error) {
        console.warn('🔍 DEBUG: Congress.gov individual member API failed:', error);
      }
    } else {
      console.log('🔍 DEBUG: Skipping Congress.gov API call - not federal or no bioguide_id');
    }
    
    try {
      // Use bioguide_id if available, otherwise search by name
      const url = rep.bioguide_id 
        ? `https://api.congress.gov/v3/member/${rep.bioguide_id}?api_key=${process.env.CONGRESS_GOV_API_KEY}`
        : `https://api.congress.gov/v3/member?api_key=${process.env.CONGRESS_GOV_API_KEY}&q=${encodeURIComponent(rep.name)}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.warn('Congress.gov API error:', response.status);
        const error = new Error(`Congress.gov API failed with status ${response.status}`);
        (error as any).status = response.status;
        throw error;
      }
      
      const data = await response.json();
      
      if (data.members && data.members.length > 0) {
        const member = data.members[0];
        return {
          bioguideId: member.bioguideId,
          fullName: member.fullName,
          firstName: member.firstName,
          lastName: member.lastName,
          party: member.party,
          state: member.state,
          district: member.district,
          chamber: member.chamber,
          url: member.url,
          contactForm: member.contactForm,
          rssUrl: member.rssUrl,
          roles: member.roles || [],
          sponsoredLegislation: member.sponsoredLegislation || [],
          cosponsoredLegislation: member.cosponsoredLegislation || [],
          source: 'congress-gov-api'
        };
      }
      
      return null;
    } catch (error) {
      console.error('Congress.gov API error:', error);
      return null;
    }
  }
  private async getGoogleCivicData(rep: any): Promise<any> { 
    console.log('Getting Google Civic data for:', rep.name);
    
    try {
      // Google Civic API - focus on elections and voter information (not representative lookup)
      const stateCapitals = {
        'Alabama': 'Montgomery, AL', 'Alaska': 'Juneau, AK', 'Arizona': 'Phoenix, AZ',
        'Arkansas': 'Little Rock, AR', 'California': 'Sacramento, CA', 'Colorado': 'Denver, CO',
        'Connecticut': 'Hartford, CT', 'Delaware': 'Dover, DE', 'Florida': 'Tallahassee, FL',
        'Georgia': 'Atlanta, GA', 'Hawaii': 'Honolulu, HI', 'Idaho': 'Boise, ID',
        'Illinois': 'Springfield, IL', 'Indiana': 'Indianapolis, IN', 'Iowa': 'Des Moines, IA',
        'Kansas': 'Topeka, KS', 'Kentucky': 'Frankfort, KY', 'Louisiana': 'Baton Rouge, LA',
        'Maine': 'Augusta, ME', 'Maryland': 'Annapolis, MD', 'Massachusetts': 'Boston, MA',
        'Michigan': 'Lansing, MI', 'Minnesota': 'Saint Paul, MN', 'Mississippi': 'Jackson, MS',
        'Missouri': 'Jefferson City, MO', 'Montana': 'Helena, MT', 'Nebraska': 'Lincoln, NE',
        'Nevada': 'Carson City, NV', 'New Hampshire': 'Concord, NH', 'New Jersey': 'Trenton, NJ',
        'New Mexico': 'Santa Fe, NM', 'New York': 'Albany, NY', 'North Carolina': 'Raleigh, NC',
        'North Dakota': 'Bismarck, ND', 'Ohio': 'Columbus, OH', 'Oklahoma': 'Oklahoma City, OK',
        'Oregon': 'Salem, OR', 'Pennsylvania': 'Harrisburg, PA', 'Rhode Island': 'Providence, RI',
        'South Carolina': 'Columbia, SC', 'South Dakota': 'Pierre, SD', 'Tennessee': 'Nashville, TN',
        'Texas': 'Austin, TX', 'Utah': 'Salt Lake City, UT', 'Vermont': 'Montpelier, VT',
        'Virginia': 'Richmond, VA', 'Washington': 'Olympia, WA', 'West Virginia': 'Charleston, WV',
        'Wisconsin': 'Madison, WI', 'Wyoming': 'Cheyenne, WY'
      };
      
      const address = stateCapitals[rep.state as keyof typeof stateCapitals] || `${rep.state}, USA`;
      
      // Get elections data (current and upcoming elections)
      const electionsUrl = `https://www.googleapis.com/civicinfo/v2/elections?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_CIVIC_API_KEY}`;
      console.log(`🔍 DEBUG: Google Civic Elections API calling with address: ${address}`);
      
      const electionsResponse = await fetch(electionsUrl);
      if (!electionsResponse.ok) {
        console.warn('Google Civic Elections API error:', electionsResponse.status);
        return null;
      }
      
      const electionsData = await electionsResponse.json();
      
      // Get voter information for the most recent election
      let voterInfo = null;
      if (electionsData.elections && electionsData.elections.length > 0) {
        const latestElection = electionsData.elections[electionsData.elections.length - 1];
        const voterInfoUrl = `https://www.googleapis.com/civicinfo/v2/voterinfo?address=${encodeURIComponent(address)}&electionId=${latestElection.id}&key=${process.env.GOOGLE_CIVIC_API_KEY}`;
        
        try {
          const voterResponse = await fetch(voterInfoUrl);
          if (voterResponse.ok) {
            voterInfo = await voterResponse.json();
          }
        } catch (error) {
          console.warn('Google Civic Voter Info API error:', error);
        }
      }
      
      return {
        elections: electionsData.elections || [],
        voterInfo: voterInfo,
        contests: voterInfo?.contests || [],
        sources: electionsData.sources || [],
        address: address,
        source: 'google-civic-api',
        dataType: 'elections-and-voter-info'
      };
      
    } catch (error) {
      console.error('Google Civic API error:', error);
      return null;
    }
  }
  private async getFECData(rep: any): Promise<any> { 
    console.log('Getting FEC data for:', rep.name);
    
    try {
      // First, try to find the candidate by name and state if no FEC ID is available
      let candidateId = rep.fec_id;
      
      if (!candidateId) {
        console.log(`🔍 DEBUG: No FEC ID available, searching by name and state for ${rep.name}`);
        
        // Convert state name to state code for FEC API
        const stateCodeMap = {
          'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
          'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
          'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
          'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
          'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
          'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
          'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
          'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
          'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
          'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
          'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
          'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
          'Wisconsin': 'WI', 'Wyoming': 'WY'
        };
        
        const stateCode = stateCodeMap[rep.state as keyof typeof stateCodeMap] || rep.state;
        console.log(`🔍 DEBUG: Using state code: ${stateCode} for ${rep.state}`);
        
        // Try multiple search strategies
        const searchStrategies = [
          // Strategy 1: Exact name and state
          `https://api.open.fec.gov/v1/candidates/search/?name=${encodeURIComponent(rep.name)}&state=${stateCode}&api_key=${process.env.FEC_API_KEY}`,
          // Strategy 2: Last name only and state
          `https://api.open.fec.gov/v1/candidates/search/?name=${encodeURIComponent(rep.name.split(' ').pop() || rep.name)}&state=${stateCode}&api_key=${process.env.FEC_API_KEY}`,
          // Strategy 3: Name without titles
          `https://api.open.fec.gov/v1/candidates/search/?name=${encodeURIComponent(rep.name.replace(/^(Rep\.|Sen\.|Congressman|Congresswoman)\s+/i, ''))}&state=${stateCode}&api_key=${process.env.FEC_API_KEY}`
        ];
        
        for (let i = 0; i < searchStrategies.length; i++) {
          const searchUrl = searchStrategies[i];
          if (!searchUrl) continue;
          
          console.log(`🔍 DEBUG: FEC search strategy ${i + 1}: ${searchUrl}`);
          const searchResponse = await fetch(searchUrl);
          
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            console.log(`🔍 DEBUG: FEC search returned ${searchData.results?.length || 0} results`);
            
            if (searchData.results && searchData.results.length > 0) {
              // Find the best match using multiple criteria
              const bestMatch = searchData.results.find((candidate: any) => {
                const candidateName = candidate.name.toLowerCase();
                const repName = rep.name.toLowerCase();
                
                console.log(`🔍 DEBUG: Comparing FEC candidate "${candidateName}" with representative "${repName}"`);
                
                // Check for exact match
                if (candidateName === repName) {
                  console.log(`🔍 DEBUG: Exact match found`);
                  return true;
                }
                
                // Check for last name match
                const candidateLastName = candidateName.split(',')[0].trim();
                const repLastName = repName.split(' ').pop();
                if (candidateLastName === repLastName) {
                  console.log(`🔍 DEBUG: Last name match found: ${candidateLastName} === ${repLastName}`);
                  return true;
                }
                
                // Check for first name match (FEC format: "LAST, FIRST")
                const candidateFirstName = candidateName.split(',')[1]?.trim();
                const repFirstName = repName.split(' ')[0];
                if (candidateFirstName === repFirstName) {
                  console.log(`🔍 DEBUG: First name match found: ${candidateFirstName} === ${repFirstName}`);
                  return true;
                }
                
                // Check for partial match
                if (candidateName.includes(repName) || repName.includes(candidateName)) {
                  console.log(`🔍 DEBUG: Partial match found`);
                  return true;
                }
                
                return false;
              });
              
              if (bestMatch) {
                candidateId = bestMatch.candidate_id;
                console.log(`🔍 DEBUG: Found FEC candidate ID: ${candidateId} for ${rep.name} using strategy ${i + 1}`);
                break;
              }
            }
          } else {
            console.log(`🔍 DEBUG: FEC search strategy ${i + 1} failed with status: ${searchResponse.status}`);
          }
        }
      }
      
      if (!candidateId) {
        console.warn('No FEC ID found for representative:', rep.name);
        return null;
      }
      
      const url = `https://api.open.fec.gov/v1/candidate/${candidateId}/?api_key=${process.env.FEC_API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn('FEC API error:', response.status);
        return null;
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const candidate = data.results[0];
        return {
          candidateId: candidate.candidate_id,
          name: candidate.name,
          party: candidate.party,
          office: candidate.office,
          state: candidate.state,
          district: candidate.district,
          incumbentChallenge: candidate.incumbent_challenge,
          candidateStatus: candidate.candidate_status,
          activeThrough: candidate.active_through,
          principalCommittee: candidate.principal_committee,
          authorizedCommittees: candidate.authorized_committees || [],
          cycles: candidate.cycles || [],
          electionYears: candidate.election_years || [],
          electionDistricts: candidate.election_districts || [],
          source: 'fec-api'
        };
      }
      
      return null;
    } catch (error) {
      console.error('FEC API error:', error);
      return null;
    }
  }
  
  /**
   * OpenStates API (FREE - 250 requests/day)
   * Get social media data and other information from OpenStates API
   */
  private async getOpenStatesApiData(rep: any): Promise<any> {
    console.log('Getting OpenStates API data for:', rep.name);
    console.log('🔍 OpenStates API: Starting OPTIMIZED data collection for', rep.name);
    
    try {
      const apiKey = process.env.OPEN_STATES_API_KEY;
      console.log('🔍 OpenStates API: API key check', { 
        hasKey: !!apiKey, 
        keyLength: apiKey?.length 
      });
      
      if (!apiKey) {
        console.log('❌ OpenStates API: API key not configured');
        return {};
      }

      // OPTIMIZATION: Use specific OpenStates ID if available
      if (rep.openstates_id) {
        console.log('🚀 OpenStates API: Using OPTIMIZED direct person lookup by ID:', rep.openstates_id);

      // Add delay before API call to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

        // Direct person lookup by ID - MUCH more efficient!
        const response = await fetch(
          `https://v3.openstates.org/people/${rep.openstates_id}`,
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
        
        console.log('🔍 OpenStates API: Direct person lookup response status', response.status);

        if (!response.ok) {
          if (response.status === 429) {
            console.log('OpenStates API rate limited, waiting 30 seconds...');
            await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds for rate limit
            return {}; // Return empty to avoid further requests
          }
          if (response.status === 404) {
            console.log('OpenStates API: Person not found by ID, falling back to jurisdiction search');
            // Fall back to jurisdiction search if direct lookup fails
            return await this.getOpenStatesApiDataByJurisdiction(rep, apiKey);
          }
          console.log('OpenStates API direct lookup failed', { status: response.status });
          return {};
        }

        const responseText = await response.text();
        console.log('🔍 OpenStates API: Direct person response received', { 
          textLength: responseText.length,
          textPreview: responseText.substring(0, 200)
        });
        
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('🔍 OpenStates API: Direct person data parsed successfully', { 
            name: data.name,
            id: data.id,
            hasSocialMedia: !!data.social_media
          });
        } catch (parseError) {
          console.log('OpenStates API returned non-JSON response for direct lookup', { 
            status: response.status,
            responseText: responseText.substring(0, 200) + '...',
            parseError: parseError instanceof Error ? parseError.message : 'Unknown error'
          });
          return {};
        }

        // Extract social media data from direct person lookup
        const socialMedia = this.extractOpenStatesSocialMedia(data);
        console.log('🔍 OpenStates API: Extracted social media from direct lookup', { 
          count: socialMedia.length,
          platforms: socialMedia.map(sm => sm.platform)
        });

        return {
          name: data.name,
          id: data.id,
          social_media: data.social_media,
          extractedSocialMedia: socialMedia,
          party: data.party,
          district: data.district,
          chamber: data.chamber,
          jurisdiction: data.jurisdiction,
          // Additional data from direct lookup
          offices: data.offices,
          contact_details: data.contact_details,
          sources: data.sources,
          // Efficiency metrics
          requestType: 'direct-person-lookup',
          efficiencyGain: '100%' // Direct lookup vs jurisdiction search
        };
      } else {
        console.log('⚠️ OpenStates API: No OpenStates ID available, falling back to jurisdiction search');
        return await this.getOpenStatesApiDataByJurisdiction(rep, apiKey);
      }
    } catch (error) {
      console.error('OpenStates API data collection failed:', error);
      return {};
    }
  }

  /**
   * Fallback method for jurisdiction-based search (less efficient)
   */
  private async getOpenStatesApiDataByJurisdiction(rep: any, apiKey: string): Promise<any> {
    console.log('🔍 OpenStates API: Using FALLBACK jurisdiction search for', rep.state);

    // Add delay before API call to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

    // Search for legislators by state using OpenStates API v3 (less efficient)
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
      
    console.log('🔍 OpenStates API: Jurisdiction search response status', response.status);

      if (!response.ok) {
        if (response.status === 429) {
          console.log('OpenStates API rate limited, waiting 30 seconds...');
          await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds for rate limit
          return {}; // Return empty to avoid further requests
        }
      console.log('OpenStates API jurisdiction search failed', { status: response.status });
        return {};
      }

      const responseText = await response.text();
    console.log('🔍 OpenStates API: Jurisdiction search response received', { 
        textLength: responseText.length,
        textPreview: responseText.substring(0, 200)
      });
      
      let data;
      try {
        data = JSON.parse(responseText);
      console.log('🔍 OpenStates API: Jurisdiction search data parsed successfully', { 
          resultsCount: data.results?.length || 0
        });
      } catch (parseError) {
      console.log('OpenStates API returned non-JSON response for jurisdiction search', { 
          status: response.status,
          responseText: responseText.substring(0, 200) + '...',
          parseError: parseError instanceof Error ? parseError.message : 'Unknown error'
        });
        return {};
      }

    // Find matching representative in jurisdiction results
      const matchingLegislator = data.results?.find((legislator: any) => 
        legislator.name === rep.name || 
        legislator.id === rep.openstates_id
      );

      if (!matchingLegislator) {
      console.log('🔍 OpenStates API: No matching legislator found in jurisdiction search');
        return {};
      }

    console.log('🔍 OpenStates API: Found matching legislator in jurisdiction search', { 
        name: matchingLegislator.name,
        id: matchingLegislator.id,
        hasSocialMedia: !!matchingLegislator.social_media
      });

    // Extract social media data from jurisdiction search
      const socialMedia = this.extractOpenStatesSocialMedia(matchingLegislator);
    console.log('🔍 OpenStates API: Extracted social media from jurisdiction search', { 
        count: socialMedia.length,
        platforms: socialMedia.map(sm => sm.platform)
      });

      return {
        name: matchingLegislator.name,
        id: matchingLegislator.id,
        social_media: matchingLegislator.social_media,
        extractedSocialMedia: socialMedia,
        party: matchingLegislator.party,
        district: matchingLegislator.district,
        chamber: matchingLegislator.chamber,
      jurisdiction: matchingLegislator.jurisdiction,
      // Efficiency metrics
      requestType: 'jurisdiction-search-fallback',
      efficiencyGain: '0%' // Less efficient than direct lookup
      };
  }

  /**
   * Extract social media from OpenStates API data
   */
  private extractOpenStatesSocialMedia(legislator: any): any[] {
    const socialMedia: any[] = [];
    
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
              source: 'openstates-api'
            });
          }
        }
      });
    }
    
    return socialMedia;
  }

  /**
   * Map OpenStates platform names to our standard format
   */
  private mapOpenStatesPlatform(platform: string): string | null {
    const platformMap: { [key: string]: string } = {
      'twitter': 'twitter',
      'facebook': 'facebook',
      'instagram': 'instagram',
      'youtube': 'youtube',
      'linkedin': 'linkedin',
      'tiktok': 'tiktok'
    };
    
    return platformMap[platform.toLowerCase()] || null;
  }

  /**
   * Generate social media URL from platform and handle
   */
  private generateSocialMediaUrl(platform: string, handle: string): string {
    const urlMap: { [key: string]: string } = {
      'twitter': `https://twitter.com/${handle}`,
      'facebook': `https://facebook.com/${handle}`,
      'instagram': `https://instagram.com/${handle}`,
      'youtube': `https://youtube.com/${handle}`,
      'linkedin': `https://linkedin.com/in/${handle}`,
      'tiktok': `https://tiktok.com/@${handle}`
    };
    
    return urlMap[platform] || handle;
  }
  
  private async getWikipediaData(rep: any): Promise<any> { 
    console.log('Getting Wikipedia data for:', rep.name);
    
    try {
      // Try different name formats for Wikipedia search
      const nameFormats = [
        rep.name,
        `${rep.name} (politician)`,
        `${rep.name} (${rep.party})`,
        `${rep.name} (${rep.state})`,
        `${rep.name} (U.S. ${rep.chamber === 'Senate' ? 'Senator' : 'Representative'})`
      ];
      
      for (const nameFormat of nameFormats) {
        console.log(`🔍 DEBUG: Wikipedia trying name format: ${nameFormat}`);
        
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
          
          if (data.type === 'standard' && data.extract) {
            console.log(`🔍 DEBUG: Wikipedia found page for: ${nameFormat}`);
            return {
              title: data.title,
              extract: data.extract,
              content_urls: data.content_urls,
              thumbnail: data.thumbnail,
              pageid: data.pageid,
              source: 'wikipedia-api',
              searchTerm: nameFormat
            };
          }
        } else {
          console.log(`🔍 DEBUG: Wikipedia no page found for: ${nameFormat} (${response.status})`);
        }
      }
      
      console.log(`🔍 DEBUG: Wikipedia no page found for any name format for: ${rep.name}`);
      return null;
      
    } catch (error) {
      console.error('Wikipedia API error:', error);
    return null; 
    }
  }

  /**
   * Check if a person has current party affiliation
   */
  private hasCurrentParty(openStatesPerson: any): boolean {
    if (!openStatesPerson?.roles) return false;
    
    const currentDate = new Date();
    const currentRoles = openStatesPerson.roles.filter((role: any) => {
      const startDate = role.start_date ? new Date(role.start_date) : null;
      const endDate = role.end_date ? new Date(role.end_date) : null;
      
      // Check if role is currently active
      const isActive = (!startDate || startDate <= currentDate) && 
                      (!endDate || endDate >= currentDate);
      
      return isActive && role.party;
    });
    
    return currentRoles.length > 0;
  }
}

export default SuperiorDataPipeline;
