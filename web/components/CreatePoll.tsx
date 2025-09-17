'use client';

import React, { useState } from 'react';
import { devLog } from '@/lib/logger';
import { 
  Plus, 
  X, 
  AlertCircle,
  CheckCircle2,
  Save,
  Info,
  ArrowLeft
} from 'lucide-react';
import type { CreatePollRequest } from '@/lib/services/poll-service';
import { pollService } from '@/lib/services/poll-service';

type CreatePollProps = {
  onPollCreated?: (_poll: any) => void;
  onCancel?: () => void;
  isOpen?: boolean;
}

type VotingMethod = {
  type: 'single' | 'approval' | 'ranked' | 'range' | 'quadratic';
  name: string;
  description: string;
  bestFor: string[];
  tips: string[];
  icon: string;
}

const VOTINGMETHODS: VotingMethod[] = [
  {
    type: 'single',
    name: 'Single Choice',
    description: 'Voters select one option. Highest vote count wins.',
    bestFor: ['Quick decisions', 'Binary choices', 'Simple polls', 'Yes/No questions'],
    tips: [
      'Best for straightforward decisions',
      'Avoid when you have many similar options',
      'Consider approval voting for multi-candidate scenarios'
    ],
    icon: '🎯'
  },
  {
    type: 'approval',
    name: 'Approval Voting',
    description: 'Voters can approve multiple options. Most approvals wins.',
    bestFor: ['Multi-candidate elections', 'Consensus building', 'Committee selection', 'Preference expression'],
    tips: [
      'Great for finding broadly acceptable options',
      'Prevents vote splitting between similar choices',
      'Encourages consensus over polarization'
    ],
    icon: '✅'
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
    icon: '🏆'
  },
  {
    type: 'range',
    name: 'Range Voting',
    description: 'Voters rate each option on a scale. Highest average rating wins.',
    bestFor: ['Satisfaction surveys', 'Product ratings', 'Preference intensity', 'Detailed feedback'],
    tips: [
      'Captures intensity of preference',
      'Good for measuring satisfaction levels',
      'Provides detailed feedback on each option',
      'Consider using 0-10 scale for clarity'
    ],
    icon: '📊'
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
    icon: '💰'
  }
];

