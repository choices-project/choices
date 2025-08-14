// Comprehensive Testing Runner
// Executes all testing suites and generates complete deployment readiness report

import { testingSuite } from './testing-suite'
import { crossPlatformTesting } from './cross-platform-testing'
import { mobileCompatibilityTesting } from './mobile-compatibility-testing'

export interface ComprehensiveTestResult {
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

export interface ComprehensiveReport {
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
    console.log('🚀 Starting Comprehensive Testing...')
    
    this.results = []
    
    // Run MVP Testing Suite
    console.log('📋 Running MVP Testing Suite...')
    const mvpResult = await this.runMVPTesting()
    this.results.push(mvpResult)
    
    // Run Cross-Platform Testing Suite
    console.log('🌐 Running Cross-Platform Testing Suite...')
    const crossPlatformResult = await this.runCrossPlatformTesting()
    this.results.push(crossPlatformResult)
    
    // Run Mobile Compatibility Testing Suite
    console.log('📱 Running Mobile Compatibility Testing Suite...')
    const mobileResult = await this.runMobileCompatibilityTesting()
    this.results.push(mobileResult)
    
    // Generate comprehensive report
    const report = this.generateComprehensiveReport()
    
    console.log('✅ Comprehensive Testing Complete!')
    console.log(`📊 Overall Success Rate: ${(report.overallSuccessRate * 100).toFixed(1)}%`)
    console.log(`🚀 Deployment Status: ${report.overallStatus.toUpperCase()}`)
    
    return report
  }

  // Run MVP Testing Suite
  private async runMVPTesting(): Promise<ComprehensiveTestResult> {
    try {
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
      console.error('❌ MVP Testing failed:', error)
      return {
        testSuite: 'MVP Testing',
        status: 'fail',
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        warningTests: 0,
        successRate: 0,
        details: { error: error.message },
        timestamp: Date.now()
      }
    }
  }

  // Run Cross-Platform Testing Suite
  private async runCrossPlatformTesting(): Promise<ComprehensiveTestResult> {
    try {
      const report = await crossPlatformTesting.generateComprehensiveReport()
      
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
      console.error('❌ Cross-Platform Testing failed:', error)
      return {
        testSuite: 'Cross-Platform Testing',
        status: 'fail',
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        warningTests: 0,
        successRate: 0,
        details: { error: error.message },
        timestamp: Date.now()
      }
    }
  }

  // Run Mobile Compatibility Testing Suite
  private async runMobileCompatibilityTesting(): Promise<ComprehensiveTestResult> {
    try {
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
      console.error('❌ Mobile Compatibility Testing failed:', error)
      return {
        testSuite: 'Mobile Compatibility Testing',
        status: 'fail',
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        warningTests: 0,
        successRate: 0,
        details: { error: error.message },
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
    
    const totalTests = this.results.reduce((sum, r) => sum + r.totalTests, 0)
    const totalPassed = this.results.reduce((sum, r) => sum + r.passedTests, 0)
    const totalFailed = this.results.reduce((sum, r) => sum + r.failedTests, 0)
    const totalWarnings = this.results.reduce((sum, r) => sum + r.warningTests, 0)
    
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
        testExecutionTime: comprehensiveReport.timestamp - this.results[0]?.timestamp || 0
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
    console.log('\n' + '='.repeat(60))
    console.log('📊 COMPREHENSIVE TESTING SUMMARY')
    console.log('='.repeat(60))
    
    console.log(`\n🎯 Overall Status: ${report.overallStatus.toUpperCase()}`)
    console.log(`📈 Success Rate: ${(report.overallSuccessRate * 100).toFixed(1)}%`)
    console.log(`📋 Test Suites: ${report.totalTestSuites}`)
    console.log(`✅ Passed: ${report.passedSuites}`)
    console.log(`⚠️ Warnings: ${report.warningSuites}`)
    console.log(`❌ Failed: ${report.failedSuites}`)
    
    console.log(`\n📊 Test Summary:`)
    console.log(`   Total Tests: ${report.summary.totalTests}`)
    console.log(`   Passed: ${report.summary.totalPassed}`)
    console.log(`   Failed: ${report.summary.totalFailed}`)
    console.log(`   Warnings: ${report.summary.totalWarnings}`)
    
    console.log(`\n🚀 Deployment Readiness:`)
    Object.entries(report.deploymentReadiness).forEach(([key, value]) => {
      const status = value ? '✅' : '❌'
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
      console.log(`   ${status} ${label}`)
    })
    
    if (report.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`)
      report.recommendations.forEach(rec => {
        console.log(`   ${rec}`)
      })
    }
    
    console.log('\n' + '='.repeat(60))
  }
}

// Export singleton instance
export const comprehensiveTestingRunner = new ComprehensiveTestingRunner()
