import type { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  testFile: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  performance?: {
    loadTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

interface MonitoringSummary {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  totalDuration: number;
  averageDuration: number;
  performanceMetrics: {
    averageLoadTime: number;
    maxLoadTime: number;
    minLoadTime: number;
    memoryPeak: number;
    cpuPeak: number;
  };
  recommendations: string[];
}

async function globalTeardown(config: FullConfig) {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analyzing comprehensive test monitoring results...');
  }

  const monitoringDir = path.join(process.cwd(), 'monitoring-data');
  const testResultsDir = path.join(process.cwd(), 'test-results');
  
  const monitoringSummary: MonitoringSummary = {
    timestamp: new Date().toISOString(),
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    totalDuration: 0,
    averageDuration: 0,
    performanceMetrics: {
      averageLoadTime: 0,
      maxLoadTime: 0,
      minLoadTime: Infinity,
      memoryPeak: 0,
      cpuPeak: 0,
    },
    recommendations: []
  };

  // Analyze test results
  if (fs.existsSync(testResultsDir)) {
    const resultFiles = fs.readdirSync(testResultsDir).filter(f => f.endsWith('.json'));
    
    if (resultFiles.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`📈 Found ${resultFiles.length} test result file(s)`);
      }
      
      const allResults: TestResult[] = [];
      
      for (const file of resultFiles) {
        try {
          const filePath = path.join(testResultsDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const results = JSON.parse(content);
          
          if (results.suites) {
            for (const suite of results.suites) {
              for (const spec of suite.specs) {
                for (const test of spec.tests) {
                  const testResult: TestResult = {
                    testFile: spec.title,
                    status: test.results[0]?.status || 'skipped',
                    duration: test.results[0]?.duration || 0,
                    performance: test.results[0]?.performance
                  };
                  
                  allResults.push(testResult);
                  
                  monitoringSummary.totalTests++;
                  monitoringSummary.totalDuration += testResult.duration;
                  
                  if (testResult.status === 'passed') monitoringSummary.passedTests++;
                  else if (testResult.status === 'failed') monitoringSummary.failedTests++;
                  else monitoringSummary.skippedTests++;
                  
                  if (testResult.performance) {
                    monitoringSummary.performanceMetrics.memoryPeak = Math.max(
                      monitoringSummary.performanceMetrics.memoryPeak,
                      testResult.performance.memoryUsage
                    );
                    monitoringSummary.performanceMetrics.cpuPeak = Math.max(
                      monitoringSummary.performanceMetrics.cpuPeak,
                      testResult.performance.cpuUsage
                    );
                    monitoringSummary.performanceMetrics.maxLoadTime = Math.max(
                      monitoringSummary.performanceMetrics.maxLoadTime,
                      testResult.performance.loadTime
                    );
                    monitoringSummary.performanceMetrics.minLoadTime = Math.min(
                      monitoringSummary.performanceMetrics.minLoadTime,
                      testResult.performance.loadTime
                    );
                  }
                }
              }
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`❌ Error processing result file ${file}:`, error);
          }
        }
      }
      
      if (allResults.length > 0) {
        monitoringSummary.averageDuration = monitoringSummary.totalDuration / monitoringSummary.totalTests;
        monitoringSummary.performanceMetrics.averageLoadTime = 
          monitoringSummary.performanceMetrics.maxLoadTime / allResults.length;
        
        if (monitoringSummary.performanceMetrics.minLoadTime === Infinity) {
          monitoringSummary.performanceMetrics.minLoadTime = 0;
        }
      }
    }
  }

  // Generate recommendations
  if (monitoringSummary.failedTests > 0) {
    monitoringSummary.recommendations.push(
      `⚠️  ${monitoringSummary.failedTests} test(s) failed - review test results and fix issues`
    );
  }
  
  if (monitoringSummary.performanceMetrics.averageLoadTime > 3000) {
    monitoringSummary.recommendations.push(
      `🐌 Average load time (${monitoringSummary.performanceMetrics.averageLoadTime.toFixed(2)}ms) exceeds 3s threshold - optimize performance`
    );
  }
  
  if (monitoringSummary.performanceMetrics.memoryPeak > 100) {
    monitoringSummary.recommendations.push(
      `💾 High memory usage detected (${monitoringSummary.performanceMetrics.memoryPeak.toFixed(2)}MB) - investigate memory leaks`
    );
  }
  
  if (monitoringSummary.averageDuration > 10000) {
    monitoringSummary.recommendations.push(
      `⏱️  Average test duration (${monitoringSummary.averageDuration.toFixed(2)}ms) is high - optimize test performance`
    );
  }

  // Save monitoring summary
  const summaryFile = path.join(monitoringDir, `monitoring-summary-${Date.now()}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify(monitoringSummary, null, 2));

  // Display summary
  if (process.env.NODE_ENV === 'development') {
    console.log('\n📊 COMPREHENSIVE TEST MONITORING SUMMARY');
    console.log('==========================================');
    console.log(`📈 Total Tests: ${monitoringSummary.totalTests}`);
    console.log(`✅ Passed: ${monitoringSummary.passedTests}`);
    console.log(`❌ Failed: ${monitoringSummary.failedTests}`);
    console.log(`⏭️  Skipped: ${monitoringSummary.skippedTests}`);
    console.log(`⏱️  Total Duration: ${(monitoringSummary.totalDuration / 1000).toFixed(2)}s`);
    console.log(`📊 Average Duration: ${monitoringSummary.averageDuration.toFixed(2)}ms`);
    console.log(`🚀 Average Load Time: ${monitoringSummary.performanceMetrics.averageLoadTime.toFixed(2)}ms`);
    console.log(`💾 Memory Peak: ${monitoringSummary.performanceMetrics.memoryPeak.toFixed(2)}MB`);
    console.log(`🖥️  CPU Peak: ${monitoringSummary.performanceMetrics.cpuPeak.toFixed(2)}%`);
    
    if (monitoringSummary.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      monitoringSummary.recommendations.forEach(rec => console.log(`  ${rec}`));
    }
    
    console.log(`\n📁 Monitoring summary saved to: ${summaryFile}`);
    console.log('✅ Comprehensive test monitoring analysis complete');
  }
}

export default globalTeardown;
