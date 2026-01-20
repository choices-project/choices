/**
 * Contact Representatives Section
 *
 * User dashboard section for contacting elected representatives
 * Features:
 * - List of user's representatives
 * - Quick contact buttons
 * - Message history
 * - Real-time updates
 *
 * Created: January 23, 2025
 * Updated: November 03, 2025
 * Status: ✅ ACTIVE
 */

'use client';

import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import React, { useMemo, useEffect, useState } from 'react';

import {
  trackCivicsRepresentativeEvent,
  type CivicsRepresentativeEventBase
} from '@/features/civics/analytics/civicsAnalyticsEvents';
import { useElectionCountdown, formatElectionDate } from '@/features/civics/utils/civicsCountdownUtils';
import { getRepresentativeDivisionIds } from '@/features/civics/utils/divisions';
import { useFeatureFlag } from '@/features/pwa/hooks/useFeatureFlags';

import {
  useAnalyticsActions,
  useContactActions,
  useUser
} from '@/lib/stores';

import { useI18n } from '@/hooks/useI18n';

import ContactModal from './ContactModal';
import { useContactThreads } from '../hooks/useContactMessages';

import type { Representative } from '@/types/representative';



const getRepresentativePhotoUrl = (rep: Representative): string | undefined => {
  if (rep.primary_photo_url) {
    return rep.primary_photo_url;
  }

  const primary = rep.photos?.find(photo => photo.is_primary);
  if (primary?.url) {
    return primary.url;
  }

  return rep.photos?.[0]?.url;
};

type ContactRepresentativesSectionProps = {
  representatives: Representative[];
  className?: string;
}

