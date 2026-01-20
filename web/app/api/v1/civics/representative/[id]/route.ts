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
  state?: string;
  district?: string;
  party?: string;
  division_ids?: string[];
  primary_photo_url?: string;
  photos?: Array<{
    id: number;
    url: string;
    source: string;
    is_primary: boolean;
    alt_text?: string | null;
    attribution?: string | null;
  }>;
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
    const includePhotos = include.includes('photos');

    const representativeId = params.id?.trim();
    if (!representativeId) {
      return validationError({ id: 'Representative ID is required' });
    }

    // Get base representative data
    type RepresentativeDivisionRow = {
      division_id: string | null;
    };

    type RepresentativeRow = {
      id: number;
      name: string;
      office: string;
      level: 'federal' | 'state' | 'local';
      state: string;
      district: string | null;
      party: string | null;
      updated_at: string;
      openstates_id: string | null;
      primary_email?: string | null;
      primary_phone?: string | null;
      primary_website?: string | null;
      primary_photo_url?: string | null;
      representative_divisions?: RepresentativeDivisionRow[] | null;
      representative_photos?: Array<{
        id: number;
        url: string;
        source: string;
        is_primary: boolean;
        alt_text?: string | null;
        attribution?: string | null;
      }> | null;
    };

    const selectFields = [
      'id',
      'name',
      'office',
      'level',
      'state',
      'district',
      'party',
      'updated_at',
      'openstates_id',
      'primary_email',
      'primary_phone',
      'primary_website',
      'primary_photo_url'
    ];

    if (includeDivisions) {
      selectFields.push('representative_divisions:representative_divisions(division_id)');
    }
    if (includePhotos) {
      selectFields.push('representative_photos(id,url,source,is_primary,alt_text,attribution)');
    }

    const repId = parseInt(representativeId, 10);
    if (isNaN(repId)) {
      return validationError({ id: 'Invalid representative ID format' });
    }

    const { data: rep, error: repError } = await supabase
      .from('representatives_core')
      .select(selectFields.join(','))
      .eq('id', repId)
      .eq('is_active', true)
      .maybeSingle();

    if (repError) {
      return errorResponse('Failed to load representative', 502, { reason: repError.message });
    }

    if (!rep) {
      return notFoundError('Representative not found');
    }

    const representativeRow = rep as unknown as RepresentativeRow;
    const photos = includePhotos && Array.isArray(representativeRow.representative_photos)
      ? representativeRow.representative_photos
      : [];
    const primaryPhotoFromSet =
      photos.find((photo) => photo.is_primary)?.url ?? photos[0]?.url ?? null;

    const response: RepresentativeResponse = {
      id: String(representativeRow.id),
      name: representativeRow.name,
      office: representativeRow.office,
      level: representativeRow.level,
      jurisdiction: representativeRow.state,
      state: representativeRow.state,
      attribution: {},
      last_updated: representativeRow.updated_at
    };

    if (representativeRow.district) {
      response.district = representativeRow.district;
    }

    if (representativeRow.party) {
      response.party = representativeRow.party;
    }

    const primaryPhoto = representativeRow.primary_photo_url ?? primaryPhotoFromSet;
    if (primaryPhoto) {
      response.primary_photo_url = primaryPhoto;
    }
    if (includePhotos && photos.length > 0) {
      response.photos = photos;
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
    if (include.includes('fec')) {
      response.attribution.fec = 'Federal Election Commission';

      const { data: fecData, error: fecError } = await supabase
        .from('representative_campaign_finance')
        .select('total_raised, cash_on_hand, cycle, updated_at')
        .eq('representative_id', representativeRow.id)
        .order('cycle', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!fecError && fecData) {
        response.fec = {
          total_receipts: fecData.total_raised ?? 0,
          cash_on_hand: fecData.cash_on_hand ?? 0,
          cycle: fecData.cycle ?? new Date().getFullYear(),
          last_updated: fecData.updated_at ?? representativeRow.updated_at
        };
      }
    }

    // Include voting data if requested
    if (include.includes('votes')) {
      const { data: votesData, error: votesError } = await supabase
        .from('representative_activity')
        .select('id, title, description, date, metadata, url')
        .eq('representative_id', representativeRow.id)
        .eq('type', 'vote')
        .order('date', { ascending: false })
        .limit(5);

      if (!votesError && votesData && Array.isArray(votesData) && votesData.length > 0) {
        response.votes = {
          last_5: votesData.map(v => {
            const metadata = v.metadata && typeof v.metadata === 'object' && !Array.isArray(v.metadata)
              ? v.metadata as Record<string, unknown>
              : {};
            return {
              vote_id: String(v.id),
              bill_title: v.title ?? '',
              vote_date: v.date ?? '',
              vote_position: typeof metadata.vote_position === 'string' ? metadata.vote_position : null,
              party_position: null,
              last_updated: representativeRow.updated_at
            };
          }),
          party_alignment: 0,
          last_updated: representativeRow.updated_at
        };
        response.attribution.votes = 'GovTrack.us';
      }
    }

    // Include contact data if requested
    if (include.includes('contact')) {
      response.contact = {
        ...(representativeRow.primary_phone ? { phone: representativeRow.primary_phone } : {}),
        ...(representativeRow.primary_website ? { website: representativeRow.primary_website } : {}),
        ...(representativeRow.primary_email ? { email: representativeRow.primary_email } : {}),
        last_updated: representativeRow.updated_at
      };
      response.attribution.contact = 'ProPublica Congress API';
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

      responsePayload.headers.set('ETag', `"${representativeRow.id}-${representativeRow.updated_at}"`);
      responsePayload.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');

      return responsePayload;
    }

    const apiResponse = successResponse(
      { representative: response },
      {
        include: include.length > 0 ? include : undefined
      }
    );

    apiResponse.headers.set('ETag', `"${representativeRow.id}-${representativeRow.updated_at}"`);
    apiResponse.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');

    return apiResponse;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error fetching representative:', error instanceof Error ? error : new Error(String(error)));
    return errorResponse('Failed to fetch representative', 500, { reason: errorMessage });
  }
});
