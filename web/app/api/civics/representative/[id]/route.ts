import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const representativeId = params.id;
    
    if (!representativeId || isNaN(Number(representativeId))) {
      return NextResponse.json(
        { ok: false, error: 'Invalid representative ID' },
        { status: 400 }
      );
    }

    console.log(`📊 Fetching detailed information for representative ID: ${representativeId}`);

    // Get representative basic information
    const { data: representative, error: repError } = await supabase
      .from('civics_representatives')
      .select('*')
      .eq('id', representativeId)
      .single();

    if (repError || !representative) {
      return NextResponse.json(
        { ok: false, error: 'Representative not found' },
        { status: 404 }
      );
    }

    // Get contact information
    const { data: contactInfo } = await supabase
      .from('civics_contact_info')
      .select('*')
      .eq('representative_id', representativeId)
      .single();

    // Get social media engagement
    const { data: socialMedia } = await supabase
      .from('civics_social_engagement')
      .select('*')
      .eq('representative_id', representativeId);

    // Get campaign finance data (latest election)
    const { data: campaignFinance } = await supabase
      .from('civics_campaign_finance')
      .select('*')
      .eq('representative_id', representativeId)
      .order('election_year', { ascending: false })
      .limit(1)
      .single();

    // Get voting behavior summary
    const { data: votingBehavior } = await supabase
      .from('civics_voting_behavior')
      .select('*')
      .eq('representative_id', representativeId)
      .eq('analysis_period', 'current_session')
      .single();

    // Get recent votes (last 10)
    const { data: recentVotes } = await supabase
      .from('civics_votes')
      .select('*')
      .eq('representative_id', representativeId)
      .order('vote_date', { ascending: false })
      .limit(10);

    // Get policy positions
    const { data: policyPositions } = await supabase
      .from('civics_policy_positions')
      .select('*')
      .eq('representative_id', representativeId)
      .order('confidence_score', { ascending: false });

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
      
      // Social Media
      social_media: {
        platforms: socialMedia?.map(sm => ({
          platform: sm.platform,
          handle: sm.handle,
          url: sm.url,
          followers_count: sm.followers_count,
          engagement_rate: sm.engagement_rate,
          verified: sm.verified,
          official_account: sm.official_account,
          last_updated: sm.last_updated
        })) || [],
        summary: {
          total_platforms: socialMedia?.length || 0,
          verified_accounts: socialMedia?.filter(sm => sm.verified).length || 0,
          total_followers: socialMedia?.reduce((sum, sm) => sum + (sm.followers_count || 0), 0) || 0
        }
      },
      
      // Campaign Finance
      campaign_finance: campaignFinance ? {
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
      
      // Voting Behavior
      voting_behavior: votingBehavior ? {
        analysis_period: votingBehavior.analysis_period,
        total_votes: votingBehavior.total_votes,
        party_unity_score: votingBehavior.party_unity_score,
        bipartisan_score: votingBehavior.bipartisan_score,
        attendance_rate: votingBehavior.attendance_rate,
        ideology_score: votingBehavior.ideology_score,
        key_vote_positions: votingBehavior.key_vote_positions,
        last_updated: votingBehavior.last_updated
      } : null,
      
      // Recent Votes
      recent_votes: recentVotes?.map(vote => ({
        vote_id: vote.vote_id,
        bill_id: vote.bill_id,
        bill_title: vote.bill_title,
        vote_date: vote.vote_date,
        vote_position: vote.vote_position,
        vote_type: vote.vote_type,
        vote_result: vote.vote_result,
        party_position: vote.party_position
      })) || [],
      
      // Policy Positions
      policy_positions: policyPositions?.map(position => ({
        issue_category: position.issue_category,
        issue_name: position.issue_name,
        position: position.position,
        confidence_score: position.confidence_score,
        last_vote_date: position.last_vote_date,
        position_notes: position.position_notes
      })) || [],
      
      // Data Quality Summary
      data_quality: {
        contact_info_available: representative.contact_info_available || false,
        social_media_available: representative.social_media_available || false,
        campaign_finance_available: representative.campaign_finance_available || false,
        voting_records_available: representative.voting_records_available || false,
        overall_quality_score: Math.round(
          ((contactInfo?.data_quality_score || 0) + 
           (campaignFinance ? 90 : 0) + 
           (votingBehavior ? 85 : 0)) / 3
        )
      },
      
      // Metadata
      last_updated: new Date().toISOString(),
      data_sources: [
        representative.data_source,
        contactInfo?.data_source,
        campaignFinance?.data_source,
        votingBehavior?.data_source
      ].filter(Boolean).join(', ')
    };

    console.log(`✅ Successfully fetched detailed information for ${representative.name}`);

    return NextResponse.json({
      ok: true,
      data: transformedData
    });

  } catch (error) {
    console.error('❌ Error fetching representative details:', error);
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
