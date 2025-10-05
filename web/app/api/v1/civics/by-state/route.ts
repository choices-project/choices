// app/api/v1/civics/by-state/route.ts
// Versioned API endpoint for representatives by state with field selection
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);
// Force dynamic rendering since we use request.url
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const level = searchParams.get('level');
    const fields = searchParams.get('fields')?.split(',') || [];
    const include = searchParams.get('include')?.split(',') || [];
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!state) {
      return NextResponse.json(
        { error: 'State parameter is required' },
        { status: 400 }
      );
    }

    // Build query using new Civics 2.0 schema
    let query = supabase
      .from('representatives_core')
      .select(`
        id,
        name,
        office,
        level,
        state,
        district,
        party,
        primary_email,
        primary_phone,
        primary_website,
        primary_photo_url,
        data_quality_score,
        last_updated,
        created_at
      `)
      .eq('active', true)
      .limit(limit);

    // Filter by state (new schema uses 'state' field)
    query = query.eq('state', state);

    // Filter by level if specified
    if (level && level !== 'all') {
      query = query.eq('level', level);
    }

    const { data: reps, error } = await query;

    if (error) {
      throw error;
    }

    // Process each representative
    const processedReps = await Promise.all(
      (reps || []).map(async (rep) => {
        const response: Record<string, unknown> = {
          id: rep.id,
          name: rep.name,
          office: rep.office,
          level: rep.level,
          state: rep.state,
          district: rep.district,
          party: rep.party,
          last_updated: rep.last_updated
        };

        // Include FEC data if requested
        if (include.includes('fec') && rep.id) {
          const { data: fecData } = await supabase
            .from('representative_campaign_finance')
            .select('total_receipts, cash_on_hand, election_cycle, last_updated')
            .eq('representative_id', rep.id)
            .order('election_cycle', { ascending: false })
            .limit(1)
            .single();

          if (fecData) {
            response.fec = {
              total_receipts: fecData.total_receipts,
              cash_on_hand: fecData.cash_on_hand,
              cycle: fecData.election_cycle,
              last_updated: fecData.last_updated
            };
          }
        }

        // Include voting data if requested
        if (include.includes('votes') && rep.id) {
          const { data: votesData } = await supabase
            .from('representative_voting_records')
            .select('vote_id, bill_title, vote_date, vote_position, result, created_at')
            .eq('representative_id', rep.id)
            .order('vote_date', { ascending: false })
            .limit(5);

          if (votesData && votesData.length > 0) {
            response.votes = {
              last_5: votesData,
              last_updated: votesData[0]?.created_at || new Date().toISOString()
            };
          }
        }

        // Include contact data if requested
        if (include.includes('contact')) {
          response.contact = {
            phone: rep.primary_phone,
            email: rep.primary_email,
            website: rep.primary_website,
            last_updated: rep.last_updated
          };
        }

        return response;
      })
    );

    // Filter fields if requested
    let finalResponse = processedReps;
    if (fields.length > 0) {
      finalResponse = processedReps.map(rep => {
        const filtered: Record<string, unknown> = {};
        fields.forEach(field => {
          if (field in rep) {
            filtered[field] = rep[field];
          }
        });
        return filtered;
      });
    }

    const responseData = {
      ok: true,
      count: finalResponse.length,
      data: finalResponse,
      attribution: {
        fec: include.includes('fec') ? 'Federal Election Commission' : undefined,
        votes: include.includes('votes') ? 'GovTrack.us' : undefined,
        contact: include.includes('contact') ? 'ProPublica Congress API' : undefined
      }
    };

    return NextResponse.json(responseData, {
      headers: {
        'ETag': `"${state}-${level}-${Date.now()}"`,
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error fetching representatives by state:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}