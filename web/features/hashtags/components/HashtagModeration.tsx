/**
 * Hashtag Moderation Component
 *
 * Comprehensive moderation interface for hashtags including:
 * - Flagging interface for users
 * - Moderation queue for admins
 * - Auto-moderation status display
 * - Content policy enforcement
 *
 * Created: October 11, 2025
 * Status: ✅ ACTIVE
 */

'use client';

import {
  Flag,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  User,
  Calendar
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useHashtagModerationStore,
  type HashtagFlagType
} from '@/lib/stores/hashtagModerationStore';
import { logger } from '@/lib/utils/logger';

import type {
  Hashtag,
  HashtagFlag,
  HashtagModeration
} from '../types';

// ============================================================================
// TYPES
// ============================================================================

export type HashtagModerationProps = {
  hashtagId: string;
  hashtag?: Hashtag;
  showUserActions?: boolean;
  showAdminActions?: boolean;
  onModerationUpdate?: (moderation: HashtagModeration) => void;
  className?: string;
}

export type ModerationQueueProps = {
  status?: HashtagModeration['status'];
  limit?: number;
  onModerationAction?: (hashtagId: string, action: string) => void;
  className?: string;
}

export type FlagHashtagProps = {
  hashtagId: string;
  onFlag?: (flag: HashtagFlag) => void;
  className?: string;
}

// ============================================================================
// FLAG HASHTAG COMPONENT
// ============================================================================

