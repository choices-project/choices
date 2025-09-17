/**
 * Bundle Optimization Utilities
 * 
 * Provides utilities for bundle analysis, optimization,
 * and performance monitoring.
 */

import { bundleMonitor } from '@/lib/performance/bundle-monitor';

/**
 * Bundle size thresholds
 */
export const BUNDLE_THRESHOLDS = {
  MAX_BUNDLE_SIZE: 512000, // 500KB
  MAX_CHUNK_SIZE: 244000,  // 250KB
  WARNING_BUNDLE_SIZE: 400000, // 400KB
  WARNING_CHUNK_SIZE: 200000,  // 200KB
} as const;

/**
 * Analyze bundle size and provide recommendations
 */
export function analyzeBundleSize(bundleData: any): {
  totalSize: number;
  chunks: Array<{ name: string; size: number; gzipSize?: number }>;
  recommendations: string[];
  score: number;
} {
  const chunks = bundleData.chunks || [];
  const totalSize = chunks.reduce((sum: number, chunk: any) => sum + chunk.size, 0);
  
  const recommendations: string[] = [];
  let score = 100;
  
  // Check total bundle size
  if (totalSize > BUNDLE_THRESHOLDS.MAX_BUNDLE_SIZE) {
    recommendations.push('Bundle size exceeds maximum limit. Consider code splitting.');
    score -= 30;
  } else if (totalSize > BUNDLE_THRESHOLDS.WARNING_BUNDLE_SIZE) {
    recommendations.push('Bundle size is approaching limit. Consider optimization.');
    score -= 15;
  }
  
  // Check individual chunks
  chunks.forEach((chunk: any) => {
    if (chunk.size > BUNDLE_THRESHOLDS.MAX_CHUNK_SIZE) {
      recommendations.push(`Chunk "${chunk.name}" is too large. Consider splitting.`);
      score -= 10;
    }
  });
  
  // Check for large dependencies
  const largeDeps = chunks.filter((chunk: any) => 
    chunk.modules && chunk.modules.some((mod: any) => mod.size > 100000)
  );
  
  if (largeDeps.length > 0) {
    recommendations.push('Large dependencies detected. Consider lazy loading.');
    score -= 10;
  }
  
  return {
    totalSize,
    chunks: chunks.map((chunk: any) => ({
      name: chunk.name,
      size: chunk.size,
      gzipSize: chunk.gzipSize,
    })),
    recommendations,
    score: Math.max(0, score),
  };
}

/**
 * Generate bundle optimization recommendations
 */
export function generateOptimizationRecommendations(bundleData: any): string[] {
  const recommendations: string[] = [];
  const chunks = bundleData.chunks || [];
  
  // Check for duplicate dependencies
  const dependencies = new Map<string, number>();
  chunks.forEach((chunk: any) => {
    if (chunk.modules) {
      chunk.modules.forEach((mod: any) => {
        const dep = mod.name || mod.identifier;
        if (dep) {
          dependencies.set(dep, (dependencies.get(dep) || 0) + 1);
        }
      });
    }
  });
  
  const duplicates = Array.from(dependencies.entries())
    .filter(([_, count]) => count > 1);
  
  if (duplicates.length > 0) {
    recommendations.push('Duplicate dependencies detected. Consider deduplication.');
  }
  
  // Check for unused code
  const unusedModules = chunks.filter((chunk: any) => 
    chunk.modules && chunk.modules.some((mod: any) => mod.size === 0)
  );
  
  if (unusedModules.length > 0) {
    recommendations.push('Unused modules detected. Enable tree shaking.');
  }
  
  // Check for large vendor chunks
  const vendorChunks = chunks.filter((chunk: any) => 
    chunk.name && chunk.name.includes('vendor')
  );
  
  if (vendorChunks.length > 0) {
    const largeVendorChunks = vendorChunks.filter((chunk: any) => 
      chunk.size > BUNDLE_THRESHOLDS.MAX_CHUNK_SIZE
    );
    
    if (largeVendorChunks.length > 0) {
      recommendations.push('Large vendor chunks detected. Consider splitting by feature.');
    }
  }
  
  return recommendations;
}

