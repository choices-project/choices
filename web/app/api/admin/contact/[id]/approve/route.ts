/**
 * Admin Contact API - Approve Contact
 *
 * Approve a pending contact information submission.
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
} from '@/lib/api';
import { notifyUserContactApproved } from '@/lib/contact/contact-notifications';
import { logger } from '@/lib/utils/logger';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { forbiddenError } from '@/lib/api';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// ============================================================================
// POST - Approve Contact Information
// ============================================================================

export const POST = withErrorHandling(async (
  _request: NextRequest,
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

    // Get Supabase client
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return errorResponse('Database connection not available', 500);
    }

    // Get existing contact with submitter info
    const { data: existingContact, error: fetchError } = await supabase
      .from('representative_contacts')
      .select('id, representative_id, contact_type, value, is_verified, source, submitted_by_user_id')
      .eq('id', contactId)
      .single();

    if (fetchError || !existingContact) {
      return notFoundError('Contact information not found');
    }

    // Check if already verified
    if (existingContact.is_verified) {
      return validationError(
        { id: 'Contact is already verified' },
        'Contact information is already verified'
      );
    }

    // Update contact to verified
    const { data: updatedContact, error: updateError } = await supabase
      .from('representative_contacts')
      .update({
        is_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contactId)
      .select(`
        id,
        representative_id,
        contact_type,
        value,
        is_primary,
        is_verified,
        source,
        created_at,
        updated_at,
        representatives_core!representative_contacts_representative_id_fkey (
          id,
          name,
          office,
          party
        )
      `)
      .single();

    if (updateError || !updatedContact) {
      logger.error('Error approving contact', { contactId, error: updateError });
      return errorResponse('Failed to approve contact information', 500);
    }

    // Notify user if they submitted this contact
    if (existingContact.submitted_by_user_id) {
      await notifyUserContactApproved(supabase, {
        id: updatedContact.id,
        representative_id: updatedContact.representative_id,
        contact_type: updatedContact.contact_type,
        value: updatedContact.value,
        representative: (updatedContact.representatives_core as any) ? {
          id: (updatedContact.representatives_core as any).id,
          name: (updatedContact.representatives_core as any).name,
          office: (updatedContact.representatives_core as any).office,
          party: (updatedContact.representatives_core as any).party,
        } : undefined,
      }, existingContact.submitted_by_user_id);
    }

    logger.info('Contact approved', {
      contactId: updatedContact.id,
      representativeId: updatedContact.representative_id,
      adminId: adminUser.id,
    });

    return successResponse({
      contact: {
        id: updatedContact.id,
        representative_id: updatedContact.representative_id,
        contact_type: updatedContact.contact_type,
        value: updatedContact.value,
        is_primary: updatedContact.is_primary,
        is_verified: updatedContact.is_verified,
        source: updatedContact.source,
        created_at: updatedContact.created_at,
        updated_at: updatedContact.updated_at,
        representative: (updatedContact.representatives_core as any) ? {
          id: (updatedContact.representatives_core as any).id,
          name: (updatedContact.representatives_core as any).name,
          office: (updatedContact.representatives_core as any).office,
          party: (updatedContact.representatives_core as any).party,
        } : null,
      },
      message: 'Contact information approved successfully',
    });
  } catch (error) {
    logger.error('Unexpected error in approve contact API', error);
    return errorResponse('Internal server error', 500);
  }
});
