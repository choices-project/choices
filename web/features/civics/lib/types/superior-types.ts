/**
 * Civics Types - Replacement for Archived Superior Data Pipeline
 * 
 * This file provides the essential types that were previously imported
 * from the superior-data-pipeline.ts file, which has been moved to
 * the backend service at /services/civics-backend.
 * 
 * Created: October 26, 2025
 * Updated: October 26, 2025
 */

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
  
  // Contact information
  email?: string;
  phone?: string;
  website?: string;
  twitter?: string;
  facebook?: string;
  
  // Physical information
  photo?: string;
  photoUrl?: string;
  enhancedPhotos?: {
    primary?: string;
    secondary?: string;
    thumbnail?: string;
  };
  
  // Term information
  termStart?: string;
  termEnd?: string;
  nextElection?: string;
  isIncumbent?: boolean;
  
  // Data quality and verification
  dataQualityScore?: number;
  isCurrentElectorate?: boolean;
  lastVerified?: string;
  dataSource?: string[];
  
  // Additional metadata
  metadata?: Record<string, any>;
}

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
 * Data source integration result
 */
export interface DataSourceResult {
  source: string;
  success: boolean;
  data?: any;
  error?: string;
  qualityScore?: number;
}

/**
 * Representative search parameters
 */
export interface RepresentativeSearchParams {
  state?: string;
  level?: 'federal' | 'state' | 'local';
  district?: string;
  party?: string;
  limit?: number;
  offset?: number;
  includeNonCurrent?: boolean;
}

/**
 * Representative search result
 */
export interface RepresentativeSearchResult {
  representatives: SuperiorRepresentativeData[];
  total: number;
  hasMore: boolean;
  searchParams: RepresentativeSearchParams;
}
