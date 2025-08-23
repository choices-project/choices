'use client'

import { CheckCircle, Heart, Users, TrendingUp, Shield } from 'lucide-react';

interface CompleteStepProps {
  data: any
  onComplete: () => void
  onBack: () => void
  isLoading?: boolean
}

export default function CompleteStep({ data, onComplete, onBack, isLoading = false }: CompleteStepProps) {
  const getParticipationIcon = (style: string) => {
    switch (style) {
      case 'observer': return '👁️'
      case 'contributor': return '💡'
      case 'leader': return '🚀'
      default: return '👤'
    }
  }

  const getParticipationLabel = (style: string) => {
    switch (style) {
      case 'observer': return 'Observer'
      case 'contributor': return 'Contributor'
      case 'leader': return 'Leader'
      default: return 'Participant'
    }
  }

  return (
    <div className="space-y-8">
      {/* Success message */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome to Choices!
        </h2>
        <p className="text-gray-600">
          You&apos;re all set up and ready to make your voice heard.
        </p>
      </div>

      {/* Profile summary */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Your Profile Summary
        </h3>
        
        <div className="space-y-6">
          {/* Basic info */}
          <div className="flex items-center space-x-4">
            <div className="w-15 h-15 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-lg">
                {data.displayName ? data.displayName.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{data.displayName || 'User'}</h4>
              <p className="text-gray-600 text-sm">Ready to participate</p>
            </div>
          </div>

          {/* Values */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Heart className="w-5 h-5 text-red-500 mr-2" />
              What matters to you
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.primaryConcerns?.map((concern: string) => (
                <span
                  key={concern}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {concern}
                </span>
              ))}
            </div>
          </div>

          {/* Community focus */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Users className="w-5 h-5 text-blue-500 mr-2" />
              Community focus
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.communityFocus?.map((focus: string) => (
                <span
                  key={focus}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {focus}
                </span>
              ))}
            </div>
          </div>

          {/* Participation style */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <TrendingUp className="w-5 h-5 text-purple-500 mr-2" />
              Your participation style
            </h4>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getParticipationIcon(data.participationStyle)}</span>
              <span className="text-gray-700">{getParticipationLabel(data.participationStyle)}</span>
            </div>
          </div>

          {/* Privacy settings */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Shield className="w-5 h-5 text-gray-600 mr-2" />
              Privacy settings
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Share profile publicly</span>
                <span className={data.privacy?.shareProfile ? 'text-green-600' : 'text-gray-400'}>
                  {data.privacy?.shareProfile ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Share demographics</span>
                <span className={data.privacy?.shareDemographics ? 'text-green-600' : 'text-gray-400'}>
                  {data.privacy?.shareDemographics ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Allow analytics</span>
                <span className={data.privacy?.allowAnalytics ? 'text-green-600' : 'text-gray-400'}>
                  {data.privacy?.allowAnalytics ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What&apos;s next */}
      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-4">What's next?</h3>
        <div className="space-y-3 text-blue-800 text-sm">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600">1.</span>
            <span>Explore active polls and start voting</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-600">2.</span>
            <span>Create your own polls to gather community input</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-600">3.</span>
            <span>Connect with others who share your values</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-600">4.</span>
            <span>Update your profile anytime from your dashboard</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onComplete}
          disabled={isLoading}
          className={`
            px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2
            ${isLoading 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
            }
          `}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving your profile...</span>
            </>
          ) : (
            <>
              <span>Complete Setup</span>
              <span>→</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
