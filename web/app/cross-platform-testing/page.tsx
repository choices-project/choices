'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play, 
  RefreshCw,
  Download,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Zap,
  Shield,
  Eye,
  MousePointer,
  Wifi,
  WifiOff,
  Battery,
  Cpu,
  HardDrive,
  Network,
  Smartphone as MobileIcon,
  Monitor as DesktopIcon,
  Tablet as TabletIcon,
  Globe as BrowserIcon,
  Zap as PerformanceIcon,
  Shield as SecurityIcon,
  Eye as AccessibilityIcon,
  MousePointer as TouchIcon,
  Wifi as NetworkIcon,
  Battery as BatteryIcon,
  Cpu as DeviceIcon,
  HardDrive as StorageIcon,
  Network as ApiIcon,
  Smartphone as ResponsiveIcon,
  Monitor as PwaIcon,
  Tablet as TouchInterfaceIcon,
  Globe as PerformanceTestIcon,
  Zap as AccessibilityTestIcon,
  Shield as BrowserCompatibilityIcon,
  Eye as DeviceSpecificIcon
} from 'lucide-react'
import { useTestingUtils } from '../../hooks/useTestingUtils'

// Import types separately to avoid SSR issues
import type { PlatformTestSuite, TestResult, DeviceInfo, BrowserInfo } from '../../lib/cross-platform-testing'

