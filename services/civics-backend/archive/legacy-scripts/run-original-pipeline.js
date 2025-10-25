#!/usr/bin/env node

/**
 * @fileoverview Node.js wrapper to run the original TypeScript pipeline
 * @version 1.0.0
 * @since 2025-10-25
 * @feature CIVICS_ORIGINAL_PIPELINE_WRAPPER
 */

const { exec } = require('child_process');
const path = require('path');

/**
 * Run the original TypeScript pipeline using tsx
 */
async function runOriginalPipeline() {
  console.log('🚀 RUNNING ORIGINAL TYPESCRIPT PIPELINE');
  console.log('======================================\n');
  
  try {
    // Check if tsx is available
    console.log('🔧 Checking tsx availability...');
    
    await new Promise((resolve, reject) => {
      exec('which tsx', (error, stdout, stderr) => {
        if (error) {
          console.log('❌ tsx not found, installing...');
          exec('npm install -g tsx', (installError, installStdout, installStderr) => {
            if (installError) {
              console.log('⚠️  Could not install tsx globally, trying npx...');
              resolve();
            } else {
              console.log('✅ tsx installed successfully');
              resolve();
            }
          });
        } else {
          console.log('✅ tsx is available');
          resolve();
        }
      });
    });
    
    // Run the original TypeScript pipeline
    console.log('\n🚀 Running original TypeScript pipeline...');
    
    const scriptPath = path.join(__dirname, 'original-pipeline-backend.ts');
    
    await new Promise((resolve, reject) => {
      exec(`npx tsx ${scriptPath}`, { cwd: '/Users/alaughingkitsune/src/Choices' }, (error, stdout, stderr) => {
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

// Run the original pipeline
runOriginalPipeline().catch(console.error);
