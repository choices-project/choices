import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { type NextRequest, NextResponse } from 'next/server';

import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { createApiLogger } from '@/lib/utils/api-logger';
import { CivicsCache, CivicsQueryOptimizer } from '@/lib/utils/civics-cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

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
          last_updated: new Date().toISOString(),
          data_quality_score: 95
        }
      });
    }

    // Get representative data with optimized query
    const { data: representative, error: repError } = await CivicsQueryOptimizer.getRepresentativeQuery(supabase, representativeId);

    if (repError || !representative) {
      return NextResponse.json(
        { ok: false, error: 'Representative not found' },
        { status: 404 }
      );
    }

    // Get contact information from representatives_core
    const { data: contactInfo } = await supabase
      .from('representatives_core')
      .select(`
        id,
        name,
        primary_email,
        primary_phone,
        office,
        district,
        state,
        party,
        enhanced_contacts,
        data_quality_score,
        last_verified,
        created_at,
        last_updated
      `)
      .eq('id', representativeId)
      .single();

    // Get social media engagement from representatives_core
    const { data: socialMedia } = await supabase
      .from('representatives_core')
      .select(`
        id,
        name,
        enhanced_social_media,
        facebook_url,
        instagram_handle,
        linkedin_url,
        twitter_handle,
        youtube_url,
        created_at,
        last_updated
      `)
      .eq('id', representativeId)
      .single();

    // Get campaign finance data from representatives_core
    const { data: campaignFinance } = await supabase
      .from('representatives_core')
      .select(`
        id,
        name,
        enhanced_activity,
        data_quality_score,
        created_at,
        last_updated
      `)
      .eq('id', representativeId)
      .single();

    // Get voting behavior summary from representatives_core
    const { data: votingBehavior } = await supabase
      .from('representatives_core')
      .select(`
        id,
        name,
        enhanced_activity,
        data_quality_score,
        created_at,
        last_updated
      `)
      .eq('id', representativeId)
      .single();

    // Get recent votes from representatives_core
    const { data: recentVotes } = await supabase
      .from('representatives_core')
      .select(`
        id,
        name,
        enhanced_activity,
        created_at,
        last_updated
      `)
      .eq('id', representativeId)
      .single();

    // Get policy positions from representatives_core
    const { data: policyPositions } = await supabase
      .from('representatives_core')
      .select(`
        id,
        name,
        enhanced_activity,
        created_at,
        last_updated
      `)
      .eq('id', representativeId)
      .single();

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
        email: contactInfo?.primary_email || null,
        phone: contactInfo?.primary_phone || null,
        fax: null, // Not available in representatives_core
        website: null, // Not available in representatives_core
        office_addresses: contactInfo?.enhanced_contacts || [],
        preferred_contact_method: 'email',
        response_time_expectation: 'within_week',
        quality_score: contactInfo?.data_quality_score || 0,
        last_verified: contactInfo?.last_verified || null
      },
      
      // Social Media (only if social sharing features are enabled)
      social_media: isFeatureEnabled('SOCIAL_SHARING') ? {
        platforms: [
          ...(socialMedia?.facebook_url ? [{
            platform: 'facebook',
            handle: socialMedia.facebook_url,
            url: socialMedia.facebook_url,
            followers_count: 0,
            engagement_rate: 0,
            verified: false,
            official_account: true,
            last_updated: socialMedia.last_updated
          }] : []),
          ...(socialMedia?.instagram_handle ? [{
            platform: 'instagram',
            handle: socialMedia.instagram_handle,
            url: `https://instagram.com/${socialMedia.instagram_handle}`,
            followers_count: 0,
            engagement_rate: 0,
            verified: false,
            official_account: true,
            last_updated: socialMedia.last_updated
          }] : []),
          ...(socialMedia?.twitter_handle ? [{
            platform: 'twitter',
            handle: socialMedia.twitter_handle,
            url: `https://twitter.com/${socialMedia.twitter_handle}`,
            followers_count: 0,
            engagement_rate: 0,
            verified: false,
            official_account: true,
            last_updated: socialMedia.last_updated
          }] : []),
          ...(socialMedia?.linkedin_url ? [{
            platform: 'linkedin',
            handle: socialMedia.linkedin_url,
            url: socialMedia.linkedin_url,
            followers_count: 0,
            engagement_rate: 0,
            verified: false,
            official_account: true,
            last_updated: socialMedia.last_updated
          }] : []),
          ...(socialMedia?.youtube_url ? [{
            platform: 'youtube',
            handle: socialMedia.youtube_url,
            url: socialMedia.youtube_url,
            followers_count: 0,
            engagement_rate: 0,
            verified: false,
            official_account: true,
            last_updated: socialMedia.last_updated
          }] : [])
        ],
        summary: {
          total_platforms: [
            socialMedia?.facebook_url,
            socialMedia?.instagram_handle,
            socialMedia?.twitter_handle,
            socialMedia?.linkedin_url,
            socialMedia?.youtube_url
          ].filter(Boolean).length,
          verified_accounts: 0, // Not available in representatives_core
          total_followers: 0 // Not available in representatives_core
        }
      } : null,
      
      // Campaign Finance (only if civics campaign finance is enabled)
      campaign_finance: isFeatureEnabled('CIVICS_CAMPAIGN_FINANCE') && campaignFinance ? {
        election_year: campaignFinance.election_year,
        total_receipts: campaignFinance.total_receipts,
        total_disbursements: campaignFinance.total_disbursements,
        cash_on_hand: campaignFinance.cash_on_hand,
        individual_contributions: campaignFinance.individual_contributions,
        pac_contributions: campaignFinance.pac_contributions,
        self_financing: campaignFinance.self_financing,
        top_contributors: campaignFinance.top_contributors,
        industry_contributions: campaignFinance.industry_contributions,
        last_updated: campaignFinance.last_updated
      } : null,
      
      // Voting Behavior (only if civics voting records are enabled)
      voting_behavior: isFeatureEnabled('CIVICS_VOTING_RECORDS') && votingBehavior ? {
        analysis_period: 'current_term', // Not available in representatives_core
        total_votes: 0, // Not available in representatives_core
        missed_votes: 0, // Not available in representatives_core
        party_line_votes: 0, // Not available in representatives_core
        bipartisan_votes: 0, // Not available in representatives_core
        party_unity_score: 0, // Not available in representatives_core
        bipartisan_score: 0, // Not available in representatives_core
        attendance_rate: 0, // Not available in representatives_core
        ideology_score: 0, // Not available in representatives_core
        key_vote_positions: [], // Not available in representatives_core
        last_updated: votingBehavior.last_updated
      } : null,
      
      // Recent Votes (not available in representatives_core)
      recent_votes: [],
      
      // Policy Positions (not available in representatives_core)
      policy_positions: [],
      
      // Canonical ID Resolution
      canonical_ids: crosswalkEntries?.map(entry => ({
        canonical_id: entry.canonical_id,
        source: entry.source,
        source_type: entry.source_type,
        source_id: entry.source_id,
        last_verified: entry.last_verified
      })) || [],

      // Data Quality Summary
      data_quality: {
        contact_info_available: (representative).contact_info_available || false,
        social_media_available: (representative).social_media_available || false,
        campaign_finance_available: (representative).campaign_finance_available || false,
        voting_records_available: (representative).voting_records_available || false,
        overall_quality_score: Math.round(
          ((contactInfo?.data_quality_score || 0) + 
           (campaignFinance ? 90 : 0) + 
           (votingBehavior ? 85 : 0)) / 3
        )
      },
      
      // Metadata
      last_updated: new Date().toISOString(),
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
        last_updated: new Date().toISOString(),
        data_quality_score: 95
      }
    });

  } catch (error) {
    logger.error('Error fetching representative details', error instanceof Error ? error : undefined);
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
