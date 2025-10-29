/**
 * Civics Data Retrieval API
 * Returns representatives by state with enhanced data
 * 
 * Created: October 6, 2025
 * Updated: October 6, 2025
 */

/**
 * Civics State Representatives API Route
 * 
 * Provides state-based representative lookup with normalized table data
 * including contacts, photos, social media, and activity records.
 * 
 * @fileoverview State-based representative lookup API with normalized data
 * @version 2.0.0
 * @since 2024-10-09
 * @updated 2025-10-25 - Updated to use normalized tables instead of JSONB
 * @feature CIVICS_STATE_LOOKUP
 */

import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

import { createApiLogger } from '@/lib/utils/api-logger';
import { CivicsCache } from '@/lib/utils/civics-cache';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';

interface RepresentativeData {
  id: number;
  name: string;
  party: string;
  office: string;
  level: string;
  state: string;
  district: string;
  bioguide_id: string | null;
  openstates_id: string | null;
  fec_id: string | null;
  google_civic_id: string | null;
  legiscan_id: string | null;
  congress_gov_id: string | null;
  govinfo_id: string | null;
  wikipedia_url: string | null;
  ballotpedia_url: string | null;
  twitter_handle: string | null;
  facebook_url: string | null;
  instagram_handle: string | null;
  linkedin_url: string | null;
  youtube_channel: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  primary_website: string | null;
  primary_photo_url: string | null;
  data_quality_score: number;
  data_sources: string[];
  last_verified: string;
  verification_status: string;
  created_at: string;
  updated_at: string;
  representative_contacts?: Array<{
    contact_type: string;
    value: string;
    is_verified: boolean;
    source: string;
  }>;
  representative_photos?: Array<{
    url: string;
    is_primary: boolean;
    source: string;
  }>;
  representative_activity?: Array<{
    type: string;
    title: string;
    description: string;
    date: string;
    source: string;
  }>;
  representative_social_media?: Array<{
    platform: string;
    handle: string;
    url: string;
    is_verified: boolean;
  }>;
}

// Use service role for public representative data APIs
// TODO: Set up proper RLS policies to allow anon key access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://muqwrehywjrbaeerjgfb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'sb_secret_rTjGRn1LynM_ZgMVnRYsCw_ufgj-FrN',
  { auth: { persistSession: false } }
);

/**
 * GET /api/civics/by-state
 * 
 * Retrieves representatives for a specific state with optional filtering
 * by level (federal/state) and chamber (house/senate). Returns normalized data.
 * 
 * @param request - NextRequest with state query parameter and optional filters
 * @returns NextResponse with representative data or error
 * 
 * @example
 * GET /api/civics/by-state?state=CA&level=federal&chamber=house
 * 
 * @throws {400} When state parameter is missing or invalid
 * @throws {500} When database query fails
 */
