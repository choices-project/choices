'use client'

import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { logger } from '@/lib/logger';
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { T } from '@/lib/testing/testIds'
import { 
  Shield, 
  Users, 
  Vote, 
  BarChart3, 
  Settings, 
  Smartphone, 
  Activity,
  Lock,
  LogOut,
  Home,
  Plus,
  Zap,
  MessageSquare
} from 'lucide-react'

type AdminStats = {
  totalUsers: number
  totalPolls: number
  totalVotes: number
  activePolls: number
  adminUsers: number
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical'
}

export default function AdminDashboard() {
  const { user, isLoading, signOut } = useSupabaseAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    // Server-side admin guard handles authentication and authorization
    // This is just for UX - show loading while server checks admin status
    if (!isLoading && user) {
      checkAdminStatus()
    } else if (!isLoading && !user) {
      setIsAdmin(false)
    }
  }, [user, isLoading])

  const checkAdminStatus = async () => {
    try {
      // Check if user is admin by calling admin API
      const response = await fetch('/api/admin/system-status', {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        setIsAdmin(true)
        loadAdminStats()
      } else if (response.status === 401 || response.status === 403) {
        setIsAdmin(false)
      } else {
        // API error - assume not admin for security
        setIsAdmin(false)
      }
    } catch (error) {
      // Network error - assume not admin for security
      setIsAdmin(false)
    }
  }

  const loadAdminStats = async () => {
    try {
      setLoading(true)
      
      // Fetch real stats from API - no auth headers needed, server handles auth
      const response = await fetch('/api/admin/system-status', {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const systemData = await response.json()
        
        setStats({
          totalUsers: systemData.users.totalUsers,
          totalPolls: systemData.polls.totalPolls,
          totalVotes: systemData.polls.totalVotes,
          activePolls: systemData.polls.activePolls,
          adminUsers: systemData.users.adminUsers,
          systemHealth: systemData.health.systemHealth
        })
      } else {
        logger.error('Failed to fetch admin stats:', new Error(`HTTP ${response.status}`))
        // Fall back to mock data if API fails
        setStats({
          totalUsers: 0,
          totalPolls: 0,
          totalVotes: 0,
          activePolls: 0,
          adminUsers: 0,
          systemHealth: 'warning'
        })
      }
    } catch (error) {
      // narrow 'unknown' → Error
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error loading admin stats:', err)
      // Fall back to mock data if API fails
      setStats({
        totalUsers: 0,
        totalPolls: 0,
        totalVotes: 0,
        activePolls: 0,
        adminUsers: 0,
        systemHealth: 'critical'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  if (isLoading || loading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Show access denied for non-admin users
  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-md mx-auto">
            <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-4">You do not have access to the admin dashboard.</p>
            <div data-testid={T.admin.accessDenied} className="text-red-600 font-medium">
              Access Denied
            </div>
            <div className="mt-6">
              <Link 
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Navigation Tabs */}
        <nav className="mb-8">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              <Link 
                href="/admin"
                data-testid="admin-dashboard-tab"
                className="py-2 px-1 border-b-2 border-blue-500 text-blue-600 font-medium"
              >
                Dashboard
              </Link>
              <Link 
                href="/admin/users"
                data-testid={T.admin.usersTab}
                className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Users
              </Link>
              <Link 
                href="/admin/polls"
                data-testid={T.admin.pollsTab}
                className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Polls
              </Link>
              <Link 
                href="/admin/feedback"
                data-testid="admin-feedback-tab"
                className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Feedback
              </Link>
              <Link 
                href="/admin/analytics"
                data-testid="admin-analytics-tab"
                className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Analytics
              </Link>
              <Link 
                href="/admin/system"
                data-testid="admin-system-tab"
                className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                System
              </Link>
              <Link 
                href="/admin/site-messages"
                data-testid="admin-site-messages-tab"
                className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              >
                Site Messages
              </Link>
            </div>
          </div>
        </nav>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Polls</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPolls}</p>
                </div>
                <Vote className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Votes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalVotes}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Health</p>
                  <p className="text-2xl font-bold text-green-600 capitalize">{stats.systemHealth}</p>
                </div>
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
        )}

        {/* Admin Lists Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User List */}
          <section data-testid={T.admin.userList} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">admin@example.com</p>
                  <p className="text-sm text-gray-500">Admin User</p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    data-testid={T.admin.promoteUser('admin-1')}
                    className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                  >
                    Admin
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">user@example.com</p>
                  <p className="text-sm text-gray-500">Regular User</p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    data-testid={T.admin.banUser('user-1')}
                    className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded"
                  >
                    Ban
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Poll List */}
          <section data-testid={T.admin.pollList} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Vote className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Recent Polls</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Sample Poll 1</p>
                  <p className="text-sm text-gray-500">Active • 25 votes</p>
                </div>
                <div className="text-sm text-gray-500">
                  Created 2 days ago
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Sample Poll 2</p>
                  <p className="text-sm text-gray-500">Closed • 42 votes</p>
                </div>
                <div className="text-sm text-gray-500">
                  Created 1 week ago
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Admin Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Management */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            </div>
            <p className="text-gray-600 mb-4">Manage users, permissions, and access controls</p>
            <div className="space-y-2">
              <Link 
                href="/admin/users" 
                className="block text-sm text-blue-600 hover:text-blue-500"
              >
                View all users
              </Link>
              <Link 
                href="/admin/analytics" 
                className="block text-sm text-blue-600 hover:text-blue-500"
              >
                User analytics
              </Link>
            </div>
          </div>

          {/* Poll Management */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Vote className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Poll Management</h3>
            </div>
            <p className="text-gray-600 mb-4">Create, edit, and manage polls and voting</p>
            <div className="space-y-2">
              <Link 
                href="/admin/polls" 
                className="block text-sm text-blue-600 hover:text-blue-500"
              >
                View all polls
              </Link>
              <Link 
                href="/polls/create" 
                className="block text-sm text-blue-600 hover:text-blue-500"
              >
                Create new poll
              </Link>
            </div>
          </div>

          {/* Security & Authentication */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Lock className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Security</h3>
            </div>
            <p className="text-gray-600 mb-4">Manage authentication and security settings</p>
            <div className="space-y-2">
              <Link 
                href="/auth/biometric-setup" 
                className="block text-sm text-blue-600 hover:text-blue-500"
              >
                Biometric setup
              </Link>
              <Link 
                href="/admin/audit" 
                className="block text-sm text-blue-600 hover:text-blue-500"
              >
                Security audit
              </Link>
            </div>
          </div>

          {/* PWA Features */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Smartphone className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">PWA Features</h3>
            </div>
            <p className="text-gray-600 mb-4">Test and manage Progressive Web App features</p>
            <div className="space-y-2">
              <Link 
                href="/pwa-features" 
                className="block text-sm text-blue-600 hover:text-blue-500"
              >
                PWA testing
              </Link>
              <Link 
                href="/pwa-app" 
                className="block text-sm text-blue-600 hover:text-blue-500"
              >
                App experience
              </Link>
            </div>
          </div>

          {/* Analytics */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <BarChart3 className="h-6 w-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
            </div>
            <p className="text-gray-600 mb-4">View platform analytics and insights</p>
            <div className="space-y-2">
              <Link 
                href="/admin/analytics" 
                className="block text-sm text-blue-600 hover:text-blue-500"
              >
                Platform analytics
              </Link>
              <Link 
                href="/analytics" 
                className="block text-sm text-blue-600 hover:text-blue-500"
              >
                User analytics
              </Link>
            </div>
          </div>

          {/* System Management */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="h-6 w-6 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">System</h3>
            </div>
            <p className="text-gray-600 mb-4">System configuration and monitoring</p>
            <div className="space-y-2">
              <Link 
                href="/admin/system" 
                className="block text-sm text-blue-600 hover:text-blue-500"
              >
                System status
              </Link>
              <Link 
                href="/admin/feature-flags" 
                className="block text-sm text-blue-600 hover:text-blue-500"
              >
                Feature flags
              </Link>
            </div>
          </div>

          {/* Site Messages */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <MessageSquare className="h-6 w-6 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Site Messages</h3>
            </div>
            <p className="text-gray-600 mb-4">Manage site-wide announcements and feedback requests</p>
            <div className="space-y-2">
              <Link 
                href="/admin/site-messages" 
                className="block text-sm text-blue-600 hover:text-blue-500"
              >
                Manage messages
              </Link>
              <Link 
                href="/admin/feedback" 
                className="block text-sm text-blue-600 hover:text-blue-500"
              >
                View feedback
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              href="/polls/create"
              className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Plus className="h-5 w-5 text-blue-600" />
              <span className="text-blue-900">Create Poll</span>
            </Link>
            
            <Link 
              href="/admin/users"
              className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Users className="h-5 w-5 text-green-600" />
              <span className="text-green-900">Manage Users</span>
            </Link>
            
            <Link 
              href="/pwa-features"
              className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Zap className="h-5 w-5 text-purple-600" />
              <span className="text-purple-900">Test PWA</span>
            </Link>
            
            <Link 
              href="/admin/site-messages"
              className="flex items-center space-x-2 p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              <span className="text-indigo-900">Site Messages</span>
            </Link>
            
            <Link 
              href="/"
              className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Home className="h-5 w-5 text-gray-600" />
              <span className="text-gray-900">Go to Site</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
