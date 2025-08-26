'use client'

import React, { useState } from 'react'
import { Shield, Eye, EyeOff, Lock, Users, BarChart3, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PrivacyPhilosophyStepProps {
  data: any
  onUpdate: (updates: any) => void
  onNext: () => void
  onBack: () => void
}

export default function PrivacyPhilosophyStep({ data, onUpdate, onNext, onBack }: PrivacyPhilosophyStepProps) {
  const [privacyLevel, setPrivacyLevel] = useState(data.privacyLevel || 'medium')
  const [profileVisibility, setProfileVisibility] = useState(data.profileVisibility || 'public')
  const [dataSharing, setDataSharing] = useState(data.dataSharing || 'analytics_only')
  const [currentSection, setCurrentSection] = useState<'philosophy' | 'controls' | 'preview'>('philosophy')

  const handleNext = () => {
    onUpdate({
      privacyLevel,
      profileVisibility,
      dataSharing,
      privacyPhilosophyCompleted: true
    })
    onNext()
  }

  const privacyLevels = {
    low: { label: 'Open', description: 'Share most information for community insights', icon: Users },
    medium: { label: 'Balanced', description: 'Share some data while maintaining privacy', icon: Shield },
    high: { label: 'Private', description: 'Minimal data sharing, maximum privacy', icon: Lock },
    maximum: { label: 'Maximum', description: 'Only essential data, complete privacy', icon: EyeOff }
  }

  const renderPhilosophySection = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="h-8 w-8 text-blue-600" />
          <h2 className="text-3xl font-bold text-gray-900">Your Privacy Matters</h2>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          We believe your voice matters, but your privacy matters more. 
          Learn how we protect your data and give you control.
        </p>
      </div>

      {/* Privacy Principles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Privacy by Design</CardTitle>
                <CardDescription>Built with privacy as a core principle</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Data minimization
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                End-to-end encryption
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                No hidden tracking
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Your Control</CardTitle>
                <CardDescription>You decide what's visible and shared</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Granular privacy settings
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Data export & deletion
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Real-time control
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Respectful Analytics</CardTitle>
                <CardDescription>Data for insights, not surveillance</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Privacy-preserving analytics
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Community insights only
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                No individual tracking
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Community First</CardTitle>
                <CardDescription>Collective insights, individual privacy</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Democratic participation
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Informed decision making
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Respectful participation
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <div className="text-center">
        <Button onClick={() => setCurrentSection('controls')} size="lg" className="text-lg px-8 py-3">
          Learn About Your Controls
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )

  const renderControlsSection = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Privacy Controls</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          See how you can control your privacy and data sharing. 
          These settings can be changed anytime.
        </p>
      </div>

      {/* Privacy Level Selection */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Privacy Level</CardTitle>
          <CardDescription>
            Choose how much information you want to share with the community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(privacyLevels).map(([level, config]) => {
              const Icon = config.icon
              const isSelected = privacyLevel === level
              const isRecommended = level === 'medium'
              
              return (
                <button
                  key={level}
                  onClick={() => setPrivacyLevel(level)}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 text-left hover:shadow-md transform hover:scale-105 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : isRecommended
                      ? 'border-green-300 bg-green-50 hover:border-green-400'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  data-testid={`privacy-level-${level}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : isRecommended ? 'text-green-600' : 'text-gray-500'}`} />
                    <span className={`font-semibold ${isSelected ? 'text-blue-900' : isRecommended ? 'text-green-900' : 'text-gray-900'}`}>
                      {config.label}
                    </span>
                    {isRecommended && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${isSelected ? 'text-blue-700' : isRecommended ? 'text-green-700' : 'text-gray-600'}`}>
                    {config.description}
                  </p>
                  
                  {/* Tooltip */}
                  <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gray-900 text-white text-xs rounded py-1 px-2 -mt-8 transform -translate-x-1/2 left-1/2 z-50">
                    {config.description}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Profile Visibility */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Profile Visibility</CardTitle>
          <CardDescription>
            Control who can see your profile and activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              { value: 'public', label: 'Public', description: 'Anyone can see your profile and activity' },
              { value: 'friends_only', label: 'Friends Only', description: 'Only your connections can see your profile' },
              { value: 'private', label: 'Private', description: 'Only you can see your profile details' },
              { value: 'anonymous', label: 'Anonymous', description: 'Participate without revealing your identity' }
            ].map((option) => (
              <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="profileVisibility"
                  value={option.value}
                  checked={profileVisibility === option.value}
                  onChange={(e) => setProfileVisibility(e.target.value)}
                  className="mt-1 h-4 w-4 text-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Sharing Preferences */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Data Sharing</CardTitle>
          <CardDescription>
            Choose how your data is used for insights and improvements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              { value: 'none', label: 'None', description: 'No data sharing for analytics or research' },
              { value: 'analytics_only', label: 'Analytics Only', description: 'Share anonymous data for platform insights' },
              { value: 'research', label: 'Research', description: 'Allow data for academic and community research' },
              { value: 'full', label: 'Full', description: 'Share data for all insights and improvements' }
            ].map((option) => (
              <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="dataSharing"
                  value={option.value}
                  checked={dataSharing === option.value}
                  onChange={(e) => setDataSharing(e.target.value)}
                  className="mt-1 h-4 w-4 text-blue-600"
                />
                <div>
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentSection('philosophy')}>
          Back to Philosophy
        </Button>
        <Button onClick={() => setCurrentSection('preview')} size="lg">
          See Your Settings
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )

  const renderPreviewSection = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Privacy Settings</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Here's how your privacy settings will work. You can change these anytime.
        </p>
      </div>

      {/* Settings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                {React.createElement(privacyLevels[privacyLevel as keyof typeof privacyLevels].icon, { 
                  className: "h-5 w-5 text-blue-600" 
                })}
              </div>
              <div>
                <CardTitle className="text-lg">Privacy Level</CardTitle>
                <CardDescription>{privacyLevels[privacyLevel as keyof typeof privacyLevels].label}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {privacyLevels[privacyLevel as keyof typeof privacyLevels].description}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Profile Visibility</CardTitle>
                <CardDescription className="capitalize">{profileVisibility.replace('_', ' ')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {profileVisibility === 'public' && 'Your profile is visible to everyone'}
              {profileVisibility === 'friends_only' && 'Only your connections can see your profile'}
              {profileVisibility === 'private' && 'Only you can see your profile details'}
              {profileVisibility === 'anonymous' && 'You participate without revealing your identity'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Data Sharing</CardTitle>
                <CardDescription className="capitalize">{dataSharing.replace('_', ' ')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {dataSharing === 'none' && 'No data is shared for analytics or research'}
              {dataSharing === 'analytics_only' && 'Anonymous data is used for platform insights'}
              {dataSharing === 'research' && 'Data may be used for academic and community research'}
              {dataSharing === 'full' && 'Data is used for all insights and improvements'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Privacy Commitment */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Our Privacy Commitment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <h4 className="font-semibold mb-2">We Promise:</h4>
              <ul className="space-y-1">
                <li>• Never sell your personal data</li>
                <li>• Always ask before sharing</li>
                <li>• Provide clear data controls</li>
                <li>• Respect your privacy choices</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">You Can Always:</h4>
              <ul className="space-y-1">
                <li>• Change your privacy settings</li>
                <li>• Export your data</li>
                <li>• Delete your account</li>
                <li>• Contact us about privacy</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentSection('controls')}>
          Back to Controls
        </Button>
        <Button onClick={handleNext} size="lg" className="text-lg px-8 py-3">
          Continue to Platform Tour
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {currentSection === 'philosophy' && renderPhilosophySection()}
      {currentSection === 'controls' && renderControlsSection()}
      {currentSection === 'preview' && renderPreviewSection()}
    </div>
  )
}
