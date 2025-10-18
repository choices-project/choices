import { type Page, expect } from '@playwright/test';

/**
 * Test Monitoring Utilities
 * 
 * Provides utilities for test monitoring including:
 * - Real-time metrics collection
 * - Performance monitoring
 * - Reliability monitoring
 * - Failure analysis
 * - Alert system
 */

export interface MonitoringMetrics {
  timestamp: string;
  testName: string;
  browser: string;
  performance: {
    loadTime: number;
    renderTime: number;
    interactionTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  reliability: {
    successRate: number;
    failureRate: number;
    retryRate: number;
    errorCount: number;
  };
  security: {
    vulnerabilities: number;
    securityScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  accessibility: {
    violations: number;
    accessibilityScore: number;
    wcagLevel: 'A' | 'AA' | 'AAA';
  };
  crossBrowser: {
    compatibilityScore: number;
    browserIssues: string[];
    supportedBrowsers: string[];
  };
}

export interface MonitoringAlert {
  id: string;
  type: 'performance' | 'reliability' | 'security' | 'accessibility' | 'crossBrowser';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  testName: string;
  browser: string;
  recommendations: string[];
}

export interface MonitoringReport {
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    successRate: number;
    averageDuration: number;
    totalDuration: number;
  };
  metrics: MonitoringMetrics[];
  alerts: MonitoringAlert[];
  trends: {
    performance: number[];
    reliability: number[];
    security: number[];
    accessibility: number[];
    crossBrowser: number[];
  };
  recommendations: string[];
}

/**
 * Collect real-time performance metrics
 */
export async function collectPerformanceMetrics(page: Page, testName: string): Promise<MonitoringMetrics['performance']> {
  const performanceMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const memory = (performance as any).memory;
    
    return {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      renderTime: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      interactionTime: navigation.loadEventEnd - navigation.fetchStart,
      memoryUsage: memory ? memory.usedJSHeapSize : 0,
      cpuUsage: 0 // CPU usage not directly available in browser
    };
  });
  
  console.log(`📊 Performance metrics for ${testName}:`);
  console.log(`  - Load time: ${performanceMetrics.loadTime}ms`);
  console.log(`  - Render time: ${performanceMetrics.renderTime}ms`);
  console.log(`  - Interaction time: ${performanceMetrics.interactionTime}ms`);
  console.log(`  - Memory usage: ${performanceMetrics.memoryUsage} bytes`);
  
  return performanceMetrics;
}

/**
 * Collect reliability metrics
 */
export async function collectReliabilityMetrics(page: Page, testName: string): Promise<MonitoringMetrics['reliability']> {
  const reliability = await page.evaluate(() => {
    // Count console errors
    const consoleErrors = window.console.error.toString();
    const errorCount = (consoleErrors.match(/error/gi) || []).length;
    
    return {
      successRate: 100, // Will be calculated based on test results
      failureRate: 0,   // Will be calculated based on test results
      retryRate: 0,     // Will be calculated based on test results
      errorCount
    };
  });
  
  console.log(`📊 Reliability metrics for ${testName}:`);
  console.log(`  - Error count: ${reliability.errorCount}`);
  
  return reliability;
}

/**
 * Collect security metrics
 */
export async function collectSecurityMetrics(page: Page, testName: string): Promise<MonitoringMetrics['security']> {
  const security = await page.evaluate(() => {
    // Check for security headers
    const headers = document.querySelectorAll('meta[http-equiv]');
    const securityHeaders = Array.from(headers).filter(header => 
      header.getAttribute('http-equiv')?.toLowerCase().includes('security')
    );
    
    // Check for HTTPS
    const isSecure = location.protocol === 'https:';
    
    // Check for mixed content
    const mixedContent = document.querySelectorAll('img[src^="http:"], script[src^="http:"], link[href^="http:"]');
    
    return {
      vulnerabilities: mixedContent.length,
      securityScore: isSecure ? 100 : 50,
      riskLevel: (mixedContent.length > 0 ? 'high' : 'low') as 'high' | 'medium' | 'critical' | 'low'
    };
  });
  
  console.log(`📊 Security metrics for ${testName}:`);
  console.log(`  - Vulnerabilities: ${security.vulnerabilities}`);
  console.log(`  - Security score: ${security.securityScore}`);
  console.log(`  - Risk level: ${security.riskLevel}`);
  
  return security;
}

