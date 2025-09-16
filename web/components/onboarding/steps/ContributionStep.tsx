'use client'

import { useState } from 'react'
import { 
  Github, 
  Heart, 
  Users, 
  Code, 
  BookOpen, 
  Bug, 
  Share2, 
  ArrowRight, 
  ArrowLeft,
  ExternalLink,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ContributionStepProps {
  data: any
  onUpdate: (updates: {
    contributionInterests?: string[]
    contributionStepCompleted?: boolean
  }) => void
  onNext: () => void
  onBack: () => void
}

export default function ContributionStep({ data, onUpdate, onNext, onBack }: ContributionStepProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(data.contributionInterests || [])
  const [currentSection, setCurrentSection] = useState<'overview' | 'interests' | 'complete'>('overview')

  const contributionOptions = [
    {
      id: 'code',
      title: 'Code Development',
      description: 'Help build features, fix bugs, and improve the platform',
      icon: <Code className="h-6 w-6" />,
      color: 'bg-green-100 text-green-600',
      skills: ['React', 'TypeScript', 'Node.js', 'Supabase', 'APIs'],
      examples: ['Add new features', 'Fix bugs', 'Improve performance', 'Add tests']
    },
    {
      id: 'documentation',
      title: 'Documentation',
      description: 'Help others understand and use the platform',
      icon: <BookOpen className="h-6 w-6" />,
      color: 'bg-blue-100 text-blue-600',
      skills: ['Writing', 'Technical docs', 'User guides', 'Tutorials'],
      examples: ['Write user guides', 'Create tutorials', 'Improve docs', 'Translate content']
    },
    {
      id: 'testing',
      title: 'Testing & QA',
      description: 'Help ensure the platform works perfectly',
      icon: <Bug className="h-6 w-6" />,
      color: 'bg-purple-100 text-purple-600',
      skills: ['Testing', 'QA', 'User feedback', 'Bug reports'],
      examples: ['Test new features', 'Report bugs', 'User testing', 'Quality assurance']
    },
    {
      id: 'community',
      title: 'Community Building',
      description: 'Help grow and support our community',
      icon: <Users className="h-6 w-6" />,
      color: 'bg-orange-100 text-orange-600',
      skills: ['Community', 'Social media', 'Events', 'Outreach'],
      examples: ['Moderate forums', 'Organize events', 'Social media', 'User support']
    },
    {
      id: 'sharing',
      title: 'Sharing & Outreach',
      description: 'Help spread the word about democratic reform',
      icon: <Share2 className="h-6 w-6" />,
      color: 'bg-pink-100 text-pink-600',
      skills: ['Social media', 'Content creation', 'Outreach', 'Advocacy'],
      examples: ['Share on social media', 'Create content', 'Tell friends', 'Advocate for reform']
    }
  ]

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interestId)) {
        return prev.filter(id => id !== interestId)
      } else {
        return [...prev, interestId]
      }
    })
  }

  const handleNext = () => {
    onUpdate({
      contributionInterests: selectedInterests,
      contributionStepCompleted: true
    })
    onNext()
  }

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">Help Build the Democratic Revolution</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          This is an open source project fighting for democracy. Every contribution helps level the playing field!
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-2xl mx-auto">
          <p className="text-sm text-green-800">
            <strong>Why contribute?</strong> We're building the most comprehensive democratic accountability system ever created. 
            Your help makes it possible to expose "bought off" politicians and give equal voice to all candidates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contributionOptions.map((option) => (
          <Card key={option.id} className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className={`w-12 h-12 ${option.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                {option.icon}
              </div>
              <CardTitle className="text-lg">{option.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                {option.description}
              </p>
              <div className="space-y-2 text-left">
                <div className="text-xs font-medium text-gray-700">Skills needed:</div>
                <div className="flex flex-wrap gap-1">
                  {option.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center space-y-3">
        <Button onClick={() => setCurrentSection('interests')} size="lg">
          Tell us how you'd like to help
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <div>
          <button 
            onClick={handleNext}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Skip for now - I'll contribute later
          </button>
        </div>
      </div>
    </div>
  )

  const renderInterests = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">How would you like to contribute?</h3>
        <p className="text-gray-600">Select the ways you'd like to help (you can choose multiple)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contributionOptions.map((option) => (
          <div
            key={option.id}
            onClick={() => toggleInterest(option.id)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedInterests.includes(option.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`w-8 h-8 ${option.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                {option.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{option.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                <div className="text-xs text-gray-500">
                  <div className="font-medium mb-1">Examples:</div>
                  <ul className="space-y-1">
                    {option.examples.map((example) => (
                      <li key={example}>• {example}</li>
                    ))}
                  </ul>
                </div>
              </div>
              {selectedInterests.includes(option.id) && (
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <div>• We'll send you relevant contribution opportunities</div>
          <div>• You'll get access to our contributor community</div>
          <div>• We'll recognize your contributions publicly (if you want)</div>
          <div>• You can change your preferences anytime</div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentSection('overview')}>
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
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Contribution Summary</h3>
        <p className="text-gray-600">Here's how you'd like to help build the democratic revolution</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-600" />
            Your Contribution Interests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedInterests.length > 0 ? (
            <div className="space-y-3">
              {selectedInterests.map((interestId) => {
                const option = contributionOptions.find(opt => opt.id === interestId)
                return option ? (
                  <div key={interestId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-8 h-8 ${option.color} rounded-lg flex items-center justify-center`}>
                      {option.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{option.title}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </div>
                  </div>
                ) : null
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No contribution interests selected</p>
              <p className="text-sm">You can always change this later in your profile</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h4 className="font-semibold text-green-900 mb-3 flex items-center">
          <Github className="w-5 h-5 mr-2" />
          Ready to get started?
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-green-900 mb-2">For Developers</h5>
            <div className="space-y-2 text-sm text-green-800">
              <div>• Check out our GitHub repository</div>
              <div>• Read our contribution guidelines</div>
              <div>• Join our developer Discord</div>
              <div>• Pick up a "good first issue"</div>
            </div>
            <Button size="sm" className="mt-3 w-full">
              <Github className="w-4 h-4 mr-2" />
              View on GitHub
            </Button>
          </div>
          
          <div>
            <h5 className="font-medium text-green-900 mb-2">For Everyone</h5>
            <div className="space-y-2 text-sm text-green-800">
              <div>• Join our community Discord</div>
              <div>• Follow us on social media</div>
              <div>• Share with friends and family</div>
              <div>• Report bugs and suggest features</div>
            </div>
            <Button size="sm" variant="outline" className="mt-3 w-full">
              <Users className="w-4 h-4 mr-2" />
              Join Community
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentSection('interests')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleNext}>
          Complete Setup
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (currentSection) {
      case 'overview':
        return renderOverview()
      case 'interests':
        return renderInterests()
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
