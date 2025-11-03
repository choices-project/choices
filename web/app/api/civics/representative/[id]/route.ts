/**
 * Civics Representative Detail API Route
 * 
 * Provides detailed representative information with normalized table data
 * including contacts, photos, social media, and activity records.
 * 
 * @fileoverview Representative detail API with normalized data
 * @version 2.0.0
 * @since 2024-10-09
 * @updated 2025-10-25 - Updated to use normalized tables instead of JSONB
 * @feature CIVICS_REPRESENTATIVE_DETAILS
 */

import { type NextRequest, NextResponse } from 'next/server';

import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { createApiLogger } from '@/lib/utils/api-logger';
import { CivicsCache, CivicsQueryOptimizer } from '@/lib/utils/civics-cache';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/civics/representative/[id]
 * 
 * Retrieves detailed information for a specific representative including
 * contacts, photos, social media, activity records, and crosswalk data.
 * 
 * @param request - NextRequest object
 * @param params - Route parameters containing representative ID
 * @returns NextResponse with detailed representative data or error
 * 
 * @example
 * GET /api/civics/representative/123
 * 
 * @throws {400} When representative ID is invalid
 * @throws {404} When representative is not found
 * @throws {500} When database query fails
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = createApiLogger('/api/civics/representative/[id]', 'GET');
  
  try {
    const { id } = await params;
    const representativeId = id;
    
    if (!representativeId) {
      return NextResponse.json(
        { ok: false, error: 'Representative ID is required' },
        { status: 400 }
      );
    }
    
    // Validate ID format (accept both UUIDs and integer IDs)
    if (!representativeId || (representativeId.length < 3 && !/^\d+$/.test(representativeId))) {
      return NextResponse.json(
        { ok: false, error: 'Invalid representative ID format' },
        { status: 400 }
      );
    }

    logger.info('Fetching detailed information for representative', { representativeId });

    // Check cache first
    const cachedData = CivicsCache.getCachedRepresentative(representativeId);
    if (cachedData) {
      logger.info('Returning cached representative data', { representativeId });
      return NextResponse.json({
        success: true,
        data: cachedData,
        metadata: {
          source: 'cache',
          updated_at: new Date().toISOString(),
          data_quality_score: 95
        }
      });
    }

    // Get Supabase client
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Get representative data with optimized query
    const { data: representative, error: repError } = await CivicsQueryOptimizer.getRepresentativeQuery(supabase, representativeId);

    if (repError || !representative) {
      return NextResponse.json(
        { ok: false, error: 'Representative not found' },
        { status: 404 }
      );
    }

    // Get enhanced data from normalized tables
    const { data: contacts } = await supabase
      .from('representative_contacts')
      .select('contact_type, value, is_verified, source')
      .eq('representative_id', representativeId);

    const { data: photos } = await supabase
      .from('representative_photos')
      .select('url, is_primary, source')
      .eq('representative_id', representativeId);

    const { data: socialMedia } = await supabase
      .from('representative_social_media')
      .select('platform, handle, url, is_verified, is_primary')
      .eq('representative_id', representativeId);

    const { data: activity } = await supabase
      .from('representative_activity')
      .select('type, title, description, date, source')
      .eq('representative_id', representativeId)
      .order('date', { ascending: false });

    // Get canonical ID resolution (crosswalk data)
    const { data: crosswalkEntries } = await supabase
      .from('id_crosswalk')
      .select(`
        id,
        canonical_id,
        source_id,
        source,
        source_type,
        created_at,
        last_verified
      `)
      .eq('representative_id', representativeId);

    // Transform the data for the frontend
    const transformedData = {
      // Basic Information
      id: representative.id,
      name: representative.name,
      party: representative.party,
      office: representative.office,
      level: representative.level,
      jurisdiction: representative.jurisdiction,
      district: representative.district,
      
      // Contact Information
      contact: {
        email: representative.primary_email ?? null,
        phone: representative.primary_phone ?? null,
        fax: null, // Not available in representatives_core
        website: representative.primary_website ?? null,
        office_addresses: contacts?.map((contact: any) => ({
          type: contact.contact_type,
          value: contact.value,
          is_verified: contact.is_verified,
          source: contact.source
        })) ?? [],
        preferred_contact_method: 'email',
        response_time_expectation: 'within_week',
        quality_score: representative.data_quality_score ?? 0,
        last_verified: representative.last_verified ?? null
      },
      
      // Photos
      photos: photos?.map((photo: any) => ({
        url: photo.url,
        is_primary: photo.is_primary,
        source: photo.source
      })) ?? [],
      
      // Social Media (only if social sharing features are enabled)
      social_media: isFeatureEnabled('SOCIAL_SHARING') ? {
        platforms: socialMedia?.map((social: any) => ({
          platform: social.platform,
          handle: social.handle,
          url: social.url,
          followers_count: 0, // Not available in current schema
          engagement_rate: 0, // Not available in current schema
          verified: social.is_verified,
          official_account: true,
          is_primary: social.is_primary,
          updated_at: new Date().toISOString()
        })) ?? [],
        summary: {
          total_platforms: socialMedia?.length ?? 0,
          verified_accounts: socialMedia?.filter((s: any) => s.is_verified).length ?? 0,
          total_followers: 0 // Not available in current schema
        }
      } : null,
      
      // Campaign Finance (only if civics campaign finance is enabled)
      campaign_finance: isFeatureEnabled('CIVICS_CAMPAIGN_FINANCE') ? {
        activities: activity?.filter((act: any) => act.type === 'campaign_finance').map((act: any) => ({
          title: act.title,
          description: act.description,
          date: act.date,
          source: act.source
        })) ?? [],
        updated_at: new Date().toISOString()
      } : null,
      
      // Voting Behavior (only if civics voting records are enabled)
      voting_behavior: isFeatureEnabled('CIVICS_VOTING_RECORDS') ? {
        activities: activity?.filter((act: any) => act.type === 'voting_record').map((act: any) => ({
          title: act.title,
          description: act.description,
          date: act.date,
          source: act.source
        })) ?? [],
        updated_at: new Date().toISOString()
      } : null,
      
      // Recent Votes
      recent_votes: activity?.filter((act: any) => act.type === 'vote').map((act: any) => ({
        title: act.title,
        description: act.description,
        date: act.date,
        source: act.source
      })) ?? [],
      
      // Policy Positions
      policy_positions: activity?.filter((act: any) => act.type === 'policy_position').map((act: any) => ({
        title: act.title,
        description: act.description,
        date: act.date,
        source: act.source
      })) ?? [],
      
      // Canonical ID Resolution
      canonical_ids: crosswalkEntries?.map(entry => ({
        canonical_id: entry.canonical_id,
        source: entry.source,
        source_type: entry.source_type,
        source_id: entry.source_id,
        last_verified: entry.last_verified
      })) ?? [],

      // Data Quality Summary
      data_quality: {
        contact_info_available: (contacts && contacts.length > 0) ?? false,
        social_media_available: (socialMedia && socialMedia.length > 0) ?? false,
        campaign_finance_available: activity?.some((act: any) => act.type === 'campaign_finance') ?? false,
        voting_records_available: activity?.some((act: any) => act.type === 'voting_record') ?? false,
        overall_quality_score: representative.data_quality_score ?? 0
      },
      
      // Metadata
      updated_at: new Date().toISOString(),
      data_sources: [
        'openstates',
        'civic_engagement',
        'campaign_finance',
        'voting_records'
      ].filter(Boolean).join(', ')
    };

    // Cache the result for future requests
    CivicsCache.cacheRepresentative(representativeId, transformedData);

    logger.success('Successfully fetched detailed information for representative', 200, { 
      representativeName: representative.name,
      representativeId: representative.id 
    });

    return NextResponse.json({
      success: true,
      data: transformedData,
      metadata: {
        source: 'database',
        updated_at: new Date().toISOString(),
        data_quality_score: 95
      }
    });

  } catch (error) {
    logger.error('Error fetching representative details', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
