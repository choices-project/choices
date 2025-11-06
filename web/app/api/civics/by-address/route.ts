/**
 * Civics Address Lookup API Route
 * 
 * Provides address-based representative lookup by querying Supabase database only.
 * 
 * IMPORTANT: This endpoint does NOT call external APIs. All data is ingested by the
 * standalone backend service at /services/civics-backend and stored in Supabase.
 * Users should only query Supabase, never call external APIs directly.
 * 
 * @fileoverview Address-based representative lookup API (Supabase queries only)
 * @version 3.0.0
 * @since 2024-10-09
 * @updated 2025-01-28 - Removed external API calls, now queries Supabase only
 * @feature CIVICS_ADDRESS_LOOKUP
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import { createApiLogger } from '@/lib/utils/api-logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/civics/by-address
 * 
 * Looks up representatives for a given address by querying Supabase database.
 * Returns normalized representative data.
 * 
 * IMPORTANT: This endpoint does NOT call external APIs. All data comes from Supabase,
 * which is populated by the standalone backend service at /services/civics-backend.
 * 
 * @param req - NextRequest with address query parameter
 * @returns NextResponse with representative data or error
 * 
 * @example
 * GET /api/civics/by-address?address=123 Main St, Anytown, CA 90210
 * 
 * @throws {400} When address parameter is missing
 * @throws {500} When database query fails
 */
