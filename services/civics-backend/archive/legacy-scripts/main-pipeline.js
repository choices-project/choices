#!/usr/bin/env node

/**
 * Main Civics Pipeline
 * 
 * Clean, organized pipeline using existing sophisticated civics services
 * for comprehensive representative data processing and database population
 */

// Load environment variables
require('dotenv').config();

const { CivicsBackendPipeline } = require('./civics-backend-pipeline');

/**
 * Main pipeline execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const options = {
    mode: args[0] || 'federal',
    limit: parseInt(args[1]) || 100,
    state: args[2] || null,
    dryRun: args.includes('--dry-run'),
    test: args.includes('--test'),
    stats: args.includes('--stats')
  };

  console.log('🚀 Civics Backend Pipeline');
  console.log('==========================');
  console.log(`Mode: ${options.mode}`);
  console.log(`Limit: ${options.limit}`);
  console.log(`State: ${options.state || 'All'}`);
  console.log(`Dry Run: ${options.dryRun}`);
  console.log('');

  try {
    const pipeline = new CivicsBackendPipeline();

    // Handle different commands
    if (options.test) {
      console.log('🧪 Running component tests...');
      const testResults = await pipeline.testComponents();
      
      console.log(`\n📊 Test Results: ${testResults.passed}/${testResults.total} passed`);
      
      if (testResults.failed > 0) {
        console.log('\n❌ Failed tests:');
        testResults.results
          .filter(r => r.status === 'failed')
          .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
      }
      
      process.exit(testResults.failed > 0 ? 1 : 0);
    }

    if (options.stats) {
      console.log('📊 Getting pipeline statistics...');
      const stats = await pipeline.getStats();
      
      console.log('\n📈 Pipeline Statistics:');
      console.log(`   Crosswalk entities: ${stats.crosswalk?.total_entities || 0}`);
      console.log(`   System date: ${stats.systemDate?.isoString}`);
      console.log(`   Pipeline status: ${stats.pipeline?.status}`);
      
      return;
    }

    // Run the main pipeline
    console.log('🔄 Starting pipeline processing...');
    const result = await pipeline.runPipeline(options);

    if (result.success) {
      console.log('\n✅ Pipeline completed successfully!');
      console.log(`   Processed: ${result.report?.totalProcessed || 0}`);
      console.log(`   Successful: ${result.report?.successful || 0}`);
      console.log(`   Failed: ${result.report?.failed || 0}`);
      console.log(`   Quality Score: ${result.report?.averageQuality?.toFixed(1) || 'N/A'}`);
    } else {
      console.log('\n❌ Pipeline failed:');
      console.log(`   Error: ${result.message}`);
      if (result.error) {
        console.log(`   Details: ${result.error}`);
      }
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Pipeline crashed:', error.message);
    process.exit(1);
  }
}

// Show help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Civics Backend Pipeline

Usage:
  node scripts/main-pipeline.js [mode] [limit] [state] [options]

Arguments:
  mode     Processing mode: 'federal' or 'state' (default: federal)
  limit    Maximum number of representatives to process (default: 100)
  state    State code for state mode (e.g., 'CA', 'NY')

Options:
  --dry-run    Run without making database changes
  --test       Run component tests
  --stats      Show pipeline statistics
  --help       Show this help message

Examples:
  node scripts/main-pipeline.js federal 50
  node scripts/main-pipeline.js state 25 CA
  node scripts/main-pipeline.js federal 10 --dry-run
  node scripts/main-pipeline.js --test
  node scripts/main-pipeline.js --stats
`);
  process.exit(0);
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main };
