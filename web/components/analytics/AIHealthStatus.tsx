'use client';

import { useState, useEffect } from 'react';

interface AIHealthStatusProps {
  className?: string;
}

interface HealthData {
  status: string;
  gpu_available: boolean;
  timestamp: number;
  platform?: string;
  repository?: string;
  live_site?: string;
}

export function AIHealthStatus({ className = '' }: AIHealthStatusProps) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkHealth();
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/analytics/colab/health');
      if (!response.ok) {
        throw new Error('Health check failed');
      }
      
      const data = await response.json();
      setHealth(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Checking AI server status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-sm text-red-600">AI server offline</span>
        </div>
        <p className="text-xs text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  if (!health) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span className="text-sm text-yellow-600">AI server status unknown</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-green-600 font-medium">AI Analytics Active</span>
        </div>
        <div className="text-xs text-gray-500">
          {health.gpu_available ? 'GPU' : 'CPU'} • {new Date(health.timestamp * 1000).toLocaleTimeString()}
        </div>
      </div>
      
      {health.platform && (
        <div className="mt-2 text-xs text-gray-600">
          <div>Platform: {health.platform}</div>
          {health.repository && <div>Repository: {health.repository}</div>}
          {health.live_site && <div>Live Site: {health.live_site}</div>}
        </div>
      )}
    </div>
  );
}
