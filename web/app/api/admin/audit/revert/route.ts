/**
 * Admin: Field-Level Revert
 *
 * POST /api/admin/audit/revert
 *
 * Reverts a specific field change by restoring the previous value from audit logs.
 * This endpoint maintains data integrity by:
 * - Verifying the audit record exists
 * - Confirming the target record exists
 * - Restoring the exact previous value
 * - Logging the revert operation
 *
 * Authentication: Requires x-admin-key header matching ADMIN_MONITORING_KEY
 * Rate Limiting: 10 requests per minute per IP (sensitive operation)
 *
 * Request Body:
 * {
 *   type: 'candidate' | 'representative'
 *   id: string (audit log entry ID)
 * }
 *
 * Response:
 * {
 *   ok: true
 *   reverted: {
 *     type: string
 *     recordId: string
 *     field: string
 *     oldValue: unknown
 *     newValue: unknown (current value before revert)
 *   }
 * }
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';

import {
  withErrorHandling,
  successResponse,
  forbiddenError,
  validationError,
  errorResponse,
  methodNotAllowed,
  rateLimitError,
} from '@/lib/api';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';


export const dynamic = 'force-dynamic';

const REVERT_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute (sensitive operation)
};

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Admin authentication
  const adminHeader =
    request.headers.get('x-admin-key') ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    '';
  const adminKey = process.env.ADMIN_MONITORING_KEY ?? '';
  if (!adminKey || adminHeader !== adminKey) {
    logger.warn('Field revert endpoint: Invalid admin key');
    return forbiddenError('Invalid admin key');
  }

  // Rate limiting (strict for sensitive operation)
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  const userAgent = request.headers.get('user-agent');
  const rateLimitResult = await apiRateLimiter.checkLimit(clientIp, 'admin:audit:revert', {
    ...REVERT_RATE_LIMIT,
    ...(userAgent ? { userAgent } : {}),
  });

  if (!rateLimitResult.allowed) {
    logger.warn('Field revert endpoint: Rate limit exceeded', { ip: clientIp });
    return rateLimitError(
      'Too many revert requests. Please wait before retrying.',
      rateLimitResult.retryAfter ?? Math.ceil(REVERT_RATE_LIMIT.windowMs / 1000),
    );
  }

  // Database connection check
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    logger.error('Field revert endpoint: Database connection not available');
    return errorResponse('Database connection not available', 503);
  }

  // Parse and validate request body
  let body: { type?: string; id?: string };
  try {
    body = await request.json();
  } catch (error) {
    logger.warn('Field revert endpoint: Invalid JSON payload', error);
    return validationError({ body: 'Invalid JSON payload' });
  }

  const type = String(body.type ?? '').toLowerCase();
  const id = String(body.id ?? '');

  if (!['candidate', 'representative'].includes(type)) {
    return validationError({
      type: "Type must be 'candidate' or 'representative'",
    });
  }

  if (!id || id.trim().length === 0) {
    return validationError({
      id: 'Audit log entry ID is required',
    });
  }

  try {
    if (type === 'candidate') {
      // Fetch audit record
      const { data: auditRow, error: auditError } = await (supabase as any)
        .from('candidate_profile_audit')
        .select('candidate_id, field, old_value, new_value, created_at')
        .eq('id', id)
        .maybeSingle();

      if (auditError) {
        logger.error('Field revert endpoint: Failed to fetch audit record', auditError);
        return errorResponse('Failed to fetch audit record', 500);
      }

      if (!auditRow || !auditRow.candidate_id) {
        return validationError({
          id: 'Audit record not found',
        });
      }

      // Verify target record exists
      const { data: targetRecord, error: targetError } = await (supabase as any)
        .from('candidate_profiles')
        .select('id, ' + auditRow.field)
        .eq('id', auditRow.candidate_id)
        .maybeSingle();

      if (targetError) {
        logger.error('Field revert endpoint: Failed to fetch target record', targetError);
        return errorResponse('Failed to fetch target record', 500);
      }

      if (!targetRecord) {
        return validationError({
          id: 'Target candidate record not found',
        });
      }

      // Store current value for response
      const currentValue = targetRecord[auditRow.field];

      // Perform revert
      const patch = { [auditRow.field]: auditRow.old_value };
      const { error: updateError } = await (supabase as any)
        .from('candidate_profiles')
        .update(patch)
        .eq('id', auditRow.candidate_id);

      if (updateError) {
        logger.error('Field revert endpoint: Failed to revert field', {
          error: updateError,
          candidateId: auditRow.candidate_id,
          field: auditRow.field,
        });
        return errorResponse('Failed to revert field change', 500);
      }

      logger.info('Field revert endpoint: Successfully reverted candidate field', {
        candidateId: auditRow.candidate_id,
        field: auditRow.field,
        oldValue: auditRow.old_value,
        previousValue: currentValue,
      });

      return successResponse({
        ok: true,
        reverted: {
          type: 'candidate',
          recordId: auditRow.candidate_id,
          field: auditRow.field,
          oldValue: auditRow.old_value,
          newValue: currentValue,
          auditId: id,
        },
      });
    } else {
      // Representative revert logic
      const { data: auditRow, error: auditError } = await (supabase as any)
        .from('representative_overrides_audit')
        .select('representative_id, field, old_value, new_value, created_at')
        .eq('id', id)
        .maybeSingle();

      if (auditError) {
        logger.error('Field revert endpoint: Failed to fetch audit record', auditError);
        return errorResponse('Failed to fetch audit record', 500);
      }

      if (!auditRow || !auditRow.representative_id) {
        return validationError({
          id: 'Audit record not found',
        });
      }

      // Verify target record exists
      const { data: targetRecord, error: targetError } = await (supabase as any)
        .from('representative_overrides')
        .select('representative_id, ' + auditRow.field)
        .eq('representative_id', auditRow.representative_id)
        .maybeSingle();

      if (targetError) {
        logger.error('Field revert endpoint: Failed to fetch target record', targetError);
        return errorResponse('Failed to fetch target record', 500);
      }

      if (!targetRecord) {
        return validationError({
          id: 'Target representative record not found',
        });
      }

      // Store current value for response
      const currentValue = targetRecord[auditRow.field];

      // Perform revert
      const patch = { [auditRow.field]: auditRow.old_value };
      const { error: updateError } = await (supabase as any)
        .from('representative_overrides')
        .update(patch)
        .eq('representative_id', auditRow.representative_id);

      if (updateError) {
        logger.error('Field revert endpoint: Failed to revert field', {
          error: updateError,
          representativeId: auditRow.representative_id,
          field: auditRow.field,
        });
        return errorResponse('Failed to revert field change', 500);
      }

      logger.info('Field revert endpoint: Successfully reverted representative field', {
        representativeId: auditRow.representative_id,
        field: auditRow.field,
        oldValue: auditRow.old_value,
        previousValue: currentValue,
      });

      return successResponse({
        ok: true,
        reverted: {
          type: 'representative',
          recordId: auditRow.representative_id,
          field: auditRow.field,
          oldValue: auditRow.old_value,
          newValue: currentValue,
          auditId: id,
        },
      });
    }
  } catch (error) {
    logger.error('Field revert endpoint: Unexpected error', error);
    return errorResponse('An unexpected error occurred during revert', 500);
  }
});

export const GET = withErrorHandling(async () => methodNotAllowed(['POST']));

