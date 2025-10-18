import { createClient } from '@supabase/supabase-js';
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
    
    // Validate ID format (should be UUID)
    if (!representativeId || representativeId.length < 10) {
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

    // Get contact information
    const { data: contactInfo } = await supabase
      .from('civics_contact_info')
      .select(`
        id,
        representative_id,
        official_email,
        official_phone,
        official_fax,
        official_website,
        office_addresses,
        preferred_contact_method,
        response_time_expectation,
        data_quality_score,
        last_verified,
        created_at,
        updated_at
      `)
      .eq('representative_id', representativeId)
      .single();

    // Get social media engagement
    const { data: socialMedia } = await supabase
      .from('civics_social_engagement')
      .select(`
        id,
        representative_id,
        platform,
        handle,
        followers_count,
        engagement_rate,
        created_at,
        last_updated
      `)
      .eq('representative_id', representativeId);

    // Get campaign finance data (latest election)
    const { data: campaignFinance } = await supabase
      .from('civics_campaign_finance')
      .select(`
        id,
        representative_id,
        candidate_name,
        candidate_id,
        cycle,
        party,
        state,
        district,
        office,
        raw_data,
        created_at,
        updated_at
      `)
      .eq('representative_id', representativeId)
      .order('cycle', { ascending: false })
      .limit(1)
      .single();

    // Get voting behavior summary
    const { data: votingBehavior } = await supabase
      .from('civics_voting_behavior')
      .select(`
        id,
        representative_id,
        analysis_period,
        total_votes,
        missed_votes,
        party_line_votes,
        bipartisan_votes,
        attendance_rate,
        party_loyalty_score,
        bipartisanship_score,
        created_at,
        updated_at
      `)
      .eq('representative_id', representativeId)
      .eq('analysis_period', 'current_session')
      .single();

    // Get recent votes (last 10)
    const { data: recentVotes } = await supabase
      .from('civics_votes')
      .select(`
        id,
        representative_id,
        bill_id,
        bill_title,
        vote_date,
        vote_position,
        chamber,
        session,
        raw_data,
        created_at
      `)
      .eq('representative_id', representativeId)
      .order('vote_date', { ascending: false })
      .limit(10);

    // Get policy positions
    const { data: policyPositions } = await supabase
      .from('civics_policy_positions')
      .select(`
        id,
        representative_id,
        issue,
        position,
        confidence_score,
        source,
        source_url,
        created_at,
        last_updated
      `)
      .eq('representative_id', representativeId)
      .order('confidence_score', { ascending: false });

    // Get canonical ID resolution (crosswalk data)
    const { data: crosswalkEntries } = await supabase
      .from('civics_crosswalk')
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
        email: contactInfo?.official_email || null,
        phone: contactInfo?.official_phone || null,
        fax: contactInfo?.official_fax || null,
        website: contactInfo?.official_website || null,
        office_addresses: contactInfo?.office_addresses || [],
        preferred_contact_method: contactInfo?.preferred_contact_method || 'email',
        response_time_expectation: contactInfo?.response_time_expectation || 'within_week',
        quality_score: contactInfo?.data_quality_score || 0,
        last_verified: contactInfo?.last_verified || null
      },
      
      // Social Media (only if social sharing features are enabled)
      social_media: isFeatureEnabled('SOCIAL_SHARING') ? {
        platforms: socialMedia?.map(sm => ({
          platform: sm.platform,
          handle: sm.handle,
          url: (sm as any).url,
          followers_count: sm.followers_count,
          engagement_rate: sm.engagement_rate,
          verified: (sm as any).verified,
          official_account: (sm as any).official_account,
          last_updated: sm.last_updated
        })) || [],
        summary: {
          total_platforms: socialMedia?.length || 0,
          verified_accounts: socialMedia?.filter(sm => (sm as any).verified).length || 0,
          total_followers: socialMedia?.reduce((sum, sm) => sum + (sm.followers_count || 0), 0) || 0
        }
      } : null,
      
      // Campaign Finance (only if civics campaign finance is enabled)
      campaign_finance: isFeatureEnabled('CIVICS_CAMPAIGN_FINANCE') && campaignFinance ? {
        election_year: (campaignFinance as any).election_year,
        total_receipts: (campaignFinance as any).total_receipts,
        total_disbursements: (campaignFinance as any).total_disbursements,
        cash_on_hand: (campaignFinance as any).cash_on_hand,
        individual_contributions: (campaignFinance as any).individual_contributions,
        pac_contributions: (campaignFinance as any).pac_contributions,
        self_financing: (campaignFinance as any).self_financing,
        top_contributors: (campaignFinance as any).top_contributors,
        industry_contributions: (campaignFinance as any).industry_contributions,
        last_updated: campaignFinance.updated_at
      } : null,
      
      // Voting Behavior (only if civics voting records are enabled)
      voting_behavior: isFeatureEnabled('CIVICS_VOTING_RECORDS') && votingBehavior ? {
        analysis_period: votingBehavior.analysis_period,
        total_votes: votingBehavior.total_votes,
        missed_votes: votingBehavior.missed_votes,
        party_line_votes: votingBehavior.party_line_votes,
        bipartisan_votes: votingBehavior.bipartisan_votes,
        party_unity_score: (votingBehavior as any).party_unity_score,
        bipartisan_score: (votingBehavior as any).bipartisan_score,
        attendance_rate: votingBehavior.attendance_rate,
        ideology_score: (votingBehavior as any).ideology_score,
        key_vote_positions: (votingBehavior as any).key_vote_positions,
        last_updated: votingBehavior.updated_at
      } : null,
      
      // Recent Votes
      recent_votes: recentVotes?.map(vote => ({
        vote_id: (vote as any).vote_id,
        bill_id: vote.bill_id,
        bill_title: vote.bill_title,
        vote_date: vote.vote_date,
        vote_position: vote.vote_position,
        vote_type: (vote as any).vote_type,
        vote_result: (vote as any).vote_result,
        party_position: (vote as any).party_position
      })) || [],
      
      // Policy Positions (only if civics voting records are enabled)
      policy_positions: isFeatureEnabled('CIVICS_VOTING_RECORDS') && policyPositions ? policyPositions.map(position => ({
        issue_category: (position as any).issue_category,
        issue_name: (position as any).issue_name,
        position: position.position,
        confidence_score: position.confidence_score,
        last_vote_date: (position as any).last_vote_date,
        position_notes: (position as any).position_notes
      })) : [],
      
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
        (representative).data_source,
        (contactInfo as any)?.data_source,
        (campaignFinance as any)?.data_source,
        (votingBehavior as any)?.data_source
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
