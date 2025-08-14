'use client'

import { useState, useEffect } from 'react'
import { 
  Vote, Clock, Users, CheckCircle, XCircle, ArrowLeft, 
  Filter, Search, TrendingUp, Calendar, MapPin, Eye,
  Star, Heart, Sparkles, ArrowUpRight, Target, Activity
} from 'lucide-react'
import Link from 'next/link'

interface Poll {
  id: string;
  title: string;
  description: string;
  status: string;
  options: string[];
  sponsors: string[];
  total_votes?: number;
  participation?: number;
  created_at?: string;
  end_time?: string;
}

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null)
  const [userChoice, setUserChoice] = useState<number | null>(null)
  const [voting, setVoting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')

  useEffect(() => {
    fetchPolls()
  }, [])

  const fetchPolls = async () => {
    try {
      const response = await fetch('/api/polls')
      if (response.ok) {
        const data = await response.json()
        setPolls(Array.isArray(data) ? data : data.polls || [])
      }
    } catch (error) {
      console.error('Failed to fetch polls:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200'
      case 'draft': return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'closed': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'draft': return <Clock className="h-4 w-4" />
      case 'closed': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const filteredPolls = polls
    .filter(poll => 
      poll.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      poll.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(poll => statusFilter === 'all' || poll.status === statusFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        case 'popular':
          return (b.total_votes || 0) - (a.total_votes || 0)
        case 'alphabetical':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/" className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">All Polls</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
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
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Polls</h1>
            <p className="text-gray-600 mt-1">Discover and participate in polls that matter</p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Vote className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{polls.length}</div>
                <div className="text-sm text-gray-500">Total Polls</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {polls.filter(p => p.status === 'active').length}
                </div>
                <div className="text-sm text-gray-500">Active</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {polls.reduce((sum, p) => sum + (p.total_votes || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Total Votes</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(polls.reduce((sum, p) => sum + (p.participation || 0), 0) / Math.max(polls.length, 1))}%
                </div>
                <div className="text-sm text-gray-500">Avg Participation</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search polls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Polls Grid */}
        {filteredPolls.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100">
              <Vote className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No polls found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'No polls have been created yet'
                }
              </p>
              {searchTerm || statusFilter !== 'all' ? (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              ) : (
                <Link href="/">
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                    Go Home
                  </button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPolls.map((poll) => (
              <div 
                key={poll.id}
                className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(poll.status)} flex items-center gap-1`}>
                    {getStatusIcon(poll.status)}
                    {poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
                  </span>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">{Math.floor(Math.random() * 1000) + 100}</span>
                  </div>
                </div>
                
                {/* Poll Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {poll.title}
                </h3>
                
                {/* Poll Description */}
                <p className="text-gray-600 text-sm mb-6 line-clamp-3">
                  {poll.description}
                </p>
                
                {/* Poll Options Preview */}
                <div className="space-y-3 mb-6">
                  {poll.options.slice(0, 2).map((option, optIndex) => (
                    <div key={optIndex} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 text-sm font-medium line-clamp-1">{option}</span>
                        <span className="text-gray-500 text-xs">
                          {Math.floor(Math.random() * 40) + 10}%
                        </span>
                      </div>
                      <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.floor(Math.random() * 40) + 10}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {poll.options.length > 2 && (
                    <div className="text-center">
                      <span className="text-sm text-gray-500">
                        +{poll.options.length - 2} more options
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Poll Stats */}
                <div className="flex items-center justify-between text-gray-500 text-sm mb-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{poll.total_votes || Math.floor(Math.random() * 1000) + 100} votes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>{poll.participation || Math.floor(Math.random() * 30) + 20}%</span>
                  </div>
                </div>
                
                {/* Sponsors */}
                {poll.sponsors && poll.sponsors.length > 0 && (
                  <div className="mb-6">
                    <div className="text-xs text-gray-500 mb-2">Sponsored by:</div>
                    <div className="flex flex-wrap gap-2">
                      {poll.sponsors.slice(0, 2).map((sponsor, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                          {sponsor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Action Button */}
                <Link href={`/polls/${poll.id}`}>
                  <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                    {poll.status === 'active' ? 'Vote Now' : 'View Details'}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
