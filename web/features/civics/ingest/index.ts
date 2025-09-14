/**
 * Civics Data Ingest Module
 * 
 * Centralized exports for the civics data ingestion system
 * Enhanced for the next development phase
 */

// Connectors
export * from "./connectors/propublica";
export * from "./connectors/civicinfo";

// Pipeline
export * from "./pipeline";

// Re-export schemas for convenience
export type { 
  AddressLookupResult, 
  DataSourceConfig, 
  IngestStatus, 
  DataQualityMetrics 
} from '../schemas';
