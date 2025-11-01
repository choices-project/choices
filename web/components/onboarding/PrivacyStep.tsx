import { Shield, Eye, Users, TrendingUp, Lock } from 'lucide-react'
import React, { useState } from 'react';


import { useOnboardingContext } from './EnhancedOnboardingFlow'

'use client'

type PrivacyData = {
  privacy?: {
    shareProfile?: boolean
    shareDemographics?: boolean
    shareParticipation?: boolean
    allowAnalytics?: boolean
  }
}

type PrivacyOption = {
  field: keyof NonNullable<PrivacyData['privacy']>
  label: string
  description: string
  icon: React.ReactNode
  color: string
  bgColor: string
  borderColor: string
}

type PrivacyStepProps = {
  data: PrivacyData
  onUpdate: (updates: PrivacyData) => void
  onNext: () => void
  onBack: () => void
}

export default function PrivacyStep({ data, onUpdate, onNext, onBack }: PrivacyStepProps) {
  const [privacy, setPrivacy] = useState(data.privacy || {
    shareProfile: false,
    shareDemographics: false,
    shareParticipation: false,
    allowAnalytics: false
  })
  const { updateData } = useOnboardingContext()

  const handlePrivacyChange = (field: keyof NonNullable<PrivacyData['privacy']>, value: boolean) => {
    const newPrivacy = { ...privacy, [field]: value }
    setPrivacy(newPrivacy)
    
    // Update both local state and context - the updates parameter is used here
    const updates = { privacy: newPrivacy }
    onUpdate(updates)
    // Map to the correct type for updateData
    updateData({ 
      privacy: {
        shareAnalytics: newPrivacy.allowAnalytics || false,
        dpLevel: 1,
        privacyCompleted: true
      }
    })
  }

  const privacyOptions: PrivacyOption[] = [
    {
      field: 'shareProfile',
      label: 'Share my profile publicly',
      description: 'Show my name, avatar, and bio to other users',
      icon: <Users className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      field: 'shareDemographics',
      label: 'Share my demographics',
      description: 'Show my age, education, etc. to other users',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      field: 'shareParticipation',
      label: 'Share my participation',
      description: 'Show my voting history and activity',
      icon: <Eye className="w-5 h-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      field: 'allowAnalytics',
      label: 'Allow analytics',
      description: 'Help improve the platform with anonymous data',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">
          Your privacy settings
        </h2>
        <p className="text-gray-600">
          You control what information is shared. You can change these settings anytime.
        </p>
      </div>

      {/* Privacy commitment */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-start space-x-3">
          <Shield className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Our privacy commitment</h3>
            <div className="text-blue-800 text-sm space-y-2">
              <p>
                <strong>Your data is yours:</strong> We never sell, rent, or share your personal information with third parties.
              </p>
              <p>
                <strong>Transparent:</strong> You can see exactly what data we have and delete it anytime.
              </p>
              <p>
                <strong>Secure:</strong> All data is encrypted and stored securely using industry best practices.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy toggles */}
      <div className="space-y-4">
        {privacyOptions.map((option: PrivacyOption) => (
          <div
            key={option.field}
            className={`
              p-6 rounded-xl border-2 transition-all duration-200
              ${privacy[option.field]
                ? `${option.bgColor} ${option.borderColor}`
                : 'bg-white border-gray-200'
              }
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className={`${option.color} mt-1`}>
                  {option.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {option.label}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {option.description}
                  </p>
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacy[option.field]}
                  onChange={(e) => handlePrivacyChange(option.field, e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`
                  w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer 
                  peer-checked:after:translate-x-full peer-checked:after:border-white 
                  after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                  after:bg-white after:border-gray-300 after:border after:rounded-full 
                  after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600
                `} />
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Privacy summary */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Lock className="w-6 h-6 text-gray-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">What this means</h3>
            <div className="text-gray-600 text-sm space-y-2">
              {privacy.shareProfile && (
                <p>✓ Your profile will be visible to other users</p>
              )}
              {privacy.shareDemographics && (
                <p>✓ Your demographic info will be shared with the community</p>
              )}
              {privacy.shareParticipation && (
                <p>✓ Your voting activity will be visible to others</p>
              )}
              {privacy.allowAnalytics && (
                <p>✓ Anonymous data will help improve the platform</p>
              )}
              {!privacy.shareProfile && !privacy.shareDemographics && !privacy.shareParticipation && !privacy.allowAnalytics && (
                <p>✓ You&apos;re keeping your information private - that&apos;s perfectly fine!</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Data control info */}
      <div className="bg-green-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-start space-x-3">
          <Shield className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-900 mb-2">You&apos;re always in control</h3>
            <ul className="text-green-800 text-sm space-y-1">
              <li>• Change these settings anytime in your profile</li>
              <li>• Delete your account and all data instantly</li>
              <li>• Export your data whenever you want</li>
              <li>• We&apos;ll notify you of any changes to our privacy policy</li>
            </ul>
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
        Step 5 of 6 • You can change these anytime
      </div>
    </div>
  )
}