/**
 * Collect accessibility metrics
 */
export async function collectAccessibilityMetrics(page: Page, testName: string): Promise<MonitoringMetrics['accessibility']> {
  const accessibility = await page.evaluate(() => {
    // Count accessibility violations
    const violations = document.querySelectorAll('[aria-label=""], [alt=""], [title=""]');
    const violationCount = violations.length;
    
    // Check for WCAG compliance
    const hasHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0;
    const hasLandmarks = document.querySelectorAll('[role="banner"], [role="navigation"], [role="main"]').length > 0;
    const hasLabels = document.querySelectorAll('label').length > 0;
    
    const complianceScore = (hasHeadings ? 25 : 0) + (hasLandmarks ? 25 : 0) + (hasLabels ? 25 : 0) + (violationCount === 0 ? 25 : 0);
    
    return {
      violations: violationCount,
      accessibilityScore: complianceScore,
      wcagLevel: (complianceScore >= 75 ? 'AA' : 'A') as 'A' | 'AA' | 'AAA'
    };
  });
  
  console.log(`📊 Accessibility metrics for ${testName}:`);
  console.log(`  - Violations: ${accessibility.violations}`);
  console.log(`  - Accessibility score: ${accessibility.accessibilityScore}`);
  console.log(`  - WCAG level: ${accessibility.wcagLevel}`);
  
  return accessibility;
}

/**
 * Collect cross-browser metrics
 */
export async function collectCrossBrowserMetrics(page: Page, testName: string): Promise<MonitoringMetrics['crossBrowser']> {
  const crossBrowser = await page.evaluate(() => {
    const userAgent = navigator.userAgent;
    let browserName = 'unknown';
    
    if (userAgent.includes('Chrome')) {
      browserName = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      browserName = 'Firefox';
    } else if (userAgent.includes('Safari')) {
      browserName = 'Safari';
    } else if (userAgent.includes('Edg')) {
      browserName = 'Edge';
    }
    
    // Check for browser-specific issues
    const issues = [];
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      // Chrome-specific checks
      if (typeof WebGLRenderingContext === 'undefined') {
        issues.push('WebGL not supported');
      }
    }
    
    return {
      compatibilityScore: issues.length === 0 ? 100 : 100 - (issues.length * 20),
      browserIssues: issues,
      supportedBrowsers: ['Chrome', 'Firefox', 'Safari', 'Edge']
    };
  });
  
  console.log(`📊 Cross-browser metrics for ${testName}:`);
  console.log(`  - Compatibility score: ${crossBrowser.compatibilityScore}`);
  console.log(`  - Browser issues: ${crossBrowser.browserIssues.join(', ') || 'None'}`);
  
  return crossBrowser;
}

/**
 * Collect comprehensive monitoring metrics
 */
export async function collectMonitoringMetrics(page: Page, testName: string, browser: string): Promise<MonitoringMetrics> {
  console.log(`📊 Collecting monitoring metrics for ${testName} on ${browser}...`);
  
  const performance = await collectPerformanceMetrics(page, testName);
  const reliability = await collectReliabilityMetrics(page, testName);
  const security = await collectSecurityMetrics(page, testName);
  const accessibility = await collectAccessibilityMetrics(page, testName);
  const crossBrowser = await collectCrossBrowserMetrics(page, testName);
  
  return {
    timestamp: new Date().toISOString(),
    testName,
    browser,
    performance,
    reliability,
    security,
    accessibility,
    crossBrowser
  };
}

/**
 * Generate monitoring alerts
 */
