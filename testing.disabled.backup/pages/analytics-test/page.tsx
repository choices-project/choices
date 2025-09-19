'use client';

import React from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { devLog } from '@/lib/logger';

export default function AnalyticsTestPage() {
  const {
    config,
    trackEvent,
    trackPageView,
    trackUserAction,
    getEvents,
    clearEvents,
    isEnabled
  } = useAnalytics();

  const handleTestEvent = (eventName: string) => {
    devLog(`Testing analytics event: ${eventName}`);
    trackEvent({
      name: eventName,
      properties: { test: true, timestamp: new Date().toISOString() }
    });
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
              <p className={`text-lg ${isEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {isEnabled ? '✅ Yes' : '❌ No'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <p className="font-medium">Provider:</p>
              <p className="text-lg text-blue-600">
                {config.provider || 'None'}
              </p>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <button
              onClick={() => handleTestEvent('overview')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Test Overview
            </button>
            <button
              onClick={() => handleTestEvent('trends')}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Test Trends
            </button>
            <button
              onClick={() => handleTestEvent('demographics')}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Test Demographics
            </button>
            <button
              onClick={() => handleTestEvent('performance')}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
            >
              Test Performance
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <button
              onClick={() => handleTestEvent('privacy')}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Test Privacy
            </button>
            <button
              onClick={() => handleTestEvent('engagement')}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Test Engagement
            </button>
            <button
              onClick={() => handleTestEvent('advanced')}
              className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
            >
              Test Advanced
            </button>
            <button
              onClick={clearEvents}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Clear Events
            </button>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                const events = getEvents();
                const dataStr = JSON.stringify(events, null, 2);
                const dataBlob = new Blob([dataStr], {type: 'application/json'});
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'analytics-events.json';
                link.click();
              }}
              className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
            >
              Export JSON
            </button>
            <button
              onClick={() => {
                const events = getEvents();
                const csvStr = events.map(e => `${e.name},${e.timestamp},${JSON.stringify(e.properties)}`).join('\n');
                const dataBlob = new Blob([csvStr], {type: 'text/csv'});
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'analytics-events.csv';
                link.click();
              }}
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
            <p><strong>Analytics Enabled:</strong> {isEnabled ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Provider:</strong> {config.provider || 'None'}</p>
            <p><strong>Events Count:</strong> {getEvents().length}</p>
          </div>
        </div>

        {/* Events Display */}
        {getEvents().length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Analytics Events</h2>
            <div className="bg-gray-50 p-4 rounded overflow-auto max-h-96">
              <pre className="text-sm">{JSON.stringify(getEvents(), null, 2)}</pre>
            </div>
          </div>
        )}

        {/* Feature Flag Instructions */}
        {!isEnabled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Enable Analytics</h3>
            <p className="text-yellow-700 mb-4">
              To test the analytics system, you need to enable the analytics feature flag.
            </p>
            <div className="bg-white p-4 rounded">
              <p className="text-sm font-mono text-gray-800">
                Set environment variable: <code>ENABLEANALYTICS=true</code>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
