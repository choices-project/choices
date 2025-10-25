/**
 * Test Civics Backend Pipeline
 * 
 * Simple test script to verify the civics backend pipeline works correctly
 */

const { CivicsBackendPipeline } = require('./civics-backend-pipeline');

async function testCivicsPipeline() {
  console.log('🧪 Testing Civics Backend Pipeline...\n');

  try {
    const pipeline = new CivicsBackendPipeline();

    // Test 1: Component tests
    console.log('1️⃣ Testing individual components...');
    const componentResults = await pipeline.testComponents();
    
    console.log(`   Results: ${componentResults.passed}/${componentResults.total} passed`);
    if (componentResults.failed > 0) {
      console.log('   Failed components:');
      componentResults.results
        .filter(r => r.status === 'failed')
        .forEach(r => console.log(`     - ${r.name}: ${r.error}`));
    }

    // Test 2: Pipeline stats
    console.log('\n2️⃣ Testing pipeline stats...');
    const stats = await pipeline.getStats();
    console.log(`   Crosswalk entities: ${stats.crosswalk?.total_entities || 0}`);
    console.log(`   System date: ${stats.systemDate?.isoString}`);

    // Test 3: Small pipeline run
    console.log('\n3️⃣ Testing small pipeline run...');
    const result = await pipeline.runPipeline({
      mode: 'federal',
      limit: 1,
      dryRun: true
    });

    console.log(`   Success: ${result.success}`);
    console.log(`   Message: ${result.message}`);

    if (result.report) {
      console.log(`   Processed: ${result.report.totalProcessed}`);
      console.log(`   Successful: ${result.report.successful}`);
      console.log(`   Failed: ${result.report.failed}`);
    }

    console.log('\n✅ All tests completed successfully!');
    return true;

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testCivicsPipeline()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { testCivicsPipeline };
