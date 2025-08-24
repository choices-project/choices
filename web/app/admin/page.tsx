'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  Zap
} from 'lucide-react'

interface AdminStats {
  totalUsers: number
  totalPolls: number
  totalVotes: number
  activePolls: number
  adminUsers: number
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical'
}

export default function AdminDashboard() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirectTo=/admin')
      return
    }

    if (user) {
      loadAdminStats()
    }
  }, [user, isLoading, router])

  const loadAdminStats = async () => {
    try {
      setLoading(true)
      // Mock stats for now - replace with actual API call
      setStats({
        totalUsers: 1247,
        totalPolls: 89,
        totalVotes: 2985,
        activePolls: 12,
        adminUsers: 3,
        systemHealth: 'excellent'
      })
    } catch (error) {
      console.error('Error loading admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  if (isLoading || loading) {
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
