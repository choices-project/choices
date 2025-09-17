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

    // Build query
    let query = supabase
      .from('civics_representatives')
      .select(`
        id,
        name,
        office,
        level,
        jurisdiction,
        district,
        party,
        last_updated,
        person_id,
        contact
      `)
      .eq('valid_to', 'infinity')
      .limit(limit);

    // Filter by state
    if (state !== 'US') {
      // For federal reps, check if district contains the state
      if (level === 'federal') {
        query = query.or(`district.ilike.%${state}%,jurisdiction.ilike.%${state}%`);
      } else {
        query = query.eq('jurisdiction', state);
      }
    } else {
      query = query.eq('level', 'federal');
    }

    // Filter by level if specified
    if (level) {
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
          jurisdiction: rep.jurisdiction,
          district: rep.district,
          party: rep.party,
          last_updated: rep.last_updated
        };

        // Include FEC data if requested
        if (include.includes('fec') && rep.person_id) {
          const { data: fecData } = await supabase
            .from('civics_fec_minimal')
            .select('total_receipts, cash_on_hand, election_cycle, last_updated')
            .eq('person_id', rep.person_id)
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
        if (include.includes('votes') && rep.person_id) {
          const { data: votesData } = await supabase
            .from('civics_votes_minimal')
            .select('vote_id, bill_title, vote_date, vote_position, party_position, last_updated')
            .eq('person_id', rep.person_id)
            .order('vote_date', { ascending: false })
            .limit(5);

          if (votesData && votesData.length > 0) {
            const partyVotes = votesData.filter(vote => vote.party_position === vote.vote_position);
            const partyAlignment = partyVotes.length / votesData.length;

            response.votes = {
              last_5: votesData,
              party_alignment: Math.round(partyAlignment * 100) / 100,
              last_updated: votesData[0]?.last_updated || new Date().toISOString()
            };
          }
        }

        // Include contact data if requested
        if (include.includes('contact') && rep.contact) {
          const contact = typeof rep.contact === 'string' ? JSON.parse(rep.contact) : rep.contact;
          response.contact = {
            phone: contact.phone,
            website: contact.website,
            twitter_url: contact.twitter_url,
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