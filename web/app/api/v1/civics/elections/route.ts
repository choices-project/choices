import { createClient } from '@supabase/supabase-js';

import { withErrorHandling, successResponse, errorResponse } from '@/lib/api';

import type { NextRequest } from 'next/server';


export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return errorResponse('Supabase configuration missing', 500);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  const { searchParams } = new URL(request.url);
  const divisionsParam = searchParams.get('divisions');
  const divisions = divisionsParam
    ? divisionsParam
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    : null;

  const { data, error } = await supabase.rpc('get_upcoming_elections', {
    divisions
  });

  if (error) {
    return errorResponse('Failed to load upcoming elections', 502, { reason: error.message });
  }

  const elections = data ?? [];

  return successResponse(
    {
      elections,
      count: elections.length
    },
    {
      source: 'supabase',
      filters: divisions ? { divisions } : undefined
    }
  );
});


