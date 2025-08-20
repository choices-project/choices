'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { CheckCircle, AlertCircle, Info, Vote, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'

interface PollOption {
  id: string
  text: string
  description?: string
}

interface QuadraticVotingProps {
  pollId: string
  title: string
  description?: string
  options: PollOption[]
  onVote: (allocations: { [optionId: string]: number }) => Promise<void>
  isVoting: boolean
  hasVoted?: boolean
  userVote?: { [optionId: string]: number }
  totalCredits?: number
}

export default function QuadraticVoting({
  pollId,
  title,
  description,
  options,
  onVote,
  isVoting,
  hasVoted = false,
  userVote,
  totalCredits = 100
}: QuadraticVotingProps) {
  const [allocations, setAllocations] = useState<{ [optionId: string]: number }>({})
  const [error, setError] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize allocations from user's previous vote or empty
  useEffect(() => {
    if (userVote) {
      setAllocations(userVote)
    } else {
      const initialAllocations: { [optionId: string]: number } = {}
      options.forEach(option => {
        initialAllocations[option.id] = 0
      })
      setAllocations(initialAllocations)
    }
  }, [userVote, options])

  const getTotalSpent = () => {
    return Object.values(allocations).reduce((total: any, credits: any) => {
      return total + (credits * credits) // Quadratic cost
    }, 0)
  }

  const getRemainingCredits = () => {
    return totalCredits - getTotalSpent()
  }

  const handleAllocationChange = (optionId: string, credits: number) => {
    if (hasVoted || isVoting) return

    const currentSpent = getTotalSpent()
    const currentOptionSpent = (allocations[optionId] || 0) ** 2
    const newOptionSpent = credits ** 2
    const newTotalSpent = currentSpent - currentOptionSpent + newOptionSpent

    if (newTotalSpent > totalCredits) {
      setError(`Cannot allocate ${credits} credits. Would exceed budget.`)
      return
    }

    setError(null)
    setAllocations(prev => ({
      ...prev,
      [optionId]: Math.max(0, credits)
    }))
  }

  const handleSubmit = async () => {
    if (hasVoted || isVoting) return

    // Validate that at least some credits are allocated
    const totalAllocated = Object.values(allocations).reduce((sum: any, credits: any) => sum + credits, 0)
    if (totalAllocated === 0) {
      setError('Please allocate at least some credits to vote')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onVote(allocations)
    } catch (err: any) {
      setError(err.message || 'Failed to submit vote')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDisabled = hasVoted || isVoting || isSubmitting

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
            {description && (
              <p className="text-gray-600">{description}</p>
            )}
          </div>
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center space-x-2 text-pink-600 hover:text-pink-700 transition-colors"
          >
            <Info className="w-5 h-5" />
            <span className="text-sm font-medium">How it works</span>
          </button>
        </div>

        {/* Quadratic Voting Explanation */}
        {showExplanation && (
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-pink-900 mb-2">How Quadratic Voting Works</h3>
            <div className="text-sm text-pink-800 space-y-2">
              <p>• <strong>Allocate credits:</strong> Distribute your {totalCredits} credits across options</p>
              <p>• <strong>Quadratic cost:</strong> Cost = credits² (1 credit = 1 cost, 2 credits = 4 cost)</p>
              <p>• <strong>Prevents tyranny:</strong> Majority cannot dominate every decision</p>
              <p>• <strong>Encourages thought:</strong> Forces voters to prioritize their preferences</p>
            </div>
          </div>
        )}

        {/* Voting Method Badge */}
        <div className="flex items-center space-x-2">
          <div className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-medium">
            💰 Quadratic Voting
          </div>
          <span className="text-sm text-gray-500">
            Allocate {totalCredits} credits with quadratic cost
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Credit Budget Display */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Credit Budget</h3>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-pink-600" />
            <span className="text-sm font-medium text-gray-600">
              {getRemainingCredits()} / {totalCredits} credits remaining
            </span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-pink-600 h-3 rounded-full transition-all duration-300"
            style={{ 
              width: `${((totalCredits - getRemainingCredits()) / totalCredits) * 100}%` 
            }}
          />
        </div>
        
        <div className="mt-2 text-sm text-gray-600">
          Total spent: {getTotalSpent()} credits
        </div>
      </div>

      {/* Voting Interface */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {options.map((option: any) => {
            const credits = allocations[option.id] || 0
            const cost = credits ** 2
            return (
              <div key={option.id} className="border border-gray-200 rounded-lg p-4">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{option.text}</h3>
                  {option.description && (
                    <p className="text-sm text-gray-600">{option.description}</p>
                  )}
                </div>

                {/* Credit Allocation */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Credits: {credits}</span>
                    <span className="text-sm text-gray-500">Cost: {cost}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAllocationChange(option.id, credits - 1)}
                      disabled={isDisabled || credits <= 0}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <TrendingDown className="w-4 h-4 text-gray-600" />
                    </button>
                    
                    <div className="flex-1 bg-gray-100 rounded-lg p-3 text-center">
                      <span className="text-lg font-bold text-pink-600">{credits}</span>
                      <span className="text-sm text-gray-500 ml-1">credits</span>
                    </div>
                    
                    <button
                      onClick={() => handleAllocationChange(option.id, credits + 1)}
                      disabled={isDisabled || getRemainingCredits() < ((credits + 1) ** 2 - cost)}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <TrendingUp className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Cost Visualization */}
                  <div className="text-xs text-gray-500">
                    Cost breakdown: {credits}² = {cost} credits
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Vote className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Voting Instructions</span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Use + and - buttons to allocate credits to each option</p>
            <p>• Cost = credits² (quadratic scaling)</p>
            <p>• You have {totalCredits} total credits to spend</p>
            <p>• Allocate at least some credits to submit your vote</p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex justify-center">
          {hasVoted ? (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Vote submitted successfully!</span>
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isDisabled || getTotalSpent() === 0}
              className={`
                flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-colors
                ${isDisabled || getTotalSpent() === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-pink-600 text-white hover:bg-pink-700'
                }
              `}
            >
              <Vote className="w-5 h-5" />
              <span>{isSubmitting ? 'Submitting Vote...' : 'Submit Vote'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Best Practices */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">When to Use Quadratic Voting</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">✅ Good For:</h4>
            <ul className="space-y-1">
              <li>• Budget allocation</li>
              <li>• Resource distribution</li>
              <li>• Governance decisions</li>
              <li>• Complex trade-offs</li>
              <li>• Preventing majority tyranny</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">⚠️ Consider Alternatives For:</h4>
            <ul className="space-y-1">
              <li>• Simple polls</li>
              <li>• Quick decisions</li>
              <li>• Binary choices</li>
              <li>• Preference expression</li>
              <li>• Satisfaction surveys</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
