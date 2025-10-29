#!/usr/bin/env tsx

/**
 * Comprehensive All-States Ingestion Script
 * 
 * Processes representatives for ALL 50 states plus DC
 * Runs the pipeline for each state systematically
 * 
 * Created: October 28, 2025
 * Status: ✅ COMPREHENSIVE INGESTION
 */

import dotenv from 'dotenv';
import { createCivicsPipeline, defaultConfig, type SuperiorPipelineConfig } from '../lib/index.js';
import { createSupabaseClient } from '../lib/index.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

// All US states and territories
const ALL_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC'
];

// Enhanced configuration for comprehensive ingestion
const comprehensiveConfig: SuperiorPipelineConfig = {
  ...defaultConfig,
  enableCongressGov: true,
  enableGoogleCivic: true,
  enableFEC: true,
  enableOpenStatesApi: true,
  enableOpenStatesPeople: true,
  enableWikipedia: true,
  strictCurrentFiltering: true,
  systemDateVerification: true,
  minimumQualityScore: 0.7, // Lowered to capture more representatives
  enableCrossReference: true,
  enableDataValidation: true,
  maxConcurrentRequests: 2, // Reduced to avoid rate limits
  rateLimitDelay: 3000, // Increased delay
  openStatesRateLimit: 100, // Reduced rate limit
  congressGovRateLimit: 2000,
  fecRateLimit: 400,
  googleCivicRateLimit: 40000,
  cacheResults: true,
  openStatesPeoplePath: './data/openstates-people/data',
  enableStateProcessing: true,
  enableMunicipalProcessing: false
};

async function processAllStates() {
  console.log('🚀 Starting Comprehensive All-States Ingestion');
  console.log('================================================');
  console.log(`📊 Processing ${ALL_STATES.length} states/territories`);
  console.log('⏰ Estimated time: 2-4 hours (with rate limiting)');
  console.log('');
  
  try {
    // Initialize Supabase client
    const supabase = await createSupabaseClient();
    console.log('✅ Supabase client initialized');
    
    // Test database connection
    const { data, error } = await supabase
      .from('representatives_core')
      .select('count')
      .limit(1);
    
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    
    console.log('✅ Database connection verified');
    
    // Create pipeline
    const pipeline = createCivicsPipeline(comprehensiveConfig);
    console.log('✅ Pipeline initialized with comprehensive configuration');
    
    const results = {
      totalProcessed: 0,
      totalSuccessful: 0,
      totalFailed: 0,
      stateResults: [] as any[],
      startTime: Date.now()
    };
    
    // Process each state
    for (let i = 0; i < ALL_STATES.length; i++) {
      const state = ALL_STATES[i];
      const progress = `${i + 1}/${ALL_STATES.length}`;
      
      console.log(`\n🏛️ [${progress}] Processing ${state}...`);
      console.log('='.repeat(50));
      
      try {
        const stateStartTime = Date.now();
        
        // Process state representatives (no limit - get all representatives)
        const stateResults = await pipeline.processStateRepresentatives(10000, state);
        
        const stateEndTime = Date.now();
        const stateDuration = Math.round((stateEndTime - stateStartTime) / 1000);
        
        console.log(`✅ ${state} completed in ${stateDuration}s`);
        console.log(`   📊 Processed: ${stateResults.totalProcessed}`);
        console.log(`   ✅ Successful: ${stateResults.successful}`);
        console.log(`   ❌ Failed: ${stateResults.failed}`);
        
        results.totalProcessed += stateResults.totalProcessed;
        results.totalSuccessful += stateResults.successful;
        results.totalFailed += stateResults.failed;
        
        results.stateResults.push({
          state,
          ...stateResults,
          duration: stateDuration
        });
        
        // Rate limiting between states
        if (i < ALL_STATES.length - 1) {
          console.log('⏳ Rate limiting: waiting 10 seconds before next state...');
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
        
      } catch (stateError) {
        console.error(`❌ Error processing ${state}:`, stateError);
        results.stateResults.push({
          state,
          error: stateError instanceof Error ? stateError.message : String(stateError),
          totalProcessed: 0,
          successful: 0,
          failed: 1
        });
        results.totalFailed += 1;
      }
    }
    
    // Final summary
    const totalDuration = Math.round((Date.now() - results.startTime) / 1000);
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
    const seconds = totalDuration % 60;
    
    console.log('\n🎉 COMPREHENSIVE INGESTION COMPLETED!');
    console.log('=====================================');
    console.log(`⏰ Total Duration: ${hours}h ${minutes}m ${seconds}s`);
    console.log(`📊 Total Processed: ${results.totalProcessed}`);
    console.log(`✅ Total Successful: ${results.totalSuccessful}`);
    console.log(`❌ Total Failed: ${results.totalFailed}`);
    console.log(`📈 Success Rate: ${Math.round((results.totalSuccessful / results.totalProcessed) * 100)}%`);
    
    console.log('\n📋 State-by-State Results:');
    results.stateResults.forEach(result => {
      if (result.error) {
        console.log(`   ❌ ${result.state}: ERROR - ${result.error}`);
      } else {
        console.log(`   ✅ ${result.state}: ${result.successful}/${result.totalProcessed} (${result.duration}s)`);
      }
    });
    
    // Check final database count
    const { count: finalCount } = await supabase
      .from('representatives_core')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Final Database Count: ${finalCount} representatives`);
    
  } catch (error) {
    console.error('❌ Comprehensive ingestion failed:', error);
    process.exit(1);
  }
}

// Run the comprehensive ingestion
processAllStates().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
