'use client'

import React, { useState, useEffect } from 'react'
import { devLog } from '@/lib/logger'
import { 
  MessageCircle, 
  Bug, 
  Lightbulb, 
  Heart, 
  Smile, 
  Frown, 
  Meh,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Star,
  RefreshCw
} from 'lucide-react'

interface FeedbackItem {
  id: string
  type: 'bug' | 'feature' | 'general'
  title: string
  description: string
  sentiment: 'positive' | 'negative' | 'neutral'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  updated_at: string
  user_journey?: any
  tags?: string[]
}

const FeedbackAdminPage: React.FC = () => {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    bugs: 0,
    features: 0,
    positive: 0,
    negative: 0
  })

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/feedback?limit=100')
      const data = await response.json()
      
      if (data.success) {
        setFeedback(data.feedback || [])
        calculateStats(data.feedback || [])
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

  const calculateStats = (data: FeedbackItem[]) => {
    setStats({
      total: data.length,
      open: data.filter(f => f.status === 'open').length,
      bugs: data.filter(f => f.type === 'bug').length,
      features: data.filter(f => f.type === 'feature').length,
      positive: data.filter(f => f.sentiment === 'positive').length,
      negative: data.filter(f => f.sentiment === 'negative').length
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="w-4 h-4" />
      case 'feature': return <Lightbulb className="w-4 h-4" />
      default: return <MessageCircle className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return 'bg-red-100 text-red-700'
      case 'feature': return 'bg-blue-100 text-blue-700'
      default: return 'bg-green-100 text-green-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="w-4 h-4" />
      case 'in_progress': return <AlertCircle className="w-4 h-4" />
      case 'resolved': return <CheckCircle className="w-4 h-4" />
      case 'closed': return <Eye className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-700'
      case 'in_progress': return 'bg-blue-100 text-blue-700'
      case 'resolved': return 'bg-green-100 text-green-700'
      case 'closed': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <Smile className="w-4 h-4" />
      case 'negative': return <Frown className="w-4 h-4" />
      case 'neutral': return <Meh className="w-4 h-4" />
      default: return <Meh className="w-4 h-4" />
    }
  }

  const filteredFeedback = feedback.filter(item => {
    if (filter === 'all') return true
    if (filter === 'open') return item.status === 'open'
    if (filter === 'bugs') return item.type === 'bug'
    if (filter === 'features') return item.type === 'feature'
    if (filter === 'positive') return item.sentiment === 'positive'
    if (filter === 'negative') return item.sentiment === 'negative'
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Feedback Management</h1>
              <p className="text-gray-600 mt-2">Review and manage user feedback submissions</p>
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Open</p>
                <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <Bug className="w-6 h-6 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Bugs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.bugs}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Features</p>
                <p className="text-2xl font-bold text-gray-900">{stats.features}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <Smile className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Positive</p>
                <p className="text-2xl font-bold text-gray-900">{stats.positive}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <Frown className="w-6 h-6 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Negative</p>
                <p className="text-2xl font-bold text-gray-900">{stats.negative}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All', icon: MessageCircle },
              { key: 'open', label: 'Open', icon: Clock },
              { key: 'bugs', label: 'Bugs', icon: Bug },
              { key: 'features', label: 'Features', icon: Lightbulb },
              { key: 'positive', label: 'Positive', icon: Smile },
              { key: 'negative', label: 'Negative', icon: Frown }
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
              {filteredFeedback.map((item) => (
                <div key={item.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                          {getTypeIcon(item.type)}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status.replace('_', ' ')}
                        </div>
                        <div className="flex items-center gap-1">
                          {getSentimentIcon(item.sentiment)}
                          <span className="text-sm text-gray-600">{item.sentiment}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3">{item.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
                        {item.user_journey?.page && (
                          <span>Page: {item.user_journey.page}</span>
                        )}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex gap-1">
                            {item.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                            {item.tags.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                +{item.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FeedbackAdminPage
