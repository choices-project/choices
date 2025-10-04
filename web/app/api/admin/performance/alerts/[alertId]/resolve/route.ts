// Admin Performance Alert Resolution API
// Allows admins to resolve performance alerts
// Created: October 2, 2025

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdminOr401 } from '@/lib/admin-auth';
import { performanceMonitor } from '@/lib/admin/performance-monitor';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    // Admin authentication
    const authGate = await requireAdminOr401();
    if (authGate) return authGate;

    const { alertId } = params;

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
    logger.error('Error resolving performance alert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
