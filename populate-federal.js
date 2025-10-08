#!/usr/bin/env node

/**
 * Populate Federal Representatives Script
 * Uses Congress.gov API to get all current U.S. Senators and House Representatives
 * 
 * Created: October 8, 2025
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const CONGRESS_GOV_API_KEY = process.env.CONGRESS_GOV_API_KEY;

if (!CONGRESS_GOV_API_KEY) {
  console.error('❌ CONGRESS_GOV_API_KEY environment variable is required');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('API')));
  process.exit(1);
}

async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    ...options
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return await response.json();
}

async function getCurrentCongressMembers() {
  console.log('🏛️ Fetching current Congress members from Congress.gov API...');
  
  const members = [];
  
  try {
    // Get all current members (both House and Senate)
    const response = await fetch(
      `https://api.congress.gov/v3/member?api_key=${CONGRESS_GOV_API_KEY}&limit=1000`
    );
    
    if (!response.ok) {
      throw new Error(`Congress.gov API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`📊 Found ${data.members?.length || 0} total members in Congress.gov`);
    
    if (data.members) {
      console.log(`🔍 Sample member data:`, JSON.stringify(data.members[0], null, 2));
      
      for (const member of data.members) {
        // Extract chamber from terms
        const currentTerm = member.terms?.item?.[0];
        const chamber = currentTerm?.chamber;
        
        if (chamber) {
          members.push({
            name: member.name,
            office: chamber === 'House of Representatives' ? 'U.S. House of Representatives' : 'U.S. Senate',
            level: 'federal',
            state: member.state,
            party: member.partyName,
            district: member.district || null,
            bioguide_id: member.bioguideId,
            chamber: chamber === 'House of Representatives' ? 'House' : 'Senate',
            url: member.url,
            updateDate: member.updateDate
          });
        }
      }
    }
    
    console.log(`✅ Extracted ${members.length} current federal representatives`);
    return members;
    
  } catch (error) {
    console.error('❌ Error fetching Congress members:', error);
    throw error;
  }
}

async function populateFederalRepresentatives() {
  console.log('🚀 Starting federal representatives population...');
  console.log(`   Using Congress.gov API (5,000 requests/day limit)`);
  console.log(`   System Date: ${new Date().toISOString()}`);
  
  try {
    // Step 1: Get all current Congress members
    const federalReps = await getCurrentCongressMembers();
    
    if (federalReps.length === 0) {
      console.log('❌ No federal representatives found');
      return;
    }
    
    console.log(`\n📊 Federal Representatives Breakdown:`);
    const senators = federalReps.filter(rep => rep.chamber === 'Senate');
    const houseReps = federalReps.filter(rep => rep.chamber === 'House');
    console.log(`   U.S. Senate: ${senators.length} senators`);
    console.log(`   U.S. House: ${houseReps.length} representatives`);
    console.log(`   Total: ${federalReps.length} federal representatives`);
    
    // Step 2: Process in batches to avoid overwhelming the server
    const batchSize = 10;
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };
    
    console.log(`\n🔄 Processing ${federalReps.length} federal representatives in batches of ${batchSize}...`);
    
    for (let i = 0; i < federalReps.length; i += batchSize) {
      const batch = federalReps.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(federalReps.length / batchSize);
      
      console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} representatives)...`);
      
      for (const rep of batch) {
        try {
          console.log(`   🔄 Processing: ${rep.name} (${rep.office})`);
          
          const response = await makeRequest('http://localhost:3001/api/civics/superior-ingest', {
            body: JSON.stringify({ 
              representatives: [rep],
              state: rep.state,
              level: 'federal'
            })
          });
          
          if (response.success) {
            console.log(`   ✅ Added: ${rep.name} (${rep.office})`);
            results.successful++;
          } else {
            console.log(`   ❌ Failed: ${rep.name} - ${response.error}`);
            results.failed++;
            results.errors.push(`${rep.name}: ${response.error}`);
          }
          
          // Add delay between requests to be respectful to the server
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.log(`   ❌ Error: ${rep.name} - ${error.message}`);
          results.failed++;
          results.errors.push(`${rep.name}: ${error.message}`);
        }
      }
      
      // Add delay between batches
      if (i + batchSize < federalReps.length) {
        console.log(`   ⏳ Waiting 2 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Final statistics
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎉 FEDERAL REPRESENTATIVES POPULATION COMPLETE!`);
    console.log(`\n📊 FINAL STATISTICS:`);
    console.log(`   Total Processed: ${federalReps.length}`);
    console.log(`   Successful: ${results.successful}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Success Rate: ${((results.successful / federalReps.length) * 100).toFixed(1)}%`);
    
    if (results.errors.length > 0) {
      console.log(`\n❌ ERRORS:`);
      results.errors.slice(0, 10).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      if (results.errors.length > 10) {
        console.log(`   ... and ${results.errors.length - 10} more errors`);
      }
    }
    
    console.log(`\n${'='.repeat(80)}`);
    
  } catch (error) {
    console.error('❌ Federal population failed:', error);
    process.exit(1);
  }
}

// Run the population
populateFederalRepresentatives().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
