import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, validationError, errorResponse } from '@/lib/api';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  try {
    const supabase = await getSupabaseServerClient();
    
    if (!supabase) {
      return errorResponse('Supabase client not available', 503);
    }
    
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
      .from('civics_representatives' as any)
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
      return errorResponse('Failed to load representatives', 502, { reason: error.message });
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
          const { data: fecData, error: fecError } = await supabase
            .from('civics_fec_minimal' as any)
            .select('total_receipts, cash_on_hand, election_cycle, last_updated')
            .eq('person_id', rep.person_id)
            .order('election_cycle', { ascending: false })
            .limit(1)
            .single();

          if (!fecError && fecData) {
            const typedFecData = fecData as unknown as {
              total_receipts: number;
              cash_on_hand: number;
              election_cycle: number;
              last_updated: string;
            };
            response.fec = {
              total_receipts: typedFecData.total_receipts,
              cash_on_hand: typedFecData.cash_on_hand,
              cycle: typedFecData.election_cycle,
              last_updated: typedFecData.last_updated
            };
          }
        }

        // Include voting data if requested
        if (include.includes('votes') && rep.person_id) {
          const { data: votesData, error: votesError } = await supabase
            .from('civics_votes_minimal' as any)
            .select('vote_id, bill_title, vote_date, vote_position, party_position, last_updated')
            .eq('person_id', rep.person_id)
            .order('vote_date', { ascending: false })
            .limit(5);

          if (!votesError && votesData && Array.isArray(votesData) && votesData.length > 0) {
            const typedVotesData = votesData as unknown as Array<{
              vote_id: string;
              bill_title: string;
              vote_date: string;
              vote_position: string;
              party_position: string;
              last_updated: string;
            }>;
            const partyVotes = typedVotesData.filter(vote => vote.party_position === vote.vote_position);
            const partyAlignment = partyVotes.length / typedVotesData.length;

            response.votes = {
              last_5: typedVotesData,
              party_alignment: Math.round(partyAlignment * 100) / 100,
              last_updated: typedVotesData[0]?.last_updated || new Date().toISOString()
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

  const response = successResponse(
    {
      state: state ?? 'US',
      level: level ?? undefined,
      representatives: finalResponse,
      count: finalResponse.length,
      attribution: {
        fec: include.includes('fec') ? 'Federal Election Commission' : undefined,
        votes: include.includes('votes') ? 'GovTrack.us' : undefined,
        contact: include.includes('contact') ? 'ProPublica Congress API' : undefined
      }
    },
    {
      include: include.length > 0 ? include : undefined,
      fields: fields.length > 0 ? fields : undefined
    }
  );

    response.headers.set('ETag', `"${state}-${level}-${Date.now()}"`);
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse('Failed to process request', 500, { reason: errorMessage });
  }
});
