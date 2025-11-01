/**
 * Security Monitoring API
 * 
 * Provides security monitoring data including rate limiting metrics
 * and violation statistics for admin dashboard
 * 
 * Created: 2025-10-29
 * Status: In Progress
 */

import { type NextRequest, NextResponse } from 'next/server';

import { getSecurityConfig } from '@/lib/core/security/config';
import { upstashRateLimiter } from '@/lib/rate-limiting/upstash-rate-limiter';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    // Check if request is from admin (in production, add proper auth)
    const adminKey = process.env.ADMIN_MONITORING_KEY ?? 'dev-admin-key';
    const isAdmin = request.headers.get('x-admin-key') === adminKey;
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get metrics from Upstash-backed rate limiter
    const metrics = await upstashRateLimiter.getMetrics();
    const securityConfig = getSecurityConfig();
    
    // Get recent violations (last 24 hours)
    const allViolations = await upstashRateLimiter.getAllViolations();
    
    // Debug logging
    logger.info(`MONITORING API: Total violations in monitor: ${allViolations.length}`);
    logger.info(`MONITORING API: Metrics totalViolations: ${metrics.totalViolations}`);
    const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
    const recentViolations24h = allViolations.filter(
      (v: any) => v.timestamp > last24Hours
    );

    const response = {
      timestamp: new Date().toISOString(),
      rateLimiting: {
        enabled: securityConfig.rateLimit.enabled,
        windowMs: securityConfig.rateLimit.windowMs,
        maxRequests: securityConfig.rateLimit.maxRequests,
        sensitiveEndpoints: securityConfig.rateLimit.sensitiveEndpoints
      },
      metrics: {
        totalViolations: metrics.totalViolations,
        violationsLastHour: metrics.violationsLastHour,
        violationsLast24Hours: recentViolations24h.length,
        topViolatingIPs: metrics.topViolatingIPs,
        violationsByEndpoint: Object.fromEntries(metrics.violationsByEndpoint)
      },
      recentViolations: recentViolations24h.slice(0, 50).map((v: any) => ({
        ip: v.ip,
        endpoint: v.endpoint,
        timestamp: new Date(v.timestamp),
        count: v.count,
        maxRequests: v.maxRequests,
        userAgent: v.userAgent
      }))
    };

    logger.info('Security monitoring data requested', {
      totalViolations: metrics.totalViolations,
      violationsLastHour: metrics.violationsLastHour
    });

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    logger.error('Security monitoring API error:', error instanceof Error ? error : new Error('Unknown error'));
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
