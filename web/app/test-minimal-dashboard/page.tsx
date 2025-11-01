'use client';

import React, { useState, useEffect } from 'react';

export default function TestMinimalDashboard() {
  const [renderCount, setRenderCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setRenderCount(prev => prev + 1);
    console.log('🔄 Minimal Dashboard Render count:', renderCount + 1);
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔍 Loading minimal dashboard data...');
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('✅ Minimal dashboard data loaded');
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Error loading minimal dashboard:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, []); // Only run once on mount

  if (isLoading) {
    return (
      <div className="p-8">
        <h1>Loading Minimal Dashboard...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1>Minimal Dashboard Test</h1>
      <p>Render Count: {renderCount}</p>
      <p>Status: Loaded successfully</p>
    </div>
  );
}
