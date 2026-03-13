/**
 * Representative Activity Feed Component
 *
 * Combines polls, bills, and votes in a unified chronological feed
 * for a specific representative.
 *
 * Created: 2026-01-25
 */

'use client';

import { FileText, Vote, BarChart3, Calendar } from 'lucide-react';
import Link from 'next/link';
import React, { useMemo, useState, useEffect } from 'react';

import { EnhancedEmptyState } from '@/components/shared/EnhancedEmptyState';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { logger } from '@/lib/utils/logger';

import { useI18n } from '@/hooks/useI18n';

import type { Representative } from '@/types/representative';

type RawPollData = {
  id: string;
  title: string;
  description?: string | null;
  createdAt?: string;
  created_at?: string;
  pollType?: string;
  poll_type?: string;
  billId?: string;
  bill_id?: string;
  billTitle?: string;
  bill_title?: string;
  billSummary?: string;
  bill_summary?: string;
};

type RawActivityData = {
  id: string | number;
  type: string;
  title?: string;
  description?: string | null;
  date?: string;
  created_at?: string;
  url?: string;
  source_url?: string;
  metadata?: {
    vote_position?: string;
    result?: string;
  };
};

type UnifiedActivity = {
  id: string;
  type: 'poll' | 'bill' | 'vote';
  date: string;
  title: string;
  description?: string | null | undefined;
  url?: string | null | undefined;
  metadata?: {
    pollId?: string;
    billId?: string;
    voteId?: string;
    pollType?: string;
    billTitle?: string;
    billSummary?: string;
    votePosition?: string;
    result?: string;
  };
};

type RepresentativeActivityFeedProps = {
  representativeId: number;
  representative?: Representative;
  className?: string;
};

