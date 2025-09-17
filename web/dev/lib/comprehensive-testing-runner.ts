// Comprehensive Testing Runner
// Executes all testing suites and generates complete deployment readiness report

import { testingSuite } from './testing-suite'
import { devLog } from '@/lib/logger';
import { crossPlatformTesting } from './cross-platform-testing'
import { mobileCompatibilityTesting } from './mobile-compatibility-testing'

export type ComprehensiveTestResult = {
  testSuite: string
  status: 'pass' | 'fail' | 'warning'
  totalTests: number
  passedTests: number
  failedTests: number
  warningTests: number
  successRate: number
  details: any
  timestamp: number
}

export type ComprehensiveReport = {
  overallStatus: 'ready' | 'needs-improvement' | 'not-ready'
  overallSuccessRate: number
  totalTestSuites: number
  passedSuites: number
  failedSuites: number
  warningSuites: number
  results: ComprehensiveTestResult[]
  recommendations: string[]
  deploymentReadiness: {
    coreFunctionality: boolean
    security: boolean
    performance: boolean
    accessibility: boolean
    crossPlatform: boolean
    mobileCompatibility: boolean
    pwaFeatures: boolean
  }
  summary: {
    totalTests: number
    totalPassed: number
    totalFailed: number
    totalWarnings: number
  }
  timestamp: number
}

export class ComprehensiveTestingRunner {
  private results: ComprehensiveTestResult[] = []

  // Run all comprehensive tests
  async runAllTests(): Promise<ComprehensiveReport> {
    devLog('🚀 Starting Comprehensive Testing...')
    
    this.results = []
    
    // Run MVP Testing Suite
    devLog('📋 Running MVP Testing Suite...')
    const mvpResult = await this.runMVPTesting()
    this.results.push(mvpResult)
    
    // Run Cross-Platform Testing Suite
    devLog('🌐 Running Cross-Platform Testing Suite...')
    const crossPlatformResult = await this.runCrossPlatformTesting()
    this.results.push(crossPlatformResult)
    
    // Run Mobile Compatibility Testing Suite
    devLog('📱 Running Mobile Compatibility Testing Suite...')
    const mobileResult = await this.runMobileCompatibilityTesting()
    this.results.push(mobileResult)
    
    // Generate comprehensive report
    const report = this.generateComprehensiveReport()
    
    devLog('✅ Comprehensive Testing Complete!')
    devLog(`📊 Overall Success Rate: ${(report.overallSuccessRate * 100).toFixed(1)}%`)
    devLog(`🚀 Deployment Status: ${report.overallStatus.toUpperCase()}`)
    
    return report
  }

