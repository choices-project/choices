/**
 * Open States Integration
 * 
 * State legislature data source for comprehensive state government information
 */

// Export client types with specific names
export {
  OpenStatesClient,
  type OpenStatesClientConfig,
  type OpenStatesLegislator as OpenStatesClientLegislator,
  type OpenStatesBill as OpenStatesClientBill,
  type OpenStatesVote as OpenStatesClientVote
} from './client';

// Re-export error classes with explicit names to avoid conflicts
// Note: Error handling classes are defined in client.ts
