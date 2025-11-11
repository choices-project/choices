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
import React, { useState, useEffect, useCallback } from 'react';
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
import { useAnalyticsActions, useAnalyticsTrustTiers } from '@/lib/stores/analyticsStore';

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
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { fetchTrustTierComparison } = useAnalyticsActions();
  const trustTiers = useAnalyticsTrustTiers();
  const data = trustTiers.data;
  const isLoading = trustTiers.loading;
  const error = trustTiers.error;

  const loadTrustTiers = useCallback(async () => {
    await fetchTrustTierComparison({
      fallback: generateMockData,
    });
  }, [fetchTrustTierComparison]);

  useEffect(() => {
    void fetchTrustTierComparison({
      fallback: generateMockData,
    });
  }, [fetchTrustTierComparison]);

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
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Trust Tier Comparison
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

  // Error state
  const showError = error && data;

  if (!data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Trust Tier Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error ?? 'No data available'}</span>
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
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Trust Tier Comparison
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Compare behavior and engagement across trust tiers (T0-T3)
            </p>
          </div>
          <Button
            onClick={handleExport}
            size="sm"
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
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
        <div className="mb-6 grid grid-cols-4 gap-4">
          {data.tiers.map((tier) => (
            <div 
              key={tier.tier}
              className="text-center p-4 rounded-lg"
              style={{ 
                background: `linear-gradient(135deg, ${TIER_COLORS[tier.tier as keyof typeof TIER_COLORS]}15, ${TIER_COLORS[tier.tier as keyof typeof TIER_COLORS]}30)` 
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Badge 
                  className="text-white"
                  style={{ backgroundColor: TIER_COLORS[tier.tier as keyof typeof TIER_COLORS] }}
                >
                  {tier.tier}
                </Badge>
              </div>
              <p className="text-2xl font-bold" style={{ color: TIER_COLORS[tier.tier as keyof typeof TIER_COLORS] }}>
                {tier.userCount}
              </p>
              <p className="text-xs text-gray-600">{tier.tierName} users</p>
            </div>
          ))}
        </div>

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
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="participation">Participation</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="radar">Overview</TabsTrigger>
          </TabsList>

          {/* Participation Tab */}
          <TabsContent value="participation" className="mt-6">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Participation & Completion Rates</h3>
              <p className="text-xs text-gray-600">
                Higher tiers typically show better participation and completion rates
              </p>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.tiers} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tier" />
                  <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
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
                              Participation: <span className="font-medium">{tier.participationRate}%</span>
                            </p>
                            <p className="text-sm text-green-600">
                              Completion: <span className="font-medium">{tier.completionRate}%</span>
                            </p>
                            <p className="text-sm text-gray-600">
                              Users: <span className="font-medium">{tier.userCount}</span>
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
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Detailed Metrics</h3>
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
                        <p className="text-xs text-gray-500">{tier.userCount} users</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {tier.participationRate}% / {tier.completionRate}%
                      </p>
                      <p className="text-xs text-gray-500">Participation / Completion</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="mt-6">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Engagement & Bot Detection</h3>
              <p className="text-xs text-gray-600">
                Average engagement scores and bot likelihood indicators
              </p>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.tiers} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tier" />
                  <YAxis label={{ value: 'Score', angle: -90, position: 'insideLeft' }} />
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
                              Engagement: <span className="font-medium">{tier.avgEngagement}/100</span>
                            </p>
                            <p className="text-sm text-red-600">
                              Bot Risk: <span className="font-medium">{tier.botLikelihood}%</span>
                            </p>
                            <p className="text-sm text-gray-600">
                              Polls Voted: <span className="font-medium">{tier.avgPollsVoted}</span>
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
          <TabsContent value="radar" className="mt-6">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Multi-Metric Overview</h3>
              <p className="text-xs text-gray-600">
                Comparative view across all key metrics
              </p>
            </div>

            <div className="h-96">
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
                    <th className="text-left p-2 font-semibold text-gray-900">Tier</th>
                    <th className="text-right p-2 font-semibold text-gray-900">Users</th>
                    <th className="text-right p-2 font-semibold text-gray-900">Participation</th>
                    <th className="text-right p-2 font-semibold text-gray-900">Engagement</th>
                    <th className="text-right p-2 font-semibold text-gray-900">Bot Risk</th>
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
                      <td className="text-right p-2 text-gray-900">{tier.userCount}</td>
                      <td className="text-right p-2 text-gray-900">{tier.participationRate}%</td>
                      <td className="text-right p-2 text-gray-900">{tier.avgEngagement}/100</td>
                      <td className="text-right p-2">
                        <span className={tier.botLikelihood > 50 ? 'text-red-600 font-medium' : 'text-green-600'}>
                          {tier.botLikelihood}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Refresh Button */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={() => {
              void loadTrustTiers();
            }}
            size="sm"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
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

