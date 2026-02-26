/**
 * Admin Contact API - Bulk Reject
 *
 * Reject multiple pending contact submissions at once.
 *
 * Created: February 2026
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { requireAdminOr401, getAdminUser } from '@/features/auth/lib/admin-auth';

import {
  successResponse,
  errorResponse,
  validationError,
  withErrorHandling,
  parseBody,
  forbiddenError,
} from '@/lib/api';
import { notifyUsersContactRejectedBatch } from '@/lib/contact/contact-notifications';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

type BulkRejectRequest = {
  ids: number[];
  reason?: string;
};

export const POST = withErrorHandling(async (request: NextRequest) => {
  if (!isFeatureEnabled('CONTACT_INFORMATION_SYSTEM')) {
    return forbiddenError('Contact Information System is currently disabled');
  }

  try {
    const authGate = await requireAdminOr401();
    if (authGate) return authGate;

    const adminUser = await getAdminUser();
    if (!adminUser) {
      return errorResponse('Admin access required', 403);
    }

    const parsedBody = await parseBody<BulkRejectRequest>(request);
    if (!parsedBody.success) return parsedBody.error;

    const { ids, reason } = parsedBody.data;
    if (!Array.isArray(ids) || ids.length === 0) {
      return validationError({ ids: 'ids must be a non-empty array' }, 'ids must be a non-empty array');
    }

    const contactIds = ids
      .map((id) => (typeof id === 'number' ? id : parseInt(String(id), 10)))
      .filter((id) => !Number.isNaN(id) && id >= 1);

    if (contactIds.length === 0) {
      return validationError({ ids: 'No valid contact IDs' }, 'No valid contact IDs');
    }

    if (contactIds.length > 50) {
      return validationError({ ids: 'Maximum 50 contacts per request' }, 'Maximum 50 contacts per request');
    }

    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return errorResponse('Database connection not available', 500);
    }

    const { data: existingContacts, error: fetchError } = await supabase
      .from('representative_contacts')
      .select('id, representative_id, contact_type, value, is_verified, source, submitted_by_user_id, representatives_core!representative_contacts_representative_id_fkey (id, name, office, party)')
      .in('id', contactIds)
      .eq('is_verified', false)
      .eq('source', 'user_submission')
      .is('rejected_at', null);

    if (fetchError) {
      logger.error('Error fetching contacts for bulk reject', { error: fetchError });
      return errorResponse('Failed to fetch contacts', 500);
    }

    const toReject = existingContacts ?? [];
    if (toReject.length === 0) {
      return successResponse({
        rejected: 0,
        skipped: contactIds.length,
        message: 'No pending contacts to reject',
      });
    }

    const idsToReject = toReject.map((c) => c.id);
    const { error: updateError } = await supabase
      .from('representative_contacts')
      .update({
        rejected_at: new Date().toISOString(),
        rejection_reason: reason || null,
      })
      .in('id', idsToReject);

    if (updateError) {
      logger.error('Error bulk rejecting contacts', { error: updateError });
      return errorResponse('Failed to reject contacts', 500);
    }

    const toNotify = toReject
      .filter((c): c is typeof c & { submitted_by_user_id: number } => c.submitted_by_user_id != null)
      .map((c) => {
        const core = c.representatives_core as { id: number; name: string; office: string; party?: string } | null | undefined;
        return {
          contact: {
            id: c.id,
            representative_id: c.representative_id,
            contact_type: c.contact_type,
            value: c.value,
            ...(core ? { representative: { id: core.id, name: core.name, office: core.office, ...(core.party !== undefined ? { party: core.party } : {}) } } : {}),
          },
          userId: c.submitted_by_user_id,
        };
      });
    await notifyUsersContactRejectedBatch(supabase, toNotify, reason);

    logger.info('Bulk contact rejection', {
      rejected: idsToReject.length,
      adminId: adminUser.id,
    });

    return successResponse({
      rejected: idsToReject.length,
      skipped: contactIds.length - idsToReject.length,
      message: `Rejected ${idsToReject.length} contact(s)`,
    });
  } catch (error) {
    logger.error('Unexpected error in bulk reject API', error);
    return errorResponse('Internal server error', 500);
  }
});
