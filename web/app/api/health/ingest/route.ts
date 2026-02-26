/**
 * Civics Ingest Health Check
 *
 * Lightweight endpoint that runs ingest pre-flight logic for monitoring.
 * Verifies env vars and Supabase connection (service role) used by civics ingest.
 *
 * GET /api/health/ingest
 */
import { withErrorHandling, successResponse, errorResponse } from '@/lib/api';

import type { Database } from '@/types/supabase';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const timestamp = new Date().toISOString();
  const issues: string[] = [];

  if (!SUPABASE_URL || SUPABASE_URL.includes('replace') || SUPABASE_URL.includes('your-')) {
    issues.push('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL missing or placeholder');
  }
  if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY.includes('replace') || SUPABASE_SERVICE_ROLE_KEY.includes('your-')) {
    issues.push('SUPABASE_SERVICE_ROLE_KEY missing or placeholder');
  }

  if (issues.length > 0) {
    return errorResponse(
      'Ingest pre-flight failed',
      503,
      {
        status: 'unhealthy',
        timestamp,
        message: 'Required env vars missing',
        issues,
      }
    );
  }

  const url = SUPABASE_URL as string;
  const key = SUPABASE_SERVICE_ROLE_KEY as string;

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient<Database>(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await supabase
      .from('representatives_core')
      .select('id')
      .limit(1);

    if (error) {
      return errorResponse(
        'Ingest database check failed',
        503,
        {
          status: 'unhealthy',
          timestamp,
          message: 'Supabase connection failed',
          error: error.message,
        }
      );
    }

    return successResponse(
      {
        status: 'healthy',
        timestamp,
        message: 'Ingest pre-flight OK — env configured, Supabase reachable',
      },
      undefined,
      200
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(
      'Ingest health check failed',
      503,
      {
        status: 'unhealthy',
        timestamp,
        message,
      }
    );
  }
});
