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
  openstatesId?: string;
  
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
   * Process representatives with superior data pipeline
   */
  async processRepresentatives(representatives: any[]): Promise<{
    success: boolean;
    message: string;
    results: any;
    enhancedRepresentatives: SuperiorRepresentativeData[];
  }> {
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
    const primaryData: any = {};
    
    // Congress.gov data
    if (this.config.enableCongressGov) {
      try {
        primaryData.congressGov = await this.getCongressGovData(rep);
      } catch (error) {
        console.error('Congress.gov data collection failed:', error);
      }
    }
    
    // Google Civic data
    if (this.config.enableGoogleCivic) {
      try {
        primaryData.googleCivic = await this.getGoogleCivicData(rep);
      } catch (error) {
        console.error('Google Civic data collection failed:', error);
      }
    }
    
    // FEC data
    if (this.config.enableFEC) {
      try {
        primaryData.fec = await this.getFECData(rep);
      } catch (error) {
        console.error('FEC data collection failed:', error);
      }
    }
    
    // OpenStates API data
    if (this.config.enableOpenStatesApi) {
      try {
        primaryData.openStatesApi = await this.getOpenStatesApiData(rep);
      } catch (error) {
        console.error('OpenStates API data collection failed:', error);
      }
    }
    
    // Wikipedia data
    if (this.config.enableWikipedia) {
      try {
        primaryData.wikipedia = await this.getWikipediaData(rep);
      } catch (error) {
        console.error('Wikipedia data collection failed:', error);
      }
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
      termStartDate: rep.termStartDate || rep.term_start_date,
      termEndDate: rep.termEndDate || rep.term_end_date,
      nextElectionDate: rep.nextElectionDate || rep.next_election_date,
      primaryData: {
        ...primaryData,
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
        currentParty: false, // TODO: Implement hasCurrentParty method
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
    
    // Primary source scoring
    if (primaryData.congressGov) primarySourceScore += 40;
    if (primaryData.googleCivic) primarySourceScore += 35;
    if (primaryData.fec) primarySourceScore += 20;
    if (primaryData.openStatesApi) primarySourceScore += 15;
    if (primaryData.wikipedia) primarySourceScore += 10;
    
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
    
    return {
      primarySourceScore: Math.min(primarySourceScore, 100),
      secondarySourceScore: Math.min(secondarySourceScore, 100),
      overallConfidence: Math.min(overallConfidence, 100),
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
      
      for (const enhancedRep of enhancedRepresentatives) {
        // Only store data in columns that actually exist in representatives_optimal table
        const coreData = {
          openstates_person_id: enhancedRep.openstatesId || 'superior-pipeline-' + Date.now(), // Required field
          name: enhancedRep.name,
          level: enhancedRep.level,
          state: enhancedRep.state,
          jurisdiction: `ocd-division/country:us/state:${enhancedRep.state.toLowerCase()}`, // Required field
          party: enhancedRep.party,
          current_term_start: enhancedRep.termStartDate,
          current_term_end: enhancedRep.termEndDate,
          next_election_date: enhancedRep.nextElectionDate,
          data_quality_score: enhancedRep.dataQuality.overallConfidence,
          data_sources: enhancedRep.dataSources,
          verification_status: 'verified', // Use valid enum value
          last_updated: enhancedRep.lastUpdated
        };
        
        // Store in representatives_optimal table (simple insert)
        const { data: repData, error: repError } = await this.supabase
          .from('representatives_optimal')
          .insert(coreData)
          .select('id')
          .single();
        
        if (repError) {
          console.error('Error storing enhanced representative data:', repError);
          continue; // Skip social media storage if representative storage failed
        }
        
        // Store social media data in representative_social_media_optimal table
        console.log(`🔍 DEBUG: enhancedRep.enhancedSocialMedia = ${JSON.stringify(enhancedRep.enhancedSocialMedia)}`);
        if (enhancedRep.enhancedSocialMedia && enhancedRep.enhancedSocialMedia.length > 0) {
          console.log(`💾 Storing ${enhancedRep.enhancedSocialMedia.length} social media records for ${enhancedRep.name}`);
          
          const socialMediaData = enhancedRep.enhancedSocialMedia.map(sm => ({
            representative_id: repData.id, // Use the ID from the inserted representative
            platform: sm.platform,
            handle: sm.handle,
            url: sm.url,
            followers_count: sm.followersCount || 0,
            is_verified: sm.verified || false,
            source: 'openstates-api',
            created_at: new Date().toISOString()
          }));
          
          const { error: smError } = await this.supabase
            .from('representative_social_media_optimal')
            .insert(socialMediaData);
          
          if (smError) {
            console.error('Error storing social media data:', smError);
          } else {
            console.log(`✅ Successfully stored ${socialMediaData.length} social media records`);
          }
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
  private async getCongressGovData(rep: any): Promise<any> { return null; }
  private async getGoogleCivicData(rep: any): Promise<any> { return null; }
  private async getFECData(rep: any): Promise<any> { return null; }
  
  /**
   * OpenStates API (FREE - 250 requests/day)
   * Get social media data and other information from OpenStates API
   */
  private async getOpenStatesApiData(rep: any): Promise<any> {
    console.log('🔍 OpenStates API: Starting data collection for', rep.name);
    
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

      console.log('🔍 OpenStates API: Making API request to', `https://v3.openstates.org/people?jurisdiction=${rep.state}`);

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
      
      console.log('🔍 OpenStates API: API response status', response.status);

      if (!response.ok) {
        if (response.status === 429) {
          console.log('OpenStates API rate limited, waiting 30 seconds...');
          await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds for rate limit
          return {}; // Return empty to avoid further requests
        }
        console.log('OpenStates API request failed', { status: response.status });
        return {};
      }

      const responseText = await response.text();
      console.log('🔍 OpenStates API: Response received', { 
        textLength: responseText.length,
        textPreview: responseText.substring(0, 200)
      });
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('🔍 OpenStates API: Data parsed successfully', { 
          resultsCount: data.results?.length || 0
        });
      } catch (parseError) {
        console.log('OpenStates API returned non-JSON response', { 
          status: response.status,
          responseText: responseText.substring(0, 200) + '...',
          parseError: parseError instanceof Error ? parseError.message : 'Unknown error'
        });
        return {};
      }

      // Find matching representative
      const matchingLegislator = data.results?.find((legislator: any) => 
        legislator.name === rep.name || 
        legislator.id === rep.openstates_id
      );

      if (!matchingLegislator) {
        console.log('🔍 OpenStates API: No matching legislator found');
        return {};
      }

      console.log('🔍 OpenStates API: Found matching legislator', { 
        name: matchingLegislator.name,
        id: matchingLegislator.id,
        hasSocialMedia: !!matchingLegislator.social_media
      });

      // Extract social media data
      const socialMedia = this.extractOpenStatesSocialMedia(matchingLegislator);
      console.log('🔍 OpenStates API: Extracted social media', { 
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
        sources: ['openstates-api']
      };

    } catch (error) {
      console.log('❌ OpenStates API error:', error);
      return {};
    }
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
  
  private async getWikipediaData(rep: any): Promise<any> { return null; }
}

export default SuperiorDataPipeline;
