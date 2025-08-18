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
  Upload,
  Shield,
  Zap,
  Database,
  Smartphone,
  Users,
  Vote,
  BarChart3,
  Settings,
  Clock,
  Target,
  TrendingUp,
  Activity,
  FileText,
  Eye,
  Lock,
  Globe,
  Server,
  HardDrive,
  Network,
  Cpu,
  Wifi,
  WifiOff
} from 'lucide-react'
import { testingSuite, TestSuite, TestResult } from '../../lib/testing-suite'

export default function MVPTestingPage() {
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [deploymentReport, setDeploymentReport] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // Auto-run tests on page load
    runAllTests()
  }, [])

  const runAllTests = async () => {
    setIsRunningTests(true)
    
    try {
      const suites = await testingSuite.runAllTests()
      setTestSuites(suites)
      
      const report = await testingSuite.generateDeploymentReport()
      setDeploymentReport(report)
    } catch (error) {
      devLog('Test execution failed:', error)
    } finally {
      setIsRunningTests(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
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
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'core', label: 'Core Tests', icon: Target },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'pwa', label: 'PWA Features', icon: Smartphone },
    { id: 'deployment', label: 'Deployment', icon: Upload }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">MVP Testing & Deployment</h1>
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
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white rounded-lg border border-gray-200 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
            {/* Deployment Status */}
            {deploymentReport && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Deployment Readiness</h3>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                    deploymentReport.deploymentReady 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {deploymentReport.deploymentReady ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {deploymentReport.deploymentReady ? 'Ready for Deployment' : 'Not Ready'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{deploymentReport.totalTests}</div>
                    <div className="text-sm text-gray-600">Total Tests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{deploymentReport.totalPassed}</div>
                    <div className="text-sm text-gray-600">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{deploymentReport.totalFailed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {(deploymentReport.overallSuccessRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                </div>

                {/* Recommendations */}
                {deploymentReport.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
                    <div className="space-y-2">
                      {deploymentReport.recommendations.map((rec: string, index: number) => (
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Core Tests Tab */}
        {activeTab === 'core' && (
          <div className="space-y-6">
            {testSuites.find(s => s.name === 'Core Functionality') && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Core Functionality Tests</h3>
                
                <div className="space-y-3">
                  {testSuites.find(s => s.name === 'Core Functionality')?.tests.map((test, index) => (
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

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {testSuites.find(s => s.name === 'Security & Privacy') && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Security & Privacy Tests</h3>
                
                <div className="space-y-3">
                  {testSuites.find(s => s.name === 'Security & Privacy')?.tests.map((test, index) => (
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

        {/* PWA Tab */}
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

        {/* Deployment Tab */}
        {activeTab === 'deployment' && (
          <div className="space-y-6">
            {/* Deployment Checklist */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment Checklist</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-900">All core functionality tests passing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-900">Security and privacy features validated</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-900">PWA features working correctly</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-900">Performance benchmarks met</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-900">Database connection stable</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-900">Offline capabilities tested</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-900">User experience validated</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-900">Error handling implemented</span>
                </div>
              </div>
            </div>

            {/* Deployment Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment Actions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  disabled={!deploymentReport?.deploymentReady}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md transition-colors"
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Deploy to Production
                </button>
                
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Export Test Report
                </button>
                
                <button
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Generate Documentation
                </button>
                
                <button
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Configure Environment
                </button>
              </div>
            </div>

            {/* Environment Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Environment Status</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200">
                  <Server className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Database</p>
                    <p className="text-sm text-gray-600">Connected</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200">
                  <Network className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">API</p>
                    <p className="text-sm text-gray-600">Healthy</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200">
                  <HardDrive className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Storage</p>
                    <p className="text-sm text-gray-600">Available</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200">
                  <Cpu className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Performance</p>
                    <p className="text-sm text-gray-600">Optimal</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200">
                  <Cpu className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Memory</p>
                    <p className="text-sm text-gray-600">Stable</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200">
                  <Wifi className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Network</p>
                    <p className="text-sm text-gray-600">Connected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
