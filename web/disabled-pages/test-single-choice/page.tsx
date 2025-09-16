'use client'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

import { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { useRouter } from 'next/navigation'
import SingleChoiceVoting from '@/features/voting/components/SingleChoiceVoting'
import { devLog } from '@/lib/logger';

// Sample poll data for testing
const samplePoll = {
  id: 'test-single-choice-poll',
  title: 'What is your favorite programming language?',
  description: 'Help us understand the most popular programming languages in our community!',
  options: [
    {
      id: 'javascript',
      text: 'JavaScript',
      description: 'The language of the web, versatile and widely used'
    },
    {
      id: 'python',
      text: 'Python',
      description: 'Simple, readable, and powerful for data science and AI'
    },
    {
      id: 'typescript',
      text: 'TypeScript',
      description: 'JavaScript with static typing and better tooling'
    },
    {
      id: 'rust',
      text: 'Rust',
      description: 'Systems programming with memory safety and performance'
    },
    {
      id: 'go',
      text: 'Go',
      description: 'Simple, fast, and concurrent programming language'
    }
  ]
}

function TestSingleChoiceContent() {
  const { user, isLoading } = useSupabaseAuth()
  const router = useRouter()
  const [isVoting, setIsVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [userVote, setUserVote] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirectTo=/polls/test-single-choice')
    }
  }, [user, isLoading, router])

  const handleVote = async (pollId: string, choice: number) => {
    setIsVoting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      devLog('Vote submitted:', { pollId, choice })
      setUserVote(choice)
      setHasVoted(true)
      
      // In a real implementation, this would call the API
      // const response = await fetch(`/api/polls/${pollId}/vote`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ choice, votingMethod: 'single' })
      // })
      
      // if (!response.ok) {
      //   throw new Error('Failed to submit vote')
      // }
      
    } catch (error: any) {
      devLog('Error submitting vote:', error)
      throw error
    } finally {
      setIsVoting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Single Choice Voting Demo
          </h1>
          <p className="text-gray-600">
            Test the single choice voting interface with this sample poll
          </p>
        </div>

        {/* Voting Interface */}
        <SingleChoiceVoting
          pollId={samplePoll.id}
          title={samplePoll.title}
          description={samplePoll.description}
          options={samplePoll.options}
          onVote={(choice) => handleVote(samplePoll.id, choice)}
          isVoting={isVoting}
          hasVoted={hasVoted}
          userVote={userVote}
        />

        {/* Demo Information */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Demo Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Features Demonstrated</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Radio button selection interface</li>
                <li>• Visual feedback with hover and selection states</li>
                <li>• Real-time validation and error handling</li>
                <li>• Educational tooltips explaining single choice voting</li>
                <li>• Selection summary showing current choice</li>
                <li>• Best practices guidance</li>
                <li>• Responsive design for all devices</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">How to Test</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Click on different options to select them</li>
                <li>• Try changing your selection before submitting</li>
                <li>• Try submitting without selecting an option</li>
                <li>• Check the "How it works" explanation</li>
                <li>• Read the best practices section</li>
                <li>• Notice the visual feedback and animations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Comparison with Other Methods */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Single Choice vs Other Methods</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">🎯 Single Choice</h3>
              <ul className="text-blue-800 space-y-1">
                <li>• Pick one option</li>
                <li>• Highest vote count wins</li>
                <li>• Simple and familiar</li>
                <li>• Quick decisions</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">✅ Approval Voting</h3>
              <ul className="text-green-800 space-y-1">
                <li>• Approve multiple options</li>
                <li>• Most approvals wins</li>
                <li>• Prevents vote splitting</li>
                <li>• Consensus building</li>
              </ul>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-2">🏆 Ranked Choice</h3>
              <ul className="text-purple-800 space-y-1">
                <li>• Rank all options</li>
                <li>• Instant runoff process</li>
                <li>• No spoiler effect</li>
                <li>• Majority support guaranteed</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => router.push('/polls/test-ranked-choice')}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Ranked Choice Voting
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TestSingleChoicePage() {
  return <TestSingleChoiceContent />
}
