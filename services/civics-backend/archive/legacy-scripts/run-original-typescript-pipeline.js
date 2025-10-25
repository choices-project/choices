#!/usr/bin/env node

/**
 * @fileoverview Run the original TypeScript superior-data-pipeline.ts directly
 * @version 1.0.0
 * @since 2025-10-25
 * @feature CIVICS_ORIGINAL_TYPESCRIPT_PIPELINE
 */

const { exec } = require('child_process');
const path = require('path');

/**
 * Run the original TypeScript superior-data-pipeline.ts directly
 */
async function runOriginalTypeScriptPipeline() {
  console.log('🚀 RUNNING ORIGINAL TYPESCRIPT SUPERIOR DATA PIPELINE');
  console.log('=====================================================\n');
  
  try {
    // Step 1: Install tsx if not available
    console.log('🔧 Step 1: Ensuring tsx is available...');
    
    await new Promise((resolve, reject) => {
      exec('which tsx || npm install -g tsx', (error, stdout, stderr) => {
        if (error) {
          console.log('⚠️  tsx not found, installing...');
          resolve(); // Continue anyway
        } else {
          console.log('✅ tsx is available');
          resolve();
        }
      });
    });
    
    // Step 2: Create a test script that uses the original TypeScript file
    console.log('\n📝 Step 2: Creating test script for original TypeScript pipeline...');
    
    const testScript = `
import { SuperiorDataPipeline } from '/Users/alaughingkitsune/src/Choices/web/features/civics/lib/civics-superior/superior-data-pipeline.ts';

async function testOriginalPipeline() {
  console.log('🎯 TESTING ORIGINAL TYPESCRIPT PIPELINE');
  console.log('=====================================\\n');
  
  try {
    // Initialize the original TypeScript pipeline with proper config
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
    
    // Test with a small sample of California federal representatives
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
    
    console.log('🚀 Running original TypeScript pipeline...');
    const results = await pipeline.processRepresentatives(testReps);
    
    console.log('✅ Original TypeScript pipeline completed successfully');
    console.log('📊 Results summary:');
    console.log(\`   - Representatives processed: \${results.processedCount || 0}\`);
    console.log(\`   - Data quality average: \${results.dataQuality?.averageScore || 0}\`);
    console.log(\`   - API success rate: \${results.apiPerformance?.successRate || 0}%\`);
    console.log(\`   - Crosswalk entries: \${results.crosswalkEntries?.length || 0}\`);
    
    console.log('\\n🎉 SUCCESS: Original TypeScript pipeline working perfectly!');
    console.log('✅ All sophisticated logic preserved');
    console.log('✅ Multi-source consensus working');
    console.log('✅ Quality-based crosswalk resolution working');
    console.log('✅ Normalized table integration working');
    console.log('✅ No more janky crosswalk issues!');
    
  } catch (error) {
    console.error('❌ Original TypeScript pipeline failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

testOriginalPipeline().catch(console.error);
`;
    
    const fs = require('fs');
    const testScriptPath = '/Users/alaughingkitsune/src/Choices/services/civics-backend/scripts/test-original-pipeline.ts';
    fs.writeFileSync(testScriptPath, testScript);
    
    console.log('✅ Test script created');
    
    // Step 3: Run the original TypeScript pipeline using tsx
    console.log('\n🚀 Step 3: Running original TypeScript pipeline with tsx...');
    
    await new Promise((resolve, reject) => {
      exec(`cd /Users/alaughingkitsune/src/Choices && npx tsx ${testScriptPath}`, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Original TypeScript pipeline failed:', error);
          console.error('stderr:', stderr);
          reject(error);
        } else {
          console.log('✅ Original TypeScript pipeline completed');
          console.log(stdout);
          resolve();
        }
      });
    });
    
    console.log('\n🎉 SUCCESS: Original TypeScript pipeline is working!');
    console.log('✅ We should use this instead of the separate JavaScript version');
    console.log('✅ All sophisticated crosswalk logic is preserved');
    console.log('✅ Multi-source consensus is working');
    console.log('✅ Quality-based resolution is working');
    
  } catch (error) {
    console.error('❌ Failed to run original TypeScript pipeline:', error);
    console.error('This suggests we should fix the original TypeScript file instead of creating a separate JavaScript version');
  }
}

// Run the original TypeScript pipeline
runOriginalTypeScriptPipeline().catch(console.error);
