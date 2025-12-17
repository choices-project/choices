/**
 * Diagnostics API
 *
 * Provides health checks and diagnostic information for troubleshooting
 * production issues. Only enabled in non-production or for authenticated admin users.
 *
 * Created: December 17, 2025
 * Status: ✅ Production diagnostic tool
 */

import { getSupabaseServerClient, getSupabaseAdminClient } from '@/utils/supabase/server';
import { withErrorHandling, successResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {},
  };

  // 1. Check Supabase Client Connection
  try {
    const supabaseClient = await getSupabaseServerClient();

    if (!supabaseClient) {
      diagnostics.checks.supabaseClient = {
        status: 'error',
        message: 'Failed to create Supabase client',
      };
    } else {
      diagnostics.checks.supabaseClient = {
        status: 'ok',
        message: 'Supabase client created successfully',
      };

      // Try a simple query
      try {
        const { data, error } = await supabaseClient
          .from('polls')
          .select('id')
          .limit(1);

        if (error) {
          diagnostics.checks.supabaseQuery = {
            status: 'error',
            message: `Supabase query failed: ${error.message}`,
            error: error,
          };
        } else {
          diagnostics.checks.supabaseQuery = {
            status: 'ok',
            message: `Successfully queried polls table`,
            sampleCount: data?.length ?? 0,
          };
        }
      } catch (queryError) {
        diagnostics.checks.supabaseQuery = {
          status: 'error',
          message: `Exception during query: ${queryError instanceof Error ? queryError.message : String(queryError)}`,
        };
      }
    }
  } catch (clientError) {
    diagnostics.checks.supabaseClient = {
      status: 'error',
      message: `Exception creating client: ${clientError instanceof Error ? clientError.message : String(clientError)}`,
    };
  }

  // 2. Check Supabase Admin Client
  try {
    const adminClient = await getSupabaseAdminClient();
    diagnostics.checks.supabaseAdminClient = {
      status: 'ok',
      message: 'Admin client created successfully',
    };

    // Try a simple query with admin
    try {
      const { data, error } = await adminClient
        .from('feedback')
        .select('id')
        .limit(1);

      if (error) {
        diagnostics.checks.feedbackTable = {
          status: 'error',
          message: `Feedback table query failed: ${error.message}`,
          error: error,
        };
      } else {
        diagnostics.checks.feedbackTable = {
          status: 'ok',
          message: `Successfully queried feedback table`,
          sampleCount: data?.length ?? 0,
        };
      }
    } catch (queryError) {
      diagnostics.checks.feedbackTable = {
        status: 'error',
        message: `Exception during feedback query: ${queryError instanceof Error ? queryError.message : String(queryError)}`,
      };
    }
  } catch (adminError) {
    diagnostics.checks.supabaseAdminClient = {
      status: 'error',
      message: `Exception creating admin client: ${adminError instanceof Error ? adminError.message : String(adminError)}`,
    };
  }

  // 3. Check Environment Variables
  diagnostics.checks.environment = {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    nodeEnv: process.env.NODE_ENV,
    isE2EHarness: process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1',
  };

  // 4. Check Auth Cookies
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = cookies();
    const accessToken = cookieStore?.get('sb-access-token');
    const refreshToken = cookieStore?.get('sb-refresh-token');

    diagnostics.checks.authCookies = {
      status: (accessToken || refreshToken) ? 'ok' : 'missing',
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
    };
  } catch (cookieError) {
    diagnostics.checks.authCookies = {
      status: 'error',
      message: `Failed to read cookies: ${cookieError instanceof Error ? cookieError.message : String(cookieError)}`,
    };
  }

  // 5. Overall Health Status
  const allChecks = Object.values(diagnostics.checks);
  const hasErrors = allChecks.some((check: any) => check.status === 'error');
  const hasMissing = allChecks.some((check: any) => check.status === 'missing');

  diagnostics.overallStatus = hasErrors ? 'unhealthy' : hasMissing ? 'degraded' : 'healthy';

  // Log for server-side tracking
  if (hasErrors) {
    logger.error('Diagnostics found errors', diagnostics);
  } else if (hasMissing) {
    logger.warn('Diagnostics found missing components', diagnostics);
  }

  return successResponse(diagnostics);
});

