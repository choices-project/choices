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
  openstates_id?: string;
  bioguide_id?: string;
  fec_id?: string;
  google_civic_id?: string;
  congress_gov_id?: string;
  legiscan_id?: string;
  govinfo_id?: string;
  ballotpedia_url?: string;
  term_start_date?: string;
  term_end_date?: string;
  next_election_date?: string;
  data_quality_score?: number;
  verification_status?: string;
  data_sources?: string[];
  last_verified?: string;
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
  contacts?: Array<{
    id: number;
    contact_type: string;
    value: string;
    source?: string | null;
    is_primary?: boolean | null;
    is_verified?: boolean | null;
  }>;
  social_media?: Array<{
    id: number;
    platform: string;
    handle: string;
    url?: string | null;
    followers_count?: number | null;
    is_primary?: boolean | null;
    is_verified?: boolean | null;
  }>;
  committees?: Array<{
    id: number;
    committee_name: string;
    role?: string | null;
    is_current?: boolean | null;
    start_date?: string | null;
    end_date?: string | null;
  }>;
  activities?: Array<{
    id: number;
    type: string;
    title: string;
    description?: string | null;
    date?: string | null;
    source?: string | null;
    source_url?: string | null;
    url?: string | null;
  }>;
  campaign_finance?: {
    total_raised?: number | null;
    total_spent?: number | null;
    cash_on_hand?: number | null;
    cycle?: number | null;
    last_filing_date?: string | null;
    last_updated?: string | null;
    source?: string | null;
  };
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
    const includeContacts = include.includes('contacts');
    const includeSocial = include.includes('social') || include.includes('social_media');
    const includeCommittees = include.includes('committees');
    const includeActivities = include.includes('activities');
    const includeCampaignFinance = include.includes('campaign_finance');

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
      bioguide_id: string | null;
      fec_id: string | null;
      google_civic_id: string | null;
      congress_gov_id: string | null;
      legiscan_id: string | null;
      govinfo_id: string | null;
      ballotpedia_url: string | null;
      primary_email?: string | null;
      primary_phone?: string | null;
      primary_website?: string | null;
      primary_photo_url?: string | null;
      term_start_date?: string | null;
      term_end_date?: string | null;
      next_election_date?: string | null;
      data_quality_score?: number | null;
      verification_status?: string | null;
      data_sources?: string[] | null;
      last_verified?: string | null;
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
      'bioguide_id',
      'fec_id',
      'google_civic_id',
      'congress_gov_id',
      'legiscan_id',
      'govinfo_id',
      'ballotpedia_url',
      'primary_email',
      'primary_phone',
      'primary_website',
      'primary_photo_url',
      'term_start_date',
      'term_end_date',
      'next_election_date',
      'data_quality_score',
      'verification_status',
      'data_sources',
      'last_verified'
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
      .eq('status', 'active') // Use status field instead of is_active
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

    if (representativeRow.openstates_id) {
      response.openstates_id = representativeRow.openstates_id;
    }
    if (representativeRow.bioguide_id) {
      response.bioguide_id = representativeRow.bioguide_id;
    }
    if (representativeRow.fec_id) {
      response.fec_id = representativeRow.fec_id;
    }
    if (representativeRow.google_civic_id) {
      response.google_civic_id = representativeRow.google_civic_id;
    }
    if (representativeRow.congress_gov_id) {
      response.congress_gov_id = representativeRow.congress_gov_id;
    }
    if (representativeRow.legiscan_id) {
      response.legiscan_id = representativeRow.legiscan_id;
    }
    if (representativeRow.govinfo_id) {
      response.govinfo_id = representativeRow.govinfo_id;
    }
    if (representativeRow.ballotpedia_url) {
      response.ballotpedia_url = representativeRow.ballotpedia_url;
    }
    if (representativeRow.term_start_date) {
      response.term_start_date = representativeRow.term_start_date;
    }
    if (representativeRow.term_end_date) {
      response.term_end_date = representativeRow.term_end_date;
    }
    if (representativeRow.next_election_date) {
      response.next_election_date = representativeRow.next_election_date;
    }
    response.data_quality_score = representativeRow.data_quality_score ?? 0;
    if (representativeRow.verification_status) {
      response.verification_status = representativeRow.verification_status;
    }
    if (Array.isArray(representativeRow.data_sources)) {
      const sources = representativeRow.data_sources.filter(
        (value): value is string => typeof value === 'string'
      );
      if (sources.length > 0) {
        response.data_sources = sources;
      }
    }
    if (representativeRow.last_verified) {
      response.last_verified = representativeRow.last_verified;
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

    // Include contact data if requested (from rep row only; no extra fetch)
    if (include.includes('contact')) {
      response.contact = {
        ...(representativeRow.primary_phone ? { phone: representativeRow.primary_phone } : {}),
        ...(representativeRow.primary_website ? { website: representativeRow.primary_website } : {}),
        ...(representativeRow.primary_email ? { email: representativeRow.primary_email } : {}),
        last_updated: representativeRow.updated_at
      };
      response.attribution.contact = 'ProPublica Congress API';
    }

    const fecPromise = include.includes('fec')
      ? supabase.from('representative_campaign_finance').select('total_raised, cash_on_hand, cycle, updated_at').eq('representative_id', repId).order('cycle', { ascending: false }).limit(1).maybeSingle()
      : Promise.resolve({ data: null, error: null });
    const financePromise = includeCampaignFinance
      ? supabase.from('representative_campaign_finance').select('total_raised, total_spent, cash_on_hand, cycle, last_filing_date, updated_at, source').eq('representative_id', repId).order('cycle', { ascending: false }).limit(1).maybeSingle()
      : Promise.resolve({ data: null, error: null });
    const votesPromise = include.includes('votes')
      ? supabase.from('representative_activity').select('id, title, description, date, metadata, url').eq('representative_id', repId).eq('type', 'vote').order('date', { ascending: false }).limit(5)
      : Promise.resolve({ data: null, error: null });
    const contactsPromise = includeContacts
      ? supabase.from('representative_contacts').select('id, contact_type, value, source, is_primary, is_verified').eq('representative_id', repId).order('is_primary', { ascending: false }).order('contact_type', { ascending: true })
      : Promise.resolve({ data: null, error: null });
    const socialPromise = includeSocial
      ? supabase.from('representative_social_media').select('id, platform, handle, url, followers_count, is_primary, is_verified').eq('representative_id', repId).order('is_primary', { ascending: false }).order('platform', { ascending: true })
      : Promise.resolve({ data: null, error: null });
    const committeesPromise = includeCommittees
      ? supabase.from('representative_committees').select('id, committee_name, role, is_current, start_date, end_date').eq('representative_id', repId).order('is_current', { ascending: false }).order('committee_name', { ascending: true })
      : Promise.resolve({ data: null, error: null });
    const activitiesPromise = includeActivities
      ? supabase.from('representative_activity').select('id, type, title, description, date, source, source_url, url').eq('representative_id', repId).eq('type', 'bill').order('date', { ascending: false }).limit(10)
      : Promise.resolve({ data: null, error: null });

    const [fecRes, financeRes, votesRes, contactsRes, socialRes, committeesRes, activitiesRes] = await Promise.all([
      fecPromise,
      financePromise,
      votesPromise,
      contactsPromise,
      socialPromise,
      committeesPromise,
      activitiesPromise
    ]);

    if (include.includes('fec')) {
      response.attribution.fec = 'Federal Election Commission';
      const fecData = fecRes.data;
      if (!fecRes.error && fecData) {
        response.fec = {
          total_receipts: fecData.total_raised ?? 0,
          cash_on_hand: fecData.cash_on_hand ?? 0,
          cycle: fecData.cycle ?? new Date().getFullYear(),
          last_updated: fecData.updated_at ?? representativeRow.updated_at
        };
      }
    }

    if (includeCampaignFinance) {
      const financeData = financeRes.data;
      if (!financeRes.error && financeData) {
        response.campaign_finance = {
          total_raised: financeData.total_raised ?? null,
          total_spent: financeData.total_spent ?? null,
          cash_on_hand: financeData.cash_on_hand ?? null,
          cycle: financeData.cycle ?? null,
          last_filing_date: financeData.last_filing_date ?? null,
          last_updated: financeData.updated_at ?? representativeRow.updated_at,
          source: financeData.source ?? null
        };
      }
    }

    if (include.includes('votes')) {
      const votesData = votesRes.data;
      if (!votesRes.error && votesData && Array.isArray(votesData) && votesData.length > 0) {
        response.votes = {
          last_5: votesData.map((v: { id: number; title?: string | null; date?: string | null; metadata?: unknown }) => {
            const meta = v.metadata && typeof v.metadata === 'object' && !Array.isArray(v.metadata) ? (v.metadata as Record<string, unknown>) : {};
            return {
              vote_id: String(v.id),
              bill_title: v.title ?? '',
              vote_date: v.date ?? '',
              vote_position: typeof meta.vote_position === 'string' ? meta.vote_position : null,
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

    if (includeContacts && !contactsRes.error && Array.isArray(contactsRes.data)) {
      response.contacts = contactsRes.data;
    }
    if (includeSocial && !socialRes.error && Array.isArray(socialRes.data)) {
      response.social_media = socialRes.data;
    }
    if (includeCommittees && !committeesRes.error && Array.isArray(committeesRes.data)) {
      response.committees = committeesRes.data;
    }
    if (includeActivities && !activitiesRes.error && Array.isArray(activitiesRes.data)) {
      response.activities = activitiesRes.data;
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
