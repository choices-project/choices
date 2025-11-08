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
import { type OpenStatesPerson } from './openstates-integration';
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
    openStatesRateLimit: number;
    congressGovRateLimit: number;
    fecRateLimit: number;
    googleCivicRateLimit: number;
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
    bioguide_id?: string;
    fec_id?: string;
    google_civic_id?: string;
    legiscan_id?: string;
    congress_gov_id?: string;
    govinfo_id?: string;
    wikipedia_url?: string;
    ballotpedia_url?: string;
    twitter_handle?: string;
    facebook_url?: string;
    instagram_handle?: string;
    linkedin_url?: string;
    youtube_channel?: string;
    primary_email?: string;
    primary_phone?: string;
    primary_website?: string;
    primary_photo_url?: string;
    termStartDate?: string;
    termEndDate?: string;
    nextElectionDate?: string;
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
    secondaryData?: {
        openStatesPerson: OpenStatesPerson;
        confidence: 'medium' | 'low';
        lastUpdated: string;
        source: 'openstates-people-database';
        validationStatus: 'pending' | 'verified' | 'rejected';
    };
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
    dataQuality: {
        primarySourceScore: number;
        secondarySourceScore: number;
        overallConfidence: number;
        lastValidated: string;
        validationMethod: 'api-verification' | 'cross-reference' | 'manual';
        dataCompleteness: number;
        sourceReliability: number;
    };
    verificationStatus: 'verified' | 'unverified' | 'pending';
    dataSources: string[];
    lastUpdated: string;
    canonicalId?: string;
    crosswalkEntries?: any[];
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
export declare class SuperiorDataPipeline {
    private supabase;
    private verifier;
    private openStatesIntegration;
    private canonicalIdService;
    private config;
    private processedStates;
    /** API failure tracking for rate limiting and backoff */
    private apiFailureCounts;
    private apiLastFailure;
    private apiBackoffUntil;
    /**
     * Initialize the Superior Data Pipeline
     *
     * @param config - Pipeline configuration settings
     */
    constructor(config: SuperiorPipelineConfig);
    /**
     * Check if an API is currently in backoff period
     */
    private isApiInBackoff;
    /**
     * Convert state name to 2-character state code
     */
    private convertStateToCode;
    /**
     * Record API failure and implement exponential backoff
     */
    private recordApiFailure;
    /**
     * Record API success and reset failure count
     */
    private recordApiSuccess;
    /**
     * Check if we should skip an API due to failures
     */
    private shouldSkipApi;
    /**
     * Process federal representatives
     */
    processFederalRepresentatives(limit?: number): Promise<{
        totalProcessed: number;
        successful: number;
        failed: number;
        qualityMetrics?: {
            averageScore: number;
            highQualityCount: number;
        };
        processingTime?: number;
    }>;
    /**
     * Process state representatives
     */
    processStateRepresentatives(limit?: number, state?: string): Promise<{
        totalProcessed: number;
        successful: number;
        failed: number;
        qualityMetrics?: {
            averageScore: number;
            highQualityCount: number;
        };
        processingTime?: number;
    }>;
    /**
     * Run testing suite
     */
    runTestingSuite(): Promise<{
        totalProcessed: number;
        successful: number;
        failed: number;
        qualityMetrics?: {
            averageScore: number;
            highQualityCount: number;
        };
        processingTime?: number;
    }>;
    /**
     * Process representatives through the superior data pipeline
     *
     * Main entry point for processing representative data through the comprehensive
     * integration system with current electorate verification and data quality scoring.
     *
     * @param representatives - Array of representative data to process
     * @returns Promise with processing results and enhanced representative data
     */
    processRepresentatives(representatives: any[]): Promise<{
        success: boolean;
        message: string;
        results: any;
        enhancedRepresentatives: SuperiorRepresentativeData[];
    }>;
    /**
     * Collect primary data from live APIs with SOURCE-SPECIFIC logic
     */
    private collectPrimaryData;
    /**
     * Create enhanced representative data
     */
    private createEnhancedRepresentative;
    /**
     * Extract comprehensive contacts from all sources
     */
    private extractContacts;
    /**
     * Extract comprehensive photos from all sources
     */
    private extractPhotos;
    /**
     * Extract comprehensive activity from all sources
     */
    private extractActivity;
    /**
     * Extract social media information
     */
    private extractSocialMedia;
    /**
     * Extract campaign finance information
     */
    private extractCampaignFinance;
    /**
     * Calculate comprehensive data quality
     */
    private calculateComprehensiveDataQuality;
    /**
     * Calculate data completeness
     */
    private calculateDataCompleteness;
    /**
     * Calculate source reliability
     */
    private calculateSourceReliability;
    /**
     * Calculate overall data quality score
     */
    private calculateDataQuality;
    /**
     * Cross-reference data between sources
     */
    private crossReferenceData;
    /**
     * Store enhanced data in database
     */
    private storeEnhancedData;
    /**
     * Populate enhanced tables with sophisticated data
     */
    private populateEnhancedTables;
    /**
     * Populate normalized tables with enhanced representative data
     */
    private populateNormalizedTables;
    private getCongressGovData;
    private getGoogleCivicData;
    private getFECData;
    /**
     * OpenStates API (FREE - 250 requests/day)
     * Get social media data and other information from OpenStates API
     */
    private getOpenStatesApiData;
    /**
     * Fallback method for jurisdiction-based search (less efficient)
     */
    private getOpenStatesApiDataByJurisdiction;
    /**
     * Extract social media from OpenStates API data
     */
    private extractOpenStatesSocialMedia;
    /**
     * Map OpenStates platform names to our standard format
     */
    private mapOpenStatesPlatform;
    /**
     * Generate social media URL from platform and handle
     */
    private generateSocialMediaUrl;
    private getWikipediaData;
    /**
     * Check if a person has current party affiliation
     */
    private hasCurrentParty;
    /**
     * Resolve canonical ID for multi-source reconciliation
     * Stores mappings in id_crosswalk table for deduplication
     */
    private resolveCanonicalId;
    /**
     * Fetch federal representatives from Congress.gov API
     */
    private fetchFederalRepresentatives;
    /**
     * Fetch state representatives from OpenStates
     */
    private fetchStateRepresentatives;
    /**
     * Extract office from OpenStates roles
     */
    private getOfficeFromRoles;
    /**
     * Extract district from OpenStates roles
     */
    private getDistrictFromRoles;
    /**
     * Get full state name from state code
     */
    private getStateName;
    /**
     * Get office title from role type
     */
    private getOfficeFromRoleType;
}
export default SuperiorDataPipeline;
//# sourceMappingURL=superior-data-pipeline.d.ts.map