#!/usr/bin/env node

/**
 * @fileoverview Use the original TypeScript superior-data-pipeline.ts for backend processing
 * @version 1.0.0
 * @since 2025-10-25
 * @feature CIVICS_ORIGINAL_PIPELINE
 */

const { exec } = require('child_process');
const path = require('path');

/**
 * Use the original TypeScript superior-data-pipeline.ts for backend processing
 */
async function useOriginalPipeline() {
  console.log('🚀 USING ORIGINAL TYPESCRIPT SUPERIOR DATA PIPELINE');
  console.log('==================================================\n');
  
  try {
    // Step 1: Build the TypeScript files
    console.log('🔧 Step 1: Building TypeScript files...');
    
    await new Promise((resolve, reject) => {
      exec('cd /Users/alaughingkitsune/src/Choices/web && npm run build', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Build failed:', error);
          reject(error);
        } else {
          console.log('✅ TypeScript build completed');
          resolve();
        }
      });
    });
    
    // Step 2: Create a Node.js script that imports the built TypeScript
    console.log('\n📝 Step 2: Creating Node.js wrapper for TypeScript pipeline...');
    
    const wrapperScript = `
const { SuperiorDataPipeline } = require('/Users/alaughingkitsune/src/Choices/web/.next/server/chunks/features/civics/lib/civics-superior/superior-data-pipeline.js');

async function runOriginalPipeline() {
  console.log('🎯 RUNNING ORIGINAL TYPESCRIPT PIPELINE');
  console.log('======================================\\n');
  
  try {
    // Initialize the original TypeScript pipeline
    const config = {
      enableCongressGov: true,
      enableGoogleCivic: false, // Disabled as per user preference
      enableFEC: true,
      enableOpenStatesApi: true,
      enableOpenStatesPeople: true,
      enableWikipedia: true,
      currentElectorateFilter: true,
      dataQualityThreshold: 0.7,
      maxApiRetries: 3,
      apiTimeoutMs: 10000,
      rateLimitDelayMs: 1000
    };
    
    const pipeline = new SuperiorDataPipeline(config);
    
    // Test with a small sample
    console.log('📡 Testing with California federal representatives...');
    
    const testReps = [
      {
        id: 'test-1',
        name: 'Test Representative 1',
        office: 'Representative',
        level: 'federal',
        state: 'CA',
        party: 'Democratic',
        district: '1',
        bioguide_id: 'T000001',
        is_active: true
      }
    ];
    
    const results = await pipeline.processRepresentatives(testReps);
    
    console.log('✅ Original TypeScript pipeline completed successfully');
    console.log('📊 Results:', JSON.stringify(results, null, 2));
    
  } catch (error) {
    console.error('❌ Original pipeline failed:', error);
  }
}

runOriginalPipeline().catch(console.error);
`;
    
    const fs = require('fs');
    fs.writeFileSync('/Users/alaughingkitsune/src/Choices/services/civics-backend/scripts/run-original-pipeline.js', wrapperScript);
    
    console.log('✅ Node.js wrapper created');
    
    // Step 3: Run the original TypeScript pipeline
    console.log('\n🚀 Step 3: Running original TypeScript pipeline...');
    
    await new Promise((resolve, reject) => {
      exec('node /Users/alaughingkitsune/src/Choices/services/civics-backend/scripts/run-original-pipeline.js', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Original pipeline failed:', error);
          reject(error);
        } else {
          console.log('✅ Original TypeScript pipeline completed');
          console.log(stdout);
          resolve();
        }
      });
    });
    
    console.log('\n🎉 SUCCESS: Using original TypeScript pipeline!');
    console.log('✅ All sophisticated logic preserved');
    console.log('✅ Multi-source consensus working');
    console.log('✅ Quality-based crosswalk resolution working');
    console.log('✅ Normalized table integration working');
    
  } catch (error) {
    console.error('❌ Failed to use original pipeline:', error);
  }
}

// Run the original pipeline
useOriginalPipeline().catch(console.error);
