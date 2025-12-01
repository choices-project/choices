'use client';

import { Heart, Save, RotateCcw } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { useI18n } from '@/hooks/useI18n';

import type { InterestSelectionProps } from '../types';

/**
 * Interest Selection Component
 * 
 * Allows users to select their interests from a predefined list:
 * - Climate Change, Healthcare, Education, etc.
 * - Save and reset functionality
 * - Visual feedback for selections
 * 
 * Features:
 * - Predefined interest categories
 * - Multi-select functionality
 * - Save and reset options
 * - Responsive design
 * 
 * @param {InterestSelectionProps} props - Component props
 * @returns {JSX.Element} Interest selection interface
 */
const InterestSelection: React.FC<InterestSelectionProps> = ({
  initialInterests = [],
  onSave,
  className = ''
}) => {
  const { t } = useI18n();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialInterests);
  const [hasChanges, setHasChanges] = useState(false);

  const interestDefinitions = useMemo(
    () => [
      { key: 'climateChange', value: 'Climate Change' },
      { key: 'healthcare', value: 'Healthcare' },
      { key: 'education', value: 'Education' },
      { key: 'economy', value: 'Economy' },
      { key: 'immigration', value: 'Immigration' },
      { key: 'criminalJustice', value: 'Criminal Justice' },
      { key: 'votingRights', value: 'Voting Rights' },
      { key: 'technology', value: 'Technology' },
      { key: 'foreignPolicy', value: 'Foreign Policy' },
      { key: 'socialSecurity', value: 'Social Security' },
      { key: 'gunControl', value: 'Gun Control' },
      { key: 'abortionRights', value: 'Abortion Rights' },
      { key: 'lgbtqRights', value: 'LGBTQ+ Rights' },
      { key: 'racialJustice', value: 'Racial Justice' },
      { key: 'infrastructure', value: 'Infrastructure' },
    ],
    [],
  );

  const interests = useMemo(
    () =>
      interestDefinitions.map((interest) => ({
        ...interest,
        label: t(`onboarding.interests.options.${interest.key}`),
      })),
    [interestDefinitions, t],
  );

  const toggleInterest = (interest: string) => {
    const newInterests = selectedInterests.includes(interest)
      ? selectedInterests.filter(i => i !== interest)
      : [...selectedInterests, interest];
    
    setSelectedInterests(newInterests);
    setHasChanges(JSON.stringify(newInterests.sort()) !== JSON.stringify(initialInterests.sort()));
  };

  const handleSave = () => {
    onSave?.(selectedInterests);
    setHasChanges(false);
  };

  const handleReset = () => {
    setSelectedInterests(initialInterests);
    setHasChanges(false);
  };

  useEffect(() => {
    setSelectedInterests(initialInterests);
    setHasChanges(false);
  }, [initialInterests]);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Heart className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t('onboarding.interests.title')}</h3>
            <p className="text-sm text-gray-600">
              {t('onboarding.interests.subtitle')}
            </p>
          </div>
        </div>
        
        {hasChanges && (
          <div className="flex space-x-2">
            <button
              onClick={handleReset}
              className="flex items-center space-x-1 px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="text-sm">{t('onboarding.interests.actions.reset')}</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1 px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span className="text-sm">{t('onboarding.interests.actions.save')}</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {interests.map((interest) => (
          <button
            key={interest.key}
            onClick={() => toggleInterest(interest.value)}
            className={`p-3 rounded-lg border-2 transition-all duration-200 ${
              selectedInterests.includes(interest.value)
                ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{interest.label}</span>
              {selectedInterests.includes(interest.value) && (
                <Heart className="h-4 w-4 text-purple-600 fill-current" />
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>
            {t('onboarding.interests.summary.count', {
              selected: selectedInterests.length,
              total: interests.length,
            })}
          </span>
          {selectedInterests.length > 0 && (
            <span className="text-purple-600 font-medium">
              {selectedInterests.length === interests.length
                ? t('onboarding.interests.summary.allSelected')
                : t('onboarding.interests.summary.customSelection')}
            </span>
          )}
        </div>
        
        {selectedInterests.length === 0 && (
          <span className="text-amber-600 font-medium">
            {t('onboarding.interests.summary.noneSelected')}
          </span>
        )}
      </div>

      {selectedInterests.length > 0 && (
        <div className="mt-4 p-4 bg-purple-50 rounded-lg">
          <h4 className="font-semibold text-purple-900 mb-2">{t('onboarding.interests.benefits.title')}</h4>
          <ul className="text-purple-800 text-sm space-y-1">
            {['seePolls', 'personalizedContent', 'findRepresentatives', 'trackProgress'].map((benefitKey) => (
              <li key={benefitKey}>• {t(`onboarding.interests.benefits.items.${benefitKey}`)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default InterestSelection;
