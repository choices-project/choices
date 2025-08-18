/**
 * Feature Flags Admin Page
 * 
 * Admin interface for managing feature flags across the platform.
 */

'use client';

import React, { useState } from 'react';
import { devLog } from '@/lib/logger';
import { useFeatureFlagManagement } from '../../../hooks/useFeatureFlags';
import { FeatureFlagDebugger } from '../../../components/FeatureWrapper';

export default function FeatureFlagsAdminPage() {
  const { 
    flags, 
    systemInfo, 
    updateFlagMetadata, 
    reset, 
    exportConfig, 
    importConfig, 
    loading 
  } = useFeatureFlagManagement();

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'core' | 'optional' | 'experimental'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDebugger, setShowDebugger] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const flagsArray = Array.from(flags.values());
  
  const filteredFlags = flagsArray.filter(flag => {
    const matchesCategory = selectedCategory === 'all' || flag.category === selectedCategory;
    const matchesSearch = flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flag.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flag.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleToggleFlag = (flagId: string) => {
    const flag = flags.get(flagId);
    if (flag) {
      updateFlagMetadata(flagId, { 
        enabled: !flag.enabled,
        lastToggled: new Date().toISOString()
      });
    }
  };

  const handleExport = () => {
    const config = exportConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feature-flags-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string);
          importConfig(config);
        } catch (error) {
          devLog('Failed to import config:', error);
          alert('Failed to import configuration file');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Feature Flags Management</h1>
          <p className="text-gray-600">
            Manage feature flags across the platform. Enable or disable features dynamically.
          </p>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">System Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{systemInfo.totalFlags}</div>
              <div className="text-sm text-gray-600">Total Flags</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{systemInfo.enabledFlags}</div>
              <div className="text-sm text-gray-600">Enabled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{systemInfo.disabledFlags}</div>
              <div className="text-sm text-gray-600">Disabled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{systemInfo.categories.optional}</div>
              <div className="text-sm text-gray-600">Optional</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{systemInfo.environment}</div>
              <div className="text-sm text-gray-600">Environment</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search flags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="core">Core</option>
                <option value="optional">Optional</option>
                <option value="experimental">Experimental</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Export
              </button>
              <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to reset all feature flags to their default state?')) {
                    reset();
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setShowDebugger(!showDebugger)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                {showDebugger ? 'Hide' : 'Show'} Debugger
              </button>
            </div>
          </div>
        </div>

        {/* Debugger */}
        {showDebugger && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <FeatureFlagDebugger />
          </div>
        )}

        {/* Feature Flags Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFlags.map(flag => (
            <div
              key={flag.id}
              className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                flag.enabled 
                  ? 'border-green-500' 
                  : 'border-red-500'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{flag.name}</h3>
                  <p className="text-sm text-gray-500">{flag.id}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  flag.category === 'core' 
                    ? 'bg-blue-100 text-blue-800'
                    : flag.category === 'optional'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {flag.category}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-4">{flag.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                    flag.enabled ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  <span className="text-sm font-medium">
                    {flag.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <button
                  onClick={() => handleToggleFlag(flag.id)}
                  className={`px-3 py-1 text-sm font-medium rounded ${
                    flag.enabled
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  } transition-colors`}
                >
                  {flag.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>

              {flag.metadata && Object.keys(flag.metadata).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                      Metadata
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(flag.metadata, null, 2)}
                    </pre>
                  </details>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                <div>Created: {new Date(flag.createdAt).toLocaleDateString()}</div>
                <div>Updated: {new Date(flag.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>

        {filteredFlags.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No feature flags found</div>
            <div className="text-gray-400 text-sm">Try adjusting your search or filter criteria</div>
          </div>
        )}
      </div>
    </div>
  );
}
