'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, Vote, Users, TrendingUp, Clock, Activity, 
  Target, Award, Eye, Calendar, MapPin, Star, Heart,
  ArrowUpRight, RefreshCw, CheckCircle, XCircle, Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface DashboardData {
  totalPolls: number
  activePolls: number
  totalVotes: number
  totalUsers: number
  participationRate: number
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
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
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
  }

  const generateMockData = (): DashboardData => ({
    totalPolls: 156,
    activePolls: 23,
    totalVotes: 2847,
    totalUsers: 1250,
    participationRate: 78.5,
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
          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Vote className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Polls</p>
                  <p className="text-2xl font-bold text-gray-900">{data?.totalPolls.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Polls</p>
                  <p className="text-2xl font-bold text-gray-900">{data?.activePolls}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Votes</p>
                  <p className="text-2xl font-bold text-gray-900">{data?.totalVotes.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Participation</p>
                  <p className="text-2xl font-bold text-gray-900">{data?.participationRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Vote Trends Chart */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Weekly Activity Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data?.voteTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="votes" 
                    stackId="1"
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stackId="1"
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Poll Distribution Chart */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Poll Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data?.pollDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data?.pollDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                {data?.pollDistribution.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity and Top Polls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                    </div>
                    {activity.value && (
                      <div className="text-sm font-semibold text-gray-900">
                        +{activity.value}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Polls */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-600" />
                Top Performing Polls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.topPolls.map((poll, index) => (
                  <div key={poll.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{poll.title}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-gray-500">{poll.votes} votes</span>
                        <span className="text-xs text-gray-500">{poll.participation}% participation</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(poll.status)}`}>
                      {poll.status}
                    </span>
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
