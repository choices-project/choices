/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SuperiorMobileFeed from '@/features/feeds/components/SuperiorMobileFeed';
import { productionTracker, ProductionMetrics } from './production-tracker';
import { logger } from '@/lib/utils/logger';

// Setup minimal mocks for test environment
beforeAll(() => {
  // Mock localStorage for component functionality
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });
  
  // Mock navigator for online status
  Object.defineProperty(navigator, 'onLine', {
    value: true,
    writable: true,
  });

  // Mock fetch to handle API calls
  global.fetch = jest.fn((url: string) => {
    if (url.includes('/api/feeds')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          {
            id: '1',
            title: 'Sample Civic Activity',
            description: 'A sample civic activity for testing',
            category: 'civic',
            timestamp: new Date().toISOString(),
            source: 'test'
          }
        ])
      } as Response);
    }
    if (url.includes('/api/civics/analytics')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          analytics: {
            totalViews: 100,
            engagement: 0.75,
            userSatisfaction: 0.85
          }
        })
      } as Response);
    }
    if (url.includes('/api/pwa/offline/sync')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({})
    } as Response);
  });
});

describe('Production Optimization Tests', () => {
  beforeEach(() => {
    // Clear production tracker before each test
    productionTracker.clear();
  });

  describe('Real-world Performance Tracking', () => {
    it('should track production performance metrics in real-world conditions', async () => {
      const sessionId = 'prod-session-001';
      const userId = 'user-123';
      
      // Start production tracking
      productionTracker.startTracking(sessionId, userId);
      
      // Simulate real-world performance metrics
      const productionMetrics: Omit<ProductionMetrics, 'sessionId' | 'timestamp'> = {
        userId,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        deviceType: 'mobile',
        connectionType: '4g',
        viewport: { width: 375, height: 812 },
        performance: {
          renderTime: 150,
          memoryUsage: 25,
          networkLatency: 200,
          apiResponseTime: 300,
          userInteractionTime: 50,
          pageLoadTime: 1200,
          timeToInteractive: 800,
          firstContentfulPaint: 600,
          largestContentfulPaint: 900,
          cumulativeLayoutShift: 0.1,
        },
        userExperience: {
          satisfaction: 4,
          frustration: 2,
          taskCompletion: true,
          errorRate: 0.02,
          bounceRate: false,
          sessionDuration: 300,
        },
        businessMetrics: {
          conversionRate: 0.15,
          engagementScore: 0.8,
          retentionRate: 0.7,
          revenueImpact: 25.50,
        },
      };
      
      // Record production metrics
      productionTracker.recordProductionMetrics(productionMetrics);
      
      logger.info(`🏭 Production Performance Tracking:`);
      logger.info(`- Session ID: ${sessionId}`);
      logger.info(`- User ID: ${userId}`);
      logger.info(`- Device: ${productionMetrics.deviceType}`);
      logger.info(`- Connection: ${productionMetrics.connectionType}`);
      logger.info(`- Render Time: ${productionMetrics.performance.renderTime}ms`);
      logger.info(`- Memory Usage: ${productionMetrics.performance.memoryUsage}MB`);
      logger.info(`- User Satisfaction: ${productionMetrics.userExperience.satisfaction}/5`);
      logger.info(`- Task Completion: ${productionMetrics.userExperience.taskCompletion}`);
      logger.info(`- Revenue Impact: $${productionMetrics.businessMetrics.revenueImpact}`);
      
      // Stop tracking
      productionTracker.stopTracking();
      
      // Verify tracking
      const sessionMetrics = productionTracker.getSessionMetrics(sessionId);
      expect(sessionMetrics).toHaveLength(1);
      expect(sessionMetrics[0].sessionId).toBe(sessionId);
      expect(sessionMetrics[0].userId).toBe(userId);
      expect(sessionMetrics[0].deviceType).toBe('mobile');
    });

    it('should detect performance regressions in production', async () => {
      const sessionId = 'regression-test-session';
      
      productionTracker.startTracking(sessionId);
      
      // Record baseline metrics
      const baselineMetrics: Omit<ProductionMetrics, 'sessionId' | 'timestamp'> = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        deviceType: 'desktop',
        connectionType: 'wifi',
        viewport: { width: 1920, height: 1080 },
        performance: {
          renderTime: 100,
          memoryUsage: 20,
          networkLatency: 50,
          apiResponseTime: 200,
          userInteractionTime: 30,
          pageLoadTime: 800,
          timeToInteractive: 600,
          firstContentfulPaint: 400,
          largestContentfulPaint: 700,
          cumulativeLayoutShift: 0.05,
        },
        userExperience: {
          satisfaction: 4.5,
          frustration: 1,
          taskCompletion: true,
          errorRate: 0.01,
          bounceRate: false,
          sessionDuration: 600,
        },
        businessMetrics: {
          conversionRate: 0.2,
          engagementScore: 0.9,
          retentionRate: 0.8,
          revenueImpact: 50.00,
        },
      };
      
      productionTracker.recordProductionMetrics(baselineMetrics);
      
      // Record degraded metrics (simulating regression)
      const degradedMetrics: Omit<ProductionMetrics, 'sessionId' | 'timestamp'> = {
        ...baselineMetrics,
        performance: {
          ...baselineMetrics.performance,
          renderTime: 200, // 100% increase
          memoryUsage: 35, // 75% increase
          apiResponseTime: 400, // 100% increase
        },
        userExperience: {
          ...baselineMetrics.userExperience,
          satisfaction: 3, // Decreased satisfaction
          frustration: 3, // Increased frustration
        },
      };
      
      productionTracker.recordProductionMetrics(degradedMetrics);
      
      // Check for regressions
      const activeRegressions = productionTracker.getActiveRegressions();
      
      logger.info(`🚨 Performance Regressions Detected: ${activeRegressions.length}`);
      activeRegressions.forEach(regression => {
        logger.info(`- Metric: ${regression.metric}`);
        logger.info(`- Change: +${regression.changePercentage.toFixed(2)}%`);
        logger.info(`- Severity: ${regression.severity.toUpperCase()}`);
        logger.info(`- User Experience Impact: ${regression.impact.userExperience.toFixed(2)}%`);
        logger.info(`- Business Impact: ${regression.impact.businessMetrics}%`);
      });
      
      expect(activeRegressions.length).toBeGreaterThan(0);
      expect(activeRegressions.some(r => r.metric === 'renderTime')).toBe(true);
      expect(activeRegressions.some(r => r.severity === 'high' || r.severity === 'critical')).toBe(true);
    });

    it('should resolve performance regressions', async () => {
      const sessionId = 'regression-resolution-session';
      
      productionTracker.startTracking(sessionId);
      
      // Create a regression scenario
      const baselineMetrics: Omit<ProductionMetrics, 'sessionId' | 'timestamp'> = {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        deviceType: 'desktop',
        connectionType: 'ethernet',
        viewport: { width: 2560, height: 1440 },
        performance: {
          renderTime: 80,
          memoryUsage: 15,
          networkLatency: 30,
          apiResponseTime: 150,
          userInteractionTime: 25,
          pageLoadTime: 600,
          timeToInteractive: 400,
          firstContentfulPaint: 300,
          largestContentfulPaint: 500,
          cumulativeLayoutShift: 0.02,
        },
        userExperience: {
          satisfaction: 4.8,
          frustration: 0.5,
          taskCompletion: true,
          errorRate: 0.005,
          bounceRate: false,
          sessionDuration: 900,
        },
        businessMetrics: {
          conversionRate: 0.25,
          engagementScore: 0.95,
          retentionRate: 0.85,
          revenueImpact: 75.00,
        },
      };
      
      productionTracker.recordProductionMetrics(baselineMetrics);
      
      // Create regression
      const regressionMetrics: Omit<ProductionMetrics, 'sessionId' | 'timestamp'> = {
        ...baselineMetrics,
        performance: {
          ...baselineMetrics.performance,
          renderTime: 200, // 150% increase
        },
      };
      
      productionTracker.recordProductionMetrics(regressionMetrics);
      
      const activeRegressions = productionTracker.getActiveRegressions();
      expect(activeRegressions.length).toBeGreaterThan(0);
      
      // Resolve the regression
      const regressionId = activeRegressions[0].id;
      productionTracker.resolveRegression(regressionId);
      
      const resolvedRegressions = productionTracker.getActiveRegressions();
      const resolvedRegression = productionTracker.getActiveRegressions().find(r => r.id === regressionId);
      
      logger.info(`✅ Regression Resolution:`);
      logger.info(`- Active Regressions: ${resolvedRegressions.length}`);
      logger.info(`- Regression Resolved: ${resolvedRegression === undefined}`);
      
      expect(resolvedRegressions.length).toBeLessThan(activeRegressions.length);
    });
  });

  describe('User Experience Metrics', () => {
    it('should generate comprehensive user experience insights', async () => {
      const sessionId = 'ux-insights-session';
      
      productionTracker.startTracking(sessionId);
      
      // Record diverse user experience data
      const userSessions = [
        {
          satisfaction: 5,
          taskCompletion: true,
          errorRate: 0.01,
          sessionDuration: 1200,
        },
        {
          satisfaction: 4,
          taskCompletion: true,
          errorRate: 0.02,
          sessionDuration: 800,
        },
        {
          satisfaction: 3,
          taskCompletion: false,
          errorRate: 0.05,
          sessionDuration: 300,
        },
        {
          satisfaction: 2,
          taskCompletion: false,
          errorRate: 0.1,
          sessionDuration: 150,
        },
      ];
      
      userSessions.forEach((session, index) => {
        const metrics: Omit<ProductionMetrics, 'sessionId' | 'timestamp'> = {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
          deviceType: 'mobile',
          connectionType: '4g',
          viewport: { width: 375, height: 812 },
          performance: {
            renderTime: 120 + (index * 20),
            memoryUsage: 20 + (index * 5),
            networkLatency: 100 + (index * 50),
            apiResponseTime: 200 + (index * 100),
            userInteractionTime: 40 + (index * 10),
            pageLoadTime: 800 + (index * 200),
            timeToInteractive: 500 + (index * 100),
            firstContentfulPaint: 300 + (index * 50),
            largestContentfulPaint: 600 + (index * 100),
            cumulativeLayoutShift: 0.05 + (index * 0.02),
          },
          userExperience: {
            satisfaction: session.satisfaction,
            frustration: 5 - session.satisfaction,
            taskCompletion: session.taskCompletion,
            errorRate: session.errorRate,
            bounceRate: !session.taskCompletion,
            sessionDuration: session.sessionDuration,
          },
          businessMetrics: {
            conversionRate: session.satisfaction * 0.1,
            engagementScore: session.satisfaction * 0.2,
            retentionRate: session.satisfaction * 0.15,
            revenueImpact: session.satisfaction * 10,
          },
        };
        
        productionTracker.recordProductionMetrics(metrics);
      });
      
      // Generate user experience insights
      const insights = productionTracker.generateUserExperienceInsights();
      
      logger.info(`🎯 User Experience Insights:`);
      logger.info(`- Overall Score: ${insights.overallScore.toFixed(2)}/100`);
      logger.info(`- Top Issues: ${insights.topIssues.length}`);
      logger.info(`- Improvement Opportunities: ${insights.improvementOpportunities.length}`);
      logger.info(`- High Performers: ${insights.userSegments.highPerformers.length}`);
      logger.info(`- Struggling Users: ${insights.userSegments.strugglingUsers.length}`);
      logger.info(`- At Risk Users: ${insights.userSegments.atRiskUsers.length}`);
      logger.info(`- Recommendations: ${insights.recommendations.length}`);
      logger.info(`- Predicted Impact: ${insights.predictedImpact.toFixed(2)}%`);
      
      if (insights.topIssues.length > 0) {
        logger.info(`\n🚨 Top Issues:`);
        insights.topIssues.forEach(issue => logger.info(`  - ${issue}`));
      }
      
      if (insights.improvementOpportunities.length > 0) {
        logger.info(`\n💡 Improvement Opportunities:`);
        insights.improvementOpportunities.forEach(opportunity => logger.info(`  - ${opportunity}`));
      }
      
      if (insights.recommendations.length > 0) {
        logger.info(`\n📋 Recommendations:`);
        insights.recommendations.forEach(rec => logger.info(`  - ${rec}`));
      }
      
      // Verify insights
      expect(insights.overallScore).toBeGreaterThanOrEqual(0);
      expect(insights.overallScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(insights.topIssues)).toBe(true);
      expect(Array.isArray(insights.improvementOpportunities)).toBe(true);
      expect(Array.isArray(insights.userSegments.highPerformers)).toBe(true);
      expect(Array.isArray(insights.userSegments.strugglingUsers)).toBe(true);
      expect(Array.isArray(insights.userSegments.atRiskUsers)).toBe(true);
      expect(Array.isArray(insights.recommendations)).toBe(true);
    });
  });

  describe('Production Analytics', () => {
    it('should generate comprehensive production analytics', async () => {
      const sessionId = 'analytics-session';
      
      productionTracker.startTracking(sessionId);
      
      // Record analytics data across different time periods
      const analyticsData = [
        { period: 'Week 1', satisfaction: 4.2, renderTime: 120, memoryUsage: 25 },
        { period: 'Week 2', satisfaction: 4.0, renderTime: 130, memoryUsage: 28 },
        { period: 'Week 3', satisfaction: 3.8, renderTime: 140, memoryUsage: 30 },
        { period: 'Week 4', satisfaction: 4.1, renderTime: 125, memoryUsage: 26 },
      ];
      
      analyticsData.forEach((data, index) => {
        const metrics: Omit<ProductionMetrics, 'sessionId' | 'timestamp'> = {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          deviceType: 'desktop',
          connectionType: 'wifi',
          viewport: { width: 1920, height: 1080 },
          performance: {
            renderTime: data.renderTime,
            memoryUsage: data.memoryUsage,
            networkLatency: 50,
            apiResponseTime: 200,
            userInteractionTime: 30,
            pageLoadTime: 800,
            timeToInteractive: 500,
            firstContentfulPaint: 300,
            largestContentfulPaint: 600,
            cumulativeLayoutShift: 0.05,
          },
          userExperience: {
            satisfaction: data.satisfaction,
            frustration: 5 - data.satisfaction,
            taskCompletion: true,
            errorRate: 0.02,
            bounceRate: false,
            sessionDuration: 600,
          },
          businessMetrics: {
            conversionRate: data.satisfaction * 0.1,
            engagementScore: data.satisfaction * 0.2,
            retentionRate: data.satisfaction * 0.15,
            revenueImpact: data.satisfaction * 15,
          },
        };
        
        productionTracker.recordProductionMetrics(metrics);
      });
      
      // Generate production analytics
      const analytics = productionTracker.generateProductionAnalytics();
      
      logger.info(`📊 Production Analytics:`);
      logger.info(`- Performance Trends: ${analytics.performanceTrends.length}`);
      logger.info(`- User Experience Metrics:`);
      logger.info(`  - Task Completion Rate: ${(analytics.userExperienceMetrics.taskCompletionRate * 100).toFixed(2)}%`);
      logger.info(`  - Error Rate: ${(analytics.userExperienceMetrics.errorRate * 100).toFixed(2)}%`);
      logger.info(`  - Bounce Rate: ${(analytics.userExperienceMetrics.bounceRate * 100).toFixed(2)}%`);
      logger.info(`- Business Impact:`);
      logger.info(`  - Conversion Impact: ${analytics.businessImpact.conversionImpact.toFixed(2)}%`);
      logger.info(`  - Revenue Impact: $${analytics.businessImpact.revenueImpact.toFixed(2)}`);
      logger.info(`  - User Retention Impact: ${analytics.businessImpact.userRetentionImpact.toFixed(2)}%`);
      logger.info(`- Technical Health:`);
      logger.info(`  - Performance Score: ${analytics.technicalHealth.performanceScore.toFixed(2)}/100`);
      logger.info(`  - Stability Score: ${analytics.technicalHealth.stabilityScore.toFixed(2)}/100`);
      logger.info(`  - Scalability Score: ${analytics.technicalHealth.scalabilityScore.toFixed(2)}/100`);
      logger.info(`  - Maintainability Score: ${analytics.technicalHealth.maintainabilityScore.toFixed(2)}/100`);
      
      // Verify analytics
      expect(analytics.performanceTrends).toBeDefined();
      expect(analytics.userExperienceMetrics).toBeDefined();
      expect(analytics.businessImpact).toBeDefined();
      expect(analytics.technicalHealth).toBeDefined();
      expect(analytics.performanceTrends.length).toBeGreaterThan(0);
      expect(analytics.userExperienceMetrics.taskCompletionRate).toBeGreaterThanOrEqual(0);
      expect(analytics.userExperienceMetrics.taskCompletionRate).toBeLessThanOrEqual(1);
    });

    it('should export comprehensive production data', async () => {
      const sessionId = 'export-session';
      
      productionTracker.startTracking(sessionId);
      
      // Record sample production data
      const sampleMetrics: Omit<ProductionMetrics, 'sessionId' | 'timestamp'> = {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        deviceType: 'desktop',
        connectionType: 'ethernet',
        viewport: { width: 2560, height: 1440 },
        performance: {
          renderTime: 100,
          memoryUsage: 20,
          networkLatency: 30,
          apiResponseTime: 150,
          userInteractionTime: 25,
          pageLoadTime: 600,
          timeToInteractive: 400,
          firstContentfulPaint: 300,
          largestContentfulPaint: 500,
          cumulativeLayoutShift: 0.02,
        },
        userExperience: {
          satisfaction: 4.5,
          frustration: 1,
          taskCompletion: true,
          errorRate: 0.01,
          bounceRate: false,
          sessionDuration: 900,
        },
        businessMetrics: {
          conversionRate: 0.2,
          engagementScore: 0.9,
          retentionRate: 0.8,
          revenueImpact: 50.00,
        },
      };
      
      productionTracker.recordProductionMetrics(sampleMetrics);
      
      // Export production data
      const exportedData = productionTracker.exportProductionData();
      const parsedData = JSON.parse(exportedData);
      
      logger.info(`📤 Production Data Export:`);
      logger.info(`- Metrics: ${parsedData.metrics.length}`);
      logger.info(`- Regressions: ${parsedData.regressions.length}`);
      logger.info(`- Baseline Metrics: ${Object.keys(parsedData.baselineMetrics).length}`);
      logger.info(`- Insights Generated: ${!!parsedData.insights}`);
      logger.info(`- Analytics Generated: ${!!parsedData.analytics}`);
      
      // Verify export
      expect(parsedData.metrics).toBeDefined();
      expect(parsedData.regressions).toBeDefined();
      expect(parsedData.baselineMetrics).toBeDefined();
      expect(parsedData.insights).toBeDefined();
      expect(parsedData.analytics).toBeDefined();
      expect(parsedData.metrics.length).toBe(1);
    });
  });
});
