'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth'
import { ArrowLeft, Share2, BarChart3, Settings, Users, Clock, TrendingUp } from 'lucide-react'
import SingleChoiceVoting from '@/components/voting/SingleChoiceVoting'
import RankedChoiceVoting from '@/components/voting/RankedChoiceVoting'
import ApprovalVoting from '@/components/voting/ApprovalVoting'
import RangeVoting from '@/components/voting/RangeVoting'
import QuadraticVoting from '@/components/voting/QuadraticVoting'
import PollResults from '@/components/polls/PollResults'
import PollShare from '@/components/polls/PollShare'
import { devLog } from '@/lib/logger'

type ViewMode = 'voting' | 'results' | 'share' | 'settings'
type VotingMethod = 'single' | 'ranked' | 'approval' | 'range' | 'quadratic'

interface Poll {
  id: string
  title: string
  description?: string
  votingMethod: VotingMethod
  options: Array<{
    id: string
    text: string
    description?: string
  }>
  settings: {
    isPublic: boolean
    showResults: boolean
    allowComments: boolean
    enableRealTimeAnalysis: boolean
  }
  schedule: {
    startDate: string
    endDate: string
  }
  stats: {
    totalVotes: number
    participationRate: number
    isActive: boolean
  }
}

export default function PollPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useSupabaseAuth()
  
  const [poll, setPoll] = useState<Poll | null>(null)
  const [currentView, setCurrentView] = useState<ViewMode>('voting')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userVote, setUserVote] = useState<any>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const pollId = params.id as string

  const loadPoll = useCallback(async () => {
    try {
      devLog('Loading poll:', pollId)
      setIsLoading(true)
      setError(null)
      
      // Fetch real poll data from API
      const response = await fetch(`/api/polls/${pollId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Poll not found')
        }
        throw new Error(`Failed to load poll: ${response.statusText}`)
      }
      
      const apiPoll = await response.json()
      
      // Transform API response to match frontend Poll interface
      const poll: Poll = {
        id: apiPoll.pollid,
        title: apiPoll.title,
        description: apiPoll.description || '',
        votingMethod: 'single', // Default to single choice
        options: apiPoll.options?.map((option: any, index: number) => ({
          id: `option-${index}`,
          text: option,
          description: ''
        })) || [],
        settings: {
          isPublic: apiPoll.privacylevel === 'public',
          showResults: true,
          allowComments: true,
          enableRealTimeAnalysis: true
        },
        schedule: {
          startDate: apiPoll.createdat?.split('T')[0] || '2024-01-01',
          endDate: '2024-12-31' // Default end date
        },
        stats: {
          totalVotes: apiPoll.totalvotes || 0,
          participationRate: apiPoll.participationrate || 0,
          isActive: apiPoll.status === 'active'
        }
      }
      
      setPoll(poll)
    } catch (error) {
      devLog('Error loading poll:', error)
      setError(error instanceof Error ? error.message : 'Failed to load poll')
    } finally {
      setIsLoading(false)
    }
  }, [pollId])

  const checkUserVote = useCallback(async () => {
    if (!user) return
    
    try {
      // Check if user has already voted using real API
      const response = await fetch(`/api/polls/${pollId}/vote`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.hasvoted) {
          setHasVoted(true)
          setShowResults(true)
          // Note: API doesn't return vote details for privacy
        }
      }
    } catch (error) {
      devLog('Error checking user vote:', error)
      // Don't show error to user for vote check
    }
  }, [pollId, user])

  useEffect(() => {
    if (!authLoading) {
      loadPoll()
      checkUserVote()
    }
  }, [authLoading, pollId, loadPoll, checkUserVote])

  const handleVote = async (voteData: any) => {
    if (!user) {
      router.push(`/login?redirectTo=/polls/${pollId}`)
      return
    }

    setIsVoting(true)
    try {
      // Submit vote using real API
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          choice: voteData.choice,
          privacylevel: 'public' // Default to public voting
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to submit vote: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setUserVote(voteData)
        setHasVoted(true)
        setShowResults(true)
        setCurrentView('results')
        
        // Refresh poll stats
        loadPoll()
      } else {
        throw new Error(result.message || 'Failed to submit vote')
      }
    } catch (error: any) {
      devLog('Error submitting vote:', error)
      setError(error instanceof Error ? error.message : 'Failed to submit vote')
    } finally {
      setIsVoting(false)
    }
  }

  const renderVotingInterface = () => {
    if (!poll) return null

    const commonProps = {
      pollId: poll.id,
      title: poll.title,
      description: poll.description,
      options: poll.options,
      onVote: handleVote,
      isVoting,
      hasVoted,
      userVote
    }

    switch (poll.votingMethod) {
      case 'single':
        return <SingleChoiceVoting {...commonProps} />
      case 'ranked':
        return <RankedChoiceVoting {...commonProps} />
      case 'approval':
        return <ApprovalVoting {...commonProps} />
      case 'range':
        return <RangeVoting {...commonProps} />
      case 'quadratic':
        return <QuadraticVoting {...commonProps} />
      default:
        return <SingleChoiceVoting {...commonProps} />
    }
  }

  const renderCurrentView = () => {
    // Show results if user has voted or if showResults is enabled
    const shouldShowResults = hasVoted || showResults || (poll?.settings?.showResults ?? false)
    
    switch (currentView) {
      case 'voting':
        return shouldShowResults ? <PollResults pollId={pollId} /> : renderVotingInterface()
      case 'results':
        return <PollResults pollId={pollId} />
      case 'share':
        return <PollShare pollId={pollId} poll={poll} />
      case 'settings':
        return <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Poll Settings</h3>
          <p className="text-gray-600">Settings view coming soon...</p>
        </div>
      default:
        return renderVotingInterface()
    }
  }

  const getViewIcon = (view: ViewMode) => {
    switch (view) {
      case 'voting': return <Users className="w-4 h-4" />
      case 'results': return <BarChart3 className="w-4 h-4" />
      case 'share': return <Share2 className="w-4 h-4" />
      case 'settings': return <Settings className="w-4 h-4" />
    }
  }

  const getViewLabel = (view: ViewMode) => {
    switch (view) {
      case 'voting': return 'Vote'
      case 'results': return 'Results'
      case 'share': return 'Share'
      case 'settings': return 'Settings'
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading poll...</p>
        </div>
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Poll Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The poll you\'re looking for doesn\'t exist.'}</p>
          <button
            onClick={() => router.push('/polls')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Polls
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/polls')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Polls</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Poll Stats */}
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{poll.stats.totalVotes} votes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{poll.stats.isActive ? 'Active' : 'Ended'}</span>
                </div>
                {poll.settings.enableRealTimeAnalysis && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span>Live</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Poll Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{poll.title}</h1>
              {poll.description && (
                <p className="text-gray-600 text-lg">{poll.description}</p>
              )}
              
              {/* Voting Method Badge */}
              <div className="mt-4 flex items-center space-x-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {poll.votingMethod === 'single' && '🎯 Single Choice'}
                  {poll.votingMethod === 'ranked' && '🏆 Ranked Choice'}
                  {poll.votingMethod === 'approval' && '✅ Approval Voting'}
                  {poll.votingMethod === 'range' && '📊 Range Voting'}
                  {poll.votingMethod === 'quadratic' && '💰 Quadratic Voting'}
                </span>
                {poll.settings.enableRealTimeAnalysis && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    📈 Real-time Analysis
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-t border-gray-200 pt-4">
            <nav className="flex space-x-8">
              {(['voting', 'results', 'share'] as ViewMode[]).map((view: any) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`
                    flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors
                    ${currentView === view
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {getViewIcon(view)}
                  <span>{getViewLabel(view)}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Dynamic Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : (
            renderCurrentView()
          )}
        </div>
      </main>
    </div>
  )
}
