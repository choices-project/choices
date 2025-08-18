'use client'

import { useAuth } from '@/contexts/AuthContext'
import { devLog } from '@/lib/logger';
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Trash2, Save, Info, CheckCircle, AlertCircle, Settings, Target, Zap } from 'lucide-react'

interface PollOption {
  id: string
  text: string
  description?: string
}

interface VotingMethod {
  type: 'single' | 'approval' | 'ranked' | 'range' | 'quadratic'
  name: string
  description: string
  bestFor: string[]
  tips: string[]
  icon: string
  color: string
  realTimeAnalysis: boolean
}

const VOTING_METHODS: VotingMethod[] = [
  {
    type: 'single',
    name: 'Single Choice',
    description: 'Voters select one option. Highest vote count wins.',
    bestFor: ['Quick decisions', 'Binary choices', 'Simple polls', 'Yes/No questions', 'Political favorability'],
    tips: [
      'Best for straightforward decisions',
      'Perfect for approval/disapproval tracking',
      'Excellent for real-time political analysis',
      'Avoid when you have many similar options'
    ],
    icon: '🎯',
    color: 'blue',
    realTimeAnalysis: true
  },
  {
    type: 'approval',
    name: 'Approval Voting',
    description: 'Voters can approve multiple options. Most approvals wins.',
    bestFor: ['Multi-candidate elections', 'Consensus building', 'Committee selection', 'Preference expression'],
    tips: [
      'Great for finding broadly acceptable options',
      'Prevents vote splitting between similar choices',
      'Encourages consensus over polarization',
      'Good for primary elections'
    ],
    icon: '✅',
    color: 'green',
    realTimeAnalysis: true
  },
  {
    type: 'ranked',
    name: 'Ranked Choice',
    description: 'Voters rank options by preference. Eliminates lowest until majority winner.',
    bestFor: ['Elections', 'Preference-based decisions', 'Multi-round scenarios', 'Fair representation'],
    tips: [
      'Ensures majority support for the winner',
      'Prevents vote splitting and spoiler effects',
      'More complex counting but fairer results',
      'Best for important decisions with multiple options'
    ],
    icon: '🏆',
    color: 'purple',
    realTimeAnalysis: false
  },
  {
    type: 'range',
    name: 'Range Voting',
    description: 'Voters rate each option on a scale. Highest average rating wins.',
    bestFor: ['Satisfaction surveys', 'Product ratings', 'Preference intensity', 'Detailed feedback', 'Political sentiment'],
    tips: [
      'Captures intensity of preference',
      'Good for measuring satisfaction levels',
      'Provides detailed feedback on each option',
      'Excellent for political sentiment tracking'
    ],
    icon: '📊',
    color: 'yellow',
    realTimeAnalysis: true
  },
  {
    type: 'quadratic',
    name: 'Quadratic Voting',
    description: 'Voters allocate credits with quadratic cost. Prevents majority tyranny.',
    bestFor: ['Budget allocation', 'Resource distribution', 'Governance decisions', 'Complex trade-offs'],
    tips: [
      'Prevents majority from dominating decisions',
      'Encourages thoughtful voting on important issues',
      'Requires credit system setup',
      'Best for complex decisions with trade-offs'
    ],
    icon: '💰',
    color: 'pink',
    realTimeAnalysis: false
  }
]

