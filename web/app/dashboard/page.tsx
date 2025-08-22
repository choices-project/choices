'use client'

import { useAuth } from '@/hooks/useAuth'
import { devLog } from '@/lib/logger'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LogOut, User, Vote, TrendingUp, BarChart3, Users, Activity, Clock, Globe, Target } from 'lucide-react'

interface UserProfile {
  id: string
  userid: string
  displayname: string
  bio: string | null
  primaryconcerns: string[]
  communityfocus: string[]
  participationstyle: 'observer' | 'contributor' | 'leader'
  demographics: any
  privacysettings: any
  createdat: string
  updatedat: string
  avatar?: string
}

interface DashboardStats {
  pollsCreated: number
  votesCast: number
  activePolls: number
  participationRate: number
  averageVotesPerPoll: number
}

interface PlatformStats {
  totalPolls: number
  totalVotes: number
  totalUsers: number
  activePolls: number
  averageParticipation: number
}

interface RecentActivity {
  id: string
  type: 'vote' | 'poll'
  title: string
  timestamp: string
  icon: string
}

interface ActivePoll {
  id: string
  title: string
  description: string
  status: string
  createdat: string
  endsat: string
  totalvotes: number
}

interface DashboardData {
  user: {
    id: string
    email: string
    name: string
  }
  stats: DashboardStats
  platform: PlatformStats
  recentActivity: RecentActivity[]
  polls: ActivePoll[]
}

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)

  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirectTo=/dashboard')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      loadUserProfile()
      loadDashboardData()
    }
  }, [user])

  const loadUserProfile = async () => {
    try {
      setIsLoadingProfile(true)
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
      }
    } catch (error) {
      devLog('Error loading profile:', error)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const loadDashboardData = async () => {
    try {
      setIsLoadingStats(true)
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      }
    } catch (error) {
      devLog('Error loading dashboard data:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const handleSignOut = async () => {
    await logout()
    router.push('/')
  }

  if (isLoading || isLoadingProfile || isLoadingStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const stats = dashboardData?.stats || {
    pollsCreated: 0,
    votesCast: 0,
    activePolls: 0,
    participationRate: 0,
    averageVotesPerPoll: 0
  }

  const platformStats = dashboardData?.platform || {
    totalPolls: 0,
    totalVotes: 0,
    totalUsers: 0,
    activePolls: 0,
    averageParticipation: 0
  }

  const recentActivity = dashboardData?.recentActivity || []
  const activePolls = dashboardData?.polls || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {profile?.displayname || user.email?.split('@')[0]}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/profile')}
                className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                <User className="h-5 w-5 mr-2" />
                Profile
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Platform Overview */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Polls</p>
                  <p className="text-2xl font-bold text-gray-900">{platformStats.totalPolls.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Vote className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Votes</p>
                  <p className="text-2xl font-bold text-gray-900">{platformStats.totalVotes.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{platformStats.totalUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Participation</p>
                  <p className="text-2xl font-bold text-gray-900">{platformStats.averageParticipation}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Your Activity */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Activity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Polls Created</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.pollsCreated}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Vote className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Votes Cast</p>
                  <p className="text-2xl font-bold text-green-600">{stats.votesCast}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Polls</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.activePolls}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Participation Rate</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.participationRate}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h4>
                <p className="text-gray-600 mb-4">Start participating in polls to see your activity here</p>
                <button 
                  onClick={() => router.push('/polls')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse Polls
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {activity.type === 'vote' ? (
                        <Vote className="w-4 h-4 text-blue-600" />
                      ) : (
                        <BarChart3 className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Polls */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Active Polls</h3>
              <Globe className="h-5 w-5 text-gray-400" />
            </div>
            
            {activePolls.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No active polls</h4>
                <p className="text-gray-600 mb-4">Be the first to create a poll!</p>
                <button 
                  onClick={() => router.push('/polls/create')}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Poll
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activePolls.slice(0, 3).map((poll) => (
                  <div key={poll.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{poll.title}</h4>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {poll.totalvotes} votes
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{poll.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Ends: {new Date(poll.endsat).toLocaleDateString()}
                      </p>
                      <button 
                        onClick={() => router.push(`/polls/${poll.id}`)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Vote Now →
                      </button>
                    </div>
                  </div>
                ))}
                {activePolls.length > 3 && (
                  <button 
                    onClick={() => router.push('/polls')}
                    className="w-full text-center py-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all {activePolls.length} active polls →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => router.push('/polls')}
              className="p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Vote className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">View Active Polls</h4>
                  <p className="text-sm text-blue-700">Participate in ongoing decisions</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => router.push('/polls/create')}
              className="p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-900">Create Poll</h4>
                  <p className="text-sm text-green-700">Start a new community poll</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => router.push('/history')}
              className="p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-purple-900">Voting History</h4>
                  <p className="text-sm text-purple-700">Review your past activity</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => router.push('/analytics')}
              className="p-4 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-orange-900">Analytics</h4>
                  <p className="text-sm text-orange-700">Explore trends and insights</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
