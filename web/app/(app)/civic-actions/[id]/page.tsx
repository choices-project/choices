'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Flag, Heart, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { CivicAction } from '@/features/civics/components/civic-actions/CivicActionCard';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { useAppActions } from '@/lib/stores/appStore';
import { logger } from '@/lib/utils/logger';

const URGENCY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function CivicActionDetailPage() {
  const params = useParams();
  const { setCurrentRoute, setBreadcrumbs } = useAppActions();
  const [action, setAction] = useState<CivicAction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  const actionId = params.id as string;

  useEffect(() => {
    if (actionId) {
      setCurrentRoute(`/civic-actions/${actionId}`);
      setBreadcrumbs([
        { label: 'Home', href: '/' },
        { label: 'Civic Actions', href: '/civic-actions' },
        { label: action?.title || 'Loading...', href: `/civic-actions/${actionId}` },
      ]);
    }
  }, [actionId, action?.title, setCurrentRoute, setBreadcrumbs]);

  useEffect(() => {
    const fetchAction = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/civic-actions/${actionId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch civic action');
        }

        const data = await response.json();

        if (data.success && data.data) {
          setAction(data.data as CivicAction);
        } else {
          throw new Error(data.error || 'Invalid response');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        logger.error('Error fetching civic action', err);
      } finally {
        setLoading(false);
      }
    };

    if (actionId) {
      fetchAction();
    }
  }, [actionId]);

  const handleSign = async () => {
    if (hasSigned || isSigning || !action) return;

    setIsSigning(true);
    try {
      const response = await fetch(`/api/civic-actions/${actionId}/sign`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to sign action');
      }

      const data = await response.json();
      if (data.success) {
        setHasSigned(true);
        // Update signature count
        setAction((prev) =>
          prev
            ? {
                ...prev,
                current_signatures: data.data.signature_count ?? (prev.current_signatures ?? 0) + 1,
              }
            : null
        );
      }
    } catch (err) {
      logger.error('Error signing action', err);
    } finally {
      setIsSigning(false);
    }
  };

  if (!isFeatureEnabled('CIVIC_ENGAGEMENT_V2')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Civic Engagement V2</h1>
          <p className="text-gray-600">This feature is currently disabled.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-full mb-8" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !action) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/civic-actions">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Actions
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Civic action not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const signatureCount = action.current_signatures ?? 0;
  const requiredSignatures = action.required_signatures ?? 0;
  const signatureProgress = requiredSignatures > 0
    ? Math.min((signatureCount / requiredSignatures) * 100, 100)
    : 0;

  const isExpired = action.end_date && new Date(action.end_date) < new Date();
  const isActive = action.status === 'active' && !isExpired;

  const urgencyLabel = (() => {
    switch (action.urgency_level) {
      case 'low':
        return 'Low urgency';
      case 'medium':
        return 'Medium urgency';
      case 'high':
        return 'High urgency';
      case 'critical':
        return 'Critical urgency';
      default:
        return 'Urgency';
    }
  })();

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedEndDate = action.end_date ? dateFormatter.format(new Date(action.end_date)) : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/civic-actions">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Actions
        </Button>
      </Link>

      <Card data-testid="civic-action-card">
        <CardHeader>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">{action.action_type}</Badge>
                <Badge className={URGENCY_COLORS[action.urgency_level]}>
                  {urgencyLabel}
                </Badge>
                {!action.is_public && (
                  <Badge variant="secondary">Draft</Badge>
                )}
              </div>
              <CardTitle className="text-3xl mb-2">{action.title}</CardTitle>
              {action.description && (
                <CardDescription className="text-base">
                  {action.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Signature Progress */}
          {action.action_type === 'petition' && requiredSignatures > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {signatureCount.toLocaleString()} / {requiredSignatures.toLocaleString()} signatures
                </span>
                <span className="text-gray-500">{Math.round(signatureProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${signatureProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
            {action.end_date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {isExpired || !formattedEndDate
                    ? `Ended on ${formattedEndDate}`
                    : `Ends on ${formattedEndDate}`}
                </span>
              </div>
            )}
            {action.target_state && (
              <div className="flex items-center gap-1">
                <Flag className="w-4 h-4" />
                <span>{action.target_state}</span>
              </div>
            )}
            {action.category && (
              <Badge variant="outline">{action.category}</Badge>
            )}
          </div>

          {/* Status Messages */}
          {!isActive && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {action.status === 'completed' && 'This action has been completed.'}
                {action.status === 'cancelled' && 'This action has been cancelled.'}
                {action.status === 'paused' && 'This action is currently paused.'}
                {isExpired && 'This action has ended.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Sign Button */}
          {isActive && action.action_type === 'petition' && (
            <div className="mt-6">
              <Button
                onClick={handleSign}
                disabled={isSigning || hasSigned}
                size="lg"
                variant={hasSigned ? 'secondary' : 'default'}
              >
                {hasSigned ? (
                  <>
                    <Heart className="w-4 h-4 mr-2 fill-current" />
                    Signed
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-2" />
                    {isSigning ? 'Signing...' : 'Sign'}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

