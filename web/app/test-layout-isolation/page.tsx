'use client';

import React, { useState, useEffect } from 'react';

export default function TestLayoutIsolation() {
  const [renderCount, setRenderCount] = useState(0);
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  useEffect(() => {
    setRenderCount(prev => prev + 1);
    console.log('🔄 TestLayoutIsolation Render count:', renderCount + 1);
  }, []); // Only run once on mount

  useEffect(() => {
    const testComponents = async () => {
      const results: Record<string, string> = {};
      
      // Test each component individually
      try {
        // Test 1: UserStoreProvider
        const { UserStoreProvider } = await import('@/lib/providers/UserStoreProvider');
        results.UserStoreProvider = '✅ OK';
      } catch (error) {
        results.UserStoreProvider = `❌ Error: ${error}`;
      }
      
      try {
        // Test 2: GlobalNavigation
        const { default: GlobalNavigation } = await import('@/components/shared/GlobalNavigation');
        results.GlobalNavigation = '✅ OK';
      } catch (error) {
        results.GlobalNavigation = `❌ Error: ${error}`;
      }
      
      try {
        // Test 3: SiteMessages
        const { default: SiteMessages } = await import('@/components/shared/SiteMessages');
        results.SiteMessages = '✅ OK';
      } catch (error) {
        results.SiteMessages = `❌ Error: ${error}`;
      }
      
      try {
        // Test 4: EnhancedFeedbackWidget
        const { default: EnhancedFeedbackWidget } = await import('@/features/analytics/components/FeedbackWidget');
        results.EnhancedFeedbackWidget = '✅ OK';
      } catch (error) {
        results.EnhancedFeedbackWidget = `❌ Error: ${error}`;
      }
      
      try {
        // Test 5: PWABackground
        const { default: PWABackground } = await import('@/features/pwa/components/PWABackground');
        results.PWABackground = '✅ OK';
      } catch (error) {
        results.PWABackground = `❌ Error: ${error}`;
      }
      
      setTestResults(results);
    };
    
    testComponents();
  }, []);

  return (
    <div className="p-8">
      <h1>Layout Component Isolation Test</h1>
      <p>Render Count: {renderCount}</p>
      
      <div className="mt-4 space-y-2">
        {Object.entries(testResults).map(([component, result]) => (
          <div key={component} className="flex justify-between">
            <span className="font-medium">{component}:</span>
            <span className={result.startsWith('✅') ? 'text-green-600' : 'text-red-600'}>
              {result}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
