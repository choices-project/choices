import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, validationError, errorResponse } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return errorResponse('Supabase configuration missing', 500);
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseKey,
    { auth: { persistSession: false } }
  );
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const level = searchParams.get('level');
    const fields = searchParams.get('fields')?.split(',') ?? [];
    const include = searchParams.get('include')?.split(',') ?? [];
    const includeDivisions = include.includes('divisions');
    const limit = parseInt(searchParams.get('limit') ?? '50');

  if (!state) {
    return validationError({ state: 'State parameter is required' });
  }

    type RepresentativeDivisionRow = {
      division_id: string | null;
    };

    type RepresentativeRow = {
      id: string;
      name: string;
      office: string;
      level: 'federal' | 'state' | 'local';
      jurisdiction: string;
      district: string | null;
      party: string | null;
      last_updated: string;
      person_id: string | null;
      contact: string | Record<string, unknown> | null;
      representative_divisions?: RepresentativeDivisionRow[] | null;
    };

    const selectFields = [
      'id',
      'name',
      'office',
      'level',
      'jurisdiction',
      'district',
      'party',
      'last_updated',
      'person_id',
      'contact'
    ];

    if (includeDivisions) {
      selectFields.push('representative_divisions:representative_divisions(division_id)');
    }

    let query = supabase
      .from('civics_representatives')
      .select(selectFields.join(','))
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

    const rows: RepresentativeRow[] = Array.isArray(reps)
      ? (reps as unknown as RepresentativeRow[])
      : [];

    // Process each representative
    const processedReps = await Promise.all(
      rows.map(async (rep: RepresentativeRow) => {
        const response: Record<string, unknown> = {
          id: rep.id,
          name: rep.name,
          office: rep.office,
          level: rep.level,
          jurisdiction: rep.jurisdiction,
          district: rep.district ?? undefined,
          party: rep.party ?? undefined,
          last_updated: rep.last_updated
        };

        if (includeDivisions && Array.isArray(rep.representative_divisions)) {
          const divisions = rep.representative_divisions
            .map((entry: RepresentativeDivisionRow) => entry?.division_id)
            .filter((value): value is string => Boolean(value));

          if (divisions.length > 0) {
            response.division_ids = divisions;
          }
        }

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
          const contact =
            typeof rep.contact === 'string' ? JSON.parse(rep.contact) : rep.contact;
          if (contact && typeof contact === 'object') {
            const contactRecord = contact as Record<string, unknown>;
            response.contact = {
              ...(typeof contactRecord.phone === 'string' ? { phone: contactRecord.phone } : {}),
              ...(typeof contactRecord.website === 'string'
                ? { website: contactRecord.website }
                : {}),
              ...(typeof contactRecord.twitter_url === 'string'
                ? { twitter_url: contactRecord.twitter_url }
                : {}),
              last_updated: rep.last_updated
            };
          }
        }

        return response;
      })
    );

    // Filter fields if requested
    let finalResponse = processedReps;
    if (fields.length > 0) {
      finalResponse = processedReps.map(rep => {
        const filtered: Record<string, unknown> = {};
        fields.forEach((field) => {
          if (field in rep) {
            filtered[field] = rep[field];
          }
        });
        return filtered;
      });
    }

  const response = successResponse({
    ok: true,
    count: finalResponse.length,
    data: finalResponse,
    attribution: {
      fec: include.includes('fec') ? 'Federal Election Commission' : undefined,
      votes: include.includes('votes') ? 'GovTrack.us' : undefined,
      contact: include.includes('contact') ? 'ProPublica Congress API' : undefined
    }
  });

  response.headers.set('ETag', `"${state}-${level}-${Date.now()}"`);
  response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');

  return response;
});