/**
 * Create bundle size report
 */
export function createBundleReport(bundleData: any): string {
  const analysis = analyzeBundleSize(bundleData);
  const recommendations = generateOptimizationRecommendations(bundleData);
  
  let report = `# Bundle Size Report\n\n`;
  report += `## Summary\n`;
  report += `- Total Size: ${formatBytes(analysis.totalSize)}\n`;
  report += `- Chunks: ${analysis.chunks.length}\n`;
  report += `- Score: ${analysis.score}/100\n\n`;
  
  report += `## Chunks\n`;
  analysis.chunks.forEach(chunk => {
    report += `- ${chunk.name}: ${formatBytes(chunk.size)}`;
    if (chunk.gzipSize) {
      report += ` (${formatBytes(chunk.gzipSize)} gzipped)`;
    }
    report += `\n`;
  });
  
  if (analysis.recommendations.length > 0) {
    report += `\n## Recommendations\n`;
    analysis.recommendations.forEach(rec => {
      report += `- ${rec}\n`;
    });
  }
  
  if (recommendations.length > 0) {
    report += `\n## Optimization Suggestions\n`;
    recommendations.forEach(rec => {
      report += `- ${rec}\n`;
    });
  }
  
  return report;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Monitor bundle size changes
 */
export class BundleSizeMonitor {
  private baseline: number;
  private current: number;
  private threshold: number;
  
  constructor(baseline: number, threshold: number = 0.1) {
    this.baseline = baseline;
    this.current = baseline;
    this.threshold = threshold;
  }
  
  update(newSize: number): {
    change: number;
    changePercent: number;
    exceedsThreshold: boolean;
  } {
    this.current = newSize;
    const change = newSize - this.baseline;
    const changePercent = (change / this.baseline) * 100;
    const exceedsThreshold = Math.abs(changePercent) > (this.threshold * 100);
    
    if (exceedsThreshold) {
      bundleMonitor.addMetrics({
        name: 'bundle-size-change',
        size: newSize,
        chunks: [],
        dependencies: [],
      });
    }
    
    return {
      change,
      changePercent,
      exceedsThreshold,
    };
  }
  
  getBaseline(): number {
    return this.baseline;
  }
  
  getCurrent(): number {
    return this.current;
  }
}

/**
 * Create bundle optimization strategy
 */
export function createOptimizationStrategy(bundleData: any): {
  strategy: string;
  actions: string[];
  priority: 'high' | 'medium' | 'low';
} {
  const analysis = analyzeBundleSize(bundleData);
  const _recommendations = generateOptimizationRecommendations(bundleData);
  
  let strategy = 'maintain';
  let priority: 'high' | 'medium' | 'low' = 'low';
  const actions: string[] = [];
  
  if (analysis.score < 50) {
    strategy = 'aggressive';
    priority = 'high';
    actions.push('Implement code splitting');
    actions.push('Enable tree shaking');
    actions.push('Optimize vendor chunks');
    // Add specific recommendations from the analysis
    actions.push(...recommendations.slice(0, 3));
  } else if (analysis.score < 75) {
    strategy = 'moderate';
    priority = 'medium';
    actions.push('Review large dependencies');
    actions.push('Consider lazy loading');
    // Add relevant recommendations
    actions.push(...recommendations.slice(0, 2));
  } else {
    strategy = 'maintain';
    priority = 'low';
    actions.push('Monitor bundle size');
    actions.push('Regular optimization reviews');
    // Add preventive recommendations
    if (recommendations.length > 0) {
      actions.push(recommendations[0]);
    }
  }
  
  return {
    strategy,
    actions,
    priority,
  };
}
