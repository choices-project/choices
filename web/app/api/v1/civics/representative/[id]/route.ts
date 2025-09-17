// app/api/v1/civics/representative/[id]/route.ts
// Versioned API endpoint for single representative with FEC and voting data
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

type RepresentativeResponse = {
  id: string;
  name: string;
  office: string;
  level: 'federal' | 'state' | 'local';
  jurisdiction: string;
  district?: string;
  party?: string;
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const fields = searchParams.get('fields')?.split(',') || [];
    const include = searchParams.get('include')?.split(',') || [];
    
    const representativeId = params.id;

    // Get base representative data
    const { data: rep, error: repError } = await supabase
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
      .eq('id', representativeId)
      .eq('valid_to', 'infinity')
      .single();

    if (repError || !rep) {
      return NextResponse.json(
        { error: 'Representative not found' },
        { status: 404 }
      );
    }

    const response: RepresentativeResponse = {
      id: rep.id,
      name: rep.name,
      office: rep.office,
      level: rep.level,
      jurisdiction: rep.jurisdiction,
      district: rep.district,
      party: rep.party,
      attribution: {},
      last_updated: rep.last_updated
    };

    // Include FEC data if requested
    if (include.includes('fec') && rep.person_id) {
      const { data: fecData, error: fecError } = await supabase
        .from('civics_fec_minimal')
        .select('total_receipts, cash_on_hand, election_cycle, last_updated')
        .eq('person_id', rep.person_id)
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
    if (include.includes('votes') && rep.person_id) {
      const { data: votesData, error: votesError } = await supabase
        .from('civics_votes_minimal')
        .select('vote_id, bill_title, vote_date, vote_position, party_position, last_updated')
        .eq('person_id', rep.person_id)
        .order('vote_date', { ascending: false })
        .limit(5);

      if (!votesError && votesData) {
        // Calculate party alignment
        const partyVotes = votesData.filter(vote => vote.party_position === vote.vote_position);
        const partyAlignment = votesData.length > 0 ? partyVotes.length / votesData.length : 0;

        response.votes = {
          last_5: votesData,
          party_alignment: Math.round(partyAlignment * 100) / 100,
          last_updated: votesData[0]?.last_updated || rep.last_updated
        };
        response.attribution.votes = 'GovTrack.us';
      }
    }

    // Include contact data if requested
    if (include.includes('contact')) {
      // For now, extract from existing contact field
      if (rep.contact) {
        const contact = typeof rep.contact === 'string' ? JSON.parse(rep.contact) : rep.contact;
        response.contact = {
          phone: contact.phone,
          website: contact.website,
          twitter_url: contact.twitter_url,
          last_updated: rep.last_updated
        };
        response.attribution.contact = 'ProPublica Congress API';
      }
    }

    // Filter fields if requested
    if (fields.length > 0) {
      const filteredResponse: Record<string, unknown> = {};
      fields.forEach(field => {
        if (field in response) {
          filteredResponse[field] = response[field as keyof RepresentativeResponse];
        }
      });
      return NextResponse.json(filteredResponse, {
        headers: {
          'ETag': `"${rep.id}-${rep.last_updated}"`,
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
          'Content-Type': 'application/json'
        }
      });
    }

    return NextResponse.json(response, {
      headers: {
        'ETag': `"${rep.id}-${rep.last_updated}"`,
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error fetching representative:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}