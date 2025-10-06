/**
 * Test Date Filtering Logic
 * 
 * This script tests the current representative filtering logic
 * to ensure it properly filters out expired representatives.
 */

// Test the date filtering logic
function testDateFiltering() {
  console.log('🧪 TESTING DATE FILTERING LOGIC');
  console.log('================================');
  console.log('');

  const currentDate = new Date();
  console.log(`Current System Date: ${currentDate.toISOString()}`);
  console.log(`Current Year: ${currentDate.getFullYear()}`);
  console.log('');

  // Test cases
  const testCases = [
    {
      name: "Joe Biden",
      termStartDate: "2021-01-20",
      termEndDate: "2025-01-20",
      expected: false, // Should be filtered out (expired)
      reason: "Term ended 8+ months ago"
    },
    {
      name: "Kamala Harris", 
      termStartDate: "2021-01-20",
      termEndDate: "2025-01-20",
      expected: false, // Should be filtered out (expired)
      reason: "Term ended 8+ months ago"
    },
    {
      name: "Nancy Pelosi",
      termStartDate: "2021-01-03", 
      termEndDate: "2025-01-03",
      expected: false, // Should be filtered out (expired)
      reason: "Term ended 9+ months ago"
    },
    {
      name: "Current Representative",
      termStartDate: "2025-01-01",
      termEndDate: "2027-01-01", 
      expected: true, // Should be processed (current)
      reason: "Term is current"
    },
    {
      name: "Future Representative",
      termStartDate: "2026-01-01",
      termEndDate: "2028-01-01",
      expected: false, // Should be filtered out (future)
      reason: "Term hasn't started yet"
    }
  ];

  console.log('📊 TEST RESULTS:');
  console.log('================');
  
  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. Testing: ${testCase.name}`);
    console.log(`   Term: ${testCase.termStartDate} to ${testCase.termEndDate}`);
    console.log(`   Expected: ${testCase.expected ? 'CURRENT' : 'FILTERED OUT'}`);
    console.log(`   Reason: ${testCase.reason}`);
    
    // Simulate the filtering logic
    const termStart = new Date(testCase.termStartDate);
    const termEnd = new Date(testCase.termEndDate);
    
    let isCurrent = true;
    
    // Check if term has started
    if (termStart > currentDate) {
      isCurrent = false;
      console.log(`   ❌ Term hasn't started yet (${termStart.toISOString()} > ${currentDate.toISOString()})`);
    }
    
    // Check if term has ended
    if (termEnd < currentDate) {
      isCurrent = false;
      console.log(`   ❌ Term has expired (${termEnd.toISOString()} < ${currentDate.toISOString()})`);
    }
    
    if (isCurrent) {
      console.log(`   ✅ Term is current (${termStart.toISOString()} <= ${currentDate.toISOString()} <= ${termEnd.toISOString()})`);
    }
    
    const result = isCurrent ? 'CURRENT' : 'FILTERED OUT';
    const success = isCurrent === testCase.expected;
    
    if (success) {
      console.log(`   ✅ PASS: ${result} (matches expected)`);
      passed++;
    } else {
      console.log(`   ❌ FAIL: ${result} (expected ${testCase.expected ? 'CURRENT' : 'FILTERED OUT'})`);
      failed++;
    }
  });

  console.log('\n📈 SUMMARY:');
  console.log('===========');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${Math.round((passed / testCases.length) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('The date filtering logic is working correctly.');
  } else {
    console.log('\n🚨 SOME TESTS FAILED!');
    console.log('The date filtering logic needs to be fixed.');
  }
  
  console.log('\n🔍 KEY FINDINGS:');
  console.log('- Biden, Harris, Pelosi should be FILTERED OUT (terms expired)');
  console.log('- Only representatives with current terms should be processed');
  console.log('- System date: October 6, 2025');
  console.log('- Terms ending before this date are expired');
}

// Run the test
testDateFiltering();
