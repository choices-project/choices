#!/usr/bin/env node

/**
 * Fetch Current Federal Representatives
 * 
 * Fetches current federal representatives from APIs and populates the database
 * with real, current data instead of hardcoded test data.
 * 
 * @version 1.0.0
 * @since 2025-10-25
 * @author Choices Civics Platform
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

/**
 * Enhanced logger
 */
const logger = {
  info: (message, data = {}) => console.log(`ℹ️  ${new Date().toISOString()} - ${message}`, data),
  success: (message, data = {}) => console.log(`✅ ${new Date().toISOString()} - ${message}`, data),
  warning: (message, data = {}) => console.warn(`⚠️  ${new Date().toISOString()} - ${message}`, data),
  error: (message, data = {}) => console.error(`❌ ${new Date().toISOString()} - ${message}`, data),
  debug: (message, data = {}) => console.log(`🔍 ${new Date().toISOString()} - ${message}`, data)
};

/**
 * Initialize Supabase client
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

/**
 * State name to abbreviation mapping
 */
const STATE_ABBREVIATIONS = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
  'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
  'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
  'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
  'District of Columbia': 'DC'
};

/**
 * Fetch current federal representatives from Congress.gov API
 */
async function fetchCurrentFederalRepresentatives() {
  logger.info(`🇺🇸 Fetching current federal representatives from APIs`);
  
  try {
    const representatives = [];
    
    // Fetch from Congress.gov API
    if (process.env.CONGRESS_GOV_API_KEY) {
      logger.info(`📡 Fetching from Congress.gov API...`);
      
      // Fetch current House members
      const houseResponse = await fetch(
        `https://api.congress.gov/v3/member?limit=250&api_key=${process.env.CONGRESS_GOV_API_KEY}`
      );
      
      if (houseResponse.ok) {
        const houseData = await houseResponse.json();
        if (houseData.members) {
          for (const member of houseData.members) {
            representatives.push({
              name: member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown Representative',
              office: 'Representative',
              party: member.partyName || member.party || 'Unknown',
              state: STATE_ABBREVIATIONS[member.state] || member.state?.substring(0, 2) || 'XX',
              district: member.district?.toString() || null,
              level: 'federal',
              is_active: true,
              openstates_id: null,
              canonical_id: `congress-${member.bioguideId}`,
              bioguide_id: member.bioguideId // Store for crosswalk
            });
          }
        }
      }
      
      // Fetch current Senators
      const senateResponse = await fetch(
        `https://api.congress.gov/v3/member?limit=250&api_key=${process.env.CONGRESS_GOV_API_KEY}`
      );
      
      if (senateResponse.ok) {
        const senateData = await senateResponse.json();
        if (senateData.members) {
          for (const member of senateData.members) {
            representatives.push({
              name: member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown Senator',
              office: 'Senator',
              party: member.partyName || member.party || 'Unknown',
              state: STATE_ABBREVIATIONS[member.state] || member.state?.substring(0, 2) || 'XX',
              district: null,
              level: 'federal',
              is_active: true,
              openstates_id: null,
              canonical_id: `congress-${member.bioguideId}`,
              bioguide_id: member.bioguideId // Store for crosswalk
            });
          }
        }
      }
    }
    
    // If Congress.gov fails, try Google Civic API
    if (representatives.length === 0 && process.env.GOOGLE_CIVIC_API_KEY) {
      logger.info(`📡 Falling back to Google Civic API...`);
      
      // This would require a different approach as Google Civic API works differently
      logger.warning(`⚠️ Google Civic API integration not implemented yet`);
    }
    
    logger.success(`✅ Fetched ${representatives.length} current federal representatives`);
    return representatives;
    
  } catch (error) {
    logger.error(`❌ Failed to fetch federal representatives: ${error.message}`);
    return [];
  }
}

/**
 * Populate database with current federal representatives
 */
