'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { CheckCircle, AlertCircle, Info, Vote, Star, StarOff } from 'lucide-react'

interface PollOption {
  id: string
  text: string
  description?: string
}

interface RangeVotingProps {
  pollId: string
  title: string
  description?: string
  options: PollOption[]
  onVote: (ratings: { [optionId: string]: number }) => Promise<void>
  isVoting: boolean
  hasVoted?: boolean
  userVote?: { [optionId: string]: number }
  minRating?: number
  maxRating?: number
}

export default function RangeVoting({
  pollId,
  title,
  description,
  options,
  onVote,
  isVoting,
  hasVoted = false,
  userVote,
  minRating = 0,
  maxRating = 10
}: RangeVotingProps) {
  const [ratings, setRatings] = useState<{ [optionId: string]: number }>({})
  const [error, setError] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize ratings from user's previous vote or default values
  useEffect(() => {
    if (userVote) {
      setRatings(userVote)
    } else {
      const initialRatings: { [optionId: string]: number } = {}
      options.forEach(option => {
        initialRatings[option.id] = minRating
      })
      setRatings(initialRatings)
    }
  }, [userVote, options, minRating])

  const handleRatingChange = (optionId: string, rating: number) => {
    if (hasVoted || isVoting) return

    setError(null)
    setRatings(prev => ({
      ...prev,
      [optionId]: Math.max(minRating, Math.min(maxRating, rating))
    }))
  }

  const handleSubmit = async () => {
    if (hasVoted || isVoting) return

    // Validate that all options have ratings
    const ratedOptions = Object.keys(ratings)
    if (ratedOptions.length !== options.length) {
      setError('Please rate all options')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onVote(ratings)
    } catch (err: any) {
      setError(err.message || 'Failed to submit vote')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getAverageRating = () => {
    const values = Object.values(ratings)
    if (values.length === 0) return 0
    return Math.round((values.reduce((sum: any, rating: any) => sum + rating, 0) / values.length) * 10) / 10
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
            className="flex items-center space-x-2 text-yellow-600 hover:text-yellow-700 transition-colors"
          >
            <Info className="w-5 h-5" />
            <span className="text-sm font-medium">How it works</span>
          </button>
        </div>

        {/* Range Voting Explanation */}
        {showExplanation && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-yellow-900 mb-2">How Range Voting Works</h3>
            <div className="text-sm text-yellow-800 space-y-2">
              <p>• <strong>Rate each option:</strong> Give each option a score from {minRating} to {maxRating}</p>
              <p>• <strong>Highest average wins:</strong> The option with the highest average rating wins</p>
              <p>• <strong>Captures intensity:</strong> Shows how strongly you feel about each option</p>
              <p>• <strong>Detailed feedback:</strong> Provides nuanced preference information</p>
            </div>
          </div>
        )}

        {/* Voting Method Badge */}
        <div className="flex items-center space-x-2">
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
            📊 Range Voting
          </div>
          <span className="text-sm text-gray-500">
            Rate each option from {minRating} to {maxRating}
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

      {/* Voting Interface */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {options.map((option: any) => (
            <div key={option.id} className="border border-gray-200 rounded-lg p-4">
              <div className="mb-3">
                <h3 className="font-semibold text-gray-900 mb-1">{option.text}</h3>
                {option.description && (
                  <p className="text-sm text-gray-600">{option.description}</p>
                )}
              </div>

              {/* Rating Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rating: {ratings[option.id] || minRating}</span>
                  <span className="text-sm text-gray-500">{minRating} - {maxRating}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min={minRating}
                    max={maxRating}
                    step="1"
                    value={ratings[option.id] || minRating}
                    onChange={(e) => handleRatingChange(option.id, parseInt(e.target.value))}
                    disabled={isDisabled}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                    {ratings[option.id] || minRating}
                  </span>
                </div>

                {/* Star Rating Visual */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: maxRating - minRating + 1 }, (i) => {
                    const starValue = i + minRating
                    const isFilled = (ratings[option.id] || minRating) >= starValue
                    return (
                      <button
                        key={starValue}
                        onClick={() => handleRatingChange(option.id, starValue)}
                        disabled={isDisabled}
                        className={`transition-colors ${
                          isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'
                        }`}
                      >
                        {isFilled ? (
                          <Star className="w-5 h-5 text-yellow-500 fill-current" />
                        ) : (
                          <StarOff className="w-5 h-5 text-gray-300" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Vote className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Voting Instructions</span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Use the slider or click stars to rate each option</p>
            <p>• {minRating} = lowest rating, {maxRating} = highest rating</p>
            <p>• Rate all options to submit your vote</p>
            <p>• The option with the highest average rating wins</p>
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
              disabled={isDisabled}
              className={`
                flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-colors
                ${isDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
                }
              `}
            >
              <Vote className="w-5 h-5" />
              <span>{isSubmitting ? 'Submitting Vote...' : 'Submit Vote'}</span>
            </button>
          )}
        </div>

        {/* Progress Indicator */}
        {!hasVoted && (
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">
              Average rating: {getAverageRating()}/10
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(getAverageRating() / maxRating) * 100}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Best Practices */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">When to Use Range Voting</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">✅ Good For:</h4>
            <ul className="space-y-1">
              <li>• Satisfaction surveys</li>
              <li>• Product ratings</li>
              <li>• Preference intensity</li>
              <li>• Detailed feedback</li>
              <li>• Political sentiment</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">⚠️ Consider Alternatives For:</h4>
            <ul className="space-y-1">
              <li>• Quick decisions</li>
              <li>• Binary choices</li>
              <li>• Simple polls</li>
              <li>• Budget allocation</li>
              <li>• Complex trade-offs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
