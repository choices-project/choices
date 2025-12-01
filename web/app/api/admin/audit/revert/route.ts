import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { withErrorHandling, successResponse, forbiddenError, validationError, errorResponse, methodNotAllowed, rateLimitError, parseBody } from '@/lib/api';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// Validation schema for audit revert
const revertAuditSchema = z.object({
  type: z.enum(['candidate', 'representative'], {
    message: 'Type must be "candidate" or "representative"',
  }),
  id: z.string().min(1, 'ID is required'),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Rate limiting: 10 revert operations per minute (strict limit for sensitive operation)
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
  const userAgent = request.headers.get('user-agent') ?? undefined;
  const rateLimitResult = await apiRateLimiter.checkLimit(
    ip,
    '/api/admin/audit/revert',
    {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute
      ...(userAgent ? { userAgent } : {})
    }
  );

  if (!rateLimitResult.allowed) {
    return rateLimitError('Too many revert operations. Please wait before trying again.');
  }

  const adminHeader = request.headers.get('x-admin-key') ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const adminKey = process.env.ADMIN_MONITORING_KEY ?? '';
  if (!adminKey || adminHeader !== adminKey) {
    return forbiddenError('Invalid admin key');
  }
  const supabase = await getSupabaseServerClient();
  if (!supabase) return errorResponse('DB not available', 500);

  // Validate request body with Zod schema
  const parsed = await parseBody<z.infer<typeof revertAuditSchema>>(request, revertAuditSchema);
  if (!parsed.success) {
    return parsed.error;
  }

  const { type, id } = parsed.data;

  if (type === 'candidate') {
    const { data: row } = await (supabase as any)
      .from('candidate_profile_audit')
      .select('candidate_id, field, old_value')
      .eq('id', id)
      .maybeSingle();
    if (!row) return validationError({ _: 'Audit row not found' });
    const patch = { [row.field]: row.old_value };
    const { error } = await (supabase as any)
      .from('candidate_profiles')
      .update(patch)
      .eq('id', row.candidate_id);
    if (error) return errorResponse('Failed to revert', 500);
    return successResponse({ ok: true });
  } else {
    const { data: row } = await (supabase as any)
      .from('representative_overrides_audit')
      .select('representative_id, field, old_value')
      .eq('id', id)
      .maybeSingle();
    if (!row) return validationError({ _: 'Audit row not found' });
    const patch = { [row.field]: row.old_value };
    const { error } = await (supabase as any)
      .from('representative_overrides')
      .update(patch)
      .eq('representative_id', row.representative_id);
    if (error) return errorResponse('Failed to revert', 500);
    return successResponse({ ok: true });
  }
});

export const GET = withErrorHandling(async () => methodNotAllowed(['POST']));