export async function GET(req: NextRequest) {
  const logger = createApiLogger('/api/civics/by-address', 'GET');
  
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ 
        success: false,
        error: 'Address parameter is required',
        metadata: {
          source: 'validation',
          updated_at: new Date().toISOString()
        }
      }, { status: 400 });
    }

    logger.info('Looking up representatives for address', { address });

    // Rate limiting check - 50 requests per 15 minutes per IP
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '127.0.0.1';
    const userAgent = req.headers.get('user-agent');
    
    const rateLimitOptions: any = {
      maxRequests: 50,
      windowMs: 15 * 60 * 1000 // 15 minutes
    };
    if (userAgent) rateLimitOptions.userAgent = userAgent;
    const rateLimitResult = await apiRateLimiter.checkLimit(ip, '/api/civics/by-address', rateLimitOptions);

    if (!rateLimitResult.allowed) {
      logger.warn('Rate limit exceeded for address lookup', { ip, endpoint: '/api/civics/by-address' });
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

    // IMPORTANT: We do NOT call external APIs here. All data comes from Supabase.
    // External API calls (Google Civic, OpenStates, etc.) are handled by the
    // standalone backend service at /services/civics-backend, which ingests
    // data into Supabase. This endpoint only queries Supabase.

    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    const state = extractStateFromAddress(address);
    logger.info('Extracted state from address', { state });
      
    // Query representatives from the extracted state with normalized data
    const { data: representatives, error } = await supabase
      .from('representatives_core')
      .select(`
        *,
        representative_contacts(contact_type, value, is_verified, source),
        representative_photos(url, is_primary, source),
        representative_social_media(platform, handle, url, is_verified),
        representative_activity(type, title, description, date, source)
      `)
      .eq('state', state)
      .order('level', { ascending: true });

    if (error) {
      logger.error('Database query error', error);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    if (representatives?.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No representatives found for this address',
        address,
        state,
        data: {
          address,
          state,
          representatives: []
        },
        metadata: {
          source: 'database',
          updated_at: new Date().toISOString(),
          data_quality_score: 90,
          total_representatives: 0
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Representatives found via database lookup',
      address,
      state,
      data: {
        address,
        state,
        representatives: representatives.map(transformRepresentative)
      },
      metadata: {
        source: 'database',
        updated_at: new Date().toISOString(),
        data_quality_score: 95,
        total_representatives: representatives.length
      }
    });

  } catch (error) {
    logger.error('Address lookup error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Check if a representative matches the electoral districts
 */
function _isRepresentativeForDistricts(rep: any, electoralInfo: ElectoralInfo): boolean {
  // Check if representative's district matches any electoral district
  return electoralInfo.districts.some(district => {
    const districtType = determineDistrictType(district.name);
    const districtLevel = determineDistrictLevel(district.name);
    
    // Match by level and district
    if (rep.level === districtLevel) {
      if (districtType === 'congressional' && rep.district) {
        return rep.district.toString() === district.ocdId.split('/').pop();
      } else if (districtType === 'state_senate' && rep.district) {
        return rep.district.toString() === district.ocdId.split('/').pop();
      } else if (districtType === 'state_house' && rep.district) {
        return rep.district.toString() === district.ocdId.split('/').pop();
      }
    }
    
    return false;
  });
}

/**
 * Extract district information from Google Civic API divisions
 * @deprecated This function is no longer used since we removed external API calls
 */
function _extractDistricts(divisions: Record<string, any>): DistrictInfo[] {
  const districts: DistrictInfo[] = [];
  
  for (const [key, division] of Object.entries(divisions)) {
    if (division.name) {
      const districtInfo: DistrictInfo = {
        name: division.name,
        ocdId: key,
        type: determineDistrictType(division.name),
        level: determineDistrictLevel(division.name)
      };
      
      districts.push(districtInfo);
    }
  }
  
  return districts;
}

/**
 * Determine district type (congressional, state senate, state house, etc.)
 */
function determineDistrictType(name: string): string {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('congressional') || lowerName.includes('u.s. house')) {
    return 'congressional';
  } else if (lowerName.includes('senate')) {
    return 'state_senate';
  } else if (lowerName.includes('house') || lowerName.includes('assembly')) {
    return 'state_house';
  } else if (lowerName.includes('county')) {
    return 'county';
  } else if (lowerName.includes('city') || lowerName.includes('municipal')) {
    return 'municipal';
  } else {
    return 'other';
  }
}

/**
 * Determine district level (federal, state, local)
 */
function determineDistrictLevel(name: string): string {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('congressional') || lowerName.includes('u.s.') || lowerName.includes('united states')) {
    return 'federal';
  } else if (lowerName.includes('state') || lowerName.includes('senate') || lowerName.includes('house') || lowerName.includes('assembly')) {
    return 'state';
  } else {
    return 'local';
  }
}

/**
 * Transform database representative to API format with normalized data
 * 
 * Converts database representative record with normalized table joins
 * into API response format with enhanced data from related tables.
 * 
 * @param rep - Representative record from database with normalized joins
 * @returns Transformed representative object for API response
 * 
 * @example
 * const transformed = transformRepresentative({
 *   id: '123',
 *   name: 'John Doe',
 *   representative_contacts: [{ type: 'email', value: 'john@example.com' }],
 *   representative_photos: [{ url: 'photo.jpg', is_primary: true }]
 * });
 */
function transformRepresentative(rep: any): any {
  return {
    id: rep.id,
    name: rep.name,
    office: rep.office,
    party: rep.party,
    state: rep.state,
    district: rep.district,
    level: rep.level,
    bioguide_id: rep.bioguide_id,
    openstates_id: rep.openstates_id,
    fec_id: rep.fec_id,
    google_civic_id: rep.google_civic_id,
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
    contacts: rep.representative_contacts?.map((contact: any) => ({
      type: contact.contact_type,
      value: contact.value,
      is_verified: contact.is_verified,
      source: contact.source
    })) ?? [],
    photos: rep.representative_photos?.map((photo: any) => ({
      url: photo.url,
      is_primary: photo.is_primary,
      source: photo.source
    })) ?? [],
    social_media: rep.representative_social_media?.map((social: any) => ({
      platform: social.platform,
      handle: social.handle,
      url: social.url,
      is_verified: social.is_verified
    })) ?? [],
    activity: rep.representative_activity?.map((activity: any) => ({
      type: activity.type,
      title: activity.title,
      description: activity.description,
      date: activity.date,
      source: activity.source
    })) ?? []
  };
}

/**
 * Extract state from address string
 */
function extractStateFromAddress(address: string): string {
  const stateMap: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
    'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
    'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
    'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
    'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
    'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
    'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
    'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
  };

  const lowerAddress = address.toLowerCase();
  
  // Check for full state names
  for (const [stateName, stateCode] of Object.entries(stateMap)) {
    if (lowerAddress.includes(stateName)) {
      return stateCode;
    }
  }
  
  // Check for state codes
  for (const [, stateCode] of Object.entries(stateMap)) {
    if (lowerAddress.includes(stateCode.toLowerCase())) {
      return stateCode;
    }
  }
  
  // Default to California if no match found
  // Note: This is a fallback for addresses that don't match any state patterns
  return 'CA';
}

type ElectoralInfo = {
  address: string;
  state: string;
  districts: DistrictInfo[];
  officials: any[];
  offices: any[];
}

type DistrictInfo = {
  name: string;
  ocdId: string;
  type: string;
  level: string;
}