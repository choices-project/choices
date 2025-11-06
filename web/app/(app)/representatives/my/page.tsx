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
import { useEffect, useState } from 'react';

import { RepresentativeCard } from '@/components/representative/RepresentativeCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BulkContactModal from '@/features/contact/components/BulkContactModal';
import ContactModal from '@/features/contact/components/ContactModal';
import { useAuth } from '@/hooks/useAuth';
import { withOptional } from '@/lib/util/objects';
import { logger } from '@/lib/utils/logger';
import type { Representative } from '@/types/representative';

// Prevent static generation since this requires authentication
export const dynamic = 'force-dynamic';

type FollowedRepresentative = {
  follow: {
    id: string;
    notify_on_votes: boolean;
    notify_on_committee_activity: boolean;
    notify_on_public_statements: boolean;
    notify_on_events: boolean;
    notes?: string;
    tags?: string[];
    created_at: string;
    updated_at: string;
  };
  representative: Representative;
};

export default function MyRepresentativesPage() {
  const [representatives, setRepresentatives] = useState<FollowedRepresentative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showBulkContactModal, setShowBulkContactModal] = useState(false);
  const [selectedRepresentative, setSelectedRepresentative] = useState<Representative | null>(null);
  
  const { user } = useAuth();

  useEffect(() => {
    const fetchFollowedRepresentatives = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/representatives/my');
        
        if (!response.ok) {
          if (response.status === 401) {
            setError('Please sign in to view your followed representatives');
            return;
          }
          throw new Error('Failed to fetch followed representatives');
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          setRepresentatives(data.data.representatives ?? []);
        } else {
          throw new Error(data.error ?? 'Failed to fetch followed representatives');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        logger.error('Error fetching followed representatives:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchFollowedRepresentatives();
  }, []);

  const handleUnfollow = async () => {
    // Refresh the list after unfollow
    try {
      const response = await fetch('/api/representatives/my');
      const data = await response.json();
      if (data.success && data.data) {
        setRepresentatives(data.data.representatives ?? []);
      }
    } catch (err) {
      logger.error('Error refreshing followed representatives:', err);
    }
  };

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

      {representatives.length === 0 ? (
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
              {representatives.length} {representatives.length === 1 ? 'representative' : 'representatives'}
            </p>
            <div className="flex space-x-2">
              {representatives.length > 1 && user && (
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
            {representatives.map(({ representative }) => (
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
          representative={withOptional({
            id: selectedRepresentative.id,
            name: selectedRepresentative.name,
            office: selectedRepresentative.office ?? 'Unknown Office',
            party: selectedRepresentative.party,
          }, {
            photo: selectedRepresentative.primary_photo_url ?? undefined,
          })}
          userId={user.id}
        />
      )}

      {user && showBulkContactModal && (
        <BulkContactModal
          isOpen={showBulkContactModal}
          onClose={() => setShowBulkContactModal(false)}
          representatives={representatives.map(({ representative }) => representative)}
          userId={user.id}
        />
      )}
    </div>
  );
}

