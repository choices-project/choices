'use client';

import { AlertCircle, Plus, Save, Shield, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PrivacyLevelSelector } from '@/components/ui/PrivacyLevelSelector';
import { usePollCreateController } from '@/features/polls/pages/create/hooks';
import type { PollWizardSubmissionResult } from '@/lib/polls/wizard/submission';
import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
import type { PollPrivacyLevel } from '@/lib/polls/types';
import { HybridPrivacyManager, PrivacyLevel } from '@/lib/privacy/hybrid-privacy';

type CreatePollFormProps = {
  onSubmit?: (result: PollWizardSubmissionResult) => Promise<void> | void;
  onCancel?: () => void;
};

const selectorToStorePrivacy = (level: PrivacyLevel): PollPrivacyLevel => {
  switch (level) {
    case PrivacyLevel.MAXIMUM:
      return 'private';
    case PrivacyLevel.ENHANCED:
      return 'unlisted';
    default:
      return 'public';
  }
};

const storeToSelectorPrivacy = (level: PollPrivacyLevel): PrivacyLevel => {
  switch (level) {
    case 'private':
      return PrivacyLevel.MAXIMUM;
    case 'unlisted':
      return PrivacyLevel.ENHANCED;
    default:
      return PrivacyLevel.STANDARD;
  }
};

