'use client';

import { useState } from 'react';

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
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    options: ['', ''],
    tags: [] as string[],
    settings: {
      allowMultipleVotes: false,
      allowAnonymousVotes: true,
      showResults: true,
      allowComments: true,
      votingMethod: 'single' as const,
      privacyLevel: 'public' as const,
      autoClose: false
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');
  
  const totalSteps = 5;
  
  // Enhanced validation with real-time feedback
  const validateCurrentStep = (setErrorsFlag = false) => {
    const newErrors: Record<string, string> = {};
    
    switch (currentStep) {
      case 0: // Basic info
        if (!formData.title.trim()) {
          newErrors.title = 'Title is required';
        } else if (formData.title.trim().length < 5) {
          newErrors.title = 'Title must be at least 5 characters';
        } else if (formData.title.trim().length > 200) {
          newErrors.title = 'Title must be 200 characters or less';
        }
        if (!formData.description.trim()) {
          newErrors.description = 'Description is required';
        } else if (formData.description.trim().length < 10) {
          newErrors.description = 'Description must be at least 10 characters';
        } else if (formData.description.trim().length > 2000) {
          newErrors.description = 'Description must be 2000 characters or less';
        }
        break;
      case 1: // Options
        const validOptions = formData.options.filter(option => option.trim().length > 0);
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
        break;
      case 2: // Category & Tags
        if (!formData.category) {
          newErrors.category = 'Please select a category';
        }
        // Check tag length
        for (let i = 0; i < formData.tags.length; i++) {
          const tag = formData.tags[i];
          if (tag && tag.length > 50) {
            newErrors[`tag-${i}`] = 'Each tag must be 50 characters or less';
          }
        }
        break;
    }
    
    if (setErrorsFlag) {
      setErrors(newErrors);
    }
    
    return Object.keys(newErrors).length === 0;
  };
  
  // Real-time validation - only check, don't set errors
  const canProceed = validateCurrentStep();
  
  // Navigation with validation
  const nextStep = () => {
    if (validateCurrentStep(true) && currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setErrors({});
    }
  };
  
  // Enhanced form data updates
  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };
  
  const addOption = () => {
    if (formData.options.length < 10) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, '']
      }));
    }
  };
  
  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };
  
  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };
  
  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim()) && formData.tags.length < 5 && tag.trim().length <= 50) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
  };
  
  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };
  
  const updateSettings = (updates: Partial<typeof formData.settings>) => {
    setFormData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates }
    }));
  };
  
  const submitPoll = async () => {
    const newErrors: Record<string, string> = {};
    
    // Final validation for all steps
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Title must be 200 characters or less';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.trim().length > 2000) {
      newErrors.description = 'Description must be 2000 characters or less';
    }
    
    const validOptions = formData.options.filter(option => option.trim().length > 0);
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
    
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    
    // Check tag length
    for (let i = 0; i < formData.tags.length; i++) {
      const tag = formData.tags[i];
      if (tag && tag.length > 50) {
        newErrors[`tag-${i}`] = 'Each tag must be 50 characters or less';
      }
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      console.log('Poll created successfully:', formData);
      alert('Poll created successfully!');
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
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                placeholder="Enter your poll question..."
                maxLength={200}
                className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>{formData.title.length}/200 characters</span>
                {formData.title.length > 180 && (
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
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                placeholder="Provide more context about your poll..."
                rows={4}
                maxLength={2000}
                className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>{formData.description.length}/2000 characters</span>
                {formData.description.length > 1800 && (
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
                {formData.options.map((option, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        maxLength={100}
                        className={`flex-1 p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors[`option-${index}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
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

              {formData.options.length < 10 && (
                <button
                  type="button"
                  onClick={addOption}
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
                      formData.category === category.id
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
                {formData.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>

              {formData.tags.length < 5 && (
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
                            addTag(newTag.trim());
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
                          addTag(newTag.trim());
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
                      checked={formData.settings.allowMultipleVotes}
                      onChange={(e) => updateSettings({ allowMultipleVotes: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Allow anonymous votes</label>
                    <input
                      type="checkbox"
                      checked={formData.settings.allowAnonymousVotes}
                      onChange={(e) => updateSettings({ allowAnonymousVotes: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Show results immediately</label>
                    <input
                      type="checkbox"
                      checked={formData.settings.showResults}
                      onChange={(e) => updateSettings({ showResults: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Allow comments</label>
                    <input
                      type="checkbox"
                      checked={formData.settings.allowComments}
                      onChange={(e) => updateSettings({ allowComments: e.target.checked })}
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
                      value={formData.settings.privacyLevel}
                      onChange={(e) => updateSettings({ privacyLevel: e.target.value as any })}
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
                      value={formData.settings.votingMethod}
                      onChange={(e) => updateSettings({ votingMethod: e.target.value as any })}
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
                      checked={formData.settings.autoClose}
                      onChange={(e) => updateSettings({ autoClose: e.target.checked })}
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
                  <h4 className="text-lg font-semibold">{formData.title}</h4>
                  <p className="text-gray-600 mt-1">{formData.description}</p>
                </div>
                
                <div className="border-t pt-4">
                  <h5 className="font-medium mb-2">Options:</h5>
                  <div className="space-y-2">
                    {formData.options.filter(opt => opt.trim()).map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input type="radio" name="preview" disabled />
                        <span>{option}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {formData.category}
                    </span>
                    {formData.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="text-sm text-gray-500">
                  <p>Privacy: {formData.settings.privacyLevel}</p>
                  <p>Voting: {formData.settings.votingMethod}</p>
                  <p>Multiple votes: {formData.settings.allowMultipleVotes ? 'Yes' : 'No'}</p>
                  <p>Anonymous: {formData.settings.allowAnonymousVotes ? 'Yes' : 'No'}</p>
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
            onClick={previousStep}
            disabled={currentStep === 0}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <div className="flex space-x-2">
            {currentStep === totalSteps - 1 ? (
              <button
                onClick={submitPoll}
                disabled={!canProceed}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Poll
              </button>
            ) : (
              <button
                onClick={nextStep}
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