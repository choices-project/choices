import { getSupabaseAdminClient } from '@/utils/supabase/server';

import { requireAdminOr401 } from '@/features/auth/lib/admin-auth';

import { withErrorHandling, successResponse, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Refresh Materialized Views
 *
 * This endpoint refreshes all materialized views in the database.
 * Materialized views are precomputed query results that need periodic
 * refresh to stay current with underlying data changes.
 */
export const POST = withErrorHandling(async (_request: NextRequest) => {
  const authGate = await requireAdminOr401();
  if (authGate) {
    return authGate;
  }

  const startTime = Date.now();

  try {
    const supabase = await getSupabaseAdminClient();
    if (!supabase) {
      throw new Error('Database connection not available');
    }

    // Get list of all materialized views in the public schema
    // Type assertion needed since exec_sql may not exist in schema
    // Note: exec_sql typically requires 2 parameters, but we'll try with sql only
    let views: any = null;
    let viewsError: any = null;
    
    try {
      const result = await (supabase.rpc as any)('exec_sql', {
        sql: `
          SELECT schemaname, matviewname 
          FROM pg_matviews 
          WHERE schemaname = 'public'
          ORDER BY matviewname;
        `,
      });
      views = result.data;
      viewsError = result.error;
    } catch (err) {
      viewsError = err;
    }

    if (viewsError) {
      // If exec_sql RPC doesn't exist, try direct query approach
      logger.warn('RPC exec_sql not available, using alternative method', viewsError);

      // Alternative: Use a PostgreSQL function if available, or refresh common views
      // For now, we'll attempt to refresh via a direct SQL execution pattern
      // Note: Supabase may require creating a function in the database first

      const refreshedViews: string[] = [];
      const errors: string[] = [];

      // Common materialized view names to try (customize based on your schema)
      const commonViewNames = [
        'poll_analytics_summary',
        'user_activity_summary',
        'vote_statistics',
        'trending_topics_summary',
      ];

      for (const viewName of commonViewNames) {
        try {
          // Attempt to refresh via RPC if a function exists
          const { error: refreshError } = await (supabase.rpc as any)('refresh_materialized_view', {
            view_name: viewName,
          });

          if (refreshError) {
            // If RPC doesn't exist, log but continue
            logger.debug(`Could not refresh ${viewName} via RPC`, refreshError);
            errors.push(`${viewName}: ${refreshError.message}`);
          } else {
            refreshedViews.push(viewName);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          errors.push(`${viewName}: ${message}`);
        }
      }

      const duration = Date.now() - startTime;

      if (refreshedViews.length === 0 && errors.length > 0) {
        logger.warn('No materialized views could be refreshed', { errors });
        return successResponse({
          success: true,
          message: 'Materialized views refresh attempted. Note: Database functions may need to be created.',
          refreshed: refreshedViews,
          errors: errors.length > 0 ? errors : undefined,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        });
      }

      return successResponse({
        success: true,
        message: `Refreshed ${refreshedViews.length} materialized view(s)`,
        refreshed: refreshedViews,
        errors: errors.length > 0 ? errors : undefined,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
    }

    // If we got the list of views, refresh each one
    const viewList = Array.isArray(views) ? views : [];
    const refreshedViews: string[] = [];
    const errors: string[] = [];

    for (const view of viewList) {
      const viewName = typeof view === 'object' && view !== null && 'matviewname' in view
        ? String(view.matviewname)
        : String(view);

      try {
        // Refresh the materialized view
        // Note: This requires a database function or direct SQL access
        const { error: refreshError } = await (supabase.rpc as any)('refresh_materialized_view', {
          view_name: viewName,
        });

        if (refreshError) {
          errors.push(`${viewName}: ${refreshError.message}`);
        } else {
          refreshedViews.push(viewName);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`${viewName}: ${message}`);
      }
    }

    const duration = Date.now() - startTime;

    logger.info('Materialized views refresh completed', {
      total: viewList.length,
      refreshed: refreshedViews.length,
      errors: errors.length,
      duration,
    });

    return successResponse({
      success: true,
      message: `Refreshed ${refreshedViews.length} of ${viewList.length} materialized view(s)`,
      total: viewList.length,
      refreshed: refreshedViews,
      errors: errors.length > 0 ? errors : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Failed to refresh materialized views', { error, duration });
    return errorResponse(
      `Failed to refresh materialized views: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
});
