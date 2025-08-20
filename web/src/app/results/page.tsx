'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { devLog } from '@/lib/logger';
import { BarChart3, Shield, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { poApi, Poll, Tally, CommitmentLog } from '../../lib/api'

export default function ResultsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null)
  const [tally, setTally] = useState<Tally | null>(null)
  const [commitmentLog, setCommitmentLog] = useState<CommitmentLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchPolls()
  }, [])

  const fetchPolls = async () => {
    try {
      const data = await poApi.getPolls()
      setPolls(data)
    } catch (error) {
      devLog('Failed to fetch polls:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPollResults = async (poll: Poll) => {
    setSelectedPoll(poll)
    setRefreshing(true)

    try {
      const [tallyData, commitmentData] = await Promise.all([
        poApi.getTally(poll.id),
        poApi.getCommitmentLog(poll.id),
      ])

      setTally(tallyData)
      setCommitmentLog(commitmentData)
    } catch (error) {
      devLog('Failed to load poll results:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const getTotalVotes = (tally: Tally) => {
    return Object.values(tally).reduce((sum: any, count: any) => (sum as number) + (count as number), 0)
  }

  const getPercentage = (votes: number, total: number) => {
    if (total === 0) return 0
    return Math.round((votes / total) * 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Poll Results</h1>
            </div>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedPoll ? (
          <div className="max-w-4xl mx-auto">
            {/* Poll Header */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedPoll.title}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPoll.status)}`}>
                  {selectedPoll.status.toUpperCase()}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">{selectedPoll.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Start:</span> {new Date(selectedPoll.start_time).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">End:</span> {new Date(selectedPoll.end_time).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Options:</span> {selectedPoll.options.length}
                </div>
                <div>
                  <span className="font-medium">Total Votes:</span> {tally ? getTotalVotes(tally).toString() : 'Loading...'}
                </div>
              </div>

              <button
                onClick={() => setSelectedPoll(null)}
                className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to all polls
              </button>
            </div>

            {/* Results */}
            {tally && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Vote Results</h3>
                  <button
                    onClick={() => loadPollResults(selectedPoll)}
                    disabled={refreshing}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {selectedPoll.options.map((option, index: any) => {
                    const votes = (tally[index] as number) || 0
                    const total = getTotalVotes(tally)
                    const percentage = getPercentage(votes, total)
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{option}</span>
                          <span className="text-sm text-gray-600">
                            {votes} votes ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Audit Information */}
            {commitmentLog && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Shield className="w-5 h-5 text-green-600" />
                  <h3 className="text-xl font-semibold text-gray-900">Audit Information</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Merkle Commitment</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Root Hash:</span>
                        <div className="font-mono bg-gray-100 p-2 rounded text-xs break-all">
                          {commitmentLog.root}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Leaf Count:</span> {commitmentLog.leaf_count}
                      </div>
                      <div>
                        <span className="text-gray-600">Timestamp:</span> {commitmentLog.timestamp}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Verification</h4>
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm">All votes are cryptographically verified</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Each vote is committed to a Merkle tree, providing public auditability 
                      while maintaining voter privacy.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Poll Results</h2>
              <p className="text-gray-600">Select a poll to view detailed results and audit information.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {polls.map((poll: any) => (
                <div key={poll.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{poll.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(poll.status)}`}>
                      {poll.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{poll.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>{poll.options.length} options</span>
                    <span>{new Date(poll.created_at).toLocaleDateString()}</span>
                  </div>

                  <button
                    onClick={() => loadPollResults(poll)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                  >
                    View Results
                  </button>
                </div>
              ))}
            </div>

            {polls.length === 0 && (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No polls available</h3>
                <p className="text-gray-600">Check back later for poll results.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
