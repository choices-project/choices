'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
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
  Star
} from 'lucide-react'

interface FeedbackItem {
  id: number
  type: 'bug' | 'feature' | 'general'
  title: string
  description: string
  sentiment: 'positive' | 'negative' | 'neutral'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  updated_at: string
  user_journey?: any
}

const FeedbackDashboard: React.FC = () => {
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

  const fetchFeedback = useCallback(async () => {
    try {
      const response = await fetch('/api/feedback?limit=100')
      const data = await response.json()
      
      if (data.success) {
        setFeedback(data.feedback || [])
        calculateStats(data.feedback || [])
      }
    } catch (error) {
      console.error('Error fetching feedback:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

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
      case 'positive': return <Smile className="w-4 h-4 text-green-600" />
      case 'negative': return <Frown className="w-4 h-4 text-red-600" />
      default: return <Meh className="w-4 h-4 text-yellow-600" />
    }
  }

  const filteredFeedback = feedback.filter(item => {
    if (filter === 'all') return true
    if (filter === 'open') return item.status === 'open'
    if (filter === 'bugs') return item.type === 'bug'
    if (filter === 'features') return item.type === 'feature'
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading feedback...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Feedback Dashboard</h1>
          <p className="text-gray-600">Monitor and manage user feedback</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Feedback</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Issues</p>
                <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bug Reports</p>
                <p className="text-2xl font-bold text-gray-900">{stats.bugs}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Bug className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Feature Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.features}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Lightbulb className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'all', label: 'All Feedback', count: stats.total },
              { key: 'open', label: 'Open Issues', count: stats.open },
              { key: 'bugs', label: 'Bug Reports', count: stats.bugs },
              { key: 'features', label: 'Feature Requests', count: stats.features }
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterOption.label} ({filterOption.count})
              </button>
            ))}
          </div>
        </div>

        {/* Feedback List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Feedback ({filteredFeedback.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredFeedback.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No feedback found</p>
              </div>
            ) : (
              filteredFeedback.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                          {getTypeIcon(item.type)}
                          <span className="ml-1 capitalize">{item.type}</span>
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span className="ml-1 capitalize">{item.status.replace('_', ' ')}</span>
                        </span>
                        {getSentimentIcon(item.sentiment)}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {item.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Created: {new Date(item.created_at).toLocaleDateString()}</span>
                        {item.user_journey?.page && (
                          <span>Page: {item.user_journey.page}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeedbackDashboard
