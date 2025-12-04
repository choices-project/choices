// app/api/v1/civics/representative/[id]/route.ts
// Versioned API endpoint for single representative with FEC and voting data
import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, validationError, notFoundError, errorResponse, rateLimitError } from '@/lib/api';
import { getRedisClient } from '@/lib/cache/redis-client';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import type { Database } from '@/types/supabase';

// Type assertions for civics tables not in generated Database types
// Define manually since these tables are not in the generated types
type CivicsVotesMinimalRow = {
  vote_id: string;
  bill_title: string | null;
  vote_date: string;
  vote_position: string | null;
  party_position: string | null;
  last_updated: string;
  person_id: string | null;
};

type RepresentativeResponse = {
  id: string;
  name: string;
  office: string;
  level: 'federal' | 'state' | 'local';
  jurisdiction: string;
  district?: string;
  party?: string;
  division_ids?: string[];
  fec?: {
    total_receipts: number;
    cash_on_hand: number;
    cycle: number;
    last_updated: string;
  };
  votes?: {
    last_5: unknown[];
    party_alignment: number;
    last_updated: string;
  };
  contact?: {
    phone?: string;
    website?: string;
    twitter_url?: string;
    last_updated: string;
  };
  attribution: {
    fec?: string;
    votes?: string;
    contact?: string;
  };
  last_updated: string;
}

/**
 * Get client IP address from request headers
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIP = forwarded.split(',')[0];
    if (firstIP) {
      return firstIP.trim();
    }
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return request.ip ?? 'unknown';
}

/**
 * Generate cache key for representative endpoint
 */
function generateCacheKey(id: string, include: string[]): string {
  const includeStr = include.sort().join(',');
  return `civics:representative:${id}:${includeStr}`;
}

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  // Rate limiting: 100 requests per 15 minutes per IP
  const clientIP = getClientIP(request);
  const rateLimitResult = await apiRateLimiter.checkLimit(clientIP, '/api/v1/civics/representative/[id]', {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  });

  if (!rateLimitResult.allowed) {
    logger.warn('Rate limit exceeded for civics representative', { ip: clientIP });
    return rateLimitError('Rate limit exceeded', rateLimitResult.retryAfter);
  }

  // Get Supabase client (uses anon key, RLS allows anonymous reads)
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  try {
    const { searchParams } = new URL(request.url);
    const fields = searchParams.get('fields')?.split(',') ?? [];
    const include = searchParams.get('include')?.split(',') ?? [];
    const includeDivisions = include.includes('divisions');

    const { id } = await params;
    const representativeId = id?.trim();
    if (!representativeId) {
      return validationError({ id: 'Representative ID is required' });
    }

    // Check Redis cache first
    const cacheKey = generateCacheKey(representativeId, include);
    const cache = await getRedisClient();
    try {
      const cachedData = await cache.get<{ representative: RepresentativeResponse }>(cacheKey);
      
      if (cachedData) {
        logger.info('Civics representative cache hit', { id: representativeId, cacheKey });
        
        // Filter fields if requested
        if (fields.length > 0) {
          const filteredResponse: Record<string, unknown> = {};
          fields.forEach((field) => {
            if (field in cachedData.representative) {
              filteredResponse[field] = cachedData.representative[field as keyof RepresentativeResponse];
            }
          });
          const responsePayload = successResponse(
            { representative: filteredResponse },
            {
              include: include.length > 0 ? include : undefined,
              fields: fields.length > 0 ? fields : undefined,
              cached: true,
            }
          );
          responsePayload.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
          responsePayload.headers.set('X-Cache', 'HIT');
          return responsePayload;
        }

        const response = successResponse(cachedData, {
          include: include.length > 0 ? include : undefined,
          cached: true,
        });
        response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
        response.headers.set('X-Cache', 'HIT');
        return response;
      }
    } catch (cacheError) {
      logger.warn('Cache read error (continuing without cache)', { error: cacheError });
    }

    // Get base representative data
    type RepresentativeDivisionRow = {
      division_id: string | null;
    };

    type RepresentativeRow = {
      id: string;
      name: string;
      office: string;
      level: 'federal' | 'state' | 'local';
      jurisdiction: string;
      district: string | null;
      party: string | null;
      last_updated: string;
      person_id: string | null;
      contact: string | Record<string, unknown> | null;
      representative_divisions?: RepresentativeDivisionRow[] | null;
    };

    const selectFields = [
      'id',
      'name',
      'office',
      'level',
      'jurisdiction',
      'district',
      'party',
      'last_updated',
      'person_id',
      'contact'
    ];

    if (includeDivisions) {
      selectFields.push('representative_divisions:representative_divisions(division_id)');
    }

    // Type assertion needed because civics tables may not be in generated Database type
    const { data: rep, error: repError } = await (supabase as any)
      .from('civics_representatives')
      .select(selectFields.join(','))
      .eq('id', representativeId)
      .eq('valid_to', 'infinity')
      .maybeSingle();

    if (repError) {
      return errorResponse('Failed to load representative', 502, { reason: repError.message });
    }

    if (!rep) {
      return notFoundError('Representative not found');
    }

    const representativeRow = rep as unknown as RepresentativeRow;

    const response: RepresentativeResponse = {
      id: representativeRow.id,
      name: representativeRow.name,
      office: representativeRow.office,
      level: representativeRow.level,
      jurisdiction: representativeRow.jurisdiction,
      attribution: {},
      last_updated: representativeRow.last_updated
    };

    if (representativeRow.district) {
      response.district = representativeRow.district;
    }

    if (representativeRow.party) {
      response.party = representativeRow.party;
    }

    if (includeDivisions && Array.isArray(representativeRow.representative_divisions)) {
      const divisions = representativeRow.representative_divisions
        .map((entry: RepresentativeDivisionRow) => entry?.division_id)
        .filter((value): value is string => Boolean(value));
      if (divisions.length > 0) {
        response.division_ids = divisions;
      }
    }

    // Include FEC data if requested
    if (include.includes('fec') && representativeRow.person_id) {
      const { data: fecData, error: fecError } = await (supabase as any)
        .from('civics_fec_minimal')
        .select('total_receipts, cash_on_hand, election_cycle, last_updated')
        .eq('person_id', representativeRow.person_id)
        .order('election_cycle', { ascending: false })
        .limit(1)
        .single();

      if (!fecError && fecData) {
        response.fec = {
          total_receipts: fecData.total_receipts,
          cash_on_hand: fecData.cash_on_hand,
          cycle: fecData.election_cycle,
          last_updated: fecData.last_updated
        };
        response.attribution.fec = 'Federal Election Commission';
      }
    }

    // Include voting data if requested
    if (include.includes('votes') && representativeRow.person_id) {
      const { data: votesData, error: votesError } = await (supabase as any)
        .from('civics_votes_minimal')
        .select('vote_id, bill_title, vote_date, vote_position, party_position, last_updated')
        .eq('person_id', representativeRow.person_id)
        .order('vote_date', { ascending: false })
        .limit(5);

              if (!votesError && votesData) {
                // Calculate party alignment
                const partyVotes = votesData.filter((vote: CivicsVotesMinimalRow) => vote.party_position === vote.vote_position);
        const partyAlignment = votesData.length > 0 ? partyVotes.length / votesData.length : 0;

        response.votes = {
          last_5: votesData,
          party_alignment: Math.round(partyAlignment * 100) / 100,
          last_updated: votesData[0]?.last_updated || representativeRow.last_updated
        };
        response.attribution.votes = 'GovTrack.us';
      }
    }

    // Include contact data if requested
    if (include.includes('contact')) {
      // For now, extract from existing contact field
      if (representativeRow.contact) {
        const contact =
          typeof representativeRow.contact === 'string'
            ? JSON.parse(representativeRow.contact)
            : representativeRow.contact;
        if (contact && typeof contact === 'object') {
          const contactRecord = contact as Record<string, unknown>;
          response.contact = {
            ...(typeof contactRecord.phone === 'string' ? { phone: contactRecord.phone } : {}),
            ...(typeof contactRecord.website === 'string'
              ? { website: contactRecord.website }
              : {}),
            ...(typeof contactRecord.twitter_url === 'string'
              ? { twitter_url: contactRecord.twitter_url }
              : {}),
            last_updated: representativeRow.last_updated
          };
          response.attribution.contact = 'ProPublica Congress API';
        }
      }
    }

    // Cache the response for 5 minutes
    try {
      await cache.set(cacheKey, { representative: response }, 300); // 5 minutes TTL
      logger.info('Civics representative cached', { id: representativeId, cacheKey });
    } catch (cacheError) {
      logger.warn('Cache write error (continuing without cache)', { error: cacheError });
    }

    // Filter fields if requested
    if (fields.length > 0) {
      const filteredResponse: Record<string, unknown> = {};
      fields.forEach((field) => {
        if (field in response) {
          filteredResponse[field] = response[field as keyof RepresentativeResponse];
        }
      });
      const responsePayload = successResponse(
        { representative: filteredResponse },
        {
          include: include.length > 0 ? include : undefined,
          fields: fields.length > 0 ? fields : undefined,
          cached: false,
        }
      );

      responsePayload.headers.set('ETag', `"${representativeRow.id}-${representativeRow.last_updated}"`);
      responsePayload.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
      responsePayload.headers.set('X-Cache', 'MISS');

      return responsePayload;
    }

    const apiResponse = successResponse(
      { representative: response },
      {
        include: include.length > 0 ? include : undefined,
        cached: false,
      }
    );

    apiResponse.headers.set('ETag', `"${representativeRow.id}-${representativeRow.last_updated}"`);
    apiResponse.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    apiResponse.headers.set('X-Cache', 'MISS');

    return apiResponse;

  } catch (error) {
    logger.error('Error fetching representative:', error instanceof Error ? error : new Error(String(error)));
    return errorResponse('Failed to fetch representative', 500);
  }
});
