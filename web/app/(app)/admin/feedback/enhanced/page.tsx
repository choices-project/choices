'use client'

import { 
  MessageCircle, 
  Bug, 
  Lightbulb, 
  Zap,
  Shield,
  Accessibility,
  AlertTriangle,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Smartphone,
  Monitor,
  Tablet,
  Chrome,
  Globe,
  Apple,
  Activity,
  X
} from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { devLog } from '@/lib/utils/logger'

interface FeedbackItem {
  id: string
  type: 'bug' | 'feature' | 'general' | 'performance' | 'accessibility' | 'security'
  title: string
  description: string
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
  status: 'open' | 'inprogress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdat: string
  updatedat: string
  userJourney: any
  metadata: any
  aiAnalysis: any
  deviceType?: string
  browser?: string
  os?: string
  pageLoadTime?: number
  timeOnPage?: number
  errorCount?: number
  sessionId?: string
  tags?: string[]
}

interface Analytics {
  total: number
  byType: Record<string, number>
  bySentiment: Record<string, number>
  byDevice: Record<string, number>
  byBrowser: Record<string, number>
  byOS: Record<string, number>
  performance: {
    avgPageLoadTime: number
    avgTimeOnPage: number
    totalErrors: number
  }
  topPages: Record<string, number>
  topIssues: Record<string, number>
}

