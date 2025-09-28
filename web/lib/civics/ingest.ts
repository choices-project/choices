/**
 * Civics Data Ingest Module
 * 
 * BULK DATA INGESTION ONLY - NOT FOR USER-FACING FUNCTIONALITY
 * 
 * This module handles batch ingestion of representative data from multiple sources:
 * - GovTrack API (federal representatives)
 * - OpenStates API (state representatives) 
 * - FEC API (campaign finance data)
 * - ProPublica API (voting records)
 * - OpenSecrets API (financial data)
 * 
 * Users never access this pipeline directly.
 * Address lookup is handled separately in /api/v1/civics/address-lookup/
 */

// Bulk ingestion services
export { CanonicalIdService } from './canonical-id-service';
export { GeographicService } from './geographic-service';
export { FECService } from './fec-service';
export { ProvenanceService } from './provenance-service';

// Ingest pipeline types
export type { IngestTask, IngestMetrics } from './types';
