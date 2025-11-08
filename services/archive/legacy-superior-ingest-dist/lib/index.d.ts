/**
 * Civics Backend - Main Export File
 *
 * Central export point for all civics backend functionality
 * Provides a clean API for the sophisticated data ingestion system
 */
export { CanonicalIdService } from './canonical-id-service';
export { CurrentElectorateVerifier } from './current-electorate-verifier';
export { SuperiorDataPipeline, type SuperiorPipelineConfig, type SuperiorRepresentativeData } from './superior-data-pipeline';
export { default as OpenStatesIntegration, type OpenStatesPerson } from './openstates-integration';
export { ProvenanceService } from './provenance-service';
import { SuperiorDataPipeline, type SuperiorPipelineConfig } from './superior-data-pipeline';
export type { EntityType, DataSource, Party, Chamber, Level, ElectionType, ElectionStatus, VoteType, ContributionType, BillType, IdCrosswalk, CanonicalIdMapping, Candidate, Election, CampaignFinance, Contribution, VotingRecord, DataLicense, IndependenceScoreMethodology, IngestCursor, DataQualityAudit, ProvenanceData, QualityMetrics, DataSourceConfig, CivicsApiResponse, CrosswalkResponse, ValidationResult, ValidationIssue, IngestTask, IngestMetrics, GeographicLookup, ZipToOcd, LatLonToOcd } from './types';
export { default as config } from '../config/default.js';
export declare const createSupabaseClient: () => Promise<import("@supabase/supabase-js").SupabaseClient<any, "public", any>>;
export declare const createCivicsPipeline: (config: SuperiorPipelineConfig) => SuperiorDataPipeline;
export declare const defaultConfig: SuperiorPipelineConfig;
//# sourceMappingURL=index.d.ts.map