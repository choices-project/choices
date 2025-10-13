import * as dotenv from 'dotenv';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { requireServiceKey } from '@/features/auth/lib/service-auth';
import { getRateLimitStatus, getAPIStatus } from '@/lib/rate-limiting';
import { logger } from '@/lib/utils/logger';

// Type definitions for rate limit status
interface RateLimitUsage {
  requestsToday: number;
  requestsThisMinute: number;
  rateLimit: {
    daily: number;
    perMinute: number;
  };
}

interface RateLimitStatus {
  canMakeRequest: boolean;
  delayNeeded: number;
  usage: RateLimitUsage;
}

// Load environment variables
dotenv.config({ path: '.env.local' });

export async function GET(request: NextRequest) {
  try {
    // Log the request for debugging
    logger.debug('Rate limit status requested', { userAgent: request.headers.get('user-agent') });
    
    // Require service key authentication
    const serviceCheck = await requireServiceKey();
    if (serviceCheck) return serviceCheck;
    
    const rateLimitStatus = getRateLimitStatus() as Record<string, RateLimitStatus>;
    const apiUsage = getAPIStatus();
    
    // Log API usage for debugging
    logger.debug('Current API usage', { count: Object.keys(apiUsage).length, note: 'APIs tracked' });
    
    // Calculate overall health
    const totalAPIs = Object.keys(rateLimitStatus).length;
    const healthyAPIs = Object.values(rateLimitStatus).filter(status => status.canMakeRequest).length;
    const healthPercentage = Math.round((healthyAPIs / totalAPIs) * 100);
    
    // Find APIs that need delays
    const delayedAPIs = Object.entries(rateLimitStatus)
      .filter(([_, status]) => status.delayNeeded > 0)
      .map(([api, status]) => ({
        api,
        delayNeeded: Math.ceil(status.delayNeeded / 1000),
        usage: status.usage
      }));
    
    // Find APIs at risk of hitting limits
    const atRiskAPIs = Object.entries(rateLimitStatus)
      .filter(([_, status]) => {
        const usage = status.usage;
        const dailyRisk = usage.requestsToday / usage.rateLimit.daily > 0.8;
        const minuteRisk = usage.requestsThisMinute / usage.rateLimit.perMinute > 0.8;
        return dailyRisk || minuteRisk;
      })
      .map(([api, status]) => ({
        api,
        dailyUsage: `${status.usage.requestsToday}/${status.usage.rateLimit.daily}`,
        minuteUsage: `${status.usage.requestsThisMinute}/${status.usage.rateLimit.perMinute}`,
        riskLevel: status.usage.requestsToday / status.usage.rateLimit.daily > 0.9 ? 'HIGH' : 'MEDIUM'
      }));
    
    return NextResponse.json({
      success: true,
      message: 'Rate limit status retrieved',
      health: {
        overall: healthPercentage,
        healthyAPIs,
        totalAPIs,
        status: healthPercentage > 80 ? 'HEALTHY' : healthPercentage > 50 ? 'WARNING' : 'CRITICAL'
      },
      rateLimits: rateLimitStatus,
      delayedAPIs,
      atRiskAPIs,
      recommendations: [
        ...(delayedAPIs.length > 0 ? [`Wait for ${delayedAPIs.map(d => `${d.api} (${d.delayNeeded}s)`).join(', ')}`] : []),
        ...(atRiskAPIs.length > 0 ? [`Monitor ${atRiskAPIs.map(a => a.api).join(', ')} for rate limit risks`] : []),
        ...(healthPercentage < 50 ? ['Consider reducing ingestion frequency'] : []),
        ...(healthPercentage > 80 ? ['System is healthy for continued operation'] : [])
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Rate limit status check failed:', error);
    return NextResponse.json({
      success: false,
      error: `Rate limit status check failed: ${error}`
    }, { status: 500 });
  }
}
