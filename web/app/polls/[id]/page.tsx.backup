'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  Vote, Users, Clock, Calendar, TrendingUp, BarChart3, 
  CheckCircle, XCircle, Eye, Target, Activity, Share2,
  ArrowLeft, Heart, MessageCircle, Flag, Star
} from 'lucide-react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

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

interface VoteResult {
  option: string
  votes: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
}

interface DemographicData {
  age_groups: Record<string, number>
  locations: Record<string, number>
  participation_trends: Array<{ date: string; votes: number }>
}

// Mock poll data that tells a compelling story
const mockPolls: Record<string, Poll> = {
  'climate-action': {
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
  'tech-priorities': {
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
  'education-reform': {
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
  }
}

export default function PollDetailPage() {
  const params = useParams()
  const router = useRouter()
  const pollId = params.id as string
  
  // Get poll data immediately from mock data
  const pollData = mockPolls[pollId] || mockPolls['climate-action']
  
  const [poll, setPoll] = useState<Poll | null>(pollData)
  const [voteResults, setVoteResults] = useState<VoteResult[]>([])
  const [demographics, setDemographics] = useState<DemographicData | null>(null)
  const [loading, setLoading] = useState(false)
  const [userVote, setUserVote] = useState<number | null>(null)
  const [voting, setVoting] = useState(false)
  const [activeTab, setActiveTab] = useState('results')

  const generateVoteResults = useCallback((pollData: Poll) => {
    const totalVotes = pollData.total_votes || 2500
    
    // Create results that tell a compelling story based on the poll topic
    let results: VoteResult[]
    
    if (pollData.id === 'climate-action') {
      results = [
        { option: 'Renewable Energy Investment', votes: 892, percentage: 31.3, trend: 'up' },
        { option: 'Carbon Tax Implementation', votes: 712, percentage: 25.0, trend: 'stable' },
        { option: 'Electric Vehicle Infrastructure', votes: 569, percentage: 20.0, trend: 'up' },
        { option: 'Green Building Standards', votes: 427, percentage: 15.0, trend: 'down' },
        { option: 'Public Transportation Expansion', votes: 247, percentage: 8.7, trend: 'stable' }
      ]
    } else if (pollData.id === 'tech-priorities') {
      results = [
        { option: 'Artificial Intelligence & Machine Learning', votes: 469, percentage: 30.0, trend: 'up' },
        { option: 'Quantum Computing', votes: 375, percentage: 24.0, trend: 'up' },
        { option: 'Renewable Energy Technology', votes: 313, percentage: 20.0, trend: 'stable' },
        { option: 'Biotechnology & Healthcare', votes: 281, percentage: 18.0, trend: 'up' },
        { option: 'Space Exploration Technology', votes: 125, percentage: 8.0, trend: 'down' }
      ]
    } else {
      results = [
        { option: 'Digital Learning Infrastructure', votes: 1026, percentage: 30.0, trend: 'up' },
        { option: 'Teacher Training & Support', votes: 855, percentage: 25.0, trend: 'stable' },
        { option: 'Mental Health Services', votes: 684, percentage: 20.0, trend: 'up' },
        { option: 'Career & Technical Education', votes: 513, percentage: 15.0, trend: 'down' },
        { option: 'Parental Involvement Programs', votes: 343, percentage: 10.0, trend: 'stable' }
      ]
    }
    
    setVoteResults(results)
  }, [])

  const generateDemographics = useCallback(() => {
    setDemographics({
      age_groups: {
        '18-24': 28,
        '25-34': 35,
        '35-44': 22,
        '45-54': 12,
        '55+': 3
      },
      locations: {
        'North America': 45,
        'Europe': 30,
        'Asia': 18,
        'Other': 7
      },
             participation_trends: Array.from({ length: 7 }, (_, i) => ({
         date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
         votes: Math.floor((pollData.id.charCodeAt(0) + i * 20) % 200) + 100
       }))
    })
  }, [pollData])

  useEffect(() => {
    if (pollData) {
      // Generate realistic vote results that tell a story
      generateVoteResults(pollData)
      
      // Generate demographic data
      generateDemographics()
    }
  }, [pollId, pollData, generateDemographics, generateVoteResults])

  const handleVote = async (choice: number) => {
    setVoting(true)
    try {
      // Simulate vote submission
      await new Promise(resolve => setTimeout(resolve, 1000))
      setUserVote(choice)
      
      // Update results
      const updatedResults = [...voteResults]
      updatedResults[choice].votes += 1
      const newTotal = updatedResults.reduce((sum, r) => sum + r.votes, 0)
      updatedResults.forEach(result => {
        result.percentage = Math.round((result.votes / newTotal) * 1000) / 10
      })
      setVoteResults(updatedResults)
      
    } catch (error) {
      console.error('Failed to submit vote:', error)
    } finally {
      setVoting(false)
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

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/polls" className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-64"></div>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Poll Not Found</h1>
            <p className="text-gray-600 mb-6">The poll you're looking for doesn't exist or has been removed.</p>
            <Link href="/polls">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                Back to Polls
              </button>
            </Link>
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
          <Link href="/polls" className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Poll Details</h1>
            <p className="text-gray-600 mt-1">See the full story behind this poll</p>
          </div>
        </div>

        {/* Poll Header */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(poll.status)} flex items-center gap-1`}>
                  {getStatusIcon(poll.status)}
                  {poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
                </span>
                                 <div className="flex items-center gap-2 text-gray-500">
                   <Eye className="h-4 w-4" />
                   <span className="text-sm">{Math.floor((poll.id.charCodeAt(0) + poll.id.length) * 100) + 1000} views</span>
                 </div>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{poll.title}</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">{poll.description}</p>
              
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created {new Date(poll.created_at || Date.now()).toLocaleDateString()}</span>
                </div>
                {poll.end_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Ends {new Date(poll.end_time).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{poll.total_votes?.toLocaleString()} participants</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <Share2 className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <Flag className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Sponsors */}
          {poll.sponsors && poll.sponsors.length > 0 && (
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Sponsored by:</h3>
              <div className="flex flex-wrap gap-2">
                {poll.sponsors.map((sponsor, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200">
                    {sponsor}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
          <div className="flex space-x-1">
            {[
              { id: 'results', label: 'Results', icon: BarChart3 },
              { id: 'demographics', label: 'Demographics', icon: Users },
              { id: 'trends', label: 'Trends', icon: TrendingUp },
              { id: 'vote', label: 'Vote', icon: Vote }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          {activeTab === 'results' && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Vote Results</h3>
              
              {/* Results Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 rounded-xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Vote className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Votes</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {voteResults.reduce((sum, r) => sum + r.votes, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Target className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-600">Participation</p>
                      <p className="text-2xl font-bold text-green-900">{poll.participation}%</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Activity className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-600">Leading Option</p>
                      <p className="text-lg font-bold text-purple-900">
                        {voteResults.sort((a, b) => b.votes - a.votes)[0]?.option.slice(0, 20)}...
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Chart */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Vote Distribution</h4>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={voteResults}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="option" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="votes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed Results */}
              <div className="space-y-4">
                {voteResults.map((result, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <h5 className="text-lg font-semibold text-gray-900">{result.option}</h5>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{result.votes.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">{result.percentage}%</p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${result.percentage}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                      <span>Votes cast</span>
                      <div className="flex items-center gap-2">
                        <span>Trend:</span>
                        <div className={`flex items-center gap-1 ${
                          result.trend === 'up' ? 'text-green-600' : 
                          result.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {result.trend === 'up' && <TrendingUp className="h-4 w-4" />}
                          {result.trend === 'down' && <TrendingUp className="h-4 w-4 transform rotate-180" />}
                          {result.trend === 'stable' && <div className="w-4 h-4 border-2 border-gray-400 rounded-full"></div>}
                          <span className="capitalize">{result.trend}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'demographics' && demographics && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Demographics</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Age Distribution */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Age Distribution</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(demographics.age_groups).map(([age, count]) => ({ name: age, value: count }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {Object.entries(demographics.age_groups).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Geographic Distribution */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(demographics.locations).map(([location, count]) => ({ location, count }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="location" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trends' && demographics && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Participation Trends</h3>
              
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Daily Vote Activity</h4>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={demographics.participation_trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Line type="monotone" dataKey="votes" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-xl p-6">
                  <h5 className="text-sm font-medium text-blue-600 mb-2">Peak Day</h5>
                  <p className="text-2xl font-bold text-blue-900">
                    {demographics.participation_trends.reduce((max, day) => 
                      day.votes > max.votes ? day : max
                    ).date}
                  </p>
                </div>
                
                <div className="bg-green-50 rounded-xl p-6">
                  <h5 className="text-sm font-medium text-green-600 mb-2">Average Daily Votes</h5>
                  <p className="text-2xl font-bold text-green-900">
                    {Math.round(demographics.participation_trends.reduce((sum, day) => sum + day.votes, 0) / demographics.participation_trends.length)}
                  </p>
                </div>
                
                <div className="bg-purple-50 rounded-xl p-6">
                  <h5 className="text-sm font-medium text-purple-600 mb-2">Total Week Votes</h5>
                  <p className="text-2xl font-bold text-purple-900">
                    {demographics.participation_trends.reduce((sum, day) => sum + day.votes, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vote' && poll.status === 'active' && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Cast Your Vote</h3>
              
              {userVote !== null ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Vote Submitted!</h4>
                  <p className="text-gray-600 mb-6">You voted for: <strong>{poll.options[userVote]}</strong></p>
                  <button 
                    onClick={() => setUserVote(null)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Change Vote
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {poll.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleVote(index)}
                      disabled={voting}
                      className="w-full border-2 border-gray-200 rounded-xl p-6 text-left hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">{String.fromCharCode(65 + index)}</span>
                          </div>
                          <span className="text-lg font-medium text-gray-900">{option}</span>
                        </div>
                        {voting && (
                          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        )}
                      </div>
                    </button>
                  ))}
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Vote className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h5 className="font-medium text-blue-900 mb-1">Your Vote is Private</h5>
                        <p className="text-sm text-blue-700">
                          Your vote is completely anonymous and cannot be traced back to you. 
                          The results show only aggregated data to protect your privacy.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vote' && poll.status !== 'active' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-gray-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Voting is {poll.status === 'closed' ? 'Closed' : 'Not Yet Open'}</h4>
              <p className="text-gray-600">
                {poll.status === 'closed' 
                  ? 'This poll has ended. You can view the results above.'
                  : 'This poll will open for voting soon. Check back later!'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
