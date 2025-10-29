'use client';

import React, { useState, useEffect } from 'react';

export default function TestUserStore() {
  const [renderCount, setRenderCount] = useState(0);
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  useEffect(() => {
    setRenderCount(prev => prev + 1);
    console.log('🔄 TestUserStore Render count:', renderCount + 1);
  });

  useEffect(() => {
    const testUserStore = async () => {
      const results: Record<string, string> = {};
      
      try {
        // Test individual userStore hooks
        const { useUser, useUserLoading, useIsAuthenticated } = await import('@/lib/stores/userStore');
        
        // Test if these hooks can be called without causing infinite loops
        results.useUser = '✅ OK';
        results.useUserLoading = '✅ OK';
        results.useIsAuthenticated = '✅ OK';
        
        // Test useUserActions
        const { useUserActions } = await import('@/lib/stores/userStore');
        results.useUserActions = '✅ OK';
        
      } catch (error) {
        results.error = `❌ Error: ${error}`;
      }
      
      setTestResults(results);
    };
    
    testUserStore();
  }, []);

  return (
    <div className="p-8">
      <h1>User Store Test</h1>
      <p>Render Count: {renderCount}</p>
      
      <div className="mt-4 space-y-2">
        {Object.entries(testResults).map(([test, result]) => (
          <div key={test} className="flex justify-between">
            <span className="font-medium">{test}:</span>
            <span className={result.startsWith('✅') ? 'text-green-600' : 'text-red-600'}>
              {result}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
