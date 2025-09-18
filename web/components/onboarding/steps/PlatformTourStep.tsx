'use client'

import { useState } from 'react'
import { Vote, BarChart3, Users, Settings, ArrowRight, ArrowLeft, Eye, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type PlatformTourStepProps = {
  data: any
  onUpdate: (_updates: any) => void
  onNext: () => void
  onBack: () => void
}

type TourSection = 'overview' | 'polls' | 'voting' | 'results' | 'analytics'

export default function PlatformTourStep({ onUpdate, onNext }: PlatformTourStepProps) {
  const [currentSection, setCurrentSection] = useState<TourSection>('overview')
  const [completedSections, setCompletedSections] = useState<TourSection[]>([])

  const handleSectionComplete = (section: TourSection) => {
    if (!completedSections.includes(section)) {
      setCompletedSections([...completedSections, section])
    }
  }

  const handleNext = () => {
    onUpdate({ 
      platformTourCompleted: true,
      completedSections: completedSections
    })
    onNext()
  }

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">Platform Tour</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Let's explore the key features that make Choices a powerful and privacy-focused polling platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => setCurrentSection('polls')}>
          <CardHeader>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Vote className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">Create Polls</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Design engaging polls with privacy controls</p>
          </CardContent>
        </Card>

        <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setCurrentSection('voting')}>
          <CardHeader>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-lg">Vote Securely</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Cast votes with confidence and anonymity</p>
          </CardContent>
        </Card>

        <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setCurrentSection('results')}>
          <CardHeader>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Eye className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle className="text-lg">View Results</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">See real-time results and insights</p>
          </CardContent>
        </Card>

        <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setCurrentSection('analytics')}>
          <CardHeader>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-lg">Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Understand trends and patterns</p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button onClick={() => setCurrentSection('polls')} size="lg">
          Start Tour
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderPollsSection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Create Engaging Polls</h3>
        <p className="text-gray-600">Design polls that respect privacy while gathering meaningful insights</p>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Vote className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Poll Creation Features</CardTitle>
              <CardDescription>Everything you need to create effective polls</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Poll Types</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Single Choice</Badge>
                  <span className="text-sm text-gray-600">Traditional voting</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Multiple Choice</Badge>
                  <span className="text-sm text-gray-600">Select multiple options</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Ranked Choice</Badge>
                  <span className="text-sm text-gray-600">Preference ordering</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Open Response</Badge>
                  <span className="text-sm text-gray-600">Text-based answers</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Privacy Controls</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Anonymous voting</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Data retention limits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Granular permissions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Export controls</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentSection('overview')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={() => {
          handleSectionComplete('polls')
          setCurrentSection('voting')
        }}>
          Next: Voting
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderVotingSection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Secure Voting Experience</h3>
        <p className="text-gray-600">Cast your vote with confidence knowing your privacy is protected</p>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle>Voting Features</CardTitle>
              <CardDescription>Privacy-first voting with multiple authentication options</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Authentication Options</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">1</span>
                  </div>
                  <div>
                    <div className="font-medium">Email Verification</div>
                    <div className="text-sm text-gray-600">One-time code sent to your email</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-green-600">2</span>
                  </div>
                  <div>
                    <div className="font-medium">Social Login</div>
                    <div className="text-sm text-gray-600">Google, Apple, or other providers</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-purple-600">3</span>
                  </div>
                  <div>
                    <div className="font-medium">Anonymous Voting</div>
                    <div className="text-sm text-gray-600">No account required</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Security Features</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">End-to-end encryption</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">One vote per person</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Vote verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Audit trail</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentSection('polls')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={() => {
          handleSectionComplete('voting')
          setCurrentSection('results')
        }}>
          Next: Results
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderResultsSection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Real-Time Results</h3>
        <p className="text-gray-600">See how your community votes while maintaining privacy</p>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Eye className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>Results Visualization</CardTitle>
              <CardDescription>Beautiful charts and insights that respect privacy</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Chart Types</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">Bar Charts</div>
                    <div className="text-sm text-gray-600">Perfect for multiple choice polls</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Pie Charts</div>
                    <div className="text-sm text-gray-600">Great for single choice polls</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium">Line Charts</div>
                    <div className="text-sm text-gray-600">Track trends over time</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Privacy Features</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">No individual vote tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Aggregated data only</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Configurable visibility</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Export controls</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentSection('voting')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={() => {
          handleSectionComplete('results')
          setCurrentSection('analytics')
        }}>
          Next: Analytics
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderAnalyticsSection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Analytics & Insights</h3>
        <p className="text-gray-600">Understand trends and patterns while respecting privacy</p>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle>Analytics Features</CardTitle>
              <CardDescription>Privacy-preserving insights and trends</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Insights Available</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">Participation Rates</div>
                    <div className="text-sm text-gray-600">Track engagement over time</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Trend Analysis</div>
                    <div className="text-sm text-gray-600">Identify patterns in responses</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Settings className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium">Custom Reports</div>
                    <div className="text-sm text-gray-600">Generate specific insights</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Privacy Controls</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Differential privacy</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Minimum threshold reporting</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Data anonymization</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">User consent tracking</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentSection('results')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={() => {
          handleSectionComplete('analytics')
          handleNext()
        }} >
          Complete Tour
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (currentSection) {
      case 'overview':
        return renderOverview()
      case 'polls':
        return renderPollsSection()
      case 'voting':
        return renderVotingSection()
      case 'results':
        return renderResultsSection()
      case 'analytics':
        return renderAnalyticsSection()
      default:
        return renderOverview()
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" >
      {renderContent()}
    </div>
  )
}

