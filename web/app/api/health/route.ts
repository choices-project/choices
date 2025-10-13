/**
 * Consolidated Health Check API Endpoint
 * 
 * This endpoint consolidates all health check functionality:
 * - Basic health check
 * - Database health with auth/rate limiting
 * - Supabase connection status
 * - Civics system status
 * 
 * Usage:
 * GET /api/health - Basic health check
 * GET /api/health?type=database - Database health with performance metrics
 * GET /api/health?type=supabase - Supabase connection status
 * GET /api/health?type=civics - Civics system status
 * GET /api/health?type=all - All health checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { isCivicsEnabled } from '@/features/civics/lib/civics/privacy-utils';
import { createRateLimitMiddleware, combineMiddleware } from '@/lib/core/auth/middleware';
import { getQueryOptimizer } from '@/lib/core/database/optimizer';
import { logger } from '@/lib/utils/logger';

// Rate limiting: 30 requests per minute per IP
const rateLimitMiddleware = createRateLimitMiddleware({
  maxRequests: 30,
  windowMs: 60 * 1000
});

// Combined middleware: rate limiting + optional auth
const middleware = combineMiddleware(rateLimitMiddleware);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'basic';
    
    // Apply rate limiting for database and all checks
    if (type === 'database' || type === 'all') {
      const rateLimitResult = await middleware(request);
      if (rateLimitResult) {
        return rateLimitResult;
      }
    }

    const timestamp = new Date().toISOString();
    const environment = process.env.NODE_ENV || 'development';

    // Basic health check (default)
    if (type === 'basic') {
      return NextResponse.json({
        status: 'ok',
        timestamp,
        environment,
        maintenance: process.env.NEXT_PUBLIC_MAINTENANCE === '1',
        version: '1.0.0'
      });
    }

    // Database health check
    if (type === 'database') {
      try {
        // Use optimized health check with performance monitoring
        const queryOptimizer = await getQueryOptimizer();
        const getHealthOptimized = withPerformanceMonitoring(
          () => queryOptimizer.getDatabaseHealth(),
          'database_health_check'
        );

        const healthData = await getHealthOptimized();

        // Get connection pool metrics
        const poolHealth = connectionPoolManager.getHealth();
        const poolMetrics = connectionPoolManager.getMetrics();

        // Get query performance statistics
        const queryStats = queryMonitor.getStats();
        const slowQueries = queryMonitor.getSlowQueries();

        const response = {
          ...healthData,
          connectionPool: {
            status: poolHealth.status,
            utilizationRate: poolHealth.utilizationRate,
            metrics: poolMetrics
          },
          performance: {
            queryStats,
            slowQueries: slowQueries.slice(0, 5), // Top 5 slow queries
            optimizationEnabled: true,
            cacheEnabled: true
          },
          environment: {
            nodeEnv: environment,
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
            databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
          }
        };

        // Add admin-only information if user is admin
        if (context?.user?.isAdmin) {
          (response as any).adminInfo = {
            databaseSize: 'N/A', // Would need special permissions
            connectionPool: poolMetrics,
            lastBackup: 'N/A', // Would need special permissions
            maintenanceMode: false,
            cacheStats: 'Available via cache_monitor view',
            slowQueryDetails: slowQueries
          };
        }

        // Return appropriate status code based on health
        const statusCode = healthData.status === 'healthy' ? 200 : 
                          healthData.status === 'degraded' ? 200 : 503;

        return NextResponse.json(response, { status: statusCode });

      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Database health check error:', err);
        
        return NextResponse.json({
          status: 'unhealthy',
          healthPercentage: 0,
          responseTime: 'N/A',
          timestamp,
          tests: [],
          metrics: { users: 'unknown', polls: 'unknown', votes: 'unknown' },
          recentErrors: [],
          error: 'Health check failed',
          connectionPool: {
            status: 'unknown',
            utilizationRate: 0,
            metrics: { totalConnections: 0, activeConnections: 0, idleConnections: 0, waitingConnections: 0 }
          },
          performance: {
            queryStats: { totalQueries: 0, averageQueryTime: 0, slowQueries: 0, topSlowQueries: [] },
            slowQueries: [],
            optimizationEnabled: false,
            cacheEnabled: false
          },
          environment: {
            nodeEnv: environment,
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
            databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
          }
        }, { status: 503 });
      }
    }

    // Supabase status check
    if (type === 'supabase') {
      try {
        const supabase = await getSupabaseServerClient();
        
        // Check if Supabase is configured
        const supabaseConfigured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
        
        if (!supabase) {
          return NextResponse.json({
            status: {
              environment,
              databaseType: 'mock',
              databaseEnabled: false,
              supabaseConfigured,
              connectionSuccess: false
            },
            connectionTest: {
              success: false,
              error: 'Supabase client not available - using mock data'
            },
            timestamp,
            environment: {
              NODE_ENV: environment,
              SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Not configured',
              SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configured' : 'Not configured'
            }
          });
        }
        
        // Test the connection
        const { error } = await supabase.from('user_profiles').select('count').limit(1);
        
        return NextResponse.json({
          status: {
            environment,
            databaseType: 'supabase',
            databaseEnabled: true,
            supabaseConfigured: true,
            connectionSuccess: !error
          },
          connectionTest: {
            success: !error,
            error: error?.message || null
          },
          timestamp,
          environment: {
            NODE_ENV: environment,
            SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Not configured',
            SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configured' : 'Not configured'
          }
        });
      } catch (error) {
        const appError = handleError(error as Error);
        return NextResponse.json({
          status: {
            environment,
            databaseType: 'unknown',
            databaseEnabled: false,
            supabaseConfigured: false,
            connectionSuccess: false
          },
          connectionTest: {
            success: false,
            error: appError.message
          },
          timestamp,
          environment: {
            NODE_ENV: environment,
            SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Not configured',
            SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configured' : 'Not configured'
          }
        }, { status: 500 });
      }
    }

    // Civics system status check
    if (type === 'civics') {
      try {
        const issues: string[] = [];
        let status = 'healthy';

        const isEnabled = isCivicsEnabled();
        
        // Check feature flag
        if (!isEnabled) {
          return NextResponse.json({ 
            status: 'disabled', 
            message: 'Civics feature is disabled.',
            issues: ['Feature flag disabled']
          }, { status: 200 });
        }

        // Check PRIVACY_PEPPER_DEV (for development/test)
        if (environment === 'development' || environment === 'test') {
          if (!process.env.PRIVACY_PEPPER_DEV) {
            issues.push('PRIVACY_PEPPER_DEV is not set');
            status = 'warning';
          }
        } else {
          // Production environment checks
          if (!process.env.PRIVACY_PEPPER_CURRENT) {
            issues.push('PRIVACY_PEPPER_CURRENT is not set');
            status = 'error';
          }
        }

        // Check Google Civic API key
        if (!process.env.GOOGLE_CIVIC_API_KEY) {
          issues.push('GOOGLE_CIVIC_API_KEY is not set');
          status = 'warning';
        }

        // Database connectivity checks
        let databaseStatus = 'disabled';
        let databaseDetails: any = {};
        
        if (isEnabled) {
          try {
            const supabase = await getSupabaseServerClient();
            const { error } = await supabase.from('representatives_core').select('id').limit(1);
            
            if (error) {
              databaseStatus = 'error';
              databaseDetails = { error: error.message };
            } else {
              databaseStatus = 'healthy';
              databaseDetails = { connected: true };
            }
          } catch (error) {
            databaseStatus = 'error';
            databaseDetails = { error: error instanceof Error ? error.message : 'Unknown error' };
          }
        }

        // Privacy compliance checks
        let privacyStatus = 'healthy';
        let privacyDetails: any = {};
        
        if (environment === 'production') {
          if (!process.env.PRIVACY_PEPPER_CURRENT) {
            privacyStatus = 'error';
            privacyDetails = { error: 'PRIVACY_PEPPER_CURRENT not set in production' };
          }
        }

        // External APIs checks
        let externalApisStatus = 'healthy';
        let externalApisDetails: any = {};
        
        if (!process.env.GOOGLE_CIVIC_API_KEY) {
          externalApisStatus = 'warning';
          externalApisDetails = { warning: 'Google Civic API key not configured' };
        }

        const systemChecks = [databaseStatus, privacyStatus, externalApisStatus];
        const hasErrors = systemChecks.includes('error') || issues.some(issue => issue.includes('error'));
        const hasWarnings = systemChecks.includes('warning') || issues.some(issue => issue.includes('warning'));
        
        if (hasErrors) {
          status = 'error';
        } else if (hasWarnings) {
          status = 'warning';
        } else {
          status = 'healthy';
        }
        
        const healthStatus = {
          feature_enabled: isEnabled,
          status,
          message: status === 'healthy' ? 'Civics system is healthy' : 
                   status === 'warning' ? 'Civics system has warnings' : 'Civics system has issues',
          timestamp,
          issues: issues.length > 0 ? issues : undefined,
          checks: {
            feature_flag: isEnabled,
            environment_variables: {
              PRIVACY_PEPPER_DEV: !!process.env.PRIVACY_PEPPER_DEV,
              PRIVACY_PEPPER_CURRENT: !!process.env.PRIVACY_PEPPER_CURRENT,
              GOOGLE_CIVIC_API_KEY: !!process.env.GOOGLE_CIVIC_API_KEY
            },
            database: {
              status: databaseStatus,
              details: databaseDetails
            },
            privacy_compliance: {
              status: privacyStatus,
              details: privacyDetails
            },
            external_apis: {
              status: externalApisStatus,
              details: externalApisDetails
            }
          }
        };

        const statusCode = status === 'error' ? 500 : status === 'warning' ? 200 : 200;
        
        return NextResponse.json(healthStatus, { status: statusCode });

      } catch (error) {
        console.error('Civics health check error:', error);
        return NextResponse.json(
          { 
            feature_enabled: false,
            status: 'error',
            error: 'Health check failed',
            timestamp,
            issues: ['Health check failed']
          }, 
          { status: 500 }
        );
      }
    }

    // All health checks
    if (type === 'all') {
      const results = {
        basic: null,
        database: null,
        supabase: null,
        civics: null
      };

      try {
        // Run all health checks in parallel
        const [basicResult, databaseResult, supabaseResult, civicsResult] = await Promise.allSettled([
          // Basic health check
          Promise.resolve({
            status: 'ok',
            timestamp,
            environment,
            maintenance: process.env.NEXT_PUBLIC_MAINTENANCE === '1',
            version: '1.0.0'
          }),
          // Database health check (simplified)
          (async () => {
            try {
              const queryOptimizer = await getQueryOptimizer();
              const healthData = await queryOptimizer.getDatabaseHealth();
              return { ...healthData, type: 'database' };
            } catch (error) {
              return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error', type: 'database' };
            }
          })(),
          // Supabase status check (simplified)
          (async () => {
            try {
              const supabase = await getSupabaseServerClient();
              const { error } = await supabase.from('user_profiles').select('count').limit(1);
              return {
                status: error ? 'unhealthy' : 'healthy',
                connectionSuccess: !error,
                error: error?.message || null,
                type: 'supabase'
              };
            } catch (error) {
              return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error', type: 'supabase' };
            }
          })(),
          // Civics status check (simplified)
          (async () => {
            try {
              const isEnabled = isCivicsEnabled();
              return {
                feature_enabled: isEnabled,
                status: isEnabled ? 'healthy' : 'disabled',
                type: 'civics'
              };
            } catch (error) {
              return { status: 'error', error: error instanceof Error ? error.message : 'Unknown error', type: 'civics' };
            }
          })()
        ]);

        results.basic = basicResult.status === 'fulfilled' ? basicResult.value : { status: 'error', error: 'Basic check failed' };
        results.database = databaseResult.status === 'fulfilled' ? databaseResult.value : { status: 'error', error: 'Database check failed' };
        results.supabase = supabaseResult.status === 'fulfilled' ? supabaseResult.value : { status: 'error', error: 'Supabase check failed' };
        results.civics = civicsResult.status === 'fulfilled' ? civicsResult.value : { status: 'error', error: 'Civics check failed' };

        // Determine overall status
        const allStatuses = [results.basic.status, results.database.status, results.supabase.status, results.civics.status];
        const hasErrors = allStatuses.includes('error') || allStatuses.includes('unhealthy');
        const hasWarnings = allStatuses.includes('warning') || allStatuses.includes('degraded');
        
        const overallStatus = hasErrors ? 'error' : hasWarnings ? 'warning' : 'healthy';
        const statusCode = hasErrors ? 500 : 200;

        return NextResponse.json({
          status: overallStatus,
          timestamp,
          environment,
          checks: results,
          summary: {
            total: 4,
            healthy: allStatuses.filter(s => s === 'healthy' || s === 'ok').length,
            warnings: allStatuses.filter(s => s === 'warning' || s === 'degraded').length,
            errors: allStatuses.filter(s => s === 'error' || s === 'unhealthy').length
          }
        }, { status: statusCode });

      } catch (error) {
        return NextResponse.json({
          status: 'error',
          timestamp,
          environment,
          error: 'Health check aggregation failed',
          checks: results
        }, { status: 500 });
      }
    }

    // Invalid type parameter
    return NextResponse.json({
      status: 'error',
      error: 'Invalid type parameter. Valid types: basic, database, supabase, civics, all',
      timestamp,
      environment
    }, { status: 400 });

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Health check error:', err);
    
    return NextResponse.json({
      status: 'error',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }, { status: 500 });
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json({
    status: 'error',
    error: 'Method not allowed. Use GET for health checks.',
    timestamp: new Date().toISOString()
  }, { status: 405 });
}