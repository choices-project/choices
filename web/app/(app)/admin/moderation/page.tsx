'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { AlertTriangle, Shield, RefreshCw } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { logger } from '@/lib/utils/logger';

type ModerationReport = {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  details?: string | null;
  status: string;
  created_at?: string | null;
};

type ModerationAppeal = {
  id: string;
  action_id: string;
  user_id: string;
  status: string;
  message: string;
  created_at?: string | null;
};

const STATUS_OPTIONS = ['open', 'in_review', 'resolved', 'dismissed'] as const;
const APPEAL_STATUS_OPTIONS = ['open', 'reviewing', 'resolved', 'rejected'] as const;

export default function ModerationPage() {
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [appeals, setAppeals] = useState<ModerationAppeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionTargetType, setActionTargetType] = useState('user');
  const [actionTargetId, setActionTargetId] = useState('');
  const [actionType, setActionType] = useState('warn');
  const [actionReason, setActionReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchReports = useCallback(async () => {
    const response = await fetch('/api/admin/moderation/reports', { credentials: 'include' });
    if (!response.ok) {
      throw new Error('Failed to load moderation reports');
    }
    const payload = await response.json();
    return (payload?.data?.reports ?? []) as ModerationReport[];
  }, []);

  const fetchAppeals = useCallback(async () => {
    const response = await fetch('/api/admin/moderation/appeals', { credentials: 'include' });
    if (!response.ok) {
      throw new Error('Failed to load moderation appeals');
    }
    const payload = await response.json();
    return (payload?.data?.appeals ?? []) as ModerationAppeal[];
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      setError(null);
      setIsRefreshing(true);
      const [reportData, appealData] = await Promise.all([fetchReports(), fetchAppeals()]);
      setReports(reportData);
      setAppeals(appealData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh moderation data';
      setError(message);
      logger.error('Failed to refresh moderation data', err instanceof Error ? err : new Error(message));
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [fetchAppeals, fetchReports]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const handleReportStatusChange = async (reportId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/moderation/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update report status');
      }

      setReports((prev) => prev.map((report) => report.id === reportId ? { ...report, status } : report));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update report';
      setError(message);
      logger.error('Failed to update report status', err instanceof Error ? err : new Error(message));
    }
  };

  const handleAppealStatusChange = async (appealId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/moderation/appeals/${appealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update appeal status');
      }

      setAppeals((prev) => prev.map((appeal) => appeal.id === appealId ? { ...appeal, status } : appeal));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update appeal';
      setError(message);
      logger.error('Failed to update appeal status', err instanceof Error ? err : new Error(message));
    }
  };

  const handleCreateAction = async () => {
    if (!actionTargetId.trim()) {
      setError('Target ID is required to create an action');
      return;
    }

    try {
      setActionSubmitting(true);
      const response = await fetch('/api/admin/moderation/actions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: actionTargetType,
          target_id: actionTargetId.trim(),
          action: actionType,
          reason: actionReason.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create moderation action');
      }

      setActionTargetId('');
      setActionReason('');
      await refreshAll();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create action';
      setError(message);
      logger.error('Failed to create moderation action', err instanceof Error ? err : new Error(message));
    } finally {
      setActionSubmitting(false);
    }
  };

  const openReports = useMemo(
    () => reports.filter((report) => report.status === 'open').length,
    [reports],
  );
  const openAppeals = useMemo(
    () => appeals.filter((appeal) => appeal.status === 'open').length,
    [appeals],
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Moderation Queue</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review community reports, manage actions, and resolve appeals.
          </p>
        </div>
        <Button variant="outline" onClick={refreshAll} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Open Reports</CardTitle>
            <Badge variant="secondary">{openReports}</Badge>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 dark:text-gray-400">
            Reports awaiting review or triage.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Open Appeals</CardTitle>
            <Badge variant="secondary">{openAppeals}</Badge>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 dark:text-gray-400">
            Appeals awaiting a moderation decision.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading reports...</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No reports yet.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {report.target_type} • {report.reason}
                      </p>
                      <p className="text-xs text-gray-500">
                        {report.created_at ? new Date(report.created_at).toLocaleString() : 'Unknown time'}
                      </p>
                    </div>
                    <Select
                      value={report.status}
                      onValueChange={(value) => handleReportStatusChange(report.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {report.details && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{report.details}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">Target ID: {report.target_id}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Action Ladder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Target type</label>
              <select
                value={actionTargetType}
                onChange={(event) => setActionTargetType(event.target.value)}
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="user">User</option>
                <option value="poll">Poll</option>
                <option value="comment">Comment</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Target ID</label>
              <input
                value={actionTargetId}
                onChange={(event) => setActionTargetId(event.target.value)}
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="UUID or entity ID"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Action</label>
              <select
                value={actionType}
                onChange={(event) => setActionType(event.target.value)}
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="warn">Warn</option>
                <option value="throttle">Throttle</option>
                <option value="shadow_limit">Shadow limit</option>
                <option value="suspend">Suspend</option>
                <option value="require_verification">Require verification</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Reason (optional)</label>
              <input
                value={actionReason}
                onChange={(event) => setActionReason(event.target.value)}
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Reason for action"
              />
            </div>
          </div>
          <Button onClick={handleCreateAction} disabled={actionSubmitting}>
            {actionSubmitting ? 'Applying...' : 'Apply action'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Appeals</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading appeals...</p>
          ) : appeals.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">No appeals submitted.</p>
          ) : (
            <div className="space-y-3">
              {appeals.map((appeal) => (
                <div key={appeal.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Appeal</p>
                      <p className="text-xs text-gray-500">
                        {appeal.created_at ? new Date(appeal.created_at).toLocaleString() : 'Unknown time'}
                      </p>
                    </div>
                    <Select
                      value={appeal.status}
                      onValueChange={(value) => handleAppealStatusChange(appeal.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {APPEAL_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{appeal.message}</p>
                  <p className="mt-2 text-xs text-gray-500">Action ID: {appeal.action_id}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
