'use client'

import { useState, useEffect } from 'react'
import { 
  Vote, Users, Clock, Calendar, TrendingUp, BarChart3, 
  CheckCircle, XCircle, Eye, Target, Activity, Share2,
  ArrowLeft, Search, Filter
} from 'lucide-react'
import Link from 'next/link'

interface Poll {
  id: string
  title: string
  description: string
  status: string
  options: string[]
  sponsors: string[]
  total_votes?: number
  participation?: number
  created_at?: string
  end_time?: string
}

// Mock poll data that matches the detail page
const mockPolls: Poll[] = [
  {
    id: 'climate-action',
    title: 'Climate Action Priorities 2024',
    description: 'Help us determine the most important climate action initiatives for the coming year. Your vote will influence policy decisions and funding allocations.',
    status: 'active',
    options: [
      'Renewable Energy Investment',
      'Carbon Tax Implementation', 
      'Electric Vehicle Infrastructure',
      'Green Building Standards',
      'Public Transportation Expansion'
    ],
    sponsors: ['Environmental Coalition', 'Green Future Initiative'],
    total_votes: 2847,
    participation: 78,
    created_at: '2024-12-01T00:00:00Z',
    end_time: '2024-12-31T23:59:59Z'
  },
  {
    id: 'tech-priorities',
    title: 'Technology Development Priorities',
    description: 'Which technology areas should receive the most research and development funding? Your input will guide innovation strategy.',
    status: 'active',
    options: [
      'Artificial Intelligence & Machine Learning',
      'Quantum Computing',
      'Renewable Energy Technology',
      'Biotechnology & Healthcare',
      'Space Exploration Technology'
    ],
    sponsors: ['Tech Innovation Council', 'Digital Society Foundation'],
    total_votes: 1563,
    participation: 65,
    created_at: '2024-12-05T00:00:00Z',
    end_time: '2024-12-25T23:59:59Z'
  },
  {
    id: 'education-reform',
    title: 'Education System Reform Priorities',
    description: 'What should be the top priorities for reforming our education system? Your voice matters in shaping the future of learning.',
    status: 'active',
    options: [
      'Digital Learning Infrastructure',
      'Teacher Training & Support',
      'Mental Health Services',
      'Career & Technical Education',
      'Parental Involvement Programs'
    ],
    sponsors: ['Education Foundation', 'Future of Learning Institute'],
    total_votes: 3421,
    participation: 82,
    created_at: '2024-12-03T00:00:00Z',
    end_time: '2024-12-28T23:59:59Z'
  },
  {
    id: 'healthcare-access',
    title: 'Healthcare Access Priorities',
    description: 'How should we prioritize healthcare access improvements? Your input will help shape healthcare policy and funding decisions.',
    status: 'active',
    options: [
      'Universal Healthcare Coverage',
      'Mental Health Services Expansion',
      'Rural Healthcare Infrastructure',
      'Preventive Care Programs',
      'Telemedicine Development'
    ],
    sponsors: ['Healthcare Foundation', 'Public Health Institute'],
    total_votes: 1987,
    participation: 71,
    created_at: '2024-12-07T00:00:00Z',
    end_time: '2024-12-30T23:59:59Z'
  },
  {
    id: 'urban-planning',
    title: 'Urban Planning & Development',
    description: 'What should be the focus of our urban development initiatives? Help us create better cities for everyone.',
    status: 'active',
    options: [
      'Affordable Housing Development',
      'Public Transportation Networks',
      'Green Spaces & Parks',
      'Smart City Technology',
      'Community Centers'
    ],
    sponsors: ['Urban Development Council', 'City Planning Institute'],
    total_votes: 1245,
    participation: 58,
    created_at: '2024-12-10T00:00:00Z',
    end_time: '2024-12-29T23:59:59Z'
  }
]

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>(mockPolls)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')

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

  const filteredPolls = polls.filter(poll => {
    const matchesSearch = poll.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         poll.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || poll.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedPolls = [...filteredPolls].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      case 'votes':
        return (b.total_votes || 0) - (a.total_votes || 0)
      case 'participation':
        return (b.participation || 0) - (a.participation || 0)
      default:
        return 0
    }
  })

  const totalPolls = polls.length
  const activePolls = polls.filter(p => p.status === 'active').length
  const totalVotes = polls.reduce((sum, p) => sum + (p.total_votes || 0), 0)
  const avgParticipation = Math.round(polls.reduce((sum, p) => sum + (p.participation || 0), 0) / polls.length)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/" className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-32"></div>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
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
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Polls</p>
                <p className="text-2xl font-bold text-gray-900">{totalPolls}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{activePolls}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Votes</p>
                <p className="text-2xl font-bold text-gray-900">{totalVotes.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Participation</p>
                <p className="text-2xl font-bold text-gray-900">{avgParticipation}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search polls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
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
              <option value="votes">Most Votes</option>
              <option value="participation">Highest Participation</option>
            </select>
          </div>
        </div>

        {/* Polls List */}
        {sortedPolls.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-100 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No polls found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedPolls.map((poll) => (
              <div key={poll.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(poll.status)} flex items-center gap-1`}>
                        {getStatusIcon(poll.status)}
                        {poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
                      </span>
                      <div className="flex items-center gap-2 text-gray-500">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm">{Math.floor(Math.random() * 1000) + 100} views</span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{poll.title}</h3>
                    <p className="text-gray-600 mb-4">{poll.description}</p>
                    
                    {/* Options Preview */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Options:</p>
                      <div className="space-y-1">
                        {poll.options.slice(0, 2).map((option, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{option}</span>
                            <span className="text-gray-500">
                              {Math.floor(Math.random() * 50) + 10}%
                            </span>
                          </div>
                        ))}
                        {poll.options.length > 2 && (
                          <p className="text-sm text-blue-600">+{poll.options.length - 2} more options</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Poll Stats */}
                    <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{poll.total_votes?.toLocaleString()} votes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <span>{poll.participation}% participation</span>
                      </div>
                    </div>
                    
                    {/* Sponsors */}
                    {poll.sponsors && poll.sponsors.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">Sponsored by: {poll.sponsors.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>
                
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
