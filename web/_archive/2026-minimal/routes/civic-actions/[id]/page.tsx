'use client';

/**
 * Civic Action Detail Page
 *
 * Displays a single civic action with sign/endorse capability.
 * Feature Flag: CIVIC_ENGAGEMENT_V2
 */

import { ArrowLeft, Calendar, Flag, Heart, Loader2, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import { EnhancedErrorDisplay } from '@/components/shared/EnhancedErrorDisplay';
import { CivicActionDetailSkeleton } from '@/components/shared/Skeletons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { get, post } from '@/lib/api/client';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { useNotificationActions } from '@/lib/stores';
import { useAppActions } from '@/lib/stores/appStore';
import { logger } from '@/lib/utils/logger';

import { useI18n } from '@/hooks/useI18n';

type CivicAction = {
  id: string;
  title: string;
  description: string | null;
  action_type: string;
  category: string | null;
  urgency_level: string;
  status: string;
  current_signatures: number | null;
  required_signatures: number | null;
  is_public: boolean;
  created_at: string | null;
  end_date: string | null;
  target_representatives: number[] | null;
  target_state: string | null;
  target_district: string | null;
};

const URGENCY_COLORS: Record<string, string> = {
  low: 'bg-muted text-foreground',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function CivicActionDetailPage() {
  const { t } = useI18n();
  const params = useParams();
  const router = useRouter();
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();
  const { addNotification } = useNotificationActions();
  const actionId = params?.id as string | undefined;

  const [action, setAction] = useState<CivicAction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    if (!actionId) return;

    const controller = new AbortController();

    const loadAction = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await get<CivicAction>(`/api/civic-actions/${actionId}`, {
          signal: controller.signal,
        });
        setAction(data);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load');
        logger.error('Civic action fetch failed', err);
      } finally {
        setLoading(false);
      }
    };

    loadAction();
    return () => controller.abort();
  }, [actionId]);

  useEffect(() => {
    if (action) {
      setCurrentRoute(`/civic-actions/${action.id}`);
      setSidebarActiveSection('civics');
      setBreadcrumbs([
        { label: t('navigation.home'), href: '/' },
        { label: t('civics.representatives.detail.sections.civicActions'), href: '/civics' },
        { label: action.title, href: `/civic-actions/${action.id}` },
      ]);
    }
    return () => {
      setSidebarActiveSection(null);
      setBreadcrumbs([]);
    };
  }, [action, setBreadcrumbs, setCurrentRoute, setSidebarActiveSection, t]);

  const handleSign = async () => {
    if (!actionId || isSigning || hasSigned) return;
    setIsSigning(true);
    try {
      const data = await post<{ signature_count?: number }>(
        `/api/civic-actions/${actionId}/sign`
      );
      setHasSigned(true);
      if (action) {
        setAction({
          ...action,
          current_signatures: data?.signature_count ?? (action.current_signatures ?? 0) + 1,
        });
      }
    } catch (err) {
      logger.error('Sign failed', err);
      addNotification({
        type: 'error',
        title: 'Sign Failed',
        message: 'Unable to sign this action. Please try again.',
        duration: 5000,
      });
    } finally {
      setIsSigning(false);
    }
  };

  const signatureCount = action?.current_signatures ?? 0;
  const requiredSignatures = action?.required_signatures ?? 0;
  const signatureProgress =
    requiredSignatures > 0 ? Math.min((signatureCount / requiredSignatures) * 100, 100) : 0;
  const isExpired = action?.end_date ? new Date(action.end_date) < new Date() : false;
  const isActive = action?.status === 'active' && !isExpired;
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    []
  );

  if (!isFeatureEnabled('CIVIC_ENGAGEMENT_V2')) {
    return null;
  }

  if (loading) {
    return <CivicActionDetailSkeleton />;
  }

  if (error || !action) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <EnhancedErrorDisplay
          title={t('civics.actions.list.errors.fetch')}
          message={error ?? 'Civic action not found'}
          secondaryAction={{
            label: t('civics.representatives.detail.back'),
            onClick: () => router.back(),
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center text-primary hover:text-primary/80 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        {t('civics.representatives.detail.back')}
      </button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {t(`civics.actions.card.type.${action.action_type}`)}
            </Badge>
            <Badge className={URGENCY_COLORS[action.urgency_level] ?? URGENCY_COLORS.medium}>
              {t(`civics.actions.card.urgency.${action.urgency_level}`)}
            </Badge>
            {action.category && (
              <Badge variant="secondary" className="text-xs">
                {action.category}
              </Badge>
            )}
          </div>
          <CardTitle className="text-2xl">{action.title}</CardTitle>
          {action.description && (
            <CardDescription className="text-base mt-2 whitespace-pre-wrap">
              {action.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {action.action_type === 'petition' && requiredSignatures > 0 && (
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {t('civics.actions.card.signatures', {
                    current: signatureCount.toLocaleString(),
                    required: requiredSignatures.toLocaleString(),
                  })}
                </span>
                <span className="text-muted-foreground">
                  {t('civics.actions.card.percentage', {
                    value: Math.round(signatureProgress),
                  })}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all"
                  style={{ width: `${signatureProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {action.end_date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {isExpired
                    ? t('civics.actions.card.metadata.ended')
                    : t('civics.actions.card.metadata.endsOn', {
                        date: dateFormatter.format(new Date(action.end_date)),
                      })}
                </span>
              </div>
            )}
            {action.target_state && (
              <div className="flex items-center gap-1">
                <Flag className="w-4 h-4" />
                <span>{action.target_state}</span>
              </div>
            )}
          </div>

          {isActive && action.action_type === 'petition' && (
            <Button
              onClick={handleSign}
              disabled={isSigning || hasSigned}
              size="lg"
              className="w-full sm:w-auto"
            >
              {hasSigned ? (
                <>
                  <Heart className="w-5 h-5 mr-2 fill-current" />
                  {t('civics.actions.card.buttons.signed')}
                </>
              ) : isSigning ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t('civics.actions.card.buttons.signing')}
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 mr-2" />
                  {t('civics.actions.card.buttons.sign')}
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <Link
          href="/civics"
          className="text-sm text-primary hover:underline"
        >
          ← {t('civics.representatives.detail.sections.civicActions')}
        </Link>
      </div>
    </div>
  );
}
