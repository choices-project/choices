/**
 * My Representatives Page
 * 
 * Dashboard showing all representatives the user is following
 * 
 * Created: January 26, 2025
 * Status: ✅ PRODUCTION
 */

'use client';

import { Heart, Users, Loader2, AlertCircle, Mail, Send } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { RepresentativeCard } from '@/features/civics/components/representative/RepresentativeCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BulkContactModal from '@/features/contact/components/BulkContactModal';
import ContactModal from '@/features/contact/components/ContactModal';
import { useAuth } from '@/hooks/useAuth';
import {
  useUserRepresentativeEntries,
  useGetUserRepresentatives,
  useRepresentativeGlobalLoading,
  useRepresentativeError
} from '@/lib/stores/representativeStore';
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

  const followedRepresentatives = useMemo(
    () => representativeEntries.map((entry) => entry.representative),
    [representativeEntries]
  );

  const representativeCount = representativeEntries.length;

  useEffect(() => {
    void getUserRepresentatives();
  }, [getUserRepresentatives]);

  const handleUnfollow = useCallback(() => {
    void getUserRepresentatives();
  }, [getUserRepresentatives]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading your representatives...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span>Error</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button asChild>
              <Link href="/representatives">Browse Representatives</Link>
            </Button>
          </CardContent>
        </Card>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-400" />
              <span>No Representatives Followed</span>
            </CardTitle>
            <CardDescription>
              Start following representatives to see them here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/representatives">Browse Representatives</Link>
            </Button>
          </CardContent>
        </Card>
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

