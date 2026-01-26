/**
 * Contact Information API - Single Contact
 *
 * Get, update, or delete a single contact information record.
 *
 * Created: January 26, 2026
 * Status: ✅ ACTIVE
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';

import {
  authError,
  errorResponse,
  forbiddenError,
  notFoundError,
  successResponse,
  validationError,
  withErrorHandling,
  parseBody,
} from '@/lib/api';
import { validateAndNormalizeContact, validateContactType, type ContactType } from '@/lib/contact/contact-validation';
import { logger } from '@/lib/utils/logger';
import { isFeatureEnabled } from '@/lib/core/feature-flags';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// ============================================================================
// TYPES
// ============================================================================

type UpdateContactRequest = {
  contact_type?: ContactType;
  value?: string;
  is_primary?: boolean;
};

// ============================================================================
// GET - Get Contact by ID
// ============================================================================

export const GET = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  // Check feature flag
  if (!isFeatureEnabled('CONTACT_INFORMATION_SYSTEM')) {
    return forbiddenError('Contact Information System is currently disabled');
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

  // Authentication
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return authError('Authentication required');
  }

  // Get contact with representative info
  // Use relationship hint to avoid ambiguity
  const { data: contact, error: contactError } = await supabase
    .from('representative_contacts')
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
    .eq('id', contactId)
    .single();

  if (contactError || !contact) {
    logger.warn('Contact not found', { contactId, error: contactError });
    return notFoundError('Contact information not found');
  }

  return successResponse({
    contact: {
      id: contact.id,
      representative_id: contact.representative_id,
      contact_type: contact.contact_type,
      value: contact.value,
      is_primary: contact.is_primary,
      is_verified: contact.is_verified,
      source: contact.source,
      created_at: contact.created_at,
      updated_at: contact.updated_at,
      representative: contact.representatives_core ? {
        id: contact.representatives_core.id,
        name: contact.representatives_core.name,
        office: contact.representatives_core.office,
        party: contact.representatives_core.party,
      } : null,
    },
  });
});

// ============================================================================
// PATCH - Update Contact Information
// ============================================================================

export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  // Check feature flag
  if (!isFeatureEnabled('CONTACT_INFORMATION_SYSTEM')) {
    return forbiddenError('Contact Information System is currently disabled');
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

  // Authentication
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return authError('Authentication required');
  }

  // Get existing contact
  const { data: existingContact, error: fetchError } = await supabase
    .from('representative_contacts')
    .select('id, representative_id, contact_type, value, source, is_verified')
    .eq('id', contactId)
    .single();

  if (fetchError || !existingContact) {
    return notFoundError('Contact information not found');
  }

  // Only allow users to update their own submissions (unverified user submissions)
  if (existingContact.source !== 'user_submission' || existingContact.is_verified) {
    return forbiddenError('You can only update your own unverified submissions');
  }

  // Parse request body
  const parsedBody = await parseBody<UpdateContactRequest>(request);
  if (!parsedBody.success) {
    return parsedBody.error;
  }
  const body = parsedBody.data;

  // Build update object
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  // Validate and update contact type if provided
  if (body.contact_type !== undefined) {
    if (!validateContactType(body.contact_type)) {
      return validationError(
        { contact_type: 'Invalid contact type. Must be one of: email, phone, fax, address' },
        'Invalid contact type'
      );
    }
    updateData.contact_type = body.contact_type.toLowerCase();
  }

  // Validate and update value if provided
  if (body.value !== undefined) {
    const contactType = (body.contact_type || existingContact.contact_type) as ContactType;
    const contactValidation = validateAndNormalizeContact(contactType, body.value);
    if (!contactValidation.isValid || !contactValidation.normalized) {
      return validationError(
        { value: contactValidation.error ?? 'Invalid contact value' },
        contactValidation.error ?? 'Invalid contact value'
      );
    }
    updateData.value = contactValidation.normalized;
  }

  // Update is_primary if provided
  if (body.is_primary !== undefined) {
    updateData.is_primary = body.is_primary;
  }

  // Update contact
  const { data: updatedContact, error: updateError } = await supabase
    .from('representative_contacts')
    .update(updateData)
    .eq('id', contactId)
    .select()
    .single();

  if (updateError || !updatedContact) {
    logger.error('Error updating contact', { contactId, error: updateError });
    return errorResponse('Failed to update contact information', 500);
  }

  logger.info('Contact updated', {
    contactId: updatedContact.id,
    userId: user.id,
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
    },
    message: 'Contact information updated successfully',
  });
});

// ============================================================================
// DELETE - Delete Contact Information
// ============================================================================

export const DELETE = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  // Check feature flag
  if (!isFeatureEnabled('CONTACT_INFORMATION_SYSTEM')) {
    return forbiddenError('Contact Information System is currently disabled');
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

  // Authentication
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return authError('Authentication required');
  }

  // Get existing contact
  const { data: existingContact, error: fetchError } = await supabase
    .from('representative_contacts')
    .select('id, source, is_verified')
    .eq('id', contactId)
    .single();

  if (fetchError || !existingContact) {
    return notFoundError('Contact information not found');
  }

  // Only allow users to delete their own unverified submissions
  // Admins can delete via admin API
  if (existingContact.source !== 'user_submission' || existingContact.is_verified) {
    return forbiddenError('You can only delete your own unverified submissions');
  }

  // Delete contact
  const { error: deleteError } = await supabase
    .from('representative_contacts')
    .delete()
    .eq('id', contactId);

  if (deleteError) {
    logger.error('Error deleting contact', { contactId, error: deleteError });
    return errorResponse('Failed to delete contact information', 500);
  }

  logger.info('Contact deleted', {
    contactId,
    userId: user.id,
  });

  return successResponse({
    message: 'Contact information deleted successfully',
  });
});
