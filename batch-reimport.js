#!/usr/bin/env node

// Batch reimport script using existing working API endpoints
// This avoids the middleware permissions issue

const ALL_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
  'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
  'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
  'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'PR',
  'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

function createProgressBar(progress, width = 50) {
  const filled = Math.round((progress / 100) * width);
  const empty = width - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Request failed: ${error.message}`);
    throw error;
  }
}

async function batchReimport() {
  console.log('🚀 Starting comprehensive batch reimport for all 50 states + DC...');
  
  const results = {
    totalStates: ALL_STATES.length,
    processedStates: 0,
    successfulStates: 0,
    failedStates: 0,
    totalRepresentatives: 0,
    errors: [],
    startTime: new Date()
  };

  console.log(`\n📊 BATCH REIMPORT STARTED`);
  console.log(`   Total States: ${results.totalStates}`);
  console.log(`   Start Time: ${results.startTime.toISOString()}`);
  console.log(`\n${'='.repeat(80)}`);

  // Step 1: Process each state (NO CLEARING - too dangerous!)
  console.log('\n🔄 STEP 1: Processing states with OpenStates People Database...');
  
  for (let i = 0; i < ALL_STATES.length; i++) {
    const state = ALL_STATES[i];
    const progress = ((i + 1) / ALL_STATES.length) * 100;
    
    const progressBar = createProgressBar(progress, 50);
    console.log(`\n📊 PROGRESS: ${progressBar} ${progress.toFixed(1)}% (${i + 1}/${ALL_STATES.length})`);
    console.log(`🔄 Processing: ${state}...`);
    
    try {
      const result = await makeRequest('http://localhost:3001/api/civics/openstates-populate', {
        body: JSON.stringify({ 
          state: state,
          clearExisting: false
        })
      });
      
      if (result.success) {
        results.successfulStates++;
        results.totalRepresentatives += result.results?.successful || 0;
        console.log(`   ✅ ${state}: ${result.results?.successful || 0} representatives added`);
      } else {
        results.failedStates++;
        console.log(`   ❌ ${state}: ${result.error || 'Unknown error'}`);
        results.errors.push(`${state}: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      results.failedStates++;
      console.log(`   ❌ ${state}: ${error.message}`);
      results.errors.push(`${state}: ${error.message}`);
    }
    
    results.processedStates++;
    
    // Add delay to respect rate limits
    if (i < ALL_STATES.length - 1) {
      console.log(`   ⏳ Waiting 2 seconds before next state...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Step 3: Add federal representatives
  console.log('\n🏛️ STEP 3: Adding federal representatives...');
  
  const federalRepresentatives = [
    // Florida Senators
    { name: 'Marco Rubio', state: 'FL', office: 'U.S. Senate', level: 'federal', party: 'Republican', bioguide_id: 'R000595' },
    { name: 'Rick Scott', state: 'FL', office: 'U.S. Senate', level: 'federal', party: 'Republican', bioguide_id: 'S001217' },
    
    // Florida House Representatives
    { name: 'Matt Gaetz', state: 'FL', office: 'U.S. House of Representatives', level: 'federal', party: 'Republican', bioguide_id: 'G000579', district: '1' },
    { name: 'Neal Dunn', state: 'FL', office: 'U.S. House of Representatives', level: 'federal', party: 'Republican', bioguide_id: 'D000631', district: '2' },
    { name: 'Val Demings', state: 'FL', office: 'U.S. House of Representatives', level: 'federal', party: 'Democratic', bioguide_id: 'D000627', district: '10' },
    
    // California Senators
    { name: 'Dianne Feinstein', state: 'CA', office: 'U.S. Senate', level: 'federal', party: 'Democratic', bioguide_id: 'F000062' },
    { name: 'Alex Padilla', state: 'CA', office: 'U.S. Senate', level: 'federal', party: 'Democratic', bioguide_id: 'P000612' },
    
    // Texas Senators
    { name: 'John Cornyn', state: 'TX', office: 'U.S. Senate', level: 'federal', party: 'Republican', bioguide_id: 'C001056' },
    { name: 'Ted Cruz', state: 'TX', office: 'U.S. Senate', level: 'federal', party: 'Republican', bioguide_id: 'C001098' }
  ];

  console.log(`   Adding ${federalRepresentatives.length} federal representatives...`);
  
  for (const rep of federalRepresentatives) {
    try {
      await makeRequest('http://localhost:3001/api/civics/superior-ingest', {
        body: JSON.stringify({ representatives: [rep] })
      });
      console.log(`   ✅ Added: ${rep.name} (${rep.office})`);
    } catch (error) {
      console.log(`   ❌ Failed: ${rep.name} - ${error.message}`);
      results.errors.push(`Failed to add federal rep: ${rep.name}`);
    }
  }

  // Final statistics
  const endTime = new Date();
  const totalDuration = endTime.getTime() - results.startTime.getTime();
  const durationMinutes = Math.floor(totalDuration / 60000);
  const durationSeconds = Math.floor((totalDuration % 60000) / 1000);

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎉 BATCH REIMPORT COMPLETE!`);
  console.log(`\n📊 FINAL STATISTICS:`);
  console.log(`   Total States Processed: ${results.processedStates}/${results.totalStates}`);
  console.log(`   Successful States: ${results.successfulStates}`);
  console.log(`   Failed States: ${results.failedStates}`);
  console.log(`   Total Representatives: ${results.totalRepresentatives}`);
  console.log(`   Total Duration: ${durationMinutes}m ${durationSeconds}s`);
  console.log(`   Success Rate: ${((results.successfulStates / results.totalStates) * 100).toFixed(1)}%`);
  console.log(`   Errors: ${results.errors.length}`);
  
  if (results.errors.length > 0) {
    console.log(`\n❌ ERRORS:`);
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  console.log(`\n${'='.repeat(80)}`);
}

// Run the batch reimport
batchReimport().catch(error => {
  console.error('❌ Batch reimport failed:', error);
  process.exit(1);
});

// Batch reimport script using existing working API endpoints
// This avoids the middleware permissions issue

const ALL_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
  'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
  'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
  'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'PR',
  'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

function createProgressBar(progress, width = 50) {
  const filled = Math.round((progress / 100) * width);
  const empty = width - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Request failed: ${error.message}`);
    throw error;
  }
}

async function batchReimport() {
  console.log('🚀 Starting comprehensive batch reimport for all 50 states + DC...');
  
  const results = {
    totalStates: ALL_STATES.length,
    processedStates: 0,
    successfulStates: 0,
    failedStates: 0,
    totalRepresentatives: 0,
    errors: [],
    startTime: new Date()
  };

  console.log(`\n📊 BATCH REIMPORT STARTED`);
  console.log(`   Total States: ${results.totalStates}`);
  console.log(`   Start Time: ${results.startTime.toISOString()}`);
  console.log(`\n${'='.repeat(80)}`);

  // Step 1: Process each state (NO CLEARING - too dangerous!)
  console.log('\n🔄 STEP 1: Processing states with OpenStates People Database...');
  
  for (let i = 0; i < ALL_STATES.length; i++) {
    const state = ALL_STATES[i];
    const progress = ((i + 1) / ALL_STATES.length) * 100;
    
    const progressBar = createProgressBar(progress, 50);
    console.log(`\n📊 PROGRESS: ${progressBar} ${progress.toFixed(1)}% (${i + 1}/${ALL_STATES.length})`);
    console.log(`🔄 Processing: ${state}...`);
    
    try {
      const result = await makeRequest('http://localhost:3001/api/civics/openstates-populate', {
        body: JSON.stringify({ 
          state: state,
          clearExisting: false
        })
      });
      
      if (result.success) {
        results.successfulStates++;
        results.totalRepresentatives += result.results?.successful || 0;
        console.log(`   ✅ ${state}: ${result.results?.successful || 0} representatives added`);
      } else {
        results.failedStates++;
        console.log(`   ❌ ${state}: ${result.error || 'Unknown error'}`);
        results.errors.push(`${state}: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      results.failedStates++;
      console.log(`   ❌ ${state}: ${error.message}`);
      results.errors.push(`${state}: ${error.message}`);
    }
    
    results.processedStates++;
    
    // Add delay to respect rate limits
    if (i < ALL_STATES.length - 1) {
      console.log(`   ⏳ Waiting 2 seconds before next state...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Step 3: Add federal representatives
  console.log('\n🏛️ STEP 3: Adding federal representatives...');
  
  const federalRepresentatives = [
    // Florida Senators
    { name: 'Marco Rubio', state: 'FL', office: 'U.S. Senate', level: 'federal', party: 'Republican', bioguide_id: 'R000595' },
    { name: 'Rick Scott', state: 'FL', office: 'U.S. Senate', level: 'federal', party: 'Republican', bioguide_id: 'S001217' },
    
    // Florida House Representatives
    { name: 'Matt Gaetz', state: 'FL', office: 'U.S. House of Representatives', level: 'federal', party: 'Republican', bioguide_id: 'G000579', district: '1' },
    { name: 'Neal Dunn', state: 'FL', office: 'U.S. House of Representatives', level: 'federal', party: 'Republican', bioguide_id: 'D000631', district: '2' },
    { name: 'Val Demings', state: 'FL', office: 'U.S. House of Representatives', level: 'federal', party: 'Democratic', bioguide_id: 'D000627', district: '10' },
    
    // California Senators
    { name: 'Dianne Feinstein', state: 'CA', office: 'U.S. Senate', level: 'federal', party: 'Democratic', bioguide_id: 'F000062' },
    { name: 'Alex Padilla', state: 'CA', office: 'U.S. Senate', level: 'federal', party: 'Democratic', bioguide_id: 'P000612' },
    
    // Texas Senators
    { name: 'John Cornyn', state: 'TX', office: 'U.S. Senate', level: 'federal', party: 'Republican', bioguide_id: 'C001056' },
    { name: 'Ted Cruz', state: 'TX', office: 'U.S. Senate', level: 'federal', party: 'Republican', bioguide_id: 'C001098' }
  ];

  console.log(`   Adding ${federalRepresentatives.length} federal representatives...`);
  
  for (const rep of federalRepresentatives) {
    try {
      await makeRequest('http://localhost:3001/api/civics/superior-ingest', {
        body: JSON.stringify({ representatives: [rep] })
      });
      console.log(`   ✅ Added: ${rep.name} (${rep.office})`);
    } catch (error) {
      console.log(`   ❌ Failed: ${rep.name} - ${error.message}`);
      results.errors.push(`Failed to add federal rep: ${rep.name}`);
    }
  }

  // Final statistics
  const endTime = new Date();
  const totalDuration = endTime.getTime() - results.startTime.getTime();
  const durationMinutes = Math.floor(totalDuration / 60000);
  const durationSeconds = Math.floor((totalDuration % 60000) / 1000);

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎉 BATCH REIMPORT COMPLETE!`);
  console.log(`\n📊 FINAL STATISTICS:`);
  console.log(`   Total States Processed: ${results.processedStates}/${results.totalStates}`);
  console.log(`   Successful States: ${results.successfulStates}`);
  console.log(`   Failed States: ${results.failedStates}`);
  console.log(`   Total Representatives: ${results.totalRepresentatives}`);
  console.log(`   Total Duration: ${durationMinutes}m ${durationSeconds}s`);
  console.log(`   Success Rate: ${((results.successfulStates / results.totalStates) * 100).toFixed(1)}%`);
  console.log(`   Errors: ${results.errors.length}`);
  
  if (results.errors.length > 0) {
    console.log(`\n❌ ERRORS:`);
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  console.log(`\n${'='.repeat(80)}`);
}

// Run the batch reimport
batchReimport().catch(error => {
  console.error('❌ Batch reimport failed:', error);
  process.exit(1);
});
