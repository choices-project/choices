/**
 * Admin Contact API - Pending Submissions
 *
 * Get pending contact information submissions for admin review.
 *
 * Created: January 26, 2026
 * Status: ✅ ACTIVE
 */

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { requireAdminOr401, getAdminUser } from '@/features/auth/lib/admin-auth';

import { successResponse, errorResponse, withErrorHandling } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// ============================================================================
// GET - Get Pending Contact Submissions
// ============================================================================

export const GET = withErrorHandling(async (request: NextRequest) => {
  try {
    const authGate = await requireAdminOr401();
    if (authGate) return authGate;

    const adminUser = await getAdminUser();
    if (!adminUser) {
      return errorResponse('Admin access required', 403);
    }

    // Get Supabase client
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return errorResponse('Database connection not available', 500);
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const representativeId = searchParams.get('representative_id');
    const contactType = searchParams.get('contact_type');
    const dateRange = searchParams.get('dateRange') ?? 'all';
    const search = searchParams.get('search') ?? '';
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    // Build query - get pending user submissions
    let query = supabase
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
        representatives_core (
          id,
          name,
          office,
          party
        )
      `)
      .eq('is_verified', false)
      .eq('source', 'user_submission')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (representativeId) {
      const repId = parseInt(representativeId, 10);
      if (!isNaN(repId)) {
        query = query.eq('representative_id', repId);
      }
    }

    if (contactType) {
      query = query.eq('contact_type', contactType.toLowerCase());
    }

    // Apply date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0); // All time
      }

      query = query.gte('created_at', startDate.toISOString());
    }

    // Execute query
    const { data: contacts, error: contactsError } = await query;

    if (contactsError) {
      logger.error('Error fetching pending contacts', { error: contactsError });
      return errorResponse('Failed to fetch pending contact submissions', 500);
    }

    // Apply search filter (client-side for now, could be moved to DB)
    let filteredContacts = contacts || [];
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filteredContacts = filteredContacts.filter((contact) => {
        const valueMatch = contact.value?.toLowerCase().includes(searchLower);
        const repNameMatch = (contact.representatives_core as any)?.name?.toLowerCase().includes(searchLower);
        return valueMatch || repNameMatch;
      });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('representative_contacts')
      .select('id', { count: 'exact', head: true })
      .eq('is_verified', false)
      .eq('source', 'user_submission');

    if (representativeId) {
      const repId = parseInt(representativeId, 10);
      if (!isNaN(repId)) {
        countQuery = countQuery.eq('representative_id', repId);
      }
    }

    if (contactType) {
      countQuery = countQuery.eq('contact_type', contactType.toLowerCase());
    }

    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      countQuery = countQuery.gte('created_at', startDate.toISOString());
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      logger.error('Error counting pending contacts', { error: countError });
    }

    // Format response
    const formattedContacts = filteredContacts.map((contact) => ({
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
        id: (contact.representatives_core as any).id,
        name: (contact.representatives_core as any).name,
        office: (contact.representatives_core as any).office,
        party: (contact.representatives_core as any).party,
      } : null,
    }));

    return successResponse({
      contacts: formattedContacts,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    logger.error('Unexpected error in pending contacts API', error);
    return errorResponse('Internal server error', 500);
  }
});
