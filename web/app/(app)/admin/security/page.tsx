 'use client'

import { RefreshCw, Shield, AlertTriangle, Users, Activity } from 'lucide-react';
import React, { useState, useEffect } from 'react';


import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Admin Security Dashboard
 * 
 * Real-time monitoring of rate limiting and security events
 * 
 * Created: 2025-10-29
 * Status: In Progress
 */


type SecurityMetrics = {
  totalViolations: number;
  violationsLastHour: number;
  violationsLast24Hours: number;
  topViolatingIPs: Array<{ ip: string; count: number }>;
  violationsByEndpoint: Record<string, number>;
}

type RateLimitConfig = {
  enabled: boolean;
  windowMs: number;
  maxRequests: number;
  sensitiveEndpoints: Record<string, number>;
}

type SecurityData = {
  timestamp: string;
  rateLimiting: RateLimitConfig;
  metrics: SecurityMetrics;
  recentViolations: Array<{
    ip: string;
    endpoint: string;
    timestamp: string;
    count: number;
    maxRequests: number;
    userAgent?: string;
  }>;
}

export default function AdminSecurityPage() {
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/security/monitoring', {
        headers: {
          'x-admin-key': 'dev-admin-key' // In production, use proper auth
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json() as { success: boolean; data?: SecurityData; error?: string };
      if (result.success && result.data) {
        setData(result.data);
        setLastUpdated(new Date());
        setError(null);
      } else {
        throw new Error(result.error ?? 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Error already handled by setError
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    const interval = setInterval(() => void fetchData(), 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSeverityColor = (count: number) => {
    if (count > 100) return 'destructive';
    if (count > 50) return 'destructive';
    if (count > 10) return 'secondary';
    return 'default';
  };

  if (loading && !data) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading security data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load security data: {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={() => void fetchData()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Security Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time monitoring of rate limiting and security events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => void fetchData()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Rate Limiting Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Rate Limiting Status
          </CardTitle>
          <CardDescription>
            Current configuration and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Status</div>
              <Badge variant={data.rateLimiting.enabled ? 'default' : 'secondary'}>
                {data.rateLimiting.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Window</div>
              <div className="text-sm text-muted-foreground">
                {Math.round(data.rateLimiting.windowMs / 1000 / 60)} minutes
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Default Limit</div>
              <div className="text-sm text-muted-foreground">
                {data.rateLimiting.maxRequests} requests
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.totalViolations}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.violationsLastHour}</div>
            <p className="text-xs text-muted-foreground">Recent activity</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last 24 Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.violationsLast24Hours}</div>
            <p className="text-xs text-muted-foreground">Daily activity</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Violating IPs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.topViolatingIPs.length}</div>
            <p className="text-xs text-muted-foreground">Unique IPs</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Violating IPs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Violating IPs
          </CardTitle>
          <CardDescription>
            IPs with the most rate limit violations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.metrics.topViolatingIPs.length > 0 ? (
            <div className="space-y-2">
              {data.metrics.topViolatingIPs.slice(0, 10).map((ip, index) => (
                <div key={ip.ip} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{ip.ip}</span>
                    <Badge variant={getSeverityColor(ip.count)}>
                      {ip.count} violations
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">#{index + 1}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              No violations recorded
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Violations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Violations</CardTitle>
          <CardDescription>
            Latest rate limit violations in the last 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentViolations.length > 0 ? (
            <div className="space-y-2">
              {data.recentViolations.slice(0, 20).map((violation, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">{violation.ip}</span>
                      <Badge variant="outline">{violation.endpoint}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTimestamp(violation.timestamp)} • 
                      {violation.count}/{violation.maxRequests} requests
                    </div>
                    {violation.userAgent && (
                      <div className="text-xs text-muted-foreground truncate max-w-md">
                        {violation.userAgent}
                      </div>
                    )}
                  </div>
                  <Badge variant={getSeverityColor(violation.count)}>
                    Blocked
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              No recent violations
            </div>
          )}
        </CardContent>
      </Card>

      {/* Endpoint Violations */}
      <Card>
        <CardHeader>
          <CardTitle>Violations by Endpoint</CardTitle>
          <CardDescription>
            Rate limit violations grouped by API endpoint
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(data.metrics.violationsByEndpoint).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(data.metrics.violationsByEndpoint)
                .sort(([,a], [,b]) => b - a)
                .map(([endpoint, count]) => (
                <div key={endpoint} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm font-mono">{endpoint}</span>
                  <Badge variant={getSeverityColor(count)}>
                    {count} violations
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              No endpoint violations recorded
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
