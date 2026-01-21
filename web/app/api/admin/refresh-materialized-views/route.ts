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

    // Try to use refresh_all_materialized_views function if available
    // This function returns a table with view_name, refreshed, error_message
    let refreshResults: any = null;
    let refreshError: any = null;

    try {
      // Use the refresh_all_materialized_views function if it exists
      const result = await (supabase.rpc as any)('refresh_all_materialized_views', {});
      refreshResults = result.data;
      refreshError = result.error;
    } catch (err) {
      refreshError = err;
    }

    // If refresh_all_materialized_views worked, use those results
    if (refreshResults && Array.isArray(refreshResults) && refreshResults.length > 0) {
      const refreshedViews = refreshResults
        .filter((r: any) => r.refreshed === true)
        .map((r: any) => r.view_name);
      const errors = refreshResults
        .filter((r: any) => r.refreshed === false)
        .map((r: any) => `${r.view_name}: ${r.error_message || 'Unknown error'}`);

      const duration = Date.now() - startTime;

      logger.info('Materialized views refresh completed via refresh_all_materialized_views', {
        total: refreshResults.length,
        refreshed: refreshedViews.length,
        errors: errors.length,
        duration,
      });

      return successResponse({
        success: true,
        message: `Refreshed ${refreshedViews.length} of ${refreshResults.length} materialized view(s)`,
        total: refreshResults.length,
        refreshed: refreshedViews,
        errors: errors.length > 0 ? errors : undefined,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
    }

    // Fallback: Try individual refresh_materialized_view calls for common views
    // This handles the case where refresh_all_materialized_views doesn't exist or returned no results
    logger.info('Using fallback method: refreshing individual materialized views', { refreshError });

      // Alternative: Use a PostgreSQL function if available, or refresh common views
      // For now, we'll attempt to refresh via a direct SQL execution pattern
      // Note: Supabase may require creating a function in the database first

      const refreshedViews: string[] = [];
      const errors: string[] = [];

      // Common materialized view names to try
      // These should match any materialized views you've created in your database
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

    // If we get here, refresh_all_materialized_views returned empty array (no views exist)
    // Return success with informative message
    const duration = Date.now() - startTime;
    logger.info('No materialized views found to refresh', { duration });
    return successResponse({
      success: true,
      message: 'No materialized views found in the database',
      total: 0,
      refreshed: [],
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
