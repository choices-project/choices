/**
 * Representatives API Endpoint
 *
 * Provides REST API access to representative data from the database
 *
 * Created: October 28, 2025
 * Updated: November 6, 2025 - Modernized
 * Status: ✅ PRODUCTION
 */

import { NextResponse } from 'next/server';

import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, errorResponse } from '@/lib/api';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { CivicsCache } from '@/lib/utils/civics-cache';
import logger from '@/lib/utils/logger';
import { parseOfficeCityZip } from '@/lib/utils/parse-office-address';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Track request start time for performance monitoring (server-side only - safe for API routes)
  // Following established pattern: use Date.now() for simple timing (consistent with dashboard/admin APIs)
  const requestStartTime = Date.now();

  // Rate limiting: 100 requests per 15 minutes per IP (generous for public data)
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   request.headers.get('x-real-ip') ||
                   '127.0.0.1';
  const rateLimitResult = await apiRateLimiter.checkLimit(
    clientIp,
    '/api/representatives',
    (() => {
      const userAgent = request.headers.get('user-agent') ?? '';
      const options = {
      maxRequests: 100,
      windowMs: 15 * 60 * 1000, // 15 minutes
      } as const;

      if (userAgent) {
        return { ...options, userAgent };
      }

      return options;
    })()
  );

  if (!rateLimitResult.allowed) {
    logger.warn('Representatives API rate limit exceeded', {
      ip: clientIp,
      endpoint: '/api/representatives',
      totalHits: rateLimitResult.totalHits
    });
    return errorResponse(
      'Too many requests. Please wait a moment before trying again.',
      429,
      {
        retryAfter: rateLimitResult.retryAfter,
        suggestion: 'Please wait a few moments and try your search again.',
        limit: '100 requests per 15 minutes'
      },
      'RATE_LIMIT_EXCEEDED'
    );
  }

  let supabase;
  try {
    supabase = await getSupabaseServerClient();
  } catch (error) {
    logger.error('Failed to initialize Supabase client for representatives endpoint', {
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV,
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    });
    // Calculate response time even for errors (server-side only - Date.now() is fine in API routes)
    const errorResponseTime = Date.now() - requestStartTime;
    // Use established errorResponse pattern, then add custom headers (following response-utils.ts pattern)
    const response = errorResponse(
      'Service temporarily unavailable. Please try again in a moment.',
      503,
      {
        retryAfter: 60,
        suggestion: 'If this problem persists, please refresh the page.',
        timestamp: new Date().toISOString()
      },
      'DATABASE_UNAVAILABLE'
    );
    response.headers.set('Retry-After', '60');
    response.headers.set('X-Response-Time', `${errorResponseTime}ms`);
    response.headers.set('X-Error-Type', 'database-unavailable');
    return response;
  }

  if (!supabase) {
    logger.error('Supabase client not available for representatives endpoint');
    const errorResponseTime = Date.now() - requestStartTime;
    // Use established errorResponse pattern, then add custom headers
    const response = errorResponse(
      'Database connection is not available. Please try again shortly.',
      503,
      {
        retryAfter: 60,
        suggestion: 'If this problem persists, please refresh the page or try again later.',
        timestamp: new Date().toISOString()
      },
      'DATABASE_CONNECTION_FAILED'
    );
    response.headers.set('Retry-After', '60');
    response.headers.set('X-Response-Time', `${errorResponseTime}ms`);
    response.headers.set('X-Error-Type', 'database-connection-failed');
    return response;
  }

    const { searchParams } = new URL(request.url);

    // Parse query parameters
  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');
  const limit = Math.min(Math.max(parseInt(limitParam ?? '20', 10), 1), 100); // Clamp between 1-100
  const offset = Math.max(parseInt(offsetParam ?? '0', 10), 0); // Ensure non-negative
    const state = searchParams.get('state');
    const party = searchParams.get('party');
    const level = searchParams.get('level');
  const searchParam = searchParams.get('search');

  // Validate and sanitize search parameter (Issue #7)
  let search: string | null = null;
  if (searchParam) {
    // Limit search string length to prevent DoS and performance issues
    const maxSearchLength = 200;
    const sanitized = searchParam.trim().slice(0, maxSearchLength);
    if (sanitized.length > 0) {
      search = sanitized;
    }
  }

  // Support filtering by OCD division ID (from Google API lookup)
  let ocdDivisionId = searchParams.get('ocd_division_id') || searchParams.get('division_id');
  const district = searchParams.get('district');
  const cityParam = searchParams.get('city')?.trim() || null;
  const zipParam = searchParams.get('zip')?.trim() || null;

  if (cityParam && !state) {
    return errorResponse(
      'state is required when filtering by city (e.g. ?city=Annapolis&state=MD)',
      400,
      { suggestion: 'Add state to your query.' },
      'VALIDATION_ERROR'
    );
  }

  // ?zip= → resolve via zip_to_ocd → ocd_division_id (table may not be in generated types)
  // Keep zip5 for fallback filter by office_zip when zip_to_ocd has no match
  let zip5: string | null = null;
  if (zipParam && !ocdDivisionId) {
    zip5 = zipParam.replace(/\D/g, '').slice(0, 5);
    if (zip5.length === 5) {
      try {
        const { data: zipRow, error: zipErr } = await (supabase as any)
          .from('zip_to_ocd')
          .select('ocd_division_id')
          .eq('zip5', zip5)
          .order('confidence', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!zipErr && zipRow?.ocd_division_id) {
          ocdDivisionId = zipRow.ocd_division_id as string;
        }
      } catch (e) {
        logger.warn('ZIP lookup failed', { zip: zip5, error: e instanceof Error ? e.message : String(e) });
      }
    }
  }

  // Support sorting parameter (Issue #5)
  const sortBy = searchParams.get('sort_by') || 'data_quality_score'; // default: quality score
  const sortOrder = searchParams.get('sort_order') || 'desc'; // default: descending

  // Validate sort parameters
  const validSortFields = ['data_quality_score', 'name', 'office', 'state', 'updated_at', 'created_at'];
  const validSortOrders = ['asc', 'desc'];
  const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'data_quality_score';
  const finalSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() as 'asc' | 'desc' : 'desc';

  // Support field selection (Issue #4)
  const fieldsParam = searchParams.get('fields');
  const requestedFields = fieldsParam ? fieldsParam.split(',').map(f => f.trim()).filter(Boolean) : [];

  // If filtering by OCD division ID, need to query representative_divisions first
  let representativeIds: number[] | null = null;
  if (ocdDivisionId) {
    try {
      const { data: divisionData, error: divError } = await supabase
        .from('representative_divisions')
        .select('representative_id')
        .eq('division_id', ocdDivisionId);

      if (divError) {
        logger.error('Failed to query representative_divisions', {
          error: divError.message,
          ocdDivisionId
        });
        // Continue without division filter if query fails
      } else if (divisionData && divisionData.length > 0) {
        representativeIds = divisionData.map((d: any) => d.representative_id).filter(Boolean);
        if (representativeIds.length === 0) {
          // No representatives found for this division
          return successResponse({
            representatives: [],
            total: 0,
            page: 1,
            limit,
            hasMore: false
          });
        }
      } else if (ocdDivisionId && (!divisionData || divisionData.length === 0)) {
        // OCD division ID provided but no matches found
        return successResponse({
          representatives: [],
          total: 0,
          page: 1,
      limit,
          hasMore: false
        });
      }
    } catch (err) {
      logger.error('Error querying representative_divisions', {
        error: err instanceof Error ? err.message : 'Unknown error',
        ocdDivisionId
      });
      // Continue without division filter if query fails
    }
  }

  // Support include parameter for related data (similar to v1/civics endpoints)
  const includeParam = searchParams.get('include');
  const include = includeParam ? includeParam.split(',').filter(Boolean) : [];

  // Build query from representatives_core table with related data
  // Note: Committees are queried separately if needed to avoid RLS issues
  // Optimization: Only include related data that's actually needed (Issue #9)
  const includePhotos = include.length === 0 || include.includes('photos');
  const includeContacts = include.length === 0 || include.includes('contacts');
  const includeSocial = include.length === 0 || include.includes('social_media');
  const includeDivisions = include.length === 0 || include.includes('divisions');

  let selectQuery = '*';

  if (includePhotos) {
    selectQuery += ', representative_photos!fk_representative_photos_representative_id(*)';
  }
  // Always join contacts so we can parse office_city/office_zip from primary address
  selectQuery += ', representative_contacts!fk_representative_contacts_representative_id(*)';
  if (includeSocial) {
    selectQuery += ', representative_social_media!fk_representative_social_media_representative_id(*)';
  }
  if (includeDivisions) {
    selectQuery += ', representative_divisions!fk_representative_divisions_representative_id(division_id)';
  }

  // Build optimized query with proper filtering order (most selective filters first)
  // Optimization: Apply filters in order of selectivity for better query planning
  let query = supabase
    .from('representatives_core')
    .select(selectQuery, { count: 'exact' })
    .eq('status', 'active') // Use status field instead of is_active
    .not('name', 'ilike', '%test%');

  // Apply most selective filters first (better query performance)
  // If filtering by specific IDs, apply first (most selective)
  if (representativeIds && representativeIds.length > 0) {
    query = query.in('id', representativeIds);
  }
  // Then apply state (highly selective)
  if (state) {
    query = query.eq('state', state);
  }
  // Then apply level and party (moderately selective)
  if (level) {
    query = query.eq('level', level);
  }
  if (party) {
    query = query.eq('party', party);
  }
  // Then apply district (moderately selective)
  if (district) {
    query = query.eq('district', district);
  }
  // Apply text search last (least selective, most expensive)
  if (search) {
    query = query.or(`name.ilike.%${search}%,office.ilike.%${search}%`);
  }

  // Note: Filters are already applied above in optimal order for query performance

  // City filter: fetch up to CAP, then filter by office_city in-memory and paginate.
  // Zip fallback: when zip provided but zip_to_ocd has no match, filter by office_zip instead.
  const CITY_CAP = 2000;
  const useCityFilter = Boolean(cityParam && state);
  const useZipFallbackFilter = Boolean(zip5 && zip5.length === 5 && state && !ocdDivisionId);
  const useInMemoryFilter = useCityFilter || useZipFallbackFilter;
  const queryOffset = useInMemoryFilter ? 0 : offset;
  const queryLimit = useInMemoryFilter ? CITY_CAP : limit;

  const repListCacheKey = CivicsCache.getRepListKey({
    state: state || null,
    level: level || null,
    city: cityParam,
    zip: zipParam,
    offset,
    limit,
    search,
    ocdDivisionId: ocdDivisionId || null,
    district: district || null,
    party: party || null,
    sortBy: finalSortBy,
    sortOrder: finalSortOrder,
    include: includeParam || null,
    fields: fieldsParam || null
  });
  const cachedList = CivicsCache.getCachedRepList<{
    representatives: any[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }>(repListCacheKey);
  if (cachedList) {
    const queryHash = `${state || ''}-${party || ''}-${level || ''}-${search || ''}-${ocdDivisionId || ''}-${district || ''}-${cityParam || ''}-${zipParam || ''}`;
    const etagVal = `reps-${cachedList.total}-${cachedList.page}-${limit}-${finalSortBy}-${finalSortOrder}-${queryHash.substring(0, 20)}`;
    const etag = `"${etagVal}"`;
    const res = successResponse({
      representatives: cachedList.representatives,
      total: cachedList.total,
      page: cachedList.page,
      limit: cachedList.limit,
      hasMore: cachedList.hasMore
    });
    res.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=86400');
    res.headers.set('ETag', etag);
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      const headers = new Headers();
      headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=86400');
      headers.set('ETag', etag);
      return new NextResponse(null, { status: 304, headers });
    }
    return res;
  }

  // Apply custom sorting (Issue #5)
  if (finalSortBy === 'data_quality_score') {
    query = query.order('data_quality_score', {
      ascending: finalSortOrder === 'asc',
      nullsFirst: false
    });
    // Secondary sort by name for consistent ordering
    query = query.order('name', { ascending: true });
  } else if (finalSortBy === 'name') {
    query = query.order('name', { ascending: finalSortOrder === 'asc' });
  } else if (finalSortBy === 'office') {
    query = query.order('office', { ascending: finalSortOrder === 'asc' });
    query = query.order('name', { ascending: true }); // Secondary sort
  } else if (finalSortBy === 'state') {
    query = query.order('state', { ascending: finalSortOrder === 'asc' });
    query = query.order('name', { ascending: true }); // Secondary sort
  } else if (finalSortBy === 'updated_at' || finalSortBy === 'created_at') {
    query = query.order(finalSortBy, {
      ascending: finalSortOrder === 'asc',
      nullsFirst: false
    });
    query = query.order('name', { ascending: true }); // Secondary sort
  } else {
    // Default fallback
    query = query.order('data_quality_score', { ascending: false, nullsFirst: false });
    query = query.order('name', { ascending: true });
  }

  // Apply pagination after filters and sorting
  query = query.range(queryOffset, queryOffset + queryLimit - 1);

  const { data: representatives, error, count } = await query;

  if (error) {
    logger.error('Failed to load representatives', { error: error.message, query: { state, party, level, search } });
    // User-friendly error message with actionable guidance
    return errorResponse(
      'Unable to load representatives at this time. Please try again or refine your search.',
      502,
      {
        reason: error.message,
        suggestion: 'Try refreshing the page or adjusting your filters.',
        retryAfter: 30
      },
      'REPRESENTATIVES_FETCH_FAILED'
    );
  }

  // Fix N+1 query: Batch fetch committees for all representatives at once (Issue #1)
  const committeesByRepId: Map<number, any[]> = new Map();
  if (include.includes('committees') && representatives && representatives.length > 0) {
    try {
      const repIds = representatives.map((r: any) => r.id).filter(Boolean) as number[];
      if (repIds.length > 0) {
        const { data: allCommittees, error: committeesError } = await supabase
          .from('representative_committees')
          .select('id, representative_id, committee_name, role, is_current, start_date, end_date')
          .in('representative_id', repIds)
          .eq('is_current', true);

        if (!committeesError && allCommittees && Array.isArray(allCommittees)) {
          // Group committees by representative_id
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
          logger.info('Fetched committees in batch', {
            representativeCount: repIds.length,
            totalCommittees: allCommittees.length
          });
        } else if (committeesError) {
          logger.warn('Failed to fetch committees (RLS or permissions issue)', {
            error: committeesError.message,
            representativeCount: repIds.length
          });
        }
      }
    } catch (err) {
      logger.warn('Committee fetch failed (RLS restriction)', {
        error: err instanceof Error ? err.message : 'Unknown error',
        representativeCount: representatives?.length ?? 0
      });
      // Continue without committees - not critical
    }
  }

  // Transform data to match expected format (no longer needs async map due to batch committee fetch)
  const transformed = (representatives ?? []).map((rep: any) => {
    // Get committees from pre-fetched map
    const committees = committeesByRepId.get(rep.id) ?? [];

    // Build full representative object
    const photos = includePhotos
      ? (rep.representative_photos ?? []).map((photo: any) => ({
          id: photo.id,
          url: photo.url,
          source: photo.source,
          is_primary: photo.is_primary,
          alt_text: photo.alt_text,
          attribution: photo.attribution
        }))
      : [];
    const primaryPhotoFromSet =
      photos.find((photo: any) => photo.is_primary)?.url ?? photos[0]?.url ?? null;

    // Parse office city/zip from primary address (contact_type=address)
    const contacts = rep.representative_contacts ?? [];
    const primaryAddress = contacts
      .filter((c: any) => (c.contact_type || '').toLowerCase() === 'address')
      .sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))[0];
    const officeLocation = primaryAddress?.value ? parseOfficeCityZip(primaryAddress.value) : null;

    const fullRep: Record<string, any> = {
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
      primary_photo_url: rep.primary_photo_url ?? primaryPhotoFromSet,
      twitter_handle: rep.twitter_handle,
      facebook_url: rep.facebook_url,
      instagram_handle: rep.instagram_handle,
      youtube_channel: rep.youtube_channel,
      linkedin_url: rep.linkedin_url,
      ...(officeLocation ? { office_city: officeLocation.city, office_zip: officeLocation.zip } : {}),
      // Include related data only if requested or if no include parameter (default behavior)
      ...(includePhotos ? {
        photos
      } : {}),
      ...(includeContacts ? {
        contacts: contacts.map((contact: any) => ({
          id: contact.id,
          contact_type: contact.contact_type,
          value: contact.value,
          is_primary: contact.is_primary,
          is_verified: contact.is_verified,
          source: contact.source
        }))
      } : {}),
      ...(includeSocial ? {
        social_media: (rep.representative_social_media ?? []).map((social: any) => ({
          id: social.id,
          platform: social.platform,
          handle: social.handle,
          url: social.url,
          is_primary: social.is_primary,
          is_verified: social.is_verified,
          followers_count: social.followers_count
        }))
      } : {}),
      ...(includeDivisions ? {
        division_ids: (rep.representative_divisions ?? []).map((d: any) => d.division_id).filter(Boolean)
      } : {}),
      committees,
      data_quality_score: rep.data_quality_score,
      data_sources: rep.data_sources,
      status: rep.status, // Use status field
      is_active: rep.is_active, // Keep for backward compatibility
      verification_status: rep.verification_status,
      created_at: rep.created_at,
      updated_at: rep.updated_at,
      last_verified: rep.last_verified
    };

    // Apply field selection if requested (Issue #4)
    if (requestedFields.length > 0) {
      const filtered: Record<string, any> = {};
      // Always include id for reference
      filtered.id = fullRep.id;
      
      // Include requested fields that exist in fullRep
      requestedFields.forEach(field => {
        if (field in fullRep) {
          filtered[field] = fullRep[field];
        }
      });
      
      // Always include essential fields even if not explicitly requested
      // This ensures the frontend always has the data it needs
      if (!requestedFields.includes('status') && 'status' in fullRep) {
        filtered.status = fullRep.status;
      }
      if (!requestedFields.includes('data_sources') && 'data_sources' in fullRep) {
        filtered.data_sources = fullRep.data_sources;
      }
      if (!requestedFields.includes('verification_status') && 'verification_status' in fullRep) {
        filtered.verification_status = fullRep.verification_status;
      }
      
      return filtered;
    }

    return fullRep;
  });

  let outputReps = transformed;
  let finalTotal = count ?? 0;
  let hasMore = (representatives ?? []).length === queryLimit && (queryOffset + queryLimit) < finalTotal;

  let filtered = transformed;
  if (useCityFilter && cityParam) {
    const cityNorm = cityParam.trim().toLowerCase().replace(/\s+/g, ' ');
    filtered = filtered.filter((r: any) => {
      const oc = (r.office_city as string)?.trim().toLowerCase().replace(/\s+/g, ' ');
      if (!oc) return false;
      // Partial match: "san francis" matches "san francisco", "san francisco" matches "san francis"
      return oc.includes(cityNorm) || cityNorm.includes(oc);
    });
  }
  if (useZipFallbackFilter && zip5) {
    filtered = filtered.filter((r: any) => {
      const oz = (r.office_zip as string)?.replace(/\D/g, '').slice(0, 5);
      return oz && oz === zip5;
    });
  }
  if (useInMemoryFilter) {
    finalTotal = filtered.length;
    outputReps = filtered.slice(offset, offset + limit);
    hasMore = offset + limit < finalTotal;
  }

  const page = Math.floor(offset / limit) + 1;

  CivicsCache.cacheRepList(repListCacheKey, {
    representatives: outputReps,
    total: finalTotal,
    page,
    limit,
    hasMore
  });

  // Generate ETag for caching (Issue #2)
  // Include query parameters in ETag for proper cache invalidation
  const queryHash = `${state || ''}-${party || ''}-${level || ''}-${search || ''}-${ocdDivisionId || ''}-${district || ''}-${cityParam || ''}-${zipParam || ''}`;
  const etagValue = `${finalTotal}-${page}-${limit}-${finalSortBy}-${finalSortOrder}-${queryHash.substring(0, 20)}`;
  const etag = `"reps-${etagValue}"`;

  // Create response with cache headers (Issue #2)
  const response = successResponse({
    representatives: outputReps,
    total: finalTotal,
    page,
    limit,
    hasMore
  });

  // Add cache headers for public data (Issue #2)
  // Rep data is ingest-updated; cache 24h, stale-while-revalidate 24h
  response.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=86400');
  response.headers.set('ETag', etag);

  // Check if client has cached version (Issue #2)
  const ifNoneMatch = request.headers.get('if-none-match');
  if (ifNoneMatch === etag) {
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=86400');
    headers.set('ETag', etag);
    return new NextResponse(null, { status: 304, headers });
  }

  // Add rate limit headers for client information (Issue #3)
  // Following established pattern: Date.now() for absolute timestamps (safe server-side)
  const resetTime = new Date(Date.now() + (15 * 60 * 1000)).toISOString();
  response.headers.set('X-RateLimit-Limit', '100');
  response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
  response.headers.set('X-RateLimit-Reset', resetTime);

  // Add response time header for monitoring (Issue #10)
  // Following established pattern: use Date.now() for timing (consistent with dashboard/admin APIs)
  // Server-side only - Date.now() is safe in API routes (no hydration issues)
  const middlewareStart = request.headers.get('x-request-start');
  const handlerTime = Date.now() - requestStartTime;
  let responseTime: number;

  if (middlewareStart) {
    try {
      const middlewareStartTime = parseInt(middlewareStart, 10);
      if (!isNaN(middlewareStartTime)) {
        // Use middleware start time for end-to-end timing (assumes Date.now() timestamp)
        responseTime = Date.now() - middlewareStartTime;
      } else {
        // Fallback to handler start time
        responseTime = handlerTime;
      }
    } catch {
      // Fallback to handler start time
      responseTime = handlerTime;
    }
  } else {
    // Use handler start time if no middleware timing available
    responseTime = handlerTime;
  }

  response.headers.set('X-Response-Time', `${responseTime}ms`);
  response.headers.set('X-Response-Time-Handler', `${handlerTime}ms`);

  // Log successful request for monitoring (Issue #6)
  // Include performance metrics for optimization tracking
  logger.info('Representatives API request completed', {
    total: finalTotal,
    returned: outputReps.length,
    responseTimeMs: responseTime,
    handlerTimeMs: handlerTime,
    query: {
      state,
      party,
      level,
      search: search ? search.substring(0, 50) : null,
      sortBy: finalSortBy,
      sortOrder: finalSortOrder,
      limit,
      offset,
      hasFilters: !!(state || party || level || search || district || ocdDivisionId)
    },
    rateLimitRemaining: rateLimitResult.remaining,
    includeCommittees: include.includes('committees'),
    includeRelated: include.length > 0 ? include : ['all'],
    performance: {
      responseTimeMs: responseTime,
      handlerTimeMs: handlerTime,
      hasMiddlewareTiming: !!middlewareStart,
      cacheHit: false, // Could be enhanced with Redis caching
      queryComplexity: {
        filters: [state, party, level, search, district, ocdDivisionId].filter(Boolean).length,
        includes: include.length || 4, // Default includes all
        hasSearch: !!search,
        hasPagination: offset > 0 || limit !== 20
      }
    }
  });

  // Track performance metrics for admin monitoring (optional, only in non-production or with feature flag)
  // This helps identify slow queries and performance bottlenecks
  // Using dynamic import to avoid dependency if tracking is disabled
  if (process.env.ENABLE_PERFORMANCE_TRACKING === 'true' || process.env.NODE_ENV !== 'production') {
    try {
      // Dynamic import with proper typing
      const perfModule = await import('@/features/admin/lib/performance-monitor') as { performanceMonitor?: { trackOperation: (operation: string, duration: number, success: boolean, error?: string, metadata?: Record<string, any>) => void } };
      // Use named export performanceMonitor
      if (perfModule?.performanceMonitor?.trackOperation) {
        perfModule.performanceMonitor.trackOperation(
          'representatives_api_get',
          responseTime,
          true,
          undefined,
          {
            total: finalTotal,
            returned: transformed.length,
            handlerTime: handlerTime,
            hasFilters: !!(state || party || level || search || district || ocdDivisionId),
            includeCount: include.length || 4,
            queryComplexity: {
              filters: [state, party, level, search, district, ocdDivisionId].filter(Boolean).length,
              includes: include.length || 4
            }
          }
        );
      }
    } catch (error) {
      // Silently fail - performance tracking is optional and should not break the API
      logger.debug('Performance tracking not available', {
        error: error instanceof Error ? error.message : 'Unknown',
        note: 'Performance tracking is optional'
      });
    }
  }

  return response;
});
