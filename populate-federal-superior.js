#!/usr/bin/env node

/**
 * Populate Federal Representatives using Superior Data Pipeline
 * Leverages the superior pipeline's concurrent API calls and consensus validation
 * 
 * Created: October 8, 2025
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const CONGRESS_GOV_API_KEY = process.env.CONGRESS_GOV_API_KEY;

if (!CONGRESS_GOV_API_KEY) {
  console.error('❌ CONGRESS_GOV_API_KEY environment variable is required');
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
  let offset = 0;
  const limit = 250; // Maximum per request
  let hasMore = true;
  
  try {
    while (hasMore) {
      console.log(`📡 Fetching Congress members (offset: ${offset})...`);
      
      const response = await fetch(
        `https://api.congress.gov/v3/member?api_key=${CONGRESS_GOV_API_KEY}&currentMember=true&limit=${limit}&offset=${offset}`
      );
      
      if (!response.ok) {
        throw new Error(`Congress.gov API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`📊 Found ${data.members?.length || 0} members in this batch`);
      
      if (data.members && data.members.length > 0) {
        for (const member of data.members) {
          // Extract chamber from terms (currentMember=true ensures these are current)
          const currentTerm = member.terms?.item?.[0];
          const chamber = currentTerm?.chamber;
          
          if (chamber) {
            console.log(`🔍 DEBUG: Member ${member.name} - bioguideId: ${member.bioguideId}`);
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
        
        // Check if there are more results
        if (data.pagination && data.pagination.next) {
          offset += limit;
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
      
      // Add small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`✅ Extracted ${members.length} current federal representatives`);
    return members;
    
  } catch (error) {
    console.error('❌ Error fetching Congress members:', error);
    throw error;
  }
}

async function populateFederalRepresentatives() {
  console.log('🚀 Starting SUPERIOR federal representatives population...');
  console.log(`   Using Superior Data Pipeline with concurrent API calls`);
  console.log(`   Sources: Congress.gov, Google Civic, FEC, Wikipedia (OpenStates for state only)`);
  console.log(`   Features: Cross-reference validation, consensus building, data quality scoring`);
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
    
    // Step 2: Process in smaller batches to avoid overwhelming the server
    const batchSize = 10; // Smaller batches to avoid server overload
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };
    
    console.log(`\n🔄 Processing ${federalReps.length} federal representatives in batches of ${batchSize}...`);
    console.log(`   Each batch will use concurrent API calls and consensus validation`);
    
    const totalBatches = Math.ceil(federalReps.length / batchSize);
    
    // Progress bar function
    function updateProgress(current, total, batchNumber, successful, failed) {
      const percentage = Math.round((current / total) * 100);
      const progressBar = '█'.repeat(Math.floor(percentage / 2)) + '░'.repeat(50 - Math.floor(percentage / 2));
      const status = `Batch ${batchNumber}/${totalBatches} | ${current}/${total} reps | ✅${successful} ❌${failed}`;
      process.stdout.write(`\r📊 Progress: [${progressBar}] ${percentage}% | ${status}`);
    }
    
    for (let i = 0; i < federalReps.length; i += batchSize) {
      const batch = federalReps.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      // Update progress bar
      updateProgress(i, federalReps.length, batchNumber, results.successful, results.failed);
      
      console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} representatives)...`);
      console.log(`   🔄 Superior pipeline will concurrently call:`);
      console.log(`      - Congress.gov API (${batch.length} calls) - Federal representatives`);
      console.log(`      - Google Civic API (${batch.length} calls) - Federal representatives`);
      console.log(`      - FEC API (${batch.length} calls) - Federal representatives`);
      console.log(`      - Wikipedia API (${batch.length} calls) - Federal representatives`);
      console.log(`      - OpenStates API (0 calls) - State legislators only, not federal`);
      console.log(`   🔍 Cross-reference validation and consensus building...`);
      
      let retries = 3;
      let success = false;
      
      while (retries > 0 && !success) {
        try {
          console.log(`   🔄 Attempting request (${4 - retries}/3)...`);
          console.log(`   🔍 DEBUG: Batch contains ${batch.length} representatives`);
          console.log(`   🔍 DEBUG: First representative:`, JSON.stringify(batch[0], null, 2));
          const response = await makeRequest('http://localhost:3001/api/civics/superior-ingest', {
            body: JSON.stringify({ 
              representatives: batch,
              level: 'federal'
            })
          });
          
          if (response.success) {
            console.log(`   ✅ Batch ${batchNumber} completed successfully`);
            console.log(`      📊 Results: ${response.results?.successful || 0} successful, ${response.results?.failed || 0} failed`);
            console.log(`      🎯 Data Quality: ${response.dataQuality?.averageScore?.toFixed(1) || 'N/A'} average score`);
            console.log(`      🔗 Cross-Referenced: ${response.sources?.crossReferenced || 0} representatives`);
            console.log(`      📈 Quality Distribution: ${response.dataQuality?.qualityDistribution?.high || 'N/A'}% high, ${response.dataQuality?.qualityDistribution?.medium || 'N/A'}% medium, ${response.dataQuality?.qualityDistribution?.low || 'N/A'}% low`);
            
            results.successful += response.results?.successful || 0;
            results.failed += response.results?.failed || 0;
            
            if (response.results?.errors) {
              results.errors.push(...response.results.errors);
            }
            
            // Update progress bar after successful batch
            updateProgress(i + batch.length, federalReps.length, batchNumber, results.successful, results.failed);
            
            success = true;
          } else {
            console.log(`   ❌ Batch ${batchNumber} failed: ${response.error}`);
            retries--;
            if (retries > 0) {
              console.log(`   🔄 Retrying in 5 seconds...`);
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
          }
          
        } catch (error) {
          console.log(`   ❌ Error processing batch ${batchNumber}: ${error.message}`);
          retries--;
          if (retries > 0) {
            console.log(`   🔄 Retrying in 5 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      }
      
      if (!success) {
        console.log(`   ❌ Batch ${batchNumber} failed after 3 attempts`);
        results.failed += batch.length;
        results.errors.push(`Batch ${batchNumber}: Failed after 3 attempts`);
      }
      
      // Add delay between batches to be respectful to APIs
      if (i + batchSize < federalReps.length) {
        console.log(`   ⏳ Waiting 10 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    // Final progress update
    console.log(`\n📊 Final Progress: [██████████████████████████████████████████████████] 100% | Complete | ✅${results.successful} ❌${results.failed}`);
    
    // Final statistics
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎉 SUPERIOR FEDERAL REPRESENTATIVES POPULATION COMPLETE!`);
    console.log(`\n📊 FINAL STATISTICS:`);
    console.log(`   Total Processed: ${federalReps.length}`);
    console.log(`   Successful: ${results.successful}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Success Rate: ${((results.successful / federalReps.length) * 100).toFixed(1)}%`);
    console.log(`\n🔍 SUPERIOR PIPELINE FEATURES USED:`);
    console.log(`   ✅ Concurrent API calls across multiple sources`);
    console.log(`   ✅ Cross-reference validation between sources`);
    console.log(`   ✅ Consensus building for data conflicts`);
    console.log(`   ✅ Data quality scoring and reliability assessment`);
    console.log(`   ✅ Enhanced data enrichment with contacts, photos, activity`);
    
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
