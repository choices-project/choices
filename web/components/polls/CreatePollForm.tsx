/**
 * Create Poll Form Component
 * 
 * This module provides a form component for creating polls.
 */

'use client';

import React, { useState } from 'react';
import { logger } from '@/lib/logger';

export interface CreatePollFormData {
  title: string;
  description: string;
  category: string;
  options: string[];
  privacyLevel: 'public' | 'private';
  allowComments: boolean;
  showResults: boolean;
}

export interface CreatePollFormProps {
  onSubmit: (data: CreatePollFormData) => void;
  onCancel?: () => void;
  initialData?: Partial<CreatePollFormData>;
  isLoading?: boolean;
}

export const CreatePollForm: React.FC<CreatePollFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<CreatePollFormData>({
    title: '',
    description: '',
    category: '',
    options: ['', ''],
    privacyLevel: 'public',
    allowComments: true,
    showResults: true,
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    const validOptions = formData.options.filter(option => option.trim());
    if (validOptions.length < 2) {
      newErrors.options = 'At least 2 options are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      logger.warn('Form validation failed:', errors);
      return;
    }

    const validOptions = formData.options.filter(option => option.trim());
    onSubmit({
      ...formData,
      options: validOptions
    });
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Poll Title *
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter poll title"
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          rows={3}
          placeholder="Enter poll description"
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category *
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.category ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select a category</option>
          <option value="politics">Politics</option>
          <option value="social">Social</option>
          <option value="technology">Technology</option>
          <option value="entertainment">Entertainment</option>
          <option value="sports">Sports</option>
          <option value="other">Other</option>
        </select>
        {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
      </div>

      {/* Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Options *
        </label>
        {formData.options.map((option, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Option ${index + 1}`}
            />
            {formData.options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="px-3 py-2 text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addOption}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          + Add Option
        </button>
        {errors.options && <p className="text-red-500 text-sm mt-1">{errors.options}</p>}
      </div>

      {/* Privacy Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Privacy Level
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              value="public"
              checked={formData.privacyLevel === 'public'}
              onChange={(e) => setFormData(prev => ({ ...prev, privacyLevel: e.target.value as 'public' | 'private' }))}
              className="mr-2"
            />
            Public - Anyone can view and vote
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="private"
              checked={formData.privacyLevel === 'private'}
              onChange={(e) => setFormData(prev => ({ ...prev, privacyLevel: e.target.value as 'public' | 'private' }))}
              className="mr-2"
            />
            Private - Only invited users can vote
          </label>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.allowComments}
            onChange={(e) => setFormData(prev => ({ ...prev, allowComments: e.target.checked }))}
            className="mr-2"
          />
          Allow comments
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.showResults}
            onChange={(e) => setFormData(prev => ({ ...prev, showResults: e.target.checked }))}
            className="mr-2"
          />
          Show results to voters
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Creating...' : 'Create Poll'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};


