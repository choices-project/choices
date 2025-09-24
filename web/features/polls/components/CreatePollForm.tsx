'use client';

import React, { useState } from 'react';
import { devLog } from '@/lib/logger';
import { Plus, X, Save, AlertCircle, Shield } from 'lucide-react';
import { PrivacyLevelSelector } from '@/shared/components/PrivacyLevelSelector';
import { PrivacyLevel, HybridPrivacyManager } from '@/lib/privacy/hybrid-privacy';
import { withOptional } from '@/lib/util/objects';

type CreatePollFormProps = {
  onSubmit: (pollData: CreatePollData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export type CreatePollData = {
  title: string;
  description: string;
  options: string[];
  votingmethod: 'single' | 'multiple' | 'ranked' | 'approval' | 'range' | 'quadratic';
  privacylevel: PrivacyLevel;
  category?: string;
  tags: string[];
}

export const CreatePollForm: React.FC<CreatePollFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<CreatePollData>({
    title: '',
    description: '',
    options: ['', ''],
    votingmethod: 'single',
    privacylevel: PrivacyLevel.STANDARD,
    category: '',
    tags: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate title
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    // Validate description
    if (formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    // Validate options
    const validOptions = formData.options.filter(option => option.trim().length > 0);
    if (validOptions.length < 2) {
      newErrors.options = 'At least 2 options are required';
    }

    // Validate category
    if (formData.category && formData.category.length > 50) {
      newErrors.category = 'Category must be less than 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const validOptions = formData.options.filter(option => option.trim().length > 0);
    const pollData = {
      ...withOptional(formData),
      options: validOptions
    };

    try {
      // Validate pollData before submission
      if (!pollData.title || pollData.options.length < 2) {
        throw new Error('Invalid poll data');
      }
      
      await onSubmit(pollData);
    } catch (error) {
      devLog('Error creating poll:', error);
    }
  };

  const addOption = () => {
    if (formData.options.length < 10) {
      setFormData(prev => ({
        ...withOptional(prev),
        options: [...prev.options, '']
      }));
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...withOptional(prev),
        options: prev.options.filter((_, i: any) => i !== index)
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...withOptional(prev),
      options: prev.options.map((option: any, i: any) => i === index ? value : option)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim()) && formData.tags.length < 5) {
      setFormData(prev => ({
        ...withOptional(prev),
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...withOptional(prev),
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getRecommendedPrivacyLevel = () => {
    return HybridPrivacyManager.getRecommendedPrivacyLevel({
      title: formData.title,
      description: formData.description,
      category: formData.category || 'general'
    });
  };

  const handlePrivacyRecommendation = () => {
    const recommendedLevel = getRecommendedPrivacyLevel();
    setFormData(prev => ({ 
      ...withOptional(prev), 
      privacylevel: recommendedLevel 
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create New Poll</h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Poll Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ 
              ...withOptional(prev), 
              title: e.target.value 
            }))}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.title ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter your poll question..."
            maxLength={200}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ 
              ...withOptional(prev), 
              description: e.target.value 
            }))}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Add more context to your poll..."
            rows={3}
            maxLength={1000}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.description}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category (Optional)
          </label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ 
              ...withOptional(prev), 
              category: e.target.value 
            }))}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.category ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., Politics, Technology, Entertainment..."
            maxLength={50}
          />
          {errors.category && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.category}
            </p>
          )}
        </div>

        {/* Privacy Level */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Privacy Level
            </label>
            <button
              type="button"
              onClick={handlePrivacyRecommendation}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Shield className="h-4 w-4" />
              Get Recommendation
            </button>
          </div>
          <PrivacyLevelSelector
            value={formData.privacylevel}
            onChange={(level) => setFormData(prev => ({ 
              ...withOptional(prev), 
              privacylevel: level 
            }))}
            pollData={withOptional({
              title: formData.title,
              description: formData.description
            }, {
              category: formData.category ?? undefined
            })}
          />
        </div>

        {/* Voting Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voting Method
          </label>
          <select
            value={formData.votingmethod}
            onChange={(e) => setFormData(prev => ({ 
              ...withOptional(prev), 
              votingmethod: e.target.value as CreatePollData['votingmethod']
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="single">Single Choice</option>
            <option value="multiple">Multiple Choice</option>
            <option value="ranked">Ranked Choice</option>
            <option value="approval">Approval Voting</option>
            <option value="range">Range Voting</option>
            <option value="quadratic">Quadratic Voting</option>
          </select>
        </div>

        {/* Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Poll Options *
          </label>
          <div className="space-y-2">
            {formData.options.map((option: any, index: any) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Option ${index + 1}`}
                  maxLength={100}
                />
                {formData.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {formData.options.length < 10 && (
            <button
              type="button"
              onClick={addOption}
              className="mt-2 flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
            >
              <Plus className="h-4 w-4" />
              Add Option
            </button>
          )}
          {errors.options && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.options}
            </p>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags (Optional)
          </label>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add a tag..."
              maxLength={20}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <button
              type="button"
              onClick={addTag}
              disabled={!newTag.trim() || formData.tags.length >= 5}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag: any, index: any) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Privacy Level Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-blue-600">
              {formData.privacylevel === PrivacyLevel.MINIMAL && '🌐'}
              {formData.privacylevel === PrivacyLevel.ENHANCED && '🔒'}
              {formData.privacylevel === PrivacyLevel.MAXIMUM && '🛡️'}
            </div>
            <div className="text-sm text-blue-800">
              <p className="font-medium">
                {formData.privacylevel === PrivacyLevel.MINIMAL && 'Public Poll'}
                {formData.privacylevel === PrivacyLevel.ENHANCED && 'Private Poll'}
                {formData.privacylevel === PrivacyLevel.MAXIMUM && 'High Privacy Poll'}
              </p>
              <p className="text-blue-600">
                {formData.privacylevel === PrivacyLevel.MINIMAL && 'Fast voting with basic privacy protection'}
                {formData.privacylevel === PrivacyLevel.ENHANCED && 'Enhanced privacy with user authentication'}
                {formData.privacylevel === PrivacyLevel.MAXIMUM && 'Maximum privacy with cryptographic guarantees'}
              </p>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Create Poll
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
