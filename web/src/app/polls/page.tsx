'use client'

import { useState, useEffect } from 'react'
import { devLog } from '@/lib/logger';
import { Vote, Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { iaApi, poApi, Poll, Vote as VoteType } from '../../lib/api'

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null)
  const [userChoice, setUserChoice] = useState<number | null>(null)
  const [voting, setVoting] = useState(false)
  const [userStableId, setUserStableId] = useState('user123') // In real app, get from auth

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

  const getToken = async (pollId: string) => {
    try {
      const data = await iaApi.getToken(userStableId, pollId, 'T1')
      return data
    } catch (error) {
      devLog('Failed to get token:', error)
    }
    return null
  }

  const submitVote = async (pollId: string, choice: number) => {
    setVoting(true)
    try {
      // Get token first
      const tokenData = await getToken(pollId)
      if (!tokenData) {
        throw new Error('Failed to get token')
      }

      // Submit vote
      const voteData = await poApi.submitVote(pollId, tokenData.token, tokenData.tag, choice)
      alert('Vote submitted successfully!')
      setSelectedPoll(null)
      setUserChoice(null)
      fetchPolls() // Refresh polls
    } catch (error) {
      devLog('Failed to submit vote:', error)
      alert('Failed to submit vote. Please try again.')
    } finally {
      setVoting(false)
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />
      case 'closed':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
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
                <Vote className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Available Polls</h1>
            </div>
            <div className="text-sm text-gray-600">
              Logged in as: <span className="font-mono">{userStableId}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedPoll ? (
          <div className="max-w-2xl mx-auto">
            {/* Poll Details */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedPoll.title}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(selectedPoll.status)}`}>
                  {getStatusIcon(selectedPoll.status)}
                  <span className="capitalize">{selectedPoll.status}</span>
                </span>
              </div>
              
              <p className="text-gray-600 mb-6">{selectedPoll.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Start:</span> {new Date(selectedPoll.start_time).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">End:</span> {new Date(selectedPoll.end_time).toLocaleDateString()}
                </div>
              </div>

              {selectedPoll.sponsors.length > 0 && (
                <div className="mb-6">
                  <span className="text-sm font-medium text-gray-700">Sponsored by:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedPoll.sponsors.map((sponsor, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {sponsor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Voting Options */}
              {selectedPoll.status === 'active' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Cast Your Vote</h3>
                  <div className="space-y-3">
                    {selectedPoll.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => setUserChoice(index)}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                          userChoice === index
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{option}</span>
                          {userChoice === index && (
                            <CheckCircle className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex space-x-4 mt-6">
                    <button
                      onClick={() => {
                        setSelectedPoll(null)
                        setUserChoice(null)
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => submitVote(selectedPoll.id, userChoice!)}
                      disabled={userChoice === null || voting}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {voting ? 'Submitting...' : 'Submit Vote'}
                    </button>
                  </div>
                </div>
              )}

              {selectedPoll.status === 'closed' && (
                <div className="text-center py-8">
                  <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-gray-600">This poll is closed and no longer accepting votes.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Available Polls</h2>
              <p className="text-gray-600">Select a poll to view details and cast your vote.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {polls.map((poll) => (
                <div key={poll.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{poll.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(poll.status)}`}>
                      {getStatusIcon(poll.status)}
                      <span className="capitalize">{poll.status}</span>
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{poll.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>{poll.options.length} options</span>
                    <span>{new Date(poll.created_at).toLocaleDateString()}</span>
                  </div>

                  <button
                    onClick={() => setSelectedPoll(poll)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                  >
                    {poll.status === 'active' ? 'Vote Now' : 'View Details'}
                  </button>
                </div>
              ))}
            </div>

            {polls.length === 0 && (
              <div className="text-center py-12">
                <Vote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No polls available</h3>
                <p className="text-gray-600">Check back later for new voting opportunities.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
