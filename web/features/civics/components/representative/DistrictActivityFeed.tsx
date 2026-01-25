/**
 * District Activity Feed Component
 *
 * Aggregates polls, bills, and votes from multiple representatives
 * in a unified chronological feed for the Electoral tab.
 *
 * Created: 2026-01-25
 */

'use client';

import { FileText, Vote, BarChart3, Calendar } from 'lucide-react';
import Link from 'next/link';
import React, { useMemo, useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { logger } from '@/lib/utils/logger';

type UnifiedActivity = {
  id: string;
  type: 'poll' | 'bill' | 'vote';
  date: string;
  title: string;
  description?: string | null;
  url?: string | null;
  representativeId?: number;
  representativeName?: string;
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

type DistrictActivityFeedProps = {
  representativeIds: number[];
  className?: string;
};

export function DistrictActivityFeed({
  representativeIds,
  className = ''
}: DistrictActivityFeedProps) {
  const [activities, setActivities] = useState<UnifiedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'polls' | 'bills' | 'votes'>('all');

  useEffect(() => {
    const fetchActivities = async () => {
      if (representativeIds.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch activities for all representatives in parallel
        const fetchPromises = representativeIds.map(async (repId) => {
          const [pollsRes, activitiesRes] = await Promise.all([
            fetch(`/api/polls?representative_id=${repId}&limit=10`),
            fetch(`/api/v1/civics/representative/${repId}?include=activities&fields=id,name`)
          ]);

          const repActivities: UnifiedActivity[] = [];
          let repName = `Representative #${repId}`;

          // Get representative name
          if (activitiesRes.ok) {
            const repData = await activitiesRes.json();
            if (repData.success && repData.data?.representative) {
              repName = repData.data.representative.name || repName;
            }
          }

          // Process polls
          if (pollsRes.ok) {
            const pollsData = await pollsRes.json();
            if (pollsData.success && Array.isArray(pollsData.data)) {
              pollsData.data.forEach((poll: any) => {
                repActivities.push({
                  id: `poll-${poll.id}`,
                  type: 'poll',
                  date: poll.createdAt || poll.created_at || new Date().toISOString(),
                  title: poll.title,
                  description: poll.description,
                  url: `/polls/${poll.id}`,
                  representativeId: repId,
                  representativeName: repName,
                  metadata: {
                    pollId: poll.id,
                    pollType: poll.pollType || poll.poll_type,
                    billId: poll.billId || poll.bill_id,
                    billTitle: poll.billTitle || poll.bill_title,
                    billSummary: poll.billSummary || poll.bill_summary,
                  }
                });
              });
            }
          }

          // Process bills/activities
          if (activitiesRes.ok) {
            const repData = await activitiesRes.json();
            if (repData.success && repData.data?.representative?.activities) {
              repData.data.representative.activities.forEach((activity: any) => {
                if (activity.type === 'bill') {
                  repActivities.push({
                    id: `bill-${activity.id}`,
                    type: 'bill',
                    date: activity.date || activity.created_at || new Date().toISOString(),
                    title: activity.title,
                    description: activity.description,
                    url: activity.url || activity.source_url,
                    representativeId: repId,
                    representativeName: repName,
                    metadata: {
                      billId: String(activity.id),
                      billTitle: activity.title,
                      billSummary: activity.description,
                    }
                  });
                } else if (activity.type === 'vote') {
                  repActivities.push({
                    id: `vote-${activity.id}`,
                    type: 'vote',
                    date: activity.date || activity.created_at || new Date().toISOString(),
                    title: activity.title || 'Vote',
                    description: activity.description,
                    url: activity.url || activity.source_url,
                    representativeId: repId,
                    representativeName: repName,
                    metadata: {
                      voteId: String(activity.id),
                      votePosition: activity.metadata?.vote_position,
                      result: activity.metadata?.result,
                    }
                  });
                }
              });
            }
          }

          return repActivities;
        });

        const allActivitiesArrays = await Promise.all(fetchPromises);
        const allActivities = allActivitiesArrays.flat();

        // Sort by date (newest first)
        allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setActivities(allActivities);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activities');
        logger.error('Failed to fetch district activities', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchActivities();
  }, [representativeIds]);

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
            <Card key={i} className="h-24 bg-gray-200 dark:bg-gray-700" />
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

  if (activities.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-gray-500 dark:text-gray-400">
          No activities found for district representatives.
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
          <div className="space-y-3">
            {filteredActivities.slice(0, 10).map((activity) => (
              <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                            {activity.url ? (
                              <Link
                                href={activity.url}
                                className="hover:underline"
                                target={activity.url.startsWith('http') ? '_blank' : undefined}
                                rel={activity.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                              >
                                {activity.title}
                              </Link>
                            ) : (
                              activity.title
                            )}
                          </h4>
                          {activity.representativeName && activity.representativeId && (
                            <Link
                              href={`/representatives/${activity.representativeId}`}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 block"
                            >
                              {activity.representativeName}
                            </Link>
                          )}
                        </div>
                        <Badge className={`shrink-0 ${getActivityColor(activity.type)}`}>
                          {activity.type}
                        </Badge>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
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
            {filteredActivities.length > 10 && (
              <div className="text-center pt-2">
                <Link
                  href="/civics"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View all {filteredActivities.length} activities →
                </Link>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
