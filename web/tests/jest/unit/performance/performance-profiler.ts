/**
 * @jest-environment jsdom
 */

import { logger } from '@/lib/utils/logger';

export interface ProfilerMetrics {
  componentName: string;
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
  memoryPeak: number;
  memoryAverage: number;
  reRenderTriggers: string[];
  performanceBottlenecks: string[];
  optimizationScore: number;
  recommendations: string[];
  timestamp: Date;
  testSuite?: string;
  duration?: number;
  memoryUsage?: number;
  renderTime?: number;
  networkTime?: number;
  apiTime?: number;
  accessibilityTime?: number;
  performanceGrade?: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  status?: 'PASS' | 'FAIL';
  errorMessage?: string;
}

export interface ComponentProfile {
  name: string;
  metrics: ProfilerMetrics;
  children: ComponentProfile[];
  parent?: ComponentProfile;
  depth: number;
  isOptimized: boolean;
  optimizationPotential: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface PerformanceAnalysis {
  overallScore: number;
  criticalIssues: string[];
  optimizationOpportunities: string[];
  memoryLeaks: string[];
  renderOptimizations: string[];
  networkOptimizations: string[];
  accessibilityOptimizations: string[];
  recommendations: string[];
  estimatedImprovement: number; // percentage
}

export class PerformanceProfiler {
  private profiles: Map<string, ComponentProfile> = new Map();
  private metrics: ProfilerMetrics[] = [];
  private alerts: string[] = [];
  private isProfiling: boolean = false;
  private startTime: number = 0;
  private startMemory: number = 0;

  /**
   * Start profiling a component
   */
  startProfiling(componentName: string): void {
    this.isProfiling = true;
    this.startTime = performance.now();
    this.startMemory = performance.memory?.usedJSHeapSize || 0;
    
    logger.info(`🔍 Starting performance profiling for: ${componentName}`);
  }

  /**
   * Stop profiling and record metrics
   */
  stopProfiling(componentName: string, renderCount: number = 1): ProfilerMetrics {
    if (!this.isProfiling) {
      throw new Error('Profiling not started. Call startProfiling() first.');
    }

    const endTime = performance.now();
    const endMemory = performance.memory?.usedJSHeapSize || 0;
    
    const totalRenderTime = endTime - this.startTime;
    const averageRenderTime = totalRenderTime / renderCount;
    const memoryUsed = (endMemory - this.startMemory) / (1024 * 1024);
    
    const metrics: ProfilerMetrics = {
      componentName,
      renderCount,
      totalRenderTime,
      averageRenderTime,
      maxRenderTime: totalRenderTime,
      minRenderTime: totalRenderTime,
      memoryPeak: memoryUsed,
      memoryAverage: memoryUsed,
      reRenderTriggers: this.analyzeReRenderTriggers(componentName),
      performanceBottlenecks: this.analyzeBottlenecks(totalRenderTime, memoryUsed),
      optimizationScore: this.calculateOptimizationScore(totalRenderTime, memoryUsed, renderCount),
      recommendations: this.generateRecommendations(totalRenderTime, memoryUsed, renderCount),
      timestamp: new Date(),
    };

    this.metrics.push(metrics);
    this.isProfiling = false;
    
    logger.info(`✅ Performance profiling completed for: ${componentName}`);
    logger.info(`- Render Time: ${totalRenderTime.toFixed(2)}ms`);
    logger.info(`- Memory Used: ${memoryUsed.toFixed(2)}MB`);
    logger.info(`- Optimization Score: ${metrics.optimizationScore}/100`);
    
    return metrics;
  }