const EnhancedFeedbackAdminPage: React.FC = () => {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/feedback?limit=100')
      const data = await response.json()
      
      if (data.success) {
        setFeedback(data.feedback || [])
        setAnalytics(data.analytics || null)
      } else {
        devLog('Error fetching feedback:', data.error)
      }
    } catch (error) {
      devLog('Error fetching feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedback()
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="w-4 h-4" />
      case 'feature': return <Lightbulb className="w-4 h-4" />
      case 'performance': return <Zap className="w-4 h-4" />
      case 'accessibility': return <Accessibility className="w-4 h-4" />
      case 'security': return <Shield className="w-4 h-4" />
      default: return <MessageCircle className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return 'bg-red-100 text-red-700'
      case 'feature': return 'bg-blue-100 text-blue-700'
      case 'performance': return 'bg-yellow-100 text-yellow-700'
      case 'accessibility': return 'bg-purple-100 text-purple-700'
      case 'security': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="w-4 h-4" />
      case 'tablet': return <Tablet className="w-4 h-4" />
      case 'desktop': return <Monitor className="w-4 h-4" />
      default: return <Globe className="w-4 h-4" />
    }
  }

  const getBrowserIcon = (browser: string) => {
    switch (browser.toLowerCase()) {
      case 'chrome': return <Chrome className="w-4 h-4" />
      default: return <Globe className="w-4 h-4" />
    }
  }

  const getOSIcon = (os: string) => {
    switch (os.toLowerCase()) {
      case 'macos': return <Apple className="w-4 h-4" />
      default: return <Globe className="w-4 h-4" />
    }
  }

  const filteredFeedback = feedback.filter(item => {
    if (filter === 'all') return true
    if (filter === 'open') return item.status === 'open'
    if (filter === 'bugs') return item.type === 'bug'
    if (filter === 'features') return item.type === 'feature'
    if (filter === 'performance') return item.type === 'performance'
    if (filter === 'positive') return item.sentiment === 'positive'
    if (filter === 'negative') return item.sentiment === 'negative'
    return true
  })

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enhanced Feedback Analytics</h1>
              <p className="text-gray-600 mt-2">Comprehensive feedback analysis with user journey tracking</p>
            </div>
            <button
              onClick={fetchFeedback}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Feedback</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.total}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Page Load</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatDuration(analytics.performance.avgPageLoadTime)}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Errors</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.performance.totalErrors}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Time on Page</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatDuration(analytics.performance.avgTimeOnPage)}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        )}

        {/* Detailed Analytics */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Device Distribution */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Distribution</h3>
              <div className="space-y-3">
                {Object.entries(analytics.byDevice).map(([device, count]) => (
                  <div key={device} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(device)}
                      <span className="text-sm text-gray-700 capitalize">{device}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Browser Distribution */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Browser Distribution</h3>
              <div className="space-y-3">
                {Object.entries(analytics.byBrowser).map(([browser, count]) => (
                  <div key={browser} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getBrowserIcon(browser)}
                      <span className="text-sm text-gray-700">{browser}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Issues */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Issues</h3>
              <div className="space-y-3">
                {Object.entries(analytics.topIssues)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([issue, count]) => (
                    <div key={issue} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{issue}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All', icon: MessageCircle },
              { key: 'open', label: 'Open', icon: Clock },
              { key: 'bugs', label: 'Bugs', icon: Bug },
              { key: 'features', label: 'Features', icon: Lightbulb },
              { key: 'performance', label: 'Performance', icon: Zap },
              { key: 'positive', label: 'Positive', icon: CheckCircle },
              { key: 'negative', label: 'Negative', icon: AlertTriangle }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading feedback...</p>
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback found</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'No feedback has been submitted yet.' 
                  : `No ${filter} feedback found.`
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredFeedback.map((item: any) => (
                <div key={item.id} className="p-6 hover:bg-gray-50 cursor-pointer" onClick={() => {
                  setSelectedFeedback(item)
                  setShowDetails(true)
                }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                          {getTypeIcon(item.type)}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                            item.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {item.priority}
                          </span>
                          <span className="text-sm text-gray-500">{item.sentiment}</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{item.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Created: {new Date(item.createdat).toLocaleDateString()}</span>
                        {item.deviceType && (
                          <div className="flex items-center gap-1">
                            {getDeviceIcon(item.deviceType)}
                            <span>{item.deviceType}</span>
                          </div>
                        )}
                        {item.browser && (
                          <div className="flex items-center gap-1">
                            {getBrowserIcon(item.browser)}
                            <span>{item.browser}</span>
                          </div>
                        )}
                        {item.os && (
                          <div className="flex items-center gap-1">
                            {getOSIcon(item.os)}
                            <span>{item.os}</span>
                          </div>
                        )}
                        {item.pageLoadTime && (
                          <span>Load: {formatDuration(item.pageLoadTime)}</span>
                        )}
                        {item.errorCount && item.errorCount > 0 && (
                          <span className="text-red-600">{item.errorCount} errors</span>
                        )}
                      </div>
                      
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {item.tags.slice(0, 5).map((tag: any, index: any) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 5 && (
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                              +{item.tags.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feedback Details Modal */}
      {showDetails && selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Feedback Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Title</label>
                      <p className="text-gray-900">{selectedFeedback.title}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <p className="text-gray-900">{selectedFeedback.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Type</label>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`p-1 rounded ${getTypeColor(selectedFeedback.type)}`}>
                            {getTypeIcon(selectedFeedback.type)}
                          </div>
                          <span className="text-gray-900 capitalize">{selectedFeedback.type}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Sentiment</label>
                        <p className="text-gray-900 capitalize">{selectedFeedback.sentiment}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Journey */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">User Journey</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Current Page</label>
                      <p className="text-gray-900">{selectedFeedback.userJourney?.currentPage}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Session ID</label>
                      <p className="text-gray-900 font-mono text-sm">{selectedFeedback.sessionId}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Device</label>
                        <div className="flex items-center gap-2 mt-1">
                          {getDeviceIcon(selectedFeedback.deviceType || 'unknown')}
                          <span className="text-gray-900 capitalize">{selectedFeedback.deviceType}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Browser</label>
                        <div className="flex items-center gap-2 mt-1">
                          {getBrowserIcon(selectedFeedback.browser || 'unknown')}
                          <span className="text-gray-900">{selectedFeedback.browser}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Performance</label>
                      <div className="grid grid-cols-2 gap-4 mt-1">
                        <span className="text-sm text-gray-600">Load: {formatDuration(selectedFeedback.pageLoadTime || 0)}</span>
                        <span className="text-sm text-gray-600">Time: {formatDuration(selectedFeedback.timeOnPage || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {selectedFeedback.tags && selectedFeedback.tags.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedFeedback.tags.map((tag: any, index: any) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Data */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Raw Data</h3>
                <details className="bg-gray-50 rounded-lg p-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">View JSON</summary>
                  <pre className="mt-2 text-xs text-gray-600 overflow-x-auto">
                    {JSON.stringify(selectedFeedback, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedFeedbackAdminPage
