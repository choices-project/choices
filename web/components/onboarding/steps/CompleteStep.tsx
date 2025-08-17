'use client'

import { CheckCircle, Heart, Users, TrendingUp, Shield } from 'lucide-react'

interface CompleteStepProps {
  data: any
  onComplete: () => void
  onBack: () => void
}

export default function CompleteStep({ data, onComplete, onBack }: CompleteStepProps) {
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
          You're all set up and ready to make your voice heard.
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
            <img
              src={data.avatar || 'https://via.placeholder.com/60/3B82F6/FFFFFF?text=U'}
              alt="Profile"
              className="w-15 h-15 rounded-full"
            />
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
              Participation style
            </h4>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getParticipationIcon(data.participationStyle)}</span>
              <span className="text-gray-700">{getParticipationLabel(data.participationStyle)}</span>
            </div>
          </div>

          {/* Privacy settings */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Shield className="w-5 h-5 text-green-500 mr-2" />
              Privacy settings
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Profile sharing: {data.privacy?.shareProfile ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Demographics sharing: {data.privacy?.shareDemographics ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Participation sharing: {data.privacy?.shareParticipation ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Analytics: {data.privacy?.allowAnalytics ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What's next */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-4">What's next?</h3>
        <div className="space-y-3 text-blue-800 text-sm">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <p>Browse and vote on current polls</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <p>Connect with people who share your concerns</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <p>Suggest new polls for the community</p>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <p>See insights and analysis from your participation</p>
          </div>
        </div>
      </div>

      {/* Privacy reminder */}
      <div className="bg-green-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-start space-x-3">
          <Shield className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-900 mb-2">Remember: You're in control</h3>
            <p className="text-green-800 text-sm">
              You can change your privacy settings, update your profile, or delete your account anytime. 
              Your data is yours, and we're committed to keeping it that way.
            </p>
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
          onClick={onComplete}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Start Exploring
        </button>
      </div>
      
      <div className="text-center text-sm text-gray-500">
        Step 6 of 6 • Welcome to the community!
      </div>
    </div>
  )
}
