'use client';

import { Clock, Lock, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import React from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type PostCloseBannerProps = {
  pollStatus: 'closed' | 'locked' | 'post-close';
  baselineAt?: Date;
  lockedAt?: Date;
  allowPostClose?: boolean;
  onEnablePostClose?: () => void;
  onLockPoll?: () => void;
  canManage?: boolean;
  className?: string;
}

export function PostCloseBanner({
  pollStatus,
  baselineAt,
  lockedAt,
  allowPostClose = false,
  onEnablePostClose,
  onLockPoll,
  canManage = false,
  className
}: PostCloseBannerProps) {
  const getStatusInfo = () => {
    switch (pollStatus) {
      case 'closed':
        return {
          icon: <Clock className="h-4 w-4" />,
          title: 'Poll Closed',
          description: 'This poll has been closed and is no longer accepting votes.',
          color: 'border-gray-200 bg-gray-50',
          textColor: 'text-gray-800',
          badge: { variant: 'secondary' as const, text: 'Closed' }
        };
      case 'locked':
        return {
          icon: <Lock className="h-4 w-4" />,
          title: 'Poll Locked',
          description: 'This poll has been locked and results are final.',
          color: 'border-red-200 bg-red-50',
          textColor: 'text-red-800',
          badge: { variant: 'destructive' as const, text: 'Locked' }
        };
      case 'post-close':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          title: 'Post-Close Voting Active',
          description: 'This poll is in post-close mode. Votes are being tracked separately.',
          color: 'border-yellow-200 bg-yellow-50',
          textColor: 'text-yellow-800',
          badge: { variant: 'outline' as const, text: 'Post-Close' }
        };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();
  if (!statusInfo) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className={className}>
      <Alert className={`${statusInfo.color} border`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`${statusInfo.textColor} mt-0.5`}>
              {statusInfo.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className={`font-medium ${statusInfo.textColor}`}>
                  {statusInfo.title}
                </h3>
                <Badge variant={statusInfo.badge.variant}>
                  {statusInfo.badge.text}
                </Badge>
              </div>
              <AlertDescription className={statusInfo.textColor}>
                {statusInfo.description}
              </AlertDescription>
              
              {/* Additional status information */}
              <div className="mt-2 space-y-1 text-sm">
                {baselineAt && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-gray-600">
                      Baseline established: {formatDate(baselineAt)}
                    </span>
                  </div>
                )}
                {lockedAt && (
                  <div className="flex items-center space-x-2">
                    <Lock className="h-3 w-3 text-red-600" />
                    <span className="text-gray-600">
                      Locked at: {formatDate(lockedAt)}
                    </span>
                  </div>
                )}
                {pollStatus === 'closed' && allowPostClose && (
                  <div className="flex items-center space-x-2">
                    <Info className="h-3 w-3 text-blue-600" />
                    <span className="text-gray-600">
                      Post-close voting is available
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Management actions */}
          {canManage && (
            <div className="flex flex-col space-y-2 ml-4">
              {pollStatus === 'closed' && allowPostClose && onEnablePostClose && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onEnablePostClose}
                  className="text-xs"
                >
                  Enable Post-Close
                </Button>
              )}
              {pollStatus === 'post-close' && onLockPoll && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onLockPoll}
                  className="text-xs"
                >
                  Lock Poll
                </Button>
              )}
            </div>
          )}
        </div>
      </Alert>
    </div>
  );
}

export default PostCloseBanner;
