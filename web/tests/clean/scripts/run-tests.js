#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * 
 * Runs all test suites with proper configuration:
 * - Unit tests (Jest)
 * - E2E tests (Playwright)
 * - Performance tests
 * - Coverage reports
 * - CI/CD integration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  // Test directories
  UNIT_TESTS: 'tests/clean/unit',
  E2E_TESTS: 'tests/clean/e2e',
  INTEGRATION_TESTS: 'tests/clean/integration',
  PERFORMANCE_TESTS: 'tests/clean/performance',
  ERROR_PREVENTION_TESTS: 'tests/clean/error-prevention',
  
  // Coverage thresholds
  COVERAGE_THRESHOLD: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
  
  // Performance thresholds
  PERFORMANCE_THRESHOLD: {
    unitTests: 2000, // 2 seconds
    e2eTests: 30000, // 30 seconds
    componentTests: 1000, // 1 second
  },
  
  // Test timeout
  TEST_TIMEOUT: 10000,
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Test execution functions
function runUnitTests() {
  logStep('UNIT', 'Running unit tests...');
  
  try {
    const command = `npm run test -- --testPathPattern="${TEST_CONFIG.UNIT_TESTS}" --coverage --verbose`;
    execSync(command, { stdio: 'inherit' });
    logSuccess('Unit tests completed successfully');
    return true;
  } catch (error) {
    logError('Unit tests failed');
    return false;
  }
}

function runIntegrationTests() {
  logStep('INTEGRATION', 'Running integration tests...');
  
  try {
    const command = `npm run test -- --testPathPattern="${TEST_CONFIG.INTEGRATION_TESTS}" --verbose`;
    execSync(command, { stdio: 'inherit' });
    logSuccess('Integration tests completed successfully');
    return true;
  } catch (error) {
    logError('Integration tests failed');
    return false;
  }
}

function runE2ETests() {
  logStep('E2E', 'Running E2E tests...');
  
  try {
    const command = `npx playwright test ${TEST_CONFIG.E2E_TESTS} --reporter=html`;
    execSync(command, { stdio: 'inherit' });
    logSuccess('E2E tests completed successfully');
    return true;
  } catch (error) {
    logError('E2E tests failed');
    return false;
  }
}

function runPerformanceTests() {
  logStep('PERFORMANCE', 'Running performance tests...');
  
  try {
    const command = `npm run test -- --testPathPattern="${TEST_CONFIG.PERFORMANCE_TESTS}" --verbose`;
    execSync(command, { stdio: 'inherit' });
    logSuccess('Performance tests completed successfully');
    return true;
  } catch (error) {
    logError('Performance tests failed');
    return false;
  }
}

function runErrorPreventionTests() {
  logStep('ERROR-PREVENTION', 'Running error prevention tests...');
  
  try {
    const command = `npm run test -- --testPathPattern="${TEST_CONFIG.ERROR_PREVENTION_TESTS}" --verbose`;
    execSync(command, { stdio: 'inherit' });
    logSuccess('Error prevention tests completed successfully');
    return true;
  } catch (error) {
    logError('Error prevention tests failed');
    return false;
  }
}

function runAllTests() {
  logStep('ALL', 'Running all test suites...');
  
  try {
    const command = `npm run test -- --testPathPattern="tests/clean" --coverage --verbose`;
    execSync(command, { stdio: 'inherit' });
    logSuccess('All tests completed successfully');
    return true;
  } catch (error) {
    logError('Some tests failed');
    return false;
  }
}

function generateCoverageReport() {
  logStep('COVERAGE', 'Generating coverage report...');
  
  try {
    const command = `npm run test -- --coverage --coverageReporters=html,text,lcov`;
    execSync(command, { stdio: 'inherit' });
    logSuccess('Coverage report generated');
    return true;
  } catch (error) {
    logError('Coverage report generation failed');
    return false;
  }
}

