'use client';

import React, { useState, useEffect } from 'react';

export default function TestLayoutComponents() {
  const [renderCount, setRenderCount] = useState(0);
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  useEffect(() => {
    setRenderCount(prev => prev + 1);
    console.log('🔄 TestLayoutComponents Render count:', renderCount + 1);
  });

  useEffect(() => {
    const testComponents = async () => {
      const results: Record<string, string> = {};
      
      // Test 1: FontProvider
      try {
        const { default: _FontProvider } = await import('@/components/shared/FontProvider');
        results.FontProvider = '✅ OK';
      } catch (error) {
        results.FontProvider = `❌ Error: ${error}`;
      }
      
      // Test 2: GlobalNavigation
      try {
        const { default: _GlobalNavigation } = await import('@/components/shared/GlobalNavigation');
        results.GlobalNavigation = '✅ OK';
      } catch (error) {
        results.GlobalNavigation = `❌ Error: ${error}`;
      }
      
      // Test 3: SiteMessages
      try {
        const { default: _SiteMessages } = await import('@/components/shared/SiteMessages');
        results.SiteMessages = '✅ OK';
      } catch (error) {
        results.SiteMessages = `❌ Error: ${error}`;
      }
      
      // Test 4: UserStoreProvider
      try {
        const { UserStoreProvider: _UserStoreProvider } = await import('@/lib/providers/UserStoreProvider');
        results.UserStoreProvider = '✅ OK';
      } catch (error) {
        results.UserStoreProvider = `❌ Error: ${error}`;
      }
      
      // Test 5: EnhancedFeedbackWidget
      try {
        const { default: _EnhancedFeedbackWidget } = await import('@/components/EnhancedFeedbackWidget');
        results.EnhancedFeedbackWidget = '✅ OK';
      } catch (error) {
        results.EnhancedFeedbackWidget = `❌ Error: ${error}`;
      }
      
      setTestResults(results);
    };
    
    testComponents();
  }, []);

  return (
    <div className="p-8">
      <h1>Layout Components Test</h1>
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
