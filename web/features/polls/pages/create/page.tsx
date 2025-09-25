'use client';

import { useState } from 'react';
import { usePollWizard } from '@/lib/hooks/usePollWizard';
import type { PollCategory } from '@/lib/types/poll-templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// ... existing code ...
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowRight, Plus, X, CheckCircle, AlertCircle } from 'lucide-react';
import { devLog } from '@/lib/logger';

const CATEGORIES: Array<{ id: PollCategory; name: string; description: string; icon: string }> = [
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
  const [newTag, setNewTag] = useState('');
  const {
    wizardState,
    progress,
    updateWizardData,
    nextStep,
    previousStep,
    addOption,
    removeOption,
    updateOption,
    updateSettings,
    addTag,
    removeTag,
    submitPoll,
  } = usePollWizard();

  const handlePublish = async () => {
    try {
      const result = await submitPoll();
      if (result.success) {
        devLog('Poll created successfully:', result.pollId);
        alert(`Poll created successfully! ID: ${result.pollId}`);
        // Navigate to the created poll
        if (result.pollId) {
          window.location.href = `/polls/${result.pollId}`;
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        devLog('Failed to create poll:', result.error);
        alert(`Failed to create poll: ${result.error}`);
      }
    } catch (error) {
      devLog('Error creating poll:', error);
      alert('Failed to create poll. Please try again.');
    }
  };

  const renderStepContent = () => {
    switch (wizardState.currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Poll Title *
              </label>
              <Input
                id="title"
                value={wizardState.data.title}
                onChange={(e) => updateWizardData({ title: e.target.value })}
                placeholder="Enter your poll question..."
                className={wizardState.errors.title ? 'border-red-500' : ''}
              />
              {wizardState.errors.title && (
                <p className="text-red-500 text-sm mt-1">{wizardState.errors.title}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
                             <textarea
                 id="description"
                 value={wizardState.data.description}
                 onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateWizardData({ description: e.target.value })}
                 placeholder="Provide more context about your poll..."
                 rows={4}
                 className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${wizardState.errors.description ? 'border-red-500' : 'border-gray-300'}`}
               />
              {wizardState.errors.description && (
                <p className="text-red-500 text-sm mt-1">{wizardState.errors.description}</p>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Poll Options *
              </label>
              {wizardState.errors.options && (
                <p className="text-red-500 text-sm mb-2">{wizardState.errors.options}</p>
              )}
              
              <div className="space-y-3">
                {wizardState.data.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className={wizardState.errors[`option-${index}`] ? 'border-red-500' : ''}
                    />
                    {wizardState.data.options.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {wizardState.data.options.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addOption}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Category *
              </label>
              {wizardState.errors.category && (
                <p className="text-red-500 text-sm mb-2">{wizardState.errors.category}</p>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => updateWizardData({ category: category.id })}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      wizardState.data.category === category.id
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
              {wizardState.errors.tags && (
                <p className="text-red-500 text-sm mb-2">{wizardState.errors.tags}</p>
              )}
              
              <div className="flex flex-wrap gap-2 mb-3">
                {wizardState.data.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {wizardState.data.tags.length < 5 && (
                <div className="flex space-x-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newTag.trim()) {
                          addTag(newTag.trim());
                          setNewTag('');
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (newTag.trim()) {
                        addTag(newTag.trim());
                        setNewTag('');
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Voting Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Allow multiple votes</label>
                    <input
                      type="checkbox"
                      checked={wizardState.data.settings.allowMultipleVotes}
                      onChange={(e) => updateSettings({ allowMultipleVotes: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Allow anonymous votes</label>
                    <input
                      type="checkbox"
                      checked={wizardState.data.settings.allowAnonymousVotes}
                      onChange={(e) => updateSettings({ allowAnonymousVotes: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Show results immediately</label>
                    <input
                      type="checkbox"
                      checked={wizardState.data.settings.showResults}
                      onChange={(e) => updateSettings({ showResults: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Allow comments</label>
                    <input
                      type="checkbox"
                      checked={wizardState.data.settings.allowComments}
                      onChange={(e) => updateSettings({ allowComments: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Privacy & Control</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-2">Privacy Level</label>
                    <select
                      value={wizardState.data.settings.privacyLevel}
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
                      value={wizardState.data.settings.votingMethod}
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
                      checked={wizardState.data.settings.autoClose}
                      onChange={(e) => updateSettings({ autoClose: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Poll Preview</CardTitle>
                <CardDescription>Review your poll before publishing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{wizardState.data.title}</h3>
                    <p className="text-gray-600 mt-1">{wizardState.data.description}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Options:</h4>
                    <div className="space-y-2">
                      {wizardState.data.options.filter(opt => opt.trim()).map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input type="radio" name="preview" disabled />
                          <span>{option}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{wizardState.data.category}</Badge>
                    {wizardState.data.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    <p>Privacy: {wizardState.data.settings.privacyLevel}</p>
                    <p>Voting: {wizardState.data.settings.votingMethod}</p>
                    <p>Multiple votes: {wizardState.data.settings.allowMultipleVotes ? 'Yes' : 'No'}</p>
                    <p>Anonymous: {wizardState.data.settings.allowAnonymousVotes ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {progress.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  step.isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : step.isCurrent
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  {step.isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : step.hasError ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < progress.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    step.isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {progress[wizardState.currentStep]?.title}
            </h2>
            <p className="text-gray-600 mt-1">
              Step {wizardState.currentStep + 1} of {wizardState.totalSteps}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={previousStep}
            disabled={!wizardState.canGoBack}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-2">
            {wizardState.currentStep === wizardState.totalSteps - 1 ? (
              <Button
                onClick={handlePublish}
                disabled={!wizardState.canProceed || wizardState.isLoading}
                className="flex items-center"
              >
                {wizardState.isLoading ? 'Creating...' : 'Create Poll'}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!wizardState.canProceed}
                className="flex items-center"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
