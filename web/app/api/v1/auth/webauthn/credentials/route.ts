import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, authError, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';



export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (): Promise<any> => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return authError('Authentication required');
  }

    // Fetch user's WebAuthn credentials
    const { data: credentials, error: credentialsError } = await supabase
      .from('webauthn_credentials')
      .select(`
        id,
        credential_id,
        device_label,
        last_used_at,
        created_at,
        metadata
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (credentialsError) {
      logger.error('Failed to fetch WebAuthn credentials:', credentialsError);
      return errorResponse('Failed to fetch credentials', 500, undefined, 'WEBAUTHN_CREDENTIALS_FETCH_FAILED');
    }

    logger.info('WebAuthn credentials fetched successfully', {
      userId: user.id,
      credentialCount: credentials?.length || 0
    });

  const normalized = (credentials ?? []).map((credential) => ({
    ...credential,
    device_info: credential.metadata ?? null,
  }));

  return successResponse({
    credentials: normalized
  });
});
