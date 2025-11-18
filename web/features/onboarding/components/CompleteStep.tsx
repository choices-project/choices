'use client'

import { CheckCircle, Heart, Users, TrendingUp, Shield } from 'lucide-react';
import React, { useMemo } from 'react';

import { useI18n } from '@/hooks/useI18n';

import type { CompleteStepProps, ParticipationStyle } from '../types';

/**
 * Complete Step Component
 * 
 * Final step of the onboarding flow that displays:
 * - Success confirmation message
 * - Profile summary based on provided data
 * - Next steps and actions
 * - Open source contribution information
 * 
 * Features:
 * - Dynamic content based on user selections
 * - Participation style icons and descriptions
 * - Call-to-action buttons
 * - Loading state support
 * 
 * @param {CompleteStepProps} props - Component props
 * @returns {JSX.Element} Completion confirmation interface
 */
export default function CompleteStep({ data, onComplete, onBack, isLoading = false }: CompleteStepProps) {
  const { t } = useI18n();
  const participationStyle: ParticipationStyle = data.participationStyle ?? 'observer';
  const getParticipationIcon = (style: ParticipationStyle) => {
    switch (style) {
      case 'observer': return '👁️'
      case 'contributor': return '💡'
      case 'leader': return '🚀'
      default: return '👤'
    }
  }

  const participationLabels = useMemo(() => ({
    observer: t('onboarding.complete.participation.observer'),
    contributor: t('onboarding.complete.participation.contributor'),
    leader: t('onboarding.complete.participation.leader'),
    default: t('onboarding.complete.participation.default'),
  }), [t]);

  const getParticipationLabel = (style: ParticipationStyle) =>
    participationLabels[style] || participationLabels.default;

  const nextSteps = useMemo(() => [
    t('onboarding.complete.next.steps.findCandidates'),
    t('onboarding.complete.next.steps.askQuestions'),
    t('onboarding.complete.next.steps.followMoney'),
    t('onboarding.complete.next.steps.connectVoters'),
  ], [t]);

  const codeDetails = useMemo(() => [
    t('onboarding.complete.contribute.code.details.frontend'),
    t('onboarding.complete.contribute.code.details.backend'),
    t('onboarding.complete.contribute.code.details.apis'),
    t('onboarding.complete.contribute.code.details.privacy'),
  ], [t]);

  const communityDetails = useMemo(() => [
    t('onboarding.complete.contribute.community.details.reportBugs'),
    t('onboarding.complete.contribute.community.details.documentation'),
    t('onboarding.complete.contribute.community.details.share'),
    t('onboarding.complete.contribute.community.details.test'),
  ], [t]);

  return (
    <div className="space-y-8" >
      {/* Success message */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-bounce shadow-lg">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 animate-fade-in">
          {t('onboarding.complete.success.title')}
        </h2>
        <p className="text-gray-600 animate-fade-in-delay">
          {t('onboarding.complete.success.subtitle')}
        </p>
        
        {/* Achievement celebration */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full inline-block animate-pulse">
          {t('onboarding.complete.success.celebration')}
        </div>
      </div>

      {/* Profile summary */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          {t('onboarding.complete.summary.title')}
        </h3>
        
        <div className="space-y-6">
          {/* Basic info */}
          <div className="flex items-center space-x-4">
            <div className="w-15 h-15 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-lg">
                {data.displayName ? data.displayName.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{data.displayName || t('onboarding.complete.summary.userFallback')}</h4>
              <p className="text-gray-600 text-sm">{t('onboarding.complete.summary.ready')}</p>
            </div>
          </div>

          {/* Values */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Heart className="w-5 h-5 text-red-500 mr-2" />
              {t('onboarding.complete.summary.valuesTitle')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.primaryConcerns?.map((concern: string) => (
                <span
                  key={concern}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {concern}
                </span>
              ))}
            </div>
          </div>

          {/* Community focus */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Users className="w-5 h-5 text-blue-500 mr-2" />
              {t('onboarding.complete.summary.communityTitle')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.communityFocus?.map((focus: string) => (
                <span
                  key={focus}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {focus}
                </span>
              ))}
            </div>
          </div>

          {/* Participation style */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <TrendingUp className="w-5 h-5 text-purple-500 mr-2" />
              {t('onboarding.complete.summary.participationTitle')}
            </h4>
          <div className="flex items-center space-x-2">
              <span className="text-2xl">{getParticipationIcon(participationStyle)}</span>
              <span className="text-gray-700">{getParticipationLabel(participationStyle)}</span>
            </div>
          </div>

          {/* Privacy settings */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Shield className="w-5 h-5 text-gray-600 mr-2" />
              {t('onboarding.complete.summary.privacy.title')}
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>{t('onboarding.complete.summary.privacy.shareProfile')}</span>
                <span className={data.privacy?.shareProfile ? 'text-green-600' : 'text-gray-400'}>
                  {data.privacy?.shareProfile ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('onboarding.complete.summary.privacy.shareDemographics')}</span>
                <span className={data.privacy?.shareDemographics ? 'text-green-600' : 'text-gray-400'}>
                  {data.privacy?.shareDemographics ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('onboarding.complete.summary.privacy.allowAnalytics')}</span>
                <span className={data.privacy?.allowAnalytics ? 'text-green-600' : 'text-gray-400'}>
                  {data.privacy?.allowAnalytics ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What's next */}
      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-4">{t('onboarding.complete.next.title')}</h3>
        <div className="space-y-3 text-blue-800 text-sm">
          {nextSteps.map((step, index) => (
            <div key={step} className="flex items-start space-x-2">
              <span className="text-blue-600">{index + 1}.</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Open Source Contribution */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
        <h3 className="font-semibold text-green-900 mb-4 flex items-center">
          <span className="mr-2">🚀</span>
          {t('onboarding.complete.contribute.title')}
        </h3>
        <p className="text-green-800 text-sm mb-4">
          {t('onboarding.complete.contribute.subtitle')}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2 flex items-center">
              <span className="mr-2">💻</span>
              {t('onboarding.complete.contribute.code.title')}
            </h4>
            <p className="text-sm text-green-800 mb-3">
              {t('onboarding.complete.contribute.code.description')}
            </p>
            <div className="space-y-2 text-xs text-green-700">
              {codeDetails.map((detail) => (
                <div key={detail}>• {detail}</div>
              ))}
            </div>
            <button className="mt-3 w-full px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
              {t('onboarding.complete.contribute.code.action')}
            </button>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2 flex items-center">
              <span className="mr-2">🤝</span>
              {t('onboarding.complete.contribute.community.title')}
            </h4>
            <p className="text-sm text-green-800 mb-3">
              {t('onboarding.complete.contribute.community.description')}
            </p>
            <div className="space-y-2 text-xs text-green-700">
              {communityDetails.map((detail) => (
                <div key={detail}>• {detail}</div>
              ))}
            </div>
            <button className="mt-3 w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              {t('onboarding.complete.contribute.community.action')}
            </button>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>{t('onboarding.complete.contribute.note.label')}</strong> {t('onboarding.complete.contribute.note.message')}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
        >
          {t('onboarding.complete.actions.back')}
        </button>
        <button
          onClick={onComplete}
          disabled={isLoading}
          data-testid="complete-onboarding"
          className={`
            px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2
            ${isLoading 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
            }
          `}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              <span>{t('onboarding.complete.actions.saving')}</span>
            </>
          ) : (
            <>
              <span>{t('onboarding.complete.actions.complete')}</span>
              <span>→</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
