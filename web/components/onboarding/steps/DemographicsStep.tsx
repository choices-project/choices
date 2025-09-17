'use client'

import { useState } from 'react'
import { Shield, Users } from 'lucide-react'
import { useOnboardingContext } from '../OnboardingFlow'

type DemographicsStepProps = {
  data: any
  onUpdate: (updates: any, _unused: any) => void
  onNext: () => void
  onBack: () => void
}

export default function DemographicsStep({ data, onUpdate, onNext, onBack }: DemographicsStepProps) {
  const [demographics, setDemographics] = useState(data.demographics || {})
  const { updateData } = useOnboardingContext()

  const handleDemographicChange = (field: string, value: string | undefined) => {
    const newDemographics = { ...demographics, [field]: value }
    setDemographics(newDemographics)
    
    // Update both local state and context - the updates parameter is used here
    const updates = { demographics: newDemographics }
    onUpdate(updates, updates)
    updateData({ demographics: newDemographics })
  }

  const demographicFields = [
    {
      field: 'ageRange',
      label: 'Age Range',
      description: 'Helps us understand generational perspectives',
      options: [
        { value: '18-25', label: '18-25' },
        { value: '26-35', label: '26-35' },
        { value: '36-50', label: '36-50' },
        { value: '51-65', label: '51-65' },
        { value: '65+', label: '65+' }
      ]
    },
    {
      field: 'education',
      label: 'Education Level',
      description: 'Helps ensure diverse perspectives are represented',
      options: [
        { value: 'high-school', label: 'High School' },
        { value: 'some-college', label: 'Some College' },
        { value: 'bachelors', label: 'Bachelor\'s Degree' },
        { value: 'graduate', label: 'Graduate Degree' }
      ]
    },
    {
      field: 'employment',
      label: 'Employment Status',
      description: 'Helps understand different life circumstances',
      options: [
        { value: 'student', label: 'Student' },
        { value: 'employed', label: 'Employed' },
        { value: 'self-employed', label: 'Self-Employed' },
        { value: 'retired', label: 'Retired' },
        { value: 'unemployed', label: 'Unemployed' }
      ]
    },
    {
      field: 'incomeRange',
      label: 'Income Range',
      description: 'Helps understand economic perspectives',
      options: [
        { value: 'under-30k', label: 'Under $30,000' },
        { value: '30k-60k', label: '$30,000 - $60,000' },
        { value: '60k-100k', label: '$60,000 - $100,000' },
        { value: '100k+', label: '$100,000+' }
      ]
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">
          Help us understand our community
        </h2>
        <p className="text-gray-600">
          This information is completely optional and helps us ensure diverse perspectives are represented.
        </p>
      </div>

      {/* Privacy notice */}
      <div className="bg-green-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-start space-x-3">
          <Shield className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-900 mb-2">Your privacy is protected</h3>
            <ul className="text-green-800 text-sm space-y-1">
              <li>• This information is never shared publicly</li>
              <li>• It's only used to ensure diverse representation</li>
              <li>• You can skip any question or change answers later</li>
              <li>• We never ask for specific personal details</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Demographics form */}
      <div className="space-y-6">
        {demographicFields.map((field: any) => (
          <div key={field.field} className="space-y-3">
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-1">
                {field.label}
              </label>
              <p className="text-gray-600 text-sm mb-3">
                {field.description}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {field.options.map((option: any) => (
                <button
                  key={option.value}
                  onClick={() => handleDemographicChange(field.field, option.value)}
                  className={`
                    text-left p-4 rounded-lg border-2 transition-all duration-200
                    ${demographics[field.field] === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => handleDemographicChange(field.field, undefined)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Skip this question
            </button>
          </div>
        ))}
      </div>

      {/* Why we ask */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-start space-x-3">
          <Users className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Why we ask for this information</h3>
            <div className="text-blue-800 text-sm space-y-2">
              <p>
                <strong>Diverse representation:</strong> We want to ensure all voices are heard, 
                regardless of age, education, or economic background.
              </p>
              <p>
                <strong>Better insights:</strong> Understanding different perspectives helps us 
                create more meaningful polls and analysis.
              </p>
              <p>
                <strong>Community building:</strong> We can connect you with people who share 
                similar life experiences and concerns.
              </p>
            </div>
          </div>
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
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Continue
        </button>
      </div>
      
      <div className="text-center text-sm text-gray-500">
        Step 4 of 6 • You can skip any question
      </div>
    </div>
  )
}
