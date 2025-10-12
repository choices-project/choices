'use client'

import { ArrowLeft, BarChart3, Users, Target, Award, Eye, Vote, Filter, Download, RefreshCw, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUser } from '@/lib/stores'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/utils/logger'
import { withOptional } from '@/lib/utils/objects'

// UI Components

// Icons

// Utilities

interface PollAnalytics {
  pollid: string
  title: string
  totalvotes: number
  uniquevoters: number
  completionrate: number
  averagetimetocomplete: number
  engagementscore: number
  demographicbreakdown: {
    agegroups: Record<string, number>
    locations: Record<string, number>
    usertypes: Record<string, number>
  }
  votedistribution: Record<string, number>
  timeseriesdata: Array<{
    date: string
    votes: number
    uniquevoters: number
  }>
  topperformers: Array<{
    option: string
    votes: number
    percentage: number
  }>
  insights: string[]
  recommendations: string[]
}

interface AnalyticsFilters {
  timeRange: '7d' | '30d' | '90d' | 'all'
  pollType: 'all' | 'public' | 'private'
  status: 'all' | 'active' | 'closed'
}

export default function PollAnalyticsPage() {
  const router = useRouter()
  const user = useUser()
  
  const [analytics, setAnalytics] = useState<PollAnalytics[]>([])
  const [selectedPoll, setSelectedPoll] = useState<string>('')
  const [filters, setFilters] = useState<AnalyticsFilters>({
    timeRange: '30d',
    pollType: 'all',
    status: 'all'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAnalytics = useCallback(async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      const queryParams = new URLSearchParams({
        timeRange: filters.timeRange,
        pollType: filters.pollType,
        status: filters.status
      })

      const response = await fetch(`/api/polls/analytics?${queryParams}`)
      if (!response.ok) {
        throw new Error('Failed to load analytics data')
      }

      const data = await response.json()
      setAnalytics(data.analytics)
      
      if (data.analytics.length > 0 && !selectedPoll) {
        setSelectedPoll(data.analytics[0].pollid)
      }
    } catch (error) {
      logger.error('Error loading analytics', error instanceof Error ? error : new Error(String(error)))
      setError('Failed to load analytics data')
    } finally {
      setIsLoading(false)
    }
  }, [user, filters, selectedPoll])

  const refreshAnalytics = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await loadAnalytics()
    } catch (error) {
      logger.error('Error refreshing analytics', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setIsRefreshing(false)
    }
  }, [loadAnalytics])

  const exportAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/polls/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, selectedPoll })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `poll-analytics-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      logger.error('Error exporting analytics', error instanceof Error ? error : new Error(String(error)))
    }
  }, [filters, selectedPoll])

  const getEngagementColor = useCallback((score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }, [])

  const getEngagementLabel = useCallback((score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Poor'
  }, [])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const currentPoll = analytics.find(poll => poll.pollid === selectedPoll)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Poll Analytics</h1>
                <p className="text-gray-600">Detailed insights and performance metrics</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={exportAnalytics}
                variant="outline"
                className="flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button
                onClick={refreshAnalytics}
                disabled={isRefreshing}
                className="flex items-center"
              >
                {isRefreshing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Analytics Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Time Range</label>
                <select
                  value={filters.timeRange}
                  onChange={(e) => setFilters(prev => withOptional(prev, { timeRange: e.target.value as '7d' | '30d' | '90d' | 'all' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="all">All time</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Poll Type</label>
                <select
                  value={filters.pollType}
                  onChange={(e) => setFilters(prev => withOptional(prev, { pollType: e.target.value as 'all' | 'public' | 'private' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All polls</option>
                  <option value="public">Public polls</option>
                  <option value="private">Private polls</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => withOptional(prev, { status: e.target.value as 'all' | 'active' | 'closed' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {analytics.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
              <p className="text-gray-600 mb-4">No polls found matching your criteria.</p>
              <Button onClick={() => router.push('/polls/create')}>
                Create Your First Poll
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Poll Selection */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Select Poll</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.map((poll) => (
                      <button
                        key={poll.pollid}
                        onClick={() => setSelectedPoll(poll.pollid)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-colors",
                          selectedPoll === poll.pollid
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <h4 className="font-medium text-sm mb-1">{poll.title}</h4>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>{poll.totalvotes} votes</span>
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs", getEngagementColor(poll.engagementscore))}
                          >
                            {getEngagementLabel(poll.engagementscore)}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Content */}
            {currentPoll && (
              <div className="lg:col-span-3 space-y-6">
                {/* Overview Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Vote className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="text-2xl font-bold">{currentPoll.totalvotes}</p>
                          <p className="text-sm text-gray-600">Total Votes</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Users className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="text-2xl font-bold">{currentPoll.uniquevoters}</p>
                          <p className="text-sm text-gray-600">Unique Voters</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Target className="h-8 w-8 text-purple-600" />
                        <div>
                          <p className="text-2xl font-bold">{currentPoll.completionrate.toFixed(1)}%</p>
                          <p className="text-sm text-gray-600">Completion Rate</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Award className="h-8 w-8 text-orange-600" />
                        <div>
                          <p className="text-2xl font-bold">{currentPoll.engagementscore}</p>
                          <p className="text-sm text-gray-600">Engagement Score</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Vote Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Vote Distribution</CardTitle>
                    <CardDescription>How votes are distributed across options</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentPoll.topperformers.map((option, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{option.option}</span>
                            <span className="text-sm text-gray-600">
                              {option.votes} votes ({option.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${option.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Insights and Recommendations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Key Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {currentPoll.insights.map((insight, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                            <Eye className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-blue-900">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {currentPoll.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                            <Target className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-green-900">{recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
