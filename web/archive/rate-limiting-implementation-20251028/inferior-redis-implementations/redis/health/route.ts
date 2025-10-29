/**
 * Redis Health Check API
 * 
 * Provides Redis connection health and performance metrics
 * 
 * Created: 2025-10-29
 * Status: In Progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { redisHealthChecker } from '@/lib/redis/health';
import { redisClient } from '@/lib/redis/client';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    // Check if request is from admin (in production, add proper auth)
    const adminKey = process.env.ADMIN_MONITORING_KEY || 'dev-admin-key';
    const isAdmin = request.headers.get('x-admin-key') === adminKey;
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const healthStatus = await redisHealthChecker.getCurrentHealthStatus();
    
    const response = {
      timestamp: new Date().toISOString(),
      redis: {
        available: redisClient.isAvailable(),
        health: healthStatus,
        config: {
          enabled: process.env.REDIS_HOST || process.env.REDIS_URL ? true : false,
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || '6379',
          db: process.env.REDIS_DB || '0'
        }
      }
    };

    logger.info('Redis health check requested', {
      isHealthy: healthStatus.isHealthy,
      isConnected: healthStatus.isConnected,
      latency: healthStatus.latency
    });

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    logger.error('Error fetching Redis health data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
