'use client';

import { useState } from 'react';

import { 
  usePollWizardData,
  usePollWizardStep,
  usePollWizardErrors,
  usePollWizardCanProceed,
  usePollWizardActions
} from '@/lib/stores';
import { createPoll } from '@/app/actions/create-poll';
import { logger } from '@/lib/utils/logger';

const CATEGORIES = [
  { id: 'general', name: 'General', description: 'General purpose polls', icon: '📊' },
  { id: 'business', name: 'Business', description: 'Business and workplace polls', icon: '💼' },
  { id: 'education', name: 'Education', description: 'Educational and academic polls', icon: '🎓' },
  { id: 'entertainment', name: 'Entertainment', description: 'Entertainment and media polls', icon: '🎬' },
  { id: 'politics', name: 'Politics', description: 'Political and social issues', icon: '🗳️' },
  { id: 'technology', name: 'Technology', description: 'Technology and innovation polls', icon: '💻' },
  { id: 'health', name: 'Health', description: 'Health and wellness polls', icon: '🏥' },
  { id: 'sports', name: 'Sports', description: 'Sports and fitness polls', icon: '⚽' },
  { id: 'food', name: 'Food', description: 'Food and dining polls', icon: '🍕' },
  { id: 'travel', name: 'Travel', description: 'Travel and tourism polls', icon: '✈️' },
  { id: 'fashion', name: 'Fashion', description: 'Fashion and style polls', icon: '👗' },
  { id: 'finance', name: 'Finance', description: 'Finance and money polls', icon: '💰' },
  { id: 'environment', name: 'Environment', description: 'Environmental and sustainability polls', icon: '🌱' },
  { id: 'social', name: 'Social', description: 'Social and community polls', icon: '👥' },
];

