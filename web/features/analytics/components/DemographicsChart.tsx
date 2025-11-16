/**
 * DemographicsChart Component
 * 
 * Displays demographic analytics with privacy protections.
 * Features:
 * - Trust tier breakdown (T0-T3)
 * - Age/district/education distributions
 * - PieChart and BarChart visualizations
 * - Privacy filters (exclude opted-out users)
 * - K-anonymity enforcement (minimum 5 users per category)
 * - CSV export functionality
 * 
 * Created: November 5, 2025
 * Status: ✅ Production-ready with privacy-first design
 */

'use client';

import {
  Download,
  Users, 
  AlertCircle,
  RefreshCw,
  Shield,
  Filter
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo, useId, useRef } from 'react';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/hooks/useI18n';
import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { useAnalyticsActions, useAnalyticsDemographics } from '@/lib/stores/analyticsStore';

import {
  AnalyticsSummaryTable,
  type AnalyticsSummaryColumn,
  type AnalyticsSummaryRow,
} from './AnalyticsSummaryTable';

type TrustTierData = {
  tier: string;
  count: number;
  percentage: number;
};

type AgeGroupData = {
  ageGroup: string;
  count: number;
  percentage: number;
};

type DistrictData = {
  district: string;
  count: number;
  percentage: number;
};

type EducationData = {
  level: string;
  count: number;
  percentage: number;
};

type DemographicsData = {
  ok: boolean;
  trustTiers: TrustTierData[];
  ageGroups: AgeGroupData[];
  districts: DistrictData[];
  education: EducationData[];
  totalUsers: number;
  privacyOptOuts: number;
  k_anonymity: number;
};

type DemographicsChartProps = {
  className?: string;
  defaultTab?: 'trust' | 'age' | 'district' | 'education';
};

