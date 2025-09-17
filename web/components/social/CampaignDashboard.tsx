'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Eye, 
  Share2, 
  MessageCircle,
  BarChart3,
  Target,
  AlertCircle,
  CheckCircle,
  Heart
} from 'lucide-react';
import type { CampaignDashboardData } from '@/lib/social/candidate-tools';

type CampaignDashboardProps = {
  candidateId: string;
  onRefresh?: () => void;
  className?: string;
}

export default function CampaignDashboard({ 
  candidateId, 
  onRefresh,
  className = '' 
}: CampaignDashboardProps) {
  const [dashboardData, setDashboardData] = useState<CampaignDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [candidateId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data - replace with actual API call
      const mockData: CampaignDashboardData = {
        candidateId,
        currentRank: 2,
        totalCandidates: 5,
        trendDirection: 'up',
        trendPercentage: 15,
        topInterests: [
          { name: 'environment', alignment: 85, userCount: 150, trend: 'up' },
          { name: 'education', alignment: 78, userCount: 120, trend: 'stable' },
          { name: 'healthcare', alignment: 72, userCount: 95, trend: 'up' }
        ],
        profileViews: 1250,
        policyClicks: 340,
        socialShares: 89,
        topSupportReasons: [
          'Strong environmental policies',
          'Experience in local government',
          'Transparent campaign finance',
          'Focus on education reform'
        ],
        commonConcerns: [
          'Limited national experience',
          'Unclear stance on healthcare',
          'Need more detailed policy plans'
        ],
        engagementMetrics: {
          totalEngagements: 1250,
          engagementRate: 0.78,
          averageEngagementScore: 0.82,
          topEngagementTypes: [
            { type: 'profile_view', count: 500, percentage: 40 },
            { type: 'policy_click', count: 300, percentage: 24 },
            { type: 'social_share', count: 200, percentage: 16 },
            { type: 'discussion', count: 150, percentage: 12 },
            { type: 'vote', count: 100, percentage: 8 }
          ],
          engagementTrend: 'up'
        },
        demographicBreakdown: {
          ageGroups: { '18-24': 15, '25-34': 35, '35-49': 30, '50-64': 15, '65+': 5 },
          education: { 'high-school': 20, 'college': 45, 'graduate': 35 },
          politicalAffiliation: { 'democratic': 40, 'republican': 25, 'independent': 35 },
          incomeBrackets: { 'low': 20, 'middle': 50, 'high': 30 }
        },
        geographicBreakdown: {
          regions: { 'north': 40, 'south': 30, 'east': 20, 'west': 10 },
          cities: { 'San Francisco': 25, 'Oakland': 15, 'Berkeley': 10 },
          counties: { 'San Francisco': 30, 'Alameda': 25, 'Contra Costa': 15 }
        },
        lastUpdated: new Date()
      };
      
      setDashboardData(mockData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return 'text-green-600 bg-green-100';
      case 'down':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatEngagementType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Dashboard Data</h3>
        <p className="text-gray-600">Dashboard data is not available for this candidate.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaign Dashboard</h1>
          <p className="text-gray-600">
            Last updated: {dashboardData.lastUpdated.toLocaleString()}
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Data
          </button>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Ranking */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Current Ranking</h3>
            <Target className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              #{dashboardData.currentRank}
            </div>
            <div className="text-sm text-gray-600">
              out of {dashboardData.totalCandidates} candidates
            </div>
            <div className={`flex items-center justify-center space-x-1 mt-2 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(dashboardData.trendDirection)}`}>
              {getTrendIcon(dashboardData.trendDirection)}
              <span>{dashboardData.trendPercentage}% change</span>
            </div>
          </div>
        </div>

        {/* Support Trend */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Support Trend</h3>
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold mb-1 ${
              dashboardData.trendDirection === 'up' ? 'text-green-600' :
              dashboardData.trendDirection === 'down' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {dashboardData.trendDirection === 'up' ? '+' : dashboardData.trendDirection === 'down' ? '-' : ''}{dashboardData.trendPercentage}%
            </div>
            <div className="text-sm text-gray-600 capitalize">
              {dashboardData.trendDirection} trending
            </div>
          </div>
        </div>

        {/* Engagement Rate */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Engagement Rate</h3>
            <Heart className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {Math.round(dashboardData.engagementMetrics.engagementRate * 100)}%
            </div>
            <div className="text-sm text-gray-600">
              {dashboardData.engagementMetrics.totalEngagements.toLocaleString()} total engagements
            </div>
          </div>
        </div>
      </div>

      {/* Interest Alignment */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Interest Alignment</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dashboardData.topInterests.map((interest, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">#{interest.name}</span>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  interest.trend === 'up' ? 'bg-green-100 text-green-700' :
                  interest.trend === 'down' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {interest.trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
                   interest.trend === 'down' ? <TrendingDown className="w-3 h-3" /> :
                   <Minus className="w-3 h-3" />}
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {interest.alignment}%
              </div>
              <div className="text-sm text-gray-600">
                {interest.userCount} people
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Breakdown</h3>
        <div className="space-y-3">
          {dashboardData.engagementMetrics.topEngagementTypes.map((engagement, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  {engagement.type === 'profile_view' && <Eye className="w-4 h-4 text-blue-600" />}
                  {engagement.type === 'policy_click' && <Target className="w-4 h-4 text-blue-600" />}
                  {engagement.type === 'social_share' && <Share2 className="w-4 h-4 text-blue-600" />}
                  {engagement.type === 'discussion' && <MessageCircle className="w-4 h-4 text-blue-600" />}
                  {engagement.type === 'vote' && <CheckCircle className="w-4 h-4 text-blue-600" />}
                </div>
                <span className="font-medium text-gray-900">
                  {formatEngagementType(engagement.type)}
                </span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {engagement.count.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">
                  {engagement.percentage}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Support Reasons */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Support Reasons</h3>
          <div className="space-y-2">
            {dashboardData.topSupportReasons.map((reason, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-green-50 rounded">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Common Concerns */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Concerns</h3>
          <div className="space-y-2">
            {dashboardData.commonConcerns.map((concern, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-yellow-50 rounded">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">{concern}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demographic Breakdown */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Demographic Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Age Groups */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Age Groups</h4>
            <div className="space-y-2">
              {Object.entries(dashboardData.demographicBreakdown.ageGroups).map(([age, count]) => (
                <div key={age} className="flex justify-between text-sm">
                  <span className="text-gray-600">{age}</span>
                  <span className="font-medium">{count}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Education</h4>
            <div className="space-y-2">
              {Object.entries(dashboardData.demographicBreakdown.education).map(([edu, count]) => (
                <div key={edu} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{edu.replace('-', ' ')}</span>
                  <span className="font-medium">{count}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Political Affiliation */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Political Affiliation</h4>
            <div className="space-y-2">
              {Object.entries(dashboardData.demographicBreakdown.politicalAffiliation).map(([affiliation, count]) => (
                <div key={affiliation} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{affiliation}</span>
                  <span className="font-medium">{count}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Income Brackets */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Income Brackets</h4>
            <div className="space-y-2">
              {Object.entries(dashboardData.demographicBreakdown.incomeBrackets).map(([bracket, count]) => (
                <div key={bracket} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{bracket}</span>
                  <span className="font-medium">{count}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
