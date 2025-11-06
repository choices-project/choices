import type { NextRequest } from 'next/server';

import { performanceMonitor } from '@/features/admin/lib/performance-monitor';
import { requireAdminOr401 } from '@/features/auth/lib/admin-auth';
import { withErrorHandling, successResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const authGate = await requireAdminOr401();
  if (authGate) return authGate;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') ?? '1h';

    // Convert period to milliseconds
    const periodMs = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000
    }[period] ?? 60 * 60 * 1000;

    // Get performance report
    const performanceReport = performanceMonitor.getPerformanceReport(periodMs);
    const systemHealth = performanceMonitor.getSystemHealthScore();
    const alerts = performanceMonitor.getAlerts();

    logger.info('Performance data requested', {
      period,
      totalOperations: performanceReport.totalOperations,
      systemHealth,
      alertsCount: alerts.length
    });

  return successResponse({
    data: performanceReport,
    systemHealth,
    alerts: alerts.filter(a => !a.resolved)
  });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const authGate = await requireAdminOr401();
  if (authGate) return authGate;

  const body = await request.json();
  const { operation, duration, success, error, metadata } = body;

  performanceMonitor.trackOperation(operation, duration, success, error, metadata);

  logger.info('Performance metric recorded', {
    operation,
    duration,
    success,
    error
  });

  return successResponse({
    message: 'Performance metric recorded'
  }, undefined, 201);
});