import {
  validateCsrfProtection,
  createCsrfErrorResponse,
} from '@/app/api/auth/_shared';
import { getSupabaseApiRouteClient } from '@/utils/supabase/api-route';
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, authError, errorResponse } from '@/lib/api';
import { clearAllAuthCookiesOnResponse } from '@/lib/auth/request-auth-cookies';
import { devLog } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

type CleanupWarning = {
  step: string;
  message: string;
};

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  if (!(await validateCsrfProtection(request))) {
    return createCsrfErrorResponse();
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return authError('User not authenticated');
  }

  const warnings: CleanupWarning[] = [];

  const { error: profileError } = await supabase
    .from('user_profiles')
    .delete()
    .eq('user_id', user.id);

  if (profileError) {
    devLog('Profile deletion error:', { error: profileError });
    return errorResponse('Failed to delete profile', 500);
  }

  const { error: votesError } = await supabase.from('votes').delete().eq('user_id', user.id);

  if (votesError) {
    devLog('Votes deletion error:', { error: votesError });
    warnings.push({
      step: 'votes',
      message: votesError.message ?? 'Unknown error deleting votes',
    });
  }

  const { error: pollsError } = await supabase.from('polls').delete().eq('created_by', user.id);

  if (pollsError) {
    devLog('Polls deletion error:', { error: pollsError });
    warnings.push({
      step: 'polls',
      message: pollsError.message ?? 'Unknown error deleting polls',
    });
  }

  const { error: credentialsError } = await supabase
    .from('webauthn_credentials')
    .delete()
    .eq('user_id', user.id);

  if (credentialsError) {
    devLog('Credentials deletion error:', { error: credentialsError });
    warnings.push({
      step: 'webauthn_credentials',
      message: credentialsError.message ?? 'Unknown error deleting credentials',
    });
  }

  const adminClient = await getSupabaseAdminClient();
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

  if (deleteError) {
    devLog('Auth deletion error:', { error: deleteError });
    return errorResponse('Failed to delete user account', 500);
  }

  const response = successResponse({
    message: 'Account deleted successfully',
    warnings: warnings.length > 0 ? warnings : undefined,
  });

  try {
    const cookieCarrier = await getSupabaseApiRouteClient(request, response);
    await cookieCarrier.auth.signOut();
  } catch {
    // clearAllAuthCookiesOnResponse still runs below
  }

  clearAllAuthCookiesOnResponse(request, response);
  response.headers.set('Cache-Control', 'no-store, max-age=0');

  return response;
});
