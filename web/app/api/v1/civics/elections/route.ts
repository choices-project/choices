import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, errorResponse } from '@/lib/api';

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
    throw error;
  }

  const elections = data ?? [];

  return successResponse({
    ok: true,
    count: elections.length,
    data: elections
  });
});


