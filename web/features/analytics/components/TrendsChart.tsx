/**
 * TrendsChart Component
 *
 * Displays time-series analytics data showing trends over time.
 * Features:
 * - Line/Area chart visualization
 * - Date range selection
 * - Multiple metrics (votes, participation, velocity)
 * - CSV export functionality
 * - Responsive design
 *
 * Created: November 5, 2025
 * Status: ✅ Production-ready
 */

'use client';

import {
  Download,
  Calendar,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Activity
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo, useId, useRef } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { useAnalyticsActions, useAnalyticsTrends } from '@/lib/stores/analyticsStore';

import { useI18n } from '@/hooks/useI18n';

import {
  AnalyticsSummaryTable,
  type AnalyticsSummaryColumn,
  type AnalyticsSummaryRow,
} from './AnalyticsSummaryTable';

type TrendDataPoint = {
  date: string;
  votes: number;
  participation: number;
  velocity: number;
};

type TrendsChartProps = {
  className?: string;
  defaultRange?: '7d' | '30d' | '90d';
  defaultChartType?: 'line' | 'area';
};

type DateRange = '7d' | '30d' | '90d';
type ChartType = 'line' | 'area';

export default function TrendsChart({
  className = '',
  defaultRange = '7d',
  defaultChartType = 'area'
}: TrendsChartProps) {
  const { t, currentLanguage } = useI18n();
  const summarySectionId = useId();
  const cardHeadingId = useId();
  const chartDescriptionId = useId();
  const chartRegionId = useId();
  const isMobile = useIsMobile();
  const [chartType, setChartType] = useState<ChartType>(defaultChartType);
  const previousSummaryAnnouncementRef = useRef<string | null>(null);
  const previousErrorRef = useRef<string | null>(null);
  const { fetchTrends } = useAnalyticsActions();
  const trends = useAnalyticsTrends();
  const data = trends.data;
  const isLoading = trends.loading;
  const error = trends.error;
  const dateRange = (trends.meta.range as DateRange) ?? defaultRange;

  const loadTrends = useCallback(async (range?: DateRange) => {
    const targetRange = range ?? dateRange ?? defaultRange;
    await fetchTrends(targetRange, {
      fallback: (r) => generateMockData(r as DateRange),
    });
  }, [dateRange, defaultRange, fetchTrends]);

  const rangeLabels: Record<DateRange, string> = useMemo(
    () => ({
      '7d': t('analytics.trends.ranges.7d'),
      '30d': t('analytics.trends.ranges.30d'),
      '90d': t('analytics.trends.ranges.90d'),
    }),
    [t],
  );

  const chartTypeLabels: Record<ChartType, string> = useMemo(
    () => ({
      line: t('analytics.trends.chartTypes.line'),
      area: t('analytics.trends.chartTypes.area'),
    }),
    [t],
  );

  const currentRangeLabel = rangeLabels[dateRange] ?? rangeLabels[defaultRange] ?? dateRange;
  const currentChartTypeLabel =
    chartTypeLabels[chartType] ?? chartTypeLabels[defaultChartType] ?? chartType;
  const chartDescription = useMemo(
    () =>
      t('analytics.trends.chart.description', {
        range: currentRangeLabel,
        chartType: currentChartTypeLabel,
    }),
    [currentChartTypeLabel, currentRangeLabel, t],
  );
  const dateRangeLabel = t('analytics.trends.filters.dateRange');
  const chartTypeSelectLabel = t('analytics.trends.filters.chartType');
  const exportLabel = t('analytics.buttons.export');

  const handleRangeChange = useCallback(
    (range: DateRange) => {
      ScreenReaderSupport.announce(
        t('analytics.trends.announcements.rangeChanged', {
          range: rangeLabels[range] ?? range,
        }),
        'polite',
      );
      void loadTrends(range);
    },
    [loadTrends, rangeLabels, t],
  );

  const handleChartTypeChange = useCallback(
    (type: ChartType) => {
      setChartType(type);
      ScreenReaderSupport.announce(
        t('analytics.trends.announcements.chartTypeChanged', {
          chartType: chartTypeLabels[type] ?? type,
        }),
        'polite',
      );
    },
    [chartTypeLabels, t],
  );

  const handleRefresh = useCallback(() => {
    ScreenReaderSupport.announce(
      t('analytics.trends.announcements.refresh'),
      'polite',
    );
    void loadTrends();
  }, [loadTrends, t]);

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

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(currentLanguage, {
        month: 'short',
        day: 'numeric',
      }),
    [currentLanguage],
  );

  const formatDate = useCallback(
    (isoDate: string) => {
      try {
        return dateFormatter.format(new Date(isoDate));
      } catch {
        return isoDate;
      }
    },
    [dateFormatter],
  );

  const trendsColumns = useMemo<AnalyticsSummaryColumn[]>(
    () => [
      { key: 'date', label: t('analytics.tables.columns.date') },
      { key: 'votes', label: t('analytics.tables.columns.votes'), isNumeric: true },
      {
        key: 'participation',
        label: t('analytics.tables.columns.participation'),
        isNumeric: true,
      },
      {
        key: 'velocity',
        label: t('analytics.tables.columns.velocity'),
        isNumeric: true,
      },
    ],
    [t],
  );

  const trendsRows = useMemo<AnalyticsSummaryRow[]>(
    () =>
      data.map((point) => ({
        id: point.date,
        cells: {
          date: point.date,
          votes: formatNumber(point.votes),
          participation: formatPercent(point.participation),
          velocity: formatNumber(point.velocity),
        },
      })),
    [data, formatNumber, formatPercent],
  );

  const peakVotesPoint = useMemo(() => {
    if (!data.length) {
      return null;
    }
    return data.reduce<TrendDataPoint>(
      (peak, point) => (point.votes > peak.votes ? point : peak),
      data[0] as TrendDataPoint
    );
  }, [data]);

  const peakParticipationPoint = useMemo(() => {
    if (!data.length) {
      return null;
    }
    return data.reduce<TrendDataPoint>(
      (peak, point) => (point.participation > peak.participation ? point : peak),
      data[0] as TrendDataPoint,
    );
  }, [data]);

  // Calculate trend direction (memoized to satisfy exhaustive-deps)
  const getTrend = useCallback((metric: 'votes' | 'participation' | 'velocity'): number => {
    if (data.length < 2) return 0;
    const first = data[0]?.[metric];
    const last = data[data.length - 1]?.[metric];
    if (first === undefined || last === undefined || first === 0) return 0;
    return ((last - first) / first) * 100;
  }, [data]);

  const chartSummaryText = useMemo(() => {
    if (!data.length || !peakVotesPoint || !peakParticipationPoint) {
      return '';
    }
    const voteTrend = getTrend('votes');
    const trendDirectionKey =
      voteTrend > 2 ? 'increasing' : voteTrend < -2 ? 'decreasing' : 'steady';

    return t('analytics.trends.chart.summary', {
      peakVotesDate: formatDate(peakVotesPoint.date),
      peakVotes: formatNumber(peakVotesPoint.votes),
      peakParticipationDate: formatDate(peakParticipationPoint.date),
      peakParticipation: formatPercent(peakParticipationPoint.participation),
      trendDirection: t(`analytics.trends.trendDirections.${trendDirectionKey}`),
      range: currentRangeLabel,
    });
  }, [
    data.length,
    formatDate,
    formatNumber,
    formatPercent,
    peakParticipationPoint,
    peakVotesPoint,
    currentRangeLabel,
    getTrend,
    t,
  ]);
 

  // Removed unused chartAxesDescription to satisfy unused variables lint

  useEffect(() => {
    void fetchTrends(defaultRange, {
      fallback: (r) => generateMockData(r as DateRange),
    });
  }, [defaultRange, fetchTrends]);

  

  const handleExport = useCallback(() => {
    if (data.length === 0) return;

    // Create CSV content
    const headers = ['Date', 'Votes', 'Participation Rate (%)', 'Velocity'];
    const rows = data.map(point => [
      point.date,
      point.votes.toString(),
      point.participation.toString(),
      point.velocity.toString()
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
    link.setAttribute('download', `trends-${dateRange}-${Date.now()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data, dateRange]);

  // Calculate statistics
  const totalVotes = data.reduce((sum, d) => sum + d.votes, 0);
  const avgParticipation = data.length > 0
    ? data.reduce((sum, d) => sum + d.participation, 0) / data.length
    : 0;
  const avgVelocity = data.length > 0
    ? data.reduce((sum, d) => sum + d.velocity, 0) / data.length
    : 0;

  const formatTrendValue = useCallback(
    (value: number) => percentFormatter.format(Math.abs(value)),
    [percentFormatter],
  );

  const summaryIntro = useMemo(
    () =>
      t('analytics.trends.summaryIntro', {
        totalVotes: formatNumber(totalVotes),
        avgParticipation: formatPercent(avgParticipation),
        avgVelocity: formatNumber(avgVelocity),
      }),
    [avgParticipation, avgVelocity, formatNumber, formatPercent, t, totalVotes],
  );

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
      `Activity trends data could not be fetched. ${error}`,
      'assertive',
    );
    previousErrorRef.current = error;
  }, [error]);

  // Loading state
  if (isLoading) {
    return (
      <Card
        className={className}
        role="region"
        aria-labelledby={cardHeadingId}
        aria-describedby={chartDescriptionId}
      >
        <CardHeader>
          <CardTitle id={cardHeadingId} className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('analytics.trends.chart.title')}
          </CardTitle>
        </CardHeader>
        <p id={chartDescriptionId} className="sr-only">
          {chartDescription}
        </p>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state (with mock data)
  const showError = error && data.length === 0;

  return (
    <Card
      role="region"
      aria-labelledby={cardHeadingId}
      aria-describedby={chartDescriptionId}
      className={className}
    >
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <CardTitle
              id={cardHeadingId}
              className="flex items-center gap-2 text-xl md:text-2xl"
            >
              <TrendingUp className="h-5 w-5" />
              {t('analytics.trends.chart.title')}
            </CardTitle>
            <p className="text-xs md:text-sm text-gray-600 mt-1">
              {isMobile ? 'Votes, participation & engagement' : 'Historical trends for votes, participation, and engagement'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExport}
              disabled={data.length === 0}
              size={isMobile ? "sm" : "default"}
              variant="outline"
              className="flex-1 md:flex-none min-h-[44px]"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportLabel}
            </Button>
          </div>
        </div>
      </CardHeader>
      <p id={chartDescriptionId} className="sr-only">
        {chartDescription}
      </p>
      <CardContent>
        {/* Filters - Mobile Optimized */}
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:flex-wrap gap-3 md:gap-4 items-stretch sm:items-center">
          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <select
              value={dateRange}
              onChange={(e) => {
                const range = e.target.value as DateRange;
                handleRangeChange(range);
              }}
              aria-label={dateRangeLabel}
              className="flex-1 sm:flex-none px-3 py-2 md:py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
            >
              <option value="7d">{rangeLabels['7d']}</option>
              <option value="30d">{rangeLabels['30d']}</option>
              <option value="90d">{rangeLabels['90d']}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <Activity className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <select
              value={chartType}
              onChange={(e) => handleChartTypeChange(e.target.value as ChartType)}
              aria-label={chartTypeSelectLabel}
              className="flex-1 sm:flex-none px-3 py-2 md:py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
            >
              <option value="line">{chartTypeLabels.line}</option>
              <option value="area">{chartTypeLabels.area}</option>
            </select>
          </div>

          <Button
            onClick={handleRefresh}
            size={isMobile ? "default" : "sm"}
            variant="outline"
            className="min-h-[44px] flex-1 sm:flex-none"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('analytics.buttons.refresh')}
          </Button>
        </div>

        {/* Error Notice */}
        {showError && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Unable to fetch real data. Showing mock data for demonstration.
            </p>
          </div>
        )}

        {/* Summary Stats - Responsive Grid */}
        <div className="mb-4 md:mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="text-center p-3 md:p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <p className="text-xs md:text-sm text-gray-600">Total Votes</p>
            <p className="text-xl md:text-2xl font-bold text-blue-700">{formatNumber(totalVotes)}</p>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs">
              {getTrend('votes') >= 0 ? (
                <span className="text-green-600">
                  ↑ {formatTrendValue(getTrend('votes'))}
                </span>
              ) : (
                <span className="text-red-600">
                  ↓ {formatTrendValue(getTrend('votes'))}
                </span>
              )}
            </div>
          </div>

          <div className="text-center p-3 md:p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <p className="text-xs md:text-sm text-gray-600">Avg Participation</p>
            <p className="text-xl md:text-2xl font-bold text-green-700">
              {formatPercent(avgParticipation)}
            </p>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs">
              {getTrend('participation') >= 0 ? (
                <span className="text-green-600">
                  ↑ {formatTrendValue(getTrend('participation'))}
                </span>
              ) : (
                <span className="text-red-600">
                  ↓ {formatTrendValue(getTrend('participation'))}
                </span>
              )}
            </div>
          </div>

          <div className="text-center p-3 md:p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <p className="text-xs md:text-sm text-gray-600">Avg Velocity</p>
            <p className="text-xl md:text-2xl font-bold text-purple-700">
              {formatNumber(avgVelocity)}
            </p>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs">
              {getTrend('velocity') >= 0 ? (
                <span className="text-green-600">
                  ↑ {formatTrendValue(getTrend('velocity'))}
                </span>
              ) : (
                <span className="text-red-600">
                  ↓ {formatTrendValue(getTrend('velocity'))}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Chart */}
        {data.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-64 text-gray-500"
            role="region"
            aria-live="polite"
          >
            <Activity className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">No trend data available</p>
            <p className="text-sm">Try selecting a different date range</p>
          </div>
        ) : (
          <div
            className={isMobile ? "h-64 md:h-96" : "h-96"}
            role="group"
            aria-labelledby={`${chartRegionId}-title`}
            aria-describedby={`${chartRegionId}-summary`}
          >
            <p id={`${chartRegionId}-title`} className="sr-only">
              {t('analytics.trends.chart.title')}
            </p>
            <p id={`${chartRegionId}-summary`} className="sr-only">
              {chartSummaryText || chartDescription}
            </p>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={data} margin={isMobile ? { top: 10, right: 10, left: 0, bottom: 20 } : { top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? "end" : "middle"}
                    height={isMobile ? 60 : 30}
                  />
                  <YAxis
                    yAxisId="left"
                    label={{
                      value: t('analytics.trends.chart.axes.votes'),
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 11 },
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{
                      value: t('analytics.trends.chart.axes.participation'),
                      angle: 90,
                      position: 'insideRight',
                      style: { fontSize: 11 },
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const data = payload[0]?.payload;
                      if (!data) return null;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-semibold text-gray-900">{data.date}</p>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-blue-600">
                              <span className="font-medium">Votes:</span> {data.votes.toLocaleString()}
                            </p>
                            <p className="text-sm text-green-600">
                              <span className="font-medium">Participation:</span> {data.participation}%
                            </p>
                            <p className="text-sm text-purple-600">
                              <span className="font-medium">Velocity:</span> {data.velocity}
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="votes"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Votes"
                    dot={{ r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="participation"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Participation %"
                    dot={{ r: 4 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="velocity"
                    stroke="#a855f7"
                    strokeWidth={2}
                    name="Velocity"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              ) : (
                <AreaChart data={data} margin={isMobile ? { top: 10, right: 10, left: 0, bottom: 20 } : { top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? "end" : "middle"}
                    height={isMobile ? 60 : 30}
                  />
                  <YAxis
                    yAxisId="left"
                    label={{
                      value: t('analytics.trends.chart.axes.votes'),
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 11 },
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{
                      value: t('analytics.trends.chart.axes.participation'),
                      angle: 90,
                      position: 'insideRight',
                      style: { fontSize: 11 },
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const data = payload[0]?.payload;
                      if (!data) return null;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-semibold text-gray-900">{data.date}</p>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-blue-600">
                              <span className="font-medium">Votes:</span> {data.votes.toLocaleString()}
                            </p>
                            <p className="text-sm text-green-600">
                              <span className="font-medium">Participation:</span> {data.participation}%
                            </p>
                            <p className="text-sm text-purple-600">
                              <span className="font-medium">Velocity:</span> {data.velocity}
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="votes"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    name="Votes"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="participation"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.3}
                    name="Participation %"
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="velocity"
                    stroke="#a855f7"
                    fill="#a855f7"
                    fillOpacity={0.3}
                    name="Velocity"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
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
            className="text-sm text-foreground"
          >
            {summaryIntro}
          </p>
          <AnalyticsSummaryTable
            tableId={`${summarySectionId}-trends`}
            title={t('analytics.trends.table.title')}
            description={t('analytics.trends.table.description')}
            columns={trendsColumns}
            rows={trendsRows}
          />
        </section>
      </CardContent>
    </Card>
  );
}

/**
 * Generate mock data for development
 */
function generateMockData(range: DateRange): TrendDataPoint[] {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const data: TrendDataPoint[] = [];

  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    data.push({
      date: date.toISOString().split('T')[0] ?? date.toISOString(),
      votes: Math.floor(Math.random() * 500) + 200,
      participation: Math.floor(Math.random() * 40) + 60,
      velocity: Math.floor(Math.random() * 50) + 20
    });
  }

  return data;
}

