/**
 * Civics Backend - Main Export File
 *
 * Central export point for all civics backend functionality
 * Provides a clean API for the sophisticated data ingestion system
 */
// Core Services
export { CanonicalIdService } from './canonical-id-service.js';
export { CurrentElectorateVerifier } from './current-electorate-verifier.js';
export { SuperiorDataPipeline } from './superior-data-pipeline.js';
export { default as OpenStatesIntegration } from './openstates-integration.js';
export { ProvenanceService } from './provenance-service.js';
// Import types for internal use
import { SuperiorDataPipeline } from './superior-data-pipeline.js';
// Configuration
export { default as config } from '../config/default.js';
// Utility Functions
export const createSupabaseClient = async () => {
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
};
// Main Pipeline Factory
export const createCivicsPipeline = (config) => {
    return new SuperiorDataPipeline(config);
};
// Default Configuration
export const defaultConfig = {
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
    openStatesPeoplePath: './data/openstates-people/data',
    enableStateProcessing: true,
    enableMunicipalProcessing: false
};
//# sourceMappingURL=index.js.map

