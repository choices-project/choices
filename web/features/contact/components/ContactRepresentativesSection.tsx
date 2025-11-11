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
  UsersIcon,
} from '@heroicons/react/24/outline';
import React, { useMemo, useEffect, useState, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { RepresentativeList } from '@/components/representative/RepresentativeList';
import { useFeatureFlag } from '@/features/pwa/hooks/useFeatureFlags';
import { useUser, useContactActions } from '@/lib/stores';
import {
  useLocationRepresentatives,
  useRepresentativeGlobalLoading,
  useRepresentativeError,
  useUserRepresentativeEntries,
  useGetUserRepresentatives,
} from '@/lib/stores/representativeStore';
import type { Representative } from '@/types/representative';

import { useContactThreads } from '../hooks/useContactMessages';

import ContactModal from './ContactModal';
import BulkContactModal from './BulkContactModal';

type ContactRepresentativesSectionProps = {
  representatives: Representative[];
  className?: string;
}

export default function ContactRepresentativesSection({ 
  representatives, 
  className = '' 
}: ContactRepresentativesSectionProps) {
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedRepresentative, setSelectedRepresentative] = useState<Representative | null>(null);

  // Feature flag check
  const { enabled: contactSystemEnabled } = useFeatureFlag('CONTACT_INFORMATION_SYSTEM');
  
  // Auth and contact hooks
  const user = useUser();
  const { threads, loading: threadsLoading } = useContactThreads();
  const { resetContactState } = useContactActions();

  useEffect(() => {
    if (!user) {
      resetContactState();
    }
  }, [resetContactState, user]);

  const recentThreads = useMemo(() => threads.slice(0, 3), [threads]);

  const handleContactRepresentative = (representative: Representative) => {
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
          Contact system is currently disabled. This feature will be available soon.
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
          Please log in to contact your representatives.
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
            Contact Your Representatives
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Send messages directly to your elected officials
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {representatives.length} representative{representatives.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Representatives List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {representatives.map((rep) => (
          <div key={rep.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-3">
              {rep.photo ? (
                <img
                  src={rep.photo}
                  alt={rep.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {rep.name.split(' ').map(n => n[0]).join('')}
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
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                    rep.party === 'Democratic' 
                      ? 'bg-blue-100 text-blue-800' 
                      : rep.party === 'Republican'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {rep.party}
                  </span>
                )}
              </div>
              
              <button
                onClick={() => handleContactRepresentative(rep)}
                className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <EnvelopeIcon className="h-4 w-4" />
                <span>Message</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Messages */}
      {threadsLoading && recentThreads.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-500">
          Loading recent conversations...
        </div>
      )}
      {recentThreads.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
            Recent Messages
          </h3>
          <div className="space-y-2">
            {recentThreads.map((thread) => (
              <div key={thread.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {thread.subject}
                  </p>
                  <p className="text-xs text-gray-500">
                    {thread.messageCount} message{thread.messageCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>
                    {thread.lastMessageAt 
                      ? new Date(thread.lastMessageAt).toLocaleDateString()
                      : 'No messages yet'
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
