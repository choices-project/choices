/**
 * System Settings Page
 * 
 * Admin interface for system configuration and settings.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/utils/logger';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Database, 
  Shield, 
  Mail, 
  Bell,
  Zap,
  Server,
  CheckCircle,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

type SystemConfig = {
  general: {
    siteName: string;
    siteDescription: string;
    adminEmail: string;
    timezone: string;
    language: string;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    requireEmailVerification: boolean;
    enableTwoFactor: boolean;
    passwordMinLength: number;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
  };
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    maxConnections: number;
    backupFrequency: string;
    schemaStatus: 'refreshed' | 'pending' | 'error';
    lastMigration: string;
    tableCount: number;
    connectionStatus: 'connected' | 'disconnected' | 'error';
    cacheRefreshTime: string;
  };
  performance: {
    cacheEnabled: boolean;
    cacheDuration: number;
    compressionEnabled: boolean;
    maxUploadSize: number;
    rateLimitEnabled: boolean;
    rateLimitRequests: number;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    adminAlerts: boolean;
    userRegistrationAlerts: boolean;
    systemErrorAlerts: boolean;
  };
}

export default function SystemSettingsPage() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showHiddenFields, setShowHiddenFields] = useState(false);

  // Fetch real system data
  useEffect(() => {
    const fetchSystemData = async () => {
      try {
        setLoading(true);
        
        // Fetch system status from API
        const response = await fetch('/api/admin/system-status', {
          headers: {
            'Authorization': 'Bearer admin-access', // This should be replaced with real auth
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const systemData = await response.json();
          
          // Transform API data to config format
          const realConfig: SystemConfig = {
            general: {
              siteName: 'Choices Platform',
              siteDescription: 'A secure and transparent voting platform',
              adminEmail: 'admin@choices.com',
              timezone: 'UTC',
              language: 'en'
            },
            security: {
              sessionTimeout: 3600,
              maxLoginAttempts: 5,
              requireEmailVerification: true,
              enableTwoFactor: true,
              passwordMinLength: 8
            },
            email: {
              smtpHost: 'smtp.gmail.com',
              smtpPort: 587,
              smtpUser: 'noreply@choices.com',
              smtpPassword: '********',
              fromEmail: 'noreply@choices.com',
              fromName: 'Choices Platform'
            },
            database: {
              host: 'supabase.co',
              port: 5432,
              name: 'choicesdb',
              user: 'postgres',
              maxConnections: 100,
              backupFrequency: 'daily',
              schemaStatus: systemData.database.schemaStatus,
              lastMigration: systemData.database.lastMigration,
              tableCount: systemData.database.tableCount,
              connectionStatus: systemData.database.connectionStatus,
              cacheRefreshTime: systemData.database.cacheRefreshTime
            },
            performance: {
              cacheEnabled: true,
              cacheDuration: 300,
              compressionEnabled: true,
              maxUploadSize: 10485760,
              rateLimitEnabled: true,
              rateLimitRequests: 100
            },
            notifications: {
              emailNotifications: true,
              pushNotifications: true,
              adminAlerts: true,
              userRegistrationAlerts: false,
              systemErrorAlerts: true
            }
          };
          
          setConfig(realConfig);
        } else {
          logger.error('Failed to fetch system status:', new Error(`HTTP ${response.status}`));
          // Fall back to mock data if API fails
          setConfig(getMockConfig());
        }
      } catch (error) {
        // narrow 'unknown' → Error
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Error fetching system data:', err);
        // Fall back to mock data if API fails
        setConfig(getMockConfig());
      } finally {
        setLoading(false);
      }
    };

    fetchSystemData();
  }, []);

  const getMockConfig = (): SystemConfig => ({
    general: {
      siteName: 'Choices Platform',
      siteDescription: 'A secure and transparent voting platform',
      adminEmail: 'admin@choices.com',
      timezone: 'UTC',
      language: 'en'
    },
    security: {
      sessionTimeout: 3600,
      maxLoginAttempts: 5,
      requireEmailVerification: true,
      enableTwoFactor: true,
      passwordMinLength: 8
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'noreply@choices.com',
      smtpPassword: '********',
      fromEmail: 'noreply@choices.com',
      fromName: 'Choices Platform'
    },
    database: {
      host: 'localhost',
      port: 5432,
      name: 'choicesdb',
      user: 'choicesuser',
      maxConnections: 100,
      backupFrequency: 'daily',
      schemaStatus: 'pending' as const,
      lastMigration: '2025-08-26T02:42:56',
      tableCount: 10,
      connectionStatus: 'connected' as const,
      cacheRefreshTime: '2025-08-26T02:42:56'
    },
    performance: {
      cacheEnabled: true,
      cacheDuration: 300,
      compressionEnabled: true,
      maxUploadSize: 10485760,
      rateLimitEnabled: true,
      rateLimitRequests: 100
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      adminAlerts: true,
      userRegistrationAlerts: false,
      systemErrorAlerts: true
    }
  });

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    // Show success message
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      // Reset to default values
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'database', name: 'Database', icon: Database },
    { id: 'performance', name: 'Performance', icon: Zap },
    { id: 'notifications', name: 'Notifications', icon: Bell }
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i: any) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">Configure system-wide settings and preferences</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Status</p>
              <p className="text-2xl font-bold text-green-600">Healthy</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Database</p>
              <p className="text-2xl font-bold text-blue-600">Connected</p>
            </div>
            <Database className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Uptime</p>
              <p className="text-2xl font-bold text-purple-600">99.9%</p>
            </div>
            <Server className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Last Backup</p>
              <p className="text-2xl font-bold text-orange-600">2h ago</p>
            </div>
            <Download className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <div className="bg-white rounded-lg shadow">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab: any) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={config?.general.siteName}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      general: { ...prev.general, siteName: e.target.value }
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={config?.general.adminEmail}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      general: { ...prev.general, adminEmail: e.target.value }
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={config?.general.timezone}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      general: { ...prev.general, timezone: e.target.value }
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/NewYork">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/LosAngeles">Pacific Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={config?.general.language}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      general: { ...prev.general, language: e.target.value }
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Description
                </label>
                <textarea
                  value={config?.general.siteDescription}
                  onChange={(e) => setConfig(prev => prev ? {
                    ...prev,
                    general: { ...prev.general, siteDescription: e.target.value }
                  } : null)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    value={config?.security.sessionTimeout}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      security: { ...prev.security, sessionTimeout: parseInt(e.target.value) }
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Login Attempts
                  </label>
                  <input
                    type="number"
                    value={config?.security.maxLoginAttempts}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      security: { ...prev.security, maxLoginAttempts: parseInt(e.target.value) }
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password Min Length
                  </label>
                  <input
                    type="number"
                    value={config?.security.passwordMinLength}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      security: { ...prev.security, passwordMinLength: parseInt(e.target.value) }
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Require Email Verification</h4>
                    <p className="text-sm text-gray-500">Users must verify their email before accessing the platform</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config?.security.requireEmailVerification}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      security: { ...prev.security, requireEmailVerification: e.target.checked }
                    } : null)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Enable Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-500">Allow users to enable 2FA for additional security</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config?.security.enableTwoFactor}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      security: { ...prev.security, enableTwoFactor: e.target.checked }
                    } : null)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Email Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={config?.email.smtpHost}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      email: { ...prev.email, smtpHost: e.target.value }
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={config?.email.smtpPort}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      email: { ...prev.email, smtpPort: parseInt(e.target.value) }
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Username
                  </label>
                  <input
                    type="text"
                    value={config?.email.smtpUser}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      email: { ...prev.email, smtpUser: e.target.value }
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Password
                  </label>
                  <div className="relative">
                    <input
                      type={showHiddenFields ? 'text' : 'password'}
                      value={config?.email.smtpPassword}
                      onChange={(e) => setConfig(prev => prev ? {
                        ...prev,
                        email: { ...prev.email, smtpPassword: e.target.value }
                      } : null)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => setShowHiddenFields(!showHiddenFields)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                                              {showHiddenFields ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Email
                  </label>
                  <input
                    type="email"
                    value={config?.email.fromEmail}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      email: { ...prev.email, fromEmail: e.target.value }
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={config?.email.fromName}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      email: { ...prev.email, fromName: e.target.value }
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Database Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Database Host
                  </label>
                  <input
                    type="text"
                    value={config?.database.host}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      database: { ...prev.database, host: e.target.value }
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Database Port
                  </label>
                  <input
                    type="number"
                    value={config?.database.port}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      database: { ...prev.database, port: parseInt(e.target.value) }
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Database Name
                  </label>
                  <input
                    type="text"
                    value={config?.database.name}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      database: { ...prev.database, name: e.target.value }
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Database User
                  </label>
                  <input
                    type="text"
                    value={config?.database.user}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      database: { ...prev.database, user: e.target.value }
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Connections
                  </label>
                  <input
                    type="number"
                    value={config?.database.maxConnections}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      database: { ...prev.database, maxConnections: parseInt(e.target.value) }
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Backup Frequency
                  </label>
                  <select
                    value={config?.database.backupFrequency}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      database: { ...prev.database, backupFrequency: e.target.value }
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
              
              {/* Database Status Monitoring */}
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Database Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Schema Status</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        config?.database.schemaStatus === 'refreshed' 
                          ? 'bg-green-100 text-green-800' 
                          : config?.database.schemaStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {config?.database.schemaStatus || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Connection</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        config?.database.connectionStatus === 'connected' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {config?.database.connectionStatus || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Tables</span>
                      <span className="text-sm text-gray-900">{config?.database.tableCount || 0}</span>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Last Migration</span>
                      <span className="text-sm text-gray-900">{config?.database.lastMigration || 'Unknown'}</span>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Cache Refresh</span>
                      <span className="text-sm text-gray-900">{config?.database.cacheRefreshTime || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/admin/schema-status', {
                          headers: {
                            'Authorization': 'Bearer admin-access',
                            'Content-Type': 'application/json'
                          }
                        });
                        
                        if (response.ok) {
                          const status = await response.json();
                          alert(`Schema Status: ${status.schemaStatus}\nMessage: ${status.statusMessage}`);
                        } else {
                          alert('Failed to check schema status');
                        }
                      } catch (error) {
                        // narrow 'unknown' → Error
                        const err = error instanceof Error ? error : new Error(String(error));
                        logger.error('Error checking schema status:', err);
                        alert('Error checking schema status');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Check Schema Status
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/admin/schema-status', {
                          method: 'POST',
                          headers: {
                            'Authorization': 'Bearer admin-access',
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ action: 'refresh_cache' })
                        });
                        
                        if (response.ok) {
                          const result = await response.json();
                          alert(`Cache Refresh: ${result.success ? 'Success' : 'Failed'}\nMessage: ${result.message}`);
                        } else {
                          alert('Failed to refresh cache');
                        }
                      } catch (error) {
                        // narrow 'unknown' → Error
                        const err = error instanceof Error ? error : new Error(String(error));
                        logger.error('Error refreshing cache:', err);
                        alert('Error refreshing cache');
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Refresh Cache
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Performance Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cache Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={config?.performance.cacheDuration}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      performance: { ...prev.performance, cacheDuration: parseInt(e.target.value) }
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Upload Size (bytes)
                  </label>
                  <input
                    type="number"
                    value={config?.performance.maxUploadSize}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      performance: { ...prev.performance, maxUploadSize: parseInt(e.target.value) }
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate Limit Requests
                  </label>
                  <input
                    type="number"
                    value={config?.performance.rateLimitRequests}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      performance: { ...prev.performance, rateLimitRequests: parseInt(e.target.value) }
                    } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Enable Caching</h4>
                    <p className="text-sm text-gray-500">Cache frequently accessed data for better performance</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config?.performance.cacheEnabled}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      performance: { ...prev.performance, cacheEnabled: e.target.checked }
                    } : null)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Enable Compression</h4>
                    <p className="text-sm text-gray-500">Compress responses to reduce bandwidth usage</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config?.performance.compressionEnabled}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      performance: { ...prev.performance, compressionEnabled: e.target.checked }
                    } : null)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Enable Rate Limiting</h4>
                    <p className="text-sm text-gray-500">Limit API requests to prevent abuse</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config?.performance.rateLimitEnabled}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      performance: { ...prev.performance, rateLimitEnabled: e.target.checked }
                    } : null)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-500">Send notifications via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config?.notifications.emailNotifications}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, emailNotifications: e.target.checked }
                    } : null)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Push Notifications</h4>
                    <p className="text-sm text-gray-500">Send push notifications to users</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config?.notifications.pushNotifications}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, pushNotifications: e.target.checked }
                    } : null)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Admin Alerts</h4>
                    <p className="text-sm text-gray-500">Send alerts to administrators</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config?.notifications.adminAlerts}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, adminAlerts: e.target.checked }
                    } : null)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">User Registration Alerts</h4>
                    <p className="text-sm text-gray-500">Notify admins when new users register</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config?.notifications.userRegistrationAlerts}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, userRegistrationAlerts: e.target.checked }
                    } : null)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">System Error Alerts</h4>
                    <p className="text-sm text-gray-500">Notify admins of system errors</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config?.notifications.systemErrorAlerts}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      notifications: { ...prev.notifications, systemErrorAlerts: e.target.checked }
                    } : null)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
