/**
 * Performance Dashboard Component
 * 
 * Visual dashboard for displaying test performance metrics and reports
 */

import React from 'react';
import { TestMonitor, TestMetrics, PerformanceReport } from './test-monitoring';

interface PerformanceDashboardProps {
  monitor: TestMonitor;
  showAlerts?: boolean;
  showRecommendations?: boolean;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  monitor,
  showAlerts = true,
  showRecommendations = true,
}) => {
  const report = monitor.generateReport();
  const alerts = monitor.getAlerts();

  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case 'A+': return 'text-green-600 bg-green-100';
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PASS': return 'text-green-600 bg-green-100';
      case 'FAIL': return 'text-red-600 bg-red-100';
      case 'SKIP': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="performance-dashboard p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">🚀 Performance Dashboard</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600">Total Tests</h3>
          <p className="text-2xl font-bold text-blue-800">{report.totalTests}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-600">Passed</h3>
          <p className="text-2xl font-bold text-green-800">{report.passedTests}</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-600">Failed</h3>
          <p className="text-2xl font-bold text-red-800">{report.failedTests}</p>
        </div>
        
        <div className={`p-4 rounded-lg ${getGradeColor(report.performanceGrade)}`}>
          <h3 className="text-sm font-medium">Performance Grade</h3>
          <p className="text-2xl font-bold">{report.performanceGrade}</p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">⏱️ Performance Metrics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Average Render Time:</span>
              <span className="font-semibold">{report.averageRenderTime.toFixed(2)}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average Memory Usage:</span>
              <span className="font-semibold">{report.averageMemoryUsage.toFixed(2)}MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Success Rate:</span>
              <span className="font-semibold">
                {((report.passedTests / report.totalTests) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">📊 Test Results</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Passed: {report.passedTests}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Failed: {report.failedTests}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Skipped: {report.skippedTests}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {showAlerts && alerts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">🚨 Performance Alerts</h3>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div key={index} className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                <p className="text-yellow-800">{alert}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {showRecommendations && report.recommendations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">💡 Optimization Recommendations</h3>
          <div className="space-y-2">
            {report.recommendations.map((recommendation, index) => (
              <div key={index} className="bg-blue-50 border-l-4 border-blue-400 p-3">
                <p className="text-blue-800">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="text-sm text-gray-500 text-center">
        Last updated: {report.timestamp.toLocaleString()}
      </div>
    </div>
  );
};

/**
 * Performance Metrics Table Component
 */
interface PerformanceMetricsTableProps {
  metrics: TestMetrics[];
  title?: string;
}

export const PerformanceMetricsTable: React.FC<PerformanceMetricsTableProps> = ({
  metrics,
  title = "Performance Metrics",
}) => {
  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case 'A+': return 'text-green-600 bg-green-100';
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PASS': return 'text-green-600 bg-green-100';
      case 'FAIL': return 'text-red-600 bg-red-100';
      case 'SKIP': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="performance-metrics-table">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Test Name
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Render Time
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Memory
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grade
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {metrics.map((metric, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm text-gray-900">
                  {metric.testName}
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(metric.status)}`}>
                    {metric.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-gray-900">
                  {metric.renderTime.toFixed(2)}ms
                </td>
                <td className="px-4 py-2 text-sm text-gray-900">
                  {metric.memoryUsage.toFixed(2)}MB
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(metric.performanceGrade)}`}>
                    {metric.performanceGrade}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-gray-500">
                  {metric.timestamp.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PerformanceDashboard;














