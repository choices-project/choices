/**
 * TrustTierComparisonChart Component
 * 
 * Compares behavior and engagement across trust tiers (T0-T3).
 * Helps identify patterns and potential bot behavior.
 * 
 * Features:
 * - Participation rates by tier
 * - Poll completion rates
 * - Average engagement scores
 * - Bot likelihood indicators
 * - Stacked bar charts
 * - CSV export functionality
 * 
 * Created: November 5, 2025
 * Status: ✅ Production-ready
 */

'use client';

import {
  Download,
  Shield, 
  AlertCircle,
  RefreshCw,
  Award
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo, useId, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
import { useAnalyticsStore, useAnalyticsTrustTiers } from '@/lib/stores/analyticsStore';

import { useI18n } from '@/hooks/useI18n';

import {
  AnalyticsSummaryTable,
  type AnalyticsSummaryColumn,
  type AnalyticsSummaryRow,
} from './AnalyticsSummaryTable';

type TierMetrics = {
  tier: string;
  tierName: string;
  userCount: number;
  participationRate: number;
  completionRate: number;
  avgEngagement: number;
  botLikelihood: number;
  avgPollsVoted: number;
  avgTimeOnSite: number;
};

type TierComparisonData = {
  ok: boolean;
  tiers: TierMetrics[];
  totalUsers: number;
  insights: string[];
};

type TrustTierComparisonChartProps = {
  className?: string;
  defaultTab?: 'participation' | 'engagement' | 'radar';
};

const TIER_COLORS = {
  'T0': '#ef4444', // red-500
  'T1': '#f97316', // orange-500
  'T2': '#3b82f6', // blue-500
  'T3': '#22c55e'  // green-500
};

export default function TrustTierComparisonChart({
  className = '',
  defaultTab = 'participation'
}: TrustTierComparisonChartProps) {
  const { t, currentLanguage } = useI18n();
  const summarySectionId = useId();
  const cardHeadingId = useId();
  const cardDescriptionId = useId();
  const participationRegionId = useId();
  const engagementRegionId = useId();
  const radarRegionId = useId();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const previousSummaryAnnouncementRef = useRef<string | null>(null);
  const previousErrorRef = useRef<string | null>(null);
  const trustTiers = useAnalyticsTrustTiers();
  const data = trustTiers.data;
  const isLoading = trustTiers.loading;
  const error = trustTiers.error;

  const tabLabels = useMemo(
    () => ({
      participation: t('analytics.trust.tabsLabels.participation'),
      engagement: t('analytics.trust.tabsLabels.engagement'),
      radar: t('analytics.trust.tabsLabels.radar'),
    }),
    [t],
  );

  const tabAnnouncements = useMemo(
    () => ({
      participation: t('analytics.trust.tabAnnouncements.participation'),
      engagement: t('analytics.trust.tabAnnouncements.engagement'),
      radar: t('analytics.trust.tabAnnouncements.radar'),
    }),
    [t],
  );

  const loadTrustTiers = useCallback(async () => {
    const { fetchTrustTierComparison: ftc } = useAnalyticsStore.getState();
    await ftc({
      fallback: generateMockData,
    });
  }, []);

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(currentLanguage),
    [currentLanguage],
  );

  const percentFormatter = useMemo(
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

  const formatPercent = useCallback(
    (value: number) => `${percentFormatter.format(value)}%`,
    [percentFormatter],
  );

  const tableColumns = useMemo<AnalyticsSummaryColumn[]>(
    () => [
      { key: 'tier', label: t('analytics.tables.columns.tier') },
      { key: 'users', label: t('analytics.tables.columns.users'), isNumeric: true },
      {
        key: 'participationRate',
        label: t('analytics.tables.columns.participationRate'),
        isNumeric: true,
      },
      {
        key: 'completionRate',
        label: t('analytics.tables.columns.completionRate'),
        isNumeric: true,
      },
      {
        key: 'avgEngagement',
        label: t('analytics.tables.columns.avgEngagement'),
        isNumeric: true,
      },
      {
        key: 'botLikelihood',
        label: t('analytics.tables.columns.botLikelihood'),
        isNumeric: true,
      },
      {
        key: 'avgPollsVoted',
        label: t('analytics.tables.columns.avgPollsVoted'),
        isNumeric: true,
      },
      {
        key: 'avgTimeOnSite',
        label: t('analytics.tables.columns.avgTimeOnSite'),
        isNumeric: true,
      },
    ],
    [t],
  );

  const tableRows = useMemo<AnalyticsSummaryRow[]>(
    () =>
      data
        ? data.tiers.map((tier) => ({
            id: tier.tier,
            cells: {
              tier: `${tier.tier} — ${tier.tierName}`,
              users: formatNumber(tier.userCount),
              participationRate: formatPercent(tier.participationRate),
              completionRate: formatPercent(tier.completionRate),
              avgEngagement: formatNumber(tier.avgEngagement),
              botLikelihood: formatPercent(tier.botLikelihood),
              avgPollsVoted: formatNumber(tier.avgPollsVoted),
              avgTimeOnSite: formatNumber(tier.avgTimeOnSite),
            },
          }))
        : [],
    [data, formatNumber, formatPercent],
  );

  const highestEngagementTier = useMemo(() => {
    if (!data || data.tiers.length === 0) {
      return null;
    }

    return data.tiers.reduce<TierMetrics | null>((best, tier) => {
      if (!best || tier.avgEngagement > best.avgEngagement) {
        return tier;
      }
      return best;
    }, null);
  }, [data]);

  const summaryIntro = useMemo(
    () =>
      data && highestEngagementTier
        ? t('analytics.trust.summaryIntro', {
            totalUsers: formatNumber(data.totalUsers),
            strongestTier: `${highestEngagementTier.tierName} (${highestEngagementTier.tier})`,
            engagement: formatNumber(highestEngagementTier.avgEngagement),
            participation: formatPercent(highestEngagementTier.participationRate),
          })
        : data
          ? t('analytics.trust.summaryFallback', {
              totalUsers: formatNumber(data.totalUsers),
            })
          : '',
    [data, formatNumber, formatPercent, highestEngagementTier, t],
  );

  const summaryCards = useMemo(() => {
    if (!data) {
      return [];
    }
    const cards = [
      {
        id: 'trust-total-users',
        label: t('analytics.trust.summaryCards.totalUsers.label'),
        subtitle: t('analytics.trust.summaryCards.totalUsers.subtitle'),
        value: formatNumber(data.totalUsers),
        sr: t('analytics.trust.summaryCards.totalUsers.sr', {
          value: formatNumber(data.totalUsers),
        }),
      },
    ];

    if (highestEngagementTier) {
      cards.push({
        id: 'trust-strongest-tier',
        label: t('analytics.trust.summaryCards.strongestTier.label'),
        subtitle: t('analytics.trust.summaryCards.strongestTier.subtitle'),
        value: `${highestEngagementTier.tierName} (${highestEngagementTier.tier})`,
        sr: t('analytics.trust.summaryCards.strongestTier.sr', {
          tier: `${highestEngagementTier.tierName} (${highestEngagementTier.tier})`,
          engagement: formatNumber(highestEngagementTier.avgEngagement),
          participation: formatPercent(highestEngagementTier.participationRate),
        }),
      });
    }

    return cards;
  }, [data, formatNumber, formatPercent, highestEngagementTier, t]);

  useEffect(() => {
    const { fetchTrustTierComparison: ftc } = useAnalyticsStore.getState();
    void ftc({
      fallback: generateMockData,
    });
  }, []);

  const handleTabChange = useCallback(
    (value: typeof activeTab) => {
      setActiveTab(value);
      ScreenReaderSupport.announce(tabAnnouncements[value] ?? tabLabels[value] ?? value, 'polite');
    },
    [tabAnnouncements, tabLabels],
  );

  const handleRefresh = useCallback(() => {
    ScreenReaderSupport.announce(t('analytics.trust.refreshAnnouncement'), 'polite');
    void loadTrustTiers();
  }, [loadTrustTiers, t]);

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

    ScreenReaderSupport.announce(
      t('analytics.trust.errorAnnouncement', { error }),
      'assertive',
    );
    previousErrorRef.current = error;
  }, [error, t]);

  const handleExport = useCallback(() => {
    if (!data) return;

    // Create CSV content
    const headers = [
      'Tier',
      'Tier Name',
      'User Count',
      'Participation Rate (%)',
      'Completion Rate (%)',
      'Avg Engagement',
      'Bot Likelihood (%)',
      'Avg Polls Voted',
      'Avg Time on Site (min)'
    ];
    
    const rows = data.tiers.map(tier => [
      tier.tier,
      tier.tierName,
      tier.userCount.toString(),
      tier.participationRate.toString(),
      tier.completionRate.toString(),
      tier.avgEngagement.toString(),
      tier.botLikelihood.toString(),
      tier.avgPollsVoted.toString(),
      tier.avgTimeOnSite.toString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      'Total Users,' + data.totalUsers
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `trust-tier-comparison-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data]);

  // Loading state
  if (isLoading) {
    return (
      <Card className={className} role="region" aria-labelledby={cardHeadingId} aria-describedby={cardDescriptionId}>
        <CardHeader>
          <CardTitle id={cardHeadingId} className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('analytics.trust.cardTitle')}
          </CardTitle>
          <p id={cardDescriptionId} className="text-sm text-gray-600 mt-1">
            {t('analytics.trust.cardDescription')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  const showError = error && data;

  if (!data) {
    return (
      <Card className={className} role="region" aria-labelledby={cardHeadingId} aria-describedby={cardDescriptionId}>
        <CardHeader>
          <CardTitle id={cardHeadingId} className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('analytics.trust.cardTitle')}
          </CardTitle>
          <p id={cardDescriptionId} className="text-sm text-gray-600 mt-1">
            {t('analytics.trust.cardDescription')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-red-600" role="alert">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error ?? t('analytics.trust.errors.noData')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare radar chart data
  const radarData = [
    {
      metric: 'Participation',
      ...Object.fromEntries(data.tiers.map(t => [t.tier, t.participationRate]))
    },
    {
      metric: 'Completion',
      ...Object.fromEntries(data.tiers.map(t => [t.tier, t.completionRate]))
    },
    {
      metric: 'Engagement',
      ...Object.fromEntries(data.tiers.map(t => [t.tier, t.avgEngagement]))
    },
    {
      metric: 'Trust Score',
      ...Object.fromEntries(data.tiers.map(t => [t.tier, 100 - t.botLikelihood]))
    }
  ];

  return (
    <Card className={className} role="region" aria-labelledby={cardHeadingId} aria-describedby={cardDescriptionId}>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle id={cardHeadingId} className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('analytics.trust.cardTitle')}
            </CardTitle>
            <p id={cardDescriptionId} className="text-sm text-gray-600 mt-1">
              {t('analytics.trust.cardDescription')}
            </p>
          </div>
          <Button onClick={handleExport} size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('analytics.buttons.export')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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
        {summaryCards.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {summaryCards.map((card) => (
              <div
                key={card.id}
                className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100"
                role="group"
                aria-labelledby={`${card.id}-label`}
                aria-describedby={`${card.id}-value`}
              >
                <p id={`${card.id}-label`} className="text-sm text-gray-600">
                  {card.label}
                </p>
                <p id={`${card.id}-value`} className="text-2xl font-bold text-blue-700">
                  {card.value}
                </p>
                <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                <p className="sr-only">{card.sr}</p>
              </div>
            ))}
          </div>
        )}

        {/* Insights */}
        {data.insights && data.insights.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Key Insights
            </h3>
            <ul className="space-y-1">
              {data.insights.map((insight, index) => (
                <li key={index} className="text-xs text-blue-800 flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => handleTabChange(v as typeof activeTab)}
          aria-label={t('analytics.trust.tabsGroupLabel')}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="participation">{tabLabels.participation}</TabsTrigger>
            <TabsTrigger value="engagement">{tabLabels.engagement}</TabsTrigger>
            <TabsTrigger value="radar">{tabLabels.radar}</TabsTrigger>
          </TabsList>

          {/* Participation Tab */}
          <TabsContent
            value="participation"
            className="mt-6"
            role="region"
            aria-labelledby={`${participationRegionId}-heading`}
          >
            <p id={`${participationRegionId}-heading`} className="sr-only">
              {tabLabels.participation}
            </p>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                {t('analytics.trust.sections.participation.title')}
              </h3>
              <p className="text-xs text-gray-600">
                {t('analytics.trust.sections.participation.description')}
              </p>
            </div>

            <a
              href={`#${summarySectionId}-trust`}
              className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById(`${summarySectionId}-trust`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  element.focus();
                }
              }}
            >
              {t('analytics.accessibility.skipToTable')}
            </a>
            <div className="h-80" role="img" aria-label={t('analytics.trust.sections.participation.chartLabel')} tabIndex={-1}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.tiers} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="tier"
                    label={{
                      value: t('analytics.trust.axes.tier'),
                      position: 'insideBottom',
                      offset: -5,
                      style: { fontSize: 12 },
                    }}
                  />
                  <YAxis
                    label={{
                      value: t('analytics.trust.axes.percentage'),
                      angle: -90,
                      position: 'insideLeft',
                    }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const firstPayload = payload[0];
                      const tier = firstPayload?.payload;
                      if (!tier || typeof tier !== 'object' || !('tier' in tier)) return null;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-semibold text-gray-900 mb-2">
                            {tier.tier} - {tier.tierName}
                          </p>
                          <div className="space-y-1">
                            <p className="text-sm text-blue-600">
                              Participation:{' '}
                              <span className="font-medium">
                                {formatPercent(tier.participationRate)}
                              </span>
                            </p>
                            <p className="text-sm text-green-600">
                              Completion:{' '}
                              <span className="font-medium">
                                {formatPercent(tier.completionRate)}
                              </span>
                            </p>
                            <p className="text-sm text-gray-600">
                              Users:{' '}
                              <span className="font-medium">{formatNumber(tier.userCount)}</span>
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Bar dataKey="participationRate" name="Participation Rate (%)" fill="#3b82f6" />
                  <Bar dataKey="completionRate" name="Completion Rate (%)" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed breakdown */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                {t('analytics.trust.sections.participation.detailedMetrics')}
              </h3>
              <div className="space-y-2">
                {data.tiers.map((tier) => (
                  <div 
                    key={tier.tier}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge 
                        className="text-white"
                        style={{ backgroundColor: TIER_COLORS[tier.tier as keyof typeof TIER_COLORS] }}
                      >
                        {tier.tier}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tier.tierName}</p>
                        <p className="text-xs text-gray-500">
                          {formatNumber(tier.userCount)} {t('analytics.trust.usersSuffix')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatPercent(tier.participationRate)} / {formatPercent(tier.completionRate)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('analytics.trust.sections.participation.rateLabels')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent
            value="engagement"
            className="mt-6"
            role="region"
            aria-labelledby={`${engagementRegionId}-heading`}
          >
            <p id={`${engagementRegionId}-heading`} className="sr-only">
              {tabLabels.engagement}
            </p>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                {t('analytics.trust.sections.engagement.title')}
              </h3>
              <p className="text-xs text-gray-600">
                {t('analytics.trust.sections.engagement.description')}
              </p>
            </div>

            <div className="h-80" role="img" aria-label={t('analytics.trust.sections.engagement.chartLabel')}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.tiers} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="tier"
                    label={{
                      value: t('analytics.trust.axes.tier'),
                      position: 'insideBottom',
                      offset: -5,
                      style: { fontSize: 12 },
                    }}
                  />
                  <YAxis
                    label={{
                      value: t('analytics.trust.axes.score'),
                      angle: -90,
                      position: 'insideLeft',
                    }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const firstPayload = payload[0];
                      const tier = firstPayload?.payload;
                      if (!tier || typeof tier !== 'object' || !('tier' in tier)) return null;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-semibold text-gray-900 mb-2">
                            {tier.tier} - {tier.tierName}
                          </p>
                          <div className="space-y-1">
                            <p className="text-sm text-purple-600">
                              Engagement:{' '}
                              <span className="font-medium">
                                {formatNumber(tier.avgEngagement)}/100
                              </span>
                            </p>
                            <p className="text-sm text-red-600">
                              Bot Risk:{' '}
                              <span className="font-medium">
                                {formatPercent(tier.botLikelihood)}
                              </span>
                            </p>
                            <p className="text-sm text-gray-600">
                              Polls Voted:{' '}
                              <span className="font-medium">{formatNumber(tier.avgPollsVoted)}</span>
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Bar dataKey="avgEngagement" name="Avg Engagement Score" fill="#a855f7" />
                  <Bar dataKey="botLikelihood" name="Bot Likelihood (%)" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Radar Overview Tab */}
          <TabsContent
            value="radar"
            className="mt-6"
            role="region"
            aria-labelledby={`${radarRegionId}-heading`}
          >
            <p id={`${radarRegionId}-heading`} className="sr-only">
              {tabLabels.radar}
            </p>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                {t('analytics.trust.sections.radar.title')}
              </h3>
              <p className="text-xs text-gray-600">
                {t('analytics.trust.sections.radar.description')}
              </p>
            </div>

            <div className="h-96" role="img" aria-label={t('analytics.trust.sections.radar.chartLabel')}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  {data.tiers.map((tier) => (
                    <Radar
                      key={tier.tier}
                      name={`${tier.tier} - ${tier.tierName}`}
                      dataKey={tier.tier}
                      stroke={TIER_COLORS[tier.tier as keyof typeof TIER_COLORS]}
                      fill={TIER_COLORS[tier.tier as keyof typeof TIER_COLORS]}
                      fillOpacity={0.3}
                    />
                  ))}
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Tier Comparison Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-2 font-semibold text-gray-900">
                      {t('analytics.tables.columns.tier')}
                    </th>
                    <th className="text-right p-2 font-semibold text-gray-900">
                      {t('analytics.tables.columns.users')}
                    </th>
                    <th className="text-right p-2 font-semibold text-gray-900">
                      {t('analytics.tables.columns.participationRate')}
                    </th>
                    <th className="text-right p-2 font-semibold text-gray-900">
                      {t('analytics.tables.columns.avgEngagement')}
                    </th>
                    <th className="text-right p-2 font-semibold text-gray-900">
                      {t('analytics.tables.columns.botLikelihood')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.tiers.map((tier) => (
                    <tr key={tier.tier} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-2">
                        <Badge 
                          className="text-white"
                          style={{ backgroundColor: TIER_COLORS[tier.tier as keyof typeof TIER_COLORS] }}
                        >
                          {tier.tier} - {tier.tierName}
                        </Badge>
                      </td>
                      <td className="text-right p-2 text-gray-900">
                        {formatNumber(tier.userCount)}
                      </td>
                      <td className="text-right p-2 text-gray-900">
                        {formatPercent(tier.participationRate)}
                      </td>
                      <td className="text-right p-2 text-gray-900">
                        {formatNumber(tier.avgEngagement)}/100
                      </td>
                      <td className="text-right p-2">
                        <span
                          className={
                            tier.botLikelihood > 50 ? 'text-red-600 font-medium' : 'text-green-600'
                          }
                        >
                          {formatPercent(tier.botLikelihood)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

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
          {summaryIntro ? (
            <p
              role="status"
              aria-live="polite"
              className="text-sm text-foreground"
            >
              {summaryIntro}
            </p>
          ) : null}

          <section
            id={`${summarySectionId}-trust`}
            tabIndex={-1}
          >
            <AnalyticsSummaryTable
              tableId={`${summarySectionId}-trust`}
              title={t('analytics.trust.table.title')}
              description={t('analytics.trust.table.description')}
              columns={tableColumns}
              rows={tableRows}
            />
          </section>
        </section>

        {/* Refresh Button */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleRefresh}
            size="sm"
            variant="outline"
            aria-label={t('analytics.buttons.refresh')}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('analytics.buttons.refresh')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Generate mock data for development
 */
function generateMockData(): TierComparisonData {
  const tiers: TierMetrics[] = [
    {
      tier: 'T0',
      tierName: 'Basic',
      userCount: 450,
      participationRate: 45,
      completionRate: 35,
      avgEngagement: 40,
      botLikelihood: 35,
      avgPollsVoted: 3,
      avgTimeOnSite: 5
    },
    {
      tier: 'T1',
      tierName: 'Verified',
      userCount: 520,
      participationRate: 68,
      completionRate: 58,
      avgEngagement: 65,
      botLikelihood: 15,
      avgPollsVoted: 8,
      avgTimeOnSite: 12
    },
    {
      tier: 'T2',
      tierName: 'Trusted',
      userCount: 220,
      participationRate: 82,
      completionRate: 75,
      avgEngagement: 85,
      botLikelihood: 5,
      avgPollsVoted: 15,
      avgTimeOnSite: 22
    },
    {
      tier: 'T3',
      tierName: 'Elite',
      userCount: 57,
      participationRate: 95,
      completionRate: 92,
      avgEngagement: 98,
      botLikelihood: 2,
      avgPollsVoted: 28,
      avgTimeOnSite: 45
    }
  ];

  const insights = [
    'T3 users show 95% participation rate, significantly higher than T0 (45%)',
    'Bot likelihood decreases dramatically from T0 (35%) to T3 (2%)',
    'Elite users spend 9x more time on site than Basic users',
    'Completion rates improve consistently across all tiers',
    'T2 and T3 users represent only 22% of users but drive 60% of quality engagement'
  ];

  return {
    ok: true,
    tiers,
    totalUsers: tiers.reduce((sum, t) => sum + t.userCount, 0),
    insights
  };
}

