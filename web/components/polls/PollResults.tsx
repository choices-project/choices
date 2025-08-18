'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, Share2, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface PollResultsProps {
  pollId: string
}

interface PollResult {
  option: string
  votes: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
}

interface PollData {
  id: string
  title: string
  description?: string
  votingMethod: string
  totalVotes: number
  participationRate: number
  isActive: boolean
  results: PollResult[]
  demographics?: {
    ageGroups: Record<string, number>
    locations: Record<string, number>
  }
}

export default function PollResults({ pollId }: PollResultsProps) {
  const [poll, setPoll] = useState<PollData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPollResults()
  }, [pollId])

  const loadPollResults = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      const mockResults: PollData = {
        id: pollId,
        title: 'Sample Poll Results',
        description: 'This is a sample poll with mock results',
        votingMethod: 'single',
        totalVotes: 1247,
        participationRate: 78,
        isActive: true,
        results: [
          { option: 'Option A', votes: 456, percentage: 36.6, trend: 'up' },
          { option: 'Option B', votes: 389, percentage: 31.2, trend: 'stable' },
          { option: 'Option C', votes: 234, percentage: 18.8, trend: 'down' },
          { option: 'Option D', votes: 168, percentage: 13.4, trend: 'up' }
        ],
        demographics: {
          ageGroups: {
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
          }
        }
      }
      
      setPoll(mockResults)
    } catch (error) {
      setError('Failed to load poll results')
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading results...</p>
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Failed to load results'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">Total Votes</p>
              <p className="text-2xl font-bold text-blue-900">
                {poll.totalVotes.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-600">Participation</p>
              <p className="text-2xl font-bold text-green-900">{poll.participationRate}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-600">Leading Option</p>
              <p className="text-lg font-bold text-purple-900">
                {poll.results[0]?.option}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Vote Distribution</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={poll.results}>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Detailed Results</h3>
        <div className="space-y-4">
          {poll.results.map((result, index) => (
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
                    <TrendingUp className={`h-4 w-4 ${
                      result.trend === 'down' ? 'transform rotate-180' : ''
                    }`} />
                    <span className="capitalize">{result.trend}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demographics (if available) */}
      {poll.demographics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Age Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Age Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(poll.demographics.ageGroups).map(([age, count]) => ({ name: age, value: count }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {Object.entries(poll.demographics.ageGroups).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Geographic Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(poll.demographics.locations).map(([location, count]) => ({ location, count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="location" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Share2 className="w-4 h-4" />
          <span>Share Results</span>
        </button>
        <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
          <Download className="w-4 h-4" />
          <span>Export Data</span>
        </button>
      </div>
    </div>
  )
}