export default function CrossPlatformTestingPage() {
  const { utils: testingUtils, loading: utilsLoading, error: utilsError } = useTestingUtils()
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [testSuites, setTestSuites] = useState<PlatformTestSuite[]>([])
  const [comprehensiveReport, setComprehensiveReport] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null)

  const runAllTests = useCallback(async () => {
    if (!testingUtils) return
    
    setIsRunningTests(true)
    
    try {
      const suites = await testingUtils.crossPlatformTesting.runAllTests()
      setTestSuites(suites)
      
      const report = await testingUtils.crossPlatformTesting.generateComprehensiveReport()
      setComprehensiveReport(report)
      setDeviceInfo(report.deviceInfo)
      setBrowserInfo(report.browserInfo)
    } catch (error) {
      console.error('Cross-platform test execution failed:', error)
    } finally {
      setIsRunningTests(false)
    }
  }, [testingUtils])

  useEffect(() => {
    if (testingUtils && !utilsLoading) {
      // Auto-run tests on page load
      runAllTests()
    }
  }, [testingUtils, utilsLoading, runAllTests])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'skip':
        return <AlertTriangle className="w-4 h-4 text-gray-400" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />
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
      case 'skip':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getDeviceIcon = () => {
    if (!browserInfo) return <Globe className="w-6 h-6" />
    
    if (browserInfo.mobile) return <MobileIcon className="w-6 h-6" />
    if (browserInfo.tablet) return <TabletIcon className="w-6 h-6" />
    return <DesktopIcon className="w-6 h-6" />
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Globe },
    { id: 'responsive', label: 'Responsive Design', icon: ResponsiveIcon },
    { id: 'pwa', label: 'PWA Features', icon: PwaIcon },
    { id: 'touch', label: 'Touch Interface', icon: TouchInterfaceIcon },
    { id: 'performance', label: 'Performance', icon: PerformanceTestIcon },
    { id: 'accessibility', label: 'Accessibility', icon: AccessibilityTestIcon },
    { id: 'browser', label: 'Browser Compatibility', icon: BrowserCompatibilityIcon },
    { id: 'device', label: 'Device Specific', icon: DeviceSpecificIcon }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Cross-Platform Testing</h1>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={runAllTests}
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
        {/* Device & Browser Info */}
        {deviceInfo && browserInfo && (
          <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Device Info */}
              <div className="flex items-center space-x-3">
                {getDeviceIcon()}
                <div>
                  <p className="font-medium text-gray-900">
                    {browserInfo.mobile ? 'Mobile' : browserInfo.tablet ? 'Tablet' : 'Desktop'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {deviceInfo.viewport.width} × {deviceInfo.viewport.height}
                  </p>
                </div>
              </div>

              {/* Browser Info */}
              <div className="flex items-center space-x-3">
                <BrowserIcon className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">{browserInfo.name} {browserInfo.version}</p>
                  <p className="text-sm text-gray-600">{browserInfo.os} {browserInfo.osVersion}</p>
                </div>
              </div>

              {/* Connection Info */}
              <div className="flex items-center space-x-3">
                <NetworkIcon className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    {deviceInfo.connection ? deviceInfo.connection.effectiveType : 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {deviceInfo.onLine ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Cross-Platform Readiness */}
            {comprehensiveReport && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Cross-Platform Readiness</h3>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                    comprehensiveReport.crossPlatformReady 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {comprehensiveReport.crossPlatformReady ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {comprehensiveReport.crossPlatformReady ? 'Cross-Platform Ready' : 'Not Ready'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{comprehensiveReport.totalTests}</div>
                    <div className="text-sm text-gray-600">Total Tests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{comprehensiveReport.totalPassed}</div>
                    <div className="text-sm text-gray-600">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{comprehensiveReport.totalFailed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{comprehensiveReport.totalWarnings}</div>
                    <div className="text-sm text-gray-600">Warnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {(comprehensiveReport.overallSuccessRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                </div>

                {/* Recommendations */}
                {comprehensiveReport.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
                    <div className="space-y-2">
                      {comprehensiveReport.recommendations.map((rec: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2 text-sm">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Test Suites Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {testSuites.map((suite) => (
                <div key={suite.name} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">{suite.name}</h4>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      suite.summary.successRate >= 0.9 
                        ? 'bg-green-100 text-green-800' 
                        : suite.summary.successRate >= 0.7 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {(suite.summary.successRate * 100).toFixed(0)}%
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium text-gray-900">{suite.summary.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Passed:</span>
                      <span className="font-medium text-green-600">{suite.summary.passed}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Failed:</span>
                      <span className="font-medium text-red-600">{suite.summary.failed}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Warnings:</span>
                      <span className="font-medium text-yellow-600">{suite.summary.warnings}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Skipped:</span>
                      <span className="font-medium text-gray-600">{suite.summary.skipped}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Responsive Design Tab */}
        {activeTab === 'responsive' && (
          <div className="space-y-6">
            {testSuites.find(s => s.name === 'Responsive Design') && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Responsive Design Tests</h3>
                
                <div className="space-y-3">
                  {testSuites.find(s => s.name === 'Responsive Design')?.tests.map((test, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(test.status)}
                          <h4 className="font-medium text-gray-900">{test.testName}</h4>
                        </div>
                        <span className="text-sm text-gray-600">{test.category}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{test.message}</p>
                      {test.details && (
                        <details className="text-sm text-gray-600">
                          <summary className="cursor-pointer hover:text-gray-800">View Details</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PWA Features Tab */}
        {activeTab === 'pwa' && (
          <div className="space-y-6">
            {testSuites.find(s => s.name === 'PWA Features') && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">PWA Features Tests</h3>
                
                <div className="space-y-3">
                  {testSuites.find(s => s.name === 'PWA Features')?.tests.map((test, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(test.status)}
                          <h4 className="font-medium text-gray-900">{test.testName}</h4>
                        </div>
                        <span className="text-sm text-gray-600">{test.category}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{test.message}</p>
                      {test.details && (
                        <details className="text-sm text-gray-600">
                          <summary className="cursor-pointer hover:text-gray-800">View Details</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Touch Interface Tab */}
        {activeTab === 'touch' && (
          <div className="space-y-6">
            {testSuites.find(s => s.name === 'Touch Interface') && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Touch Interface Tests</h3>
                
                <div className="space-y-3">
                  {testSuites.find(s => s.name === 'Touch Interface')?.tests.map((test, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(test.status)}
                          <h4 className="font-medium text-gray-900">{test.testName}</h4>
                        </div>
                        <span className="text-sm text-gray-600">{test.category}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{test.message}</p>
                      {test.details && (
                        <details className="text-sm text-gray-600">
                          <summary className="cursor-pointer hover:text-gray-800">View Details</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            {testSuites.find(s => s.name === 'Performance') && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Tests</h3>
                
                <div className="space-y-3">
                  {testSuites.find(s => s.name === 'Performance')?.tests.map((test, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(test.status)}
                          <h4 className="font-medium text-gray-900">{test.testName}</h4>
                        </div>
                        <span className="text-sm text-gray-600">{test.category}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{test.message}</p>
                      {test.details && (
                        <details className="text-sm text-gray-600">
                          <summary className="cursor-pointer hover:text-gray-800">View Details</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Accessibility Tab */}
        {activeTab === 'accessibility' && (
          <div className="space-y-6">
            {testSuites.find(s => s.name === 'Accessibility') && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Accessibility Tests</h3>
                
                <div className="space-y-3">
                  {testSuites.find(s => s.name === 'Accessibility')?.tests.map((test, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(test.status)}
                          <h4 className="font-medium text-gray-900">{test.testName}</h4>
                        </div>
                        <span className="text-sm text-gray-600">{test.category}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{test.message}</p>
                      {test.details && (
                        <details className="text-sm text-gray-600">
                          <summary className="cursor-pointer hover:text-gray-800">View Details</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Browser Compatibility Tab */}
        {activeTab === 'browser' && (
          <div className="space-y-6">
            {testSuites.find(s => s.name === 'Browser Compatibility') && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Browser Compatibility Tests</h3>
                
                <div className="space-y-3">
                  {testSuites.find(s => s.name === 'Browser Compatibility')?.tests.map((test, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(test.status)}
                          <h4 className="font-medium text-gray-900">{test.testName}</h4>
                        </div>
                        <span className="text-sm text-gray-600">{test.category}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{test.message}</p>
                      {test.details && (
                        <details className="text-sm text-gray-600">
                          <summary className="cursor-pointer hover:text-gray-800">View Details</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Device Specific Tab */}
        {activeTab === 'device' && (
          <div className="space-y-6">
            {testSuites.find(s => s.name === 'Device Specific') && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Specific Tests</h3>
                
                <div className="space-y-3">
                  {testSuites.find(s => s.name === 'Device Specific')?.tests.map((test, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(test.status)}
                          <h4 className="font-medium text-gray-900">{test.testName}</h4>
                        </div>
                        <span className="text-sm text-gray-600">{test.category}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{test.message}</p>
                      {test.details && (
                        <details className="text-sm text-gray-600">
                          <summary className="cursor-pointer hover:text-gray-800">View Details</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
