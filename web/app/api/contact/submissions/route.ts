/**
 * User Contact Submissions API
 *
 * Get the current user's contact information submissions (pending, approved, rejected).
 *
 * Created: February 2026
 */

import { getSupabaseAdminClient, getSupabaseServerClient } from '@/utils/supabase/server';

import {
  authError,
  errorResponse,
  forbiddenError,
  successResponse,
  withErrorHandling,
} from '@/lib/api';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (_request: NextRequest) => {
  if (!isFeatureEnabled('CONTACT_INFORMATION_SYSTEM')) {
    return forbiddenError('Contact Information System is currently disabled');
  }

  const serverClient = await getSupabaseServerClient();
  if (!serverClient) {
    return errorResponse('Database connection not available', 500);
  }

  const {
    data: { user },
    error: authErrorResult,
  } = await serverClient.auth.getUser();
  if (authErrorResult || !user) {
    return authError('Sign in to view your submissions');
  }

  const supabase = await getSupabaseAdminClient();
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const { data: contacts, error } = await (supabase as any)
    .from('representative_contacts')
    .select(
      `
      id,
      representative_id,
      contact_type,
      value,
      is_primary,
      is_verified,
      source,
      rejected_at,
      rejection_reason,
      created_at,
      updated_at,
      representatives_core!representative_contacts_representative_id_fkey (
        id,
        name,
        office,
        party
      )
    `
    )
    .eq('source', 'user_submission')
    .eq('submitted_by_user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching user contact submissions', { error, userId: user.id });
    return errorResponse('Failed to fetch your submissions', 500);
  }

  const formatted = (contacts ?? []).map((c: any) => {
    const status = c.rejected_at ? 'rejected' : (c.is_verified ? 'approved' : 'pending');
    return {
      id: c.id,
      representative_id: c.representative_id,
      contact_type: c.contact_type,
      value: c.value,
      is_primary: c.is_primary,
      is_verified: c.is_verified,
      status,
      rejection_reason: c.rejection_reason ?? null,
      created_at: c.created_at,
      updated_at: c.updated_at,
      representative: c.representatives_core
        ? {
            id: c.representatives_core.id,
            name: c.representatives_core.name,
            office: c.representatives_core.office,
            party: c.representatives_core.party,
          }
        : null,
    };
  });

  return successResponse({
    submissions: formatted,
    pending: formatted.filter((s: { status: string }) => s.status === 'pending').length,
    approved: formatted.filter((s: { status: string }) => s.status === 'approved').length,
    rejected: formatted.filter((s: { status: string }) => s.status === 'rejected').length,
  });
});
