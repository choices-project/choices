/**
 * Feature Flags Management Component
 * 
 * Admin interface for managing feature flags in production.
 * Provides runtime control over feature availability without code changes.
 */

import React, { useState, useEffect } from 'react';

import { useAdminStore } from '../lib/store';
import type { FeatureFlag } from '../types';

interface FeatureFlagsProps {
  onFlagChange?: (flagId: string, enabled: boolean) => void;
}

export default function FeatureFlags({ onFlagChange }: FeatureFlagsProps) {
  const {
    featureFlags,
    toggleFeatureFlag,
    getAllFeatureFlags,
    exportFeatureFlagConfig,
    importFeatureFlagConfig,
    resetFeatureFlags,
    setFeatureFlagLoading,
    setFeatureFlagError
  } = useAdminStore();

  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const allFlags = getAllFeatureFlags();
    setFlags(allFlags);
  }, [featureFlags.flags, getAllFeatureFlags]);

  const handleToggleFlag = async (flagId: string) => {
    setFeatureFlagLoading(true);
    setFeatureFlagError(null);

    try {
      // Update via API endpoint
      const response = await fetch('/api/feature-flags', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flagId,
          enabled: !featureFlags.flags[flagId]
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local store
        const success = toggleFeatureFlag(flagId);
        if (success) {
          onFlagChange?.(flagId, !featureFlags.flags[flagId]);
        }
      } else {
        setFeatureFlagError(data.error || `Failed to toggle flag: ${flagId}`);
      }
    } catch (error) {
      setFeatureFlagError(`Error toggling flag: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setFeatureFlagLoading(false);
    }
  };

  const handleExportConfig = () => {
    const config = exportFeatureFlagConfig();
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

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result === 'string') {
          try {
            const config = JSON.parse(result);
            if (config && typeof config === 'object') {
              const success = importFeatureFlagConfig(config);
              if (!success) {
                setFeatureFlagError('Failed to import configuration');
              }
            } else {
              setFeatureFlagError('Invalid configuration format');
            }
          } catch (parseError) {
            setFeatureFlagError('Invalid JSON format');
          }
        } else {
          setFeatureFlagError('Invalid file content');
        }
      } catch (error) {
        setFeatureFlagError(error instanceof Error ? error.message : 'Invalid configuration file');
      }
    };
    reader.readAsText(file);
  };

  const handleResetFlags = () => {
    // Use a proper confirmation dialog instead of browser confirm
    const confirmed = window.confirm('Are you sure you want to reset all feature flags to their default values?');
    if (confirmed) {
      resetFeatureFlags();
    }
  };

  const filteredFlags = flags.filter(flag => {
    const matchesCategory = selectedCategory === 'all' || flag.category === selectedCategory;
    const matchesSearch = flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flag.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { value: 'all', label: 'All Flags' },
    { value: 'core', label: 'Core Features' },
    { value: 'enhanced', label: 'Enhanced Features' },
    { value: 'civics', label: 'Civics Features' },
    { value: 'future', label: 'Future Features' },
    { value: 'performance', label: 'Performance' }
  ];

  return (
    <div className="feature-flags-admin">
      <div className="feature-flags-header">
        <h2>Feature Flags Management</h2>
        <p className="text-gray-600">
          Control feature availability in production without code changes.
          Changes take effect immediately across all users.
        </p>
      </div>

      {featureFlags.error && (
        <div className="alert alert-error mb-4">
          <span>Error: {featureFlags.error}</span>
          <button 
            onClick={() => setFeatureFlagError(null)}
            className="btn btn-sm btn-ghost"
          >
            ×
          </button>
        </div>
      )}

      <div className="feature-flags-controls mb-6">
        <div className="flex gap-4 items-center">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Category</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="select select-bordered"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Search</span>
            </label>
            <input
              type="text"
              placeholder="Search flags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-bordered"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleExportConfig}
            className="btn btn-outline"
            disabled={featureFlags.isLoading}
          >
            Export Config
          </button>
          
          <label className="btn btn-outline">
            Import Config
            <input
              type="file"
              accept=".json"
              onChange={handleImportConfig}
              className="hidden"
            />
          </label>
          
          <button
            onClick={handleResetFlags}
            className="btn btn-warning"
            disabled={featureFlags.isLoading}
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      <div className="feature-flags-stats mb-6">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total Flags</div>
            <div className="stat-value">{flags.length}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Enabled</div>
            <div className="stat-value text-success">{featureFlags.enabledFlags.length}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Disabled</div>
            <div className="stat-value text-error">{featureFlags.disabledFlags.length}</div>
          </div>
        </div>
      </div>

      <div className="feature-flags-list">
        {filteredFlags.map(flag => (
          <div key={flag.id} className="card bg-base-100 shadow-sm border mb-4">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="card-title text-lg">{flag.name}</h3>
                  <p className="text-sm text-gray-600">{flag.description}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`badge ${flag.category === 'core' ? 'badge-primary' : 
                                      flag.category === 'enhanced' ? 'badge-secondary' :
                                      flag.category === 'civics' ? 'badge-accent' :
                                      flag.category === 'future' ? 'badge-warning' :
                                      'badge-neutral'}`}>
                      {flag.category}
                    </span>
                    <span className="text-xs text-gray-500">{flag.id}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text mr-2">
                        {flag.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <input
                      type="checkbox"
                      className="toggle toggle-lg"
                      checked={flag.enabled}
                      onChange={() => handleToggleFlag(flag.id)}
                      disabled={featureFlags.isLoading}
                    />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredFlags.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No flags found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
