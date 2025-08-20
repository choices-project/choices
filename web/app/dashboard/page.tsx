'use client'

import { useAuth } from '@/contexts/AuthContext'
import { devLog } from '@/lib/logger';
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, createContext, useContext } from 'react'
import { LogOut, User, Mail, Calendar, Shield, Edit, Vote, TrendingUp, BarChart3, Heart, Users, Activity } from 'lucide-react'

interface UserProfile {
  id: string
  user_id: string
  display_name: string
  bio: string | null
  primary_concerns: string[]
  community_focus: string[]
  participation_style: 'observer' | 'contributor' | 'leader'
  demographics: any
  privacy_settings: any
  created_at: string
  updated_at: string
  avatar?: string
}

interface DashboardStats {
  pollsCreated: number
  votesCast: number
  activePolls: number
  participationRate: number
  averageVotesPerPoll: number
}

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    pollsCreated: 0,
    votesCast: 0,
    activePolls: 0,
    participationRate: 0,
    averageVotesPerPoll: 0
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirectTo=/dashboard')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadUserProfile()
      loadDashboardStats()
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

  const loadDashboardStats = async () => {
    try {
      setIsLoadingStats(true)
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || {
          pollsCreated: 0,
          votesCast: 0,
          activePolls: 0,
          participationRate: 0,
          averageVotesPerPoll: 0
        })
      }
    } catch (error) {
      devLog('Error loading stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleEditProfile = () => {
    router.push('/profile/edit')
  }

  const getParticipationIcon = (style: string) => {
    switch (style) {
      case 'observer': return '👁️'
      case 'contributor': return '💡'
      case 'leader': return '🚀'
      default: return '👤'
    }
  }

  const getParticipationLabel = (style: string) => {
    switch (style) {
      case 'observer': return 'Observer'
      case 'contributor': return 'Contributor'
      case 'leader': return 'Leader'
      default: return 'Participant'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleEditProfile}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {profile?.avatar ? (
                    <img src={profile.avatar} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-blue-600" />
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {profile?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0]}
                </h2>
                <p className="text-gray-600">{user.email}</p>
                {profile?.bio && (
                  <p className="text-sm text-gray-500 mt-2">{profile.bio}</p>
                )}
              </div>

              {/* Participation Style */}
              {profile?.participation_style && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">{getParticipationIcon(profile.participation_style)}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{getParticipationLabel(profile.participation_style)}</p>
                      <p className="text-sm text-gray-600">Your participation style</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Member Since</p>
                    <p className="text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Status</p>
                    <p className="text-sm text-green-600">Verified</p>
                  </div>
                </div>
              </div>

              {/* Values & Interests */}
              {profile?.primary_concerns && profile.primary_concerns.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Heart className="w-5 h-5 text-red-500 mr-2" />
                    What matters to you
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.primary_concerns.slice(0, 3).map((concern: string) => (
                      <span
                        key={concern}
                        className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs"
                      >
                        {concern}
                      </span>
                    ))}
                    {profile.primary_concerns.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{profile.primary_concerns.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Community Focus */}
              {profile?.community_focus && profile.community_focus.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Users className="w-5 h-5 text-blue-500 mr-2" />
                    Community focus
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.community_focus.slice(0, 2).map((focus: string) => (
                      <span
                        key={focus}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                      >
                        {focus}
                      </span>
                    ))}
                    {profile.community_focus.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{profile.community_focus.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Dashboard Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Your Activity Overview
              </h3>
              
              {isLoadingStats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_: any, i: any) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Vote className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{stats.votesCast}</p>
                    <p className="text-sm text-gray-600">Votes Cast</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">{stats.pollsCreated}</p>
                    <p className="text-sm text-gray-600">Polls Created</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Activity className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{stats.activePolls}</p>
                    <p className="text-sm text-gray-600">Active Polls</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <BarChart3 className="w-6 h-6 text-orange-600" />
                    </div>
                    <p className="text-2xl font-bold text-orange-600">{stats.participationRate}%</p>
                    <p className="text-sm text-gray-600">Participation</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
              
              {stats.votesCast === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Vote className="w-8 h-8 text-gray-400" />
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
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Vote className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Voted on "Community Budget Priorities"</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Created poll "Local Park Improvements"</p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
