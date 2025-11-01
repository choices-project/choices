'use client';

import React from 'react';

import { 
  useAdminReimportProgress,
  useAdminReimportLogs,
  useAdminIsReimportRunning,
  useAdminReimportActions
} from '@/lib/stores';

export default function ComprehensiveReimport() {
  // Get state from adminStore
  const progress = useAdminReimportProgress();
  const logs = useAdminReimportLogs();
  const isRunning = useAdminIsReimportRunning();
  const { startReimport } = useAdminReimportActions();



  const getProgressPercentage = () => {
    if (!progress) return 0;
    return (progress.processedStates / progress.totalStates) * 100;
  };

  const getProgressBar = (percentage: number, width = 50) => {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🚀 Comprehensive Representative System Reimport
        </h1>
        <p className="text-gray-600">
          Reimport all 50 states + DC with enhanced progress tracking and visual feedback
        </p>
      </div>

      {/* Control Panel */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Reimport Control</h2>
          <button
            onClick={startReimport}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isRunning
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRunning ? '🔄 Reimporting...' : '🚀 Start Comprehensive Reimport'}
          </button>
        </div>

        {progress && (
          <div className="space-y-4">
            {/* Overall Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm text-gray-600">
                  {progress.processedStates}/{progress.totalStates} states
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {getProgressBar(getProgressPercentage())} {getProgressPercentage().toFixed(1)}%
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{progress.successfulStates}</div>
                <div className="text-sm text-green-700">Successful States</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{progress.failedStates}</div>
                <div className="text-sm text-red-700">Failed States</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{progress.totalRepresentatives}</div>
                <div className="text-sm text-blue-700">Total Representatives</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{progress.federalRepresentatives}</div>
                <div className="text-sm text-purple-700">Federal Representatives</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* State Results */}
      {progress && progress.stateResults.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">State Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {progress.stateResults.map((result: any, index: number) => (
              <div
                key={index}
                className={`p-2 rounded text-center text-sm font-medium ${
                  result.success
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                <div className="font-bold">{result.state}</div>
                <div className="text-xs">
                  {result.success ? `✅ ${result.representatives}` : '❌ Failed'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {progress && progress.errors.length > 0 && (
        <div className="bg-red-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-red-800 mb-4">Errors ({progress.errors.length})</h3>
          <div className="space-y-2">
            {progress.errors.map((error: any, index: number) => (
              <div key={index} className="text-sm text-red-700 bg-red-100 p-2 rounded">
                {error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Reimport Logs</h3>
        <div className="bg-black rounded p-4 h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-400 text-sm">No logs yet. Click &quot;Start Comprehensive Reimport&quot; to begin.</div>
          ) : (
            <div className="space-y-1">
              {logs.map((log: any, index: number) => (
                <div key={index} className="text-green-400 text-sm font-mono">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Final Results */}
      {progress && progress.processedStates === progress.totalStates && (
        <div className="mt-6 bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">🎉 Reimport Complete!</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {progress.totalStates > 0 ? Math.round((progress.successfulStates / progress.totalStates) * 100) : 0}%
              </div>
              <div className="text-sm text-green-700">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{progress.totalRepresentatives}</div>
              <div className="text-sm text-green-700">Total Representatives</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{progress.successfulStates}</div>
              <div className="text-sm text-green-700">Successful States</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
