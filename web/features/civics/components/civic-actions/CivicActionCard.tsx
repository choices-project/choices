/**
 * Civic Action Card Component
 * 
 * Displays a single civic action in card format with sign/endorse functionality
 * 
 * Feature Flag: CIVIC_ENGAGEMENT_V2
 */

'use client';

import { AlertCircle, Calendar, Flag, Heart, Users } from 'lucide-react';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/hooks/useI18n';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { logger } from '@/lib/utils/logger';

export type CivicAction = {
  id: string;
  title: string;
  description: string | null;
  action_type: 'petition' | 'campaign' | 'survey' | 'event' | 'protest' | 'meeting';
  category: string | null;
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  current_signatures: number | null;
  required_signatures: number | null;
  is_public: boolean;
  created_at: string | null;
  end_date: string | null;
  target_representatives: number[] | null;
  target_state: string | null;
  target_district: string | null;
};

type CivicActionCardProps = {
  action: CivicAction;
  onSign?: (actionId: string) => Promise<void>;
  onView?: (actionId: string) => void;
  showSignButton?: boolean;
  signed?: boolean;
  className?: string;
};

const URGENCY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export function CivicActionCard({
  action,
  onSign,
  onView,
  showSignButton = true,
  signed = false,
  className = '',
}: CivicActionCardProps) {
  const { t, currentLanguage } = useI18n();
  const featureEnabled = isFeatureEnabled('CIVIC_ENGAGEMENT_V2');
  const [isSigning, setIsSigning] = useState(false);
  const [hasSigned, setHasSigned] = useState(signed);
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(currentLanguage ?? undefined),
    [currentLanguage],
  );
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(currentLanguage ?? undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    [currentLanguage],
  );

  if (!featureEnabled) {
    return null;
  }

  const handleSign = async () => {
    if (!onSign || hasSigned || isSigning) return;

    setIsSigning(true);
    try {
      await onSign(action.id);
      setHasSigned(true);
    } catch (error) {
      logger.error('Error signing civic action', error);
    } finally {
      setIsSigning(false);
    }
  };

  const handleView = () => {
    if (onView) {
      onView(action.id);
    }
  };

  const signatureCount = action.current_signatures ?? 0;
  const requiredSignatures = action.required_signatures ?? 0;
  const signatureProgress = requiredSignatures > 0 
    ? Math.min((signatureCount / requiredSignatures) * 100, 100)
    : 0;

  const isExpired = action.end_date && new Date(action.end_date) < new Date();
  const isActive = action.status === 'active' && !isExpired;

  const typeLabel = t(`civics.actions.card.type.${action.action_type}`);
  const urgencyLabel = t(`civics.actions.card.urgency.${action.urgency_level}`);
  const signatureLabel = t('civics.actions.card.signatures', {
    current: numberFormatter.format(signatureCount),
    required: numberFormatter.format(requiredSignatures),
  });
  const signaturePercentLabel = t('civics.actions.card.percentage', {
    value: Math.round(signatureProgress),
  });
  const formattedEndDate = action.end_date ? dateFormatter.format(new Date(action.end_date)) : null;
  const statusMessages: string[] = [];
  if (action.status === 'completed') {
    statusMessages.push(t('civics.actions.card.statusMessages.completed'));
  }
  if (action.status === 'cancelled') {
    statusMessages.push(t('civics.actions.card.statusMessages.cancelled'));
  }
  if (action.status === 'paused') {
    statusMessages.push(t('civics.actions.card.statusMessages.paused'));
  }
  if (isExpired) {
    statusMessages.push(t('civics.actions.card.statusMessages.expired'));
  }

  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {typeLabel}
              </Badge>
              <Badge className={URGENCY_COLORS[action.urgency_level]}>
                {urgencyLabel}
              </Badge>
              {!action.is_public && (
                <Badge variant="secondary" className="text-xs">
                  {t('civics.actions.card.badges.draft')}
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg mb-2 line-clamp-2">
              {action.title}
            </CardTitle>
            {action.description && (
              <CardDescription className="line-clamp-2">
                {action.description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Signature Progress */}
        {action.action_type === 'petition' && requiredSignatures > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">
                <Users className="inline w-4 h-4 mr-1" />
                {signatureLabel}
              </span>
              <span className="text-gray-500">{signaturePercentLabel}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${signatureProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          {action.end_date && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {isExpired || !formattedEndDate
                  ? t('civics.actions.card.metadata.ended')
                  : t('civics.actions.card.metadata.endsOn', { date: formattedEndDate })}
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
            <Badge variant="outline" className="text-xs">
              {action.category}
            </Badge>
          )}
        </div>

        {/* Status Messages */}
        {!isActive && statusMessages.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-amber-600">
            <AlertCircle className="w-4 h-4" />
            <span>{statusMessages.join(' ')}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2">
        <Link
          href={`/civic-actions/${action.id}`}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          onClick={handleView}
        >
          {t('civics.actions.card.buttons.viewDetails')}
        </Link>
        {showSignButton && isActive && action.action_type === 'petition' && (
          <Button
            onClick={handleSign}
            disabled={isSigning || hasSigned}
            size="sm"
            variant={hasSigned ? 'secondary' : 'default'}
          >
            {hasSigned ? (
              <>
                <Heart className="w-4 h-4 mr-1 fill-current" />
                {t('civics.actions.card.buttons.signed')}
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 mr-1" />
                {isSigning
                  ? t('civics.actions.card.buttons.signing')
                  : t('civics.actions.card.buttons.sign')}
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

