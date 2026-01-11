/**
 * Representatives Bulk Fetch Endpoint
 *
 * Efficiently fetch multiple representatives by IDs
 * Addresses Issue #8: Missing bulk operations
 *
 * Created: January 10, 2026
 */

import type { NextRequest } from 'next/server';

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, errorResponse } from '@/lib/api';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import logger from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Rate limiting: 50 bulk requests per 15 minutes per IP (fewer than list endpoint)
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   request.headers.get('x-real-ip') ||
                   '127.0.0.1';
  const rateLimitResult = await apiRateLimiter.checkLimit(
    clientIp,
    '/api/representatives/bulk',
    {
      maxRequests: 50,
      windowMs: 15 * 60 * 1000,
      userAgent: request.headers.get('user-agent') ?? undefined
    }
  );

  if (!rateLimitResult.allowed) {
    logger.warn('Representatives bulk API rate limit exceeded', {
      ip: clientIp,
      endpoint: '/api/representatives/bulk',
      totalHits: rateLimitResult.totalHits
    });
    return errorResponse(
      'Too many requests. Please try again later.',
      429,
      { retryAfter: rateLimitResult.retryAfter },
      'RATE_LIMIT_EXCEEDED'
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    logger.error('Supabase client not available for bulk representatives endpoint');
    return errorResponse('Supabase client not available', 503);
  }

  try {
    const body = await request.json();
    const { ids, include } = body;

    // Validate input
    if (!ids || !Array.isArray(ids)) {
      return errorResponse('Invalid request: ids must be an array', 400);
    }

    if (ids.length === 0) {
      return successResponse({
        representatives: [],
        total: 0
      });
    }

    // Limit bulk requests to 100 IDs at a time to prevent abuse
    const maxBulkSize = 100;
    const validIds = ids.slice(0, maxBulkSize).map((id: any) => {
      const parsed = typeof id === 'string' ? parseInt(id, 10) : id;
      return isNaN(parsed) ? null : parsed;
    }).filter((id: any): id is number => id !== null && id > 0);

    if (validIds.length === 0) {
      return errorResponse('Invalid request: no valid IDs provided', 400);
    }

    const includeList = include && Array.isArray(include) ? include : [];

    // Build query with related data
    const selectQuery = `
      *,
      representative_photos(*),
      representative_contacts(*),
      representative_social_media(*),
      representative_divisions(division_id)
    `;

    const query = supabase
      .from('representatives_core')
      .select(selectQuery, { count: 'exact' })
      .in('id', validIds)
      .eq('is_active', true)
      .not('name', 'ilike', '%test%');

    const { data: representatives, error } = await query;

    if (error) {
      logger.error('Failed to load bulk representatives', {
        error: error.message,
        idCount: validIds.length
      });
      return errorResponse('Failed to load representatives', 502, { reason: error.message });
    }

    // Batch fetch committees for all representatives at once (fix N+1)
    const committeesByRepId: Map<number, any[]> = new Map();
    if (includeList.includes('committees') && representatives && representatives.length > 0) {
      try {
        const repIds = representatives.map((r: any) => r.id).filter(Boolean) as number[];
        if (repIds.length > 0) {
          const { data: allCommittees, error: committeesError } = await supabase
            .from('representative_committees')
            .select('id, representative_id, committee_name, role, is_current, start_date, end_date')
            .in('representative_id', repIds)
            .eq('is_current', true);

          if (!committeesError && allCommittees && Array.isArray(allCommittees)) {
            for (const committee of allCommittees) {
              const repId = committee.representative_id;
              if (repId) {
                if (!committeesByRepId.has(repId)) {
                  committeesByRepId.set(repId, []);
                }
                const existing = committeesByRepId.get(repId);
                if (existing) {
                  existing.push({
                    id: committee.id,
                    committee_name: committee.committee_name,
                    role: committee.role,
                    is_current: committee.is_current,
                    start_date: committee.start_date,
                    end_date: committee.end_date
                  });
                }
              }
            }
          }
        }
      } catch (err) {
        logger.warn('Committee fetch failed in bulk endpoint', {
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    // Transform data to match expected format
    const transformed = (representatives ?? []).map((rep: any) => {
      const committees = committeesByRepId.get(rep.id) ?? [];

      return {
        id: rep.id,
        name: rep.name,
        office: rep.office,
        level: rep.level,
        state: rep.state,
        district: rep.district,
        party: rep.party,
        primary_email: rep.primary_email,
        primary_phone: rep.primary_phone,
        primary_website: rep.primary_website,
        primary_photo_url: rep.primary_photo_url,
        twitter_handle: rep.twitter_handle,
        facebook_url: rep.facebook_url,
        instagram_handle: rep.instagram_handle,
        youtube_channel: rep.youtube_channel,
        linkedin_url: rep.linkedin_url,
        photos: (rep.representative_photos ?? []).map((photo: any) => ({
          id: photo.id,
          url: photo.url,
          source: photo.source,
          is_primary: photo.is_primary,
          alt_text: photo.alt_text,
          attribution: photo.attribution
        })),
        contacts: (rep.representative_contacts ?? []).map((contact: any) => ({
          id: contact.id,
          contact_type: contact.contact_type,
          value: contact.value,
          is_primary: contact.is_primary,
          is_verified: contact.is_verified,
          source: contact.source
        })),
        social_media: (rep.representative_social_media ?? []).map((social: any) => ({
          id: social.id,
          platform: social.platform,
          handle: social.handle,
          url: social.url,
          is_primary: social.is_primary,
          is_verified: social.is_verified,
          followers_count: social.followers_count
        })),
        division_ids: (rep.representative_divisions ?? []).map((d: any) => d.division_id).filter(Boolean),
        committees,
        data_quality_score: rep.data_quality_score,
        is_active: rep.is_active,
        created_at: rep.created_at,
        updated_at: rep.updated_at,
        last_verified: rep.last_verified
      };
    });

    // Preserve order from input IDs
    const orderedReps = validIds.map(id =>
      transformed.find(rep => rep.id === id)
    ).filter((rep): rep is typeof transformed[0] => rep !== undefined);

    const response = successResponse({
      representatives: orderedReps,
      total: orderedReps.length,
      requested: ids.length,
      found: orderedReps.length
    });

    // Add cache headers (shorter TTL for bulk requests)
    response.headers.set('Cache-Control', 'public, max-age=180, stale-while-revalidate=3600');
    response.headers.set('X-RateLimit-Limit', '50');
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
    response.headers.set('X-RateLimit-Reset', new Date(Date.now() + (15 * 60 * 1000)).toISOString());

    return response;
  } catch (error) {
    logger.error('Bulk representatives request failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return errorResponse(
      'Invalid request body',
      400,
      { reason: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
});

