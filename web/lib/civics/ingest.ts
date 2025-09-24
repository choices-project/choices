/**
 * Civics Data Ingest Module - DISABLED
 * 
 * This module provides a bridge between the old lib structure and the new features structure.
 * It re-exports the civics ingest functionality from the features directory.
 * 
 * DISABLED: Civics features are currently disabled for MVP
 */

import { logger } from '@/lib/logger';

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
  // Minimal, PII-safe analytics of attempted usage while feature disabled
  try {
    const trimmed = (address || '').trim();
    logger.info('Civics address lookup attempted (disabled)', {
      input_shape: {
        length: trimmed.length,
        segments: trimmed ? trimmed.split(',').length : 0,
        hasDigits: /\d/.test(trimmed),
        hasLetters: /[A-Za-z]/.test(trimmed),
      },
    });
  } catch {
    // Swallow analytics failure
  }
  throw new Error('Civics features are disabled for MVP');
};

export type AddressLookupResult = any;
export type DataSourceConfig = any;
export type IngestStatus = any;
export type DataQualityMetrics = any;
