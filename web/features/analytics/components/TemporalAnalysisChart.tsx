/**
 * TemporalAnalysisChart Component
 *
 * Displays temporal patterns in user engagement.
 * Shows when users are most active (time-of-day, day-of-week).
 *
 * Features:
 * - Hour-of-day heatmap (24 hours)
 * - Day-of-week bar chart
 * - Peak times analysis
 * - Activity velocity trends
 * - CSV export functionality
 *
 * Created: November 5, 2025
 * Status: ✅ Production-ready
 */

'use client';

import {
  Download,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo, useId, useRef } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
import { useAnalyticsActions, useAnalyticsTemporal } from '@/lib/stores/analyticsStore';

import { useI18n } from '@/hooks/useI18n';

import {
  AnalyticsSummaryTable,
  type AnalyticsSummaryColumn,
  type AnalyticsSummaryRow,
} from './AnalyticsSummaryTable';

const ensureLabel = (value: string, fallback: string): string => {
  if (!value) return fallback;
  if (value.startsWith('analytics.')) {
    return fallback;
  }
  return value;
};

type HourlyData = {
  hour: number;
  activity: number;
  label: string;
};

type DailyData = {
  day: string;
  activity: number;
  dayIndex: number;
};

type VelocityData = {
  timestamp: string;
  velocity: number;
};

type TemporalData = {
  ok: boolean;
  hourly: HourlyData[];
  daily: DailyData[];
  velocity: VelocityData[];
  peakHour: number;
  peakDay: string;
  avgActivity: number;
};

type DateRange = '7d' | '30d' | '90d';

