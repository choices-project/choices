/**
 * Production Performance Tracker
 * 
 * Provides real-world performance tracking, user experience metrics,
 * regression detection, and advanced analytics for production environments.
 */

import { logger } from '@/lib/utils/logger';

export interface ProductionMetrics {
  sessionId: string;
  userId?: string;
  timestamp: Date;
  userAgent: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'ethernet';
  viewport: { width: number; height: number };
  performance: {
    renderTime: number;
    memoryUsage: number;
    networkLatency: number;
    apiResponseTime: number;
    userInteractionTime: number;
    pageLoadTime: number;
    timeToInteractive: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
  };
  userExperience: {
    satisfaction: number; // 1-5 scale
    frustration: number; // 1-5 scale
    taskCompletion: boolean;
    errorRate: number;
    bounceRate: boolean;
    sessionDuration: number;
  };
  businessMetrics: {
    conversionRate: number;
    engagementScore: number;
    retentionRate: number;
    revenueImpact: number;
  };
}

export interface PerformanceRegression {
  id: string;
  componentName: string;
  metric: string;
  baselineValue: number;
  currentValue: number;
  changePercentage: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  resolvedAt?: Date;
  impact: {
    userExperience: number;
    businessMetrics: number;
    technicalDebt: number;
  };
}

export interface UserExperienceInsights {
  overallScore: number;
  topIssues: string[];
  improvementOpportunities: string[];
  userSegments: {
    highPerformers: string[];
    strugglingUsers: string[];
    atRiskUsers: string[];
  };
  recommendations: string[];
  predictedImpact: number;
}

export interface ProductionAnalytics {
  performanceTrends: Array<{
    period: string;
    averageRenderTime: number;
    averageMemoryUsage: number;
    averageUserSatisfaction: number;
    trend: 'improving' | 'stable' | 'declining';
  }>;
  userExperienceMetrics: {
    satisfactionDistribution: Array<{ score: number; percentage: number }>;
    taskCompletionRate: number;
    errorRate: number;
    bounceRate: number;
  };
  businessImpact: {
    conversionImpact: number;
    revenueImpact: number;
    userRetentionImpact: number;
  };
  technicalHealth: {
    performanceScore: number;
    stabilityScore: number;
    scalabilityScore: number;
    maintainabilityScore: number;
  };
}

export class ProductionTracker {
  private metrics: ProductionMetrics[] = [];
  private regressions: PerformanceRegression[] = [];
  private baselineMetrics: Map<string, number> = new Map();
  private isTracking = false;
  private sessionId = '';

  /**
   * Start production tracking session
   */
  startTracking(sessionId: string, userId?: string): void {
    this.sessionId = sessionId;
    this.isTracking = true;
    
    logger.info(`🏭 Starting production tracking for session: ${sessionId}`);
    if (userId) {
      logger.info(`👤 User ID: ${userId}`);
    }
  }

  /**
   * Stop production tracking
   */
  stopTracking(): void {
    this.isTracking = false;
    logger.info(`🏭 Production tracking stopped for session: ${this.sessionId}`);
  }

  /**
   * Record production performance metrics
   */
  recordProductionMetrics(metrics: Omit<ProductionMetrics, 'sessionId' | 'timestamp'>): void {
    if (!this.isTracking) {
      console.warn('⚠️ Production tracking not started. Call startTracking() first.');
      return;
    }

    const fullMetrics: ProductionMetrics = {
      ...metrics,
      sessionId: this.sessionId,
      timestamp: new Date(),
    };

    this.metrics.push(fullMetrics);
    
    // Check for performance regressions
    this.checkForRegressions(fullMetrics);
    
    // Update baseline metrics
    this.updateBaselineMetrics(fullMetrics);
    
    logger.info(`📊 Production metrics recorded:`);
    logger.info(`- Render Time: ${fullMetrics.performance.renderTime.toFixed(2)}ms`);
    logger.info(`- Memory Usage: ${fullMetrics.performance.memoryUsage.toFixed(2)}MB`);
    logger.info(`- User Satisfaction: ${fullMetrics.userExperience.satisfaction}/5`);
    logger.info(`- Task Completion: ${fullMetrics.userExperience.taskCompletion ? 'Yes' : 'No'}`);
  }