  /**
   * Analyze re-render triggers
   */
  private analyzeReRenderTriggers(componentName: string): string[] {
    const triggers: string[] = [];
    
    // Analyze actual re-render triggers based on component behavior
    const renderCount = this.metrics.filter(m => m.componentName === componentName).length;
    const recentMetrics = this.metrics.filter(m => m.componentName === componentName).slice(-3);
    
    // Check for excessive re-renders
    if (renderCount > 5) {
      triggers.push('Excessive re-renders detected');
    }
    
    // Check for render time patterns
    if (recentMetrics.length > 1) {
      const avgRenderTime = recentMetrics.reduce((sum, m) => sum + m.averageRenderTime, 0) / recentMetrics.length;
      if (avgRenderTime > 100) {
        triggers.push('Slow render times');
      }
    }
    
    // Check for memory patterns
    if (recentMetrics.length > 1) {
      const memoryTrend = recentMetrics.map(m => m.memoryPeak);
      const isIncreasing = memoryTrend.every((val, i) => i === 0 || val >= memoryTrend[i - 1]);
      if (isIncreasing && memoryTrend[memoryTrend.length - 1] > 5) {
        triggers.push('Increasing memory usage pattern');
      }
    }
    
    // Check for performance degradation
    if (recentMetrics.length > 2) {
      const scores = recentMetrics.map(m => m.optimizationScore);
      const isDegrading = scores.every((score, i) => i === 0 || score <= scores[i - 1]);
      if (isDegrading && scores[scores.length - 1] < 70) {
        triggers.push('Performance degradation detected');
      }
    }
    
    // Component-specific triggers
    if (componentName.includes('Feed') || componentName.includes('Mobile')) {
      triggers.push('Large component with complex state management');
    }
    
    if (componentName.includes('Store') || componentName.includes('Zustand')) {
      triggers.push('State management updates');
    }
    
    return triggers;
  }

  /**
   * Analyze performance bottlenecks
   */
  private analyzeBottlenecks(renderTime: number, memoryUsage: number): string[] {
    const bottlenecks: string[] = [];
    
    if (renderTime > 200) {
      bottlenecks.push('Slow render time (>200ms)');
    }
    
    if (memoryUsage > 10) {
      bottlenecks.push('High memory usage (>10MB)');
    }
    
    if (renderTime > 100 && memoryUsage > 5) {
      bottlenecks.push('Combined performance issues');
    }
    
    return bottlenecks;
  }

