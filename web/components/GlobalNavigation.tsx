'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Vote, 
  BarChart3, 
  Home, 
  User, 
  Settings, 
  Menu, 
  X, 
  Plus,
  Search,
  Bell,
  MessageSquare,
  TrendingUp,
  Shield,
  Smartphone,
  LogOut
} from 'lucide-react'

interface NavigationItem {
  label: string
  href: string
  icon: any
  description: string
  requiresAuth?: boolean
  adminOnly?: boolean
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Home',
    href: '/',
    icon: Home,
    description: 'Landing page and overview'
  },
  {
    label: 'Vote',
    href: '/polls',
    icon: Vote,
    description: 'Browse and participate in polls',
    requiresAuth: true
  },
  {
    label: 'Create Poll',
    href: '/polls/create',
    icon: Plus,
    description: 'Create a new poll',
    requiresAuth: true
  },
  {
    label: 'Results',
    href: '/polls/analytics',
    icon: BarChart3,
    description: 'View poll results and analytics',
    requiresAuth: true
  },
  {
    label: 'Trending',
    href: '/polls/trending',
    icon: TrendingUp,
    description: 'See what\'s popular',
    requiresAuth: true
  },
  {
    label: 'Profile',
    href: '/dashboard',
    icon: User,
    description: 'Your dashboard and settings',
    requiresAuth: true
  },
  {
    label: 'PWA Features',
    href: '/pwa-features',
    icon: Smartphone,
    description: 'Mobile app experience'
  },
  {
    label: 'Admin',
    href: '/admin',
    icon: Shield,
    description: 'Administrative tools',
    adminOnly: true
  }
]

export default function GlobalNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, signOut } = useAuth()

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsSearchOpen(false)
  }, [pathname])

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  // Filter navigation items based on auth and admin status
  const filteredItems = navigationItems.filter(item => {
    // Simple admin check - can be enhanced with proper role system
    const isAdmin = user?.email === 'admin@choices.com' || user?.email?.includes('admin')
    if (item.adminOnly && !isAdmin) return false
    if (item.requiresAuth && !user) return false
    return true
  })

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl">
                <Vote className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Choices</h1>
            </div>
            <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl">
                <Vote className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Choices</h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {filteredItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                             (item.href !== '/' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title={item.description}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {item.description}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
              
              {isSearchOpen && (
                <form onSubmit={handleSearch} className="absolute right-0 top-full mt-2 w-80">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search polls, topics..."
                        className="flex-1 border-none outline-none text-sm"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Search
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Notifications */}
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="space-y-2">
              {filteredItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || 
                               (item.href !== '/' && pathname.startsWith(item.href))
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <div>
                      <div>{item.label}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </Link>
                )
              })}
              
              {user && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors w-full"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