  /**
   * Check for performance regressions
   */
  private checkForRegressions(metrics: ProductionMetrics): void {
    const performanceKeys = Object.keys(metrics.performance) as Array<keyof typeof metrics.performance>;
    
    performanceKeys.forEach(key => {
      const currentValue = metrics.performance[key];
      const baselineKey = `${metrics.deviceType}_${key}`;
      const baselineValue = this.baselineMetrics.get(baselineKey);
      
      if (baselineValue !== undefined) {
        const changePercentage = ((currentValue - baselineValue) / baselineValue) * 100;
        
        // Define regression thresholds
        const thresholds = {
          renderTime: 20, // 20% increase
          memoryUsage: 30, // 30% increase
          networkLatency: 25, // 25% increase
          apiResponseTime: 30, // 30% increase
          userInteractionTime: 15, // 15% increase
          pageLoadTime: 25, // 25% increase
          timeToInteractive: 20, // 20% increase
          firstContentfulPaint: 15, // 15% increase
          largestContentfulPaint: 20, // 20% increase
          cumulativeLayoutShift: 50, // 50% increase
        };
        
        const threshold = thresholds[key] || 20;
        
        if (changePercentage > threshold) {
          const severity = this.calculateRegressionSeverity(changePercentage, key);
          
          const regression: PerformanceRegression = {
            id: `regression_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            componentName: 'Production Performance',
            metric: key,
            baselineValue,
            currentValue,
            changePercentage,
            severity,
            detectedAt: new Date(),
            impact: {
              userExperience: this.calculateUserExperienceImpact(changePercentage, key),
              businessMetrics: this.calculateBusinessImpact(changePercentage, key),
              technicalDebt: this.calculateTechnicalDebtImpact(changePercentage, key),
            },
          };
          
          this.regressions.push(regression);
          
          logger.info(`🚨 Performance regression detected:`);
          logger.info(`- Metric: ${key}`);
          logger.info(`- Change: +${changePercentage.toFixed(2)}%`);
          logger.info(`- Severity: ${severity.toUpperCase()}`);
        }
      }
    });
  }

  /**
   * Calculate regression severity
   */
  private calculateRegressionSeverity(changePercentage: number, metric: string): 'low' | 'medium' | 'high' | 'critical' {
    if (changePercentage > 100) return 'critical';
    if (changePercentage > 50) return 'high';
    if (changePercentage > 25) return 'medium';
    return 'low';
  }

  /**
   * Calculate user experience impact
   */
  private calculateUserExperienceImpact(changePercentage: number, metric: string): number {
    const impactFactors = {
      renderTime: 0.8,
      memoryUsage: 0.6,
      networkLatency: 0.7,
      apiResponseTime: 0.9,
      userInteractionTime: 0.95,
      pageLoadTime: 0.85,
      timeToInteractive: 0.9,
      firstContentfulPaint: 0.8,
      largestContentfulPaint: 0.7,
      cumulativeLayoutShift: 0.6,
    };
    
    const factor = impactFactors[metric as keyof typeof impactFactors] || 0.5;
    return Math.min(100, changePercentage * factor);
  }

  /**
   * Calculate business impact
   */
  private calculateBusinessImpact(changePercentage: number, metric: string): number {
    const businessFactors = {
      renderTime: 0.3,
      memoryUsage: 0.2,
      networkLatency: 0.4,
      apiResponseTime: 0.6,
      userInteractionTime: 0.7,
      pageLoadTime: 0.5,
      timeToInteractive: 0.6,
      firstContentfulPaint: 0.4,
      largestContentfulPaint: 0.3,
      cumulativeLayoutShift: 0.2,
    };
    
    const factor = businessFactors[metric as keyof typeof businessFactors] || 0.3;
    return Math.min(100, changePercentage * factor);
  }

  /**
   * Calculate technical debt impact
   */
  private calculateTechnicalDebtImpact(changePercentage: number, metric: string): number {
    const debtFactors = {
      renderTime: 0.4,
      memoryUsage: 0.8,
      networkLatency: 0.3,
      apiResponseTime: 0.5,
      userInteractionTime: 0.3,
      pageLoadTime: 0.4,
      timeToInteractive: 0.3,
      firstContentfulPaint: 0.2,
      largestContentfulPaint: 0.2,
      cumulativeLayoutShift: 0.1,
    };
    
    const factor = debtFactors[metric as keyof typeof debtFactors] || 0.4;
    return Math.min(100, changePercentage * factor);
  }

  /**
   * Update baseline metrics
   */
  private updateBaselineMetrics(metrics: ProductionMetrics): void {
    const performanceKeys = Object.keys(metrics.performance) as Array<keyof typeof metrics.performance>;
    
    performanceKeys.forEach(key => {
      const baselineKey = `${metrics.deviceType}_${key}`;
      const currentValue = metrics.performance[key];
      const existingBaseline = this.baselineMetrics.get(baselineKey);
      
      if (existingBaseline === undefined) {
        // Set initial baseline
        this.baselineMetrics.set(baselineKey, currentValue);
      } else {
        // Update baseline with exponential moving average
        const alpha = 0.1; // Learning rate
        const newBaseline = (alpha * currentValue) + ((1 - alpha) * existingBaseline);
        this.baselineMetrics.set(baselineKey, newBaseline);
      }
    });
  }

  /**
   * Generate user experience insights
   */
  generateUserExperienceInsights(): UserExperienceInsights {
    if (this.metrics.length === 0) {
      return {
        overallScore: 0,
        topIssues: ['No data available'],
        improvementOpportunities: [],
        userSegments: {
          highPerformers: [],
          strugglingUsers: [],
          atRiskUsers: [],
        },
        recommendations: ['Start collecting user experience data'],
        predictedImpact: 0,
      };
    }

    const satisfactionScores = this.metrics.map(m => m.userExperience.satisfaction);
    const averageSatisfaction = satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length;
    
    const taskCompletionRate = this.metrics.filter(m => m.userExperience.taskCompletion).length / this.metrics.length;
    const errorRate = this.metrics.reduce((sum, m) => sum + m.userExperience.errorRate, 0) / this.metrics.length;
    
    // Calculate overall score (capped at 100)
    const overallScore = Math.min(100, (averageSatisfaction * 20) + (taskCompletionRate * 30) + ((1 - errorRate) * 50));
    
    // Identify top issues
    const topIssues: string[] = [];
    if (averageSatisfaction < 3) topIssues.push('Low user satisfaction');
    if (taskCompletionRate < 0.7) topIssues.push('Poor task completion rate');
    if (errorRate > 0.1) topIssues.push('High error rate');
    
    // Identify improvement opportunities
    const improvementOpportunities: string[] = [];
    if (averageSatisfaction < 4) improvementOpportunities.push('Improve user satisfaction');
    if (taskCompletionRate < 0.8) improvementOpportunities.push('Enhance task completion');
    if (errorRate > 0.05) improvementOpportunities.push('Reduce error rate');
    
    // Segment users
    const highPerformers = this.metrics.filter(m => 
      m.userExperience.satisfaction >= 4 && 
      m.userExperience.taskCompletion && 
      m.userExperience.errorRate < 0.05
    ).map(m => m.sessionId);
    
    const strugglingUsers = this.metrics.filter(m => 
      m.userExperience.satisfaction < 3 || 
      !m.userExperience.taskCompletion || 
      m.userExperience.errorRate > 0.1
    ).map(m => m.sessionId);
    
    const atRiskUsers = this.metrics.filter(m => 
      m.userExperience.satisfaction < 4 && 
      m.userExperience.satisfaction >= 3
    ).map(m => m.sessionId);
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (averageSatisfaction < 4) {
      recommendations.push('Focus on user experience improvements');
    }
    if (taskCompletionRate < 0.8) {
      recommendations.push('Simplify user workflows');
    }
    if (errorRate > 0.05) {
      recommendations.push('Improve error handling and user guidance');
    }
    
    const predictedImpact = Math.max(0, 100 - overallScore);
    
    return {
      overallScore,
      topIssues,
      improvementOpportunities,
      userSegments: {
        highPerformers,
        strugglingUsers,
        atRiskUsers,
      },
      recommendations,
      predictedImpact,
    };
  }

  /**
   * Generate production analytics
   */
  generateProductionAnalytics(): ProductionAnalytics {
    if (this.metrics.length === 0) {
      return {
        performanceTrends: [],
        userExperienceMetrics: {
          satisfactionDistribution: [],
          taskCompletionRate: 0,
          errorRate: 0,
          bounceRate: 0,
        },
        businessImpact: {
          conversionImpact: 0,
          revenueImpact: 0,
          userRetentionImpact: 0,
        },
        technicalHealth: {
          performanceScore: 0,
          stabilityScore: 0,
          scalabilityScore: 0,
          maintainabilityScore: 0,
        },
      };
    }

    // Calculate performance trends
    const performanceTrends = this.calculatePerformanceTrends();
    
    // Calculate user experience metrics
    const userExperienceMetrics = this.calculateUserExperienceMetrics();
    
    // Calculate business impact
    const businessImpact = this.calculateBusinessImpactMetrics();
    
    // Calculate technical health
    const technicalHealth = this.calculateTechnicalHealth();
    
    return {
      performanceTrends,
      userExperienceMetrics,
      businessImpact,
      technicalHealth,
    };
  }

  /**
   * Calculate performance trends
   */
  private calculatePerformanceTrends(): ProductionAnalytics['performanceTrends'] {
    // Group metrics by time periods (simplified for demo)
    const periods = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    
    return periods.map(period => {
      const periodMetrics = this.metrics.slice(0, Math.floor(this.metrics.length / 4));
      const averageRenderTime = periodMetrics.reduce((sum, m) => sum + m.performance.renderTime, 0) / periodMetrics.length;
      const averageMemoryUsage = periodMetrics.reduce((sum, m) => sum + m.performance.memoryUsage, 0) / periodMetrics.length;
      const averageUserSatisfaction = periodMetrics.reduce((sum, m) => sum + m.userExperience.satisfaction, 0) / periodMetrics.length;
      
      return {
        period,
        averageRenderTime,
        averageMemoryUsage,
        averageUserSatisfaction,
        trend: 'stable' as const,
      };
    });
  }

  /**
   * Calculate user experience metrics
   */
  private calculateUserExperienceMetrics(): ProductionAnalytics['userExperienceMetrics'] {
    const satisfactionScores = this.metrics.map(m => m.userExperience.satisfaction);
    const satisfactionDistribution = [1, 2, 3, 4, 5].map(score => ({
      score,
      percentage: (satisfactionScores.filter(s => s === score).length / satisfactionScores.length) * 100,
    }));
    
    const taskCompletionRate = this.metrics.filter(m => m.userExperience.taskCompletion).length / this.metrics.length;
    const errorRate = this.metrics.reduce((sum, m) => sum + m.userExperience.errorRate, 0) / this.metrics.length;
    const bounceRate = this.metrics.filter(m => m.userExperience.bounceRate).length / this.metrics.length;
    
    return {
      satisfactionDistribution,
      taskCompletionRate,
      errorRate,
      bounceRate,
    };
  }

  /**
   * Calculate business impact
   */
  private calculateBusinessImpactMetrics(): ProductionAnalytics['businessImpact'] {
    const averageSatisfaction = this.metrics.reduce((sum, m) => sum + m.userExperience.satisfaction, 0) / this.metrics.length;
    const taskCompletionRate = this.metrics.filter(m => m.userExperience.taskCompletion).length / this.metrics.length;
    const averageRevenueImpact = this.metrics.reduce((sum, m) => sum + m.businessMetrics.revenueImpact, 0) / this.metrics.length;
    
    return {
      conversionImpact: (averageSatisfaction - 3) * 10, // Simplified calculation
      revenueImpact: averageRevenueImpact,
      userRetentionImpact: taskCompletionRate * 20,
    };
  }

  /**
   * Calculate technical health
   */
  private calculateTechnicalHealth(): ProductionAnalytics['technicalHealth'] {
    const averageRenderTime = this.metrics.reduce((sum, m) => sum + m.performance.renderTime, 0) / this.metrics.length;
    const averageMemoryUsage = this.metrics.reduce((sum, m) => sum + m.performance.memoryUsage, 0) / this.metrics.length;
    const errorRate = this.metrics.reduce((sum, m) => sum + m.userExperience.errorRate, 0) / this.metrics.length;
    
    const performanceScore = Math.max(0, 100 - (averageRenderTime / 10));
    const stabilityScore = Math.max(0, 100 - (errorRate * 1000));
    const scalabilityScore = Math.max(0, 100 - (averageMemoryUsage * 5));
    const maintainabilityScore = 85; // Simplified calculation
    
    return {
      performanceScore,
      stabilityScore,
      scalabilityScore,
      maintainabilityScore,
    };
  }

  /**
   * Get active regressions
   */
  getActiveRegressions(): PerformanceRegression[] {
    return this.regressions.filter(r => !r.resolvedAt);
  }

  /**
   * Resolve regression
   */
  resolveRegression(regressionId: string): void {
    const regression = this.regressions.find(r => r.id === regressionId);
    if (regression) {
      regression.resolvedAt = new Date();
      logger.info(`✅ Regression resolved: ${regressionId}`);
    }
  }

  /**
   * Get production metrics for a specific session
   */
  getSessionMetrics(sessionId: string): ProductionMetrics[] {
    return this.metrics.filter(m => m.sessionId === sessionId);
  }

  /**
   * Clear all production data
   */
  clear(): void {
    this.metrics = [];
    this.regressions = [];
    this.baselineMetrics.clear();
    this.isTracking = false;
    this.sessionId = '';
  }

  /**
   * Export production data
   */
  exportProductionData(): string {
    return JSON.stringify({
      metrics: this.metrics,
      regressions: this.regressions,
      baselineMetrics: Object.fromEntries(this.baselineMetrics),
      insights: this.generateUserExperienceInsights(),
      analytics: this.generateProductionAnalytics(),
    }, null, 2);
  }
}

// Global production tracker instance
export const productionTracker = new ProductionTracker();