  // Run MVP Testing Suite
  private async runMVPTesting(): Promise<ComprehensiveTestResult> {
    try {
      if (!testingSuite) {
        throw new Error('Testing suite not available')
      }
      const report = await testingSuite.generateDeploymentReport()
      
      const totalTests = report.totalTests
      const passedTests = report.totalPassed
      const failedTests = report.totalFailed
      const warningTests = report.totalTests - report.totalPassed - report.totalFailed
      const successRate = report.overallSuccessRate
      
      let status: 'pass' | 'fail' | 'warning'
      if (successRate >= 0.9 && failedTests === 0) {
        status = 'pass'
      } else if (successRate >= 0.7) {
        status = 'warning'
      } else {
        status = 'fail'
      }
      
      return {
        testSuite: 'MVP Testing',
        status,
        totalTests,
        passedTests,
        failedTests,
        warningTests,
        successRate,
        details: {
          deploymentReady: report.deploymentReady,
          suites: report.suites,
          recommendations: report.recommendations
        },
        timestamp: Date.now()
      }
    } catch (error) {
      devLog('❌ MVP Testing failed:', error)
      return {
        testSuite: 'MVP Testing',
        status: 'fail',
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        warningTests: 0,
        successRate: 0,
        details: { error: error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" : 'Unknown error' },
        timestamp: Date.now()
      }
    }
  }

  // Run Cross-Platform Testing Suite
  private async runCrossPlatformTesting(): Promise<ComprehensiveTestResult> {
    try {
      if (!crossPlatformTesting) {
        throw new Error('Cross-platform testing not available')
      }
      if (!crossPlatformTesting) { throw new Error('Cross-platform testing not available'); } const report = await crossPlatformTesting.generateComprehensiveReport()
      
      const totalTests = report.totalTests
      const passedTests = report.totalPassed
      const failedTests = report.totalFailed
      const warningTests = report.totalWarnings
      const successRate = report.overallSuccessRate
      
      let status: 'pass' | 'fail' | 'warning'
      if (successRate >= 0.9 && failedTests === 0) {
        status = 'pass'
      } else if (successRate >= 0.7) {
        status = 'warning'
      } else {
        status = 'fail'
      }
      
      return {
        testSuite: 'Cross-Platform Testing',
        status,
        totalTests,
        passedTests,
        failedTests,
        warningTests,
        successRate,
        details: {
          crossPlatformReady: report.crossPlatformReady,
          deviceInfo: report.deviceInfo,
          browserInfo: report.browserInfo,
          suites: report.suites,
          recommendations: report.recommendations
        },
        timestamp: Date.now()
      }
    } catch (error) {
      devLog('❌ Cross-Platform Testing failed:', error)
      return {
        testSuite: 'Cross-Platform Testing',
        status: 'fail',
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        warningTests: 0,
        successRate: 0,
        details: { error: error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" : 'Unknown error' },
        timestamp: Date.now()
      }
    }
  }

  // Run Mobile Compatibility Testing Suite
  private async runMobileCompatibilityTesting(): Promise<ComprehensiveTestResult> {
    try {
      if (!mobileCompatibilityTesting) {
        throw new Error('Mobile compatibility testing not available')
      }
      const report = await mobileCompatibilityTesting.generateMobileReport()
      
      const totalTests = report.totalTests
      const passedTests = report.totalPassed
      const failedTests = report.totalFailed
      const warningTests = report.totalWarnings
      const successRate = report.overallSuccessRate
      
      let status: 'pass' | 'fail' | 'warning'
      if (successRate >= 0.9 && failedTests === 0) {
        status = 'pass'
      } else if (successRate >= 0.7) {
        status = 'warning'
      } else {
        status = 'fail'
      }
      
      return {
        testSuite: 'Mobile Compatibility Testing',
        status,
        totalTests,
        passedTests,
        failedTests,
        warningTests,
        successRate,
        details: {
          mobileReady: report.mobileReady,
          deviceInfo: report.deviceInfo,
          suites: report.suites,
          recommendations: report.recommendations
        },
        timestamp: Date.now()
      }
    } catch (error) {
      devLog('❌ Mobile Compatibility Testing failed:', error)
      return {
        testSuite: 'Mobile Compatibility Testing',
        status: 'fail',
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        warningTests: 0,
        successRate: 0,
        details: { error: error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" : 'Unknown error' },
        timestamp: Date.now()
      }
    }
  }

  // Generate comprehensive report
  private generateComprehensiveReport(): ComprehensiveReport {
    const totalTestSuites = this.results.length
    const passedSuites = this.results.filter(r => r.status === 'pass').length
    const failedSuites = this.results.filter(r => r.status === 'fail').length
    const warningSuites = this.results.filter(r => r.status === 'warning').length
    
    const totalTests = this.results.reduce((sum: any, r: any) => sum + r.totalTests, 0)
    const totalPassed = this.results.reduce((sum: any, r: any) => sum + r.passedTests, 0)
    const totalFailed = this.results.reduce((sum: any, r: any) => sum + r.failedTests, 0)
    const totalWarnings = this.results.reduce((sum: any, r: any) => sum + r.warningTests, 0)
    
    const overallSuccessRate = totalTests > 0 ? totalPassed / totalTests : 0
    
    // Determine overall status
    let overallStatus: 'ready' | 'needs-improvement' | 'not-ready'
    if (overallSuccessRate >= 0.9 && failedSuites === 0) {
      overallStatus = 'ready'
    } else if (overallSuccessRate >= 0.7) {
      overallStatus = 'needs-improvement'
    } else {
      overallStatus = 'not-ready'
    }
    
    // Determine deployment readiness for each category
    const deploymentReadiness = {
      coreFunctionality: this.results.find(r => r.testSuite === 'MVP Testing')?.status === 'pass',
      security: this.results.find(r => r.testSuite === 'MVP Testing')?.status === 'pass',
      performance: this.results.find(r => r.testSuite === 'MVP Testing')?.status === 'pass',
      accessibility: this.results.find(r => r.testSuite === 'Cross-Platform Testing')?.status === 'pass',
      crossPlatform: this.results.find(r => r.testSuite === 'Cross-Platform Testing')?.status === 'pass',
      mobileCompatibility: this.results.find(r => r.testSuite === 'Mobile Compatibility Testing')?.status === 'pass',
      pwaFeatures: this.results.find(r => r.testSuite === 'Mobile Compatibility Testing')?.status === 'pass'
    }
    
    // Generate recommendations
    const recommendations = this.generateRecommendations()
    
    return {
      overallStatus,
      overallSuccessRate,
      totalTestSuites,
      passedSuites,
      failedSuites,
      warningSuites,
      results: this.results,
      recommendations,
      deploymentReadiness,
      summary: {
        totalTests,
        totalPassed,
        totalFailed,
        totalWarnings
      },
      timestamp: Date.now()
    }
  }

  // Generate recommendations
  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    
    this.results.forEach(result => {
      if (result.status === 'fail') {
        recommendations.push(`🚨 CRITICAL: Fix ${result.testSuite} - ${result.failedTests} tests failed`)
      } else if (result.status === 'warning') {
        recommendations.push(`⚠️ IMPROVE: ${result.testSuite} - ${result.warningTests} tests need attention`)
      }
      
      // Add specific recommendations from test details
      if (result.details.recommendations) {
        result.details.recommendations.forEach((rec: string) => {
          recommendations.push(`💡 ${result.testSuite}: ${rec}`)
        })
      }
    })
    
    // Add overall recommendations
    if (this.results.every(r => r.status === 'pass')) {
      recommendations.push('🎉 EXCELLENT: All test suites passed! Ready for deployment.')
    } else if (this.results.some(r => r.status === 'fail')) {
      recommendations.push('🚨 URGENT: Critical issues found. Fix before deployment.')
    } else {
      recommendations.push('⚠️ CAUTION: Some improvements needed before deployment.')
    }
    
    return recommendations
  }

  // Generate detailed test report
  async generateDetailedReport(): Promise<any> {
    const comprehensiveReport = await this.runAllTests()
    
    const detailedReport = {
      ...comprehensiveReport,
      testDetails: this.results.map(result => ({
        suite: result.testSuite,
        status: result.status,
        metrics: {
          total: result.totalTests,
          passed: result.passedTests,
          failed: result.failedTests,
          warnings: result.warningTests,
          successRate: result.successRate
        },
        details: result.details,
        timestamp: result.timestamp
      })),
      performance: {
        buildTime: Date.now() - comprehensiveReport.timestamp,
        testExecutionTime: comprehensiveReport.timestamp - (this.results[0]?.timestamp ?? comprehensiveReport.timestamp)
      }
    }
    
    return detailedReport
  }

  // Export report to JSON
  async exportReport(): Promise<string> {
    const report = await this.generateDetailedReport()
    return JSON.stringify(report, null, 2)
  }

  // Print summary to console
  printSummary(report: ComprehensiveReport): void {
    devLog('\n' + '='.repeat(60))
    devLog('📊 COMPREHENSIVE TESTING SUMMARY')
    devLog('='.repeat(60))
    
    devLog(`\n🎯 Overall Status: ${report.overallStatus.toUpperCase()}`)
    devLog(`📈 Success Rate: ${(report.overallSuccessRate * 100).toFixed(1)}%`)
    devLog(`📋 Test Suites: ${report.totalTestSuites}`)
    devLog(`✅ Passed: ${report.passedSuites}`)
    devLog(`⚠️ Warnings: ${report.warningSuites}`)
    devLog(`❌ Failed: ${report.failedSuites}`)
    
    devLog(`\n📊 Test Summary:`)
    devLog(`   Total Tests: ${report.summary.totalTests}`)
    devLog(`   Passed: ${report.summary.totalPassed}`)
    devLog(`   Failed: ${report.summary.totalFailed}`)
    devLog(`   Warnings: ${report.summary.totalWarnings}`)
    
    devLog(`\n🚀 Deployment Readiness:`)
    Object.entries(report.deploymentReadiness).forEach(([key, value]) => {
      const status = value ? '✅' : '❌'
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
      devLog(`   ${status} ${label}`)
    })
    
    if (report.recommendations.length > 0) {
      devLog(`\n💡 Recommendations:`)
      report.recommendations.forEach(rec => {
        devLog(`   ${rec}`)
      })
    }
    
    devLog('\n' + '='.repeat(60))
  }
}

// Export singleton instance
// Lazy initialization for comprehensive testing runner
let comprehensiveTestingRunnerInstance: ComprehensiveTestingRunner | null = null

export const getComprehensiveTestingRunner = (): ComprehensiveTestingRunner => {
  if (!comprehensiveTestingRunnerInstance && typeof window !== 'undefined') {
    comprehensiveTestingRunnerInstance = new ComprehensiveTestingRunner()
  }
  return comprehensiveTestingRunnerInstance!
}

// For backward compatibility - only call getter in browser
export const comprehensiveTestingRunner = typeof window !== 'undefined' ? getComprehensiveTestingRunner() : null
