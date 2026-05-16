import { getSupabaseServerClient } from '@/utils/supabase/server';

import { authError, successResponse, withErrorHandling } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * Read the httpOnly Supabase session on the server and return tokens so the
 * browser client can call `setSession` (middleware already validated cookies).
 */
export const GET = withErrorHandling(async () => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return authError('Not authenticated');
  }

  const response = successResponse({
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
      token_type: session.token_type,
      user: session.user,
    },
  });

  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
});
