'use client';

import React, { useState, useEffect } from 'react';

export default function TestStoreIsolation() {
  const [renderCount, setRenderCount] = useState(0);
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  useEffect(() => {
    setRenderCount(prev => prev + 1);
    console.log('🔄 TestStoreIsolation Render count:', renderCount + 1);
  }, []); // Only run once on mount

  useEffect(() => {
    const testStores = async () => {
      const results: Record<string, string> = {};
      
      // Test each store individually
      try {
        // Test 1: userStore
        const { useUserStore } = await import('@/lib/stores/userStore');
        results.userStore = '✅ OK';
      } catch (error) {
        results.userStore = `❌ Error: ${error}`;
      }
      
      try {
        // Test 2: hashtagStore
        const { useHashtagStore } = await import('@/lib/stores/hashtagStore');
        results.hashtagStore = '✅ OK';
      } catch (error) {
        results.hashtagStore = `❌ Error: ${error}`;
      }
      
      try {
        // Test 3: analyticsStore
        const { useAnalyticsStore } = await import('@/lib/stores/analyticsStore');
        results.analyticsStore = '✅ OK';
      } catch (error) {
        results.analyticsStore = `❌ Error: ${error}`;
      }
      
      try {
        // Test 4: feedsStore
        const { useFeedsStore } = await import('@/lib/stores/feedsStore');
        results.feedsStore = '✅ OK';
      } catch (error) {
        results.feedsStore = `❌ Error: ${error}`;
      }
      
      try {
        // Test 5: profileStore
        const { useProfileStore } = await import('@/lib/stores/profileStore');
        results.profileStore = '✅ OK';
      } catch (error) {
        results.profileStore = `❌ Error: ${error}`;
      }
      
      setTestResults(results);
    };
    
    testStores();
  }, []);

  return (
    <div className="p-8">
      <h1>Store Isolation Test</h1>
      <p>Render Count: {renderCount}</p>
      
      <div className="mt-4 space-y-2">
        {Object.entries(testResults).map(([store, result]) => (
          <div key={store} className="flex justify-between">
            <span className="font-medium">{store}:</span>
            <span className={result.startsWith('✅') ? 'text-green-600' : 'text-red-600'}>
              {result}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
