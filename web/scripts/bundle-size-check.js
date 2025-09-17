#!/usr/bin/env node

/**
 * Bundle Size Check Script
 * 
 * Analyzes bundle sizes and provides recommendations for optimization.
 */

import fs from 'fs';
import path from 'path';

// Bundle size thresholds
const THRESHOLDS = {
  MAX_BUNDLE_SIZE: 512000, // 500KB
  MAX_CHUNK_SIZE: 244000,  // 250KB
  WARNING_BUNDLE_SIZE: 400000, // 400KB
  WARNING_CHUNK_SIZE: 200000,  // 200KB
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeBundleSize(bundlePath) {
  if (!fs.existsSync(bundlePath)) {
    console.error(`Bundle file not found: ${bundlePath}`);
    return null;
  }
  
  const stats = fs.statSync(bundlePath);
  const size = stats.size;
  
  return {
    path: bundlePath,
    size,
    formattedSize: formatBytes(size),
    exceedsMax: size > THRESHOLDS.MAX_BUNDLE_SIZE,
    exceedsWarning: size > THRESHOLDS.WARNING_BUNDLE_SIZE,
  };
}

function findBundleFiles(dir) {
  const bundles = [];
  
  function walkDir(currentPath) {
    const files = fs.readdirSync(currentPath);
    
    files.forEach(file => {
      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.js') && !file.includes('runtime')) {
        bundles.push(filePath);
      }
    });
  }
  
  walkDir(dir);
  return bundles;
}

function generateReport(bundles) {
  let report = '\n📊 Bundle Size Analysis Report\n';
  report += '================================\n\n';
  
  const totalSize = bundles.reduce((sum, bundle) => sum + bundle.size, 0);
  const largeBundles = bundles.filter(b => b.exceedsMax);
  const warningBundles = bundles.filter(b => b.exceedsWarning && !b.exceedsMax);
  
  report += `Total Bundle Size: ${formatBytes(totalSize)}\n`;
  report += `Number of Bundles: ${bundles.length}\n`;
  report += `Large Bundles (>${formatBytes(THRESHOLDS.MAX_BUNDLE_SIZE)}): ${largeBundles.length}\n`;
  report += `Warning Bundles (>${formatBytes(THRESHOLDS.WARNING_BUNDLE_SIZE)}): ${warningBundles.length}\n\n`;
  
  if (bundles.length > 0) {
    report += 'Bundle Details:\n';
    report += '---------------\n';
    
    bundles
      .sort((a, b) => b.size - a.size)
      .forEach(bundle => {
        const status = bundle.exceedsMax ? '❌ EXCEEDS MAX' : 
                      bundle.exceedsWarning ? '⚠️  WARNING' : '✅ OK';
        
        report += `${status} ${bundle.formattedSize.padEnd(10)} ${bundle.path}\n`;
      });
    
    report += '\n';
  }
  
  if (largeBundles.length > 0) {
    report += '🚨 Critical Issues:\n';
    report += '-------------------\n';
    largeBundles.forEach(bundle => {
      report += `- ${bundle.path} (${bundle.formattedSize}) exceeds maximum size limit\n`;
    });
    report += '\n';
  }
  
  if (warningBundles.length > 0) {
    report += '⚠️  Warnings:\n';
    report += '-------------\n';
    warningBundles.forEach(bundle => {
      report += `- ${bundle.path} (${bundle.formattedSize}) is approaching size limit\n`;
    });
    report += '\n';
  }
  
  // Recommendations
  report += '💡 Recommendations:\n';
  report += '-------------------\n';
  
  if (largeBundles.length > 0) {
    report += '- Implement code splitting for large bundles\n';
    report += '- Consider lazy loading for non-critical components\n';
    report += '- Optimize vendor chunks by splitting by feature\n';
  }
  
  if (totalSize > THRESHOLDS.MAX_BUNDLE_SIZE * 2) {
    report += '- Enable tree shaking to remove unused code\n';
    report += '- Consider dynamic imports for large dependencies\n';
  }
  
  if (bundles.length > 10) {
    report += '- Consider consolidating small bundles\n';
  }
  
  report += '- Use webpack-bundle-analyzer for detailed analysis\n';
  report += '- Monitor bundle sizes in CI/CD pipeline\n';
  
  return report;
}

function main() {
  const buildDir = path.join(__dirname, '..', '.next', 'static', 'chunks');
  
  if (!fs.existsSync(buildDir)) {
    console.error('Build directory not found. Please run "npm run build" first.');
    process.exit(1);
  }
  
  console.log('🔍 Analyzing bundle sizes...\n');
  
  const bundleFiles = findBundleFiles(buildDir);
  
  if (bundleFiles.length === 0) {
    console.log('No bundle files found in build directory.');
    process.exit(0);
  }
  
  const bundles = bundleFiles.map(analyzeBundleSize).filter(Boolean);
  
  const report = generateReport(bundles);
  console.log(report);
  
  // Exit with error code if there are critical issues
  const hasCriticalIssues = bundles.some(b => b.exceedsMax);
  if (hasCriticalIssues) {
    console.log('❌ Bundle size check failed due to critical issues.');
    process.exit(1);
  } else {
    console.log('✅ Bundle size check passed.');
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  analyzeBundleSize,
  findBundleFiles,
  generateReport,
  formatBytes,
  THRESHOLDS,
};
