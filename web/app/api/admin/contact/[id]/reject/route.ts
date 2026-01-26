/**
 * Admin Contact API - Reject Contact
 *
 * Reject a pending contact information submission.
 *
 * Created: January 26, 2026
 * Status: ✅ ACTIVE
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { requireAdminOr401, getAdminUser } from '@/features/auth/lib/admin-auth';

import {
  successResponse,
  errorResponse,
  notFoundError,
  validationError,
  withErrorHandling,
  parseBody,
 forbiddenError } from '@/lib/api';
import { notifyUserContactRejected } from '@/lib/contact/contact-notifications';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// ============================================================================
// TYPES
// ============================================================================

type RejectContactRequest = {
  reason?: string;
};

// ============================================================================
// POST - Reject Contact Information
// ============================================================================

export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  // Check feature flag
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

    const { id } = await params;
    const contactId = parseInt(id, 10);

    if (isNaN(contactId)) {
      return validationError({ id: 'Invalid contact ID' }, 'Invalid contact ID');
    }

    // Parse request body for optional rejection reason
    const parsedBody = await parseBody<RejectContactRequest>(request);
    if (!parsedBody.success) {
      return parsedBody.error;
    }
    const { reason } = parsedBody.data;

    // Get Supabase client
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return errorResponse('Database connection not available', 500);
    }

    // Get existing contact with submitter info
    const { data: existingContact, error: fetchError } = await supabase
      .from('representative_contacts')
      .select('id, representative_id, contact_type, value, is_verified, source, submitted_by_user_id, representatives_core!representative_contacts_representative_id_fkey (id, name, office, party)')
      .eq('id', contactId)
      .single();

    if (fetchError || !existingContact) {
      return notFoundError('Contact information not found');
    }

    // Check if already verified (can't reject verified contacts)
    if (existingContact.is_verified) {
      return validationError(
        { id: 'Cannot reject verified contact' },
        'Cannot reject already verified contact information'
      );
    }

    // Delete the contact (soft delete by removing it)
    // In the future, we could add a status field for "rejected" instead of deleting
    const { error: deleteError } = await supabase
      .from('representative_contacts')
      .delete()
      .eq('id', contactId);

    if (deleteError) {
      logger.error('Error rejecting contact', { contactId, error: deleteError });
      return errorResponse('Failed to reject contact information', 500);
    }

    // Notify user if they submitted this contact (before deleting)
    if (existingContact.submitted_by_user_id) {
      await notifyUserContactRejected(supabase, {
        id: existingContact.id,
        representative_id: existingContact.representative_id,
        contact_type: existingContact.contact_type,
        value: existingContact.value,
        representative: (existingContact.representatives_core as any) ? {
          id: (existingContact.representatives_core as any).id,
          name: (existingContact.representatives_core as any).name,
          office: (existingContact.representatives_core as any).office,
          party: (existingContact.representatives_core as any).party,
        } : undefined,
      }, reason, existingContact.submitted_by_user_id);
    }

    logger.info('Contact rejected', {
      contactId,
      representativeId: existingContact.representative_id,
      adminId: adminUser.id,
      reason: reason || 'No reason provided',
    });

    return successResponse({
      message: 'Contact information rejected successfully',
      rejected_contact: {
        id: existingContact.id,
        representative_id: existingContact.representative_id,
        contact_type: existingContact.contact_type,
        value: existingContact.value,
      },
      reason: reason || null,
    });
  } catch (error) {
    logger.error('Unexpected error in reject contact API', error);
    return errorResponse('Internal server error', 500);
  }
});
