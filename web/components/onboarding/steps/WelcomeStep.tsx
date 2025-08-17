'use client'

import { Shield, Users, TrendingUp, Heart } from 'lucide-react'

interface WelcomeStepProps {
  onNext: () => void
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="text-center space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome to Choices
        </h1>
        <p className="text-xl text-gray-600 max-w-lg mx-auto">
          Where your voice matters and privacy comes first
        </p>
      </div>

      {/* Privacy-first messaging */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="flex items-center justify-center mb-4">
          <Shield className="w-12 h-12 text-blue-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Privacy by Design
        </h2>
        <p className="text-gray-600 mb-6">
          We believe you should control your data. Every piece of information you share is optional, 
          and you can change your privacy settings anytime.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-500" />
            <span>You control what you share</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span>No political affiliations</span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <span>Focus on shared values</span>
          </div>
        </div>
      </div>

      {/* What we do */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          What we do
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-left space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Heart className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Community Polls</h3>
                <p className="text-gray-600 text-sm">Vote on issues that matter to your community</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Shared Values</h3>
                <p className="text-gray-600 text-sm">Connect with people who share your concerns</p>
              </div>
            </div>
          </div>
          <div className="text-left space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Meaningful Insights</h3>
                <p className="text-gray-600 text-sm">See how different communities think about issues</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Shield className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Privacy First</h3>
                <p className="text-gray-600 text-sm">Your data stays yours, always</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Get started button */}
      <div className="pt-4">
        <button
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          Get Started
        </button>
        <p className="text-gray-500 text-sm mt-3">
          Takes about 2 minutes • No personal data required
        </p>
      </div>
    </div>
  )
}
