'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import RankedChoiceVoting from '@/components/voting/RankedChoiceVoting'

// Sample poll data for testing
const samplePoll = {
  id: 'test-ranked-choice-poll',
  title: 'What should we have for lunch?',
  description: 'Help us decide where to go for our team lunch today!',
  options: [
    {
      id: 'pizza',
      text: 'Pizza',
      description: 'Classic Italian pizza with various toppings'
    },
    {
      id: 'sushi',
      text: 'Sushi',
      description: 'Fresh Japanese sushi and sashimi'
    },
    {
      id: 'tacos',
      text: 'Tacos',
      description: 'Authentic Mexican street tacos'
    },
    {
      id: 'salad',
      text: 'Salad',
      description: 'Healthy green salad with protein'
    },
    {
      id: 'burger',
      text: 'Burger',
      description: 'Juicy gourmet burger with fries'
    }
  ]
}

export default function TestRankedChoicePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isVoting, setIsVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [userVote, setUserVote] = useState<{ [optionId: string]: number } | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirectTo=/polls/test-ranked-choice')
    }
  }, [user, loading, router])

  const handleVote = async (rankings: { [optionId: string]: number }) => {
    setIsVoting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Vote submitted:', rankings)
      setUserVote(rankings)
      setHasVoted(true)
      
      // In a real implementation, this would call the API
      // const response = await fetch(`/api/polls/${samplePoll.id}/vote`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ rankings, votingMethod: 'ranked' })
      // })
      
      // if (!response.ok) {
      //   throw new Error('Failed to submit vote')
      // }
      
    } catch (error: any) {
      console.error('Error submitting vote:', error)
      throw error
    } finally {
      setIsVoting(false)
    }
  }

  if (loading) {
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
            Ranked Choice Voting Demo
          </h1>
          <p className="text-gray-600">
            Test the ranked choice voting interface with this sample poll
          </p>
        </div>

        {/* Voting Interface */}
        <RankedChoiceVoting
          pollId={samplePoll.id}
          title={samplePoll.title}
          description={samplePoll.description}
          options={samplePoll.options}
          onVote={handleVote}
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
                <li>• Click to rank options (1st, 2nd, 3rd, etc.)</li>
                <li>• Visual feedback with colored rank badges</li>
                <li>• Progress indicator showing completion</li>
                <li>• Real-time validation and error handling</li>
                <li>• Educational tooltips explaining ranked choice</li>
                <li>• Current rankings summary</li>
                <li>• Responsive design for all devices</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">How to Test</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Click on different options to assign ranks</li>
                <li>• Try clicking the same option multiple times</li>
                <li>• Try submitting without ranking all options</li>
                <li>• Check the "How it works" explanation</li>
                <li>• Watch the progress bar update</li>
                <li>• View the current rankings summary</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
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
