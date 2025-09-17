'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Plus, 
  X, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle2
} from 'lucide-react';

interface CreatePollData {
  title: string;
  description: string;
  category: string;
  options: Array<{ id: string; text: string }>;
  votingMethod: string;
  privacyLevel: string;
  allowMultipleVotes: boolean;
  showResults: boolean;
  allowComments: boolean;
  endDate: string;
  endTime: string;
}

const POLL_CATEGORIES = [
  { value: 'politics', label: 'Politics', icon: '🏛️' },
  { value: 'social', label: 'Social Issues', icon: '👥' },
  { value: 'technology', label: 'Technology', icon: '💻' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'sports', label: 'Sports', icon: '⚽' },
  { value: 'education', label: 'Education', icon: '📚' },
  { value: 'health', label: 'Health', icon: '🏥' },
  { value: 'environment', label: 'Environment', icon: '🌱' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'general', label: 'General', icon: '📋' }
];

const VOTING_METHODS = [
  { value: 'single', label: 'Single Choice', description: 'Voters select one option' },
  { value: 'approval', label: 'Approval Voting', description: 'Voters can approve multiple options' },
  { value: 'ranked', label: 'Ranked Choice', description: 'Voters rank options by preference' },
  { value: 'range', label: 'Range Voting', description: 'Voters rate each option on a scale' },
  { value: 'quadratic', label: 'Quadratic Voting', description: 'Voters allocate credits with quadratic cost' }
];

export default function CreatePollPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreatePollData>({
    title: '',
    description: '',
    category: '',
    options: [
      { id: '1', text: '' },
      { id: '2', text: '' }
    ],
    votingMethod: 'single',
    privacyLevel: 'public',
    allowMultipleVotes: false,
    showResults: true,
    allowComments: true,
    endDate: '',
    endTime: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const addOption = () => {
    if (formData.options.length < 10) {
      const newId = (formData.options.length + 1).toString();
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, { id: newId, text: '' }]
      }));
    }
  };

  const removeOption = (id: string) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter(option => option.id !== id)
      }));
    }
  };

  const updateOption = (id: string, text: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(option =>
        option.id === id ? { ...option, text } : option
      )
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Poll title is required');
      return false;
    }

    if (!formData.category) {
      setError('Please select a category');
      return false;
    }

    if (formData.options.length < 2) {
      setError('At least 2 options are required');
      return false;
    }

    const emptyOptions = formData.options.filter(option => !option.text.trim());
    if (emptyOptions.length > 0) {
      setError('All options must have text');
      return false;
    }

    if (!formData.endDate || !formData.endTime) {
      setError('Please set an end date and time');
      return false;
    }

    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
    if (endDateTime <= new Date()) {
      setError('End date must be in the future');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const pollData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        options: formData.options.map(option => option.text).filter(text => text.trim()),
        votingMethod: formData.votingMethod,
        privacyLevel: formData.privacyLevel,
        allowMultipleVotes: formData.allowMultipleVotes,
        showResults: formData.showResults,
        allowComments: formData.allowComments,
        endTime: new Date(`${formData.endDate}T${formData.endTime}`).toISOString()
      };

      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pollData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create poll');
      }

      const createdPoll = await response.json();
      setSuccess(true);
      
      // Redirect to the created poll after a short delay
      setTimeout(() => {
        router.push(`/polls/${createdPoll.id}`);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create poll');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Poll Created Successfully!</h2>
          <p className="text-gray-600 mb-4">
            Your poll has been created and is now live. Redirecting you to the poll page...
          </p>
          <Button onClick={() => router.push('/polls')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Polls
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/polls')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Polls
          </Button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Poll</h1>
          <p className="text-gray-600">
            Create a poll to gather opinions and make decisions with your community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Provide the essential details for your poll
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Poll Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="What would you like to ask?"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide additional context or details..."
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {POLL_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Poll Options */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Poll Options</CardTitle>
                  <CardDescription>
                    Define the choices voters can select from
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={formData.options.length >= 10}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.options.map((option, index) => (
                <div key={option.id} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <Label htmlFor={`option-${option.id}`}>
                      Option {index + 1} *
                    </Label>
                    <Input
                      id={`option-${option.id}`}
                      value={option.text}
                      onChange={(e) => updateOption(option.id, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="mt-1"
                    />
                  </div>
                  {formData.options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(option.id)}
                      className="mt-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <p className="text-sm text-gray-500">
                Minimum 2 options, maximum 10 options
              </p>
            </CardContent>
          </Card>

          {/* Voting Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Voting Settings</CardTitle>
              <CardDescription>
                Configure how voting will work for your poll
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="votingMethod">Voting Method</Label>
                <select
                  id="votingMethod"
                  value={formData.votingMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, votingMethod: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {VOTING_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label} - {method.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="privacyLevel">Privacy Level</Label>
                <select
                  id="privacyLevel"
                  value={formData.privacyLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, privacyLevel: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="public">Public - Anyone can view and vote</option>
                  <option value="private">Private - Only invited users can vote</option>
                  <option value="anonymous">Anonymous - Votes are not linked to users</option>
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Multiple Votes</Label>
                    <p className="text-sm text-gray-500">Voters can select multiple options</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.allowMultipleVotes}
                    onChange={(e) => setFormData(prev => ({ ...prev, allowMultipleVotes: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Results</Label>
                    <p className="text-sm text-gray-500">Display results to voters</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.showResults}
                    onChange={(e) => setFormData(prev => ({ ...prev, showResults: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Comments</Label>
                    <p className="text-sm text-gray-500">Voters can add comments</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.allowComments}
                    onChange={(e) => setFormData(prev => ({ ...prev, allowComments: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>
                Set when your poll will end
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/polls')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Poll...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Poll
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
