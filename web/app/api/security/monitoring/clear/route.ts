import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { upstashRateLimiter } from '@/lib/rate-limiting/upstash-rate-limiter';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const adminKey = process.env.ADMIN_MONITORING_KEY ?? 'dev-admin-key';
    const isAdmin = request.headers.get('x-admin-key') === adminKey;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { ip, endpoint } = body as { ip?: string; endpoint?: string };

    if (!ip || !endpoint) {
      return NextResponse.json(
        { error: 'Missing required fields: ip, endpoint' },
        { status: 400 }
      );
    }

    const ok = await upstashRateLimiter.clearRateLimit(ip, endpoint);
    logger.info('Rate limit clear executed', { ip, endpoint, ok });

    return NextResponse.json({ success: ok });
  } catch (error) {
    logger.error('Monitoring clear API error:', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}


