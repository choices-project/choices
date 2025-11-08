'use client'

import { CheckCircle, Heart, Users, TrendingUp, Shield } from 'lucide-react';
import React from 'react';

import type { CompleteStepProps, ParticipationStyle } from '../types';

/**
 * Complete Step Component
 * 
 * Final step of the onboarding flow that displays:
 * - Success confirmation message
 * - Profile summary based on provided data
 * - Next steps and actions
 * - Open source contribution information
 * 
 * Features:
 * - Dynamic content based on user selections
 * - Participation style icons and descriptions
 * - Call-to-action buttons
 * - Loading state support
 * 
 * @param {CompleteStepProps} props - Component props
 * @returns {JSX.Element} Completion confirmation interface
 */
export default function CompleteStep({ data, onComplete, onBack, isLoading = false }: CompleteStepProps) {
  const participationStyle: ParticipationStyle = data.participationStyle ?? 'observer';
  const getParticipationIcon = (style: ParticipationStyle) => {
    switch (style) {
      case 'observer': return '👁️'
      case 'contributor': return '💡'
      case 'leader': return '🚀'
      default: return '👤'
    }
  }

  const getParticipationLabel = (style: ParticipationStyle) => {
    switch (style) {
      case 'observer': return 'Observer'
      case 'contributor': return 'Contributor'
      case 'leader': return 'Leader'
      default: return 'Participant'
    }
  }

  return (
    <div className="space-y-8" >
      {/* Success message */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-bounce shadow-lg">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 animate-fade-in">
          Welcome to Choices!
        </h2>
        <p className="text-gray-600 animate-fade-in-delay">
          You&apos;re all set up and ready to make your voice heard.
        </p>
        
        {/* Achievement celebration */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full inline-block animate-pulse">
          🎉 Onboarding Complete! +50 points earned
        </div>
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
              <span className="text-2xl">{getParticipationIcon(participationStyle)}</span>
              <span className="text-gray-700">{getParticipationLabel(participationStyle)}</span>
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

      {/* What's next */}
      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-4">What&apos;s next?</h3>
        <div className="space-y-3 text-blue-800 text-sm">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600">1.</span>
            <span>Find your local candidates and see who&apos;s really representing you</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-600">2.</span>
            <span>Ask questions directly to candidates and track their responses</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-600">3.</span>
            <span>See who&apos;s funding whom and spot &quot;bought off&quot; politicians</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-blue-600">4.</span>
            <span>Connect with other voters who care about democracy</span>
          </div>
        </div>
      </div>

      {/* Open Source Contribution */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
        <h3 className="font-semibold text-green-900 mb-4 flex items-center">
          <span className="mr-2">🚀</span>
          Help Build the Democratic Revolution
        </h3>
        <p className="text-green-800 text-sm mb-4">
          This is an open source project fighting for democracy. Every contribution helps level the playing field!
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2 flex items-center">
              <span className="mr-2">💻</span>
              Code Contributions
            </h4>
            <p className="text-sm text-green-800 mb-3">
              Help us build features, fix bugs, and improve the platform
            </p>
            <div className="space-y-2 text-xs text-green-700">
              <div>• Frontend: React, TypeScript, Tailwind</div>
              <div>• Backend: Node.js, Supabase, PostgreSQL</div>
              <div>• APIs: Government data integration</div>
              <div>• Privacy: Zero-knowledge architecture</div>
            </div>
            <button className="mt-3 w-full px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
              View on GitHub
            </button>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2 flex items-center">
              <span className="mr-2">🤝</span>
              Other Ways to Help
            </h4>
            <p className="text-sm text-green-800 mb-3">
              Not a developer? There are other ways to contribute!
            </p>
            <div className="space-y-2 text-xs text-green-700">
              <div>• Report bugs and suggest features</div>
              <div>• Help with documentation</div>
              <div>• Share with friends and family</div>
              <div>• Test new features</div>
            </div>
            <button className="mt-3 w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Join Community
            </button>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> We&apos;re exploring ethical ways to accept financial contributions. 
            For now, we focus on code and community contributions to keep the platform truly independent.
          </p>
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
          data-testid="complete-onboarding"
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
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
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