  /**
   * Calculate optimization score (0-100)
   */
  private calculateOptimizationScore(renderTime: number, memoryUsage: number, renderCount: number): number {
    let score = 100;
    
    // Deduct points for slow render times
    if (renderTime > 300) score -= 40;
    else if (renderTime > 200) score -= 30;
    else if (renderTime > 100) score -= 20;
    else if (renderTime > 50) score -= 10;
    
    // Deduct points for high memory usage
    if (memoryUsage > 20) score -= 40;
    else if (memoryUsage > 10) score -= 30;
    else if (memoryUsage > 5) score -= 20;
    else if (memoryUsage > 2) score -= 10;
    
    // Deduct points for excessive re-renders
    if (renderCount > 10) score -= 20;
    else if (renderCount > 5) score -= 10;
    
    return Math.max(0, score);
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(renderTime: number, memoryUsage: number, renderCount: number): string[] {
    const recommendations: string[] = [];
    
    if (renderTime > 200) {
      recommendations.push('⚡ Implement React.memo for expensive components');
      recommendations.push('⚡ Use useMemo/useCallback for expensive calculations');
      recommendations.push('⚡ Consider lazy loading for heavy components');
    }
    
    if (memoryUsage > 10) {
      recommendations.push('🧠 Implement proper cleanup in useEffect hooks');
      recommendations.push('🧠 Review memory leaks in event listeners');
      recommendations.push('🧠 Consider component unmounting strategies');
    }
    
    if (renderCount > 5) {
      recommendations.push('🔄 Optimize useEffect dependencies');
      recommendations.push('🔄 Consider state management optimization');
      recommendations.push('🔄 Review component re-render patterns');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ Component is well optimized!');
    }
    
    return recommendations;
  }

  /**
   * Create component profile
   */
  createComponentProfile(name: string, metrics: ProfilerMetrics): ComponentProfile {
    const profile: ComponentProfile = {
      name,
      metrics,
      children: [],
      depth: 0,
      isOptimized: metrics.optimizationScore > 80,
      optimizationPotential: this.calculateOptimizationPotential(metrics.optimizationScore),
    };
    
    this.profiles.set(name, profile);
    return profile;
  }

  /**
   * Calculate optimization potential
   */
  private calculateOptimizationPotential(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (score < 50) return 'HIGH';
    if (score < 80) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate comprehensive performance analysis
   */
  generatePerformanceAnalysis(): PerformanceAnalysis {
    const allMetrics = this.metrics;
    const totalTests = allMetrics.length;
    
    if (totalTests === 0) {
      return {
        overallScore: 0,
        criticalIssues: ['No performance data available'],
        optimizationOpportunities: [],
        memoryLeaks: [],
        renderOptimizations: [],
        networkOptimizations: [],
        accessibilityOptimizations: [],
        recommendations: ['Run performance tests to generate analysis'],
        estimatedImprovement: 0,
      };
    }
    
    const averageScore = allMetrics.reduce((sum, m) => sum + m.optimizationScore, 0) / totalTests;
    const criticalIssues = this.identifyCriticalIssues(allMetrics);
    const optimizationOpportunities = this.identifyOptimizationOpportunities(allMetrics);
    const memoryLeaks = this.identifyMemoryLeaks(allMetrics);
    const renderOptimizations = this.identifyRenderOptimizations(allMetrics);
    const networkOptimizations = this.identifyNetworkOptimizations(allMetrics);
    const accessibilityOptimizations = this.identifyAccessibilityOptimizations(allMetrics);
    
    const recommendations = this.generateComprehensiveRecommendations(
      criticalIssues,
      optimizationOpportunities,
      memoryLeaks,
      renderOptimizations,
      networkOptimizations,
      accessibilityOptimizations
    );
    
    const estimatedImprovement = this.calculateEstimatedImprovement(allMetrics);
    
    return {
      overallScore: averageScore,
      criticalIssues,
      optimizationOpportunities,
      memoryLeaks,
      renderOptimizations,
      networkOptimizations,
      accessibilityOptimizations,
      recommendations,
      estimatedImprovement,
    };
  }

  /**
   * Identify critical performance issues
   */
  private identifyCriticalIssues(metrics: ProfilerMetrics[]): string[] {
    const issues: string[] = [];
    
    const slowComponents = metrics.filter(m => m.averageRenderTime > 200);
    const highMemoryComponents = metrics.filter(m => m.memoryPeak > 10);
    const lowScoreComponents = metrics.filter(m => m.optimizationScore < 50);
    
    if (slowComponents.length > 0) {
      issues.push(`🐌 ${slowComponents.length} components with slow render times (>200ms)`);
    }
    
    if (highMemoryComponents.length > 0) {
      issues.push(`🧠 ${highMemoryComponents.length} components with high memory usage (>10MB)`);
    }
    
    if (lowScoreComponents.length > 0) {
      issues.push(`⚠️ ${lowScoreComponents.length} components with poor optimization scores (<50)`);
    }
    
    return issues;
  }

  /**
   * Identify optimization opportunities
   */
  private identifyOptimizationOpportunities(metrics: ProfilerMetrics[]): string[] {
    const opportunities: string[] = [];
    
    const mediumScoreComponents = metrics.filter(m => m.optimizationScore >= 50 && m.optimizationScore < 80);
    const highRenderCountComponents = metrics.filter(m => m.renderCount > 5);
    
    if (mediumScoreComponents.length > 0) {
      opportunities.push(`📈 ${mediumScoreComponents.length} components with medium optimization potential`);
    }
    
    if (highRenderCountComponents.length > 0) {
      opportunities.push(`🔄 ${highRenderCountComponents.length} components with excessive re-renders`);
    }
    
    return opportunities;
  }

  /**
   * Identify memory leaks
   */
  private identifyMemoryLeaks(metrics: ProfilerMetrics[]): string[] {
    const leaks: string[] = [];
    
    const highMemoryComponents = metrics.filter(m => m.memoryPeak > 10);
    const increasingMemoryComponents = metrics.filter(m => m.memoryPeak > m.memoryAverage * 2);
    
    if (highMemoryComponents.length > 0) {
      leaks.push(`🧠 ${highMemoryComponents.length} components with high memory usage`);
    }
    
    if (increasingMemoryComponents.length > 0) {
      leaks.push(`📈 ${increasingMemoryComponents.length} components with increasing memory usage`);
    }
    
    return leaks;
  }

  /**
   * Identify render optimizations
   */
  private identifyRenderOptimizations(metrics: ProfilerMetrics[]): string[] {
    const optimizations: string[] = [];
    
    const slowRenderComponents = metrics.filter(m => m.averageRenderTime > 100);
    const highRenderCountComponents = metrics.filter(m => m.renderCount > 3);
    
    if (slowRenderComponents.length > 0) {
      optimizations.push(`⚡ ${slowRenderComponents.length} components need render optimization`);
    }
    
    if (highRenderCountComponents.length > 0) {
      optimizations.push(`⚡ ${highRenderCountComponents.length} components need re-render optimization`);
    }
    
    return optimizations;
  }

  /**
   * Identify network optimizations
   */
  private identifyNetworkOptimizations(metrics: ProfilerMetrics[]): string[] {
    const optimizations: string[] = [];
    
    // Analyze network-related performance metrics
    const networkMetrics = metrics.filter(m => m.networkTime && m.networkTime > 0);
    const highNetworkTime = metrics.filter(m => m.networkTime && m.networkTime > 300);
    const apiMetrics = metrics.filter(m => m.apiTime && m.apiTime > 0);
    const highApiTime = metrics.filter(m => m.apiTime && m.apiTime > 200);
    
    // Network performance analysis
    if (networkMetrics.length > 0) {
      const avgNetworkTime = networkMetrics.reduce((sum, m) => sum + (m.networkTime || 0), 0) / networkMetrics.length;
      if (avgNetworkTime > 200) {
        optimizations.push('🌐 High network latency detected - consider CDN implementation');
      }
      if (avgNetworkTime > 500) {
        optimizations.push('🌐 Critical network performance issues - optimize API endpoints');
      }
    }
    
    // API performance analysis
    if (apiMetrics.length > 0) {
      const avgApiTime = apiMetrics.reduce((sum, m) => sum + (m.apiTime || 0), 0) / apiMetrics.length;
      if (avgApiTime > 150) {
        optimizations.push('🔌 API response times are slow - implement caching strategies');
      }
      if (avgApiTime > 300) {
        optimizations.push('🔌 Critical API performance issues - optimize database queries');
      }
    }
    
    // Network optimization recommendations based on patterns
    if (highNetworkTime.length > 0) {
      optimizations.push('🌐 Implement request batching for multiple API calls');
      optimizations.push('🌐 Add request deduplication to prevent duplicate calls');
    }
    
    if (highApiTime.length > 0) {
      optimizations.push('🔌 Implement API response caching with TTL');
      optimizations.push('🔌 Add database query optimization');
    }
    
    // General network optimizations
    if (networkMetrics.length > 2) {
      optimizations.push('🌐 Consider implementing service worker for offline caching');
      optimizations.push('🌐 Add request compression for large payloads');
    }
    
    return optimizations;
  }

  /**
   * Identify accessibility optimizations
   */
  private identifyAccessibilityOptimizations(metrics: ProfilerMetrics[]): string[] {
    const optimizations: string[] = [];
    
    // Analyze accessibility-related performance metrics
    const accessibilityMetrics = metrics.filter(m => m.accessibilityTime && m.accessibilityTime > 0);
    const highAccessibilityTime = metrics.filter(m => m.accessibilityTime && m.accessibilityTime > 50);
    const slowComponents = metrics.filter(m => m.averageRenderTime > 100);
    const memoryIntensiveComponents = metrics.filter(m => m.memoryPeak > 5);
    
    // Accessibility performance analysis
    if (accessibilityMetrics.length > 0) {
      const avgAccessibilityTime = accessibilityMetrics.reduce((sum, m) => sum + (m.accessibilityTime || 0), 0) / accessibilityMetrics.length;
      if (avgAccessibilityTime > 30) {
        optimizations.push('♿ Screen reader performance is slow - optimize ARIA announcements');
      }
      if (avgAccessibilityTime > 75) {
        optimizations.push('♿ Critical accessibility performance issues - review screen reader implementation');
      }
    }
    
    // Screen reader optimization recommendations
    if (highAccessibilityTime.length > 0) {
      optimizations.push('♿ Implement efficient live region management for screen readers');
      optimizations.push('♿ Optimize ARIA attribute rendering performance');
      optimizations.push('♿ Add debouncing for screen reader announcements');
    }
    
    // Keyboard navigation optimization
    if (slowComponents.length > 0) {
      optimizations.push('♿ Optimize keyboard navigation for slow-rendering components');
      optimizations.push('♿ Implement focus management optimization');
      optimizations.push('♿ Add keyboard shortcut performance improvements');
    }
    
    // Memory optimization for accessibility
    if (memoryIntensiveComponents.length > 0) {
      optimizations.push('♿ Optimize accessibility features for memory-intensive components');
      optimizations.push('♿ Implement efficient accessibility state management');
    }
    
    // General accessibility optimizations
    if (metrics.length > 2) {
      optimizations.push('♿ Consider implementing accessibility performance monitoring');
      optimizations.push('♿ Add accessibility feature lazy loading');
      optimizations.push('♿ Optimize accessibility testing performance');
    }
    
    return optimizations;
  }

  /**
   * Generate comprehensive recommendations
   */
  private generateComprehensiveRecommendations(
    criticalIssues: string[],
    optimizationOpportunities: string[],
    memoryLeaks: string[],
    renderOptimizations: string[],
    networkOptimizations: string[],
    accessibilityOptimizations: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (criticalIssues.length > 0) {
      recommendations.push('🚨 PRIORITY: Address critical performance issues');
      recommendations.push(...criticalIssues);
    }
    
    if (memoryLeaks.length > 0) {
      recommendations.push('🧠 PRIORITY: Fix memory leaks');
      recommendations.push(...memoryLeaks);
    }
    
    if (renderOptimizations.length > 0) {
      recommendations.push('⚡ HIGH: Optimize render performance');
      recommendations.push(...renderOptimizations);
    }
    
    if (optimizationOpportunities.length > 0) {
      recommendations.push('📈 MEDIUM: Implement optimization opportunities');
      recommendations.push(...optimizationOpportunities);
    }
    
    if (networkOptimizations.length > 0) {
      recommendations.push('🌐 MEDIUM: Optimize network performance');
      recommendations.push(...networkOptimizations);
    }
    
    if (accessibilityOptimizations.length > 0) {
      recommendations.push('♿ LOW: Optimize accessibility performance');
      recommendations.push(...accessibilityOptimizations);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('🎉 Excellent performance! No optimizations needed.');
    }
    
    return recommendations;
  }

  /**
   * Calculate estimated improvement percentage
   */
  private calculateEstimatedImprovement(metrics: ProfilerMetrics[]): number {
    const averageScore = metrics.reduce((sum, m) => sum + m.optimizationScore, 0) / metrics.length;
    const maxPossibleScore = 100;
    const improvement = maxPossibleScore - averageScore;
    return Math.max(0, improvement);
  }

  /**
   * Get all component profiles
   */
  getComponentProfiles(): ComponentProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Get metrics for a specific component
   */
  getComponentMetrics(componentName: string): ProfilerMetrics | undefined {
    return this.metrics.find(m => m.componentName === componentName);
  }

  /**
   * Get all alerts
   */
  getAlerts(): string[] {
    return this.alerts;
  }

  /**
   * Clear all profiling data
   */
  clear(): void {
    this.profiles.clear();
    this.metrics = [];
    this.alerts = [];
    this.isProfiling = false;
  }

  /**
   * Record test metrics
   */
  recordMetrics(metrics: Omit<ProfilerMetrics, 'timestamp'>): void {
    const fullMetrics: ProfilerMetrics = {
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
  private checkPerformanceAlerts(metrics: ProfilerMetrics): void {
    const alerts: string[] = [];

    // Render time alerts
    if (metrics.renderTime && metrics.renderTime > 200) {
      alerts.push(`⚠️ SLOW RENDER: ${metrics.componentName} took ${metrics.renderTime.toFixed(2)}ms (budget: 200ms)`);
    }

    // Memory usage alerts
    if (metrics.memoryPeak > 10) {
      alerts.push(`⚠️ HIGH MEMORY: ${metrics.componentName} used ${metrics.memoryPeak.toFixed(2)}MB (budget: 10MB)`);
    }

    // Performance grade alerts
    if (metrics.performanceGrade === 'D' || metrics.performanceGrade === 'F') {
      alerts.push(`🚨 POOR PERFORMANCE: ${metrics.componentName} received grade ${metrics.performanceGrade}`);
    }

    // Network time alerts
    if (metrics.networkTime && metrics.networkTime > 500) {
      alerts.push(`⚠️ SLOW NETWORK: ${metrics.componentName} network took ${metrics.networkTime.toFixed(2)}ms (budget: 500ms)`);
    }

    this.alerts.push(...alerts);
  }

  /**
   * Export profiling data
   */
  exportProfilingData(): string {
    return JSON.stringify({
      profiles: Array.from(this.profiles.entries()),
      metrics: this.metrics,
      analysis: this.generatePerformanceAnalysis(),
      insights: this.getPerformanceInsights(),
      patterns: this.analyzePerformancePatterns(),
    }, null, 2);
  }

  /**
   * Get performance insights and recommendations
   */
  getPerformanceInsights(): {
    topPerformers: string[];
    needsAttention: string[];
    optimizationOpportunities: string[];
    criticalIssues: string[];
  } {
    const topPerformers: string[] = [];
    const needsAttention: string[] = [];
    const optimizationOpportunities: string[] = [];
    const criticalIssues: string[] = [];
    
    this.metrics.forEach(metric => {
      // Use optimizationScore if available, otherwise convert performanceGrade to score
      const score = metric.optimizationScore || this.convertGradeToScore(metric.performanceGrade || 'C');
      
      if (score >= 90) {
        topPerformers.push(`${metric.componentName}: ${score}/100 (EXCELLENT)`);
      } else if (score >= 70) {
        optimizationOpportunities.push(`${metric.componentName}: ${score}/100 (GOOD - room for improvement)`);
      } else if (score >= 50) {
        needsAttention.push(`${metric.componentName}: ${score}/100 (NEEDS ATTENTION)`);
      } else {
        criticalIssues.push(`${metric.componentName}: ${score}/100 (CRITICAL)`);
      }
    });
    
    return { topPerformers, needsAttention, optimizationOpportunities, criticalIssues };
  }

  /**
   * Track component lifecycle events
   */
  trackComponentLifecycle(componentName: string, event: 'mount' | 'update' | 'unmount', duration: number): void {
    logger.info(`🔄 Component Lifecycle: ${componentName} ${event} took ${duration}ms`);
    
    // Record lifecycle metrics
    this.recordMetrics({
      componentName,
      renderCount: 1,
      totalRenderTime: duration,
      averageRenderTime: duration,
      maxRenderTime: duration,
      minRenderTime: duration,
      memoryPeak: 0,
      memoryAverage: 0,
      reRenderTriggers: [],
      performanceBottlenecks: [],
      optimizationScore: this.calculateOptimizationScore(duration, 0, 1),
      recommendations: [],
      renderTime: duration,
      performanceGrade: this.calculatePerformanceGrade(duration)
    });
  }

  /**
   * Analyze performance patterns across multiple runs
   */
  analyzePerformancePatterns(): {
    trendingUp: string[];
    trendingDown: string[];
    stable: string[];
    volatile: string[];
  } {
    const trendingUp: string[] = [];
    const trendingDown: string[] = [];
    const stable: string[] = [];
    const volatile: string[] = [];

    // Group metrics by component
    const componentMetrics = new Map<string, ProfilerMetrics[]>();
    this.metrics.forEach(metric => {
      if (!componentMetrics.has(metric.componentName)) {
        componentMetrics.set(metric.componentName, []);
      }
      componentMetrics.get(metric.componentName)!.push(metric);
    });

    // Analyze patterns for each component
    componentMetrics.forEach((metrics, componentName) => {
      if (metrics.length < 3) {
        stable.push(`${componentName}: insufficient data`);
        return;
      }

      const renderTimes = metrics.map(m => m.averageRenderTime);
      const trend = this.calculateTrend(renderTimes);
      const volatility = this.calculateVolatility(renderTimes);

      if (trend > 0.1) {
        trendingUp.push(`${componentName}: +${(trend * 100).toFixed(1)}% trend`);
      } else if (trend < -0.1) {
        trendingDown.push(`${componentName}: ${(trend * 100).toFixed(1)}% trend`);
      } else if (volatility > 0.3) {
        volatile.push(`${componentName}: ${(volatility * 100).toFixed(1)}% volatility`);
      } else {
        stable.push(`${componentName}: stable performance`);
      }
    });

    return { trendingUp, trendingDown, stable, volatile };
  }

  /**
   * Calculate trend from array of values
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    return (secondAvg - firstAvg) / firstAvg;
  }

  /**
   * Calculate volatility (standard deviation / mean)
   */
  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev / mean;
  }

  /**
   * Calculate performance grade based on render time
   */
  calculatePerformanceGrade(renderTime: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
    if (renderTime <= 50) return 'A+';
    if (renderTime <= 100) return 'A';
    if (renderTime <= 150) return 'B';
    if (renderTime <= 200) return 'C';
    if (renderTime <= 300) return 'D';
    return 'F';
  }

  /**
   * Convert performance grade to numeric score
   */
  private convertGradeToScore(grade: string): number {
    switch (grade) {
      case 'A+': return 95;
      case 'A': return 90;
      case 'B': return 80;
      case 'C': return 70;
      case 'D': return 60;
      case 'F': return 30;
      default: return 50;
    }
  }
}

// Global performance profiler instance
export const performanceProfiler = new PerformanceProfiler();



