/**
 * Enhanced Analytics Dashboard Component
 *
 * Comprehensive analytics dashboard combining:
 * - System monitoring (real-time, health)
 * - Business intelligence (trends, demographics, heatmaps)
 * - Trust tier analysis
 * - Geographic engagement
 *
 * Created: 2025-10-27
 * Enhanced: 2025-11-05 - Added visualization charts, access control, privacy filters
 */

import {
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
  Activity,
  HeartPulse,
  Bell,
  Shield,
  Zap,
  Database as DatabaseIcon,
  BarChart3,
  Flame,
  Clock
} from 'lucide-react';
import React, {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/hooks/useI18n';
import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
import { canAccessAnalytics, logAnalyticsAccess, UnauthorizedAccess } from '@/lib/auth/adminGuard';
import { useIsMobile, useIsTablet } from '@/lib/hooks/useMediaQuery';
import { useUser } from '@/lib/stores';
import { logger } from '@/lib/utils/logger';
import type { Database } from '@/types/database';

import DistrictHeatmap from '../../admin/components/DistrictHeatmap';
import { useEnhancedAnalytics } from '../hooks/useEnhancedAnalytics';

import DemographicsChart from './DemographicsChart';
import PollHeatmap from './PollHeatmap';
import TemporalAnalysisChart from './TemporalAnalysisChart';
import TrendsChart from './TrendsChart';
import TrustTierComparisonChart from './TrustTierComparisonChart';

type SystemHealthRow = Database['public']['Tables']['system_health']['Row'];
type SiteMessageRow = Database['public']['Tables']['site_messages']['Row'];

type AnalyticsTab = 'overview' | 'trends' | 'heatmaps' | 'demographics' | 'temporal' | 'trust';


type EnhancedAnalyticsDashboardProps = {
  pollId?: string;
  userId?: string;
  sessionId?: string;
  enableRealTime?: boolean;
  enableNewSchema?: boolean;
  className?: string;
  skipAccessGuard?: boolean;
}

export const EnhancedAnalyticsDashboard: React.FC<EnhancedAnalyticsDashboardProps> = ({
  pollId,
  userId,
  sessionId,
  enableRealTime = true,
  enableNewSchema = true,
  className = '',
  skipAccessGuard = false,
}) => {
  const { t, currentLanguage } = useI18n();
  const headingId = useId();
  const tabDescriptionId = useId();
  const summaryRegionId = useId();
  const regionRef = useRef<HTMLElement | null>(null);
  const hasAnnouncedTab = useRef(false);
  const isInitialUpdate = useRef(true);
  const tabAnnouncementRef = useRef<string | null>(null);
  const overviewAnnouncementRef = useRef<string | null>(null);

  // Responsive hooks
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Access Control - Admin Only
  const currentUser = useUser();
  const hasAccess = canAccessAnalytics(currentUser, false);

  // Log access attempt
  useEffect(() => {
    logAnalyticsAccess(currentUser, 'enhanced-analytics-dashboard', hasAccess);
  }, [currentUser, hasAccess]);

  const {
    data,
    loading,
    error,
    lastUpdated,
    fetchAnalytics: _fetchAnalytics,
    trackFeatureUsage,
    getSystemHealth,
    getActiveSiteMessages,
    refresh
  } = useEnhancedAnalytics({
    enableRealTime,
    enableNewSchema,
    ...(pollId ? { pollId } : {}),
    ...(userId ? { userId } : {}),
    ...(sessionId ? { sessionId } : {}),
  });

  const [systemHealth, setSystemHealth] = useState<SystemHealthRow[]>([]);
  const [siteMessages, setSiteMessages] = useState<SiteMessageRow[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load additional data
  useEffect(() => {
    const loadAdditionalData = async () => {
      try {
        const [health, messages] = await Promise.all([
          getSystemHealth(),
          getActiveSiteMessages()
        ]);
        setSystemHealth(health);
        setSiteMessages(messages);
      } catch (err) {
        logger.error('Error loading additional data:', err);
      }
    };

    loadAdditionalData();
  }, [getSystemHealth, getActiveSiteMessages]);

  // Track dashboard usage
  useEffect(() => {
    trackFeatureUsage('enhanced_analytics_dashboard', 'view', {
      pollId,
      userId,
      enableNewSchema
    });
  }, [trackFeatureUsage, pollId, userId, enableNewSchema]);

  const tabLabels = useMemo(
    () => ({
      overview: t('analytics.tabs.overview'),
      trends: t('analytics.tabs.trends'),
      heatmaps: t('analytics.tabs.heatmaps'),
      demographics: t('analytics.tabs.demographics'),
      temporal: t('analytics.tabs.temporal'),
      trust: t('analytics.tabs.trust'),
    }),
    [t],
  );

  const tabDescriptions = useMemo(
    () => ({
      overview: t('analytics.tabDescriptions.overview'),
      trends: t('analytics.tabDescriptions.trends'),
      heatmaps: t('analytics.tabDescriptions.heatmaps'),
      demographics: t('analytics.tabDescriptions.demographics'),
      temporal: t('analytics.tabDescriptions.temporal'),
      trust: t('analytics.tabDescriptions.trust'),
    }),
    [t],
  );

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(currentLanguage, {
        maximumFractionDigits: 0,
      }),
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
    (value?: number | null) => {
      if (typeof value !== 'number') {
        return '0';
      }
      return numberFormatter.format(value);
    },
    [numberFormatter],
  );

  const formatPercent = useCallback(
    (value?: number | null) => {
      if (typeof value !== 'number') {
        return '0%';
      }
      return `${percentFormatter.format(value)}%`;
    },
    [percentFormatter],
  );

  const formatTime = useCallback(
    (date?: Date | null) => {
      if (!date) return '';
      try {
        return new Intl.DateTimeFormat(currentLanguage, {
          hour: 'numeric',
          minute: '2-digit',
        }).format(date);
      } catch (error) {
        logger.warn('Failed to format analytics timestamp', { error });
        return date.toLocaleTimeString();
      }
    },
    [currentLanguage],
  );

  const overviewSummary = useMemo(() => {
    if (!data?.summary) {
      return null;
    }

    const {
      totalUsers,
      activeUsers,
      totalPolls,
      newPolls,
      totalVotes,
      newVotes,
      engagementScore,
      trustScore,
    } = data.summary;

    return t('analytics.summaries.overview', {
      totalUsers: formatNumber(totalUsers),
      activeUsers: formatNumber(activeUsers),
      totalPolls: formatNumber(totalPolls),
      newPolls: formatNumber(newPolls),
      totalVotes: formatNumber(totalVotes),
      newVotes: formatNumber(newVotes),
      engagementScore: formatPercent(engagementScore),
      trustScore: formatPercent(trustScore),
    });
  }, [data, formatNumber, formatPercent, t]);

  const overviewMetrics = useMemo(() => {
    if (!data?.summary) {
      return [];
    }

    const {
      totalUsers,
      activeUsers,
      totalPolls,
      newPolls,
      totalVotes,
      newVotes,
      engagementScore,
      trustScore,
    } = data.summary;

    return [
      {
        id: 'analytics-overview-total-users',
        icon: Users,
        title: t('analytics.overview.metrics.totalUsers.title'),
        value: formatNumber(totalUsers),
        subtitle: t('analytics.overview.metrics.totalUsers.subtitle', {
          active: formatNumber(activeUsers),
        }),
        srSummary: t('analytics.overview.metrics.totalUsers.sr', {
          total: formatNumber(totalUsers),
          active: formatNumber(activeUsers),
        }),
      },
      {
        id: 'analytics-overview-total-polls',
        icon: Activity,
        title: t('analytics.overview.metrics.totalPolls.title'),
        value: formatNumber(totalPolls),
        subtitle: t('analytics.overview.metrics.totalPolls.subtitle', {
          newPolls: formatNumber(newPolls),
        }),
        srSummary: t('analytics.overview.metrics.totalPolls.sr', {
          total: formatNumber(totalPolls),
          newPolls: formatNumber(newPolls),
        }),
      },
      {
        id: 'analytics-overview-total-votes',
        icon: TrendingUp,
        title: t('analytics.overview.metrics.totalVotes.title'),
        value: formatNumber(totalVotes),
        subtitle: t('analytics.overview.metrics.totalVotes.subtitle', {
          newVotes: formatNumber(newVotes),
        }),
        srSummary: t('analytics.overview.metrics.totalVotes.sr', {
          total: formatNumber(totalVotes),
          newVotes: formatNumber(newVotes),
        }),
      },
      {
        id: 'analytics-overview-engagement',
        icon: HeartPulse,
        title: t('analytics.overview.metrics.engagement.title'),
        value: formatPercent(engagementScore),
        subtitle: t('analytics.overview.metrics.engagement.subtitle', {
          trustScore: formatPercent(trustScore),
        }),
        srSummary: t('analytics.overview.metrics.engagement.sr', {
          engagement: formatPercent(engagementScore),
          trustScore: formatPercent(trustScore),
        }),
      },
    ];
  }, [data, formatNumber, formatPercent, t]);

  const describedBy = useMemo(() => {
    const ids = [tabDescriptionId];
    if (overviewSummary) {
      ids.push(summaryRegionId);
    }
    return ids.join(' ');
  }, [overviewSummary, summaryRegionId, tabDescriptionId]);

  const ariaDescribedBy = describedBy || undefined;

  useEffect(() => {
    if (!lastUpdated) {
      return;
    }

    const formattedTime = formatTime(lastUpdated);
    if (!formattedTime) {
      return;
    }

    const message = t('analytics.live.refreshed', { time: formattedTime });
    setStatusMessage(message);

    if (isInitialUpdate.current) {
      isInitialUpdate.current = false;
      return;
    }

    ScreenReaderSupport.announce(message, 'polite');
  }, [formatTime, lastUpdated, t]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    const refreshingMessage = t('analytics.live.refreshing');
    setStatusMessage(refreshingMessage);
    ScreenReaderSupport.announce(refreshingMessage, 'polite');

    try {
      await refresh();
    } catch (error) {
      const errorMessage = t('analytics.status.errorLabel');
      setStatusMessage(errorMessage);
      ScreenReaderSupport.announce(errorMessage, 'assertive');
      logger.error('Failed to refresh analytics dashboard', { error });
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh, t]);

  useEffect(() => {
    if (!overviewSummary) {
      return;
    }

    if (overviewAnnouncementRef.current === overviewSummary) {
      return;
    }

    ScreenReaderSupport.announce(overviewSummary, 'polite');
    overviewAnnouncementRef.current = overviewSummary;
  }, [overviewSummary]);

  useEffect(() => {
    const description = tabDescriptions[activeTab];

    if (!description) {
      return;
    }

    const cacheKey = `${activeTab}:${description}`;
    if (tabAnnouncementRef.current === cacheKey) {
      return;
    }

    ScreenReaderSupport.announce(description, 'polite');
    tabAnnouncementRef.current = cacheKey;
  }, [activeTab, tabDescriptions]);

  useEffect(() => {
    if (!data) {
      return;
    }

    if (!regionRef.current) {
      return;
    }

    if (!hasAnnouncedTab.current) {
      hasAnnouncedTab.current = true;
      return;
    }

    ScreenReaderSupport.setFocus(regionRef.current, {
      preventScroll: true,
      announce: t('analytics.a11y.tabChanged', { tab: tabLabels[activeTab] }),
    });
  }, [activeTab, data, tabLabels, t]);

  // Block unauthorized users
  if (!skipAccessGuard && !hasAccess) {
    return <UnauthorizedAccess />;
  }

  if (loading && !data) {
    return (
      <section
        className={`flex items-center justify-center min-h-screen ${className}`}
        aria-labelledby={headingId}
        role="status"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <span className="ml-2 text-lg">{t('analytics.status.loading')}</span>
      </section>
    );
  }

  if (error) {
    return (
      <div
        className={`p-4 text-red-600 bg-red-100 border border-red-400 rounded-md ${className}`}
        role="alert"
        aria-live="assertive"
      >
        <AlertCircle className="inline-block mr-2" aria-hidden="true" />
        <span className="font-semibold">{t('analytics.status.errorLabel')}:</span>{' '}
        <span>{error}</span>
        <Button onClick={handleRefresh} className="ml-4">
          <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" /> {t('analytics.status.retry')}
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className={`p-4 text-gray-600 bg-gray-100 border border-gray-400 rounded-md ${className}`}
        role="status"
        aria-live="polite"
      >
        <Info className="inline-block mr-2" aria-hidden="true" />
        {t('analytics.status.noData')}
        <Button onClick={handleRefresh} className="ml-4">
          <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" /> {t('analytics.status.loadData')}
        </Button>
      </div>
    );
  }

  const enhancedInsights = data.enhancedInsights;
  const botDetection = enhancedInsights?.botDetectionResults ?? null;
  const trustTierDistribution = enhancedInsights?.trustTierDistribution;
  const platformMetricsSummary = enhancedInsights?.platformMetrics ?? [];

  return (
    <section
      ref={regionRef}
      id="main-content"
      aria-labelledby={headingId}
      aria-describedby={ariaDescribedBy}
      role="main"
      tabIndex={-1}
      className={`space-y-4 md:space-y-6 p-4 md:p-6 ${className}`}
    >
      <div aria-live="polite" role="status" className="sr-only">
        {statusMessage}
      </div>
      <p id={summaryRegionId} className="sr-only" aria-live="polite">
        {overviewSummary ?? ''}
      </p>
      <p id={tabDescriptionId} className="sr-only" aria-live="polite">
        {tabDescriptions[activeTab]}
      </p>
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex-1">
          <h1 id={headingId} className="text-2xl md:text-3xl font-bold">
            {t('analytics.heading.title')}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {isMobile ? (
              <>
                {t('analytics.heading.mobile')}
                {lastUpdated && (
                  <> {t('analytics.heading.lastUpdatedShort', { time: formatTime(lastUpdated) })}</>
                )}
              </>
            ) : (
              <>
                {t('analytics.heading.desktop')}
                {lastUpdated && (
                  <> {t('analytics.heading.lastUpdatedFull', { time: formatTime(lastUpdated) })}</>
                )}
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap md:flex-nowrap">
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="outline"
            size={isMobile ? 'sm' : 'default'}
            className="flex-1 md:flex-none"
          >
            {showDetails ? t('analytics.buttons.hideDetails') : t('analytics.buttons.showDetails')}
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            size={isMobile ? 'sm' : 'default'}
            className="flex-1 md:flex-none"
          >
            {loading || isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            )}
            {isRefreshing ? t('analytics.buttons.refreshing') : t('analytics.buttons.refresh')}
          </Button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="default" className="bg-green-100 text-green-800">
          <Shield className="h-3 w-3 mr-1" aria-hidden="true" />
          {t('analytics.badges.adminAccess')}
        </Badge>
        {enableNewSchema && (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <DatabaseIcon className="h-3 w-3 mr-1" aria-hidden="true" />
            {t('analytics.badges.newSchema')}
          </Badge>
        )}
        {enableRealTime && (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            <Zap className="h-3 w-3 mr-1" aria-hidden="true" />
            {t('analytics.badges.realTime')}
          </Badge>
        )}
        {data.enhancedInsights && (
          <Badge variant="default" className="bg-purple-100 text-purple-800">
            <BarChart3 className="h-3 w-3 mr-1" aria-hidden="true" />
            {t('analytics.badges.enhancedInsights')}
          </Badge>
        )}
      </div>

      {/* Tabbed Interface - Mobile Optimized */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as AnalyticsTab)}
        className="mt-4 md:mt-6"
      >
        <TabsList className={`grid w-full ${
          isMobile
            ? 'grid-cols-2 gap-1'
            : isTablet
              ? 'grid-cols-3'
              : 'grid-cols-6'
        }`}>
          <TabsTrigger value="overview" className={isMobile ? 'text-xs' : ''}>
            <Activity className="h-4 w-4 mr-1 md:mr-2" aria-hidden="true" />
            {isMobile ? t('analytics.tabs.overviewShort') : tabLabels.overview}
          </TabsTrigger>
          <TabsTrigger value="trends" className={isMobile ? 'text-xs' : ''}>
            <TrendingUp className="h-4 w-4 mr-1 md:mr-2" aria-hidden="true" />
            {tabLabels.trends}
          </TabsTrigger>
          <TabsTrigger value="heatmaps" className={isMobile ? 'text-xs' : ''}>
            <Flame className="h-4 w-4 mr-1 md:mr-2" aria-hidden="true" />
            {isMobile ? t('analytics.tabs.heatmapsShort') : tabLabels.heatmaps}
          </TabsTrigger>
          <TabsTrigger value="demographics" className={isMobile ? 'text-xs' : ''}>
            <Users className="h-4 w-4 mr-1 md:mr-2" aria-hidden="true" />
            {isMobile ? t('analytics.tabs.demographicsShort') : tabLabels.demographics}
          </TabsTrigger>
          <TabsTrigger value="temporal" className={isMobile ? 'text-xs' : ''}>
            <Clock className="h-4 w-4 mr-1 md:mr-2" aria-hidden="true" />
            {isMobile ? t('analytics.tabs.temporalShort') : tabLabels.temporal}
          </TabsTrigger>
          <TabsTrigger value="trust" className={isMobile ? 'text-xs' : ''}>
            <Shield className="h-4 w-4 mr-1 md:mr-2" aria-hidden="true" />
            {tabLabels.trust}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Existing Content */}
        <TabsContent value="overview" className="mt-6 space-y-6">

      {/* Core Metrics */}
      {overviewMetrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {overviewMetrics.map((metric) => {
            const Icon = metric.icon;
            const titleId = `${metric.id}-title`;
            const subtitleId = `${metric.id}-subtitle`;
            return (
              <Card
                key={metric.id}
                role="group"
                aria-labelledby={titleId}
                aria-describedby={subtitleId}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle id={titleId} className="text-sm font-medium">
                    {metric.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p id={subtitleId} className="text-xs text-muted-foreground">
                    {metric.subtitle}
                  </p>
                  <p className="sr-only">{metric.srSummary}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Enhanced Insights */}
      {enhancedInsights && (
        <Card role="region" aria-labelledby="enhanced-insights-heading" aria-describedby="enhanced-insights-description">
          <CardHeader>
            <CardTitle id="enhanced-insights-heading" className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('analytics.overviewSections.enhancedInsights.title')}
            </CardTitle>
            <CardDescription id="enhanced-insights-description">
              {t('analytics.overviewSections.enhancedInsights.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Bot Detection */}
              {botDetection ? (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Bot Detection
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Risk Score: {botDetection.riskScore}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Confidence: {botDetection.confidence}%
                  </p>
                </div>
              ) : null}

              {/* Trust Tier Distribution */}
              {trustTierDistribution ? (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Trust Tiers
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Analysis complete
                  </p>
                </div>
              ) : null}

              {/* Platform Metrics */}
              {platformMetricsSummary.length > 0 && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <DatabaseIcon className="h-4 w-4" />
                    Platform Metrics
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {platformMetricsSummary.length} data points
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Insights */}
      {data.sessionInsights && (
        <Card role="region" aria-labelledby="session-analytics-heading" aria-describedby="session-analytics-description">
          <CardHeader>
            <CardTitle id="session-analytics-heading" className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t('analytics.overviewSections.sessionAnalytics.title')}
            </CardTitle>
            <CardDescription id="session-analytics-description">
              {t('analytics.overviewSections.sessionAnalytics.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{data.sessionInsights.sessionMetrics.totalActions}</div>
                <p className="text-sm text-muted-foreground">Total Actions</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.floor(data.sessionInsights.sessionMetrics.sessionDuration / 60)}m</div>
                <p className="text-sm text-muted-foreground">Session Duration</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{data.sessionInsights.sessionMetrics.deviceType}</div>
                <p className="text-sm text-muted-foreground">Device Type</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{data.sessionInsights.sessionMetrics.pageViews}</div>
                <p className="text-sm text-muted-foreground">Page Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health */}
      {systemHealth.length > 0 && (
        <Card role="region" aria-labelledby="system-health-heading" aria-describedby="system-health-description">
          <CardHeader>
            <CardTitle id="system-health-heading" className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5" />
              {t('analytics.overviewSections.systemHealth.title')}
            </CardTitle>
            <CardDescription id="system-health-description">
              {t('analytics.overviewSections.systemHealth.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {systemHealth.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{check.service_name}</span>
                    <Badge
                    variant={check.health_status === 'ok' ? 'default' : check.health_status === 'warning' ? 'secondary' : 'destructive'}
                    className={
                      check.health_status === 'ok' ? 'bg-green-100 text-green-800' :
                      check.health_status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }
                  >
                    {check.health_status === 'ok' ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                    {check.health_status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Site Messages */}
      {siteMessages.length > 0 && (
        <Card role="region" aria-labelledby="site-messages-heading" aria-describedby="site-messages-description">
          <CardHeader>
            <CardTitle id="site-messages-heading" className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('analytics.overviewSections.siteMessages.title')}
            </CardTitle>
            <CardDescription id="site-messages-description">
              {t('analytics.overviewSections.siteMessages.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {siteMessages.map((message, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{message.title}</h4>
                    <Badge variant="outline">{message.priority ?? 'standard'}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{message.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed View */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Analytics Data</CardTitle>
            <CardDescription>
              Raw analytics data for debugging and analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="mt-6">
          <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
            <TrendsChart />
          </Suspense>
        </TabsContent>

        {/* Heatmaps Tab */}
        <TabsContent value="heatmaps" className="mt-6 space-y-6">
          <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DistrictHeatmap />
              <PollHeatmap />
            </div>
          </Suspense>
        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="mt-6">
          <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
            <DemographicsChart />
          </Suspense>
        </TabsContent>

        {/* Temporal Tab */}
        <TabsContent value="temporal" className="mt-6">
          <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
            <TemporalAnalysisChart />
          </Suspense>
        </TabsContent>

        {/* Trust Tiers Tab */}
        <TabsContent value="trust" className="mt-6">
          <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
            <TrustTierComparisonChart />
          </Suspense>
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default EnhancedAnalyticsDashboard;


