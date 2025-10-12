// Admin Performance Monitoring API
// Provides real-time performance metrics, alerts, and optimization recommendations
// Created: October 2, 2025

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { performanceMonitor } from '@/features/admin/lib/performance-monitor';
import { requireAdminOr401 } from '@/features/auth/lib/admin-auth';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    // Admin authentication
    const authGate = await requireAdminOr401();
    if (authGate) return authGate;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '1h';

    // Convert period to milliseconds
    const periodMs = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000
    }[period] || 60 * 60 * 1000;

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

    return NextResponse.json({
      success: true,
      data: performanceReport,
      systemHealth,
      alerts: alerts.filter(a => !a.resolved)
    });

  } catch (error) {
    logger.error('Error in performance monitoring API:', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin authentication
    const authGate = await requireAdminOr401();
    if (authGate) return authGate;

    const body = await request.json();
    const { operation, duration, success, error, metadata } = body;

    // Track performance metric
    performanceMonitor.trackOperation(operation, duration, success, error, metadata);

    logger.info('Performance metric recorded', {
      operation,
      duration,
      success,
      error
    });

    return NextResponse.json({
      success: true,
      message: 'Performance metric recorded'
    });

  } catch (error) {
    logger.error('Error recording performance metric:', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}