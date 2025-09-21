'use client'

import { useState, useEffect } from 'react'
import { Heart, Users, Globe, TrendingUp } from 'lucide-react'

type ValueCategory = {
  title: string
  icon: React.ReactNode
  color: string
  concerns: string[]
}

type CommunityOption = {
  value: string
  label: string
  description: string
}

type ParticipationOption = {
  value: 'observer' | 'contributor' | 'leader'
  label: string
  description: string
  icon: React.ReactNode
}

type ValuesStepProps = {
  data: {
    primaryConcerns?: string[]
    communityFocus?: string[]
    participationStyle?: 'observer' | 'contributor' | 'leader'
    valuesCompleted?: boolean
  }
  onUpdate: (_updates: {
    primaryConcerns?: string[]
    communityFocus?: string[]
    participationStyle?: 'observer' | 'contributor' | 'leader'
    valuesCompleted?: boolean
    stepProgress?: {
      currentStep: string
      completedSteps: string[]
      timeSpent: number
    }
  }) => void
  onNext: () => void
  onBack: () => void
}

export default function ValuesStep({ data, onUpdate, onNext, onBack }: ValuesStepProps) {
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>(data.primaryConcerns || [])
  const [communityFocus, setCommunityFocus] = useState<string[]>(data.communityFocus || [])
  const [participationStyle, setParticipationStyle] = useState(data.participationStyle || 'observer')

  // Sync component state with data changes
  useEffect(() => {
    if (data.primaryConcerns && data.primaryConcerns !== selectedConcerns) {
      setSelectedConcerns(data.primaryConcerns)
    }
    if (data.communityFocus && data.communityFocus !== communityFocus) {
      setCommunityFocus(data.communityFocus)
    }
    if (data.participationStyle && data.participationStyle !== participationStyle) {
      setParticipationStyle(data.participationStyle)
    }
  }, [data.primaryConcerns, data.communityFocus, data.participationStyle, selectedConcerns, communityFocus, participationStyle])

  const handleConcernToggle = (concern: string) => {
    const newConcerns = selectedConcerns.includes(concern)
      ? selectedConcerns.filter(c => c !== concern)
      : selectedConcerns.length < 5
      ? [...selectedConcerns, concern]
      : selectedConcerns
    
    setSelectedConcerns(newConcerns)
    onUpdate({ primaryConcerns: newConcerns })
  }

  const handleCommunityToggle = (focus: string) => {
    const newFocus = communityFocus.includes(focus)
      ? communityFocus.filter(f => f !== focus)
      : [...communityFocus, focus]
    
    setCommunityFocus(newFocus)
    onUpdate({ communityFocus: newFocus })
  }

  const handleParticipationChange = (style: 'observer' | 'contributor' | 'leader') => {
    setParticipationStyle(style)
    onUpdate({ participationStyle: style })
  }

  const canContinue = selectedConcerns.length > 0 && communityFocus.length > 0

  const valueCategories = [
    {
      title: 'Economic Justice',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-green-100 text-green-700',
      concerns: [
        'fair wages',
        'affordable housing',
        'healthcare access',
        'education funding',
        'small business support',
        'worker rights'
      ]
    },
    {
      title: 'Environmental Protection',
      icon: <Globe className="w-5 h-5" />,
      color: 'bg-blue-100 text-blue-700',
      concerns: [
        'climate action',
        'clean energy',
        'conservation',
        'sustainable living',
        'pollution reduction'
      ]
    },
    {
      title: 'Community Wellbeing',
      icon: <Heart className="w-5 h-5" />,
      color: 'bg-purple-100 text-purple-700',
      concerns: [
        'community safety',
        'mental health',
        'elderly care',
        'youth programs',
        'disability rights',
        'immigration reform'
      ]
    },
    {
      title: 'Systemic Change',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-orange-100 text-orange-700',
      concerns: [
        'corporate accountability',
        'government transparency',
        'campaign finance reform',
        'voting rights',
        'media integrity'
      ]
    }
  ]

  const communityOptions = [
    { value: 'local', label: 'My local community', description: 'City and neighborhood issues' },
    { value: 'regional', label: 'My region/state', description: 'State and regional concerns' },
    { value: 'national', label: 'National issues', description: 'Country-wide challenges' },
    { value: 'global', label: 'Global challenges', description: 'International cooperation' }
  ]

  const participationOptions: ParticipationOption[] = [
    {
      value: 'observer',
      label: 'Observer',
      description: 'I prefer to observe and learn from others',
      icon: '👁️'
    },
    {
      value: 'contributor',
      label: 'Contributor',
      description: 'I want to contribute ideas and suggestions',
      icon: '💡'
    },
    {
      value: 'leader',
      label: 'Leader',
      description: 'I want to help lead discussions and initiatives',
      icon: '🚀'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">
          What matters to you?
        </h2>
        <p className="text-gray-600">
          Select up to 5 issues that are most important to you. This helps us show you relevant polls and connect you with like-minded people.
        </p>
      </div>

      {/* Primary concerns */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">
          Primary Concerns ({selectedConcerns.length}/5)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {valueCategories.map((category: ValueCategory) => (
            <div key={category.title} className="space-y-3">
              <div className={`flex items-center space-x-2 p-3 rounded-lg ${category.color}`}>
                {category.icon}
                <span className="font-semibold">{category.title}</span>
              </div>
              <div className="space-y-2">
                {category.concerns.map((concern: string) => (
                  <button
                    key={concern}
                    onClick={() => handleConcernToggle(concern)}
                    className={`
                      w-full text-left p-3 rounded-lg border-2 transition-all duration-200
                      ${selectedConcerns.includes(concern)
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    {concern}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Community focus */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Where do you want to make an impact?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {communityOptions.map((option: CommunityOption) => (
            <button
              key={option.value}
              onClick={() => handleCommunityToggle(option.value)}
              className={`
                text-left p-4 rounded-lg border-2 transition-all duration-200
                ${communityFocus.includes(option.value)
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="font-semibold">{option.label}</div>
              <div className="text-sm opacity-75">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Participation style */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">
          How would you like to participate?
        </h3>
        <div className="space-y-3">
          {participationOptions.map((option: ParticipationOption) => (
            <button
              key={option.value}
              onClick={() => handleParticipationChange(option.value)}
              className={`
                w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center space-x-4
                ${participationStyle === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <span className="text-2xl">{option.icon}</span>
              <div>
                <div className="font-semibold">{option.label}</div>
                <div className="text-sm opacity-75">{option.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!canContinue}
          className={`
            px-6 py-3 rounded-lg font-semibold transition-colors
            ${canContinue
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          Continue
        </button>
      </div>
      
      <div className="text-center text-sm text-gray-500">
        Step 3 of 6
      </div>
    </div>
  )
}
