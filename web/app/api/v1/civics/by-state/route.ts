import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, validationError, errorResponse } from '@/lib/api';

import type { NextRequest } from 'next/server';


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
      representative_divisions?: RepresentativeDivisionRow[] | null;
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
      'primary_website'
    ];

    if (includeDivisions) {
      selectFields.push('representative_divisions:representative_divisions(division_id)');
    }

    let query = supabase
      .from('representatives_core')
      .select(selectFields.join(','))
      .eq('status', 'active') // Use status field instead of is_active
      .not('name', 'ilike', '%test%')
      .limit(limit);

    // Filter by state
    if (state !== 'US') {
      // For federal reps, check if district contains the state
      if (level === 'federal') {
        query = query.or(`district.ilike.%${state}%,state.eq.${state}`);
      } else {
        query = query.eq('state', state);
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
          id: String(rep.id),
          name: rep.name,
          office: rep.office,
          level: rep.level,
          jurisdiction: rep.state,
          district: rep.district ?? undefined,
          party: rep.party ?? undefined,
          last_updated: rep.updated_at
        };

        if (includeDivisions && Array.isArray(rep.representative_divisions)) {
          const divisions = rep.representative_divisions
            .map((entry: RepresentativeDivisionRow) => entry?.division_id)
            .filter((value): value is string => Boolean(value));

          if (divisions.length > 0) {
            response.division_ids = divisions;
          }
        }

        const wantFec = include.includes('fec') && !!rep.id;
        const wantVotes = include.includes('votes') && !!rep.id;
        const fecPromise = wantFec
          ? supabase.from('representative_campaign_finance').select('total_raised, cash_on_hand, cycle, updated_at').eq('representative_id', rep.id).order('cycle', { ascending: false }).limit(1).maybeSingle()
          : Promise.resolve({ data: null, error: null });
        const votesPromise = wantVotes
          ? supabase.from('representative_activity').select('id, title, description, date, metadata, url').eq('representative_id', rep.id).eq('type', 'vote').order('date', { ascending: false }).limit(5)
          : Promise.resolve({ data: null, error: null });

        const [fecRes, votesRes] = await Promise.all([fecPromise, votesPromise]);

        if (wantFec && !fecRes.error && fecRes.data) {
          const fecData = fecRes.data;
          response.fec = {
            total_receipts: fecData.total_raised ?? 0,
            cash_on_hand: fecData.cash_on_hand ?? 0,
            cycle: fecData.cycle ?? new Date().getFullYear(),
            last_updated: fecData.updated_at ?? rep.updated_at
          };
        }
        if (wantVotes && !votesRes.error && votesRes.data && Array.isArray(votesRes.data) && votesRes.data.length > 0) {
          const votesData = votesRes.data;
          response.votes = {
            last_5: votesData.map((v: { id: number; title?: string | null; date?: string | null; metadata?: unknown }) => {
              const meta = v.metadata && typeof v.metadata === 'object' && !Array.isArray(v.metadata) ? (v.metadata as Record<string, unknown>) : {};
              return {
                vote_id: String(v.id),
                bill_title: v.title ?? '',
                vote_date: v.date ?? '',
                vote_position: typeof meta.vote_position === 'string' ? meta.vote_position : null,
                party_position: null,
                last_updated: rep.updated_at
              };
            }),
            party_alignment: null,
            last_updated: rep.updated_at
          };
        }

        // Include contact data if requested
        if (include.includes('contact')) {
            response.contact = {
            ...(rep.primary_phone ? { phone: rep.primary_phone } : {}),
            ...(rep.primary_website ? { website: rep.primary_website } : {}),
            ...(rep.primary_email ? { email: rep.primary_email } : {}),
            last_updated: rep.updated_at
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