export default function ContactRepresentativesSection({
  representatives,
  className = ''
}: ContactRepresentativesSectionProps) {
  const { t, currentLanguage } = useI18n();
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedRepresentative, setSelectedRepresentative] = useState<Representative | null>(null);

  // Feature flag check
  const { enabled: contactSystemEnabled } = useFeatureFlag('CONTACT_INFORMATION_SYSTEM');

  // Auth and contact hooks
  const user = useUser();
  const { threads, loading: threadsLoading } = useContactThreads();
  const { resetContactState } = useContactActions();

  // Elections context
  const divisionIds = useMemo(() => {
    const divisions = new Set<string>();
    representatives.forEach((rep) => {
      const candidate = rep.ocdDivisionIds ?? rep.division_ids ?? [];
      if (!Array.isArray(candidate)) {
        return;
      }
      candidate.forEach((division) => {
        if (typeof division === 'string' && division.trim().length > 0) {
          divisions.add(division.trim());
        }
      });
    });
    return Array.from(divisions);
  }, [representatives]);

  const { trackEvent } = useAnalyticsActions();
  const {
    elections: upcomingElections,
    nextElection: hookNextElection,
    loading: electionLoading,
    error: electionError,
    daysUntilNextElection,
  } = useElectionCountdown(divisionIds, {
    analytics: {
      surface: 'contact_section',
      metadata: {
        representativeCount: representatives.length,
      },
    },
  });

  useEffect(() => {
    if (!user) {
      resetContactState();
    }
  }, [resetContactState, user]);

  const recentThreads = useMemo(() => threads.slice(0, 3), [threads]);
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(currentLanguage ?? undefined),
    [currentLanguage],
  );
  const lastMessageFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(currentLanguage ?? undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    [currentLanguage],
  );
  const representativeCountLabel = useMemo(
    () =>
      t('contact.representatives.header.count', {
        count: representatives.length,
        formattedCount: numberFormatter.format(representatives.length),
      }),
    [numberFormatter, representatives.length, t],
  );

  const handleContactRepresentative = (representative: Representative) => {
    const divisions = getRepresentativeDivisionIds(representative);

    const baseEvent: CivicsRepresentativeEventBase = {
      representativeId: representative.id ?? null,
      representativeName: representative.name ?? null,
      divisionIds: divisions,
      nextElectionId: hookNextElection?.election_id ?? null,
      nextElectionDay: hookNextElection?.election_day ?? null,
      electionCountdownDays: daysUntilNextElection ?? null,
      source: 'contact_section',
    };

    trackCivicsRepresentativeEvent(trackEvent, {
      type: 'civics_representative_contact_launch',
      data: baseEvent,
    });
    setSelectedRepresentative(representative);
    setShowContactModal(true);
  };

  if (!contactSystemEnabled) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center mb-4">
          <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
        </div>
        <p className="text-yellow-800 text-center">
          {t('contact.representatives.featureDisabled')}
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center mb-4">
          <UserIcon className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-600 text-center">
          {t('contact.representatives.authRequired')}
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <ChatBubbleLeftRightIcon className="h-6 w-6 mr-2 text-blue-600" />
            {t('contact.representatives.header.title')}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {t('contact.representatives.header.subtitle')}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {representativeCountLabel}
        </div>
      </div>

      {/* Upcoming Elections Context */}
      {upcomingElections.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800 flex items-start space-x-3">
          <ClockIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">
              {t('contact.representatives.elections.title')}
            </p>
            <ul className="mt-1 space-y-1">
              {upcomingElections.slice(0, 3).map((election) => (
                <li key={election.election_id} className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-blue-500" />
                  <span className="flex flex-wrap gap-1">
                    <span className="font-medium">{election.name}</span>
                    <span className="ml-1 text-blue-700">
                      {t('contact.representatives.elections.date', {
                        date: formatElectionDate(election.election_day, currentLanguage),
                      })}
                    </span>
                  </span>
                </li>
              ))}
              {upcomingElections.length > 3 && (
                <li className="text-blue-700">
                  {t('contact.representatives.elections.more', {
                    count: numberFormatter.format(upcomingElections.length - 3),
                  })}
                </li>
              )}
              {daysUntilNextElection != null && (
                <li className="text-blue-700 text-xs">
                  {daysUntilNextElection === 0
                    ? t('contact.representatives.elections.countdown.today')
                    : t('contact.representatives.elections.countdown.inDays', {
                        count: daysUntilNextElection,
                        formattedCount: numberFormatter.format(daysUntilNextElection),
                      })}
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Representatives List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {representatives.map((rep) => {
          const photoUrl = getRepresentativePhotoUrl(rep);

          return (
            <div
              key={rep.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-3">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={rep.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {rep.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{rep.name}</h3>
                  <p className="text-sm text-gray-600">{rep.office}</p>
                  {rep.district && (
                    <p className="text-xs text-gray-500">{rep.district}</p>
                  )}
                  {rep.party && (
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        rep.party === 'Democratic'
                          ? 'bg-blue-100 text-blue-800'
                          : rep.party === 'Republican'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {rep.party}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleContactRepresentative(rep)}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <EnvelopeIcon className="h-4 w-4" />
                  <span>{t('contact.representatives.actions.message')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Messages */}
      {threadsLoading && recentThreads.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-500">
          {t('contact.representatives.threads.loading')}
        </div>
      )}
      {recentThreads.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
            {t('contact.representatives.threads.title')}
          </h3>
          <div className="space-y-2">
            {recentThreads.map((thread) => (
              <div key={thread.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {thread.subject}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('contact.representatives.threads.count', {
                      count: thread.messageCount,
                      formattedCount: numberFormatter.format(thread.messageCount),
                    })}
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>
                    {thread.lastMessageAt
                      ? lastMessageFormatter.format(new Date(thread.lastMessageAt))
                      : t('contact.representatives.threads.noMessages')
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && selectedRepresentative && (
        <ContactModal
          isOpen={showContactModal}
          onClose={() => {
            setShowContactModal(false);
            setSelectedRepresentative(null);
          }}
          representative={selectedRepresentative}
          userId={user.id}
        />
      )}
    </div>
  );
}
