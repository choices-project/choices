'use client'

import { useState, useEffect } from 'react'
import { Shield, Vote, Users, BarChart3, ArrowRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface WelcomeStepProps {
  data: any
  onUpdate: (updates: any) => void
  onNext: () => void
}

export default function WelcomeStep({ data, onUpdate, onNext }: WelcomeStepProps) {
  const [currentSection, setCurrentSection] = useState<'welcome' | 'value' | 'preview'>('welcome')
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    // Start onboarding when component mounts
    if (!hasStarted) {
      setHasStarted(true)
      onUpdate({ welcomeStarted: true })
    }
  }, [hasStarted, onUpdate])

  const handleGetStarted = () => {
    onUpdate({ welcomeCompleted: true })
    onNext()
  }

  const renderWelcomeSection = () => (
    <div className="text-center space-y-8" data-testid="welcome-section">
      {/* Hero Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Shield className="h-8 w-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 animate-fade-in">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Choices</span>
        </h1>
        
        <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-fade-in-delay">
          Your voice matters, but your privacy matters more. 
          Join a platform built on trust, transparency, and democratic participation.
        </p>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 mt-8">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Trusted by 10,000+ users</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span>GDPR compliant</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            <span>SOC 2 certified</span>
          </div>
        </div>
      </div>

      {/* Privacy Promise */}
      <Card className="max-w-2xl mx-auto border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Our Privacy Promise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">We Promise:</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Never sell your personal data</li>
                <li>• Always ask before sharing</li>
                <li>• Provide clear data controls</li>
                <li>• Respect your privacy choices</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">You Control:</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• What's visible to others</li>
                <li>• How your data is used</li>
                <li>• When to delete your data</li>
                <li>• Your participation level</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <div className="space-y-4">
        <Button onClick={() => setCurrentSection('value')} size="lg" className="text-lg px-8 py-3">
          Learn More About Your Experience
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        
        <p className="text-sm text-gray-500">
          This onboarding will take about 5-7 minutes and will help you understand how to use the platform safely and effectively.
        </p>
      </div>
    </div>
  )

  const renderValueSection = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">What You'll Experience</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover how Choices empowers you to participate in democratic decision-making 
          while maintaining complete control over your privacy.
        </p>
      </div>

      {/* Value Propositions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Vote className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Democratic Participation</CardTitle>
            <CardDescription>
              Create and participate in polls that matter to your community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Create meaningful polls</li>
              <li>• Vote on important issues</li>
              <li>• See real-time results</li>
              <li>• Track community trends</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Privacy by Design</CardTitle>
            <CardDescription>
              Built with your privacy and security as core principles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• End-to-end encryption</li>
              <li>• Granular privacy controls</li>
              <li>• No hidden tracking</li>
              <li>• Data minimization</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle>Insights & Analytics</CardTitle>
            <CardDescription>
              Understand trends and make informed decisions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Privacy-preserving analytics</li>
              <li>• Community insights</li>
              <li>• Trend visualization</li>
              <li>• Informed decision making</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle>Community Building</CardTitle>
            <CardDescription>
              Connect with like-minded individuals and build meaningful discussions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Respectful discussions</li>
              <li>• Community guidelines</li>
              <li>• Inclusive participation</li>
              <li>• Collective insights</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <Play className="h-6 w-6 text-indigo-600" />
            </div>
            <CardTitle>Interactive Experience</CardTitle>
            <CardDescription>
              Enjoy a modern, responsive interface designed for all devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Mobile-optimized</li>
              <li>• Real-time updates</li>
              <li>• Smooth animations</li>
              <li>• Intuitive design</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-pink-600" />
            </div>
            <CardTitle>Transparent & Trustworthy</CardTitle>
            <CardDescription>
              Open about our practices and committed to earning your trust
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Clear data practices</li>
              <li>• Open communication</li>
              <li>• User feedback loop</li>
              <li>• Continuous improvement</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentSection('welcome')}>
          Back to Welcome
        </Button>
        <Button onClick={() => setCurrentSection('preview')} size="lg">
          See What You'll Learn
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )

  const renderPreviewSection = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Onboarding Journey</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Here's what you'll learn and set up during your onboarding experience.
        </p>
      </div>

      {/* Journey Steps */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🔒</span>
                </div>
                <div>
                  <CardTitle className="text-lg">Privacy Philosophy</CardTitle>
                  <CardDescription>Learn about our privacy-first approach</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Understand how we protect your data and give you control over your privacy settings.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🎯</span>
                </div>
                <div>
                  <CardTitle className="text-lg">Platform Tour</CardTitle>
                  <CardDescription>See how the platform works</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Interactive demo of creating polls, voting, and viewing results.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📊</span>
                </div>
                <div>
                  <CardTitle className="text-lg">Data Usage</CardTitle>
                  <CardDescription>Understand how data is used</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Learn about privacy-preserving analytics and community insights.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🔐</span>
                </div>
                <div>
                  <CardTitle className="text-lg">Security Setup</CardTitle>
                  <CardDescription>Secure your account</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Set up authentication and security features for your account.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">👤</span>
                </div>
                <div>
                  <CardTitle className="text-lg">Profile Setup</CardTitle>
                  <CardDescription>Customize your profile</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Set your privacy preferences and customize your profile visibility.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🚀</span>
                </div>
                <div>
                  <CardTitle className="text-lg">First Experience</CardTitle>
                  <CardDescription>Create your first poll</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Guided experience creating your first poll and participating in others.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Final CTA */}
      <div className="text-center space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Get Started?</h3>
          <p className="text-gray-600 mb-4">
            You're about to begin a journey that will help you understand how to use Choices 
            safely, effectively, and in a way that respects your privacy.
          </p>
          <Button onClick={handleGetStarted} size="lg" className="text-lg px-8 py-3">
            Begin Your Journey
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
        
        <p className="text-sm text-gray-500">
          You can pause and resume this onboarding at any time. Your progress will be saved automatically.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={() => setCurrentSection('value')}>
          Back to Features
        </Button>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      {currentSection === 'welcome' && renderWelcomeSection()}
      {currentSection === 'value' && renderValueSection()}
      {currentSection === 'preview' && renderPreviewSection()}
    </div>
  )
}
