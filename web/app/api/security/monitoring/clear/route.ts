
import { withErrorHandling, successResponse, authError, validationError } from '@/lib/api';
import { upstashRateLimiter } from '@/lib/rate-limiting/upstash-rate-limiter';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const adminKey = process.env.ADMIN_MONITORING_KEY ?? 'dev-admin-key';
  const isAdmin = request.headers.get('x-admin-key') === adminKey;
  if (!isAdmin) {
    return authError('Admin authentication required');
  }

  const body = await request.json().catch(() => ({}));
  const { ip, endpoint } = body as { ip?: string; endpoint?: string };

  if (!ip || !endpoint) {
    return validationError({ 
      ip: !ip ? 'IP is required' : '',
      endpoint: !endpoint ? 'Endpoint is required' : ''
    });
  }

  const ok = await upstashRateLimiter.clearRateLimit(ip, endpoint);
  logger.info('Rate limit clear executed', { ip, endpoint, ok });

  return successResponse(
    { cleared: ok },
    {
      ip,
      endpoint,
    }
  );
});


