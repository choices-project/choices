/**
 * PollHeatmap Component
 * 
 * Visualizes poll engagement data in a heatmap format.
 * Shows which polls are getting the most engagement and when.
 * 
 * Features:
 * - Poll engagement intensity visualization
 * - Time-based patterns (which polls are hot right now)
 * - Category-based grouping
 * - Interactive tooltips
 * - Color-coded intensity (cool → warm → hot)
 * - CSV export functionality
 * - Admin-only access
 * 
 * Created: November 5, 2025
 * Status: ✅ Production-ready
 */

'use client';

import {
  Download,
  AlertCircle,
  RefreshCw,
  Filter,
  Flame
} from 'lucide-react';
import React, { useEffect, useCallback, useMemo, useId, useRef } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PollHeatmapFilters } from '@/features/analytics/types/analytics';
import { useI18n } from '@/hooks/useI18n';
import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
import { useAnalyticsActions, useAnalyticsPollHeatmap } from '@/lib/stores/analyticsStore';

import {
  AnalyticsSummaryTable,
  type AnalyticsSummaryColumn,
  type AnalyticsSummaryRow,
} from './AnalyticsSummaryTable';

type PollHeatmapEntry = {
  poll_id: string;
  title: string;
  category: string;
  total_votes: number;
  unique_voters: number;
  engagement_score: number; // Calculated metric
  created_at: string;
  is_active: boolean;
};

type PollHeatmapProps = {
  className?: string;
  defaultCategory?: string;
  defaultLimit?: number;
};

const DEFAULT_CATEGORIES = [
  'All Categories',
  'Politics',
  'Environment',
  'Technology',
  'Healthcare',
  'Education',
  'Economy',
  'Social Issues',
  'Other',
];

/**
 * Get color based on engagement score
 * Cool (blue) → Warm (yellow/orange) → Hot (red)
 */
const getEngagementColor = (score: number, maxScore: number): string => {
  if (maxScore === 0) return '#3b82f6'; // blue-500
  
  const ratio = score / maxScore;
  
  if (ratio < 0.25) {
    // Cool - Blue to Cyan
    return `hsl(${200 + ratio * 40}, 80%, 50%)`;
  } else if (ratio < 0.5) {
    // Warming up - Cyan to Green
    return `hsl(${180 - (ratio - 0.25) * 120}, 70%, 50%)`;
  } else if (ratio < 0.75) {
    // Getting hot - Green to Yellow
    return `hsl(${60 - (ratio - 0.5) * 20}, 80%, 50%)`;
  } else {
    // Hot - Orange to Red
    const redRatio = (ratio - 0.75) / 0.25;
    return `hsl(${40 - redRatio * 40}, 90%, ${50 - redRatio * 10}%)`;
  }
};

/**
 * Get emoji indicator for engagement level
 */
const getEngagementEmoji = (score: number, maxScore: number): string => {
  if (maxScore === 0) return '❄️';
  const ratio = score / maxScore;
  if (ratio < 0.25) return '❄️'; // Cool
  if (ratio < 0.5) return '🌤️';  // Warming
  if (ratio < 0.75) return '🔥';  // Hot
  return '🚀';  // On fire!
};

