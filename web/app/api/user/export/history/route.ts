import { getSupabaseServerClient } from '@/utils/supabase/server';

import { authError, successResponse } from '@/lib/api';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = async (_request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return successResponse({ history: [] });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return authError('Authentication required');
  }

  // Export history is not persisted yet. Return an empty list for now.
  return successResponse({ history: [] });
};
