// Admin Performance Alert Resolution API
// Allows admins to resolve performance alerts
// Created: October 2, 2025

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { performanceMonitor } from '@/features/admin/lib/performance-monitor';
import { requireAdminOr401 } from '@/features/auth/lib/admin-auth';
import { logger } from '@/lib/utils/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  try {
    const { alertId } = await params;
    // Admin authentication
    const authGate = await requireAdminOr401();
    if (authGate) return authGate;

    // Resolve the alert
    const resolved = performanceMonitor.resolveAlert(alertId);

    if (!resolved) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    logger.info('Performance alert resolved', { alertId });

    return NextResponse.json({
      success: true,
      message: 'Alert resolved successfully'
    });

  } catch (error) {
    logger.error('Error resolving performance alert:', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
