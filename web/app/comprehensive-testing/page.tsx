'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { devLog } from '@/lib/logger';
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play, 
  RefreshCw,
  Download,
  FileText,
  Target,
  Globe,
  Smartphone,
  Shield,
  Zap,
  Eye,
  Monitor,
  Tablet,
  Clock,
  TrendingUp,
  BarChart3,
  Activity,
  Settings,
  Database,
  Network,
  HardDrive,
  Cpu,
  Battery,
  Wifi,
  WifiOff,
  Server,
  Cloud,
  Lock,
  Unlock,
  CheckSquare,
  Square,
  AlertCircle,
  Info,
  ExternalLink,
  Copy,
  Share2
} from 'lucide-react'
import { useTestingUtils } from '../../hooks/useTestingUtils'

// Import types separately to avoid SSR issues
import type { ComprehensiveReport, ComprehensiveTestResult } from '../../lib/comprehensive-testing-runner'

export default function ComprehensiveTestingPage() {
  const { utils: testingUtils, loading: utilsLoading, error: utilsError } = useTestingUtils()
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [report, setReport] = useState<ComprehensiveReport | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [exportData, setExportData] = useState<string>('')

  const runComprehensiveTests = useCallback(async () => {
    if (!testingUtils) return
    
    setIsRunningTests(true)
    
    try {
      const comprehensiveReport = await testingUtils.comprehensiveTestingRunner.runAllTests()
      setReport(comprehensiveReport)
      
      // Generate export data
      const exportReport = await testingUtils.comprehensiveTestingRunner.exportReport()
      setExportData(exportReport)
    } catch (error) {
      devLog('Comprehensive testing failed:', error)
    } finally {
      setIsRunningTests(false)
    }
  }, [testingUtils])

  useEffect(() => {
    if (testingUtils && !utilsLoading) {
      // Auto-run tests on page load
      runComprehensiveTests()
    }
  }, [testingUtils, utilsLoading, runComprehensiveTests])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'fail':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'not-ready':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'mvp', label: 'MVP Testing', icon: Target },
    { id: 'cross-platform', label: 'Cross-Platform', icon: Globe },
    { id: 'mobile', label: 'Mobile Compatibility', icon: Smartphone },
    { id: 'deployment', label: 'Deployment Readiness', icon: CheckSquare },
    { id: 'details', label: 'Detailed Results', icon: BarChart3 },
    { id: 'export', label: 'Export Report', icon: Download }
  ]

  const downloadReport = () => {
    if (exportData) {
      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `comprehensive-testing-report-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const copyReport = async () => {
    if (exportData) {
      try {
        await navigator.clipboard.writeText(exportData)
        alert('Report copied to clipboard!')
      } catch (error) {
        devLog('Failed to copy report:', error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Comprehensive Testing</h1>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={runComprehensiveTests}
                disabled={isRunningTests}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md transition-colors"
              >
                {isRunningTests ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span className="ml-2">
                  {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white rounded-lg border border-gray-200 p-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && report && (
          <div className="space-y-6">
            {/* Overall Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Overall Testing Status</h3>
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getOverallStatusColor(report.overallStatus)}`}>
                  {getStatusIcon(report.overallStatus === 'ready' ? 'pass' : report.overallStatus === 'needs-improvement' ? 'warning' : 'fail')}
                  <span className="text-sm font-medium">
                    {report.overallStatus.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{report.totalTestSuites}</div>
                  <div className="text-sm text-gray-600">Test Suites</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{report.passedSuites}</div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{report.warningSuites}</div>
                  <div className="text-sm text-gray-600">Warnings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {(report.overallSuccessRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>

              {/* Test Suites Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {report.results.map((result) => (
                  <div key={result.testSuite} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{result.testSuite}</h4>
                      {getStatusIcon(result.status)}
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Tests:</span>
                        <span className="font-medium">{result.totalTests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Passed:</span>
                        <span className="font-medium text-green-600">{result.passedTests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Failed:</span>
                        <span className="font-medium text-red-600">{result.failedTests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Success Rate:</span>
                        <span className="font-medium text-blue-600">
                          {(result.successRate * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                <div className="space-y-3">
                  {report.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MVP Testing Tab */}
        {activeTab === 'mvp' && report && (
          <div className="space-y-6">
            {report.results.find(r => r.testSuite === 'MVP Testing') && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">MVP Testing Results</h3>
                
                {(() => {
                  const mvpResult = report.results.find(r => r.testSuite === 'MVP Testing')!
                  return (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-lg border ${getStatusColor(mvpResult.status)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">MVP Testing Suite</h4>
                          {getStatusIcon(mvpResult.status)}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {mvpResult.details.deploymentReady ? 'Ready for deployment' : 'Not ready for deployment'}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Total Tests:</span>
                            <span className="font-medium ml-2">{mvpResult.totalTests}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Passed:</span>
                            <span className="font-medium text-green-600 ml-2">{mvpResult.passedTests}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Failed:</span>
                            <span className="font-medium text-red-600 ml-2">{mvpResult.failedTests}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Success Rate:</span>
                            <span className="font-medium text-blue-600 ml-2">
                              {(mvpResult.successRate * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {mvpResult.details.suites && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Test Suites</h4>
                          <div className="space-y-2">
                            {mvpResult.details.suites.map((suite: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-900">{suite.name}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600">
                                    {suite.summary.passed}/{suite.summary.total}
                                  </span>
                                  <span className="text-sm font-medium text-blue-600">
                                    {(suite.summary.successRate * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )}

        {/* Cross-Platform Testing Tab */}
        {activeTab === 'cross-platform' && report && (
          <div className="space-y-6">
            {report.results.find(r => r.testSuite === 'Cross-Platform Testing') && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cross-Platform Testing Results</h3>
                
                {(() => {
                  const crossPlatformResult = report.results.find(r => r.testSuite === 'Cross-Platform Testing')!
                  return (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-lg border ${getStatusColor(crossPlatformResult.status)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">Cross-Platform Testing Suite</h4>
                          {getStatusIcon(crossPlatformResult.status)}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {crossPlatformResult.details.crossPlatformReady ? 'Cross-platform ready' : 'Cross-platform compatibility issues found'}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Total Tests:</span>
                            <span className="font-medium ml-2">{crossPlatformResult.totalTests}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Passed:</span>
                            <span className="font-medium text-green-600 ml-2">{crossPlatformResult.passedTests}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Failed:</span>
                            <span className="font-medium text-red-600 ml-2">{crossPlatformResult.failedTests}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Success Rate:</span>
                            <span className="font-medium text-blue-600 ml-2">
                              {(crossPlatformResult.successRate * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {crossPlatformResult.details.deviceInfo && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Device Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <span className="text-sm text-gray-600">Viewport:</span>
                              <span className="text-sm font-medium ml-2">
                                {crossPlatformResult.details.deviceInfo.viewport.width} × {crossPlatformResult.details.deviceInfo.viewport.height}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Platform:</span>
                              <span className="text-sm font-medium ml-2">
                                {crossPlatformResult.details.browserInfo?.os} {crossPlatformResult.details.browserInfo?.osVersion}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Browser:</span>
                              <span className="text-sm font-medium ml-2">
                                {crossPlatformResult.details.browserInfo?.name} {crossPlatformResult.details.browserInfo?.version}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Connection:</span>
                              <span className="text-sm font-medium ml-2">
                                {crossPlatformResult.details.deviceInfo.connection?.effectiveType || 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )}

        {/* Mobile Compatibility Testing Tab */}
        {activeTab === 'mobile' && report && (
          <div className="space-y-6">
            {report.results.find(r => r.testSuite === 'Mobile Compatibility Testing') && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mobile Compatibility Testing Results</h3>
                
                {(() => {
                  const mobileResult = report.results.find(r => r.testSuite === 'Mobile Compatibility Testing')!
                  return (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-lg border ${getStatusColor(mobileResult.status)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">Mobile Compatibility Testing Suite</h4>
                          {getStatusIcon(mobileResult.status)}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {mobileResult.details.mobileReady ? 'Mobile ready' : 'Mobile compatibility issues found'}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Total Tests:</span>
                            <span className="font-medium ml-2">{mobileResult.totalTests}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Passed:</span>
                            <span className="font-medium text-green-600 ml-2">{mobileResult.passedTests}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Failed:</span>
                            <span className="font-medium text-red-600 ml-2">{mobileResult.failedTests}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Success Rate:</span>
                            <span className="font-medium text-blue-600 ml-2">
                              {(mobileResult.successRate * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {mobileResult.details.deviceInfo && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Mobile Device Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <span className="text-sm text-gray-600">Device Type:</span>
                              <span className="text-sm font-medium ml-2">
                                {mobileResult.details.deviceInfo.isMobile ? 'Mobile' : mobileResult.details.deviceInfo.isTablet ? 'Tablet' : 'Desktop'}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Touch Support:</span>
                              <span className="text-sm font-medium ml-2">
                                {mobileResult.details.deviceInfo.isTouchDevice ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Viewport:</span>
                              <span className="text-sm font-medium ml-2">
                                {mobileResult.details.deviceInfo.viewportWidth} × {mobileResult.details.deviceInfo.viewportHeight}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Pixel Ratio:</span>
                              <span className="text-sm font-medium ml-2">
                                {mobileResult.details.deviceInfo.pixelRatio}x
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )}

        {/* Deployment Readiness Tab */}
        {activeTab === 'deployment' && report && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment Readiness</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(report.deploymentReadiness).map(([key, value]) => (
                  <div key={key} className={`p-4 rounded-lg border ${value ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </h4>
                      {value ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {value ? 'Ready for deployment' : 'Needs attention before deployment'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Deployment Checklist */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment Checklist</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  {report.deploymentReadiness.coreFunctionality ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="text-gray-900">Core functionality tests passing</span>
                </div>
                <div className="flex items-center space-x-3">
                  {report.deploymentReadiness.security ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="text-gray-900">Security and privacy features validated</span>
                </div>
                <div className="flex items-center space-x-3">
                  {report.deploymentReadiness.performance ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="text-gray-900">Performance benchmarks met</span>
                </div>
                <div className="flex items-center space-x-3">
                  {report.deploymentReadiness.accessibility ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="text-gray-900">Accessibility requirements satisfied</span>
                </div>
                <div className="flex items-center space-x-3">
                  {report.deploymentReadiness.crossPlatform ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="text-gray-900">Cross-platform compatibility verified</span>
                </div>
                <div className="flex items-center space-x-3">
                  {report.deploymentReadiness.mobileCompatibility ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="text-gray-900">Mobile compatibility tested</span>
                </div>
                <div className="flex items-center space-x-3">
                  {report.deploymentReadiness.pwaFeatures ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="text-gray-900">PWA features working correctly</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Results Tab */}
        {activeTab === 'details' && report && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Test Results</h3>
              
              <div className="space-y-4">
                {report.results.map((result) => (
                  <div key={result.testSuite} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{result.testSuite}</h4>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(result.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                          {result.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">Total Tests:</span>
                        <span className="font-medium ml-2">{result.totalTests}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Passed:</span>
                        <span className="font-medium text-green-600 ml-2">{result.passedTests}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Failed:</span>
                        <span className="font-medium text-red-600 ml-2">{result.failedTests}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Success Rate:</span>
                        <span className="font-medium text-blue-600 ml-2">
                          {(result.successRate * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Last updated: {new Date(result.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Export Report Tab */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Testing Report</h3>
              
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <button
                    onClick={downloadReport}
                    disabled={!exportData}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download JSON Report</span>
                  </button>
                  
                  <button
                    onClick={copyReport}
                    disabled={!exportData}
                    className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy to Clipboard</span>
                  </button>
                </div>
                
                {exportData && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Report Preview</h4>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {exportData}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