export async function GET(request: NextRequest) {
  const logger = createApiLogger('/api/civics/by-state', 'GET');
  
  try {
    // Rate limiting check
  const clientIP = request.headers.get('x-forwarded-for') ?? 
                   request.headers.get('x-real-ip') ?? 
                   '127.0.0.1';
    
    const rateLimitResult = await apiRateLimiter.checkLimit(
      clientIP,
      '/api/civics/by-state',
      { maxRequests: 50, windowMs: 15 * 60 * 1000 }
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() ?? '900',
            'X-RateLimit-Limit': '50',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
          }
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const level = searchParams.get('level');
    const chamber = searchParams.get('chamber');
    const limit = parseInt(searchParams.get('limit') ?? '200');

    if (!state) {
      return NextResponse.json({ 
        success: false,
        error: 'State parameter required',
        metadata: {
          source: 'validation',
          updated_at: new Date().toISOString()
        }
      }, { status: 400 });
    }

    logger.info('Fetching representatives by state', { state, level, chamber, limit });

    // Check cache first
    const cachedData = state ? CivicsCache.getCachedStateLookup(state, level ?? undefined, chamber ?? undefined) : null;
    if (cachedData) {
      logger.info('Returning cached state data', { state, level, chamber });
      return NextResponse.json({
        success: true,
        data: {
          state,
          level: level ?? 'all',
          chamber: chamber ?? 'all',
          representatives: cachedData
        },
        metadata: {
          source: 'cache',
          updated_at: new Date().toISOString(),
          data_quality_score: 95,
          total_representatives: Array.isArray(cachedData) ? cachedData.length : 0
        }
      });
    }

    let query = supabase
      .from('representatives_core')
      .select(`
        id,
        name,
        party,
        office,
        level,
        state,
        district,
        bioguide_id,
        openstates_id,
        fec_id,
        google_civic_id,
        legiscan_id,
        congress_gov_id,
        govinfo_id,
        wikipedia_url,
        ballotpedia_url,
        twitter_handle,
        facebook_url,
        instagram_handle,
        linkedin_url,
        youtube_channel,
        primary_email,
        primary_phone,
        primary_website,
        primary_photo_url,
        data_quality_score,
        data_sources,
        last_verified,
        verification_status,
        created_at,
        updated_at,
        representative_contacts(contact_type, value, is_verified, source),
        representative_photos(url, is_primary, source),
        representative_social_media(platform, handle, url, is_verified),
        representative_activity(type, title, description, date, source)
      `)
      .eq('state', state)
      .limit(limit);

    if (level) {
      query = query.eq('level', level);
    }

    if (chamber) {
      // Filter by chamber using the office field instead of joining with civics_divisions
      const chamberMapping: Record<string, string[]> = {
        'us_senate': ['US Senate', 'Senator'],
        'us_house': ['US House', 'Representative'],
        'state_upper': ['State Senate', 'Senator'],
        'state_lower': ['State House', 'State Assembly', 'Representative']
      };
      
      const chamberTerms = chamberMapping[chamber] ?? [];
      if (chamberTerms.length > 0) {
        query = query.or(chamberTerms.map(term => `office.ilike.%${term}%`).join(','));
      }
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Process the data to include enhanced data from normalized tables
    const processedData = (data ?? []).map((rep: RepresentativeData) => ({
      id: rep.id,
      name: rep.name,
      party: rep.party,
      office: rep.office,
      level: rep.level,
      state: rep.state,
      district: rep.district,
      bioguide_id: rep.bioguide_id,
      openstates_id: rep.openstates_id,
      fec_id: rep.fec_id,
      google_civic_id: rep.google_civic_id,
      legiscan_id: rep.legiscan_id,
      congress_gov_id: rep.congress_gov_id,
      govinfo_id: rep.govinfo_id,
      wikipedia_url: rep.wikipedia_url,
      ballotpedia_url: rep.ballotpedia_url,
      twitter_handle: rep.twitter_handle,
      facebook_url: rep.facebook_url,
      instagram_handle: rep.instagram_handle,
      linkedin_url: rep.linkedin_url,
      youtube_channel: rep.youtube_channel,
      primary_email: rep.primary_email,
      primary_phone: rep.primary_phone,
      primary_website: rep.primary_website,
      primary_photo_url: rep.primary_photo_url,
      data_quality_score: rep.data_quality_score,
      data_sources: rep.data_sources,
      last_verified: rep.last_verified,
      verification_status: rep.verification_status,
      created_at: rep.created_at,
        updated_at: rep.updated_at,
      // Enhanced data from normalized tables
      contacts: rep.representative_contacts?.map((contact) => ({
        type: contact.contact_type,
        value: contact.value,
        is_verified: contact.is_verified,
        source: contact.source
      })) ?? [],
      photos: rep.representative_photos?.map((photo) => ({
        url: photo.url,
        is_primary: photo.is_primary,
        source: photo.source
      })) ?? [],
      activity: rep.representative_activity?.map((activity) => ({
        type: activity.type,
        title: activity.title,
        description: activity.description,
        date: activity.date,
        source: activity.source
      })) ?? [],
      social_media: rep.representative_social_media?.map((social) => ({
        platform: social.platform,
        handle: social.handle,
        url: social.url,
        is_verified: social.is_verified
      })) ?? []
    }));

    // Cache the result for future requests
    if (state) {
      CivicsCache.cacheStateLookup(state, level ?? undefined, chamber ?? undefined, processedData);
    }

    logger.success('Successfully fetched representatives by state', 200, { 
      state, 
      count: processedData.length 
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        state,
        level: level ?? 'all',
        chamber: chamber ?? 'all',
        representatives: processedData
      },
      metadata: {
        source: 'database',
        updated_at: new Date().toISOString(),
        data_quality_score: 95,
        total_representatives: processedData.length
      }
    });
  } catch (error) {
    logger.error('API error during state lookup', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ 
      success: false,
      error: 'Service temporarily unavailable',
      metadata: {
        source: 'database',
        last_updated: new Date().toISOString()
      }
    }, { status: 502 });
  }
}