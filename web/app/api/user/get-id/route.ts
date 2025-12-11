import { cookies } from 'next/headers';

import { getSupabaseServerClient } from '@/utils/supabase/server';

import {
  withErrorHandling,
  successResponse,
  authError,
  errorResponse,
} from '@/lib/api';

export const dynamic = 'force-dynamic';

// GET /api/user/get-id - Get current user ID (for security setup)
export const GET = withErrorHandling(async () => {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return errorResponse('Supabase client not available', 500, {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      cookies: cookies()
        .getAll()
        .map((cookie) => cookie.name || 'unnamed'),
    });
  }

  // Check authentication
  const supabaseClient = await supabase;
  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError) {
    return authError('Authentication error');
  }

  if (!user) {
    return authError('Authentication required');
  }

  return successResponse({ id: user.id });
});
