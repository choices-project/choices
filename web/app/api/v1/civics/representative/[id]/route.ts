// app/api/v1/civics/representative/[id]/route.ts
// Versioned API endpoint for single representative with FEC and voting data
import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, validationError, notFoundError, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';



type RepresentativeResponse = {
  id: string;
  name: string;
  office: string;
  level: 'federal' | 'state' | 'local';
  jurisdiction: string;
  district?: string;
  party?: string;
  division_ids?: string[];
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

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const supabase = await getSupabaseServerClient();
    
    if (!supabase) {
      return errorResponse('Supabase client not available', 503);
    }

    const { searchParams } = new URL(request.url);
    const fields = searchParams.get('fields')?.split(',') ?? [];
    const include = searchParams.get('include')?.split(',') ?? [];
    const includeDivisions = include.includes('divisions');

    const representativeId = params.id?.trim();
    if (!representativeId) {
      return validationError({ id: 'Representative ID is required' });
    }

    // Get base representative data
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

    const { data: rep, error: repError } = await supabase
      .from('civics_representatives' as any)
      .select(selectFields.join(','))
      .eq('id', representativeId)
      .eq('valid_to', 'infinity')
      .maybeSingle();

    if (repError) {
      return errorResponse('Failed to load representative', 502, { reason: repError.message });
    }

    if (!rep) {
      return notFoundError('Representative not found');
    }

    const representativeRow = rep as unknown as RepresentativeRow;

    const response: RepresentativeResponse = {
      id: representativeRow.id,
      name: representativeRow.name,
      office: representativeRow.office,
      level: representativeRow.level,
      jurisdiction: representativeRow.jurisdiction,
      attribution: {},
      last_updated: representativeRow.last_updated
    };

    if (representativeRow.district) {
      response.district = representativeRow.district;
    }

    if (representativeRow.party) {
      response.party = representativeRow.party;
    }

    if (includeDivisions && Array.isArray(representativeRow.representative_divisions)) {
      const divisions = representativeRow.representative_divisions
        .map((entry: RepresentativeDivisionRow) => entry?.division_id)
        .filter((value): value is string => Boolean(value));
      if (divisions.length > 0) {
        response.division_ids = divisions;
      }
    }

    // Include FEC data if requested
    if (include.includes('fec') && representativeRow.person_id) {
      const { data: fecData, error: fecError } = await supabase
        .from('civics_fec_minimal' as any)
        .select('total_receipts, cash_on_hand, election_cycle, last_updated')
        .eq('person_id', representativeRow.person_id)
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
        response.attribution.fec = 'Federal Election Commission';
      }
    }

    // Include voting data if requested
    if (include.includes('votes') && representativeRow.person_id) {
      const { data: votesData, error: votesError } = await supabase
        .from('civics_votes_minimal' as any)
        .select('vote_id, bill_title, vote_date, vote_position, party_position, last_updated')
        .eq('person_id', representativeRow.person_id)
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
        // Calculate party alignment
        const partyVotes = typedVotesData.filter(vote => vote.party_position === vote.vote_position);
        const partyAlignment = partyVotes.length / typedVotesData.length;

        response.votes = {
          last_5: typedVotesData,
          party_alignment: Math.round(partyAlignment * 100) / 100,
          last_updated: typedVotesData[0]?.last_updated || representativeRow.last_updated
        };
        response.attribution.votes = 'GovTrack.us';
      }
    }

    // Include contact data if requested
    if (include.includes('contact')) {
      // For now, extract from existing contact field
      if (representativeRow.contact) {
        const contact =
          typeof representativeRow.contact === 'string'
            ? JSON.parse(representativeRow.contact)
            : representativeRow.contact;
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
            last_updated: representativeRow.last_updated
          };
          response.attribution.contact = 'ProPublica Congress API';
        }
      }
    }

    // Filter fields if requested
    if (fields.length > 0) {
      const filteredResponse: Record<string, unknown> = {};
      fields.forEach((field) => {
        if (field in response) {
          filteredResponse[field] = response[field as keyof RepresentativeResponse];
        }
      });
      const responsePayload = successResponse(
        { representative: filteredResponse },
        {
          include: include.length > 0 ? include : undefined,
          fields: fields.length > 0 ? fields : undefined
        }
      );

      responsePayload.headers.set('ETag', `"${representativeRow.id}-${representativeRow.last_updated}"`);
      responsePayload.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');

      return responsePayload;
    }

    const apiResponse = successResponse(
      { representative: response },
      {
        include: include.length > 0 ? include : undefined
      }
    );

    apiResponse.headers.set('ETag', `"${representativeRow.id}-${representativeRow.last_updated}"`);
    apiResponse.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');

    return apiResponse;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error fetching representative:', error instanceof Error ? error : new Error(String(error)));
    return errorResponse('Failed to fetch representative', 500, { reason: errorMessage });
  }
});