export function FlagHashtag({ hashtagId, onFlag, className }: FlagHashtagProps) {
  // Zustand store integration
  const {
    isOpen,
    flagType,
    reason,
    isSubmitting,
    error,
    setIsOpen,
    setFlagType,
    setReason,
    setIsSubmitting,
    setError,
    submitFlag
  } = useHashtagModerationStore(state => ({
    isOpen: state.isOpen,
    flagType: state.flagType,
    reason: state.reason,
    isSubmitting: state.isSubmitting,
    error: state.error,
    setIsOpen: state.setIsOpen,
    setFlagType: state.setFlagType,
    setReason: state.setReason,
    setIsSubmitting: state.setIsSubmitting,
    setError: state.setError,
    submitFlag: state.submitFlag
  }));

  const flagTypes: Array<{ value: HashtagFlagType; label: string; icon: any }> = [
    { value: 'inappropriate', label: 'Inappropriate Content', icon: AlertTriangle },
    { value: 'spam', label: 'Spam', icon: Flag },
    { value: 'misleading', label: 'Misleading', icon: XCircle },
    { value: 'harassment', label: 'Harassment', icon: AlertTriangle },
    { value: 'other', label: 'Other', icon: AlertTriangle }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Use the store's submitFlag action
      await submitFlag(hashtagId);

      // Call the onFlag callback if provided
      if (onFlag) {
        // Map store type to component type
        const componentFlagType = flagType === 'harassment' ? 'other' : flagType;
        onFlag({
          id: crypto.randomUUID(),
          hashtag_id: hashtagId,
          flag_type: componentFlagType as 'inappropriate' | 'spam' | 'misleading' | 'duplicate' | 'other',
          reason: reason.trim(),
          user_id: 'current-user', // This should come from auth context
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'pending'
        });
      }

      // Close modal and reset form on success
      setIsOpen(false);
      setReason('');
    } catch (err) {
      setError('Network error. Please try again.');
      logger.error('Error flagging hashtag:', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <Flag className="w-4 h-4 mr-2" />
        Flag
      </Button>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="w-5 h-5" />
          Flag Hashtag
        </CardTitle>
        <CardDescription>
          Help us maintain quality by reporting inappropriate content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Reason for flagging
            </label>
            <div className="grid grid-cols-1 gap-2">
              {flagTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="flagType"
                      value={type.value}
                      checked={flagType === type.value}
                      onChange={(e) => setFlagType(e.target.value as HashtagFlagType)}
                      className="rounded"
                    />
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{type.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide more details about why this hashtag should be flagged..."
              className="w-full p-2 border rounded-md resize-none"
              rows={3}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Flag'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MODERATION STATUS COMPONENT
// ============================================================================

export function ModerationStatus({
  moderation,
  className
}: {
  moderation: HashtagModeration;
  className?: string;
}) {
  const getStatusIcon = () => {
    switch (moderation.status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'flagged':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'pending':
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (moderation.status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'flagged':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {getStatusIcon()}
      <Badge className={getStatusColor()}>
        {(moderation.status ?? 'pending').charAt(0).toUpperCase() + (moderation.status ?? 'pending').slice(1)}
      </Badge>
      {moderation.human_review_required && (
        <Badge variant="outline" className="text-xs">
          Human Review Required
        </Badge>
      )}
    </div>
  );
}

// ============================================================================
// MODERATION QUEUE COMPONENT
// ============================================================================

export function ModerationQueue({
  status,
  limit = 50,
  onModerationAction,
  className
}: ModerationQueueProps) {
  const [hashtags, setHashtags] = useState<Array<Hashtag & { moderation: HashtagModeration }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadModerationQueue = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/hashtags?action=moderation-queue&${params}`);
      const result = await response.json();

      if (result.success) {
        setHashtags(result.data);
      } else {
        setError(result.error ?? 'Failed to load moderation queue');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      logger.error('Error loading moderation queue:', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [status, limit]);

  useEffect(() => {
    loadModerationQueue();
  }, [loadModerationQueue]);

  const handleModerationAction = async (hashtagId: string, action: string) => {
    try {
      const response = await fetch('/api/hashtags?action=moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hashtagId,
          status: action,
          reason: `Moderated via admin interface`
        })
      });

      const result = await response.json();

      if (result.success) {
        onModerationAction?.(hashtagId, action);
        loadModerationQueue(); // Refresh the queue
      } else {
        setError(result.error ?? 'Failed to moderate hashtag');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      logger.error('Error moderating hashtag:', err instanceof Error ? err : new Error(String(err)));
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="ml-2">Loading moderation queue...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Moderation Queue
        </CardTitle>
        <CardDescription>
          {hashtags.length} hashtag{hashtags.length !== 1 ? 's' : ''} requiring review
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hashtags.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hashtags in moderation queue
          </div>
        ) : (
          <div className="space-y-4">
            {hashtags.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">#{item.name}</span>
                      <ModerationStatus moderation={item.moderation} />
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.created_by ?? 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {item.usage_count} uses
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleModerationAction(item.id, 'approved')}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleModerationAction(item.id, 'rejected')}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN MODERATION COMPONENT
// ============================================================================

export default function HashtagModerationView({
  hashtagId,
  hashtag: _hashtag,
  showUserActions = true,
  showAdminActions = false,
  onModerationUpdate,
  className
}: HashtagModerationProps) {
  const [moderation, setModeration] = useState<HashtagModeration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadModerationStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hashtags?action=moderation&hashtagId=${hashtagId}`);
      const result = await response.json();

      if (result.success) {
        setModeration(result.data);
        onModerationUpdate?.(result.data);
      } else {
        setError(result.error ?? 'Failed to load moderation status');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      logger.error('Error loading moderation status:', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [hashtagId, onModerationUpdate]);

  useEffect(() => {
    loadModerationStatus();
  }, [loadModerationStatus]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        <span className="ml-2">Loading moderation status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="w-4 h-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={className}>
      {moderation && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <ModerationStatus moderation={moderation} />
            {showUserActions && moderation.status === 'approved' && (
              <FlagHashtag hashtagId={hashtagId} />
            )}
          </div>

          {moderation.moderation_reason && (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <strong>Moderation Note:</strong> {moderation.moderation_reason}
              </AlertDescription>
            </Alert>
          )}

          {showAdminActions && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Admin Actions</h4>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleModerationAction('approved')}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleModerationAction('rejected')}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleModerationAction('flagged')}
                >
                  <Flag className="w-4 h-4 mr-1" />
                  Flag
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  async function handleModerationAction(status: string) {
    try {
      const response = await fetch('/api/hashtags?action=moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hashtagId,
          status,
          reason: `Moderated via admin interface`
        })
      });

      const result = await response.json();

      if (result.success) {
        setModeration(result.data);
        onModerationUpdate?.(result.data);
      } else {
        setError(result.error ?? 'Failed to moderate hashtag');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      logger.error('Error moderating hashtag:', err instanceof Error ? err : new Error(String(err)));
    }
  }
}
