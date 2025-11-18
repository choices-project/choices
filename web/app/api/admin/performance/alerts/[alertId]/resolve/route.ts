import type { NextRequest } from 'next/server';

import { performanceMonitor } from '@/features/admin/lib/performance-monitor';
import { requireAdminOr401 } from '@/features/auth/lib/admin-auth';
import { withErrorHandling, successResponse, notFoundError } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) => {
  const { alertId } = await params;
  const authGate = await requireAdminOr401();
  if (authGate) return authGate;

  const resolved = performanceMonitor.resolveAlert(alertId);

  if (!resolved) {
    return notFoundError('Alert not found');
  }

  logger.info('Performance alert resolved', { alertId });

  return successResponse({
    message: 'Alert resolved successfully'
  });
});
