import { chromium } from '@playwright/test';
import type { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global Teardown for Performance Testing
 * 
 * Collects and analyzes performance data from all test runs
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

async function globalTeardown(config: FullConfig) {
  console.log('📊 Analyzing performance test results...');
  
  try {
    // Collect performance data from test results
    const resultsDir = path.join(__dirname, '../test-results');
    const performanceFile = path.join(resultsDir, 'performance-results.json');
    
    if (fs.existsSync(performanceFile)) {
      const results = JSON.parse(fs.readFileSync(performanceFile, 'utf8'));
      
      // Analyze performance metrics
      const analysis = {
        timestamp: new Date().toISOString(),
        totalTests: results.suites?.length || 0,
        passedTests: results.suites?.filter((suite: any) => suite.ok).length || 0,
        failedTests: results.suites?.filter((suite: any) => !suite.ok).length || 0,
        performanceMetrics: {
          averageTestDuration: 0,
          slowestTest: 0,
          fastestTest: 0
        }
      };
      
      // Calculate performance metrics
      if (results.suites) {
        const durations = results.suites.map((suite: any) => suite.duration || 0);
        analysis.performanceMetrics.averageTestDuration = durations.reduce((a: number, b: number) => a + b, 0) / durations.length;
        analysis.performanceMetrics.slowestTest = Math.max(...durations);
        analysis.performanceMetrics.fastestTest = Math.min(...durations);
      }
      
      // Save performance analysis
      const analysisFile = path.join(resultsDir, 'performance-analysis.json');
      fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2));
      
      console.log('📈 Performance Analysis:');
      console.log(`  Total Tests: ${analysis.totalTests}`);
      console.log(`  Passed: ${analysis.passedTests}`);
      console.log(`  Failed: ${analysis.failedTests}`);
      console.log(`  Average Duration: ${analysis.performanceMetrics.averageTestDuration.toFixed(2)}ms`);
      console.log(`  Slowest Test: ${analysis.performanceMetrics.slowestTest}ms`);
      console.log(`  Fastest Test: ${analysis.performanceMetrics.fastestTest}ms`);
      
      // Performance thresholds
      const thresholds = {
        averageTestDuration: 5000, // 5 seconds
        slowestTest: 10000, // 10 seconds
        failureRate: 0.1 // 10%
      };
      
      const failureRate = analysis.failedTests / analysis.totalTests;
      
      if (analysis.performanceMetrics.averageTestDuration > thresholds.averageTestDuration) {
        console.warn(`⚠️  Average test duration (${analysis.performanceMetrics.averageTestDuration.toFixed(2)}ms) exceeds threshold (${thresholds.averageTestDuration}ms)`);
      }
      
      if (analysis.performanceMetrics.slowestTest > thresholds.slowestTest) {
        console.warn(`⚠️  Slowest test (${analysis.performanceMetrics.slowestTest}ms) exceeds threshold (${thresholds.slowestTest}ms)`);
      }
      
      if (failureRate > thresholds.failureRate) {
        console.warn(`⚠️  Test failure rate (${(failureRate * 100).toFixed(1)}%) exceeds threshold (${(thresholds.failureRate * 100).toFixed(1)}%)`);
      }
      
      if (analysis.performanceMetrics.averageTestDuration <= thresholds.averageTestDuration && 
          analysis.performanceMetrics.slowestTest <= thresholds.slowestTest && 
          failureRate <= thresholds.failureRate) {
        console.log('✅ All performance thresholds met');
      }
      
    } else {
      console.log('ℹ️  No performance results found to analyze');
    }
    
  } catch (error) {
    console.error('❌ Performance analysis failed:', error);
  }
  
  console.log('✅ Performance testing teardown complete');
}

export default globalTeardown;