export default function CreatePollPage() {
  // Get state from pollWizardStore
  const data = usePollWizardData();
  const currentStep = usePollWizardStep();
  const errors = usePollWizardErrors();
  const canProceed = usePollWizardCanProceed();
  
  // Get actions from pollWizardStore
  const {
    nextStep: storeNextStep,
    prevStep: storePrevStep,
    updateData: storeUpdateData,
    addOption: storeAddOption,
    removeOption: storeRemoveOption,
    updateOption: storeUpdateOption,
    addTag: storeAddTag,
    removeTag: storeRemoveTag,
    validateCurrentStep: storeValidateCurrentStep,
    resetWizard: storeResetWizard
  } = usePollWizardActions();
  
  
  const [newTag, setNewTag] = useState('');
  const totalSteps = 5;
  
  // Enhanced validation with real-time feedback
  const handleValidateCurrentStep = () => {
    storeValidateCurrentStep();
    return canProceed;
  };
  
  
  // Navigation with validation
  const handleNext = () => {
    if (handleValidateCurrentStep() && currentStep < totalSteps - 1) {
      storeNextStep();
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 0) {
      storePrevStep();
    }
  };
  
  // Enhanced form data updates
  const updateFormData = (updates: Partial<typeof data>) => {
    storeUpdateData(updates);
  };
  
  const handleAddOption = () => {
    if (data.options.length < 10) {
      storeAddOption();
    }
  };
  
  const handleRemoveOption = (index: number) => {
    if (data.options.length > 2) {
      storeRemoveOption(index);
    }
  };
  
  const handleUpdateOption = (index: number, value: string) => {
    storeUpdateOption(index, value);
  };
  
  const handleAddTag = (tag: string) => {
    if (tag.trim() && !data.tags.includes(tag.trim()) && data.tags.length < 5 && tag.trim().length <= 50) {
      storeAddTag(tag.trim());
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    storeRemoveTag(tag);
  };
  
  const handleUpdateSettings = (updates: Partial<typeof data.settings>) => {
    storeUpdateData({ settings: { ...(data.settings ?? {}), ...updates } });
  };
  
  const submitPoll = async () => {
    try {
      const newErrors: Record<string, string> = {};
      
      // Final validation for all steps
      if (!data.title.trim()) {
        newErrors.title = 'Title is required';
      } else if (data.title.trim().length < 5) {
        newErrors.title = 'Title must be at least 5 characters';
      } else if (data.title.trim().length > 200) {
        newErrors.title = 'Title must be 200 characters or less';
      }
      if (!data.description.trim()) {
        newErrors.description = 'Description is required';
      } else if (data.description.trim().length < 10) {
        newErrors.description = 'Description must be at least 10 characters';
      } else if (data.description.trim().length > 2000) {
        newErrors.description = 'Description must be 2000 characters or less';
      }
      
      const validOptions = data.options.filter(option => option.trim().length > 0);
      if (validOptions.length < 2) {
        newErrors.options = 'At least 2 options are required';
      } else if (validOptions.length > 10) {
        newErrors.options = 'Maximum 10 options allowed';
      }
      
      // Check individual option length
      for (let i = 0; i < validOptions.length; i++) {
        const option = validOptions[i];
        if (option && option.trim().length > 100) {
          newErrors[`option-${i}`] = 'Each option must be 100 characters or less';
        }
      }
      
      if (!data.category) {
        newErrors.category = 'Please select a category';
      }
      
      // Check tag length
      for (let i = 0; i < data.tags.length; i++) {
        const tag = data.tags[i];
        if (tag && tag.length > 50) {
          newErrors[`tag-${i}`] = 'Each tag must be 50 characters or less';
        }
      }
      
      if (Object.keys(newErrors).length > 0) {
        // Set validation errors in store
        return;
      }
      
      // Create poll using the store action
      const pollData = {
        title: data.title.trim(),
        description: data.description.trim(),
        question: data.title.trim(), // Use title as question for now
        options: validOptions.map((text, index) => ({
          id: `option-${index}`,
          text: text.trim(),
          description: '',
          order: index,
          votes: 0,
          percentage: 0
        })),
        category: data.category,
        tags: data.tags,
        author: {
          id: 'current-user', // This should come from auth context
          name: 'Current User',
          verified: false
        },
        status: 'draft' as const,
        visibility: 'public' as const,
        settings: {
          allowMultipleVotes: data.settings.allowMultipleVotes,
          allowAnonymousVotes: data.settings.allowAnonymousVotes,
          showResultsBeforeClose: data.settings.showResults,
          allowComments: data.settings.allowComments,
          allowSharing: true, // Default to true for new polls
          requireAuthentication: data.settings.requireAuthentication
        },
        metadata: {
          language: 'en',
          estimatedTime: 2,
          difficulty: 'easy' as const
        }
      };
      
      // Convert pollData to FormData for the server action
      const formData = new FormData();
      formData.append('title', data.title.trim());
      formData.append('description', data.description.trim());
      formData.append('category', data.category);
      formData.append('privacyLevel', data.privacyLevel);
      formData.append('votingMethod', data.settings.votingMethod);
      formData.append('allowMultipleVotes', data.settings.allowMultipleVotes.toString());
      formData.append('showResults', data.settings.showResults.toString());
      formData.append('allowComments', data.settings.allowComments.toString());
      validOptions.forEach((option, index) => {
        formData.append(`options[${index}]`, option);
      });
      data.tags.forEach((tag, index) => {
        formData.append(`tags[${index}]`, tag);
      });
      
      await createPoll(formData);
      
      // Reset wizard after successful creation
      storeResetWizard();
      
      logger.info('Poll created successfully', { title: data.title, category: data.category });
      
      // Navigate to success page or show success message
      // This should be handled by the router
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create poll';
      logger.error('Failed to create poll:', error instanceof Error ? error : new Error(errorMessage));
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Information
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Poll Title *
              </label>
              <input
                id="title"
                data-testid="poll-title-input"
                value={data.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                placeholder="Enter your poll question..."
                maxLength={200}
                className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>{data.title.length}/200 characters</span>
                {data.title.length > 180 && (
                  <span className="text-orange-500">Approaching limit</span>
                )}
              </div>
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                data-testid="poll-description-input"
                value={data.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                placeholder="Provide more context about your poll..."
                rows={4}
                maxLength={2000}
                className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>{data.description.length}/2000 characters</span>
                {data.description.length > 1800 && (
                  <span className="text-orange-500">Approaching limit</span>
                )}
              </div>
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>
          </div>
        );

      case 1: // Poll Options
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Poll Options *
              </label>
              {errors.options && (
                <p className="text-red-500 text-sm mb-2">{errors.options}</p>
              )}
              
              <div className="space-y-3">
                {data.options.map((option, index) => (
                  <div key={`option-${index}-${option.slice(0, 10)}`} className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <input
                        data-testid={`option-input-${index}`}
                        value={option}
                        onChange={(e) => handleUpdateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        maxLength={100}
                        className={`flex-1 p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors[`option-${index}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {data.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 ml-1">
                      <span>{option.length}/100 characters</span>
                      {option.length > 80 && (
                        <span className="text-orange-500">Approaching limit</span>
                      )}
                    </div>
                    {errors[`option-${index}`] && (
                      <p className="text-red-500 text-sm ml-1">{errors[`option-${index}`]}</p>
                    )}
                  </div>
                ))}
              </div>

              {data.options.length < 10 && (
                <button
                  type="button"
                  data-testid="add-option-btn"
                  onClick={handleAddOption}
                  className="mt-4 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  + Add Option
                </button>
              )}
            </div>
          </div>
        );

      case 2: // Category & Tags
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Category *
              </label>
              {errors.category && (
                <p className="text-red-500 text-sm mb-2">{errors.category}</p>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => updateFormData({ category: category.id })}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      data.category === category.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{category.icon}</div>
                    <div className="font-medium">{category.name}</div>
                    <div className="text-sm text-gray-500">{category.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Tags (Optional)
              </label>
              {errors.tags && (
                <p className="text-red-500 text-sm mb-2">{errors.tags}</p>
              )}
              
              <div className="flex flex-wrap gap-2 mb-3">
                {data.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>

              {data.tags.length < 5 && (
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      maxLength={50}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newTag.trim()) {
                            handleAddTag(newTag.trim());
                            setNewTag('');
                          }
                        }
                      }}
                      className="flex-1 p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newTag.trim()) {
                          handleAddTag(newTag.trim());
                          setNewTag('');
                        }
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{newTag.length}/50 characters</span>
                    {newTag.length > 40 && (
                      <span className="text-orange-500">Approaching limit</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 3: // Settings
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Voting Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Allow multiple votes</label>
                    <input
                      type="checkbox"
                      checked={data.settings.allowMultipleVotes}
                      onChange={(e) => handleUpdateSettings({ allowMultipleVotes: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Allow anonymous votes</label>
                    <input
                      type="checkbox"
                      checked={data.settings.allowAnonymousVotes}
                      onChange={(e) => handleUpdateSettings({ allowAnonymousVotes: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Show results immediately</label>
                    <input
                      type="checkbox"
                      checked={data.settings.showResults}
                      onChange={(e) => handleUpdateSettings({ showResults: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Allow comments</label>
                    <input
                      type="checkbox"
                      checked={data.settings.allowComments}
                      onChange={(e) => handleUpdateSettings({ allowComments: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Privacy & Control</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-2">Privacy Level</label>
                    <select
                      value={data.settings.privacyLevel}
                      onChange={(e) => handleUpdateSettings({ privacyLevel: e.target.value as any })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="invite-only">Invite Only</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium block mb-2">Voting Method</label>
                    <select
                      value={data.settings.votingMethod}
                      onChange={(e) => handleUpdateSettings({ votingMethod: e.target.value as any })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="single">Single Choice</option>
                      <option value="multiple">Multiple Choice</option>
                      <option value="ranked">Ranked Choice</option>
                      <option value="approval">Approval Voting</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Auto-close when threshold reached</label>
                    <input
                      type="checkbox"
                      checked={data.settings.autoClose}
                      onChange={(e) => handleUpdateSettings({ autoClose: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4: // Review
        return (
          <div className="space-y-6">
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Poll Preview</h3>
              <p className="text-gray-600 mb-4">Review your poll before publishing</p>
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold">{data.title}</h4>
                  <p className="text-gray-600 mt-1">{data.description}</p>
                </div>
                
                <div className="border-t pt-4">
                  <h5 className="font-medium mb-2">Options:</h5>
                  <div className="space-y-2">
                    {data.options.filter(opt => opt.trim()).map((option, index) => (
                      <div key={`preview-option-${index}-${option.slice(0, 10)}`} className="flex items-center space-x-2">
                        <input type="radio" name="preview" disabled />
                        <span>{option}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {data.category}
                    </span>
                    {data.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="text-sm text-gray-500">
                  <p>Privacy: {data.settings.privacyLevel}</p>
                  <p>Voting: {data.settings.votingMethod}</p>
                  <p>Multiple votes: {data.settings.allowMultipleVotes ? 'Yes' : 'No'}</p>
                  <p>Anonymous: {data.settings.allowAnonymousVotes ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create a New Poll</h1>
          <p className="text-gray-600 mt-2">Follow the steps below to create your poll</p>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {Array.from({ length: totalSteps }, (_, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  index < currentStep
                    ? 'bg-green-500 border-green-500 text-white'
                    : index === currentStep
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  {index < currentStep ? (
                    <span>✓</span>
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < totalSteps - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {currentStep === 0 ? 'Basic Information' : 
               currentStep === 1 ? 'Poll Options' :
               currentStep === 2 ? 'Category & Tags' :
               currentStep === 3 ? 'Settings' :
               'Review'}
            </h2>
            <p className="text-gray-600 mt-1">
              Step {currentStep + 1} of {totalSteps}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg border shadow-sm mb-8">
          <div className="p-6">
            {renderStepContent()}
          </div>
        </div>

        {/* Enhanced Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <div className="flex space-x-2">
            {currentStep === totalSteps - 1 ? (
              <button
                data-testid="create-poll-btn"
                onClick={submitPoll}
                disabled={!canProceed}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Poll
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}