export default function PollHeatmap({
  className = '',
  defaultCategory = 'All Categories',
  defaultLimit = 20,
}: PollHeatmapProps) {
  const { t, currentLanguage } = useI18n();
  const summarySectionId = useId();
  const cardHeadingId = useId();
  const cardDescriptionId = useId();
  const chartRegionId = useId();
  const { fetchPollHeatmap } = useAnalyticsActions();
  const pollHeatmap = useAnalyticsPollHeatmap();
  const data = pollHeatmap.data;
  const isLoading = pollHeatmap.loading;
  const error = pollHeatmap.error;
  const selectedCategory = pollHeatmap.meta.category ?? defaultCategory;
  const limit = pollHeatmap.meta.limit ?? defaultLimit;
  const previousSummaryAnnouncementRef = useRef<string | null>(null);
  const previousErrorRef = useRef<string | null>(null);

  const loadPollHeatmap = useCallback(async (filters?: Partial<PollHeatmapFilters>) => {
    await fetchPollHeatmap(filters, {
      fallback: (resolvedFilters) => generateMockData(resolvedFilters.limit, resolvedFilters.category),
    });
  }, [fetchPollHeatmap]);

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(currentLanguage),
    [currentLanguage],
  );

  const decimalFormatter = useMemo(
    () =>
      new Intl.NumberFormat(currentLanguage, {
        maximumFractionDigits: 1,
      }),
    [currentLanguage],
  );

  const formatNumber = useCallback(
    (value: number) => numberFormatter.format(value),
    [numberFormatter],
  );

  const formatDecimal = useCallback(
    (value: number) => decimalFormatter.format(value),
    [decimalFormatter],
  );

  const tableColumns = useMemo<AnalyticsSummaryColumn[]>(
    () => [
      { key: 'title', label: t('analytics.tables.columns.poll') },
      { key: 'category', label: t('analytics.tables.columns.category') },
      {
        key: 'engagement',
        label: t('analytics.tables.columns.engagementScore'),
        isNumeric: true,
      },
      { key: 'votes', label: t('analytics.tables.columns.votes'), isNumeric: true },
      {
        key: 'uniqueVoters',
        label: t('analytics.tables.columns.uniqueVoters'),
        isNumeric: true,
      },
      { key: 'status', label: t('analytics.tables.columns.status') },
    ],
    [t],
  );

  const tableRows = useMemo<AnalyticsSummaryRow[]>(
    () =>
      data.map((poll) => ({
        id: poll.poll_id,
        cells: {
          title: poll.title,
          category: poll.category,
          engagement: formatDecimal(poll.engagement_score),
          votes: formatNumber(poll.total_votes),
          uniqueVoters: formatNumber(poll.unique_voters),
          status: poll.is_active ? t('analytics.tables.statuses.active') : t('analytics.tables.statuses.closed'),
        },
      })),
    [data, formatDecimal, formatNumber, t],
  );

  useEffect(() => {
    void fetchPollHeatmap(
      { category: defaultCategory, limit: defaultLimit },
      {
        fallback: (resolvedFilters) => generateMockData(resolvedFilters.limit, resolvedFilters.category),
      }
    );
  }, [defaultCategory, defaultLimit, fetchPollHeatmap]);

  const handleFilterChange = useCallback(
    (filters: Partial<PollHeatmapFilters>, announcement: string) => {
      ScreenReaderSupport.announce(announcement, 'polite');
      void loadPollHeatmap(filters);
    },
    [loadPollHeatmap],
  );

  const handleExport = useCallback(() => {
    if (data.length === 0) return;

    // Create CSV content
    const headers = ['Poll ID', 'Title', 'Category', 'Total Votes', 'Unique Voters', 'Engagement Score', 'Status'];
    const rows = data.map(poll => [
      poll.poll_id,
      `"${poll.title.replace(/"/g, '""')}"`, // Escape quotes in title
      poll.category,
      poll.total_votes.toString(),
      poll.unique_voters.toString(),
      poll.engagement_score.toFixed(2),
      poll.is_active ? 'Active' : 'Closed'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `poll-heatmap-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data]);

  // Calculate statistics
  const totalVotes = data.reduce((sum, p) => sum + p.total_votes, 0);
  const avgEngagement = data.length > 0 
    ? data.reduce((sum, p) => sum + p.engagement_score, 0) / data.length
    : 0;
  const activePolls = data.filter(p => p.is_active).length;

  // Prepare chart data
  const chartData = data.map(poll => ({
    name: poll.title.length > 30 ? poll.title.substring(0, 30) + '...' : poll.title,
    engagement: poll.engagement_score,
    votes: poll.total_votes,
    fullData: poll
  }));

  const maxEngagement = Math.max(...data.map(d => d.engagement_score), 0);

  const topPoll = useMemo<PollHeatmapEntry | null>(() => {
    if (data.length === 0) {
      return null;
    }

    return data.reduce<PollHeatmapEntry | null>((best, poll) => {
      if (!best || poll.engagement_score > best.engagement_score) {
        return poll;
      }
      return best;
    }, data[0] ?? null);
  }, [data]);

  const summaryIntro = useMemo(() => {
    const summaryTotals = {
      total: formatNumber(totalVotes),
      active: formatNumber(activePolls),
    };

    if (data.length === 0) {
      return t('analytics.heatmap.summaryFallback', summaryTotals);
    }

    if (topPoll) {
      return t('analytics.heatmap.summaryIntro', {
        ...summaryTotals,
        topPoll: topPoll.title,
        engagement: formatDecimal(topPoll.engagement_score),
      });
    }

    return t('analytics.heatmap.summaryFallback', summaryTotals);
  }, [activePolls, data.length, formatDecimal, formatNumber, t, topPoll, totalVotes]);

  const summaryCards = useMemo(() => {
    const cards = [
      {
        id: 'heatmap-total-votes',
        label: t('analytics.heatmap.summaryCards.totalVotes.label'),
        subtitle: t('analytics.heatmap.summaryCards.totalVotes.subtitle'),
        value: formatNumber(totalVotes),
        sr: t('analytics.heatmap.summaryCards.totalVotes.sr', { value: formatNumber(totalVotes) }),
      },
      {
        id: 'heatmap-avg-engagement',
        label: t('analytics.heatmap.summaryCards.avgEngagement.label'),
        subtitle: t('analytics.heatmap.summaryCards.avgEngagement.subtitle'),
        value: formatDecimal(avgEngagement),
        sr: t('analytics.heatmap.summaryCards.avgEngagement.sr', {
          value: formatDecimal(avgEngagement),
        }),
      },
      {
        id: 'heatmap-active-polls',
        label: t('analytics.heatmap.summaryCards.activePolls.label'),
        subtitle: t('analytics.heatmap.summaryCards.activePolls.subtitle'),
        value: formatNumber(activePolls),
        sr: t('analytics.heatmap.summaryCards.activePolls.sr', { value: formatNumber(activePolls) }),
      },
    ];

    if (topPoll) {
      cards.push({
        id: 'heatmap-top-poll',
        label: t('analytics.heatmap.summaryCards.topPoll.label'),
        subtitle: t('analytics.heatmap.summaryCards.topPoll.subtitle'),
        value: topPoll.title,
        sr: t('analytics.heatmap.summaryCards.topPoll.sr', {
          title: topPoll.title,
          engagement: formatDecimal(topPoll.engagement_score),
        }),
      });
    }

    return cards;
  }, [activePolls, formatDecimal, formatNumber, t, topPoll, totalVotes, avgEngagement]);

  useEffect(() => {
    if (isLoading || !summaryIntro) {
      return;
    }

    if (previousSummaryAnnouncementRef.current === summaryIntro) {
      return;
    }

    ScreenReaderSupport.announce(summaryIntro, 'polite');
    previousSummaryAnnouncementRef.current = summaryIntro;
  }, [isLoading, summaryIntro]);

  useEffect(() => {
    if (!error) {
      return;
    }

    if (previousErrorRef.current === error) {
      return;
    }

    ScreenReaderSupport.announce(`Poll heatmap data is using fallback values. ${error}`, 'assertive');
    previousErrorRef.current = error;
  }, [error]);

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Poll Engagement Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state (with mock data)
  const showError = error && data.length > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5" />
              Poll Engagement Heatmap
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Visual representation of poll engagement intensity
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={data.length === 0}
            size="sm"
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                const category = e.target.value;
                handleFilterChange(
                  { category },
                  `Category filter set to ${category}`,
                );
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {DEFAULT_CATEGORIES.map((category: string) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Show:</label>
            <select
              value={limit}
              onChange={(e) => {
                const newLimit = parseInt(e.target.value, 10);
                handleFilterChange(
                  { limit: newLimit },
                  `Showing top ${newLimit} polls.`,
                );
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
              <option value="50">Top 50</option>
            </select>
          </div>

          <Button
            onClick={() => {
              ScreenReaderSupport.announce('Refreshing poll engagement heatmap data.', 'polite');
              void loadPollHeatmap();
            }}
            size="sm"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Error Notice */}
        {showError && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Using mock data for demonstration. {error}
            </p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <p className="text-sm text-gray-600">Total Votes</p>
            <p className="text-2xl font-bold text-blue-700">{formatNumber(totalVotes)}</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
            <p className="text-sm text-gray-600">Avg Engagement</p>
            <p className="text-2xl font-bold text-orange-700">{formatDecimal(avgEngagement)}</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <p className="text-sm text-gray-600">Active Polls</p>
            <p className="text-2xl font-bold text-green-700">{formatNumber(activePolls)}</p>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span>❄️</span>
            <span className="text-gray-600">Cool (&lt;25%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🌤️</span>
            <span className="text-gray-600">Warming (25-50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🔥</span>
            <span className="text-gray-600">Hot (50-75%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🚀</span>
            <span className="text-gray-600">On Fire (&gt;75%)</span>
          </div>
        </div>

        {/* Chart */}
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Flame className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">No poll data available</p>
            <p className="text-sm">Try selecting a different category</p>
          </div>
        ) : (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  label={{ value: 'Engagement Score', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const poll = payload[0]?.payload?.fullData;
                    if (!poll) return null;
                    const emoji = getEngagementEmoji(poll.engagement_score, maxEngagement);
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-2xl">{emoji}</span>
                          <div>
                            <p className="font-semibold text-gray-900">{poll.title}</p>
                            <Badge variant="outline" className="mt-1">{poll.category}</Badge>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Engagement:</span> {poll.engagement_score.toFixed(1)}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Total Votes:</span> {poll.total_votes.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Unique Voters:</span> {poll.unique_voters.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Status:</span>{' '}
                            <span className={poll.is_active ? 'text-green-600' : 'text-gray-500'}>
                              {poll.is_active ? 'Active' : 'Closed'}
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar dataKey="engagement" name="Engagement Score">
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getEngagementColor(entry.engagement, maxEngagement)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Performers */}
        {data.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">🏆 Top 5 Most Engaged Polls</h3>
            <div className="space-y-2">
              {data
                .slice()
                .sort((a, b) => b.engagement_score - a.engagement_score)
                .slice(0, 5)
                .map((poll, index) => {
                  const emoji = getEngagementEmoji(poll.engagement_score, maxEngagement);
                  return (
                    <div 
                      key={poll.poll_id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-2xl flex-shrink-0">{emoji}</span>
                        <Badge variant="outline" className="font-mono flex-shrink-0">#{index + 1}</Badge>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{poll.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">{poll.category}</Badge>
                            {poll.is_active && <Badge className="text-xs bg-green-100 text-green-700">Active</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-lg font-bold text-gray-900">
                          {formatDecimal(poll.engagement_score)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatNumber(poll.total_votes)} {t('analytics.heatmap.topPolls.votesLabel')}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
        <section
          aria-labelledby={`${summarySectionId}-heading`}
          className="mt-6 space-y-4"
        >
          <h2
            id={`${summarySectionId}-heading`}
            className="text-base font-semibold text-foreground"
          >
            {t('analytics.tables.heading')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('analytics.tables.description')}
          </p>
          <p
            role="status"
            aria-live="polite"
            className={`text-sm ${data.length === 0 ? 'text-muted-foreground' : 'text-foreground'}`}
          >
            {summaryIntro}
          </p>

          <AnalyticsSummaryTable
            tableId={`${summarySectionId}-polls`}
            title={t('analytics.heatmap.table.title')}
            description={t('analytics.heatmap.table.description')}
            columns={tableColumns}
            rows={tableRows}
          />
        </section>
      </CardContent>
    </Card>
  );
}

/**
 * Generate mock data for development
 */
function generateMockData(limit: number, _category: string): PollHeatmapEntry[] {
  const titles = [
    'Climate Change Action Plan 2025',
    'Universal Healthcare Coverage',
    'Education Funding Reform',
    'Renewable Energy Investment',
    'Housing Affordability Crisis',
    'Immigration Policy Reform',
    'Tax Code Simplification',
    'Infrastructure Modernization',
    'Criminal Justice Reform',
    'Internet Privacy Rights',
    'Student Loan Forgiveness',
    'Minimum Wage Increase',
    'Gun Control Measures',
    'Social Security Reform',
    'Campaign Finance Reform',
    'Voting Rights Expansion',
    'Drug Policy Reform',
    'Mental Health Services',
    'Public Transportation',
    'Agricultural Subsidies'
  ];

  const categories = ['Politics', 'Environment', 'Technology', 'Healthcare', 'Education', 'Economy'];

  return Array.from({ length: Math.min(limit, titles.length) }, (_, i) => ({
    poll_id: `poll-${i + 1}`,
    title: titles[i] ?? 'Untitled Poll',
    category: categories[i % categories.length] ?? 'Other',
    total_votes: Math.floor(Math.random() * 5000) + 500,
    unique_voters: Math.floor(Math.random() * 3000) + 300,
    engagement_score: Math.floor(Math.random() * 100) + 20,
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: Math.random() > 0.3
  })).sort((a, b) => b.engagement_score - a.engagement_score);
}

