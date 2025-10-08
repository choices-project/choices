/**
 * Civics Data Retrieval API
 * Returns representatives by state with enhanced data
 * 
 * Created: October 6, 2025
 * Updated: October 6, 2025
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const level = searchParams.get('level');
    const chamber = searchParams.get('chamber');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!state) {
      return NextResponse.json({ error: 'State parameter required' }, { status: 400 });
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
        last_updated,
        enhanced_contacts,
        enhanced_photos,
        enhanced_activity,
        enhanced_social_media
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
      
      const chamberTerms = chamberMapping[chamber] || [];
      if (chamberTerms.length > 0) {
        query = query.or(chamberTerms.map(term => `office.ilike.%${term}%`).join(','));
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Process the data to include enhanced data in the response
    const processedData = (data || []).map(rep => ({
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
      last_updated: rep.last_updated,
      // Enhanced data from JSONB columns
      contacts: rep.enhanced_contacts || [],
      photos: rep.enhanced_photos || [],
      activity: rep.enhanced_activity || [],
      social_media: rep.enhanced_social_media || []
    }));

    return NextResponse.json({ 
      ok: true, 
      data: processedData,
      count: processedData.length
    });
  } catch (e: any) {
    console.error('API error:', e);
    return NextResponse.json({ 
      ok: false, 
      error: 'Service temporarily unavailable' 
    }, { status: 502 });
  }
}