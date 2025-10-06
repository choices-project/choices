/**
 * Social Media Integration Test Page
 * Tests the social media API integration and data display
 * Created: October 6, 2025
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  HeartIcon,
  ShareIcon,
  ChatBubbleLeftIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface SocialMediaMetrics {
  platform: string;
  followersCount: number;
  engagementRate: number;
  recentPostsCount: number;
  sentimentScore: number;
  verificationStatus: boolean;
  lastUpdated: string;
  dataSource: string;
}

interface SocialMediaHandle {
  platform: string;
  handle: string;
  url: string;
  isVerified: boolean;
  isActive: boolean;
  lastUpdated: string;
}

interface SocialMediaSummary {
  totalFollowers: number;
  averageEngagement: number;
  averageSentiment: number;
  verifiedPlatforms: number;
  totalPlatforms: number;
}

export default function TestSocialMediaPage() {
  const [representativeId, setRepresentativeId] = useState('rep-001');
  const [metrics, setMetrics] = useState<SocialMediaMetrics[]>([]);
  const [handles, setHandles] = useState<SocialMediaHandle[]>([]);
  const [summary, setSummary] = useState<SocialMediaSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  // Test social media data ingestion
  const testDataIngestion = async () => {
    setIsLoading(true);
    setError(null);
    setTestResults([]);

    try {
      // Test 1: Ingest social media data
      const ingestResponse = await fetch('/api/social-media/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ representativeId })
      });

      const ingestResult = await ingestResponse.json();
      setTestResults(prev => [...prev, {
        test: 'Data Ingestion',
        status: ingestResult.success ? 'PASS' : 'FAIL',
        details: ingestResult
      }]);

      if (!ingestResult.success) {
        throw new Error(ingestResult.error);
      }

      // Test 2: Fetch social media metrics
      const metricsResponse = await fetch(`/api/social-media/metrics/${representativeId}`);
      const metricsResult = await metricsResponse.json();
      setTestResults(prev => [...prev, {
        test: 'Metrics Retrieval',
        status: metricsResult.success ? 'PASS' : 'FAIL',
        details: metricsResult
      }]);

      if (metricsResult.success) {
        setMetrics(metricsResult.metrics);
        setHandles(metricsResult.handles);
        setSummary(metricsResult.summary);
      }

      // Test 3: Add new social media handle
      const addHandleResponse = await fetch(`/api/social-media/metrics/${representativeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: 'tiktok',
          handle: '@senator_smith',
          url: 'https://tiktok.com/@senator_smith',
          isVerified: true
        })
      });

      const addHandleResult = await addHandleResponse.json();
      setTestResults(prev => [...prev, {
        test: 'Add Social Media Handle',
        status: addHandleResult.success ? 'PASS' : 'FAIL',
        details: addHandleResult
      }]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setTestResults(prev => [...prev, {
        test: 'Error Handling',
        status: 'FAIL',
        details: { error: err instanceof Error ? err.message : 'Unknown error' }
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    testDataIngestion();
  }, [representativeId]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getSentimentColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEngagementColor = (rate: number) => {
    if (rate >= 5) return 'text-green-600';
    if (rate >= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Social Media Integration Test</h1>
              <p className="text-gray-600 mt-2">Testing social media API integration and data display</p>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={representativeId}
                onChange={(e) => setRepresentativeId(e.target.value)}
                placeholder="Representative ID"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={testDataIngestion}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Testing...' : 'Run Tests'}
              </button>
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">{result.test}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.status === 'PASS' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {result.details.platforms?.length || 0} platforms
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-800 font-medium">Error:</span>
              <span className="text-red-700 ml-2">{error}</span>
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        {summary && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Social Media Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{formatNumber(summary.totalFollowers)}</div>
                <div className="text-sm text-gray-600">Total Followers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{summary.averageEngagement.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Avg Engagement</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getSentimentColor(summary.averageSentiment)}`}>
                  {(summary.averageSentiment * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">Avg Sentiment</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{summary.verifiedPlatforms}/{summary.totalPlatforms}</div>
                <div className="text-sm text-gray-600">Verified Platforms</div>
              </div>
            </div>
          </div>
        )}

        {/* Social Media Metrics */}
        {metrics.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Metrics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {metrics.map((metric, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-lg capitalize">{metric.platform}</span>
                      {metric.verificationStatus && (
                        <CheckBadgeIcon className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(metric.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatNumber(metric.followersCount)}
                      </div>
                      <div className="text-sm text-gray-600">Followers</div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${getEngagementColor(metric.engagementRate)}`}>
                        {metric.engagementRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Engagement</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {metric.recentPostsCount}
                      </div>
                      <div className="text-sm text-gray-600">Recent Posts</div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${getSentimentColor(metric.sentimentScore)}`}>
                        {(metric.sentimentScore * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-600">Sentiment</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social Media Handles */}
        {handles.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Social Media Handles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {handles.map((handle, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">{handle.platform}</span>
                    {handle.isVerified && (
                      <CheckBadgeIcon className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <a href={handle.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {handle.handle}
                    </a>
                  </div>
                  <div className="text-xs text-gray-500">
                    {handle.isActive ? 'Active' : 'Inactive'} • {new Date(handle.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Implementation Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Implementation Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-md">
              <span className="font-medium">Database Schema</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">COMPLETE</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-md">
              <span className="font-medium">Social Media Service</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">COMPLETE</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-md">
              <span className="font-medium">API Endpoints</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">COMPLETE</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-md">
              <span className="font-medium">API Keys Configuration</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">PENDING</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-md">
              <span className="font-medium">Real-time Updates</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">PENDING</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-md">
              <span className="font-medium">Sentiment Analysis</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">PENDING</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
