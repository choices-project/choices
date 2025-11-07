/**
 * DEPRECATED: Civics Data Ingestion API Endpoint
 *
 * ⚠️ IMPORTANT: This endpoint has been DEPRECATED and DISABLED.
 *
 * Civics data ingestion has been migrated to the standalone service:
 * /Users/alaughingkitsune/src/Choices/services/civics-backend
 *
 * This endpoint is kept for reference only and will return an error.
 *
 * Rationale:
 * - API keys should NOT be accessible to web users
 * - Ingestion should only happen in the backend service
 * - Users should only query data from Supabase, not ingest it
 */

import type { NextRequest } from 'next/server';

import { withErrorHandling, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (request: NextRequest) => {
  logger.warn('Attempted access to deprecated civics ingestion endpoint', {
    ip: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip'),
    userAgent: request.headers.get('user-agent')
  });

  return errorResponse(
    'This endpoint has been deprecated',
    410,
    {
      message:
        'Civics data ingestion has been migrated to the standalone backend service. Please use the backend service located at /services/civics-backend for data ingestion.',
      deprecated: true,
      alternative: 'Use /services/civics-backend for data ingestion',
    },
    'DEPRECATED_ENDPOINT'
  );
});

export const GET = withErrorHandling(async (_request: NextRequest) => {
  return errorResponse(
    'This endpoint has been deprecated',
    410,
    {
      message: 'Civics data ingestion has been migrated to the standalone backend service.',
      deprecated: true,
      alternative: 'Use /services/civics-backend for data ingestion',
    },
    'DEPRECATED_ENDPOINT'
  );
});
