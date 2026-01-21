/**
 * My Representatives Page
 *
 * Dashboard showing all representatives the user is following
 *
 * Created: January 26, 2025
 * Status: ✅ PRODUCTION
 */

'use client';

import { Heart, Users, Mail, RefreshCw, Send } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { RepresentativeCard } from '@/features/civics/components/representative/RepresentativeCard';
import BulkContactModal from '@/features/contact/components/BulkContactModal';
import ContactModal from '@/features/contact/components/ContactModal';

import { EnhancedEmptyState } from '@/components/shared/EnhancedEmptyState';
import { EnhancedErrorDisplay } from '@/components/shared/EnhancedErrorDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import {
  useUserRepresentativeEntries,
  useGetUserRepresentatives,
  useRepresentativeGlobalLoading,
  useRepresentativeError
} from '@/lib/stores/representativeStore';

import { useAuth } from '@/hooks/useAuth';


import type { Representative } from '@/types/representative';

// Prevent static generation since this requires authentication
export const dynamic = 'force-dynamic';

export default function MyRepresentativesPage() {
  const [showContactModal, setShowContactModal] = useState(false);
  const [showBulkContactModal, setShowBulkContactModal] = useState(false);
  const [selectedRepresentative, setSelectedRepresentative] = useState<Representative | null>(null);

  const { user } = useAuth();
  const representativeEntries = useUserRepresentativeEntries();
  const getUserRepresentatives = useGetUserRepresentatives();
  const loading = useRepresentativeGlobalLoading();
  const error = useRepresentativeError();

  // Ref for stable store action
  const getUserRepresentativesRef = useRef(getUserRepresentatives);
  useEffect(() => { getUserRepresentativesRef.current = getUserRepresentatives; }, [getUserRepresentatives]);

  const followedRepresentatives = useMemo(
    () => representativeEntries.map((entry) => entry.representative),
    [representativeEntries]
  );

  const representativeCount = representativeEntries.length;

  useEffect(() => {
    void getUserRepresentativesRef.current();
  }, []);

  const handleUnfollow = useCallback(() => {
    void getUserRepresentativesRef.current();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8" aria-label="Loading representatives" aria-busy="true">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EnhancedErrorDisplay
          title="Error Loading Representatives"
          message={error}
          details="We encountered an issue while loading your followed representatives. This might be a temporary network problem."
          tip="Check your internet connection and try again. If the problem persists, the service may be temporarily unavailable."
          canRetry={true}
          onRetry={() => {
            void getUserRepresentativesRef.current();
          }}
          primaryAction={{
            label: 'Try Again',
            onClick: () => {
              void getUserRepresentativesRef.current();
            },
            icon: <RefreshCw className="h-4 w-4" />,
          }}
          secondaryAction={{
            label: 'Browse Representatives',
            href: '/representatives',
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
          <Heart className="w-8 h-8 text-red-500" />
          <span>My Representatives</span>
        </h1>
            <p className="text-gray-600">
          Representatives you&apos;re following. You&apos;ll be notified about their activity.
        </p>
        <div className="mt-2 flex space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/contact/history" className="flex items-center space-x-1">
              <Mail className="w-4 h-4" />
              <span>View Message History</span>
            </Link>
          </Button>
        </div>
      </div>

      {representativeCount === 0 ? (
        <EnhancedEmptyState
          icon={<Users className="h-12 w-12 text-gray-400" />}
          title="No representatives followed"
          description="Start following representatives to see them here and get notified about their activity."
          tip="Browse representatives by location, office, or search to find the ones you want to follow."
          primaryAction={{
            label: 'Browse Representatives',
            href: '/representatives',
          }}
        />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {representativeCount} {representativeCount === 1 ? 'representative' : 'representatives'}
            </p>
            <div className="flex space-x-2">
              {representativeCount > 1 && user && (
                <Button
                  variant="default"
                  onClick={() => setShowBulkContactModal(true)}
                  className="flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Contact All</span>
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link href="/representatives">
                  Browse More
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {representativeEntries.map(({ representative }) => (
              <RepresentativeCard
                key={representative.id}
                representative={representative}
                onFollow={handleUnfollow}
                onContact={(rep) => {
                  setSelectedRepresentative(rep);
                  setShowContactModal(true);
                }}
                className="h-full"
              />
            ))}
          </div>
        </>
      )}

      {/* Contact Modals */}
      {user && selectedRepresentative && (
        <ContactModal
          isOpen={showContactModal}
          onClose={() => {
            setShowContactModal(false);
            setSelectedRepresentative(null);
          }}
          representative={{
            id: selectedRepresentative.id,
            name: selectedRepresentative.name,
            office: selectedRepresentative.office ?? 'Unknown Office',
            party: selectedRepresentative.party,
            ...(selectedRepresentative.primary_photo_url ? { photo: selectedRepresentative.primary_photo_url } : {})
          }}
          userId={user.id}
        />
      )}

      {user && showBulkContactModal && (
        <BulkContactModal
          isOpen={showBulkContactModal}
          onClose={() => setShowBulkContactModal(false)}
          representatives={followedRepresentatives}
          userId={user.id}
        />
      )}
    </div>
  );
}

