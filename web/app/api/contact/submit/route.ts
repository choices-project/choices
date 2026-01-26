/**
 * Contact Information Submission API
 *
 * Allows users to submit contact information for representatives.
 * Submissions are marked as unverified and require admin approval.
 *
 * Created: January 26, 2026
 * Status: ✅ ACTIVE
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';

import {
  authError,
  errorResponse,
  notFoundError,
  rateLimitError,
  successResponse,
  validationError,
  withErrorHandling,
  parseBody,
} from '@/lib/api';
import { notifyAdminNewContactSubmission } from '@/lib/contact/contact-notifications';
import { validateAndNormalizeContact, validateContactType, type ContactType } from '@/lib/contact/contact-validation';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { validateRepresentativeId } from '@/lib/security/input-sanitization';
import { logger } from '@/lib/utils/logger';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { forbiddenError } from '@/lib/api';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// ============================================================================
// TYPES
// ============================================================================

type SubmitContactRequest = {
  representative_id: number;
  contact_type: ContactType;
  value: string;
  is_primary?: boolean;
};

// ============================================================================
// POST - Submit Contact Information
// ============================================================================

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Check feature flag
  if (!isFeatureEnabled('CONTACT_INFORMATION_SYSTEM')) {
    return forbiddenError('Contact Information System is currently disabled');
  }

  const startTime = Date.now();

  // Rate limiting: 5 submissions per minute per user
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
  const userAgent = request.headers.get('user-agent');
  const rateLimitOptions: any = {};
  if (userAgent) rateLimitOptions.userAgent = userAgent;
  const rateLimitResult = await apiRateLimiter.checkLimit(
    ip,
    '/api/contact/submit',
    rateLimitOptions
  );
  if (!rateLimitResult.allowed) {
    return rateLimitError('Too many submissions. Please wait before submitting another contact.');
  }

  // Get Supabase client
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    logger.error('Supabase client not available');
    return errorResponse('Database connection not available', 500);
  }

  // Authentication
  const { data: { user }, error: authFetchError } = await supabase.auth.getUser();
  if (authFetchError || !user) {
    logger.warn('Unauthenticated contact submission attempt');
    return authError('Authentication required');
  }

  // Parse request body
  const parsedBody = await parseBody<SubmitContactRequest>(request);
  if (!parsedBody.success) {
    return parsedBody.error;
  }
  const body = parsedBody.data;
  const { representative_id, contact_type, value, is_primary = false } = body;

  // Validate inputs
  if (!representative_id || !contact_type || !value) {
    const missing: Record<string, string> = {};
    if (!representative_id) missing.representative_id = 'Representative ID is required';
    if (!contact_type) missing.contact_type = 'Contact type is required';
    if (!value) missing.value = 'Contact value is required';
    return validationError(missing, 'Representative ID, contact type, and value are required');
  }

  // Validate representative ID
  const repIdValidation = validateRepresentativeId(representative_id.toString());
  if (!repIdValidation.isValid || !repIdValidation.parsedId) {
    return validationError(
      { representative_id: repIdValidation.error ?? 'Invalid representative ID' },
      'Invalid representative ID'
    );
  }
  const validatedRepId = repIdValidation.parsedId;

  // Validate contact type
  if (!validateContactType(contact_type)) {
    return validationError(
      { contact_type: 'Invalid contact type. Must be one of: email, phone, fax, address' },
      'Invalid contact type'
    );
  }

  // Validate and normalize contact value
  const contactValidation = validateAndNormalizeContact(contact_type, value);
  if (!contactValidation.isValid || !contactValidation.normalized) {
    return validationError(
      { value: contactValidation.error ?? 'Invalid contact value' },
      contactValidation.error ?? 'Invalid contact value'
    );
  }

  // Check if representative exists
  const { data: representative, error: repError } = await supabase
    .from('representatives_core')
    .select('id, name, office')
    .eq('id', validatedRepId)
    .single();

  if (repError || !representative) {
    logger.warn('Contact submission for non-existent representative', { representative_id: validatedRepId });
    return notFoundError('Representative not found');
  }

  // Check for duplicate contact (same type and value for this representative)
  const { data: existingContact, error: duplicateError } = await supabase
    .from('representative_contacts')
    .select('id, contact_type, value, source, is_verified')
    .eq('representative_id', validatedRepId)
    .eq('contact_type', contact_type.toLowerCase())
    .eq('value', contactValidation.normalized)
    .maybeSingle();

  if (duplicateError) {
    logger.error('Error checking for duplicate contact', { error: duplicateError });
    return errorResponse('Failed to check for duplicate contact', 500);
  }

  if (existingContact) {
    // If contact exists and is verified, don't allow duplicate submission
    if (existingContact.is_verified) {
      return validationError(
        { value: 'This contact information already exists and is verified' },
        'Contact information already exists'
      );
    }
    // If unverified user submission exists, update it instead of creating duplicate
    if (existingContact.source === 'user_submission') {
      const { data: updatedContact, error: updateError } = await supabase
        .from('representative_contacts')
        .update({
          value: contactValidation.normalized,
          is_primary: is_primary,
          submitted_by_user_id: user.id, // Update submitter if user resubmits
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingContact.id)
        .select()
        .single();

      if (updateError || !updatedContact) {
        logger.error('Error updating existing contact submission', { error: updateError });
        return errorResponse('Failed to update contact submission', 500);
      }

      const responseTime = Date.now() - startTime;
      logger.info('Contact submission updated', {
        contactId: updatedContact.id,
        representativeId: validatedRepId,
        contactType: contact_type,
        userId: user.id,
        responseTime,
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
        message: 'Contact submission updated successfully',
      });
    }
  }

  // Create new contact submission
  const { data: newContact, error: insertError } = await supabase
    .from('representative_contacts')
    .insert({
      representative_id: validatedRepId,
      contact_type: contact_type.toLowerCase(),
      value: contactValidation.normalized,
      is_primary: is_primary,
      is_verified: false, // Requires admin approval
      source: 'user_submission',
      submitted_by_user_id: user.id, // Track who submitted for notifications
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError || !newContact) {
    logger.error('Error creating contact submission', { error: insertError });
    return errorResponse('Failed to submit contact information', 500);
  }

  // Notify admins of new submission
  await notifyAdminNewContactSubmission(supabase, {
    id: newContact.id,
    representative_id: newContact.representative_id,
    contact_type: newContact.contact_type,
    value: newContact.value,
    representative: {
      id: representative.id,
      name: representative.name,
      office: representative.office,
    },
  });

  const responseTime = Date.now() - startTime;
  logger.info('Contact submission created', {
    contactId: newContact.id,
    representativeId: validatedRepId,
    contactType: contact_type,
    userId: user.id,
    responseTime,
  });

  return successResponse({
    contact: {
      id: newContact.id,
      representative_id: newContact.representative_id,
      contact_type: newContact.contact_type,
      value: newContact.value,
      is_primary: newContact.is_primary,
      is_verified: newContact.is_verified,
      source: newContact.source,
      created_at: newContact.created_at,
      updated_at: newContact.updated_at,
    },
    message: 'Contact information submitted successfully. It will be reviewed by an administrator.',
  });
});
