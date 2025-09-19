/**
 * Civics Data Ingest Module - DISABLED
 * 
 * This module provides a bridge between the old lib structure and the new features structure.
 * It re-exports the civics ingest functionality from the features directory.
 * 
 * DISABLED: Civics features are currently disabled for MVP
 */

// TODO: Re-enable when civics features are enabled
// export { lookupAddress } from '../../features/civics/ingest/connectors/civicinfo';

// TODO: Re-enable when civics features are enabled
// export type { 
//   AddressLookupResult, 
//   DataSourceConfig, 
//   IngestStatus, 
//   DataQualityMetrics 
// } from '../../features/civics/schemas';

// Temporary stub exports to prevent import errors
export const lookupAddress = async (address: string) => {
  throw new Error('Civics features are disabled for MVP');
};

export type AddressLookupResult = any;
export type DataSourceConfig = any;
export type IngestStatus = any;
export type DataQualityMetrics = any;
