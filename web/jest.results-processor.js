/**
 * Jest Results Processor
 * 
 * Created: October 18, 2025
 * Updated: October 18, 2025
 * 
 * Processes Jest test results for enhanced reporting
 */

module.exports = (results) => {
  // Process test results
  const { numTotalTests, numPassedTests, numFailedTests, numPendingTests } = results;
  
  console.log(`\n🧪 Test Results Summary:`);
  console.log(`   Total: ${numTotalTests}`);
  console.log(`   Passed: ${numPassedTests}`);
  console.log(`   Failed: ${numFailedTests}`);
  console.log(`   Pending: ${numPendingTests}`);
  
  if (numFailedTests > 0) {
    console.log(`\n❌ ${numFailedTests} test(s) failed`);
  } else {
    console.log(`\n✅ All tests passed!`);
  }
  
  return results;
};
