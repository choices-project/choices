/**
 * Civics Data Ingest Module
 * 
 * This module provides a bridge between the old lib structure and the new features structure.
 * It re-exports the civics ingest functionality from the features directory.
 */

// Re-export the lookupAddress function from the features directory
export { lookupAddress } from '../../features/civics/ingest/connectors/civicinfo';

// Re-export types
export type { 
  AddressLookupResult, 
  DataSourceConfig, 
  IngestStatus, 
  DataQualityMetrics 
} from '../../features/civics/schemas';
