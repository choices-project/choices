/**
 * Superior Data Pipeline
 * 
 * Comprehensive integration system that combines multiple data sources to create
 * enhanced representative profiles with current electorate verification, data quality
 * scoring, and cross-referencing capabilities.
 * Updated to use normalized tables instead of JSONB columns.
 * 
 * @fileoverview Superior data pipeline with normalized table integration
 * @version 2.0.0
 * @since 2024-10-09
 * @updated 2025-10-25 - Updated to use normalized tables instead of JSONB
 * @feature SUPERIOR_DATA_PIPELINE
 * 
 * Features:
 * - Multi-source data integration (Congress.gov, FEC, OpenStates, Google Civic, Wikipedia)
 * - Current electorate verification with system date filtering
 * - Data quality scoring and validation
 * - Cross-referencing and deduplication
 * - Rate limiting and API failure handling
 * - Privacy-preserving data storage
 * - Normalized table integration for enhanced data structure
 */

import { createClient } from '@supabase/supabase-js';

import { CanonicalIdService } from './canonical-id-service';
import { CurrentElectorateVerifier } from './current-electorate-verifier';
import OpenStatesIntegration, { type OpenStatesPerson } from './openstates-integration';

// Logger functionality for backend
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data ? JSON.stringify(data, null, 2) : ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data ? JSON.stringify(data, null, 2) : ''),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '')
};

const devLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_MODE === 'true') {
    console.log(`[DEV] ${new Date().toISOString()}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

/**
 * Configuration for the Superior Data Pipeline
 * 
 * Controls data source integration, quality filtering, and performance settings
 * for the comprehensive representative data processing system.
 */
export interface SuperiorPipelineConfig {
  /** Data source integration settings */
  enableCongressGov: boolean;
  enableGoogleCivic: boolean;
  enableFEC: boolean;
  enableOpenStatesApi: boolean;
  enableOpenStatesPeople: boolean;
  enableWikipedia: boolean;
  
  /** Current electorate filtering settings */
  strictCurrentFiltering: boolean;
  systemDateVerification: boolean;
  excludeNonCurrent: string[];
  
  /** Data quality and validation settings */
  minimumQualityScore: number;
  enableCrossReference: boolean;
  enableDataValidation: boolean;
  
  /** Performance and concurrency settings */
  maxConcurrentRequests: number;
  rateLimitDelay: number;
  
  /** API rate limits (requests per day) */
  openStatesRateLimit: number; // 250/day
  congressGovRateLimit: number; // 5000/day
  fecRateLimit: number; // 1000/day
  googleCivicRateLimit: number; // 100000/day
  cacheResults: boolean;
  
  /** OpenStates People Database settings */
  openStatesPeoplePath: string;
  enableStateProcessing: boolean;
  enableMunicipalProcessing: boolean;
}

/**
 * Enhanced representative data structure with comprehensive information
 * 
 * Combines data from multiple sources with quality scoring and current
 * electorate verification for accurate representative profiles.
 */
export interface SuperiorRepresentativeData {
  /** Core identification fields */
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
  
  // Canonical ID system
  canonicalId?: string;
  crosswalkEntries?: any[];
  
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

/**
 * Superior Data Pipeline
 * 
 * Comprehensive data integration system that combines multiple sources to create
 * enhanced representative profiles with current electorate verification, data quality
 * scoring, and cross-referencing capabilities.
 * 
 * @class SuperiorDataPipeline
 * @version 2.0.0
 * @since 2024-10-08
 */
export class SuperiorDataPipeline {
  private supabase: any;
  private verifier: CurrentElectorateVerifier;
  private openStatesIntegration: OpenStatesIntegration;
  private canonicalIdService: CanonicalIdService;
  private config: SuperiorPipelineConfig;
  private processedStates: Set<string>;
  
  /** API failure tracking for rate limiting and backoff */
  private apiFailureCounts: Record<string, number> = {};
  private apiLastFailure: Record<string, number> = {};
  private apiBackoffUntil: Record<string, number> = {};
  
  /**
   * Initialize the Superior Data Pipeline
   * 
   * @param config - Pipeline configuration settings
   */
  constructor(config: SuperiorPipelineConfig) {
    this.config = config;
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    this.verifier = new CurrentElectorateVerifier();
    this.openStatesIntegration = new OpenStatesIntegration({
      dataPath: config.openStatesPeoplePath,
      currentDate: new Date()
    });
    this.canonicalIdService = new CanonicalIdService();
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
      devLog(`API ${apiName} in backoff for ${Math.ceil(remainingMs / 1000)}s`);
      return true;
    }
    
    // Backoff period expired, clear it
    delete this.apiBackoffUntil[apiName];
    return false;
  }

  /**
   * Convert state name to 2-character state code
   */
  private convertStateToCode(stateName: string): string {
    if (!stateName) return '';
    
    // If already a 2-character code, return as is
    if (stateName.length === 2) return stateName.toUpperCase();
    
    const stateCodeMap: Record<string, string> = {
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
    
    return stateCodeMap[stateName] || stateName.substring(0, 2).toUpperCase();
  }

  /**
   * Record API failure and implement exponential backoff
   */
  private recordApiFailure(apiName: string, statusCode?: number): void {
    const now = Date.now();
    this.apiFailureCounts[apiName] = (this.apiFailureCounts[apiName] || 0) + 1;
    this.apiLastFailure[apiName] = now;
    
    const failureCount = this.apiFailureCounts[apiName];
    devLog(`API ${apiName} failure #${failureCount} (status: ${statusCode})`);
    
    // Implement exponential backoff
    if (statusCode === 429 || statusCode === 503) {
      // Rate limit or service unavailable - longer backoff
      const backoffMs = Math.min(300000, 30000 * Math.pow(2, failureCount - 1)); // Max 5 minutes
      this.apiBackoffUntil[apiName] = now + backoffMs;
      devLog(`API ${apiName} rate limited, backing off for ${Math.ceil(backoffMs / 1000)}s`, { apiName, backoffMs });
    } else if (failureCount >= 3) {
      // Multiple failures - moderate backoff
      const backoffMs = Math.min(60000, 10000 * failureCount); // Max 1 minute
      this.apiBackoffUntil[apiName] = now + backoffMs;
      devLog(`API ${apiName} multiple failures, backing off for ${Math.ceil(backoffMs / 1000)}s`, { apiName, backoffMs });
    }
  }

  /**
   * Record API success and reset failure count
   */
  private recordApiSuccess(apiName: string): void {
    if (this.apiFailureCounts[apiName] && this.apiFailureCounts[apiName] > 0) {
      devLog(`API ${apiName} recovered after ${this.apiFailureCounts[apiName]} failures`);
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
      devLog(`API ${apiName} disabled after ${failureCount} failures`);
      return true;
    }
    
    return false;
  }

  /**
   * Process federal representatives
   */
  async processFederalRepresentatives(limit: number = 100): Promise<{
    totalProcessed: number;
    successful: number;
    failed: number;
    qualityMetrics?: {
      averageScore: number;
      highQualityCount: number;
    };
    processingTime?: number;
  }> {
    console.log(`🏛️ Processing federal representatives (limit: ${limit})`);
    
    const startTime = Date.now();
    
    try {
      // Fetch federal representatives from Congress.gov API
      const representatives = await this.fetchFederalRepresentatives(limit);
      console.log(`📊 Found ${representatives.length} federal representatives to process`);
      
      if (representatives.length === 0) {
        console.log('⚠️ No federal representatives found to process');
        return {
          totalProcessed: 0,
          successful: 0,
          failed: 0,
          processingTime: Date.now() - startTime
        };
      }
      
      const results = await this.processRepresentatives(representatives);
      
      return {
        totalProcessed: representatives.length,
        successful: results.results.successful,
        failed: results.results.failed,
        qualityMetrics: {
          averageScore: results.results.dataQuality.averageScore,
          highQualityCount: results.results.dataQuality.highQuality
        },
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Error processing federal representatives:', error);
      return {
        totalProcessed: 0,
        successful: 0,
        failed: 1,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Process state representatives
   */
  async processStateRepresentatives(limit: number = 100, state?: string): Promise<{
    totalProcessed: number;
    successful: number;
    failed: number;
    qualityMetrics?: {
      averageScore: number;
      highQualityCount: number;
    };
    processingTime?: number;
  }> {
    console.log(`🏛️ Processing state representatives (limit: ${limit}, state: ${state || 'all'})`);
    
    const startTime = Date.now();
    
    try {
      // Fetch state representatives from OpenStates
      const representatives = await this.fetchStateRepresentatives(limit, state);
      console.log(`📊 Found ${representatives.length} state representatives to process`);
      
      if (representatives.length === 0) {
        console.log('⚠️ No state representatives found to process');
        return {
          totalProcessed: 0,
          successful: 0,
          failed: 0,
          processingTime: Date.now() - startTime
        };
      }
      
      const results = await this.processRepresentatives(representatives);
      
      return {
        totalProcessed: representatives.length,
        successful: results.results.successful,
        failed: results.results.failed,
        qualityMetrics: {
          averageScore: results.results.dataQuality.averageScore,
          highQualityCount: results.results.dataQuality.highQuality
        },
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Error processing state representatives:', error);
      return {
        totalProcessed: 0,
        successful: 0,
        failed: 1,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Run testing suite
   */
  async runTestingSuite(): Promise<{
    totalProcessed: number;
    successful: number;
    failed: number;
    qualityMetrics?: {
      averageScore: number;
      highQualityCount: number;
    };
    processingTime?: number;
  }> {
    console.log('🧪 Running testing suite');
    
    const startTime = Date.now();
    
    try {
      // Create test representatives
      const testRepresentatives = [
        {
          id: 'test_1',
          name: 'Test Representative 1',
          office: 'Representative',
          level: 'federal',
          state: 'CA',
          party: 'D',
          district: '1',
          is_active: true
        }
      ];
      
      const results = await this.processRepresentatives(testRepresentatives);
      
      return {
        totalProcessed: testRepresentatives.length,
        successful: results.success ? 1 : 0,
        failed: results.success ? 0 : 1,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Error running testing suite:', error);
      return {
        totalProcessed: 0,
        successful: 0,
        failed: 1,
        processingTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Process representatives through the superior data pipeline
   * 
   * Main entry point for processing representative data through the comprehensive
   * integration system with current electorate verification and data quality scoring.
   * 
   * @param representatives - Array of representative data to process
   * @returns Promise with processing results and enhanced representative data
   */
  async processRepresentatives(representatives: any[]): Promise<{
    success: boolean;
    message: string;
    results: any;
    enhancedRepresentatives: SuperiorRepresentativeData[];
  }> {
    // Process representatives through the superior data pipeline
    
    console.log(`🔄 Processing ${representatives.length} representatives...`);
    
    // Debug: Check the structure of incoming data
    if (representatives.length > 0) {
      console.log(`🔍 Sample representative data:`, {
        name: representatives[0].name,
        state: representatives[0].state,
        level: representatives[0].level,
        office: representatives[0].office,
        id: representatives[0].id,
        source: representatives[0].source
      });
      
      // Check if name is undefined
      if (!representatives[0].name) {
        console.log(`❌ WARNING: First representative has undefined name!`);
        console.log(`Full representative object:`, JSON.stringify(representatives[0], null, 2));
      }
    }
    
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
    
    // Initialize superior data pipeline processing
    
    // Step 1: Verify current electorate using system date
    if (this.config.strictCurrentFiltering) {
      // Verify current electorate using system date
      const verification = await this.verifier.verifyRepresentatives(representatives);
      results.currentElectorate.totalCurrent = verification.summary.currentCount;
      results.currentElectorate.nonCurrent = verification.summary.nonCurrentCount;
      results.currentElectorate.accuracy = verification.summary.accuracy;
    }
    
    // Step 2: Process each representative with comprehensive data collection
    for (const rep of representatives) {
      try {
        results.totalProcessed++;
        logger.info(`\n🔄 Processing representative ${results.totalProcessed}/${representatives.length}: ${rep.name}`);
        
        // Step 2a: Collect primary data from live APIs
        const primaryData = await this.collectPrimaryData(rep);
        results.sources.primarySources.push(...Object.keys(primaryData).filter(key => primaryData[key]));
        
        // Step 2b: Collect secondary data from OpenStates People Database
        let secondaryData: any = null;
        if (this.config.enableOpenStatesPeople) {
          try {
            // This will only work server-side (in API routes)
            // Convert state name to state code for OpenStates integration
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
            const openStatesData = await this.openStatesIntegration.getCurrentRepresentatives(stateCode);
            if (openStatesData && openStatesData.length > 0) {
              secondaryData = {
                secondaryData: {
                  openStatesPerson: openStatesData.find(person => 
                    person.name && rep.name &&
                    (person.name.toLowerCase().includes(rep.name.toLowerCase()) ||
                    rep.name.toLowerCase().includes(person.name.toLowerCase()))
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
        
        // Step 2e: Resolve canonical ID for deduplication and cross-source validation
        const canonicalResult = await this.resolveCanonicalId(enhancedRep);
        enhancedRep.canonicalId = canonicalResult.canonicalId;
        enhancedRep.crosswalkEntries = canonicalResult.crosswalkEntries;
        
        // Step 2f: Calculate data quality
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
        
        logger.info(`   ✅ Successfully processed ${rep.name} (Quality: ${qualityScore.toFixed(1)})`);
        
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
    if (enhancedRepresentatives.length > 0) {
      await this.storeEnhancedData(enhancedRepresentatives);
    }
    
    // Log pipeline completion summary
    devLog(`Superior Data Pipeline Complete: ${results.totalProcessed} processed, ${results.successful} successful, ${results.failed} failed`);
    
    return {
      success: true,
      message: 'Superior data pipeline completed successfully',
      results,
      enhancedRepresentatives
    };
  }
  
  /**
   * Collect primary data from live APIs with SOURCE-SPECIFIC logic
   */
  private async collectPrimaryData(rep: any): Promise<any> {
    // Enhanced data enrichment with SOURCE-SPECIFIC API calls
    const primaryData: any = {
      // Start with the base representative data
      ...rep,
      // Initialize source-specific data containers
      congressGov: null,
      googleCivic: null,
      fec: null,
      openStatesApi: null,
      wikipedia: null
    };

    // Determine representative level for API source selection
    const isFederal = rep.level === 'federal';
    const isState = rep.level === 'state';
    
    logger.info(`🔍 Enriching ${rep.level} representative: ${rep.name}`, {
      level: rep.level,
      state: rep.state,
      hasBioguideId: !!rep.bioguide_id,
      hasOpenStatesId: !!rep.openstates_id
    });

    // FEDERAL REPRESENTATIVES: Use federal-specific APIs
    if (isFederal) {
      logger.info(`🏛️ Processing FEDERAL representative: ${rep.name}`);
      
      // Congress.gov data (PRIMARY SOURCE for federal representatives)
      if (this.config.enableCongressGov && !this.shouldSkipApi('congressGov')) {
        try {
          logger.info(`🔍 DEBUG: Getting Congress.gov data for federal rep: ${rep.name}`);
          primaryData.congressGov = await this.getCongressGovData(rep);
          if (primaryData.congressGov) {
            this.recordApiSuccess('congressGov');
            logger.info(`✅ Congress.gov data collected for: ${rep.name}`);
          }
        } catch (error: any) {
          devLog('Congress.gov data collection failed:', { error });
          this.recordApiFailure('congressGov', error.status);
        }
      }
      
      // FEC data (for federal representatives)
      if (this.config.enableFEC && !this.shouldSkipApi('fec')) {
        try {
          logger.info(`🔍 DEBUG: Getting FEC data for federal rep: ${rep.name}`);
          primaryData.fec = await this.getFECData(rep);
          if (primaryData.fec) {
            this.recordApiSuccess('fec');
            logger.info(`✅ FEC data collected for: ${rep.name}`);
          }
        } catch (error: any) {
          devLog('FEC data collection failed:', { error });
          this.recordApiFailure('fec', error.status);
        }
      }
      
      // Google Civic data (for federal representatives - elections info)
      if (this.config.enableGoogleCivic && !this.shouldSkipApi('googleCivic')) {
        try {
          logger.info(`🔍 DEBUG: Getting Google Civic data for federal rep: ${rep.name}`);
          primaryData.googleCivic = await this.getGoogleCivicData(rep);
          if (primaryData.googleCivic) {
            this.recordApiSuccess('googleCivic');
            logger.info(`✅ Google Civic data collected for: ${rep.name}`);
          }
        } catch (error: any) {
          devLog('Google Civic data collection failed:', { error });
          this.recordApiFailure('googleCivic', error.status);
        }
      }
      
      // Wikipedia data (for federal representatives)
      if (this.config.enableWikipedia && !this.shouldSkipApi('wikipedia')) {
        try {
          logger.info(`🔍 DEBUG: Getting Wikipedia data for federal rep: ${rep.name}`);
          primaryData.wikipedia = await this.getWikipediaData(rep);
          if (primaryData.wikipedia) {
            this.recordApiSuccess('wikipedia');
            logger.info(`✅ Wikipedia data collected for: ${rep.name}`);
          }
        } catch (error: any) {
          devLog('Wikipedia data collection failed:', { error });
          this.recordApiFailure('wikipedia', error.status);
        }
      }
      
      // SKIP OpenStates API for federal representatives (rate limit conservation)
      logger.info(`⏭️ SKIPPING OpenStates API for federal representative: ${rep.name} (rate limit conservation)`);
      
    } 
    // STATE REPRESENTATIVES: Use state-specific APIs
    else if (isState) {
      logger.info(`🏛️ Processing STATE representative: ${rep.name}`);
      
           // SKIP OpenStates API for state representatives (we already have rich data from OpenStates People database)
           logger.info(`⏭️ SKIPPING OpenStates API for state representative: ${rep.name} (using OpenStates People database data instead)`);
      
           // SKIP Google Civic and Wikipedia for state representatives (we have rich data from OpenStates People database)
           logger.info(`⏭️ SKIPPING Google Civic and Wikipedia for state representative: ${rep.name} (using OpenStates People database data instead)`);
      
      // SKIP Congress.gov and FEC for state representatives (not applicable)
      logger.info(`⏭️ SKIPPING Congress.gov and FEC for state representative: ${rep.name} (not applicable)`);
      
    } else {
      logger.warn(`⚠️ Unknown representative level: ${rep.level} for ${rep.name}`);
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
      logger.info('🔍 Social Media: Adding OpenStates API social media', {
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
    
    logger.info('🔍 Social Media: Total collected', { count: socialMedia.length, type: 'items' });
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
      devLog(`Storing ${enhancedRepresentatives.length} enhanced representatives...`);
      // Store enhanced representative data in database
      
      for (const enhancedRep of enhancedRepresentatives) {
        // Store data in representatives_core table with correct column names
        // Truncate long values to avoid database schema issues
        const coreData = {
          name: enhancedRep.name?.substring(0, 255) || '',
          party: enhancedRep.party?.substring(0, 100) || '',
          office: (enhancedRep.office || 'Representative')?.substring(0, 100),
          level: enhancedRep.level?.substring(0, 20) || 'federal',
          state: this.convertStateToCode(enhancedRep.state) || '',
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
          canonical_id: enhancedRep.canonicalId || null,
          is_active: true,
          data_sources: enhancedRep.dataSources || ['superior-pipeline'],
          last_verified: new Date().toISOString(),
          verification_status: enhancedRep.verificationStatus || 'verified',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Enhanced deduplication using canonical ID system
        let existing = null;
        
        // First try to find by canonical ID (most reliable)
        if (enhancedRep.canonicalId) {
          // Check for existing representative by canonical ID
          
          // Check if canonical ID exists in id_crosswalk table
          const { data: crosswalkData } = await this.supabase
            .from('id_crosswalk')
            .select('canonical_id, source, source_id')
            .eq('canonical_id', enhancedRep.canonicalId)
            .limit(1);
          
          if (crosswalkData && crosswalkData.length > 0) {
            // Find representative by any of the source IDs
            const sourceIds = crosswalkData.map((entry: any) => entry.source_id);
            const sourceFields = crosswalkData.map((entry: any) => {
              switch (entry.source) {
                case 'congress-gov': return 'bioguide_id';
                case 'open-states': return 'openstates_id';
                case 'fec': return 'fec_id';
                case 'google-civic': return 'google_civic_id';
                default: return null;
              }
            }).filter(Boolean);
            
            for (let i = 0; i < sourceIds.length; i++) {
              const field = sourceFields[i];
              const sourceId = sourceIds[i];
              if (field && sourceId) {
                const { data: existingByCanonical } = await this.supabase
                  .from('representatives_core')
                  .select('id, data_quality_score, data_sources, last_updated')
                  .eq(field, sourceId)
                  .maybeSingle();
                if (existingByCanonical) {
                  existing = existingByCanonical;
                  break;
                }
              }
            }
          }
        }
        
        // Fallback: Check by direct identifiers
        if (!existing) {
          const existingIdentifier = enhancedRep.bioguide_id || enhancedRep.openstatesId;
          const identifierField = enhancedRep.bioguide_id ? 'bioguide_id' : 'openstates_id';
          
          // Check if representative exists by identifier
          
          if (existingIdentifier) {
            const { data: existingById } = await this.supabase
              .from('representatives_core')
              .select('id, data_quality_score, data_sources, last_updated')
              .eq(identifierField, existingIdentifier)
              .maybeSingle();
            existing = existingById;
          }
        }
        
        // Final fallback: Check by name and level
        if (!existing) {
          // No match by canonical ID or identifiers, try to find by name and level
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
          
          // Compare data quality scores
          
          // Only update if new data is significantly better (at least 10 points higher)
          // or if existing data is low quality (below 60)
          if (newQuality > existingQuality + 10 || existingQuality < 60) {
            devLog(`Updating existing record for ${enhancedRep.name} (${existingQuality} → ${newQuality})...`);
            const { data: updateData, error: updateError } = await this.supabase
              .from('representatives_core')
              .update(coreData)
              .eq('id', existing.id)
              .select('id')
              .single();
          
            if (updateError) {
              devLog('Error updating enhanced representative data:', { error: updateError });
              continue; // Skip social media storage if representative update failed
          } else {
              repData = updateData;
              devLog(`Successfully updated representative: ${enhancedRep.name} with ID: ${repData.id}`);
            }
          } else {
            devLog(`Preserving existing high-quality data for ${enhancedRep.name} (${existingQuality} ≥ ${newQuality})`);
            repData = { id: existing.id }; // Use existing ID for social media storage
          }
        } else {
          // Insert new
          devLog(`Inserting new record for ${enhancedRep.name}...`);
          const { data: insertData, error: insertError } = await this.supabase
            .from('representatives_core')
          .insert(coreData)
          .select('id')
          .single();
        
          if (insertError) {
            devLog('Error inserting enhanced representative data:', { error: insertError });
            continue; // Skip social media storage if representative insertion failed
          } else {
            repData = insertData;
            devLog(`Successfully inserted representative: ${enhancedRep.name} with ID: ${repData.id}`);
          }
        }
        
        // Populate normalized tables with enhanced data
        if (repData?.id) {
          await this.populateNormalizedTables(repData.id, enhancedRep);
          await this.populateEnhancedTables(repData.id, enhancedRep);
        }
      }
      
      devLog(`Successfully stored enhanced data`);
    } catch (error) {
      devLog('Error storing enhanced data:', { error });
    }
  }

  /**
   * Populate enhanced tables with sophisticated data
   */
  private async populateEnhancedTables(representativeId: string, enhancedRep: SuperiorRepresentativeData): Promise<void> {
    try {
      devLog(`Populating enhanced tables for representative ID: ${representativeId}`);

      // Store detailed data quality metrics
      if (enhancedRep.dataQuality) {
        const { error: qualityError } = await this.supabase
          .from('representative_data_quality')
          .upsert({
            representative_id: representativeId,
            primary_source_score: enhancedRep.dataQuality.primarySourceScore || 0,
            secondary_source_score: enhancedRep.dataQuality.secondarySourceScore || 0,
            overall_confidence: enhancedRep.dataQuality.overallConfidence || 0,
            last_validated: enhancedRep.dataQuality.lastValidated || new Date().toISOString(),
            validation_method: enhancedRep.dataQuality.validationMethod || 'api-verification',
            data_completeness: enhancedRep.dataQuality.dataCompleteness || 0,
            source_reliability: enhancedRep.dataQuality.sourceReliability || 0,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'representative_id'
          });

        if (qualityError) {
          devLog('Error storing data quality metrics:', { error: qualityError });
        }
      }

      // Store campaign finance data
      if (enhancedRep.campaignFinance) {
        const { error: financeError } = await this.supabase
          .from('representative_campaign_finance')
          .upsert({
            representative_id: representativeId,
            total_raised: enhancedRep.campaignFinance.totalRaised || 0,
            total_spent: enhancedRep.campaignFinance.totalSpent || 0,
            cash_on_hand: enhancedRep.campaignFinance.cashOnHand || 0,
            last_filing_date: enhancedRep.campaignFinance.lastFilingDate || null,
            source: enhancedRep.campaignFinance.source || 'unknown',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'representative_id'
          });

        if (financeError) {
          devLog('Error storing campaign finance data:', { error: financeError });
        }
      }

      // Store data source information
      if (enhancedRep.dataSources && enhancedRep.dataSources.length > 0) {
        for (const source of enhancedRep.dataSources) {
          const { error: sourceError } = await this.supabase
            .from('representative_data_sources')
            .upsert({
              representative_id: representativeId,
              source_name: source,
              source_type: 'live-api',
              confidence: 'high',
              last_updated: new Date().toISOString(),
              validation_status: 'verified',
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'representative_id,source_name'
            });

          if (sourceError) {
            devLog('Error storing data source:', { error: sourceError });
          }
        }
      }

      // Store enhanced crosswalk data
      if (enhancedRep.crosswalkEntries && enhancedRep.crosswalkEntries.length > 0) {
        for (const entry of enhancedRep.crosswalkEntries) {
          const { error: crosswalkError } = await this.supabase
            .from('representative_crosswalk_enhanced')
            .upsert({
              representative_id: representativeId,
              canonical_id: enhancedRep.canonicalId || 'unknown',
              source_system: entry.source || 'unknown',
              source_id: entry.source_id || 'unknown',
              source_confidence: entry.confidence || 'medium',
              last_verified: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'representative_id,source_system,source_id'
            });

          if (crosswalkError) {
            devLog('Error storing enhanced crosswalk data:', { error: crosswalkError });
          }
        }
      }

      devLog(`Successfully populated enhanced tables for representative ID: ${representativeId}`);
    } catch (error) {
      devLog('Error populating enhanced tables:', { error });
    }
  }

  /**
   * Populate normalized tables with enhanced representative data
   */
  private async populateNormalizedTables(representativeId: string, enhancedRep: SuperiorRepresentativeData): Promise<void> {
    try {
      devLog(`Populating normalized tables for representative ID: ${representativeId}`);

      // Populate representative_contacts
      if (enhancedRep.enhancedContacts && enhancedRep.enhancedContacts.length > 0) {
        for (const contact of enhancedRep.enhancedContacts) {
          const { error } = await this.supabase
            .from('representative_contacts')
            .insert({
              representative_id: representativeId,
              contact_type: contact.type || 'email',
              value: contact.value || '',
              is_verified: contact.isVerified || false,
              source: contact.source || 'api',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          if (error) {
            devLog(`Error inserting contact: ${error.message}`);
          }
        }
      }

      // Populate representative_photos
      if (enhancedRep.enhancedPhotos && enhancedRep.enhancedPhotos.length > 0) {
        for (const photo of enhancedRep.enhancedPhotos) {
          const { error } = await this.supabase
            .from('representative_photos')
            .insert({
              representative_id: representativeId,
              url: photo.url || '',
              is_primary: photo.altText?.includes('primary') || false,
              source: photo.source || 'api',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          if (error) {
            devLog(`Error inserting photo: ${error.message}`);
          }
        }
      }

      // Populate representative_activity
      if (enhancedRep.enhancedActivity && enhancedRep.enhancedActivity.length > 0) {
        for (const activity of enhancedRep.enhancedActivity) {
          const { error } = await this.supabase
            .from('representative_activity')
            .insert({
              representative_id: representativeId,
              type: activity.type || 'biography',
              title: activity.title || '',
              description: activity.description || '',
              date: activity.date || new Date().toISOString(),
              source: activity.source || 'api',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          if (error) {
            devLog(`Error inserting activity: ${error.message}`);
          }
        }
      }

      // Populate representative_social_media
      if (enhancedRep.enhancedSocialMedia && enhancedRep.enhancedSocialMedia.length > 0) {
        for (const social of enhancedRep.enhancedSocialMedia) {
          const { error } = await this.supabase
            .from('representative_social_media')
            .insert({
              representative_id: representativeId,
              platform: social.platform || 'twitter',
              handle: social.handle || '',
              url: social.url || '',
              is_verified: social.verified || false,
              is_primary: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          if (error) {
            devLog(`Error inserting social media: ${error.message}`);
          }
        }
      }

      devLog(`Successfully populated normalized tables for representative ID: ${representativeId}`);
    } catch (error) {
      devLog(`Error populating normalized tables: ${error}`);
    }
  }
  
  // API call implementations
  private async getCongressGovData(rep: any): Promise<any> { 
    // Get Congress.gov data for representative
    
    // For federal representatives, use the bioguide_id from the initial Congress.gov call
    if (rep.level === 'federal' && rep.bioguide_id) {
      // Use bioguide_id for federal representative (PRIMARY SOURCE)
      try {
        logger.info(`🔍 DEBUG: Using bioguide_id for federal rep: ${rep.name} (${rep.bioguide_id})`);
        const url = `https://api.congress.gov/v3/member/${rep.bioguide_id}?api_key=${process.env.CONGRESS_GOV_API_KEY}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.member) {
            logger.info(`✅ Congress.gov data retrieved for federal rep: ${rep.name}`);
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
          logger.warn(`⚠️ Congress.gov API error for ${rep.name}: ${response.status} ${response.statusText}`);
          const error = new Error(`Congress.gov API failed with status ${response.status}`);
          (error as any).status = response.status;
          throw error;
        }
      } catch (error) {
        logger.error(`❌ Congress.gov API error for ${rep.name}:`, error);
        throw error;
      }
    } else if (rep.level === 'federal' && !rep.bioguide_id) {
      logger.warn(`⚠️ Federal representative ${rep.name} missing bioguide_id - skipping Congress.gov API`);
    } else {
      logger.info(`🔍 DEBUG: Skipping Congress.gov API call - not federal or no bioguide_id`);
    }
    
    return null;
  }
  private async getGoogleCivicData(rep: any): Promise<any> { 
    logger.info('Getting Google Civic data for:', { name: rep.name });
    
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
      logger.info(`🔍 DEBUG: Google Civic Elections API calling with address: ${address}`);
      
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
        voterInfo,
        contests: voterInfo?.contests || [],
        sources: electionsData.sources || [],
        address,
        source: 'google-civic-api',
        dataType: 'elections-and-voter-info'
      };
      
    } catch (error) {
      console.error('Google Civic API error:', error);
      return null;
    }
  }
  private async getFECData(rep: any): Promise<any> { 
    logger.info('Getting FEC data for:', { name: rep.name });
    
    // Only process federal representatives through FEC API
    if (rep.level !== 'federal') {
      logger.info(`⏭️ SKIPPING FEC API for ${rep.level} representative: ${rep.name} (only for federal representatives)`);
      return null;
    }
    
    try {
      // First, try to find the candidate by name and state if no FEC ID is available
      let candidateId = rep.fec_id;
      
      if (!candidateId) {
        logger.info(`🔍 DEBUG: No FEC ID available, searching by name and state for ${rep.name}`, { name: rep.name });
        
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
        logger.info(`🔍 DEBUG: Using state code: ${stateCode} for ${rep.state}`);
        
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
          
          logger.info(`🔍 DEBUG: FEC search strategy ${i + 1}: ${searchUrl}`);
          const searchResponse = await fetch(searchUrl);
          
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            logger.info(`🔍 DEBUG: FEC search returned ${searchData.results?.length || 0} results`);
            
            if (searchData.results && searchData.results.length > 0) {
              // Find the best match using multiple criteria
              const bestMatch = searchData.results.find((candidate: any) => {
                const candidateName = candidate.name.toLowerCase();
                const repName = rep.name.toLowerCase();
                
                logger.info(`🔍 DEBUG: Comparing FEC candidate "${candidateName}" with representative "${repName}"`);
                
                // Check for exact match
                if (candidateName === repName) {
                  logger.info(`🔍 DEBUG: Exact match found`);
                  return true;
                }
                
                // Check for last name match
                const candidateLastName = candidateName.split(',')[0].trim();
                const repLastName = repName.split(' ').pop();
                if (candidateLastName === repLastName) {
                  logger.info(`🔍 DEBUG: Last name match found: ${candidateLastName} === ${repLastName}`);
                  return true;
                }
                
                // Check for first name match (FEC format: "LAST, FIRST")
                const candidateFirstName = candidateName.split(',')[1]?.trim();
                const repFirstName = repName.split(' ')[0];
                if (candidateFirstName === repFirstName) {
                  logger.info(`🔍 DEBUG: First name match found: ${candidateFirstName} === ${repFirstName}`);
                  return true;
                }
                
                // Check for partial match
                if (candidateName.includes(repName) || repName.includes(candidateName)) {
                  logger.info(`🔍 DEBUG: Partial match found`);
                  return true;
                }
                
                return false;
              });
              
              if (bestMatch) {
                candidateId = bestMatch.candidate_id;
                logger.info(`🔍 DEBUG: Found FEC candidate ID: ${candidateId} for ${rep.name} using strategy ${i + 1}`);
                break;
              }
            }
          } else {
            logger.info(`🔍 DEBUG: FEC search strategy ${i + 1} failed with status: ${searchResponse.status}`);
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
    logger.info('Getting OpenStates API data for:', { name: rep.name });
    logger.info('🔍 OpenStates API: Starting OPTIMIZED data collection for', { name: rep.name });
    
    // Only process state representatives through OpenStates API
    if (rep.level !== 'state') {
      logger.info(`⏭️ SKIPPING OpenStates API for ${rep.level} representative: ${rep.name} (only for state representatives)`);
      return null;
    }
    
    try {
      const apiKey = process.env.OPEN_STATES_API_KEY;
      logger.info('🔍 OpenStates API: API key check', { 
        hasKey: !!apiKey, 
        keyLength: apiKey?.length 
      });
      
      if (!apiKey) {
        logger.info('❌ OpenStates API: API key not configured');
        return {};
      }

      // OPTIMIZATION: Use specific OpenStates ID if available
      if (rep.openstates_id) {
        logger.info('🚀 OpenStates API: Using OPTIMIZED direct person lookup by ID:', { id: rep.openstates_id });

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
        
        logger.info('🔍 OpenStates API: Direct person lookup response status', { status: response.status });

        if (!response.ok) {
          if (response.status === 429) {
            logger.info('OpenStates API rate limited, waiting 30 seconds...', {});
            await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds for rate limit
            return {}; // Return empty to avoid further requests
          }
          if (response.status === 404) {
            logger.info('OpenStates API: Person not found by ID, falling back to jurisdiction search', {});
            // Fall back to jurisdiction search if direct lookup fails
            return await this.getOpenStatesApiDataByJurisdiction(rep, apiKey);
          }
          logger.info('OpenStates API direct lookup failed', { status: response.status });
          return {};
        }

        const responseText = await response.text();
        logger.info('🔍 OpenStates API: Direct person response received', { 
          textLength: responseText.length,
          textPreview: responseText.substring(0, 200)
        });
        
        let data;
        try {
          data = JSON.parse(responseText);
          logger.info('🔍 OpenStates API: Direct person data parsed successfully', { 
            name: data.name,
            id: data.id,
            hasSocialMedia: !!data.social_media
          });
        } catch (parseError) {
          logger.info('OpenStates API returned non-JSON response for direct lookup', { 
            status: response.status,
            responseText: `${responseText.substring(0, 200)  }...`,
            parseError: parseError instanceof Error ? parseError.message : 'Unknown error'
          });
          return {};
        }

        // Extract social media data from direct person lookup
        const socialMedia = this.extractOpenStatesSocialMedia(data);
        logger.info('🔍 OpenStates API: Extracted social media from direct lookup', { 
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
        logger.info('⚠️ OpenStates API: No OpenStates ID available, falling back to jurisdiction search', {});
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
    logger.info('🔍 OpenStates API: Using FALLBACK jurisdiction search for', { state: rep.state });

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
      
    logger.info('🔍 OpenStates API: Jurisdiction search response status', { status: response.status });

      if (!response.ok) {
        if (response.status === 429) {
          logger.info('OpenStates API rate limited, waiting 30 seconds...', {});
          await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds for rate limit
          return {}; // Return empty to avoid further requests
        }
      logger.info('OpenStates API jurisdiction search failed', { status: response.status });
        return {};
      }

      const responseText = await response.text();
    logger.info('🔍 OpenStates API: Jurisdiction search response received', { 
        textLength: responseText.length,
        textPreview: responseText.substring(0, 200)
      });
      
      let data;
      try {
        data = JSON.parse(responseText);
      logger.info('🔍 OpenStates API: Jurisdiction search data parsed successfully', { 
          resultsCount: data.results?.length || 0
        });
      } catch (parseError) {
      logger.info('OpenStates API returned non-JSON response for jurisdiction search', { 
          status: response.status,
          responseText: `${responseText.substring(0, 200)  }...`,
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
      logger.info('🔍 OpenStates API: No matching legislator found in jurisdiction search');
        return {};
      }

    logger.info('🔍 OpenStates API: Found matching legislator in jurisdiction search', { 
        name: matchingLegislator.name,
        id: matchingLegislator.id,
        hasSocialMedia: !!matchingLegislator.social_media
      });

    // Extract social media data from jurisdiction search
      const socialMedia = this.extractOpenStatesSocialMedia(matchingLegislator);
    logger.info('🔍 OpenStates API: Extracted social media from jurisdiction search', { 
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
              handle,
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
    logger.info('Getting Wikipedia data for:', { name: rep.name });
    
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
        logger.info(`🔍 DEBUG: Wikipedia trying name format: ${nameFormat}`);
        
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
            logger.info(`🔍 DEBUG: Wikipedia found page for: ${nameFormat}`);
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
          logger.info(`🔍 DEBUG: Wikipedia no page found for: ${nameFormat} (${response.status})`);
        }
      }
      
      logger.info(`🔍 DEBUG: Wikipedia no page found for any name format for: ${rep.name}`);
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

  /**
   * Resolve canonical ID for multi-source reconciliation
   * Stores mappings in id_crosswalk table for deduplication
   */
  private async resolveCanonicalId(rep: SuperiorRepresentativeData): Promise<{ canonicalId: string; crosswalkEntries: any[] }> {
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
      if (rep.bioguide_id) {
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
          sourceId: rep.bioguide_id
        });
      }
      
      // Add FEC data if available
      if (rep.fec_id) {
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
          sourceId: rep.fec_id
        });
      }
      
      // Add Google Civic data if available
      if (rep.google_civic_id) {
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
          sourceId: rep.google_civic_id
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

  /**
   * Fetch federal representatives from Congress.gov API
   */
  private async fetchFederalRepresentatives(limit: number): Promise<any[]> {
    try {
      if (!this.config.enableCongressGov || !process.env.CONGRESS_GOV_API_KEY) {
        console.log('⚠️ Congress.gov API not enabled or API key not configured');
        return [];
      }

      const apiKey = process.env.CONGRESS_GOV_API_KEY;
      const url = `https://api.congress.gov/v3/member?limit=${limit}&api_key=${apiKey}`;
      
      console.log(`🔍 Fetching federal representatives from Congress.gov...`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Congress.gov API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const members = data.members || [];
      
      console.log(`📊 Retrieved ${members.length} federal representatives from Congress.gov`);
      
      // Transform to our format
      return members.map((member: any) => {
        // Skip members with no name data
        if (!member.name || member.name.trim() === '') {
          logger.warn(`⚠️ Skipping federal representative with no name data: ${member.bioguideId}`);
          return null;
        }
        
        // Parse the name from "Last, First" format
        let firstName = '';
        let lastName = '';
        let fullName = member.name;
        
        if (member.name && member.name.includes(',')) {
          const nameParts = member.name.split(',');
          lastName = nameParts[0]?.trim() || '';
          firstName = nameParts[1]?.trim() || '';
          fullName = `${firstName} ${lastName}`.trim();
        }
        
        return {
          id: member.bioguideId,
          name: fullName,
          firstName: firstName,
          lastName: lastName,
          office: member.chamber === 'House of Representatives' ? 'Representative' : 'Senator',
          level: 'federal',
          state: member.state,
          district: member.district,
          party: member.partyName,
          chamber: member.chamber,
          bioguideId: member.bioguideId,
          source: 'congress-gov'
        };
      }).filter(rep => rep !== null); // Filter out null entries
    } catch (error) {
      console.error('Error fetching federal representatives:', error);
      return [];
    }
  }

  /**
   * Fetch state representatives from OpenStates
   */
  private async fetchStateRepresentatives(limit: number, state?: string): Promise<any[]> {
    try {
      if (!this.config.enableOpenStatesPeople) {
        console.log('⚠️ OpenStates People integration not enabled');
        return [];
      }

      console.log(`🔍 Fetching state representatives from OpenStates (limit: ${limit})...`);
      console.log(`⚠️ Note: OpenStates integration will process all representatives first, then limit to ${limit}`);
      
      // Use OpenStates integration to get representatives
      const openStatesIntegration = new OpenStatesIntegration({
        dataPath: this.config.openStatesPeoplePath || './data/openstates-people/data',
        currentDate: new Date()
      });
      
      if (state) {
        // Convert state name to state code for OpenStates integration
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
        
        const stateCode = stateCodeMap[state as keyof typeof stateCodeMap] || state;
        console.log(`🔍 Converting state "${state}" to code "${stateCode}"`);
        
        // Fetch for specific state with limit
        const representatives = await openStatesIntegration.getCurrentRepresentatives(stateCode, limit);
        console.log(`📊 Retrieved ${representatives.length} representatives for ${state} from OpenStates (limited to ${limit})`);
        
        // Transform to our format (already limited by OpenStates integration)
        const transformed = representatives.map((rep: any, index: number) => {
          console.log(`🔍 Processing rep ${index + 1}:`, {
            id: rep.id,
            name: rep.name,
            given_name: rep.given_name,
            family_name: rep.family_name,
            party: rep.party_affiliation || rep.party,
            current_role: rep.current_role?.type,
            roles: rep.roles?.length || 0
          });
          
          // Construct name from given_name and family_name since OpenStates doesn't have a single name field
          let fullName = '';
          if (rep.given_name && rep.family_name) {
            fullName = `${rep.given_name} ${rep.family_name}`;
          } else if (rep.name) {
            fullName = rep.name;
          } else if (rep.given_name || rep.family_name) {
            fullName = `${rep.given_name || ''} ${rep.family_name || ''}`.trim();
          } else {
            // Skip records with no name data - these are likely data artifacts, not real representatives
            logger.warn(`⚠️ Skipping representative with no name data: ${rep.id}`);
            return null;
          }
          
          // Extract office from current_role or roles
          let office = 'Representative';
          if (rep.current_role?.title) {
            office = rep.current_role.title;
          } else if (rep.current_role?.type) {
            office = this.getOfficeFromRoleType(rep.current_role.type);
          } else if (rep.roles && rep.roles.length > 0) {
            office = this.getOfficeFromRoles(rep.roles);
          }
          
          // Extract district from current_role or roles
          let district = null;
          if (rep.current_role?.district) {
            district = rep.current_role.district;
          } else if (rep.roles && rep.roles.length > 0) {
            district = this.getDistrictFromRoles(rep.roles);
          }
            
          const transformedRep = {
            id: rep.id,
            name: fullName,
            firstName: rep.given_name,
            lastName: rep.family_name,
            office: office,
            level: 'state',
            state: state,
            district: district,
            party: rep.party_affiliation || rep.party,
            openstates_id: rep.id,
            source: 'open-states'
          };
          
          console.log(`🔍 Transformed rep ${index + 1}:`, {
            name: transformedRep.name,
            state: transformedRep.state,
            office: transformedRep.office,
            level: transformedRep.level
          });
          
          return transformedRep;
        });
        
        console.log(`📊 Transformed ${transformed.length} representatives for processing`);
        return transformed;
      } else {
        // Fetch for all states (limited)
        const allRepresentatives: any[] = [];
        const states = ['CA', 'NY', 'TX', 'FL', 'IL']; // Sample states for testing
        
        for (const stateCode of states) {
          if (allRepresentatives.length >= limit) break;
          
          const stateReps = await openStatesIntegration.getCurrentRepresentatives(stateCode);
          const remaining = limit - allRepresentatives.length;
          const limitedReps = stateReps.slice(0, remaining);
          
      const transformedReps = limitedReps.map((rep: any) => {
        // Construct name from given_name and family_name since OpenStates doesn't have a single name field
        let fullName = '';
        if (rep.given_name && rep.family_name) {
          fullName = `${rep.given_name} ${rep.family_name}`;
        } else if (rep.name) {
          fullName = rep.name;
        } else if (rep.given_name || rep.family_name) {
          fullName = `${rep.given_name || ''} ${rep.family_name || ''}`.trim();
        } else {
          // Skip records with no name data - these are likely data artifacts, not real representatives
          logger.warn(`⚠️ Skipping representative with no name data: ${rep.id}`);
          return null;
        }
          
        return {
          id: rep.id,
          name: fullName,
          firstName: rep.given_name,
          lastName: rep.family_name,
          office: this.getOfficeFromRoles(rep.roles),
          level: 'state',
          state: stateCode,
          district: this.getDistrictFromRoles(rep.roles),
          party: rep.party,
          openstates_id: rep.id,
          source: 'open-states'
        };
      }).filter(rep => rep !== null); // Filter out null entries
          
          allRepresentatives.push(...transformedReps);
        }
        
        console.log(`📊 Retrieved ${allRepresentatives.length} state representatives from OpenStates`);
        return allRepresentatives;
      }
    } catch (error) {
      console.error('Error fetching state representatives:', error);
      return [];
    }
  }

  /**
   * Extract office from OpenStates roles
   */
  private getOfficeFromRoles(roles: any[]): string {
    if (!roles || roles.length === 0) return 'Representative';
    
    const currentRole = roles.find(role => role.current === true);
    if (currentRole) {
      if (currentRole.type === 'upper') return 'Senator';
      if (currentRole.type === 'lower') return 'Representative';
      if (currentRole.type === 'executive') return 'Governor';
    }
    
    return 'Representative';
  }

  /**
   * Extract district from OpenStates roles
   */
  private getDistrictFromRoles(roles: any[]): string | null {
    if (!roles || roles.length === 0) return null;
    
    const currentRole = roles.find(role => role.current === true);
    return currentRole?.district || null;
  }

  /**
   * Get full state name from state code
   */
  private getStateName(stateCode: string): string {
    const stateNames: Record<string, string> = {
      'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
      'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
      'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
      'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
      'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
      'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
      'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
      'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
      'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
      'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
      'DC': 'District of Columbia'
    };
    
    return stateNames[stateCode] || stateCode;
  }

  /**
   * Get office title from role type
   */
  private getOfficeFromRoleType(roleType: string): string {
    const roleMap: Record<string, string> = {
      'upper': 'Senator',
      'lower': 'Assembly Member',
      'legislature': 'Legislator',
      'executive': 'Governor',
      'mayor': 'Mayor',
      'councilmember': 'Council Member',
      'commissioner': 'Commissioner',
      'judge': 'Judge'
    };
    return roleMap[roleType] || 'Representative';
  }
}

export default SuperiorDataPipeline;