type TemporalAnalysisChartProps = {
  className?: string;
  defaultTab?: 'hourly' | 'daily' | 'velocity';
  defaultDateRange?: DateRange;
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * Get color based on activity level (for heatmap)
 */
const getActivityColor = (activity: number, maxActivity: number): string => {
  if (maxActivity === 0) return '#e5e7eb'; // gray-200

  const ratio = activity / maxActivity;

  if (ratio < 0.2) return '#dbeafe'; // blue-100
  if (ratio < 0.4) return '#93c5fd'; // blue-300
  if (ratio < 0.6) return '#60a5fa'; // blue-400
  if (ratio < 0.8) return '#3b82f6'; // blue-500
  return '#1d4ed8'; // blue-700
};

/**
 * Format hour for display (e.g., "2 AM", "2 PM")
 */
const formatHour = (hour: number): string => {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
};

export default function TemporalAnalysisChart({
  className = '',
  defaultTab = 'hourly',
  defaultDateRange = '30d'
}: TemporalAnalysisChartProps) {
  const { t, currentLanguage } = useI18n();
  const summarySectionId = useId();
  const cardHeadingId = useId();
  const cardDescriptionId = useId();
  const hourlyRegionId = useId();
  const dailyRegionId = useId();
  const velocityRegionId = useId();
  // removed duplicate declarations
  const [activeTab, setActiveTab] = useState(defaultTab);
  const previousSummaryAnnouncementRef = useRef<string | null>(null);
  const previousErrorRef = useRef<string | null>(null);
  const { fetchTemporal } = useAnalyticsActions();
  const temporal = useAnalyticsTemporal();
  const data = temporal.data;
  const isLoading = temporal.loading;
  const error = temporal.error;
  const dateRange = (temporal.meta.range as DateRange) ?? defaultDateRange;
  const dateRangeLabel = t('analytics.temporal.filters.dateRange');
  const refreshLabel = t('analytics.buttons.refresh');
  const exportLabel = t('analytics.buttons.export');

  const loadTemporal = useCallback(async (range?: DateRange) => {
    const targetRange = range ?? dateRange ?? defaultDateRange;
    await fetchTemporal(targetRange, {
      fallback: (r) => generateMockData(r as DateRange),
    });
  }, [dateRange, defaultDateRange, fetchTemporal]);

  const rangeLabels: Record<DateRange, string> = useMemo(
    () => ({
      '7d': t('analytics.temporal.ranges.7d'),
      '30d': t('analytics.temporal.ranges.30d'),
      '90d': t('analytics.temporal.ranges.90d'),
    }),
    [t],
  );

  const tabLabels = useMemo(
    () => ({
      hourly: t('analytics.temporal.tabsLabels.hourly'),
      daily: t('analytics.temporal.tabsLabels.daily'),
      velocity: t('analytics.temporal.tabsLabels.velocity'),
    }),
    [t],
  );

  const axisText = useMemo(
    () => ({
      hourOfDay: ensureLabel(t('analytics.temporal.axes.hourOfDay'), 'Hour of day'),
      dayOfWeek: ensureLabel(t('analytics.temporal.axes.dayOfWeek'), 'Day of week'),
      timestamp: ensureLabel(t('analytics.temporal.axes.timestamp'), 'Timestamp'),
    }),
    [t],
  );

  const tabAnnouncements = useMemo(
    () => ({
      hourly: t('analytics.temporal.tabAnnouncements.hourly'),
      daily: t('analytics.temporal.tabAnnouncements.daily'),
      velocity: t('analytics.temporal.tabAnnouncements.velocity'),
    }),
    [t],
  );

  const handleRangeChange = useCallback(
    (range: DateRange) => {
      ScreenReaderSupport.announce(
        t('analytics.temporal.announcements.rangeChanged', {
          range: rangeLabels[range] ?? range,
        }),
        'polite',
      );
      void loadTemporal(range);
    },
    [loadTemporal, rangeLabels, t],
  );

  const handleTabChange = useCallback(
    (tab: typeof activeTab) => {
      setActiveTab(tab);
      ScreenReaderSupport.announce(tabAnnouncements[tab] ?? tabLabels[tab] ?? tab, 'polite');
    },
    [tabAnnouncements, tabLabels],
  );

  const handleRefresh = useCallback(() => {
    ScreenReaderSupport.announce(t('analytics.temporal.announcements.refresh'), 'polite');
    void loadTemporal();
  }, [loadTemporal, t]);

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

  const hourlyColumns = useMemo<AnalyticsSummaryColumn[]>(
    () => [
      { key: 'hour', label: t('analytics.tables.columns.hour') },
      { key: 'activity', label: t('analytics.tables.columns.activity'), isNumeric: true },
      { key: 'percentageOfPeak', label: t('analytics.tables.columns.percentOfPeak'), isNumeric: true },
    ],
    [t],
  );

  const dailyColumns = useMemo<AnalyticsSummaryColumn[]>(
    () => [
      { key: 'day', label: t('analytics.tables.columns.day') },
      { key: 'activity', label: t('analytics.tables.columns.activity'), isNumeric: true },
      { key: 'percentageOfPeak', label: t('analytics.tables.columns.percentOfPeak'), isNumeric: true },
    ],
    [t],
  );

  const velocityColumns = useMemo<AnalyticsSummaryColumn[]>(
    () => [
      { key: 'timestamp', label: t('analytics.tables.columns.timestamp') },
      { key: 'velocity', label: t('analytics.tables.columns.velocity'), isNumeric: true },
    ],
    [t],
  );

  const maxHourlyActivity = useMemo(
    () => (data ? Math.max(...data.hourly.map((h) => h.activity), 0) : 0),
    [data],
  );
  const maxDailyActivity = useMemo(
    () => (data ? Math.max(...data.daily.map((d) => d.activity), 0) : 0),
    [data],
  );

  const hourlyRows = useMemo<AnalyticsSummaryRow[]>(
    () =>
      data
        ? data.hourly.map((hour) => ({
            id: hour.label,
            cells: {
              hour: hour.label,
              activity: formatNumber(hour.activity),
              percentageOfPeak:
                maxHourlyActivity > 0
                  ? formatPercent((hour.activity / maxHourlyActivity) * 100)
                  : formatPercent(0),
            },
          }))
        : [],
    [data, formatNumber, formatPercent, maxHourlyActivity],
  );

  const dailyRows = useMemo<AnalyticsSummaryRow[]>(
    () =>
      data
        ? data.daily.map((day) => ({
            id: day.day,
            cells: {
              day: day.day,
              activity: formatNumber(day.activity),
              percentageOfPeak:
                maxDailyActivity > 0
                  ? formatPercent((day.activity / maxDailyActivity) * 100)
                  : formatPercent(0),
            },
          }))
        : [],
    [data, formatNumber, formatPercent, maxDailyActivity],
  );

  const velocityRows = useMemo<AnalyticsSummaryRow[]>(
    () =>
      data
        ? data.velocity.map((entry, index) => ({
            id: `${entry.timestamp}-${index}`,
            cells: {
              timestamp: entry.timestamp,
              velocity: formatNumber(entry.velocity),
            },
          }))
        : [],
    [data, formatNumber],
  );

  const summaryIntro = useMemo(
    () =>
      data
        ? t('analytics.temporal.summaryIntro', {
            peakHour: formatHour(data.peakHour),
            peakDay: data.peakDay,
            avgActivity: formatNumber(data.avgActivity),
          })
        : '',
    [data, formatNumber, t],
  );

  const summaryCards = useMemo(() => {
    if (!data) {
      return [];
    }
    return [
      {
        id: 'temporal-peak-hour',
        label: t('analytics.temporal.summaryCards.peakHour.label'),
        value: formatHour(data.peakHour),
        subtitle: t('analytics.temporal.summaryCards.peakHour.subtitle'),
        sr: t('analytics.temporal.summaryCards.peakHour.sr', {
          value: formatHour(data.peakHour),
        }),
      },
      {
        id: 'temporal-peak-day',
        label: t('analytics.temporal.summaryCards.peakDay.label'),
        value: data.peakDay,
        subtitle: t('analytics.temporal.summaryCards.peakDay.subtitle'),
        sr: t('analytics.temporal.summaryCards.peakDay.sr', {
          value: data.peakDay,
        }),
      },
      {
        id: 'temporal-avg-activity',
        label: t('analytics.temporal.summaryCards.avgActivity.label'),
        value: formatNumber(data.avgActivity),
        subtitle: t('analytics.temporal.summaryCards.avgActivity.subtitle'),
        sr: t('analytics.temporal.summaryCards.avgActivity.sr', {
          value: formatNumber(data.avgActivity),
        }),
      },
    ];
  }, [data, formatNumber, t]);

  const hourlySummaryText = useMemo(
    () =>
      data
        ? t('analytics.temporal.tabSummaries.hourly', {
            peakHour: formatHour(data.peakHour),
            avgActivity: formatNumber(data.avgActivity),
          })
        : '',
    [data, formatNumber, t],
  );

  const dailySummaryText = useMemo(
    () =>
      data
        ? t('analytics.temporal.tabSummaries.daily', {
            peakDay: data.peakDay,
            avgActivity: formatNumber(data.avgActivity),
          })
        : '',
    [data, formatNumber, t],
  );

  const velocitySummaryText = useMemo(() => {
    if (!data || data.velocity.length === 0) {
      return '';
    }
    const firstVelocity = data.velocity[0]?.velocity ?? 0;
    const lastVelocity = data.velocity[data.velocity.length - 1]?.velocity ?? firstVelocity;
    const delta = lastVelocity - firstVelocity;
    const trendDirection =
      delta > 2
        ? t('analytics.temporal.velocityTrend.increasing')
        : delta < -2
          ? t('analytics.temporal.velocityTrend.decreasing')
          : t('analytics.temporal.velocityTrend.steady');

    return t('analytics.temporal.tabSummaries.velocity', {
      lastTimestamp: data.velocity[data.velocity.length - 1]?.timestamp ?? '',
      lastVelocity: formatNumber(lastVelocity),
      trendDirection,
    });
  }, [data, formatNumber, t]);

  useEffect(() => {
    void fetchTemporal(defaultDateRange, {
      fallback: (r) => generateMockData(r as DateRange),
    });
  }, [defaultDateRange, fetchTemporal]);

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
      `Temporal analysis data may be incomplete. ${error}`,
      'assertive',
    );
    previousErrorRef.current = error;
  }, [error]);

  const handleExport = useCallback(() => {
    if (!data) return;

    // Create CSV content
    const sections = [
      ['Hourly Activity'],
      ['Hour', 'Activity Count'],
      ...data.hourly.map(h => [h.label, h.activity.toString()]),
      [''],
      ['Daily Activity'],
      ['Day', 'Activity Count'],
      ...data.daily.map(d => [d.day, d.activity.toString()]),
      [''],
      ['Summary'],
      ['Peak Hour', formatHour(data.peakHour)],
      ['Peak Day', data.peakDay],
      ['Average Activity', data.avgActivity.toFixed(1)]
    ];

    const csvContent = sections.map(row => row.join(',')).join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `temporal-analysis-${dateRange}-${Date.now()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data, dateRange]);

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Temporal Analysis
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
  const showError = error && data;

  if (!data) {
    return (
      <Card role="region" aria-labelledby={cardHeadingId} aria-describedby={cardDescriptionId} className={className}>
        <CardHeader>
          <CardTitle id={cardHeadingId} className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('analytics.temporal.cardTitle')}
          </CardTitle>
          <p id={cardDescriptionId} className="text-sm text-gray-600 mt-1">
            {t('analytics.temporal.cardDescription')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-red-600" role="alert">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error ?? t('analytics.temporal.errors.noData')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card role="region" aria-labelledby={cardHeadingId} aria-describedby={cardDescriptionId} className={className}>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle id={cardHeadingId} className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('analytics.temporal.cardTitle')}
            </CardTitle>
            <p id={cardDescriptionId} className="text-sm text-gray-600 mt-1">
              {t('analytics.temporal.cardDescription')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor={`temporal-range-${summarySectionId}`}>
              {dateRangeLabel}
            </label>
            <select
              id={`temporal-range-${summarySectionId}`}
              value={dateRange}
              onChange={(e) => {
                const range = e.target.value as DateRange;
                handleRangeChange(range);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">{rangeLabels['7d']}</option>
              <option value="30d">{rangeLabels['30d']}</option>
              <option value="90d">{rangeLabels['90d']}</option>
            </select>
            <Button onClick={handleRefresh} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              {refreshLabel}
            </Button>
            <Button onClick={handleExport} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {exportLabel}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Error Notice */}
        {showError && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2" role="status" aria-live="polite">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-800">
              {t('analytics.temporal.notes.mockData', { error })}
            </p>
          </div>
        )}

        {/* Summary Stats */}
        {summaryCards.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {summaryCards.map((card) => (
              <div
                key={card.id}
                className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg"
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

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => handleTabChange(v as typeof activeTab)}
          aria-label={t('analytics.temporal.tabsGroupLabel')}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hourly">{tabLabels.hourly}</TabsTrigger>
            <TabsTrigger value="daily">{tabLabels.daily}</TabsTrigger>
            <TabsTrigger value="velocity">{tabLabels.velocity}</TabsTrigger>
          </TabsList>

          {/* Hourly Pattern Tab */}
          <TabsContent
            value="hourly"
            className="mt-6"
            role="region"
            aria-labelledby={`${hourlyRegionId}-heading`}
          >
            <p id={`${hourlyRegionId}-heading`} className="sr-only">
              {tabLabels.hourly}
            </p>
            {hourlySummaryText ? (
              <p className="sr-only" aria-live="polite">
                {hourlySummaryText}
              </p>
            ) : null}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('analytics.temporal.sections.hourly.title')}</h3>
              <p className="text-xs text-gray-600">
                {t('analytics.temporal.sections.hourly.description')}
              </p>
            </div>

            {/* Heatmap Grid */}
            <div className="mb-6 grid grid-cols-12 gap-2" role="group" aria-label={t('analytics.temporal.sections.hourly.heatmapLabel')}>
              {data.hourly.map((hour) => (
                <div
                  key={hour.hour}
                  className="relative aspect-square rounded transition-all hover:scale-110 cursor-pointer"
                  style={{
                    backgroundColor: getActivityColor(hour.activity, maxHourlyActivity)
                  }}
                  aria-hidden="true"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-700">
                      {hour.hour}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mb-6 flex items-center justify-center gap-4 text-xs" aria-hidden="true">
              <span className="text-gray-600">{t('analytics.temporal.sections.hourly.legendLow')}</span>
              <div className="flex gap-1">
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((ratio) => (
                  <div
                    key={ratio}
                    className="w-6 h-4 rounded"
                    style={{ backgroundColor: getActivityColor(ratio * 100, 100) }}
                  />
                ))}
              </div>
              <span className="text-gray-600">{t('analytics.temporal.sections.hourly.legendHigh')}</span>
            </div>

            {/* Bar Chart */}
            <div className="h-64" role="img" aria-label={hourlySummaryText || tabLabels.hourly}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourly} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    label={{
                      value: axisText.hourOfDay,
                      position: 'insideBottom',
                      offset: -40,
                      style: { fontSize: 11 },
                    }}
                  />
                  <YAxis label={{ value: t('analytics.temporal.axes.activityCount'), angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const data = payload[0]?.payload;
                      if (!data) return null;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-semibold text-gray-900">{data.label}</p>
                          <p className="text-sm text-blue-600">
                            Activity: <span className="font-medium">{data.activity}</span>
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Bar dataKey="activity" name={t('analytics.temporal.axes.activityCount')} fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Daily Pattern Tab */}
          <TabsContent
            value="daily"
            className="mt-6"
            role="region"
            aria-labelledby={`${dailyRegionId}-heading`}
          >
            <p id={`${dailyRegionId}-heading`} className="sr-only">
              {tabLabels.daily}
            </p>
            {dailySummaryText ? (
              <p className="sr-only" aria-live="polite">
                {dailySummaryText}
              </p>
            ) : null}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('analytics.temporal.sections.daily.title')}</h3>
              <p className="text-xs text-gray-600">
                {t('analytics.temporal.sections.daily.description')}
              </p>
            </div>

            <div className="h-80" role="img" aria-label={dailySummaryText || tabLabels.daily}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.daily} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    label={{
                      value: axisText.dayOfWeek,
                      position: 'insideBottom',
                      offset: -5,
                      style: { fontSize: 12 },
                    }}
                  />
                  <YAxis label={{ value: t('analytics.temporal.axes.activityCount'), angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const data = payload[0]?.payload;
                      if (!data) return null;
                      const percentage = maxDailyActivity > 0
                        ? ((data.activity / maxDailyActivity) * 100).toFixed(1)
                        : 0;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-semibold text-gray-900">{data.day}</p>
                          <p className="text-sm text-green-600">
                            Activity: <span className="font-medium">{data.activity}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            {percentage}% of peak activity
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Bar dataKey="activity" name="Activity Count">
                    {data.daily.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.day === data.peakDay ? '#22c55e' : '#3b82f6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Days */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('analytics.temporal.sections.daily.listTitle')}</h3>
              <div className="space-y-2">
                {data.daily
                  .sort((a, b) => b.activity - a.activity)
                  .map((day, index) => (
                    <div
                      key={day.day}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📅'}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{day.day}</p>
                          <p className="text-xs text-gray-500">
                            {t('analytics.temporal.sections.daily.percentOfPeak', {
                              value: maxDailyActivity > 0 ? ((day.activity / maxDailyActivity) * 100).toFixed(0) : '0',
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{day.activity}</p>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>

          {/* Velocity Trends Tab */}
          <TabsContent
            value="velocity"
            className="mt-6"
            role="region"
            aria-labelledby={`${velocityRegionId}-heading`}
          >
            <p id={`${velocityRegionId}-heading`} className="sr-only">
              {tabLabels.velocity}
            </p>
            {velocitySummaryText ? (
              <p className="sr-only" aria-live="polite">
                {velocitySummaryText}
              </p>
            ) : null}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('analytics.temporal.sections.velocity.title')}</h3>
              <p className="text-xs text-gray-600">
                {t('analytics.temporal.sections.velocity.description')}
              </p>
            </div>

            <div className="h-80" role="img" aria-label={velocitySummaryText || tabLabels.velocity}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.velocity} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    label={{
                      value: axisText.timestamp,
                      position: 'insideBottom',
                      offset: -40,
                      style: { fontSize: 11 },
                    }}
                  />
                  <YAxis label={{ value: t('analytics.temporal.axes.velocity'), angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const data = payload[0]?.payload;
                      if (!data) return null;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-semibold text-gray-900">{data.timestamp}</p>
                          <p className="text-sm text-purple-600">
                            Velocity: <span className="font-medium">{data.velocity.toFixed(1)}</span>
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="velocity"
                    stroke="#a855f7"
                    strokeWidth={2}
                    name="Activity Velocity"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>

        {/* Refresh Button */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={() => {
              void loadTemporal();
            }}
            size="sm"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {refreshLabel}
          </Button>
        </div>

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

          <AnalyticsSummaryTable
            tableId={`${summarySectionId}-hourly`}
            title={t('analytics.temporal.tables.hourly.title')}
            description={t('analytics.temporal.tables.hourly.description')}
            columns={hourlyColumns}
            rows={hourlyRows}
          />
          <AnalyticsSummaryTable
            tableId={`${summarySectionId}-daily`}
            title={t('analytics.temporal.tables.daily.title')}
            description={t('analytics.temporal.tables.daily.description')}
            columns={dailyColumns}
            rows={dailyRows}
          />
          <AnalyticsSummaryTable
            tableId={`${summarySectionId}-velocity`}
            title={t('analytics.temporal.tables.velocity.title')}
            description={t('analytics.temporal.tables.velocity.description')}
            columns={velocityColumns}
            rows={velocityRows}
          />
        </section>
      </CardContent>
    </Card>
  );
}

/**
 * Generate mock data for development
 */
function generateMockData(_range: string): TemporalData {
  // Generate hourly data (24 hours)
  const hourly: HourlyData[] = Array.from({ length: 24 }, (_, i) => {
    // Simulate realistic patterns: low at night, high during day
    let baseActivity = 20;
    if (i >= 6 && i <= 9) baseActivity = 80; // Morning peak
    else if (i >= 12 && i <= 14) baseActivity = 90; // Lunch peak
    else if (i >= 18 && i <= 21) baseActivity = 100; // Evening peak
    else if (i >= 22 || i <= 5) baseActivity = 10; // Night low

    const activity = baseActivity + Math.floor(Math.random() * 20);

    return {
      hour: i,
      activity,
      label: formatHour(i)
    };
  });

  // Generate daily data (7 days)
  const daily: DailyData[] = DAYS.map((day, index) => ({
    day,
    dayIndex: index,
    activity: Math.floor(Math.random() * 200) + 400
  }));

  // Generate velocity data (last 24 data points)
  const velocity: VelocityData[] = Array.from({ length: 24 }, (_, i) => ({
    timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    velocity: Math.floor(Math.random() * 50) + 30
  }));

  // Calculate peak values
  const peakHourData: HourlyData = hourly.length > 0
    ? hourly.reduce((max, h) => (h.activity > max.activity ? h : max), { hour: 0, activity: 0, label: '12 AM' })
    : { hour: 0, activity: 0, label: '12 AM' };
  const peakDayData: DailyData = daily.length > 0
    ? daily.reduce((max, d) => (d.activity > max.activity ? d : max), { day: 'Monday', activity: 0, dayIndex: 0 })
    : { day: 'Monday', activity: 0, dayIndex: 0 };
  const avgActivity = hourly.length > 0 ? hourly.reduce((sum, h) => sum + h.activity, 0) / hourly.length : 0;

  return {
    ok: true,
    hourly,
    daily,
    velocity,
    peakHour: peakHourData.hour,
    peakDay: peakDayData.day,
    avgActivity
  };
}