export const CreatePoll: React.FC<CreatePollProps> = ({
  onPollCreated,
  onCancel,
  isOpen = false
}) => {
  const [step, setStep] = useState(1);

  // Enhanced form data for voting methods
  const [enhancedFormData, setEnhancedFormData] = useState({
    title: '',
    description: '',
    category: '',
    votingMethod: 'single' as VotingMethod['type'],
    options: [
      { id: '1', text: '', description: '' },
      { id: '2', text: '', description: '' }
    ],
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
      privacyLevel: 'public'
    },
    schedule: {
      startDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endTime: '18:00'
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Poll categories for better organization
  const pollCategories = [
    { value: 'climate', label: 'Climate & Environment', icon: '🌍' },
    { value: 'technology', label: 'Technology', icon: '💻' },
    { value: 'education', label: 'Education', icon: '📚' },
    { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
    { value: 'transportation', label: 'Transportation', icon: '🚗' },
    { value: 'privacy', label: 'Privacy & Security', icon: '🔒' },
    { value: 'economy', label: 'Economy', icon: '💰' },
    { value: 'social', label: 'Social Issues', icon: '👥' },
    { value: 'environment', label: 'Environment', icon: '🌱' },
    { value: 'other', label: 'Other', icon: '📋' }
  ];

  const getCurrentMethod = () => {
    return VOTINGMETHODS.find(method => method.type === enhancedFormData.votingMethod)!;
  };

  const addOption = () => {
    if (enhancedFormData.options.length < 10) {
      const newId = (enhancedFormData.options.length + 1).toString();
      setEnhancedFormData(prev => ({
        ...prev,
        options: [...prev.options, { id: newId, text: '', description: '' }]
      }));
    }
  };

  const removeOption = (id: string) => {
    if (enhancedFormData.options.length > 2) {
      setEnhancedFormData(prev => ({
        ...prev,
        options: prev.options.filter(option => option.id !== id)
      }));
    }
  };

  const updateOption = (id: string, field: 'text' | 'description', value: string) => {
    setEnhancedFormData(prev => ({
      ...prev,
      options: prev.options.map(option =>
        option.id === id ? { ...option, [field]: value } : option
      )
    }));
  };

  const validatePoll = () => {
    if (!enhancedFormData.title.trim()) {
      setError('Poll title is required');
      return false;
    }
    
    if (!enhancedFormData.category) {
      setError('Please select a category');
      return false;
    }
    
    if (enhancedFormData.options.length < 2) {
      setError('At least 2 options are required');
      return false;
    }

    const emptyOptions = enhancedFormData.options.filter(option => !option.text.trim());
    if (emptyOptions.length > 0) {
      setError('All options must have text');
      return false;
    }

    const startDate = new Date(`${enhancedFormData.schedule.startDate}T${enhancedFormData.schedule.startTime}`);
    const endDate = new Date(`${enhancedFormData.schedule.endDate}T${enhancedFormData.schedule.endTime}`);
    
    if (endDate <= startDate) {
      setError('End date must be after start date');
      return false;
    }

    return true;
  };

  const handleCreatePoll = async () => {
    if (!validatePoll()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Transform enhanced form data to CreatePollRequest format
      const pollData: CreatePollRequest = {
        title: enhancedFormData.title,
        description: enhancedFormData.description,
        category: enhancedFormData.category,
        options: enhancedFormData.options.map(option => option.text).filter(text => text.trim()),
        privacyLevel: enhancedFormData.settings.privacyLevel || 'public',
        end_time: new Date(`${enhancedFormData.schedule.endDate}T${enhancedFormData.schedule.endTime}`).toISOString(),
        tags: enhancedFormData.settings.allowComments ? ['comments-enabled'] : [],
        sponsors: []
      };

      // Use pollService to create the poll
      const createdPoll = await pollService.createPoll(pollData);

      if (createdPoll) {
        setSuccess(true);
        if (onPollCreated) {
          onPollCreated(createdPoll);
        }
      } else {
        throw new Error('Failed to create poll');
      }
    } catch (error) {
      devLog('Error creating poll:', error);
      setError(error instanceof Error ? error.message : 'Failed to create poll');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
                    if (step === 1 && (!enhancedFormData.title.trim() || !enhancedFormData.category)) {
        setError('Poll title and category are required');
        return;
    }
    setStep(prev => Math.min(prev + 1, 4));
    setError(null);
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={onCancel}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Create Poll</h2>
          <div className="w-24"></div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-50 px-6 py-4">
          <div className="flex items-center">
            {[1, 2, 3, 4].map((stepNumber: any) => (
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
                {stepNumber < 4 && (
                  <div className={`
                    w-16 h-1 mx-2
                    ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
            <div className="ml-4 text-sm text-gray-600">
              Step {step} of 4
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}
        {success && (
          <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
              <p className="text-green-800">Poll created successfully!</p>
            </div>
          </div>
        )}

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Poll Title *
                </label>
                <input
                  type="text"
                  value={enhancedFormData.title}
                  onChange={(e) => setEnhancedFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What would you like to ask?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={enhancedFormData.description}
                  onChange={(e) => setEnhancedFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Provide additional context or details..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={enhancedFormData.category}
                  onChange={(e) => setEnhancedFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  {pollCategories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6">
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
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Choose Voting Method</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {VOTINGMETHODS.map((method: any) => (
                <div
                  key={method.type}
                  onClick={() => setEnhancedFormData(prev => ({ ...prev, votingMethod: method.type }))}
                  className={`
                    p-4 border rounded-lg cursor-pointer transition-all
                    ${enhancedFormData.votingMethod === method.type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{method.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{method.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                      
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">Best for:</p>
                        <div className="flex flex-wrap gap-1">
                          {method.bestFor.map((useCase: any, index: any) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                              {useCase}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">Tips:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {method.tips.map((tip: any, index: any) => (
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

            <div className="flex justify-between mt-6">
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
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Poll Options</h3>
              <button
                onClick={addOption}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Option</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {enhancedFormData.options.map((option: any, index: any) => (
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
                    
                    {enhancedFormData.options.length > 2 && (
                      <button
                        onClick={() => removeOption(option.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
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

            <div className="flex justify-between mt-6">
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
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Settings & Schedule</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Poll Settings */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Poll Settings</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900">Public Poll</h5>
                      <p className="text-sm text-gray-600">Anyone can view and vote</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enhancedFormData.settings.isPublic}
                        onChange={(e) => setEnhancedFormData(prev => ({
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
                      <h5 className="font-medium text-gray-900">Show Results</h5>
                      <p className="text-sm text-gray-600">Display results to voters</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enhancedFormData.settings.showResults}
                        onChange={(e) => setEnhancedFormData(prev => ({
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
                      <h5 className="font-medium text-gray-900">Allow Comments</h5>
                      <p className="text-sm text-gray-600">Voters can add comments</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enhancedFormData.settings.allowComments}
                        onChange={(e) => setEnhancedFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, allowComments: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Schedule</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date & Time
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={enhancedFormData.schedule.startDate}
                        onChange={(e) => setEnhancedFormData(prev => ({
                          ...prev,
                          schedule: { ...prev.schedule, startDate: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="time"
                        value={enhancedFormData.schedule.startTime}
                        onChange={(e) => setEnhancedFormData(prev => ({
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
                        value={enhancedFormData.schedule.endDate}
                        onChange={(e) => setEnhancedFormData(prev => ({
                          ...prev,
                          schedule: { ...prev.schedule, endDate: e.target.value }
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="time"
                        value={enhancedFormData.schedule.endTime}
                        onChange={(e) => setEnhancedFormData(prev => ({
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

            <div className="flex justify-between mt-6">
              <button
                onClick={prevStep}
                className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreatePoll}
                disabled={isSubmitting}
                className={`
                  flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors
                  ${isSubmitting 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                  }
                `}
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Creating Poll...' : 'Create Poll'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePoll;
