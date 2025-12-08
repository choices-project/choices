import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, forbiddenError, methodNotAllowed, rateLimitError } from '@/lib/api';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Rate limiting: 30 requests per 5 minutes per IP (admin endpoints need higher limits)
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
  const userAgent = request.headers.get('user-agent') ?? undefined;
  const rateLimitResult = await apiRateLimiter.checkLimit(
    ip,
    '/api/admin/audit/representatives',
    {
      maxRequests: 30,
      windowMs: 5 * 60 * 1000, // 5 minutes
      ...(userAgent ? { userAgent } : {})
    }
  );

  if (!rateLimitResult.allowed) {
    return rateLimitError('Too many requests. Please try again later.');
  }

  const adminHeader = request.headers.get('x-admin-key') ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const adminKey = process.env.ADMIN_MONITORING_KEY ?? '';
  if (!adminKey || adminHeader !== adminKey) {
    return forbiddenError('Invalid admin key');
  }

  const supabase = await getSupabaseServerClient();
  const searchParams = request.nextUrl.searchParams;
  const limit = Number(searchParams.get('limit') ?? 50);
  const offset = Number(searchParams.get('offset') ?? 0);
  const representativeId = searchParams.get('representativeId');

  let query = (supabase as any)
    .from('representative_overrides_audit')
    .select('id, representative_id, user_id, field, old_value, new_value, created_at')
    .order('created_at', { ascending: false });
  if (representativeId) {
    query = query.eq('representative_id', Number(representativeId));
  }
  const { data } = await query.range(offset, offset + limit - 1);

  return successResponse({
    items: Array.isArray(data) ? data : [],
    limit,
    offset,
  });
});

export const POST = withErrorHandling(async () => methodNotAllowed(['GET']));

