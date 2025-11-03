/**
 * Civics Data Ingest Module
 * 
 * Provides address lookup functionality for state, federal, and local representatives.
 * Data has been ingested for multiple states and cities.
 */

// Logger not used in this file

// Re-export from the actual civics implementation
export { GoogleCivicClient } from '../integrations/google-civic/client';

// Create a simple lookup function that uses the Google Civic client
export const lookupAddress = async (address: string) => {
  const { GoogleCivicClient } = await import('../integrations/google-civic/client');
  const client = new GoogleCivicClient({
    apiKey: process.env.GOOGLE_CIVIC_API_KEY ?? ''
  });
  
  return await client.lookupAddress(address);
};

// Export types that are actually available
export type { GoogleCivicConfig } from '../integrations/google-civic/client';
