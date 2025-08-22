'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Info } from 'lucide-react'

interface PollOption {
  id: string
  text: string
  description?: string
}

interface SingleChoiceVotingProps {
  pollId: string
  title: string
  description?: string
  options: PollOption[]
  onVote: (choice: string) => Promise<void>
  isVoting: boolean
  hasVoted?: boolean
  userVote?: string
}

export default function SingleChoiceVoting({
  pollId,
  title,
  description,
  options,
  onVote,
  isVoting,
  hasVoted = false,
  userVote
}: SingleChoiceVotingProps) {
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize from user's previous vote
  useEffect(() => {
    if (userVote) {
      setSelectedOption(userVote)
    }
  }, [userVote])

  const handleOptionSelect = (optionId: string) => {
    if (hasVoted || isVoting) return
    
    setError(null)
    setSelectedOption(optionId)
  }

  const handleSubmit = async () => {
    if (hasVoted || isVoting) return

    if (!selectedOption) {
      setError('Please select an option to vote')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onVote(selectedOption)
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
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Info className="w-5 h-5" />
            <span className="text-sm font-medium">How it works</span>
          </button>
        </div>

        {/* Single Choice Explanation */}
        {showExplanation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">How Single Choice Voting Works</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• <strong>Pick one option:</strong> Select the option you prefer most</p>
              <p>• <strong>Highest vote count wins:</strong> The option with the most votes becomes the winner</p>
              <p>• <strong>Simple and familiar:</strong> This is the most common voting method</p>
              <p>• <strong>Quick decisions:</strong> Perfect for straightforward choices</p>
            </div>
          </div>
        )}

        {/* Voting Method Badge */}
        <div className="flex items-center space-x-2">
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            🎯 Single Choice Voting
          </div>
          <span className="text-sm text-gray-500">
            Select one option that you prefer most
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
        <div className="space-y-3">
          {options.map((option: any) => (
            <div
              key={option.id}
              onClick={() => handleOptionSelect(option.id)}
              className={`
                relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                ${isDisabled 
                  ? 'cursor-not-allowed opacity-60' 
                  : 'hover:border-blue-300 hover:bg-blue-50'
                }
                ${selectedOption === option.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200'
                }
              `}
            >
              <div className="flex items-start space-x-3">
                {/* Radio Button */}
                <div className="flex-shrink-0 mt-1">
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${selectedOption === option.id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300 bg-white'
                    }
                    transition-all duration-200
                  `}>
                    {selectedOption === option.id && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </div>

                {/* Option Content */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{option.text}</h3>
                  {option.description && (
                    <p className="text-sm text-gray-600">{option.description}</p>
                  )}
                </div>

                {/* Selection Indicator */}
                {selectedOption === option.id && (
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Voting Instructions</span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Click on an option to select it as your choice</p>
            <p>• You can change your selection before submitting</p>
            <p>• Only one option can be selected at a time</p>
            <p>• The option with the most votes will win</p>
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
              disabled={isDisabled || !selectedOption}
              className={`
                flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-colors
                ${isDisabled || !selectedOption
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }
              `}
            >
              <CheckCircle className="w-5 h-5" />
              <span>{isSubmitting ? 'Submitting Vote...' : 'Submit Vote'}</span>
            </button>
          )}
        </div>

        {/* Selection Summary */}
        {selectedOption && !hasVoted && (
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">
              Selected: <span className="font-medium text-blue-600">
                {options.find(opt => opt.id === selectedOption)?.text}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Best Practices */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">When to Use Single Choice Voting</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">✅ Good For:</h4>
            <ul className="space-y-1">
              <li>• Quick decisions</li>
              <li>• Binary choices</li>
              <li>• Simple polls</li>
              <li>• Yes/No questions</li>
              <li>• Straightforward options</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">⚠️ Consider Alternatives For:</h4>
            <ul className="space-y-1">
              <li>• Many similar options</li>
              <li>• Preference expression</li>
              <li>• Consensus building</li>
              <li>• Complex decisions</li>
              <li>• Multi-candidate scenarios</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