export default function CreatePollPage() {
  const { loading } = useAuth()
  const router = useRouter()
  
  const [step, setStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Poll data
  const [pollData, setPollData] = useState({
    title: '',
    description: '',
    votingMethod: 'single' as VotingMethod['type'],
    options: [
      { id: '1', text: '', description: '' },
      { id: '2', text: '', description: '' }
    ] as PollOption[],
    settings: {
      allowAbstention: false,
      requireAllRanks: false,
      minSelections: 1,
      maxSelections: 1,
      rangeMin: 0,
      rangeMax: 10,
      quadraticCredits: 100,
      isPublic: true,
      allowComments: true,
      showResults: true,
      requireVerification: false,
      enableRealTimeAnalysis: true,
      allowAnonymousVoting: false,
      requireEmailVerification: false
    },
    schedule: {
      startDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endTime: '18:00'
    },
    categories: [] as string[],
    tags: [] as string[]
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirectTo=/polls/create')
    }
  }, [user, loading, router])

  const addOption = () => {
    const newId = (pollData.options.length + 1).toString()
    setPollData(prev => ({
      ...prev,
      options: [...prev.options, { id: newId, text: '', description: '' }]
    }))
  }

  const removeOption = (id: string) => {
    if (pollData.options.length <= 2) return
    setPollData(prev => ({
      ...prev,
      options: prev.options.filter(option => option.id !== id)
    }))
  }

  const updateOption = (id: string, field: 'text' | 'description', value: string) => {
    setPollData(prev => ({
      ...prev,
      options: prev.options.map(option =>
        option.id === id ? { ...option, [field]: value } : option
      )
    }))
  }

  const getCurrentMethod = () => {
    return VOTING_METHODS.find(method => method.type === pollData.votingMethod)!
  }

  const validatePoll = () => {
    if (!pollData.title.trim()) {
      setError('Poll title is required')
      return false
    }
    
    if (pollData.options.length < 2) {
      setError('At least 2 options are required')
      return false
    }

    const emptyOptions = pollData.options.filter(option => !option.text.trim())
    if (emptyOptions.length > 0) {
      setError('All options must have text')
      return false
    }

    const startDate = new Date(`${pollData.schedule.startDate}T${pollData.schedule.startTime}`)
    const endDate = new Date(`${pollData.schedule.endDate}T${pollData.schedule.endTime}`)
    
    if (endDate <= startDate) {
      setError('End date must be after start date')
      return false
    }

    return true
  }

  const handleCreatePoll = async () => {
    if (!validatePoll()) return

    setIsCreating(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pollData)
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess('Poll created successfully!')
        setTimeout(() => {
          router.push(`/polls/${data.poll.id}`)
        }, 1500)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create poll')
      }
    } catch (error: any) {
      devLog('Error creating poll:', error)
      setError(error.message || 'Failed to create poll')
    } finally {
      setIsCreating(false)
    }
  }

  const nextStep = () => {
    if (step === 1 && !pollData.title.trim()) {
      setError('Poll title is required')
      return
    }
    setStep(prev => Math.min(prev + 1, 5))
    setError(null)
  }

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1))
    setError(null)
  }

  const addTag = (tag: string) => {
    if (tag.trim() && !pollData.tags.includes(tag.trim())) {
      setPollData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }))
    }
  }

  const removeTag = (tagToRemove: string) => {
    setPollData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create Your Poll</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            {[1, 2, 3, 4, 5].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step >= stepNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {stepNumber}
                </div>
                {stepNumber < 5 && (
                  <div className={`
                    w-12 h-1 mx-2
                    ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
            <div className="ml-4 text-sm text-gray-600">
              Step {step} of 5
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <p className="text-green-800">{success}</p>
            </div>
          </div>
        )}

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poll Title *
                  </label>
                  <input
                    type="text"
                    value={pollData.title}
                    onChange={(e) => setPollData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="What would you like to ask?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={pollData.description}
                    onChange={(e) => setPollData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Provide additional context or details..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {pollData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add tags (press Enter to add)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag(e.currentTarget.value)
                        e.currentTarget.value = ''
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next: Choose Voting Method
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Voting Method */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Choose Your Voting Method</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {VOTING_METHODS.map((method) => (
                  <div
                    key={method.type}
                    onClick={() => setPollData(prev => ({ ...prev, votingMethod: method.type }))}
                    className={`
                      p-6 border-2 rounded-xl cursor-pointer transition-all
                      ${pollData.votingMethod === method.type
                        ? `border-${method.color}-500 bg-${method.color}-50`
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-start space-x-4">
                      <span className="text-3xl">{method.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{method.name}</h3>
                          {method.realTimeAnalysis && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Real-time
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{method.description}</p>
                        
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Perfect for:</p>
                          <div className="flex flex-wrap gap-1">
                            {method.bestFor.map((useCase, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                              >
                                {useCase}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-1">Pro tips:</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {method.tips.map((tip, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-blue-500 mr-1">•</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next: Add Options
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Poll Options */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Poll Options</h2>
                <button
                  onClick={addOption}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Option</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {pollData.options.map((option, index) => (
                  <div key={option.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Option {index + 1} *
                          </label>
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => updateOption(option.id, 'text', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={`Option ${index + 1}`}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description (optional)
                          </label>
                          <input
                            type="text"
                            value={option.description || ''}
                            onChange={(e) => updateOption(option.id, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Brief description..."
                          />
                        </div>
                      </div>
                      
                      {pollData.options.length > 2 && (
                        <button
                          onClick={() => removeOption(option.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Voting Method: {getCurrentMethod().name}</p>
                    <p className="text-sm text-blue-700 mt-1">
                      {getCurrentMethod().description}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next: Settings & Schedule
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Settings & Schedule */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Poll Settings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Poll Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Public Poll</h4>
                      <p className="text-sm text-gray-600">Anyone can view and vote</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pollData.settings.isPublic}
                        onChange={(e) => setPollData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, isPublic: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Show Results</h4>
                      <p className="text-sm text-gray-600">Display results to voters</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pollData.settings.showResults}
                        onChange={(e) => setPollData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, showResults: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Allow Comments</h4>
                      <p className="text-sm text-gray-600">Voters can add comments</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pollData.settings.allowComments}
                        onChange={(e) => setPollData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, allowComments: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Real-time Analysis</h4>
                      <p className="text-sm text-gray-600">Live results and trends</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pollData.settings.enableRealTimeAnalysis}
                        onChange={(e) => setPollData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, enableRealTimeAnalysis: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Schedule</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date & Time
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={pollData.schedule.startDate}
                        onChange={(e) => setPollData(prev => ({
                          ...prev,
                          schedule: { ...prev.schedule, startDate: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="time"
                        value={pollData.schedule.startTime}
                        onChange={(e) => setPollData(prev => ({
                          ...prev,
                          schedule: { ...prev.schedule, startTime: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date & Time
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={pollData.schedule.endDate}
                        onChange={(e) => setPollData(prev => ({
                          ...prev,
                          schedule: { ...prev.schedule, endDate: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="time"
                        value={pollData.schedule.endTime}
                        onChange={(e) => setPollData(prev => ({
                          ...prev,
                          schedule: { ...prev.schedule, endTime: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next: Review & Create
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Review & Create */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Your Poll</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Poll Summary */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Poll Details</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-700">Title:</span>
                      <p className="text-gray-900">{pollData.title}</p>
                    </div>
                    {pollData.description && (
                      <div>
                        <span className="font-medium text-gray-700">Description:</span>
                        <p className="text-gray-900">{pollData.description}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700">Voting Method:</span>
                      <p className="text-gray-900">{getCurrentMethod().name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Options:</span>
                      <p className="text-gray-900">{pollData.options.length} options</p>
                    </div>
                  </div>
                </div>

                {/* Settings Summary */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Settings</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-700">Public:</span>
                      <span className={pollData.settings.isPublic ? 'text-green-600' : 'text-red-600'}>
                        {pollData.settings.isPublic ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-700">Show Results:</span>
                      <span className={pollData.settings.showResults ? 'text-green-600' : 'text-red-600'}>
                        {pollData.settings.showResults ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-700">Real-time Analysis:</span>
                      <span className={pollData.settings.enableRealTimeAnalysis ? 'text-green-600' : 'text-red-600'}>
                        {pollData.settings.enableRealTimeAnalysis ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-700">Allow Comments:</span>
                      <span className={pollData.settings.allowComments ? 'text-green-600' : 'text-red-600'}>
                        {pollData.settings.allowComments ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Options Preview */}
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Options Preview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pollData.options.map((option, index) => (
                    <div key={option.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="font-medium text-gray-900">{option.text}</div>
                      {option.description && (
                        <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreatePoll}
                disabled={isCreating}
                className={`
                  flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors
                  ${isCreating 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                  }
                `}
              >
                <Save className="w-4 h-4" />
                <span>{isCreating ? 'Creating Poll...' : 'Create Poll'}</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