function checkCoverageThresholds() {
  logStep('COVERAGE-CHECK', 'Checking coverage thresholds...');
  
  try {
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    if (fs.existsSync(coveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      const total = coverage.total;
      
      const thresholds = TEST_CONFIG.COVERAGE_THRESHOLD;
      const passed = 
        total.branches.pct >= thresholds.branches &&
        total.functions.pct >= thresholds.functions &&
        total.lines.pct >= thresholds.lines &&
        total.statements.pct >= thresholds.statements;
      
      if (passed) {
        logSuccess('Coverage thresholds met');
        log(`  Branches: ${total.branches.pct}% (threshold: ${thresholds.branches}%)`, 'green');
        log(`  Functions: ${total.functions.pct}% (threshold: ${thresholds.functions}%)`, 'green');
        log(`  Lines: ${total.lines.pct}% (threshold: ${thresholds.lines}%)`, 'green');
        log(`  Statements: ${total.statements.pct}% (threshold: ${thresholds.statements}%)`, 'green');
        return true;
      } else {
        logError('Coverage thresholds not met');
        log(`  Branches: ${total.branches.pct}% (threshold: ${thresholds.branches}%)`, 'red');
        log(`  Functions: ${total.functions.pct}% (threshold: ${thresholds.functions}%)`, 'red');
        log(`  Lines: ${total.lines.pct}% (threshold: ${thresholds.lines}%)`, 'red');
        log(`  Statements: ${total.statements.pct}% (threshold: ${thresholds.statements}%)`, 'red');
        return false;
      }
    } else {
      logWarning('Coverage summary not found');
      return false;
    }
  } catch (error) {
    logError('Coverage threshold check failed');
    return false;
  }
}

function runLinting() {
  logStep('LINT', 'Running ESLint...');
  
  try {
    const command = `npm run lint`;
    execSync(command, { stdio: 'inherit' });
    logSuccess('Linting completed successfully');
    return true;
  } catch (error) {
    logError('Linting failed');
    return false;
  }
}

function runTypeChecking() {
  logStep('TYPES', 'Running TypeScript type checking...');
  
  try {
    const command = `npm run types:strict`;
    execSync(command, { stdio: 'inherit' });
    logSuccess('Type checking completed successfully');
    return true;
  } catch (error) {
    logError('Type checking failed');
    return false;
  }
}

function generateTestReport() {
  logStep('REPORT', 'Generating test report...');
  
  try {
    const reportPath = path.join(process.cwd(), 'test-report.html');
    const reportContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Report - ${new Date().toISOString()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
    </div>
    
    <div class="section">
        <h2>Test Summary</h2>
        <p>This report contains the results of all test suites run.</p>
    </div>
    
    <div class="section">
        <h2>Coverage Report</h2>
        <p>Coverage reports are available in the <code>coverage/</code> directory.</p>
    </div>
    
    <div class="section">
        <h2>E2E Test Results</h2>
        <p>E2E test results are available in the <code>playwright-report/</code> directory.</p>
    </div>
</body>
</html>`;
    
    fs.writeFileSync(reportPath, reportContent);
    logSuccess(`Test report generated: ${reportPath}`);
    return true;
  } catch (error) {
    logError('Test report generation failed');
    return false;
  }
}

// Main execution function
async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';
  
  logSection('COMPREHENSIVE TEST RUNNER');
  log(`Running tests: ${testType}`, 'bright');
  log(`Timestamp: ${new Date().toISOString()}`, 'bright');
  
  const results = {
    unit: false,
    integration: false,
    e2e: false,
    performance: false,
    errorPrevention: false,
    linting: false,
    typeChecking: false,
    coverage: false,
  };
  
  try {
    // Run linting and type checking first
    results.linting = runLinting();
    results.typeChecking = runTypeChecking();
    
    if (!results.linting || !results.typeChecking) {
      logError('Linting or type checking failed. Stopping test execution.');
      process.exit(1);
    }
    
    // Run tests based on type
    switch (testType) {
      case 'unit':
        results.unit = runUnitTests();
        break;
      case 'integration':
        results.integration = runIntegrationTests();
        break;
      case 'e2e':
        results.e2e = runE2ETests();
        break;
      case 'performance':
        results.performance = runPerformanceTests();
        break;
      case 'error-prevention':
        results.errorPrevention = runErrorPreventionTests();
        break;
      case 'all':
        results.unit = runUnitTests();
        results.integration = runIntegrationTests();
        results.e2e = runE2ETests();
        results.performance = runPerformanceTests();
        results.errorPrevention = runErrorPreventionTests();
        break;
      default:
        logError(`Unknown test type: ${testType}`);
        process.exit(1);
    }
    
    // Generate coverage report
    results.coverage = generateCoverageReport();
    
    // Check coverage thresholds
    const coveragePassed = checkCoverageThresholds();
    
    // Generate test report
    generateTestReport();
    
    // Summary
    logSection('TEST SUMMARY');
    log(`Unit Tests: ${results.unit ? '✅ PASSED' : '❌ FAILED'}`, results.unit ? 'green' : 'red');
    log(`Integration Tests: ${results.integration ? '✅ PASSED' : '❌ FAILED'}`, results.integration ? 'green' : 'red');
    log(`E2E Tests: ${results.e2e ? '✅ PASSED' : '❌ FAILED'}`, results.e2e ? 'green' : 'red');
    log(`Performance Tests: ${results.performance ? '✅ PASSED' : '❌ FAILED'}`, results.performance ? 'green' : 'red');
    log(`Error Prevention Tests: ${results.errorPrevention ? '✅ PASSED' : '❌ FAILED'}`, results.errorPrevention ? 'green' : 'red');
    log(`Linting: ${results.linting ? '✅ PASSED' : '❌ FAILED'}`, results.linting ? 'green' : 'red');
    log(`Type Checking: ${results.typeChecking ? '✅ PASSED' : '❌ FAILED'}`, results.typeChecking ? 'green' : 'red');
    log(`Coverage: ${coveragePassed ? '✅ PASSED' : '❌ FAILED'}`, coveragePassed ? 'green' : 'red');
    
    // Overall result
    const allPassed = Object.values(results).every(result => result) && coveragePassed;
    
    if (allPassed) {
      logSuccess('All tests passed! 🎉');
      process.exit(0);
    } else {
      logError('Some tests failed. Please check the output above.');
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runUnitTests,
  runIntegrationTests,
  runE2ETests,
  runPerformanceTests,
  runErrorPreventionTests,
  runAllTests,
  generateCoverageReport,
  checkCoverageThresholds,
  runLinting,
  runTypeChecking,
  generateTestReport,
};
