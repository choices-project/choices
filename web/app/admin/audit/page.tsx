/**
 * Audit Logs Page
 * 
 * Admin interface for viewing system audit trails and security events.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  RefreshCw,
  AlertTriangle,
  Info,
  XCircle,
  Clock,
  User,
  Shield,
  Database,
  Activity,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'security';
  category: 'user' | 'system' | 'security' | 'database' | 'api';
  action: string;
  description: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  source: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'security'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'user' | 'system' | 'security' | 'database' | 'api'>('all');
  const [dateRange, setDateRange] = useState('24h');
  const [showMetadata, setShowMetadata] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchAuditLogs = () => {
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          timestamp: '2024-12-19 14:30:25',
          level: 'security',
          category: 'security',
          action: 'LOGIN_ATTEMPT',
          description: 'Failed login attempt for user admin@choices.com',
          userId: 'user-123',
          userEmail: 'admin@choices.com',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          metadata: { attempts: 3, reason: 'Invalid password' },
          source: 'web'
        },
        {
          id: '2',
          timestamp: '2024-12-19 14:25:10',
          level: 'info',
          category: 'user',
          action: 'USER_REGISTRATION',
          description: 'New user registered: john.doe@example.com',
          userId: 'user-456',
          userEmail: 'john.doe@example.com',
          ipAddress: '203.0.113.45',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          metadata: { verificationRequired: true },
          source: 'web'
        },
        {
          id: '3',
          timestamp: '2024-12-19 14:20:15',
          level: 'warning',
          category: 'system',
          action: 'HIGH_CPU_USAGE',
          description: 'CPU usage exceeded 80% threshold',
          metadata: { cpuUsage: 85, memoryUsage: 72 },
          source: 'system'
        },
        {
          id: '4',
          timestamp: '2024-12-19 14:15:30',
          level: 'info',
          category: 'database',
          action: 'BACKUP_COMPLETED',
          description: 'Database backup completed successfully',
          metadata: { size: '2.4GB', duration: '5m 23s' },
          source: 'system'
        },
        {
          id: '5',
          timestamp: '2024-12-19 14:10:45',
          level: 'error',
          category: 'api',
          action: 'API_RATE_LIMIT_EXCEEDED',
          description: 'API rate limit exceeded for IP 203.0.113.45',
          ipAddress: '203.0.113.45',
          metadata: { requests: 150, limit: 100 },
          source: 'api'
        },
        {
          id: '6',
          timestamp: '2024-12-19 14:05:20',
          level: 'security',
          category: 'security',
          action: 'PASSWORD_CHANGE',
          description: 'Password changed for user jane.smith@example.com',
          userId: 'user-789',
          userEmail: 'jane.smith@example.com',
          ipAddress: '198.51.100.67',
          metadata: { changeReason: 'user_request' },
          source: 'web'
        },
        {
          id: '7',
          timestamp: '2024-12-19 14:00:10',
          level: 'info',
          category: 'user',
          action: 'POLL_CREATED',
          description: 'New poll created: "Favorite Programming Language 2024"',
          userId: 'user-123',
          userEmail: 'admin@choices.com',
          metadata: { pollId: 'poll-001', category: 'Technology' },
          source: 'web'
        },
        {
          id: '8',
          timestamp: '2024-12-19 13:55:30',
          level: 'warning',
          category: 'database',
          action: 'SLOW_QUERY',
          description: 'Slow database query detected',
          metadata: { query: 'SELECT * FROM votes', duration: '2.5s' },
          source: 'database'
        }
      ];

      setLogs(mockLogs);
      setFilteredLogs(mockLogs);
      setLoading(false);
    };

    fetchAuditLogs();
  }, []);

  // Filter logs based on search and filters
  useEffect(() => {
    let filtered = logs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ipAddress?.includes(searchTerm)
      );
    }

    // Level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(log => log.category === categoryFilter);
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, levelFilter, categoryFilter]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'security':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'error':
        return <XCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'api':
        return <Activity className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">System audit trails and security events</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export Logs</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Security Events</p>
              <p className="text-2xl font-bold text-red-600">
                {logs.filter(log => log.level === 'security').length}
              </p>
            </div>
            <Shield className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-red-600">
                {logs.filter(log => log.level === 'error').length}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Warnings</p>
              <p className="text-2xl font-bold text-yellow-600">
                {logs.filter(log => log.level === 'warning').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs by description, action, email, or IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Levels</option>
              <option value="security">Security</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="user">User</option>
              <option value="system">System</option>
              <option value="security">Security</option>
              <option value="database">Database</option>
              <option value="api">API</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          {/* Metadata Toggle */}
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              showMetadata 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {showMetadata ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>Metadata</span>
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{log.timestamp}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${getLevelColor(log.level)}`}>
                      {getLevelIcon(log.level)}
                      <span className="ml-1">{log.level}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(log.category)}
                      <span className="text-sm text-gray-900">{log.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <p>{log.description}</p>
                      {showMetadata && log.metadata && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                            View Metadata
                          </summary>
                          <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.userEmail ? (
                      <div>
                        <p className="font-medium">{log.userEmail}</p>
                        {log.userId && <p className="text-xs text-gray-500">{log.userId}</p>}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.ipAddress || <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {log.source}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {filteredLogs.length} of {logs.length} logs
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Previous
          </button>
          <button className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md">
            1
          </button>
          <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
