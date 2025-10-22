import type { FullConfig } from '@playwright/test';
import type { Database } from '@/types/database';
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface MonitoringData {
  timestamp: string;
  testSuite: string;
  baselineMetrics: {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    totalBlockingTime: number;
  };
  systemMetrics: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

async function globalSetup(config: FullConfig) {
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Setting up comprehensive test monitoring...');
  }
  
  const monitoringData: MonitoringData = {
    timestamp: new Date().toISOString(),
    testSuite: 'comprehensive-monitoring',
    baselineMetrics: {
      domContentLoaded: 0,
      loadComplete: 0,
      firstPaint: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      totalBlockingTime: 0,
    },
    systemMetrics: {
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    }
  };

  // Launch browser for baseline metrics
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');

    // Collect baseline performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const getMetric = (name: string) => {
        const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (!entry) return 0;
        
        switch (name) {
          case 'domContentLoaded': 
            return entry.domContentLoadedEventEnd - entry.startTime;
          case 'loadComplete': 
            return entry.loadEventEnd - entry.startTime;
          case 'firstPaint': {
            const fp = performance.getEntriesByName('first-paint')[0];
            return fp ? fp.startTime : 0;
          }
          case 'firstContentfulPaint': {
            const fcp = performance.getEntriesByName('first-contentful-paint')[0];
            return fcp ? fcp.startTime : 0;
          }
          case 'largestContentfulPaint': {
            const lcp = performance.getEntriesByType('largest-contentful-paint')[0] as LargestContentfulPaint;
            return lcp ? lcp.startTime : 0;
          }
          case 'cumulativeLayoutShift': {
            let cls = 0;
            new PerformanceObserver((entryList) => {
              for (const entry of entryList.getEntries()) {
                if (!(entry as any).hadRecentInput) {
                  cls += (entry as any).value;
                }
              }
            }).observe({ type: 'layout-shift', buffered: true });
            return cls;
          }
          case 'totalBlockingTime': {
            let tbt = 0;
            new PerformanceObserver((entryList) => {
              for (const entry of entryList.getEntries()) {
                tbt += (entry as PerformanceEventTiming).duration;
              }
            }).observe({ type: 'longtask', buffered: true });
            return tbt;
          }
          default: 
            return 0;
        }
      };

      return {
        domContentLoaded: getMetric('domContentLoaded'),
        loadComplete: getMetric('loadComplete'),
        firstPaint: getMetric('firstPaint'),
        firstContentfulPaint: getMetric('firstContentfulPaint'),
        largestContentfulPaint: getMetric('largestContentfulPaint'),
        cumulativeLayoutShift: getMetric('cumulativeLayoutShift'),
        totalBlockingTime: getMetric('totalBlockingTime'),
      };
    });

    monitoringData.baselineMetrics = performanceMetrics;

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Baseline Performance Metrics:');
      console.log(`  DOM Content Loaded: ${performanceMetrics.domContentLoaded.toFixed(2)}ms`);
      console.log(`  Load Complete: ${performanceMetrics.loadComplete.toFixed(2)}ms`);
      console.log(`  First Paint: ${performanceMetrics.firstPaint.toFixed(2)}ms`);
      console.log(`  First Contentful Paint: ${performanceMetrics.firstContentfulPaint.toFixed(2)}ms`);
      console.log(`  Largest Contentful Paint: ${performanceMetrics.largestContentfulPaint.toFixed(2)}ms`);
      console.log(`  Cumulative Layout Shift: ${performanceMetrics.cumulativeLayoutShift.toFixed(4)}`);
      console.log(`  Total Blocking Time: ${performanceMetrics.totalBlockingTime.toFixed(2)}ms`);

      // System metrics
      console.log('💻 System Metrics:');
      console.log(`  Memory Usage: ${(monitoringData.systemMetrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  CPU Usage: ${monitoringData.systemMetrics.cpuUsage.user}μs user, ${monitoringData.systemMetrics.cpuUsage.system}μs system`);
    }

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error collecting baseline metrics:', error);
    }
  } finally {
    await browser.close();
  }

  // Save monitoring data
  const monitoringDir = path.join(process.cwd(), 'monitoring-data');
  if (!fs.existsSync(monitoringDir)) {
    fs.mkdirSync(monitoringDir, { recursive: true });
  }

  const monitoringFile = path.join(monitoringDir, `monitoring-${Date.now()}.json`);
  fs.writeFileSync(monitoringFile, JSON.stringify(monitoringData, null, 2));

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Comprehensive test monitoring environment ready');
    console.log(`📁 Monitoring data saved to: ${monitoringFile}`);
  }
}

export default globalSetup;
