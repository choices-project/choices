import {
  validateCsrfProtection,
  createCsrfErrorResponse,
} from '@/app/api/auth/_shared';
import { getSupabaseApiRouteClient } from '@/utils/supabase/api-route';

import { clearAllAuthCookiesOnResponse } from '@/lib/auth/request-auth-cookies';
import { withErrorHandling, successResponse, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';

export const POST = withErrorHandling(async (request: NextRequest) => {
  if (!(await validateCsrfProtection(request))) {
    return createCsrfErrorResponse();
  }

  const response = successResponse({
    message: 'Logged out successfully',
  });

  const supabase = await getSupabaseApiRouteClient(request, response);
  const { error } = await supabase.auth.signOut();

  if (error) {
    logger.warn('Logout error', { error: error.message });
    return errorResponse('Logout failed', 500);
  }

  clearAllAuthCookiesOnResponse(request, response);
  response.headers.set('Cache-Control', 'no-store, max-age=0');

  logger.info('User logged out successfully');
  return response;
});
