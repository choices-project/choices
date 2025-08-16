'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  BarChart3, Vote, Users, TrendingUp, Clock, Activity, 
  Target, Award, Eye, Calendar, MapPin, Star, Heart,
  ArrowUpRight, RefreshCw, CheckCircle, XCircle, Zap,
  TrendingDown, ArrowUp, ArrowDown
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { FancyDonutChart, FancyBarChart, FancyProgressRing, FancyMetricCard } from '../../components/FancyCharts'

interface DashboardData {
  totalPolls: number
  activePolls: number
  totalVotes: number
  totalUsers: number
  participationRate: number
  voteGrowth: number
  userGrowth: number
  recentActivity: Array<{
    id: string
    type: string
    description: string
    timestamp: string
    value?: number
  }>
  voteTrends: Array<{
    date: string
    votes: number
    users: number
    polls: number
  }>
  pollDistribution: Array<{
    name: string
    value: number
    color: string
  }>
  topPolls: Array<{
    id: string
    title: string
    votes: number
    participation: number
    status: string
  }>
  categoryBreakdown: Array<{
    category: string
    votes: number
    percentage: number
    color: string
  }>
  userEngagement: Array<{
    metric: string
    value: number
    change: number
    trend: 'up' | 'down'
  }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const dashboardData = await response.json()
        setData(dashboardData)
      } else {
        // Fallback to mock data if API fails
        setData(generateMockData())
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setData(generateMockData())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const generateMockData = (): DashboardData => ({
    totalPolls: 156,
    activePolls: 23,
    totalVotes: 2847,
    totalUsers: 1250,
    participationRate: 78.5,
    voteGrowth: 12.5,
    userGrowth: 8.3,
    recentActivity: [
      { id: '1', type: 'vote', description: 'New vote cast in "Community Park Design"', timestamp: '2 minutes ago', value: 1 },
      { id: '2', type: 'poll', description: 'Poll "Local Library Hours" created', timestamp: '15 minutes ago' },
      { id: '3', type: 'user', description: 'New user registered', timestamp: '1 hour ago', value: 1 },
      { id: '4', type: 'vote', description: 'Vote cast in "School Budget Allocation"', timestamp: '2 hours ago', value: 1 },
      { id: '5', type: 'poll', description: 'Poll "Public Transportation Routes" ended', timestamp: '3 hours ago' }
    ],
    voteTrends: [
      { date: 'Mon', votes: 45, users: 32, polls: 8 },
      { date: 'Tue', votes: 67, users: 48, polls: 12 },
      { date: 'Wed', votes: 89, users: 65, polls: 15 },
      { date: 'Thu', votes: 123, users: 89, polls: 18 },
      { date: 'Fri', votes: 156, users: 112, polls: 22 },
      { date: 'Sat', votes: 134, users: 98, polls: 19 },
      { date: 'Sun', votes: 98, users: 76, polls: 14 }
    ],
    pollDistribution: [
      { name: 'Active', value: 23, color: '#10b981' },
      { name: 'Draft', value: 8, color: '#f59e0b' },
      { name: 'Closed', value: 125, color: '#6b7280' }
    ],
    topPolls: [
      { id: '1', title: 'Community Park Design', votes: 456, participation: 89, status: 'active' },
      { id: '2', title: 'Local Library Hours', votes: 342, participation: 76, status: 'active' },
      { id: '3', title: 'School Budget Allocation', votes: 298, participation: 82, status: 'active' },
      { id: '4', title: 'Public Transportation Routes', votes: 234, participation: 65, status: 'closed' },
      { id: '5', title: 'City Hall Renovation', votes: 189, participation: 71, status: 'active' }
    ],
    categoryBreakdown: [
      { category: 'Community Development', votes: 1250, percentage: 35, color: '#3b82f6' },
      { category: 'Education', votes: 890, percentage: 25, color: '#10b981' },
      { category: 'Transportation', votes: 712, percentage: 20, color: '#f59e0b' },
      { category: 'Environment', votes: 534, percentage: 15, color: '#8b5cf6' },
      { category: 'Public Safety', votes: 178, percentage: 5, color: '#ef4444' }
    ],
    userEngagement: [
      { metric: 'Daily Active Users', value: 342, change: 12.5, trend: 'up' },
      { metric: 'Votes per User', value: 2.3, change: -2.1, trend: 'down' },
      { metric: 'Poll Completion Rate', value: 78.5, change: 5.2, trend: 'up' },
      { metric: 'User Retention', value: 89.2, change: 3.8, trend: 'up' }
    ]
  })

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'vote': return <Vote className="h-4 w-4 text-green-600" />
      case 'poll': return <BarChart3 className="h-4 w-4 text-blue-600" />
      case 'user': return <Users className="h-4 w-4 text-purple-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200'
      case 'draft': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'closed': return 'bg-gray-100 text-gray-700 border-gray-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-6"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Real-time insights into your polling platform</p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <FancyMetricCard
            title="Total Polls"
            value={data?.totalPolls?.toLocaleString() || '0'}
            change={`+${data?.voteGrowth || 0}%`}
            trend="up"
            icon={<Vote className="h-6 w-6" />}
            color="#3b82f6"
          />
          
          <FancyMetricCard
            title="Active Polls"
            value={data?.activePolls || 0}
            change="Live"
            trend="up"
            icon={<CheckCircle className="h-6 w-6" />}
            color="#10b981"
          />
          
          <FancyMetricCard
            title="Total Votes"
            value={data?.totalVotes?.toLocaleString() || '0'}
            change={`+${data?.voteGrowth || 0}%`}
            trend="up"
            icon={<Users className="h-6 w-6" />}
            color="#8b5cf6"
          />
          
          <FancyMetricCard
            title="Participation"
            value={`${data?.participationRate || 0}%`}
            change="+5.2%"
            trend="up"
            icon={<Target className="h-6 w-6" />}
            color="#f59e0b"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Breakdown Chart */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Vote Distribution by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <FancyDonutChart
                  data={(data?.categoryBreakdown || []).map(cat => ({
                    name: cat.category,
                    value: cat.percentage,
                    color: cat.color
                  }))}
                  size={250}
                  strokeWidth={25}
                  title="Categories"
                />
              </div>
            </CardContent>
          </Card>

          {/* User Engagement Metrics */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                User Engagement Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {(data?.userEngagement || []).map((metric, index) => (
                  <div key={index} className="text-center">
                    <FancyProgressRing
                      percentage={metric.value}
                      size={100}
                      strokeWidth={8}
                      color={metric.trend === 'up' ? '#10b981' : '#ef4444'}
                      label={metric.metric}
                    />
                    <div className="mt-2 flex items-center justify-center gap-1">
                      {metric.trend === 'up' ? (
                        <ArrowUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-red-600" />
                      )}
                      <span className={`text-xs ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {metric.change > 0 ? '+' : ''}{metric.change}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Trends Chart */}
        <Card className="bg-white border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Weekly Activity Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
                          <div className="space-y-6">
                {(data?.voteTrends || []).map((day, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-gray-700">{day.date}</span>
                    <span className="font-bold text-gray-900">{day.votes} votes</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000" 
                      style={{ width: `${(day.votes / Math.max(...data.voteTrends.map(d => d.votes))) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{day.users} users</span>
                    <span>{day.polls} polls</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity and Top Polls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(data?.recentActivity || []).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Polls */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                Top Performing Polls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(data?.topPolls || []).map((poll) => (
                  <div key={poll.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 truncate">{poll.title}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(poll.status)}`}>
                        {poll.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{poll.votes} votes</span>
                      <span className="text-gray-600">{poll.participation}% participation</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${poll.participation}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
