'use client';

import React from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { isFeatureEnabled } from '../../lib/feature-flags';

export default function AnalyticsTestPage() {
  const {
    data,
    loading,
    error,
    analyticsEnabled,
    aiFeaturesEnabled,
    fetchData,
    refreshData,
    exportData
  } = useAnalytics({
    autoRefresh: false
  });

  const handleTestFetch = async (type: string) => {
    console.log(`Testing analytics fetch for type: ${type}`);
    await fetchData(type);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics System Test</h1>
        
        {/* Feature Flag Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Feature Flag Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded">
              <p className="font-medium">Analytics Enabled:</p>
              <p className={`text-lg ${analyticsEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {analyticsEnabled ? '✅ Yes' : '❌ No'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <p className="font-medium">AI Features Enabled:</p>
              <p className={`text-lg ${aiFeaturesEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {aiFeaturesEnabled ? '✅ Yes' : '❌ No'}
              </p>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <button
              onClick={() => handleTestFetch('overview')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Test Overview
            </button>
            <button
              onClick={() => handleTestFetch('trends')}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Test Trends
            </button>
            <button
              onClick={() => handleTestFetch('demographics')}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Test Demographics
            </button>
            <button
              onClick={() => handleTestFetch('performance')}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
            >
              Test Performance
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <button
              onClick={() => handleTestFetch('privacy')}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Test Privacy
            </button>
            <button
              onClick={() => handleTestFetch('engagement')}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Test Engagement
            </button>
            <button
              onClick={() => handleTestFetch('advanced')}
              className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
            >
              Test Advanced
            </button>
            <button
              onClick={refreshData}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Refresh All
            </button>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => exportData('json')}
              className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
            >
              Export JSON
            </button>
            <button
              onClick={() => exportData('csv')}
              className="bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Status Display */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {loading ? '🔄 Yes' : '✅ No'}</p>
            <p><strong>Error:</strong> {error ? `❌ ${error}` : '✅ None'}</p>
            <p><strong>Data Available:</strong> {data ? '✅ Yes' : '❌ No'}</p>
          </div>
        </div>

        {/* Data Display */}
        {data && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Analytics Data</h2>
            <div className="bg-gray-50 p-4 rounded overflow-auto max-h-96">
              <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* Feature Flag Instructions */}
        {!analyticsEnabled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Enable Analytics</h3>
            <p className="text-yellow-700 mb-4">
              To test the analytics system, you need to enable the analytics feature flag.
            </p>
            <div className="bg-white p-4 rounded">
              <p className="text-sm font-mono text-gray-800">
                Set environment variable: <code>ENABLE_ANALYTICS=true</code>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
