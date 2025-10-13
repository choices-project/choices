/**
 * Test Monitoring & Reporting System
 * 
 * Provides comprehensive test monitoring, metrics collection, and reporting
 * for the Choices platform testing infrastructure.
 */

export interface TestMetrics {
  testName: string;
  testSuite: string;
  duration: number;
  memoryUsage: number;
  renderTime: number;
  networkTime: number;
  apiTime: number;
  accessibilityTime: number;
  performanceGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  timestamp: Date;
  status: 'PASS' | 'FAIL' | 'SKIP';
  errorMessage?: string;
}

export interface PerformanceReport {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  averageRenderTime: number;
  averageMemoryUsage: number;
  performanceGrade: string;
  recommendations: string[];
  timestamp: Date;
}

export class TestMonitor {
  private metrics: TestMetrics[] = [];
  private alerts: string[] = [];

  /**
   * Record test metrics
   */
  recordMetrics(metrics: Omit<TestMetrics, 'timestamp'>): void {
    const fullMetrics: TestMetrics = {
      ...metrics,
      timestamp: new Date(),
    };
    
    this.metrics.push(fullMetrics);
    
    // Check for performance alerts
    this.checkPerformanceAlerts(fullMetrics);
  }

  /**
   * Check for performance alerts
   */
  private checkPerformanceAlerts(metrics: TestMetrics): void {
    const alerts: string[] = [];

    // Render time alerts
    if (metrics.renderTime > 200) {
      alerts.push(`⚠️ SLOW RENDER: ${metrics.testName} took ${metrics.renderTime.toFixed(2)}ms (budget: 200ms)`);
    }

    // Memory usage alerts
    if (metrics.memoryUsage > 10) {
      alerts.push(`⚠️ HIGH MEMORY: ${metrics.testName} used ${metrics.memoryUsage.toFixed(2)}MB (budget: 10MB)`);
    }

    // Performance grade alerts
    if (metrics.performanceGrade === 'D' || metrics.performanceGrade === 'F') {
      alerts.push(`🚨 POOR PERFORMANCE: ${metrics.testName} received grade ${metrics.performanceGrade}`);
    }

    // Network time alerts
    if (metrics.networkTime > 500) {
      alerts.push(`⚠️ SLOW NETWORK: ${metrics.testName} network took ${metrics.networkTime.toFixed(2)}ms (budget: 500ms)`);
    }

    this.alerts.push(...alerts);
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    const totalTests = this.metrics.length;
    const passedTests = this.metrics.filter(m => m.status === 'PASS').length;
    const failedTests = this.metrics.filter(m => m.status === 'FAIL').length;
    const skippedTests = this.metrics.filter(m => m.status === 'SKIP').length;

    const averageRenderTime = this.metrics.reduce((sum, m) => sum + m.renderTime, 0) / totalTests;
    const averageMemoryUsage = this.metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / totalTests;

    // Calculate overall performance grade
    const performanceGrade = this.calculateOverallGrade(averageRenderTime, averageMemoryUsage);

    // Generate recommendations
    const recommendations = this.generateRecommendations(averageRenderTime, averageMemoryUsage);

    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      averageRenderTime,
      averageMemoryUsage,
      performanceGrade,
      recommendations,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate overall performance grade
   */
  private calculateOverallGrade(avgRenderTime: number, avgMemoryUsage: number): string {
    let score = 100;

    // Deduct points for slow render times
    if (avgRenderTime > 200) score -= 30;
    else if (avgRenderTime > 150) score -= 20;
    else if (avgRenderTime > 100) score -= 10;

    // Deduct points for high memory usage
    if (avgMemoryUsage > 10) score -= 30;
    else if (avgMemoryUsage > 5) score -= 20;
    else if (avgMemoryUsage > 2) score -= 10;

    // Deduct points for test failures
    const failureRate = this.metrics.filter(m => m.status === 'FAIL').length / this.metrics.length;
    score -= failureRate * 50;

    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(avgRenderTime: number, avgMemoryUsage: number): string[] {
    const recommendations: string[] = [];

    if (avgRenderTime > 150) {
      recommendations.push('🔧 Consider implementing React.memo for expensive components');
      recommendations.push('🔧 Use useMemo/useCallback for expensive calculations');
      recommendations.push('🔧 Consider lazy loading for heavy components');
    }

    if (avgMemoryUsage > 5) {
      recommendations.push('🔧 Implement proper cleanup in useEffect hooks');
      recommendations.push('🔧 Consider component unmounting strategies');
      recommendations.push('🔧 Review memory leaks in event listeners');
    }

    if (this.metrics.some(m => m.networkTime > 500)) {
      recommendations.push('🔧 Optimize API response times');
      recommendations.push('🔧 Implement request caching strategies');
      recommendations.push('🔧 Consider request deduplication');
    }

    if (recommendations.length === 0) {
      recommendations.push('🚀 Excellent performance! No optimizations needed.');
    }

    return recommendations;
  }

  /**
   * Get all alerts
   */
  getAlerts(): string[] {
    return this.alerts;
  }

  /**
   * Get metrics for a specific test suite
   */
  getMetricsForSuite(suiteName: string): TestMetrics[] {
    return this.metrics.filter(m => m.testSuite === suiteName);
  }

  /**
   * Clear all metrics and alerts
   */
  clear(): void {
    this.metrics = [];
    this.alerts = [];
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      alerts: this.alerts,
      report: this.generateReport(),
    }, null, 2);
  }
}

// Global test monitor instance
export const testMonitor = new TestMonitor();

/**
 * Performance grade calculation utility
 */
export function calculatePerformanceGrade(renderTime: number, memoryUsage: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
  let score = 100;

  // Render time scoring
  if (renderTime < 50) score += 10;
  else if (renderTime < 100) score += 5;
  else if (renderTime > 200) score -= 30;
  else if (renderTime > 150) score -= 20;
  else if (renderTime > 100) score -= 10;

  // Memory usage scoring
  if (memoryUsage < 1) score += 10;
  else if (memoryUsage < 2) score += 5;
  else if (memoryUsage > 10) score -= 30;
  else if (memoryUsage > 5) score -= 20;
  else if (memoryUsage > 2) score -= 10;

  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Performance budget constants
 */
export const PERFORMANCE_BUDGETS = {
  RENDER_TIME: 250, // ms - Adjusted for realistic component rendering
  MEMORY_USAGE: 10, // MB
  NETWORK_TIME: 500, // ms
  API_TIME: 300, // ms
  ACCESSIBILITY_TIME: 100, // ms
} as const;










