'use client';

import { useState, useEffect } from 'react';
import { 
  simplePerformanceMonitor, 
  getSimplePerformanceStats, 
  getSimplePerformanceRecommendations 
} from '@/lib/performance-monitor-simple';

export default function PerformanceDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, recommendationsData] = await Promise.all([
        getSimplePerformanceStats('24h'),
        getSimplePerformanceRecommendations()
      ]);
      setStats(statsData);
      setRecommendations(recommendationsData);
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runMaintenanceJob = async (jobType: string) => {
    try {
      await simplePerformanceMonitor.runMaintenanceJob(`manual_${jobType}`, jobType);
      await loadData(); // Reload data after maintenance
    } catch (error) {
      console.error(`Failed to run ${jobType} job:`, error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-gray-600">Monitor and optimize database performance</p>
        </div>
        <button 
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Queries</p>
              <p className="text-2xl font-bold">{stats?.queryPerformance?.totalQueries || 0}</p>
            </div>
            <div className="text-blue-600">📊</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Execution</p>
              <p className="text-2xl font-bold">{stats?.queryPerformance?.avgExecutionTime?.toFixed(2) || 0}ms</p>
            </div>
            <div className="text-green-600">⚡</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
              <p className="text-2xl font-bold">{((stats?.cachePerformance?.avgHitRate || 0) * 100).toFixed(1)}%</p>
            </div>
            <div className="text-purple-600">💾</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Slow Queries</p>
              <p className="text-2xl font-bold">{stats?.queryPerformance?.slowQueries || 0}</p>
            </div>
            <div className="text-red-600">⚠️</div>
          </div>
        </div>
      </div>

      {/* Performance Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Query Performance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Average Execution Time</span>
                <span className="font-medium">{stats?.queryPerformance?.avgExecutionTime?.toFixed(2) || 0}ms</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ 
                    width: `${Math.min((stats?.queryPerformance?.avgExecutionTime || 0) / 1000 * 100, 100)}%` 
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span>Total Rows Affected</span>
                <span className="font-medium">{stats?.queryPerformance?.totalRowsAffected?.toLocaleString() || 0}</span>
              </div>
            </div>

            {stats?.queryPerformance?.slowQueries && stats.queryPerformance.slowQueries > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <div className="flex items-center">
                  <span className="text-red-600 mr-2">⚠️</span>
                  <span className="text-sm text-red-800">
                    {stats.queryPerformance.slowQueries} queries are taking longer than 1 second to execute.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Cache Performance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Hit Rate</span>
                <span className="font-medium">{((stats?.cachePerformance?.avgHitRate || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ 
                    width: `${(stats?.cachePerformance?.avgHitRate || 0) * 100}%` 
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span>Average Response Time</span>
                <span className="font-medium">{stats?.cachePerformance?.avgResponseTime?.toFixed(2) || 0}ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Jobs */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Maintenance Jobs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Cleanup</h4>
            <p className="text-sm text-gray-600 mb-4">Remove expired data and optimize storage</p>
            <button 
              onClick={() => runMaintenanceJob('cleanup')}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              Run Cleanup
            </button>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Analyze</h4>
            <p className="text-sm text-gray-600 mb-4">Update table statistics for query optimization</p>
            <button 
              onClick={() => runMaintenanceJob('analyze')}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              Run Analyze
            </button>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Vacuum</h4>
            <p className="text-sm text-gray-600 mb-4">Reclaim storage and update statistics</p>
            <button 
              onClick={() => runMaintenanceJob('vacuum')}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              Run Vacuum
            </button>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Reindex</h4>
            <p className="text-sm text-gray-600 mb-4">Rebuild indexes for better performance</p>
            <button 
              onClick={() => runMaintenanceJob('reindex')}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              Run Reindex
            </button>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Performance Recommendations</h3>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">{rec.recommendationText}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Type: {rec.recommendationType}</span>
                      <span>Impact: {rec.estimatedImpact.toFixed(1)}%</span>
                      <span>Effort: {rec.implementationEffort}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
