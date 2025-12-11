'use client';

import { Users, BarChart3, Eye, Clock, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import type { PollRow } from '@/features/polls/types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useI18n } from '@/hooks/useI18n';

type PollCardProps = {
  poll: PollRow;
  showActions?: boolean;
  className?: string;
};

const getStatusColor = (status: PollRow['status']) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'closed':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'draft':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'archived':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const PollCard: React.FC<PollCardProps> = ({ poll, showActions = true, className = '' }) => {
  const { t, currentLanguage } = useI18n();

  const votingMethodLabels: Record<string, string> = {
    single: t('polls.card.votingMethod.single'),
    'single-choice': t('polls.card.votingMethod.single'),
    approval: t('polls.card.votingMethod.approval'),
    ranked: t('polls.card.votingMethod.ranked'),
    'ranked-choice': t('polls.card.votingMethod.ranked'),
    quadratic: t('polls.card.votingMethod.quadratic'),
    range: t('polls.card.votingMethod.range'),
    multiple: t('polls.card.votingMethod.multiple'),
    'multiple-choice': t('polls.card.votingMethod.multiple'),
  };

  const statusLabels: Record<string, string> = {
    active: t('polls.card.status.active'),
    closed: t('polls.card.status.closed'),
    draft: t('polls.card.status.draft'),
    archived: t('polls.card.status.archived'),
  };

  const getVotingMethodLabel = (method: string | null | undefined) => {
    const normalized = (method ?? 'single').toLowerCase();
    return votingMethodLabels[normalized] ?? t('polls.card.votingMethod.unknown');
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat(currentLanguage ?? undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat(currentLanguage ?? undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  const formatNumber = (value: number) =>
    new Intl.NumberFormat(currentLanguage ?? undefined, {
      maximumFractionDigits: 0,
    }).format(value);

  const createdBy =
    (poll as PollRow & { created_by?: string | null; owner_name?: string | null }).created_by ??
    (poll as PollRow & { owner_name?: string | null }).owner_name ??
    null;

  const optionsArray = Array.isArray((poll as PollRow & { options?: string[] | null }).options)
    ? ((poll as PollRow & { options?: string[] | null }).options as string[])
    : [];

  const totalVotes =
    typeof (poll as PollRow & { total_votes?: number | null }).total_votes === 'number'
      ? ((poll as PollRow & { total_votes?: number | null }).total_votes ?? 0)
      : 0;

  const participation =
    typeof (poll as PollRow & { participation?: number | null }).participation === 'number'
      ? ((poll as PollRow & { participation?: number | null }).participation ?? 0)
      : 0;

  const endTime = (poll as PollRow & { end_time?: string | null }).end_time ?? null;
  const createdAt = (poll as PollRow & { created_at?: string | null }).created_at ?? null;
  const votingMethod = (poll as PollRow & { voting_method?: string | null }).voting_method ?? null;

  const status = poll.status ?? 'draft';
  const displayTitle =
    poll.title ?? (poll as PollRow & { question?: string | null }).question ?? t('polls.card.untitled');

  const optionsPreview = optionsArray.slice(0, 3);
  const optionsCount = optionsArray.length;

  return (
    <Card className={`hover:shadow-md transition-shadow duration-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">{displayTitle}</CardTitle>
            {poll.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{poll.description}</p>
            )}
          </div>
          <Badge className={`ml-2 shrink-0 ${getStatusColor(status)}`}>{statusLabels[status] ?? status}</Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <User className="w-4 h-4 mr-2" />
            <span>
              {t('polls.card.createdBy', { name: createdBy ?? t('polls.card.unknownCreator') })}
            </span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{t('polls.card.createdOn', { date: formatDate(createdAt) })}</span>
          </div>

          {endTime && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span>{t('polls.card.endsOn', { date: formatDate(endTime), time: formatTime(endTime) })}</span>
            </div>
          )}

          <div className="flex items-center text-sm text-gray-600">
            <BarChart3 className="w-4 h-4 mr-1" />
            <span>{getVotingMethodLabel(votingMethod)}</span>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">{t('polls.card.optionsHeading')}</h4>
          <div className="space-y-1">
            {optionsPreview.map((option, index) => (
              <div key={`option-${option}-${index}`} className="text-sm text-gray-600 truncate">
                {t('polls.card.optionItem', { index: index + 1, option })}
              </div>
            ))}
            {optionsCount > 3 && (
              <div className="text-sm text-gray-500">
                {t('polls.card.moreOptions', { count: optionsCount - 3 })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{t('polls.card.votes', { count: totalVotes, formattedCount: formatNumber(totalVotes) })}</span>
          </div>
          <div className="flex items-center">
            <BarChart3 className="w-4 h-4 mr-1" />
            <span>
              {t('polls.card.participation', {
                count: participation,
                formattedCount: formatNumber(participation),
              })}
            </span>
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2">
            <Button asChild variant="default" className="flex-1">
              <Link href={`/polls/${poll.id}`}>
                <Eye className="w-4 h-4 mr-2" />
                {t('polls.card.actions.view')}
              </Link>
            </Button>

            {status === 'active' && (
              <Button asChild variant="outline" className="flex-1">
                <Link href={`/polls/${poll.id}/vote`}>{t('polls.card.actions.vote')}</Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PollCard;