async function populateCurrentFederalReps() {
  logger.info(`🇺🇸 Populating database with current federal representatives`);
  
  try {
    // Clear existing federal reps first
    logger.info(`🧹 Clearing existing federal representatives...`);
    const { error: deleteError } = await supabase
      .from('representatives_core')
      .delete()
      .eq('level', 'federal');
    
    if (deleteError) {
      logger.warning(`⚠️ Error clearing existing federal reps: ${deleteError.message}`);
    } else {
      logger.success(`✅ Cleared existing federal representatives`);
    }
    
    // Fetch current representatives from APIs
    const currentReps = await fetchCurrentFederalRepresentatives();
    
    if (currentReps.length === 0) {
      logger.warning(`⚠️ No current federal representatives found from APIs`);
      return {
        success: false,
        error: 'No current federal representatives found from APIs'
      };
    }
    
    // Keep bioguide_id in core data (it's the most important identifier)
    const coreReps = currentReps.map(rep => {
      // Keep all data including bioguide_id for core table
      return {
        name: rep.name,
        office: rep.office,
        party: rep.party,
        state: rep.state,
        district: rep.district,
        level: rep.level,
        is_active: rep.is_active,
        openstates_id: rep.openstates_id,
        bioguide_id: rep.bioguide_id, // Keep bioguide_id in core table
        canonical_id: rep.canonical_id
      };
    });
    
    // Insert current representatives
    logger.info(`📝 Inserting ${coreReps.length} current federal representatives...`);
    
    const { data, error } = await supabase
      .from('representatives_core')
      .insert(coreReps)
      .select();
    
    if (error) {
      throw new Error(`Failed to insert current federal representatives: ${error.message}`);
    }
    
    logger.success(`✅ Successfully inserted ${data.length} current federal representatives`);
    
    // Create crosswalk entries for bioguide IDs
    const crosswalkEntries = [];
    for (let i = 0; i < data.length; i++) {
      const rep = data[i];
      const originalRep = currentReps[i];
      
      if (originalRep.bioguide_id) {
        crosswalkEntries.push({
          entity_type: 'person',
          canonical_id: rep.canonical_id,
          source: 'congress-gov',
          source_id: originalRep.bioguide_id,
          attrs: {
            last_verified: new Date().toISOString(),
            quality_score: 0.95,
            source_confidence: 'high'
          }
        });
      }
    }
    
    if (crosswalkEntries.length > 0) {
      logger.info(`📝 Creating ${crosswalkEntries.length} crosswalk entries...`);
      
      const { error: crosswalkError } = await supabase
        .from('id_crosswalk')
        .upsert(crosswalkEntries, { onConflict: 'canonical_id,source,source_id' });
      
      if (crosswalkError) {
        logger.warning(`⚠️ Failed to create crosswalk entries: ${crosswalkError.message}`);
      } else {
        logger.success(`✅ Successfully created crosswalk entries`);
      }
    }
    
    // Verify the data
    const { data: verifyData, error: verifyError } = await supabase
      .from('representatives_core')
      .select('*')
      .eq('level', 'federal')
      .eq('is_active', true);
    
    if (verifyError) {
      logger.warning(`⚠️ Error verifying data: ${verifyError.message}`);
    } else {
      logger.success(`✅ Verified ${verifyData.length} current federal representatives in database`);
      logger.debug(`📊 Sample data:`, verifyData.slice(0, 3));
    }
    
    return {
      success: true,
      inserted: data.length,
      verified: verifyData?.length || 0,
      message: 'Current federal representatives populated successfully'
    };
    
  } catch (error) {
    logger.error(`❌ Failed to populate current federal representatives: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Main execution
 */
async function main() {
  logger.info(`🚀 Starting Current Federal Representatives Fetch`);
  
  try {
    const results = await populateCurrentFederalReps();
    
    if (results.success) {
      logger.success(`✅ Current Federal Representatives Fetch completed successfully`);
      logger.info(`📊 Results: ${results.inserted} inserted, ${results.verified} verified`);
    } else {
      logger.error(`❌ Current Federal Representatives Fetch failed: ${results.error}`);
      process.exit(1);
    }
    
  } catch (error) {
    logger.error(`❌ Unexpected error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default populateCurrentFederalReps;
