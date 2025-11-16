import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, validationError, errorResponse } from '@/lib/api';

export const dynamic = 'force-dynamic';

const STATE_CODE_REGEX = /^[A-Za-z]{2}$/;

function extractStateFromDivision(division: string | null): string | null {
  if (!division) return null;
  const match = division.match(/state:([a-z]{2})/i);
  if (!match) return null;
  return match[1]?.toUpperCase() ?? null;
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return errorResponse('Supabase configuration missing', 500);
  }

  const { searchParams } = new URL(request.url);
  const stateParam = searchParams.get('state');
  const divisionParam = searchParams.get('division');

  let stateCode = stateParam?.trim().toUpperCase() ?? '';
  if (!stateCode && divisionParam) {
    stateCode = extractStateFromDivision(divisionParam) ?? '';
  }

  if (!stateCode) {
    return validationError({ state: 'Provide a two-letter state code or division with state segment.' });
  }

  if (!STATE_CODE_REGEX.test(stateCode)) {
    return validationError({ state: 'Invalid state code.' });
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseKey,
    { auth: { persistSession: false } },
  );

  const { data, error } = await supabase
    .from('voter_registration_resources_view')
    .select(
      'state_code,election_office_name,online_url,mail_form_url,mailing_address,status_check_url,special_instructions,sources,metadata,last_verified,updated_at',
    )
    .eq('state_code', stateCode)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    return errorResponse('Failed to load voter registration resources', 502, {
      reason: error.message
    });
  }

  const response = successResponse(
    {
      state: stateCode,
      registration: data ?? null
    },
    {
      source: 'supabase',
      view: 'voter_registration_resources_view'
    }
  );

  response.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  response.headers.set('ETag', `"voter-registration-${stateCode}-${data?.updated_at ?? 'none'}"`);

  return response;
});


