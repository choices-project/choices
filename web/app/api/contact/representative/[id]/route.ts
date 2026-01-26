/**
 * Contact Information API - By Representative
 *
 * Get all contact information for a specific representative.
 *
 * Created: January 26, 2026
 * Status: ✅ ACTIVE
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';

import {
  authError,
  errorResponse,
  notFoundError,
  successResponse,
  validationError,
  withErrorHandling,
} from '@/lib/api';
import { validateRepresentativeId } from '@/lib/security/input-sanitization';
import { logger } from '@/lib/utils/logger';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { forbiddenError } from '@/lib/api';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// ============================================================================
// GET - Get Contacts for Representative
// ============================================================================

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  // Check feature flag
  if (!isFeatureEnabled('CONTACT_INFORMATION_SYSTEM')) {
    return forbiddenError('Contact Information System is currently disabled');
  }

  const { id } = await params;

  // Validate representative ID
  const repIdValidation = validateRepresentativeId(id);
  if (!repIdValidation.isValid || !repIdValidation.parsedId) {
    return validationError(
      { id: repIdValidation.error ?? 'Invalid representative ID' },
      'Invalid representative ID'
    );
  }
  const representativeId = repIdValidation.parsedId;

  // Get Supabase client
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  // Authentication (optional - could make public, but keeping auth for now)
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return authError('Authentication required');
  }

  // Check if representative exists
  const { data: representative, error: repError } = await supabase
    .from('representatives_core')
    .select('id, name, office')
    .eq('id', representativeId)
    .single();

  if (repError || !representative) {
    return notFoundError('Representative not found');
  }

  // Parse query parameters for filtering
  const { searchParams } = new URL(request.url);
  const contactType = searchParams.get('contact_type');
  const isVerified = searchParams.get('is_verified');
  const source = searchParams.get('source');

  // Build query
  let query = supabase
    .from('representative_contacts')
    .select('id, representative_id, contact_type, value, is_primary, is_verified, source, created_at, updated_at')
    .eq('representative_id', representativeId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });

  // Apply filters
  if (contactType) {
    query = query.eq('contact_type', contactType.toLowerCase());
  }
  if (isVerified !== null) {
    query = query.eq('is_verified', isVerified === 'true');
  }
  if (source) {
    query = query.eq('source', source);
  }

  // Execute query
  const { data: contacts, error: contactsError } = await query;

  if (contactsError) {
    logger.error('Error fetching contacts', { representativeId, error: contactsError });
    return errorResponse('Failed to fetch contact information', 500);
  }

  return successResponse({
    representative: {
      id: representative.id,
      name: representative.name,
      office: representative.office,
    },
    contacts: contacts || [],
    count: contacts?.length || 0,
  });
});
