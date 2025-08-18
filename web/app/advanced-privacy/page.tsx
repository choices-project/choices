'use client'

import { useState, useEffect, useCallback } from 'react'
import { devLog } from '@/lib/logger';
import { 
  Shield, 
  Lock, 
  Eye, 
  Brain, 
  BarChart3,
  Activity,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Gauge
} from 'lucide-react'
import { usePrivacyUtils } from '../../hooks/usePrivacyUtils'
import { usePWAUtils } from '../../hooks/usePWAUtils'

export default function AdvancedPrivacyPage() {
  const {  } = usePrivacyUtils()
  const {  } = usePWAUtils()
  const [activeTab, setActiveTab] = useState('overview')
  const [zkProofs, setZkProofs] = useState<any[]>([])
  const [privacyBudget, setPrivacyBudget] = useState<any>(null)
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)

  const initializePrivacyDashboard = useCallback(async () => {
    if (!privacyUtils || !pwaUtils) return
    
    // Get privacy budget status
    const budget = {
      demographics: privacyUtils.privacyBudgetManager.getRemainingBudget('demographics'),
      voting: privacyUtils.privacyBudgetManager.getRemainingBudget('voting'),
      trends: privacyUtils.privacyBudgetManager.getRemainingBudget('trends'),
      analytics: privacyUtils.privacyBudgetManager.getRemainingBudget('analytics')
    }
    setPrivacyBudget(budget)

    // Get ZK proofs
    const proofIds = privacyUtils.zkProofManager.listProofs()
    const proofs = proofIds.map(id => ({
      id,
      proof: privacyUtils.zkProofManager.getProof(id),
      verification: privacyUtils.zkProofManager.verifyProof(id)
    }))
    setZkProofs(proofs)
  }, [privacyUtils, pwaUtils])

  useEffect(() => {
    if (privacyUtils && pwaUtils && !privacyLoading && !pwaLoading) {
      initializePrivacyDashboard()
    }
  }, [privacyUtils, pwaUtils, privacyLoading, pwaLoading, initializePrivacyDashboard])



  const runPrivateAnalysis = async () => {
    setIsRunningAnalysis(true)
    
    try {
      // Mock data for demonstration
      const mockData = [
        { ageGroup: '18-25', education: 'Bachelor', income: '50k-100k', votes: 5 },
        { ageGroup: '26-35', education: 'Master', income: '100k-200k', votes: 8 },
        { ageGroup: '36-45', education: 'PhD', income: '>200k', votes: 12 },
        { ageGroup: '46-55', education: 'Bachelor', income: '50k-100k', votes: 6 },
        { ageGroup: '56+', education: 'High School', income: '<50k', votes: 3 }
      ]

      const mockVotes = [
        { category: 'Healthcare', timeSlot: 'morning', choice: 1 },
        { category: 'Education', timeSlot: 'afternoon', choice: 2 },
        { category: 'Environment', timeSlot: 'evening', choice: 1 },
        { category: 'Economy', timeSlot: 'night', choice: 3 }
      ]

      // Run private analytics
      const demographics = privacyUtils.privateAnalytics.privateDemographics(mockData)
      const votingPatterns = privacyUtils.privateAnalytics.privateVotingPatterns(mockVotes)
      const trends = privacyUtils.privateAnalytics.privateTrendAnalysis(mockData)

      setAnalysisResults({
        demographics: Array.from(demographics.entries()),
        votingPatterns: Array.from(votingPatterns.entries()),
        trends: Array.from(trends.entries())
      })

      // Track analytics
      pwaUtils.pwaAnalytics.trackFeatureUsage('private_analysis_run')
    } catch (error) {
      devLog('Private analysis failed:', error)
    } finally {
      setIsRunningAnalysis(false)
    }
  }

  const createZKProof = async (type: string, data: any) => {
    if (!privacyUtils) return
    
    try {
      const proofId = privacyUtils.zkProofManager.createProof(type, data)
      const proof = privacyUtils.zkProofManager.getProof(proofId)
      const verification = privacyUtils.zkProofManager.verifyProof(proofId)

      setZkProofs(prev => [...prev, { id: proofId, proof, verification }])
      
      // Track analytics
      pwaUtils.pwaAnalytics.trackFeatureUsage(`zk_proof_created_${type}`)
    } catch (error) {
      devLog('Failed to create ZK proof:', error)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'differential-privacy', label: 'Differential Privacy', icon: Shield },
    { id: 'zero-knowledge', label: 'Zero-Knowledge Proofs', icon: Eye },
    { id: 'privacy-budget', label: 'Privacy Budget', icon: Gauge },
    { id: 'analytics', label: 'Private Analytics', icon: BarChart3 },
    { id: 'security', label: 'Security', icon: Lock }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Advanced Privacy & Security</h1>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={runPrivateAnalysis}
                disabled={isRunningAnalysis}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md transition-colors"
              >
                {isRunningAnalysis ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
                <span className="ml-2">
                  {isRunningAnalysis ? 'Running Analysis...' : 'Run Private Analysis'}
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
            {/* Privacy Score */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <Shield className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Privacy Score</p>
                    <p className="text-2xl font-bold text-gray-900">98%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <Eye className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">ZK Proofs</p>
                    <p className="text-2xl font-bold text-gray-900">{zkProofs.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <Gauge className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Privacy Budget</p>
                    <p className="text-2xl font-bold text-gray-900">85%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <Brain className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Private Analytics</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analysisResults ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Features */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Features</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                  <div className="flex items-center space-x-3 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium text-gray-900">Differential Privacy</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Statistical analysis with mathematical privacy guarantees
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                  <div className="flex items-center space-x-3 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-gray-900">Zero-Knowledge Proofs</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Verification without revealing sensitive data
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-purple-200 bg-purple-50">
                  <div className="flex items-center space-x-3 mb-2">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    <h4 className="font-medium text-gray-900">Privacy Budget</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Controlled data usage with budget management
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-orange-200 bg-orange-50">
                  <div className="flex items-center space-x-3 mb-2">
                    <CheckCircle className="w-5 h-5 text-orange-600" />
                    <h4 className="font-medium text-gray-900">Private Analytics</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Insights without compromising individual privacy
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-indigo-200 bg-indigo-50">
                  <div className="flex items-center space-x-3 mb-2">
                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-medium text-gray-900">Encrypted Storage</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Local data encryption with user control
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-teal-200 bg-teal-50">
                  <div className="flex items-center space-x-3 mb-2">
                    <CheckCircle className="w-5 h-5 text-teal-600" />
                    <h4 className="font-medium text-gray-900">WebAuthn</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Device-based biometric authentication
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Differential Privacy Tab */}
        {activeTab === 'differential-privacy' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Differential Privacy Mechanisms</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Laplace Mechanism</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Adds Laplace noise to numerical queries for privacy protection
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Privacy Level:</span>
                      <span className="font-medium text-gray-900">High</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Accuracy:</span>
                      <span className="font-medium text-gray-900">Good</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Use Case:</span>
                      <span className="font-medium text-gray-900">Counts & Aggregates</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Gaussian Mechanism</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Adds Gaussian noise for better accuracy with privacy guarantees
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Privacy Level:</span>
                      <span className="font-medium text-gray-900">Medium</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Accuracy:</span>
                      <span className="font-medium text-gray-900">Excellent</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Use Case:</span>
                      <span className="font-medium text-gray-900">Means & Variances</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Exponential Mechanism</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Selects from discrete options based on utility scores
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Privacy Level:</span>
                      <span className="font-medium text-gray-900">High</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Accuracy:</span>
                      <span className="font-medium text-gray-900">Good</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Use Case:</span>
                      <span className="font-medium text-gray-900">Categorical Data</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Composition</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Combines multiple mechanisms while preserving privacy
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Privacy Level:</span>
                      <span className="font-medium text-gray-900">Adaptive</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Accuracy:</span>
                      <span className="font-medium text-gray-900">Variable</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Use Case:</span>
                      <span className="font-medium text-gray-900">Complex Queries</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Zero-Knowledge Proofs Tab */}
        {activeTab === 'zero-knowledge' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Zero-Knowledge Proofs</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Create New Proof</h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => createZKProof('age', { age: 25, threshold: 18 })}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      Age Verification Proof
                    </button>
                    <button
                      onClick={() => createZKProof('vote', { vote: 1, pollId: 'poll-123' })}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      Vote Verification Proof
                    </button>
                    <button
                      onClick={() => createZKProof('range', { value: 50000, min: 0, max: 100000 })}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      Range Proof
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Proof Types</h4>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border border-gray-200">
                      <h5 className="font-medium text-gray-900">Age Verification</h5>
                      <p className="text-sm text-gray-600">Prove age is above threshold without revealing exact age</p>
                    </div>
                    <div className="p-3 rounded-lg border border-gray-200">
                      <h5 className="font-medium text-gray-900">Vote Verification</h5>
                      <p className="text-sm text-gray-600">Prove vote was cast without revealing the choice</p>
                    </div>
                    <div className="p-3 rounded-lg border border-gray-200">
                      <h5 className="font-medium text-gray-900">Range Proof</h5>
                      <p className="text-sm text-gray-600">Prove value is within range without revealing the value</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Existing Proofs */}
              {zkProofs.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Existing Proofs</h4>
                  <div className="space-y-3">
                    {zkProofs.map((proofData, index) => (
                      <div key={proofData.id} className="p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">Proof #{index + 1}</h5>
                          <div className="flex items-center space-x-2">
                            {proofData.verification?.isValid ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-sm text-gray-600">
                              {proofData.verification?.isValid ? 'Valid' : 'Invalid'}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Confidence:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {Math.round((proofData.verification?.confidence || 0) * 100)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Created:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {new Date(proofData.proof?.timestamp || 0).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Privacy Budget Tab */}
        {activeTab === 'privacy-budget' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Budget Management</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Demographics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Remaining:</span>
                      <span className="font-medium text-gray-900">{privacyBudget?.demographics?.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(privacyBudget?.demographics || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Voting</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Remaining:</span>
                      <span className="font-medium text-gray-900">{privacyBudget?.voting?.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(privacyBudget?.voting || 0) * 50}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Trends</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Remaining:</span>
                      <span className="font-medium text-gray-900">{privacyBudget?.trends?.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(privacyBudget?.trends || 0) * 66.7}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Analytics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Remaining:</span>
                      <span className="font-medium text-gray-900">{privacyBudget?.analytics?.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(privacyBudget?.analytics || 0) * 33.3}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex space-x-2">
                <button
                  onClick={() => privacyUtils?.privacyBudgetManager.resetAllBudgets()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Reset All Budgets
                </button>
                <button
                  onClick={initializePrivacyDashboard}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Private Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {analysisResults ? (
              <div className="space-y-6">
                {/* Demographics */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Private Demographics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analysisResults.demographics.map(([key, result]: [string, any]) => (
                      <div key={key} className="p-4 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">{key.replace('_', ' ')}</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Value:</span>
                            <span className="font-medium text-gray-900">{Math.round(result.value)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Noise:</span>
                            <span className="font-medium text-gray-900">{Math.round(result.noise)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Confidence:</span>
                            <span className="font-medium text-gray-900">{Math.round(result.confidence * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Voting Patterns */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Private Voting Patterns</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analysisResults.votingPatterns.map(([key, result]: [string, any]) => (
                      <div key={key} className="p-4 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">{key.replace('_', ' ')}</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Value:</span>
                            <span className="font-medium text-gray-900">{Math.round(result.value)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Noise:</span>
                            <span className="font-medium text-gray-900">{Math.round(result.noise)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Confidence:</span>
                            <span className="font-medium text-gray-900">{Math.round(result.confidence * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trends */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Private Trend Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {analysisResults.trends.map(([key, result]: [string, any]) => (
                      <div key={key} className="p-4 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">{key.replace('_', ' ')}</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Value:</span>
                            <span className="font-medium text-gray-900">{result.value.toFixed(3)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Noise:</span>
                            <span className="font-medium text-gray-900">{result.noise.toFixed(3)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Confidence:</span>
                            <span className="font-medium text-gray-900">{Math.round(result.confidence * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Results</h3>
                <p className="text-gray-600 mb-4">Run private analysis to see privacy-preserving insights</p>
                <button
                  onClick={runPrivateAnalysis}
                  disabled={isRunningAnalysis}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md transition-colors"
                >
                  {isRunningAnalysis ? 'Running...' : 'Run Analysis'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Features</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Cryptographic Security</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">AES-256 Encryption</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">SHA-256 Hashing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Elliptic Curve Cryptography</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Zero-Knowledge Proofs</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Privacy Protection</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Differential Privacy</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Data Minimization</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Local Processing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">User Control</span>
                    </div>
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
