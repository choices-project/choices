import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, authError, successResponse, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';



export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const supabaseClient = await getSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    logger.warn('User not authenticated for onboarding completion');
    return authError('Authentication required');
  }

  const contentType = req.headers.get('content-type');
  let preferences: Record<string, unknown> = {};

  if (contentType?.includes('application/json')) {
    try {
      const body = await req.json();
      const parsedPreferences =
        typeof body?.preferences === 'object' && body?.preferences !== null ? body.preferences : {};
      preferences = parsedPreferences as Record<string, unknown>;
    } catch (parseError) {
      logger.warn('Invalid JSON supplied to onboarding completion route', { error: parseError });
      return errorResponse('Invalid request payload', 400, undefined, 'ONBOARDING_INVALID_PAYLOAD');
    }
  } else {
    const formData = await req.formData();
    preferences = {
      notifications: formData.get('notifications') === 'true',
      dataSharing: formData.get('dataSharing') === 'true',
      theme: formData.get('theme') ?? 'system',
    };
  }

  const { error: updateError } = await supabaseClient
    .from('user_profiles')
    .update({
      onboarding_completed: true,
      preferences,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('user_id', user.id);

  if (updateError) {
    logger.error('Failed to complete onboarding', updateError);
    return errorResponse(
      'Failed to complete onboarding',
      500,
      { message: updateError.message },
      'ONBOARDING_UPDATE_FAILED'
    );
  }

  const destination = new URL('/dashboard', req.url).toString();

  logger.info('Onboarding completed successfully', { userId: user.id });

  const response = successResponse({
    message: 'Onboarding completed successfully',
    redirectTo: destination,
    onboarding: {
      completed: true,
      preferences,
    },
  });

  response.headers.set('Cache-Control', 'no-store');

  return response;
});
