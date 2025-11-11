'use client';

import { Users, BarChart3, Eye, Clock, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PollRow } from '@/features/polls/types';

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

const getVotingMethodLabel = (method: string | null | undefined) => {
  const normalized = method ?? 'single';
  switch (normalized) {
    case 'single':
    case 'single-choice':
      return 'Single Choice';
    case 'approval':
      return 'Approval';
    case 'ranked':
    case 'ranked-choice':
      return 'Ranked Choice';
    case 'quadratic':
      return 'Quadratic';
    case 'range':
      return 'Range';
    case 'multiple':
    case 'multiple-choice':
      return 'Multiple Choice';
    default:
      return 'Unknown';
  }
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatTime = (dateString: string | null | undefined) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const PollCard: React.FC<PollCardProps> = ({ poll, showActions = true, className = '' }) => {
  const createdBy =
    (poll as PollRow & { created_by?: string | null; owner_name?: string | null }).created_by ??
    (poll as PollRow & { owner_name?: string | null }).owner_name ??
    'Unknown';

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
  const displayTitle = poll.title ?? (poll as PollRow & { question?: string | null }).question ?? 'Untitled Poll';

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
          <Badge className={`ml-2 shrink-0 ${getStatusColor(status)}`}>{status}</Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <User className="w-4 h-4 mr-2" />
            <span>Created by {createdBy || 'Unknown'}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Created {formatDate(createdAt)}</span>
          </div>

          {endTime && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span>
                Ends {formatDate(endTime)} at {formatTime(endTime)}
              </span>
            </div>
          )}

          <div className="flex items-center text-sm text-gray-600">
            <BarChart3 className="w-4 h-4 mr-1" />
            <span>{getVotingMethodLabel(votingMethod)}</span>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Options:</h4>
          <div className="space-y-1">
            {optionsPreview.map((option, index) => (
              <div key={`option-${option}-${index}`} className="text-sm text-gray-600 truncate">
                {index + 1}. {option}
              </div>
            ))}
            {optionsCount > 3 && (
              <div className="text-sm text-gray-500">+{optionsCount - 3} more options</div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{totalVotes.toLocaleString()} votes</span>
          </div>
          <div className="flex items-center">
            <BarChart3 className="w-4 h-4 mr-1" />
            <span>{participation.toLocaleString()} participation</span>
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2">
            <Button asChild variant="default" className="flex-1">
              <Link href={`/polls/${poll.id}`}>
                <Eye className="w-4 h-4 mr-2" />
                View Poll
              </Link>
            </Button>

            {status === 'active' && (
              <Button asChild variant="outline" className="flex-1">
                <Link href={`/polls/${poll.id}/vote`}>Vote Now</Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PollCard;