export function RepresentativeActivityFeed({
  representativeId,
  representative: _representative,
  className = ''
}: RepresentativeActivityFeedProps) {
  const { t } = useI18n();
  const [activities, setActivities] = useState<UnifiedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'polls' | 'bills' | 'votes'>('all');

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch polls, bills, and votes in parallel
        const [pollsRes, activitiesRes] = await Promise.all([
          fetch(`/api/polls?representative_id=${representativeId}&limit=20`),
          fetch(`/api/v1/civics/representative/${representativeId}?include=activities`)
        ]);

        const activitiesList: UnifiedActivity[] = [];

        // Process polls
        if (pollsRes.ok) {
          const pollsData = await pollsRes.json();
          if (pollsData.success) {
            // Handle different response formats: data.polls (current), data as array (legacy), or data.representatives
            let polls: RawPollData[] = [];
            if (Array.isArray(pollsData.data?.polls)) {
              polls = pollsData.data.polls;
            } else if (Array.isArray(pollsData.data)) {
              polls = pollsData.data;
            } else if (Array.isArray(pollsData.data?.representatives)) {
              polls = pollsData.data.representatives;
            }
            
            polls.forEach((poll: RawPollData) => {
              activitiesList.push({
                id: poll.id,
                type: 'poll',
                date: poll.createdAt || poll.created_at || new Date().toISOString(),
                title: poll.title,
                description: poll.description,
                url: `/polls/${poll.id}`,
                metadata: {
                  pollId: poll.id,
                  ...(poll.pollType || poll.poll_type ? { pollType: poll.pollType || poll.poll_type } : {}),
                  ...(poll.billId || poll.bill_id ? { billId: poll.billId || poll.bill_id } : {}),
                  ...(poll.billTitle || poll.bill_title ? { billTitle: poll.billTitle || poll.bill_title } : {}),
                  ...(poll.billSummary || poll.bill_summary ? { billSummary: poll.billSummary || poll.bill_summary } : {}),
                }
              });
            });
          } else {
            logger.warn('RepresentativeActivityFeed: Polls API returned unsuccessful response', {
              success: pollsData.success,
              error: pollsData.error,
              representativeId,
            });
          }
        } else {
          const errorText = await pollsRes.text().catch(() => 'Unknown error');
          logger.warn('RepresentativeActivityFeed: Failed to fetch polls', {
            status: pollsRes.status,
            statusText: pollsRes.statusText,
            error: errorText,
            representativeId,
          });
        }

        // Process bills/activities
        if (activitiesRes.ok) {
          const repData = await activitiesRes.json();
          if (repData.success && repData.data?.representative?.activities) {
            repData.data.representative.activities.forEach((activity: RawActivityData) => {
              if (activity.type === 'bill') {
                activitiesList.push({
                  id: String(activity.id),
                  type: 'bill',
                  date: activity.date || activity.created_at || new Date().toISOString(),
                  title: activity.title || 'Bill',
                  description: activity.description,
                  url: activity.url || activity.source_url,
                  metadata: {
                    billId: String(activity.id),
                    ...(activity.title ? { billTitle: activity.title } : {}),
                    ...(activity.description ? { billSummary: activity.description } : {}),
                  }
                });
              } else if (activity.type === 'vote') {
                activitiesList.push({
                  id: String(activity.id),
                  type: 'vote',
                  date: activity.date || activity.created_at || new Date().toISOString(),
                  title: activity.title || 'Vote',
                  description: activity.description,
                  url: activity.url || activity.source_url,
                  metadata: {
                    voteId: String(activity.id),
                    ...(activity.metadata?.vote_position ? { votePosition: activity.metadata.vote_position } : {}),
                    ...(activity.metadata?.result ? { result: activity.metadata.result } : {}),
                  }
                });
              }
            });
          }
        }

        // Sort by date (newest first)
        activitiesList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setActivities(activitiesList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activities');
        logger.error('Failed to fetch representative activities', err);
      } finally {
        setLoading(false);
      }
    };

    if (representativeId) {
      void fetchActivities();
    }
  }, [representativeId]);

  const filteredActivities = useMemo(() => {
    if (activeTab === 'all') return activities;
    return activities.filter(activity => activity.type === activeTab.slice(0, -1)); // Remove 's' from 'polls', 'bills', 'votes'
  }, [activities, activeTab]);

  const getActivityIcon = (type: UnifiedActivity['type']) => {
    switch (type) {
      case 'poll':
        return <BarChart3 className="w-4 h-4" />;
      case 'bill':
        return <FileText className="w-4 h-4" />;
      case 'vote':
        return <Vote className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: UnifiedActivity['type']) => {
    switch (type) {
      case 'poll':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      case 'bill':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-700';
      case 'vote':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-24 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="all">All ({activities.length})</TabsTrigger>
          <TabsTrigger value="polls">
            Polls ({activities.filter(a => a.type === 'poll').length})
          </TabsTrigger>
          <TabsTrigger value="bills">
            Bills ({activities.filter(a => a.type === 'bill').length})
          </TabsTrigger>
          <TabsTrigger value="votes">
            Votes ({activities.filter(a => a.type === 'vote').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredActivities.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <EnhancedEmptyState
                  icon={<FileText className="h-12 w-12 text-muted-foreground" />}
                  title={activeTab === 'all' ? 'No activity yet' : `No ${activeTab} found`}
                  description={t('civics.representatives.detail.activityFeed.emptyHint')}
                  primaryAction={{ label: 'Browse Polls', href: '/polls' }}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((activity) => (
                <Card key={`${activity.type}-${activity.id}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-foreground line-clamp-2">
                            {activity.url ? (
                              <Link
                                href={activity.url}
                                className="hover:underline text-primary"
                                target={activity.url.startsWith('http') ? '_blank' : undefined}
                                rel={activity.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                              >
                                {activity.title}
                              </Link>
                            ) : (
                              activity.title
                            )}
                          </h4>
                          <Badge className={`shrink-0 ${getActivityColor(activity.type)}`}>
                            {activity.type}
                          </Badge>
                        </div>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                        {activity.type === 'poll' && _representative && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Poll about <span className="font-medium">{_representative.name}</span>
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(activity.date)}</span>
                          </div>
                          {activity.metadata?.votePosition && (
                            <Badge variant="outline" className="text-xs">
                              {activity.metadata.votePosition}
                            </Badge>
                          )}
                          {activity.metadata?.pollType === 'constituent_will' && (
                            <Badge variant="outline" className="text-xs">
                              Constituent Will
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
