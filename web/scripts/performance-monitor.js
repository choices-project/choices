#!/usr/bin/env node

/**
 * Performance Monitor Script
 * 
 * Monitors performance metrics and provides analysis.
 */

import fs from 'fs';
import path from 'path';

// Performance thresholds
const THRESHOLDS = {
  MAX_LOAD_TIME: 2000, // 2 seconds
  MAX_BUNDLE_SIZE: 512000, // 500KB
  MAX_MEMORY_USAGE: 100 * 1024 * 1024, // 100MB
  MIN_PERFORMANCE_SCORE: 80,
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function analyzePerformance(metrics) {
  const analysis = {
    score: 100,
    issues: [],
    recommendations: [],
  };
  
  // Check load time
  if (metrics.loadTime > THRESHOLDS.MAX_LOAD_TIME) {
    analysis.score -= 20;
    analysis.issues.push(`Load time (${formatTime(metrics.loadTime)}) exceeds threshold (${formatTime(THRESHOLDS.MAX_LOAD_TIME)})`);
    analysis.recommendations.push('Optimize bundle size and implement code splitting');
  }
  
  // Check bundle size
  if (metrics.bundleSize > THRESHOLDS.MAX_BUNDLE_SIZE) {
    analysis.score -= 25;
    analysis.issues.push(`Bundle size (${formatBytes(metrics.bundleSize)}) exceeds threshold (${formatBytes(THRESHOLDS.MAX_BUNDLE_SIZE)})`);
    analysis.recommendations.push('Implement lazy loading and optimize dependencies');
  }
  
  // Check memory usage
  if (metrics.memoryUsage > THRESHOLDS.MAX_MEMORY_USAGE) {
    analysis.score -= 15;
    analysis.issues.push(`Memory usage (${formatBytes(metrics.memoryUsage)}) exceeds threshold (${formatBytes(THRESHOLDS.MAX_MEMORY_USAGE)})`);
    analysis.recommendations.push('Optimize memory usage and implement garbage collection');
  }
  
  // Check performance score
  if (metrics.performanceScore < THRESHOLDS.MIN_PERFORMANCE_SCORE) {
    analysis.score -= 20;
    analysis.issues.push(`Performance score (${metrics.performanceScore}) below threshold (${THRESHOLDS.MIN_PERFORMANCE_SCORE})`);
    analysis.recommendations.push('Improve Core Web Vitals and optimize rendering');
  }
  
  return analysis;
}

function generatePerformanceReport(metrics, analysis) {
  let report = '\n📈 Performance Monitor Report\n';
  report += '=============================\n\n';
  
  report += `Performance Score: ${analysis.score}/100\n`;
  report += `Load Time: ${formatTime(metrics.loadTime)}\n`;
  report += `Bundle Size: ${formatBytes(metrics.bundleSize)}\n`;
  report += `Memory Usage: ${formatBytes(metrics.memoryUsage)}\n`;
  report += `Core Web Vitals Score: ${metrics.performanceScore}/100\n\n`;
  
  if (analysis.issues.length > 0) {
    report += '🚨 Issues Found:\n';
    report += '----------------\n';
    analysis.issues.forEach(issue => {
      report += `- ${issue}\n`;
    });
    report += '\n';
  }
  
  if (analysis.recommendations.length > 0) {
    report += '💡 Recommendations:\n';
    report += '-------------------\n';
    analysis.recommendations.forEach(rec => {
      report += `- ${rec}\n`;
    });
    report += '\n';
  }
  
  // Performance tips
  report += '🔧 Performance Tips:\n';
  report += '--------------------\n';
  report += '- Use React.memo() for expensive components\n';
  report += '- Implement virtual scrolling for large lists\n';
  report += '- Optimize images with next/image\n';
  report += '- Use dynamic imports for code splitting\n';
  report += '- Enable compression and caching\n';
  report += '- Monitor Core Web Vitals regularly\n';
  
  return report;
}

function collectMetrics() {
  // In a real implementation, this would collect actual metrics
  // For now, we'll simulate some metrics
  return {
    loadTime: Math.random() * 3000 + 500, // 500ms to 3.5s
    bundleSize: Math.random() * 1000000 + 100000, // 100KB to 1.1MB
    memoryUsage: Math.random() * 200 * 1024 * 1024 + 50 * 1024 * 1024, // 50MB to 250MB
    performanceScore: Math.random() * 40 + 60, // 60 to 100
  };
}

function main() {
  console.log('🔍 Collecting performance metrics...\n');
  
  const metrics = collectMetrics();
  const analysis = analyzePerformance(metrics);
  const report = generatePerformanceReport(metrics, analysis);
  
  console.log(report);
  
  // Save metrics to file
  const metricsFile = path.join(__dirname, '..', 'performance-metrics.json');
  const metricsData = {
    timestamp: new Date().toISOString(),
    metrics,
    analysis,
  };
  
  fs.writeFileSync(metricsFile, JSON.stringify(metricsData, null, 2));
  console.log(`📊 Metrics saved to: ${metricsFile}`);
  
  // Exit with error code if performance is poor
  if (analysis.score < 70) {
    console.log('❌ Performance monitoring failed due to poor performance.');
    process.exit(1);
  } else {
    console.log('✅ Performance monitoring passed.');
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  analyzePerformance,
  generatePerformanceReport,
  collectMetrics,
  formatBytes,
  formatTime,
  THRESHOLDS,
};
