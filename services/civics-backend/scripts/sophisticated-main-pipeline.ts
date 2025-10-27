#!/usr/bin/env tsx

/**
 * Sophisticated Main Pipeline
 * 
 * Advanced TypeScript-based pipeline using the original sophisticated logic
 * This is the production-ready pipeline for the civics backend system
 */

import dotenv from 'dotenv';
import { createCivicsPipeline, defaultConfig, type SuperiorPipelineConfig } from '../lib/index.js';
import { createSupabaseClient } from '../lib/index.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Enhanced configuration for production
const productionConfig: SuperiorPipelineConfig = {
  ...defaultConfig,
  enableCongressGov: true,
  enableGoogleCivic: true,
  enableFEC: true,
  enableOpenStatesApi: true,
  enableOpenStatesPeople: true,
  enableWikipedia: true,
  strictCurrentFiltering: true,
  systemDateVerification: true,
  minimumQualityScore: 0.8,
  enableCrossReference: true,
  enableDataValidation: true,
  maxConcurrentRequests: 3,
  rateLimitDelay: 2000,
  openStatesRateLimit: 200,
  congressGovRateLimit: 4000,
  fecRateLimit: 800,
  googleCivicRateLimit: 80000,
  cacheResults: true,
  openStatesPeoplePath: './data/openstates-people/data',
  enableStateProcessing: true,
  enableMunicipalProcessing: false
};

async function main() {
  console.log('🚀 Starting Sophisticated Civics Backend Pipeline');
  console.log('================================================');
  
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
    const pipeline = createCivicsPipeline(productionConfig);
    console.log('✅ Pipeline initialized with sophisticated configuration');
    
    // Get command line arguments
    const args = process.argv.slice(2);
    const mode = args[0] || 'federal';
    const state = args[1];
    
    // Parse limit from --limit argument or default to 100
    let limit = 100;
    const limitIndex = args.indexOf('--limit');
    if (limitIndex !== -1 && args[limitIndex + 1]) {
      limit = parseInt(args[limitIndex + 1]) || 100;
    }
    
    console.log(`📊 Processing mode: ${mode}`);
    if (state) console.log(`📍 State filter: ${state}`);
    console.log(`🔢 Limit: ${limit}`);
    
    // Process based on mode
    let results;
    switch (mode) {
      case 'federal':
        console.log('🏛️ Processing federal representatives...');
        results = await pipeline.processFederalRepresentatives(limit);
        break;
        
      case 'state':
        if (!state) {
          throw new Error('State required for state mode. Usage: npm run state <STATE>');
        }
        console.log(`🏛️ Processing state representatives for ${state}...`);
        results = await pipeline.processStateRepresentatives(limit, state);
        break;
        
      case 'test':
        console.log('🧪 Running test mode...');
        results = await pipeline.runTestingSuite();
        break;
        
      default:
        throw new Error(`Unknown mode: ${mode}. Use 'federal', 'state', or 'test'`);
    }
    
    // Display results
    console.log('\n📈 Pipeline Results:');
    console.log('===================');
    console.log(`✅ Total Processed: ${results.totalProcessed}`);
    console.log(`✅ Successful: ${results.successful}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📊 Success Rate: ${((results.successful / results.totalProcessed) * 100).toFixed(1)}%`);
    
    if (results.qualityMetrics) {
      console.log(`📊 Average Quality Score: ${results.qualityMetrics.averageScore.toFixed(1)}`);
      console.log(`📊 High Quality Records: ${results.qualityMetrics.highQualityCount}`);
    }
    
    if (results.processingTime) {
      console.log(`⏱️ Processing Time: ${results.processingTime}ms`);
    }
    
    console.log('\n🎉 Pipeline completed successfully!');
    
  } catch (error) {
    console.error('❌ Pipeline failed:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
