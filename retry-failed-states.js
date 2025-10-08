#!/usr/bin/env node

/**
 * Retry Failed States Script
 * Retry the 10 states that failed during the comprehensive reimport
 * 
 * Created: October 8, 2025
 */

const failedStates = ['SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

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

async function retryFailedStates() {
  console.log('🔄 Retrying failed states...');
  console.log(`   States to retry: ${failedStates.join(', ')}`);
  
  const results = {
    successful: 0,
    failed: 0,
    errors: []
  };

  for (const state of failedStates) {
    try {
      console.log(`\n🔄 Processing ${state}...`);
      
      const response = await makeRequest(`http://localhost:3001/api/civics/openstates-populate`, {
        body: JSON.stringify({ state })
      });
      
      if (response.success) {
        console.log(`   ✅ ${state}: ${response.count} representatives added`);
        results.successful++;
      } else {
        console.log(`   ❌ ${state}: ${response.error}`);
        results.failed++;
        results.errors.push(`${state}: ${response.error}`);
      }
      
      // Add delay between states to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`   ❌ ${state}: ${error.message}`);
      results.failed++;
      results.errors.push(`${state}: ${error.message}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎉 RETRY COMPLETE!`);
  console.log(`\n📊 RESULTS:`);
  console.log(`   Successful: ${results.successful}`);
  console.log(`   Failed: ${results.failed}`);
  console.log(`   Success Rate: ${((results.successful / failedStates.length) * 100).toFixed(1)}%`);
  
  if (results.errors.length > 0) {
    console.log(`\n❌ ERRORS:`);
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  console.log(`\n${'='.repeat(60)}`);
}

// Run the retry
retryFailedStates().catch(error => {
  console.error('❌ Retry failed:', error);
  process.exit(1);
});


/**
 * Retry Failed States Script
 * Retry the 10 states that failed during the comprehensive reimport
 * 
 * Created: October 8, 2025
 */

const failedStates = ['SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

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

async function retryFailedStates() {
  console.log('🔄 Retrying failed states...');
  console.log(`   States to retry: ${failedStates.join(', ')}`);
  
  const results = {
    successful: 0,
    failed: 0,
    errors: []
  };

  for (const state of failedStates) {
    try {
      console.log(`\n🔄 Processing ${state}...`);
      
      const response = await makeRequest(`http://localhost:3001/api/civics/openstates-populate`, {
        body: JSON.stringify({ state })
      });
      
      if (response.success) {
        console.log(`   ✅ ${state}: ${response.count} representatives added`);
        results.successful++;
      } else {
        console.log(`   ❌ ${state}: ${response.error}`);
        results.failed++;
        results.errors.push(`${state}: ${response.error}`);
      }
      
      // Add delay between states to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`   ❌ ${state}: ${error.message}`);
      results.failed++;
      results.errors.push(`${state}: ${error.message}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎉 RETRY COMPLETE!`);
  console.log(`\n📊 RESULTS:`);
  console.log(`   Successful: ${results.successful}`);
  console.log(`   Failed: ${results.failed}`);
  console.log(`   Success Rate: ${((results.successful / failedStates.length) * 100).toFixed(1)}%`);
  
  if (results.errors.length > 0) {
    console.log(`\n❌ ERRORS:`);
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  console.log(`\n${'='.repeat(60)}`);
}

// Run the retry
retryFailedStates().catch(error => {
  console.error('❌ Retry failed:', error);
  process.exit(1);
});
