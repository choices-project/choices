'use client'

import { useState } from 'react'
import { Vote, BarChart3, Users, ArrowRight, ArrowLeft, CheckCircle, Play, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface FirstExperienceStepProps {
  data: any
  onUpdate: (updates: any) => void
  onNext: () => void
  onBack: () => void
}

type ExperienceSection = 'overview' | 'demo-poll' | 'voting' | 'results' | 'complete'

export default function FirstExperienceStep({ data, onUpdate, onNext, onBack }: FirstExperienceStepProps) {
  const [currentSection, setCurrentSection] = useState<ExperienceSection>('overview')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)

  const demoPollData = {
    question: "What's your favorite way to stay informed about current events?",
    options: [
      { id: 'social', text: 'Social Media', votes: 42, percentage: 35 },
      { id: 'news', text: 'Traditional News Sites', votes: 38, percentage: 32 },
      { id: 'podcasts', text: 'Podcasts', votes: 25, percentage: 21 },
      { id: 'other', text: 'Other Sources', votes: 15, percentage: 12 }
    ],
    totalVotes: 120
  }

  const handleVote = () => {
    if (selectedOption) {
      setHasVoted(true)
      onUpdate({ 
        firstVote: selectedOption,
        firstExperienceCompleted: true 
      })
    }
  }

  const handleNext = () => {
    onUpdate({ firstExperienceCompleted: true })
    onNext()
  }

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">Your First Experience</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Let's walk through creating and voting in a poll. This will help you understand how the platform works.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center">
          <CardHeader>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Vote className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">Create a Poll</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Design engaging questions with multiple choice options
            </p>
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Choose poll type</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Set privacy controls</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Share with others</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-lg">Vote Securely</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Cast your vote with confidence and privacy
            </p>
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Anonymous voting</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>One vote per person</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Secure verification</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Eye className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle className="text-lg">See Results</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              View real-time results and insights
            </p>
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Live updates</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Beautiful charts</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Privacy protected</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button onClick={() => setCurrentSection('demo-poll')} size="lg">
          Start Demo
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderDemoPoll = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Demo Poll</h3>
        <p className="text-gray-600">Let's look at an example poll to see how it works</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5 text-blue-600" />
            Sample Poll
          </CardTitle>
          <CardDescription>
            This is what a typical poll looks like on the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">
              {demoPollData.question}
            </h4>
            
            <div className="space-y-3">
              {demoPollData.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    name="demo-poll"
                    id={option.id}
                    value={option.id}
                    checked={selectedOption === option.id}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="text-blue-600"
                  />
                  <label htmlFor={option.id} className="flex-1 cursor-pointer">
                    <div className="font-medium">{option.text}</div>
                  </label>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Total votes: {demoPollData.totalVotes}</span>
              <span>Poll ends in 3 days</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between max-w-2xl mx-auto">
        <Button variant="outline" onClick={() => setCurrentSection('overview')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button 
          onClick={() => setCurrentSection('voting')}
          disabled={!selectedOption}
        >
          Continue to Voting
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderVoting = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Cast Your Vote</h3>
        <p className="text-gray-600">Experience the secure voting process</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Voting Process
          </CardTitle>
          <CardDescription>
            Your vote is secure and anonymous
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">Your Selection</div>
                  <div className="text-sm text-blue-700">
                    {demoPollData.options.find(opt => opt.id === selectedOption)?.text}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">Vote Verification</div>
                  <div className="text-sm text-gray-600">Ensuring one vote per person</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Privacy Protection</div>
                  <div className="text-sm text-gray-600">Your vote is anonymous</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium">Secure Submission</div>
                  <div className="text-sm text-gray-600">Encrypted vote transmission</div>
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleVote}
            className="w-full"
            size="lg"
          >
            Cast My Vote
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-between max-w-2xl mx-auto">
        <Button variant="outline" onClick={() => setCurrentSection('demo-poll')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button 
          onClick={() => setCurrentSection('results')}
          disabled={!hasVoted}
        >
          View Results
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderResults = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Poll Results</h3>
        <p className="text-gray-600">See how the community voted</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            Live Results
          </CardTitle>
          <CardDescription>
            Real-time results with privacy protection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">
              {demoPollData.question}
            </h4>
            
            <div className="space-y-3">
              {demoPollData.options.map((option) => (
                <div key={option.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option.text}</span>
                    <span className="text-sm text-gray-600">{option.votes} votes ({option.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${option.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t">
              <span>Total votes: {demoPollData.totalVotes}</span>
              <span>Updated just now</span>
            </div>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg animate-bounce">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-900">Vote Recorded!</div>
                <div className="text-sm text-green-700">
                  Your vote has been securely recorded and is included in these results.
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-green-600">
              🎉 Congratulations on your first vote! You're now ready to participate in polls.
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between max-w-2xl mx-auto">
        <Button variant="outline" onClick={() => setCurrentSection('voting')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={() => setCurrentSection('complete')}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderComplete = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Experience Complete!</h3>
        <p className="text-gray-600">You've successfully completed your first poll experience</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            What You've Learned
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Vote className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">Poll Creation</div>
                <div className="text-sm text-gray-600">How to design and structure polls</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium">Secure Voting</div>
                <div className="text-sm text-gray-600">Anonymous and verified voting process</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Eye className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="font-medium">Results Viewing</div>
                <div className="text-sm text-gray-600">Real-time results with privacy protection</div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Ready to get started?</p>
              <p>You can now create your own polls, vote on others' polls, and explore the full platform!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between max-w-2xl mx-auto">
        <Button variant="outline" onClick={() => setCurrentSection('results')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleNext}>
          Complete Onboarding
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (currentSection) {
      case 'overview':
        return renderOverview()
      case 'demo-poll':
        return renderDemoPoll()
      case 'voting':
        return renderVoting()
      case 'results':
        return renderResults()
      case 'complete':
        return renderComplete()
      default:
        return renderOverview()
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {renderContent()}
    </div>
  )
}