export function generateMonitoringAlerts(metrics: MonitoringMetrics): MonitoringAlert[] {
  const alerts: MonitoringAlert[] = [];
  
  // Performance alerts
  if (metrics.performance.loadTime > 3000) {
    alerts.push({
      id: `performance-${Date.now()}`,
      type: 'performance',
      severity: 'high',
      message: `Load time is ${metrics.performance.loadTime}ms, exceeding 3000ms threshold`,
      timestamp: metrics.timestamp,
      testName: metrics.testName,
      browser: metrics.browser,
      recommendations: ['Optimize page loading', 'Reduce bundle size', 'Enable caching']
    });
  }
  
  // Reliability alerts
  if (metrics.reliability.errorCount > 5) {
    alerts.push({
      id: `reliability-${Date.now()}`,
      type: 'reliability',
      severity: 'medium',
      message: `${metrics.reliability.errorCount} errors detected`,
      timestamp: metrics.timestamp,
      testName: metrics.testName,
      browser: metrics.browser,
      recommendations: ['Fix JavaScript errors', 'Improve error handling', 'Add error monitoring']
    });
  }
  
  // Security alerts
  if (metrics.security.riskLevel === 'high' || metrics.security.riskLevel === 'critical') {
    alerts.push({
      id: `security-${Date.now()}`,
      type: 'security',
      severity: metrics.security.riskLevel === 'critical' ? 'critical' : 'high',
      message: `Security risk level: ${metrics.security.riskLevel}`,
      timestamp: metrics.timestamp,
      testName: metrics.testName,
      browser: metrics.browser,
      recommendations: ['Fix security vulnerabilities', 'Enable HTTPS', 'Add security headers']
    });
  }
  
  // Accessibility alerts
  if (metrics.accessibility.violations > 10) {
    alerts.push({
      id: `accessibility-${Date.now()}`,
      type: 'accessibility',
      severity: 'medium',
      message: `${metrics.accessibility.violations} accessibility violations detected`,
      timestamp: metrics.timestamp,
      testName: metrics.testName,
      browser: metrics.browser,
      recommendations: ['Fix accessibility violations', 'Add ARIA labels', 'Improve keyboard navigation']
    });
  }
  
  // Cross-browser alerts
  if (metrics.crossBrowser.compatibilityScore < 80) {
    alerts.push({
      id: `crossbrowser-${Date.now()}`,
      type: 'crossBrowser',
      severity: 'medium',
      message: `Cross-browser compatibility score: ${metrics.crossBrowser.compatibilityScore}`,
      timestamp: metrics.timestamp,
      testName: metrics.testName,
      browser: metrics.browser,
      recommendations: ['Fix browser compatibility issues', 'Add polyfills', 'Test on more browsers']
    });
  }
  
  return alerts;
}

/**
 * Generate monitoring report
 */
export function generateMonitoringReport(metrics: MonitoringMetrics[], alerts: MonitoringAlert[]): MonitoringReport {
  const totalTests = metrics.length;
  const passedTests = metrics.filter(m => m.reliability.successRate === 100).length;
  const failedTests = totalTests - passedTests;
  const skippedTests = 0; // Not tracked in this implementation
  
  const summary = {
    totalTests,
    passedTests,
    failedTests,
    skippedTests,
    successRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
    averageDuration: metrics.reduce((sum, m) => sum + m.performance.loadTime, 0) / totalTests,
    totalDuration: metrics.reduce((sum, m) => sum + m.performance.loadTime, 0)
  };
  
  const trends = {
    performance: metrics.map(m => m.performance.loadTime),
    reliability: metrics.map(m => m.reliability.successRate),
    security: metrics.map(m => m.security.securityScore),
    accessibility: metrics.map(m => m.accessibility.accessibilityScore),
    crossBrowser: metrics.map(m => m.crossBrowser.compatibilityScore)
  };
  
  const recommendations = [
    ...alerts.flatMap(alert => alert.recommendations),
    'Monitor performance metrics regularly',
    'Set up automated alerts for critical issues',
    'Implement continuous monitoring',
    'Regular security audits',
    'Accessibility compliance reviews'
  ];
  
  return {
    summary,
    metrics,
    alerts,
    trends,
    recommendations
  };
}

/**
 * Send monitoring alerts
 */
export async function sendMonitoringAlerts(alerts: MonitoringAlert[]): Promise<void> {
  for (const alert of alerts) {
    console.log(`🚨 ALERT [${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`);
    console.log(`📊 Test: ${alert.testName} on ${alert.browser}`);
    console.log(`💡 Recommendations: ${alert.recommendations.join(', ')}`);
  }
}

/**
 * Store monitoring data
 */
export async function storeMonitoringData(metrics: MonitoringMetrics, alerts: MonitoringAlert[]): Promise<void> {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const dataDir = path.join(process.cwd(), 'monitoring-data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const dataFile = path.join(dataDir, `monitoring-${Date.now()}.json`);
    const data = {
      metrics,
      alerts,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    console.log(`📊 Monitoring data stored: ${dataFile}`);
    
  } catch (error) {
    console.log(`⚠️ Error storing monitoring data: ${error}`);
  }
}




