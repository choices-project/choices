'use client';

import { Heart, Users, Globe, TrendingUp } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { useI18n } from '@/hooks/useI18n';

import type {
  ValueCategory,
  CommunityOption,
  ParticipationOption,
  ValuesStepProps,
  ParticipationStyle,
  CommunityFocus,
} from '../types';

/**
 * Values Step Component
 *
 * Handles user values and preferences selection during onboarding:
 * - Primary concerns selection (up to 5 from categories like Economic Justice, Environmental Protection)
 * - Community focus definition (local, regional, national, global)
 * - Participation style selection (observer, contributor, leader)
 *
 * Features:
 * - Interactive concern selection with visual feedback
 * - Community focus with clear descriptions
 * - Participation style with detailed explanations
 * - Progress tracking and validation
 *
 * @param {ValuesStepProps} props - Component props
 * @returns {JSX.Element} Values selection interface
 */
export default function ValuesStep({ data, onUpdate, onNext, onBack }: ValuesStepProps) {
  const { t } = useI18n();
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>(data.primaryConcerns ?? []);
  const [communityFocus, setCommunityFocus] = useState<CommunityFocus[]>(data.communityFocus ?? []);
  const [participationStyle, setParticipationStyle] = useState<ParticipationStyle>(data.participationStyle ?? 'observer');

  // Sync component state with data changes
  useEffect(() => {
    if (data.primaryConcerns && data.primaryConcerns !== selectedConcerns) {
      setSelectedConcerns(data.primaryConcerns)
    }
    if (data.communityFocus && data.communityFocus !== communityFocus) {
      setCommunityFocus(data.communityFocus)
    }
    if (data.participationStyle && data.participationStyle !== participationStyle) {
      setParticipationStyle(data.participationStyle)
    }
  }, [data.primaryConcerns, data.communityFocus, data.participationStyle, selectedConcerns, communityFocus, participationStyle])

  const handleConcernToggle = (concern: string) => {
    const newConcerns = selectedConcerns.includes(concern)
      ? selectedConcerns.filter(c => c !== concern)
      : selectedConcerns.length < 5
      ? [...selectedConcerns, concern]
      : selectedConcerns

    setSelectedConcerns(newConcerns)
    onUpdate({ primaryConcerns: newConcerns })
  }

  const handleCommunityToggle = (focus: CommunityFocus) => {
    const newFocus = communityFocus.includes(focus)
      ? communityFocus.filter(f => f !== focus)
      : [...communityFocus, focus]

    setCommunityFocus(newFocus)
    onUpdate({ communityFocus: newFocus })
  }

  const handleParticipationChange = (style: ParticipationStyle) => {
    setParticipationStyle(style)
    onUpdate({ participationStyle: style })
  }

  const canContinue = selectedConcerns.length > 0 && communityFocus.length > 0

  const valueCategories = useMemo(() => [
    {
      title: t('onboarding.values.categories.economic.title'),
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-green-100 text-green-700',
      concerns: [
        t('onboarding.values.categories.economic.concerns.fairWages'),
        t('onboarding.values.categories.economic.concerns.affordableHousing'),
        t('onboarding.values.categories.economic.concerns.healthcareAccess'),
        t('onboarding.values.categories.economic.concerns.educationFunding'),
        t('onboarding.values.categories.economic.concerns.smallBusinessSupport'),
        t('onboarding.values.categories.economic.concerns.workerRights')
      ]
    },
    {
      title: t('onboarding.values.categories.environmental.title'),
      icon: <Globe className="w-5 h-5" />,
      color: 'bg-blue-100 text-blue-700',
      concerns: [
        t('onboarding.values.categories.environmental.concerns.climateAction'),
        t('onboarding.values.categories.environmental.concerns.cleanEnergy'),
        t('onboarding.values.categories.environmental.concerns.conservation'),
        t('onboarding.values.categories.environmental.concerns.sustainableLiving'),
        t('onboarding.values.categories.environmental.concerns.pollutionReduction')
      ]
    },
    {
      title: t('onboarding.values.categories.community.title'),
      icon: <Heart className="w-5 h-5" />,
      color: 'bg-purple-100 text-purple-700',
      concerns: [
        t('onboarding.values.categories.community.concerns.communitySafety'),
        t('onboarding.values.categories.community.concerns.mentalHealth'),
        t('onboarding.values.categories.community.concerns.elderlyCare'),
        t('onboarding.values.categories.community.concerns.youthPrograms'),
        t('onboarding.values.categories.community.concerns.disabilityRights'),
        t('onboarding.values.categories.community.concerns.immigrationReform')
      ]
    },
    {
      title: t('onboarding.values.categories.systemic.title'),
      icon: <Users className="w-5 h-5" />,
      color: 'bg-orange-100 text-orange-700',
      concerns: [
        t('onboarding.values.categories.systemic.concerns.corporateAccountability'),
        t('onboarding.values.categories.systemic.concerns.governmentTransparency'),
        t('onboarding.values.categories.systemic.concerns.campaignFinanceReform'),
        t('onboarding.values.categories.systemic.concerns.votingRights'),
        t('onboarding.values.categories.systemic.concerns.mediaIntegrity')
      ]
    }
  ], [t])

  const communityOptions: CommunityOption[] = useMemo(() => [
    { value: 'local', label: t('onboarding.values.community.local.label'), description: t('onboarding.values.community.local.description') },
    { value: 'regional', label: t('onboarding.values.community.regional.label'), description: t('onboarding.values.community.regional.description') },
    { value: 'national', label: t('onboarding.values.community.national.label'), description: t('onboarding.values.community.national.description') },
    { value: 'global', label: t('onboarding.values.community.global.label'), description: t('onboarding.values.community.global.description') }
  ], [t])

  const participationOptions: ParticipationOption[] = useMemo(() => [
    {
      value: 'observer',
      label: t('onboarding.values.participation.observer.label'),
      description: t('onboarding.values.participation.observer.description'),
      icon: '👁️'
    },
    {
      value: 'contributor',
      label: t('onboarding.values.participation.contributor.label'),
      description: t('onboarding.values.participation.contributor.description'),
      icon: '💡'
    },
    {
      value: 'leader',
      label: t('onboarding.values.participation.leader.label'),
      description: t('onboarding.values.participation.leader.description'),
      icon: '🚀'
    }
  ], [t])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">
          {t('onboarding.values.title')}
        </h2>
        <p className="text-gray-600">
          {t('onboarding.values.subtitle')}
        </p>
      </div>

      {/* Primary concerns */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900">
          {t('onboarding.values.concerns.title', { count: selectedConcerns.length, max: 5 })}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {valueCategories.map((category: ValueCategory) => (
            <div key={category.title} className="space-y-3">
              <div className={`flex items-center space-x-2 p-3 rounded-lg ${category.color}`}>
                {category.icon}
                <span className="font-semibold">{category.title}</span>
              </div>
              <div className="space-y-2">
                {category.concerns.map((concern: string) => (
                  <button
                    key={concern}
                    onClick={() => handleConcernToggle(concern)}
                    className={`
                      w-full text-left p-3 rounded-lg border-2 transition-all duration-200
                      ${selectedConcerns.includes(concern)
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    {concern}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Community focus */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">
          {t('onboarding.values.community.title')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {communityOptions.map((option: CommunityOption) => (
            <button
              key={option.value}
              onClick={() => handleCommunityToggle(option.value)}
              className={`
                text-left p-4 rounded-lg border-2 transition-all duration-200
                ${communityFocus.includes(option.value)
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="font-semibold">{option.label}</div>
              <div className="text-sm opacity-75">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Participation style */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">
          {t('onboarding.values.participation.title')}
        </h3>
        <div className="space-y-3">
          {participationOptions.map((option: ParticipationOption) => (
            <button
              key={option.value}
              onClick={() => handleParticipationChange(option.value)}
              className={`
                w-full text-left p-4 rounded-lg border-2 transition-all duration-200 flex items-center space-x-4
                ${participationStyle === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <span className="text-2xl">{option.icon}</span>
              <div>
                <div className="font-semibold">{option.label}</div>
                <div className="text-sm opacity-75">{option.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← {t('onboarding.values.actions.back')}
        </button>
        <button
          onClick={onNext}
          disabled={!canContinue}
          className={`
            px-6 py-3 rounded-lg font-semibold transition-colors
            ${canContinue
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {t('onboarding.values.actions.continue')}
        </button>
      </div>

      <div className="text-center text-sm text-gray-500">
        {t('onboarding.values.progress', { current: 3, total: 6 })}
      </div>
    </div>
  )
}