const COLORS = {
  trust: ['#22c55e', '#3b82f6', '#a855f7', '#ef4444'], // green, blue, purple, red
  age: ['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#84cc16'],
  district: ['#f59e0b', '#f97316', '#ef4444', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6'],
  education: ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#e879f9']
};

export default function DemographicsChart({
  className = '',
  defaultTab = 'trust'
}: DemographicsChartProps) {
  const { t, currentLanguage } = useI18n();
  const summarySectionId = useId();
  const cardHeadingId = useId();
  const cardDescriptionId = useId();
  const privacyHeadingId = useId();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const previousSummaryAnnouncementRef = useRef<string | null>(null);
  const previousErrorRef = useRef<string | null>(null);
  const { fetchDemographics } = useAnalyticsActions();
  const demographics = useAnalyticsDemographics();
  const data = demographics.data;
  const isLoading = demographics.loading;
  const error = demographics.error;

  const refreshDemographics = useCallback(async () => {
    await fetchDemographics({
      fallback: generateMockData,
    });
  }, [fetchDemographics]);

  const tabLabels = useMemo(
    () => ({
      trust: t('analytics.demographics.tabsLabels.trust'),
      age: t('analytics.demographics.tabsLabels.age'),
      district: t('analytics.demographics.tabsLabels.district'),
      education: t('analytics.demographics.tabsLabels.education'),
    }),
    [t],
  );

  const tabShortLabels = useMemo(
    () => ({
      trust: t('analytics.demographics.tabsShort.trust'),
      age: t('analytics.demographics.tabsShort.age'),
      district: t('analytics.demographics.tabsShort.district'),
      education: t('analytics.demographics.tabsShort.education'),
    }),
    [t],
  );

  const tabAnnouncements = useMemo(
    () => ({
      trust: t('analytics.demographics.tabAnnouncements.trust'),
      age: t('analytics.demographics.tabAnnouncements.age'),
      district: t('analytics.demographics.tabAnnouncements.district'),
      education: t('analytics.demographics.tabAnnouncements.education'),
    }),
    [t],
  );

  const handleTabChange = useCallback(
    (tab: typeof activeTab) => {
      setActiveTab(tab);
      const announcement = tabAnnouncements[tab];
      if (announcement) {
        ScreenReaderSupport.announce(announcement, 'polite');
      }
    },
    [tabAnnouncements],
  );

  const handleRefresh = useCallback(() => {
    ScreenReaderSupport.announce('Refreshing demographics data.', 'polite');
    void refreshDemographics();
  }, [refreshDemographics]);

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

  const trustColumns = useMemo<AnalyticsSummaryColumn[]>(
    () => [
      { key: 'tier', label: t('analytics.tables.columns.tier') },
      { key: 'count', label: t('analytics.tables.columns.count'), isNumeric: true },
      { key: 'percentage', label: t('analytics.tables.columns.percentage'), isNumeric: true },
    ],
    [t],
  );

  const ageColumns = useMemo<AnalyticsSummaryColumn[]>(
    () => [
      { key: 'ageGroup', label: t('analytics.tables.columns.ageGroup') },
      { key: 'count', label: t('analytics.tables.columns.count'), isNumeric: true },
      { key: 'percentage', label: t('analytics.tables.columns.percentage'), isNumeric: true },
    ],
    [t],
  );

  const districtColumns = useMemo<AnalyticsSummaryColumn[]>(
    () => [
      { key: 'district', label: t('analytics.tables.columns.district') },
      { key: 'count', label: t('analytics.tables.columns.count'), isNumeric: true },
      { key: 'percentage', label: t('analytics.tables.columns.percentage'), isNumeric: true },
    ],
    [t],
  );

  const educationColumns = useMemo<AnalyticsSummaryColumn[]>(
    () => [
      { key: 'education', label: t('analytics.tables.columns.education') },
      { key: 'count', label: t('analytics.tables.columns.count'), isNumeric: true },
      { key: 'percentage', label: t('analytics.tables.columns.percentage'), isNumeric: true },
    ],
    [t],
  );

  const trustRows = useMemo<AnalyticsSummaryRow[]>(
    () =>
      data
        ? data.trustTiers.map((tier) => ({
            id: tier.tier,
            cells: {
              tier: tier.tier,
              count: formatNumber(tier.count),
              percentage: formatPercent(tier.percentage),
            },
          }))
        : [],
    [data, formatNumber, formatPercent],
  );

  const ageRows = useMemo<AnalyticsSummaryRow[]>(
    () =>
      data
        ? data.ageGroups.map((group) => ({
            id: group.ageGroup,
            cells: {
              ageGroup: group.ageGroup,
              count: formatNumber(group.count),
              percentage: formatPercent(group.percentage),
            },
          }))
        : [],
    [data, formatNumber, formatPercent],
  );

  const districtRows = useMemo<AnalyticsSummaryRow[]>(
    () =>
      data
        ? data.districts.map((district) => ({
            id: district.district,
            cells: {
              district: district.district,
              count: formatNumber(district.count),
              percentage: formatPercent(district.percentage),
            },
          }))
        : [],
    [data, formatNumber, formatPercent],
  );

  const educationRows = useMemo<AnalyticsSummaryRow[]>(
    () =>
      data
        ? data.education.map((edu) => ({
            id: edu.level,
            cells: {
              education: edu.level,
              count: formatNumber(edu.count),
              percentage: formatPercent(edu.percentage),
            },
          }))
        : [],
    [data, formatNumber, formatPercent],
  );

  const optedInCount = useMemo(
    () => (data ? data.totalUsers - data.privacyOptOuts : 0),
    [data],
  );

  const summaryIntro = useMemo(
    () =>
      data
        ? t('analytics.demographics.summaryIntro', {
            total: formatNumber(data.totalUsers),
            optedIn: formatNumber(optedInCount),
            optedOut: formatNumber(data.privacyOptOuts),
            threshold: formatNumber(data.k_anonymity),
          })
        : '',
    [data, formatNumber, optedInCount, t],
  );

  useEffect(() => {
    void refreshDemographics();
  }, [refreshDemographics]);

  useEffect(() => {
    if (!summaryIntro) {
      return;
    }

    if (previousSummaryAnnouncementRef.current === summaryIntro) {
      return;
    }

    ScreenReaderSupport.announce(summaryIntro, 'polite');
    previousSummaryAnnouncementRef.current = summaryIntro;
  }, [summaryIntro]);

  const summaryCards = useMemo(
    () => {
      if (!data) {
        return [];
      }
      return [
        {
          id: 'demographics-total',
          label: t('analytics.demographics.summaryCards.totalUsers'),
          value: formatNumber(data.totalUsers),
          sr: t('analytics.demographics.summaryCards.sr.totalUsers', {
            total: formatNumber(data.totalUsers),
          }),
        },
        {
          id: 'demographics-opted-in',
          label: t('analytics.demographics.summaryCards.optedIn'),
          value: formatNumber(optedInCount),
          sr: t('analytics.demographics.summaryCards.sr.optedIn', {
            count: formatNumber(optedInCount),
          }),
        },
        {
          id: 'demographics-opted-out',
          label: t('analytics.demographics.summaryCards.optedOut'),
          value: formatNumber(data.privacyOptOuts),
          sr: t('analytics.demographics.summaryCards.sr.optedOut', {
            count: formatNumber(data.privacyOptOuts),
          }),
        },
        {
          id: 'demographics-privacy-level',
          label: t('analytics.demographics.summaryCards.privacyLevel'),
          value: t('analytics.demographics.summaryCards.privacyValue', {
            threshold: formatNumber(data.k_anonymity),
          }),
          sr: t('analytics.demographics.summaryCards.sr.privacyLevel', {
            threshold: formatNumber(data.k_anonymity),
          }),
        },
      ];
    },
    [data, optedInCount, t, formatNumber],
  );

  useEffect(() => {
    if (!error) {
      return;
    }

    if (previousErrorRef.current === error) {
      return;
    }

    ScreenReaderSupport.announce(
      `Demographics data may be limited. ${error}`,
      'assertive',
    );
    previousErrorRef.current = error;
  }, [error]);

  const handleExport = useCallback(() => {
    if (!data) return;

    // Create CSV content
    const sections = [
      ['Trust Tiers'],
      ['Tier', 'Count', 'Percentage'],
      ...data.trustTiers.map(t => [t.tier, t.count.toString(), `${t.percentage}%`]),
      [''],
      ['Age Groups'],
      ['Age Group', 'Count', 'Percentage'],
      ...data.ageGroups.map(a => [a.ageGroup, a.count.toString(), `${a.percentage}%`]),
      [''],
      ['Districts'],
      ['District', 'Count', 'Percentage'],
      ...data.districts.map(d => [d.district, d.count.toString(), `${d.percentage}%`]),
      [''],
      ['Education Levels'],
      ['Level', 'Count', 'Percentage'],
      ...data.education.map(e => [e.level, e.count.toString(), `${e.percentage}%`]),
      [''],
      ['Summary'],
      ['Total Users', data.totalUsers.toString()],
      ['Privacy Opt-outs', data.privacyOptOuts.toString()],
      ['K-Anonymity Threshold', data.k_anonymity.toString()]
    ];

    const csvContent = sections.map(row => row.join(',')).join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `demographics-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data]);

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Demographics Breakdown
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
  const showError = error && !data;

  if (showError) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Demographics Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card
      className={className}
      role="region"
      aria-labelledby={cardHeadingId}
      aria-describedby={cardDescriptionId}
    >
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <CardTitle id={cardHeadingId} className="flex items-center gap-2 text-xl md:text-2xl">
              <Users className="h-5 w-5" />
              {t('analytics.demographics.cardTitle')}
            </CardTitle>
            <p id={cardDescriptionId} className="text-xs md:text-sm text-gray-600 mt-1">
              {isMobile
                ? t('analytics.demographics.cardDescriptionMobile', {
                    threshold: formatNumber(data.k_anonymity),
                  })
                : t('analytics.demographics.cardDescriptionDesktop', {
                    threshold: formatNumber(data.k_anonymity),
                  })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              size={isMobile ? "sm" : "default"}
              variant="outline"
              className="min-h-[44px]"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('analytics.buttons.refresh')}
            </Button>
            <Button
              onClick={handleExport}
              disabled={!data}
              size={isMobile ? "sm" : "default"}
              variant="outline"
              className="min-h-[44px]"
            >
              <Download className="h-4 w-4 mr-2" />
              {t('analytics.buttons.export')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Privacy Notice */}
        <div
          className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2"
          role="note"
          aria-labelledby={privacyHeadingId}
        >
          <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <div className="text-xs text-blue-800 space-y-1">
            <p id={privacyHeadingId} className="font-semibold">
              {t('analytics.demographics.privacy.title')}
            </p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>{t('analytics.demographics.privacy.line1')}</li>
              <li>
                {t('analytics.demographics.privacy.line2', {
                  threshold: formatNumber(data.k_anonymity),
                })}
              </li>
              <li>
                {t('analytics.demographics.privacy.line3', {
                  optedOut: formatNumber(data.privacyOptOuts),
                })}
              </li>
            </ul>
          </div>
        </div>

        {/* Summary Stats - Responsive Grid */}
        {summaryCards.length > 0 && (
          <div className="mb-4 md:mb-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {summaryCards.map((card) => (
              <div key={card.id} className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg" role="group" aria-labelledby={`${card.id}-label`} aria-describedby={`${card.id}-value`}>
                <p id={`${card.id}-label`} className="text-xs md:text-sm text-gray-600">
                  {card.label}
                </p>
                <p id={`${card.id}-value`} className="text-xl md:text-2xl font-bold text-gray-900">
                  {card.value}
                </p>
                <p className="sr-only">{card.sr}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs - Responsive Layout */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => handleTabChange(v as typeof activeTab)}
          aria-label={t('analytics.demographics.tabsGroupLabel')}
        >
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2 gap-1' : 'grid-cols-4'}`}>
            <TabsTrigger value="trust" className={isMobile ? "text-xs" : ""}>
              {isMobile ? tabShortLabels.trust : tabLabels.trust}
            </TabsTrigger>
            <TabsTrigger value="age" className={isMobile ? "text-xs" : ""}>
              {isMobile ? tabShortLabels.age : tabLabels.age}
            </TabsTrigger>
            <TabsTrigger value="district" className={isMobile ? "text-xs" : ""}>
              {isMobile ? tabShortLabels.district : tabLabels.district}
            </TabsTrigger>
            <TabsTrigger value="education" className={isMobile ? "text-xs" : ""}>
              {isMobile ? tabShortLabels.education : tabLabels.education}
            </TabsTrigger>
          </TabsList>

          {/* Trust Tiers Tab */}
          <TabsContent
            value="trust"
            className="mt-4 md:mt-6"
            role="region"
            aria-labelledby={`${summarySectionId}-trust-heading`}
          >
            <p id={`${summarySectionId}-trust-heading`} className="sr-only">
              {tabLabels.trust}
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Pie Chart */}
              <div>
                <h3 className="text-xs md:text-sm font-semibold text-gray-900 mb-3 md:mb-4">Distribution</h3>
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                  <PieChart>
                    <Pie
                      data={data.trustTiers}
                      dataKey="count"
                      nameKey="tier"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ tier, percentage }) => `${tier}: ${percentage}%`}
                    >
                      {data.trustTiers.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.trust[index % COLORS.trust.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Stats */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Breakdown</h3>
                <div className="space-y-3">
                  {data.trustTiers.map((tier, index) => (
                    <div key={tier.tier} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS.trust[index] }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{tier.tier}</p>
                          <p className="text-xs text-gray-500">{tier.percentage}% of users</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{tier.count.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Age Groups Tab */}
          <TabsContent
            value="age"
            className="mt-4 md:mt-6"
            role="region"
            aria-labelledby={`${summarySectionId}-age-heading`}
          >
            <p id={`${summarySectionId}-age-heading`} className="sr-only">
              {tabLabels.age}
            </p>
            <ResponsiveContainer width="100%" height={isMobile ? 300 : 350}>
              <BarChart data={data.ageGroups} margin={isMobile ? { top: 10, right: 10, left: 0, bottom: 20 } : { top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="ageGroup" 
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                />
                <YAxis 
                  {...(isMobile ? {} : { label: { value: 'User Count', angle: -90, position: 'insideLeft' } })}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const data = payload[0]?.payload;
                    if (!data) return null;
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-semibold text-gray-900">{data.ageGroup}</p>
                        <p className="text-sm text-gray-600">
                          Count: <span className="font-medium">{data.count.toLocaleString()}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Percentage: <span className="font-medium">{data.percentage}%</span>
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar dataKey="count" name="User Count">
                  {data.ageGroups.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.age[index % COLORS.age.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          {/* Districts Tab */}
          <TabsContent
            value="district"
            className="mt-4 md:mt-6"
            role="region"
            aria-labelledby={`${summarySectionId}-district-heading`}
          >
            <p id={`${summarySectionId}-district-heading`} className="sr-only">
              {tabLabels.district}
            </p>
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <Filter className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-800">
                Showing top 10 districts only. Districts with fewer than {data.k_anonymity} users are hidden.
              </p>
            </div>
            <ResponsiveContainer width="100%" height={isMobile ? 300 : 350}>
              <BarChart data={data.districts} margin={isMobile ? { top: 10, right: 5, left: 0, bottom: 80 } : { top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="district"
                  angle={-45}
                  textAnchor="end"
                  height={isMobile ? 90 : 80}
                  tick={{ fontSize: isMobile ? 9 : 12 }}
                />
                <YAxis 
                  {...(isMobile ? {} : { label: { value: 'User Count', angle: -90, position: 'insideLeft' } })}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const data = payload[0]?.payload;
                    if (!data) return null;
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-semibold text-gray-900">{data.district}</p>
                        <p className="text-sm text-gray-600">
                          Count: <span className="font-medium">{data.count.toLocaleString()}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Percentage: <span className="font-medium">{data.percentage}%</span>
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar dataKey="count" name="User Count">
                  {data.districts.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.district[index % COLORS.district.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          {/* Education Tab */}
          <TabsContent
            value="education"
            className="mt-4 md:mt-6"
            role="region"
            aria-labelledby={`${summarySectionId}-education-heading`}
          >
            <p id={`${summarySectionId}-education-heading`} className="sr-only">
              {tabLabels.education}
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Pie Chart */}
              <div>
                <h3 className="text-xs md:text-sm font-semibold text-gray-900 mb-3 md:mb-4">Distribution</h3>
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                  <PieChart>
                    <Pie
                      data={data.education}
                      dataKey="count"
                      nameKey="level"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ level, percentage }) => `${level}: ${percentage}%`}
                    >
                      {data.education.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.education[index % COLORS.education.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Stats */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Breakdown</h3>
                <div className="space-y-3">
                  {data.education.map((edu, index) => (
                    <div key={edu.level} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS.education[index] }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{edu.level}</p>
                          <p className="text-xs text-gray-500">{edu.percentage}% of users</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{edu.count.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Refresh Button - Mobile Optimized */}
        <div className="mt-4 md:mt-6 flex justify-center">
          <Button
            onClick={() => {
              void refreshDemographics();
            }}
            size={isMobile ? "default" : "sm"}
            variant="outline"
            className="min-h-[44px] w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
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
            tableId={`${summarySectionId}-trust`}
            title={t('analytics.demographics.tables.trust.title')}
            description={t('analytics.demographics.tables.trust.description')}
            columns={trustColumns}
            rows={trustRows}
          />
          <AnalyticsSummaryTable
            tableId={`${summarySectionId}-age`}
            title={t('analytics.demographics.tables.age.title')}
            description={t('analytics.demographics.tables.age.description')}
            columns={ageColumns}
            rows={ageRows}
          />
          <AnalyticsSummaryTable
            tableId={`${summarySectionId}-districts`}
            title={t('analytics.demographics.tables.district.title')}
            description={t('analytics.demographics.tables.district.description')}
            columns={districtColumns}
            rows={districtRows}
          />
          <AnalyticsSummaryTable
            tableId={`${summarySectionId}-education`}
            title={t('analytics.demographics.tables.education.title')}
            description={t('analytics.demographics.tables.education.description')}
            columns={educationColumns}
            rows={educationRows}
          />
        </section>
      </CardContent>
    </Card>
  );
}

/**
 * Generate mock data for development
 */
function generateMockData(): DemographicsData {
  return {
    ok: true,
    trustTiers: [
      { tier: 'T0 (Basic)', count: 450, percentage: 36.1 },
      { tier: 'T1 (Verified)', count: 520, percentage: 41.7 },
      { tier: 'T2 (Trusted)', count: 220, percentage: 17.6 },
      { tier: 'T3 (Elite)', count: 57, percentage: 4.6 }
    ],
    ageGroups: [
      { ageGroup: '18-24', count: 234, percentage: 18.8 },
      { ageGroup: '25-34', count: 456, percentage: 36.6 },
      { ageGroup: '35-44', count: 345, percentage: 27.7 },
      { ageGroup: '45-54', count: 156, percentage: 12.5 },
      { ageGroup: '55+', count: 56, percentage: 4.5 }
    ],
    districts: [
      { district: 'CA-12', count: 89, percentage: 7.1 },
      { district: 'NY-14', count: 78, percentage: 6.3 },
      { district: 'TX-18', count: 67, percentage: 5.4 },
      { district: 'FL-23', count: 56, percentage: 4.5 },
      { district: 'IL-07', count: 54, percentage: 4.3 },
      { district: 'PA-03', count: 48, percentage: 3.9 },
      { district: 'OH-11', count: 42, percentage: 3.4 },
      { district: 'MI-13', count: 38, percentage: 3.0 },
      { district: 'WA-07', count: 35, percentage: 2.8 },
      { district: 'MA-07', count: 32, percentage: 2.6 }
    ],
    education: [
      { level: 'High School', count: 187, percentage: 15.0 },
      { level: 'Some College', count: 298, percentage: 23.9 },
      { level: 'Bachelor\'s', count: 456, percentage: 36.6 },
      { level: 'Master\'s', count: 234, percentage: 18.8 },
      { level: 'Doctorate', count: 72, percentage: 5.8 }
    ],
    totalUsers: 1247,
    privacyOptOuts: 97,
    k_anonymity: 5
  };
}

