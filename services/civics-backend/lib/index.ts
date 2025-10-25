/**
 * Civics Backend - Main Export File
 * 
 * Central export point for all civics backend functionality
 * Provides a clean API for the sophisticated data ingestion system
 */

// Core Services
export { CanonicalIdService } from './canonical-id-service';
export { CurrentElectorateVerifier } from './current-electorate-verifier';
export { SuperiorDataPipeline, type SuperiorPipelineConfig, type SuperiorRepresentativeData } from './superior-data-pipeline';
export { default as OpenStatesIntegration, type OpenStatesPerson } from './openstates-integration';
export { ProvenanceService } from './provenance-service';

// Import types for internal use
import { SuperiorDataPipeline, type SuperiorPipelineConfig } from './superior-data-pipeline';

// Types
export type {
  EntityType,
  DataSource,
  Party,
  Chamber,
  Level,
  ElectionType,
  ElectionStatus,
  VoteType,
  ContributionType,
  BillType,
  IdCrosswalk,
  CanonicalIdMapping,
  Candidate,
  Election,
  CampaignFinance,
  Contribution,
  VotingRecord,
  DataLicense,
  IndependenceScoreMethodology,
  IngestCursor,
  DataQualityAudit,
  ProvenanceData,
  QualityMetrics,
  DataSourceConfig,
  CivicsApiResponse,
  CrosswalkResponse,
  ValidationResult,
  ValidationIssue,
  IngestTask,
  IngestMetrics,
  GeographicLookup,
  ZipToOcd,
  LatLonToOcd
} from './types';

// Configuration
export { default as config } from '../config/default.js';

// Utility Functions
export const createSupabaseClient = () => {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
};

// Main Pipeline Factory
export const createCivicsPipeline = (config: SuperiorPipelineConfig) => {
  return new SuperiorDataPipeline(config);
};

// Default Configuration
export const defaultConfig: SuperiorPipelineConfig = {
  enableCongressGov: true,
  enableGoogleCivic: true,
  enableFEC: true,
  enableOpenStatesApi: true,
  enableOpenStatesPeople: true,
  enableWikipedia: true,
  strictCurrentFiltering: true,
  systemDateVerification: true,
  excludeNonCurrent: [],
  minimumQualityScore: 0.7,
  enableCrossReference: true,
  enableDataValidation: true,
  maxConcurrentRequests: 5,
  rateLimitDelay: 1000,
  openStatesRateLimit: 250,
  congressGovRateLimit: 5000,
  fecRateLimit: 1000,
  googleCivicRateLimit: 100000,
  cacheResults: true,
  openStatesPeoplePath: './data/openstates',
  enableStateProcessing: true,
  enableMunicipalProcessing: false
};