export const CreatePollForm: React.FC<CreatePollFormProps> = ({ onSubmit, onCancel }) => {
  const {
    data,
    errors,
    isLoading,
    actions: {
      updateData,
      updateSettings,
      addOption,
      removeOption,
      updateOption,
      addTag,
      removeTag,
      clearFieldError,
      clearAllErrors,
    },
    submit,
  } = usePollCreateController();

  const [newTag, setNewTag] = useState('');
  const [lastAnnouncedError, setLastAnnouncedError] = useState<string | null>(null);

  const privacyLevel = useMemo(
    () => storeToSelectorPrivacy(data.settings.privacyLevel ?? data.privacyLevel),
    [data.settings.privacyLevel, data.privacyLevel],
  );

  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);
  const privacySelectorRef = useRef<HTMLDivElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLInputElement | null)[]>([]);
  const assertiveLiveRef = useRef<HTMLDivElement>(null);

  const focusField = useCallback((element: HTMLElement | null, message: string) => {
    if (!element) return;
    ScreenReaderSupport.setFocus(element, { announce: message });
  }, []);

  useEffect(() => {
    const entries = Object.entries(errors).filter(
      ([, value]) => typeof value === 'string' && value.length > 0,
    ) as Array<[string, string]>;

    if (!entries.length) {
      setLastAnnouncedError(null);
      return;
    }

    const firstEntry = entries[0];
    if (!firstEntry) {
      setLastAnnouncedError(null);
      return;
    }

    const [firstKey, firstMessage] = firstEntry;
    if (firstMessage === lastAnnouncedError) {
      return;
    }

    setLastAnnouncedError(firstMessage);
    ScreenReaderSupport.announce(firstMessage, 'assertive');

    if (assertiveLiveRef.current) {
      assertiveLiveRef.current.textContent = firstMessage;
      window.setTimeout(() => {
        if (assertiveLiveRef.current) {
          assertiveLiveRef.current.textContent = '';
        }
      }, 1500);
    }

    if (firstKey === 'title') {
      focusField(titleRef.current, firstMessage);
      return;
    }
    if (firstKey === 'description') {
      focusField(descriptionRef.current, firstMessage);
      return;
    }
    if (firstKey === 'category') {
      focusField(categoryRef.current, firstMessage);
      return;
    }
    if (firstKey === 'options') {
      focusField(optionRefs.current[0] ?? null, firstMessage);
      return;
    }
    if (firstKey.startsWith('option-')) {
      const index = Number(firstKey.split('-')[1]);
      focusField(optionRefs.current[index] ?? null, firstMessage);
      return;
    }
    if (firstKey === 'privacyLevel') {
      focusField(privacySelectorRef.current, firstMessage);
      return;
    }
    if (firstKey === 'tags') {
      focusField(tagInputRef.current, firstMessage);
      return;
    }
    if (firstKey === '_form') {
      focusField(formRef.current, firstMessage);
    }
  }, [errors, focusField, lastAnnouncedError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await submit();
    if (onSubmit) {
      await onSubmit(result);
    }
  };

  const handleTitleChange = (value: string) => {
    if (errors.title) {
      clearFieldError('title');
    }
    updateData({ title: value });
  };

  const handleDescriptionChange = (value: string) => {
    if (errors.description) {
      clearFieldError('description');
    }
    updateData({ description: value });
  };

  const handleCategoryChange = (value: string) => {
    if (errors.category) {
      clearFieldError('category');
    }
    updateData({ category: value });
  };

  const handleOptionChange = (index: number, value: string) => {
    if (errors.options) {
      clearFieldError('options');
    }
    clearFieldError(`option-${index}`);
    updateOption(index, value);
  };

  const handleRemoveOption = (index: number) => {
    removeOption(index);
    clearFieldError('options');
    clearFieldError(`option-${index}`);
  };

  const handleAddOption = () => {
    if (data.options.length >= 10) {
      return;
    }
    addOption();
    clearFieldError('options');
  };

  const handleAddTag = () => {
    const nextTag = newTag.trim();
    if (!nextTag || data.tags.includes(nextTag) || data.tags.length >= 5) {
      return;
    }
    addTag(nextTag);
    setNewTag('');
    clearFieldError('tags');
  };

  const handleRemoveTag = (tag: string) => {
    removeTag(tag);
    clearFieldError('tags');
  };

  const handlePrivacyLevelChange = (level: PrivacyLevel) => {
    const storeLevel = selectorToStorePrivacy(level);
    clearFieldError('privacyLevel');
    updateSettings({ privacyLevel: storeLevel });
    updateData({ privacyLevel: storeLevel });
  };

  const handlePrivacyRecommendation = () => {
    const recommended = HybridPrivacyManager.getRecommendedPrivacyLevel({
      title: data.title,
      description: data.description,
      category: data.category ?? 'general',
    });
    handlePrivacyLevelChange(recommended);
  };

  const handleCancel = () => {
    clearAllErrors();
    onCancel?.();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create New Poll</h2>
        {onCancel && (
          <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      <div aria-live="assertive" className="sr-only" ref={assertiveLiveRef} />

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="create-poll-title">
            Poll Title <span className="text-red-500">*</span>
          </label>
          <input
            id="create-poll-title"
            type="text"
            value={data.title}
            onChange={(event) => handleTitleChange(event.target.value)}
            ref={titleRef}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.title ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter your poll question..."
            maxLength={200}
            aria-invalid={Boolean(errors.title)}
            aria-describedby="create-poll-title-count create-poll-title-error"
          />
          {errors.title && (
            <p
              id="create-poll-title-error"
              className="mt-1 text-sm text-red-600 flex items-center gap-1"
              role="alert"
            >
              <AlertCircle className="h-4 w-4" />
              {errors.title}
            </p>
          )}
          <p id="create-poll-title-count" className="mt-1 text-sm text-gray-500">
            {data.title.length}/200 characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="create-poll-description">
            Description
          </label>
          <textarea
            id="create-poll-description"
            value={data.description}
            onChange={(event) => handleDescriptionChange(event.target.value)}
            ref={descriptionRef}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Add more context to your poll..."
            rows={3}
            maxLength={1000}
            aria-invalid={Boolean(errors.description)}
            aria-describedby="create-poll-description-count create-poll-description-error"
          />
          {errors.description && (
            <p
              id="create-poll-description-error"
              className="mt-1 text-sm text-red-600 flex items-center gap-1"
              role="alert"
            >
              <AlertCircle className="h-4 w-4" />
              {errors.description}
            </p>
          )}
          <p id="create-poll-description-count" className="mt-1 text-sm text-gray-500">
            {data.description.length}/1000 characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="create-poll-category">
            Category
          </label>
          <input
            id="create-poll-category"
            type="text"
            value={data.category}
            onChange={(event) => handleCategoryChange(event.target.value)}
            ref={categoryRef}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.category ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., Politics, Technology, Entertainment..."
            maxLength={50}
            aria-invalid={Boolean(errors.category)}
            aria-describedby={errors.category ? 'create-poll-category-error' : undefined}
          />
          {errors.category && (
            <p
              id="create-poll-category-error"
              className="mt-1 text-sm text-red-600 flex items-center gap-1"
              role="alert"
            >
              <AlertCircle className="h-4 w-4" />
              {errors.category}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Privacy Level</label>
            <button
              type="button"
              onClick={handlePrivacyRecommendation}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Shield className="h-4 w-4" />
              Get Recommendation
            </button>
          </div>
          <div ref={privacySelectorRef} aria-live="polite">
            <PrivacyLevelSelector
              value={privacyLevel}
              onChange={handlePrivacyLevelChange}
              pollData={{
                title: data.title,
                description: data.description,
                category: data.category,
              }}
            />
          </div>
          {errors.privacyLevel && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
              <AlertCircle className="h-4 w-4" />
              {errors.privacyLevel}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="create-poll-option-0">
            Poll Options <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2" role="list">
            {data.options.map((option, index) => (
              <div key={`option-${index}`} className="flex items-center gap-2" role="listitem">
                <input
                  id={`create-poll-option-${index}`}
                  type="text"
                  value={option}
                  onChange={(event) => handleOptionChange(index, event.target.value)}
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors[`option-${index}`] ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={`Option ${index + 1}`}
                  maxLength={100}
                  aria-invalid={Boolean(errors[`option-${index}`])}
                  aria-describedby={`create-poll-option-${index}-meta${
                    errors[`option-${index}`] ? ` create-poll-option-${index}-error` : ''
                  }`}
                />
                {data.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-1 text-xs text-gray-500" id="create-poll-options-meta">
            {data.options.length}/10 options
          </div>
          {data.options.map((option, index) => (
            <div
              key={`option-meta-${index}`}
              id={`create-poll-option-${index}-meta`}
              className="flex justify-between text-xs text-gray-500"
            >
              <span>{option.length}/100 characters</span>
              {option.length > 80 && <span className="text-orange-500">Approaching limit</span>}
            </div>
          ))}
          {errors.options && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
              <AlertCircle className="h-4 w-4" />
              {errors.options}
            </p>
          )}
          {data.options.map(
            (_, index) =>
              errors[`option-${index}`] && (
                <p
                  key={`option-error-${index}`}
                  id={`create-poll-option-${index}-error`}
                  className="text-sm text-red-600 flex items-center gap-1"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4" />
                  {errors[`option-${index}`]}
                </p>
              ),
          )}
          {data.options.length < 10 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="mt-2 flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
              aria-describedby="create-poll-options-meta"
            >
              <Plus className="h-4 w-4" />
              Add Option
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="create-poll-tag-input">
            Tags
          </label>
          <div className="flex items-center gap-2 mb-2">
            <input
              id="create-poll-tag-input"
              type="text"
              value={newTag}
              onChange={(event) => setNewTag(event.target.value)}
              ref={tagInputRef}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add a tag..."
              maxLength={20}
              aria-describedby={`create-poll-tags-limit${
                errors.tags ? ' create-poll-tags-error' : ''
              }`}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={!newTag.trim() || data.tags.length >= 5}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
          {errors.tags && (
            <p
              id="create-poll-tags-error"
              className="mt-1 text-sm text-red-600 flex items-center gap-1"
              role="alert"
            >
              <AlertCircle className="h-4 w-4" />
              {errors.tags}
            </p>
          )}
          {data.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <p id="create-poll-tags-limit" className="text-xs text-gray-500">
            {data.tags.length}/5 selected
          </p>
        </div>

        {errors._form && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{errors._form}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Creating...' : 'Create Poll'}
          </button>
        </div>
      </form>
    </div>
  );
};

