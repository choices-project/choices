
import { performanceMonitor } from '@/features/admin/lib/performance-monitor';
import { requireAdminOr401 } from '@/features/auth/lib/admin-auth';

import { withErrorHandling, successResponse, validationError } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const authGate = await requireAdminOr401();
  if (authGate) return authGate;

  const { searchParams } = new URL(request.url);
  const period = (searchParams.get('period') ?? '1h').toLowerCase();
  const includeResolved = searchParams.get('includeResolved') === 'true';

  const allowedPeriods: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
  };

  if (!allowedPeriods[period]) {
    return validationError({
      period: 'Invalid period. Allowed values: 1h, 6h, 24h',
    });
  }

  const periodMs = allowedPeriods[period];

  const performanceReport = performanceMonitor.getPerformanceReport(periodMs);
  const systemHealth = performanceMonitor.getSystemHealthScore();
  const alerts = performanceMonitor.getAlerts();

  logger.info('Performance data requested', {
    period,
    totalOperations: performanceReport.totalOperations,
    systemHealth,
    alertsCount: alerts.length,
    includeResolved,
  });

  return successResponse({
    report: performanceReport,
    systemHealth,
    alerts: includeResolved ? alerts : alerts.filter((alert) => !alert.resolved),
    period,
    periodMs,
  });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const authGate = await requireAdminOr401();
  if (authGate) return authGate;

  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body.operation !== 'string' ||
    typeof body.duration !== 'number' ||
    typeof body.success !== 'boolean'
  ) {
    return validationError({
      operation: 'operation (string) is required',
      duration: 'duration (number) is required',
      success: 'success (boolean) is required',
    });
  }

  const { operation, duration, success, error, metadata } = body;

  performanceMonitor.trackOperation(operation, duration, success, error, metadata);

  logger.info('Performance metric recorded', {
    operation,
    duration,
    success,
    error
  });

  return successResponse(
    {
      operation,
      recorded: true,
      timestamp: new Date().toISOString(),
    },
    undefined,
    201
  );
});