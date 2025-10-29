/**
 * Enhanced Analytics Dashboard Component
 * Integrates new schema capabilities with existing analytics
 * Created: 2025-10-27
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Loader2, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  Activity, 
  HeartPulse, 
  MessageSquare, 
  Bell,
  Shield,
  Zap,
  Database,
  BarChart3
} from 'lucide-react';
import { useEnhancedAnalytics } from '../hooks/useEnhancedAnalytics';
import { logger } from '@/lib/utils/logger';

interface EnhancedAnalyticsDashboardProps {
  pollId?: string;
  userId?: string;
  sessionId?: string;
  enableRealTime?: boolean;
  enableNewSchema?: boolean;
  className?: string;
}

export const EnhancedAnalyticsDashboard: React.FC<EnhancedAnalyticsDashboardProps> = ({
  pollId,
  userId,
  sessionId,
  enableRealTime = true,
  enableNewSchema = true,
  className = ''
}) => {
  const {
    data,
    loading,
    error,
    lastUpdated,
    fetchAnalytics,
    trackFeatureUsage,
    getSystemHealth,
    getActiveSiteMessages,
    refresh
  } = useEnhancedAnalytics({
    pollId,
    userId,
    sessionId,
    enableRealTime,
    enableNewSchema
  });

  const [systemHealth, setSystemHealth] = useState<any[]>([]);
  const [siteMessages, setSiteMessages] = useState<any[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  // Load additional data
  useEffect(() => {
    const loadAdditionalData = async () => {
      try {
        const [health, messages] = await Promise.all([
          getSystemHealth(),
          getActiveSiteMessages()
        ]);
        setSystemHealth(health);
        setSiteMessages(messages);
      } catch (err) {
        logger.error('Error loading additional data:', err);
      }
    };

    loadAdditionalData();
  }, [getSystemHealth, getActiveSiteMessages]);

  // Track dashboard usage
  useEffect(() => {
    trackFeatureUsage('enhanced_analytics_dashboard', 'view', {
      pollId,
      userId,
      enableNewSchema
    });
  }, [trackFeatureUsage, pollId, userId, enableNewSchema]);

  if (loading && !data) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading Enhanced Analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 text-red-600 bg-red-100 border border-red-400 rounded-md ${className}`}>
        <AlertCircle className="inline-block mr-2" />
        Error: {error}
        <Button onClick={refresh} className="ml-4">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`p-4 text-gray-600 bg-gray-100 border border-gray-400 rounded-md ${className}`}>
        <Info className="inline-block mr-2" />
        No analytics data available.
        <Button onClick={refresh} className="ml-4">
          <RefreshCw className="h-4 w-4 mr-2" /> Load Data
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            {enableNewSchema ? 'Powered by new schema capabilities' : 'Standard analytics view'}
            {lastUpdated && ` • Last updated: ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowDetails(!showDetails)}
            variant="outline"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
          <Button onClick={refresh} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2 flex-wrap">
        {enableNewSchema && (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <Database className="h-3 w-3 mr-1" />
            New Schema Enabled
          </Badge>
        )}
        {enableRealTime && (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            <Zap className="h-3 w-3 mr-1" />
            Real-time Updates
          </Badge>
        )}
        {data.enhancedInsights && (
          <Badge variant="default" className="bg-purple-100 text-purple-800">
            <BarChart3 className="h-3 w-3 mr-1" />
            Enhanced Insights
          </Badge>
        )}
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.activeUsers} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalPolls}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.newPolls} new this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalVotes}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.newVotes} new this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <HeartPulse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.engagementScore}%</div>
            <p className="text-xs text-muted-foreground">
              Trust score: {data.summary.trustScore}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Insights */}
      {data.enhancedInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Enhanced Insights
            </CardTitle>
            <CardDescription>
              Advanced analytics powered by new schema capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Bot Detection */}
              {data.enhancedInsights.botDetectionResults && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Bot Detection
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Risk Score: {data.enhancedInsights.botDetectionResults.riskScore || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Confidence: {data.enhancedInsights.botDetectionResults.confidence || 0}%
                  </p>
                </div>
              )}

              {/* Trust Tier Distribution */}
              {data.enhancedInsights.trustTierDistribution && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Trust Tiers
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Analysis complete
                  </p>
                </div>
              )}

              {/* Platform Metrics */}
              {data.enhancedInsights.platformMetrics && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Platform Metrics
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {data.enhancedInsights.platformMetrics.length} data points
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Insights */}
      {data.sessionInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Session Analytics
            </CardTitle>
            <CardDescription>
              Real-time session tracking and user behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{data.sessionInsights.sessionMetrics.totalActions}</div>
                <p className="text-sm text-muted-foreground">Total Actions</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.floor(data.sessionInsights.sessionMetrics.sessionDuration / 60)}m</div>
                <p className="text-sm text-muted-foreground">Session Duration</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{data.sessionInsights.sessionMetrics.deviceType}</div>
                <p className="text-sm text-muted-foreground">Device Type</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{data.sessionInsights.sessionMetrics.pageViews}</div>
                <p className="text-sm text-muted-foreground">Page Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health */}
      {systemHealth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {systemHealth.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{check.check_name}</span>
                  <Badge 
                    variant={check.status === 'ok' ? 'default' : check.status === 'warning' ? 'secondary' : 'destructive'}
                    className={
                      check.status === 'ok' ? 'bg-green-100 text-green-800' :
                      check.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }
                  >
                    {check.status === 'ok' ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                    {check.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Site Messages */}
      {siteMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Active Site Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {siteMessages.map((message, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{message.title}</h4>
                    <Badge variant="outline">{message.priority}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{message.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed View */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Analytics Data</CardTitle>
            <CardDescription>
              Raw analytics data for debugging and analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedAnalyticsDashboard;


