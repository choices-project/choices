import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, authError, errorResponse, validationError } from '@/lib/api';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

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
        device_info,
        last_used_at,
        created_at,
        backup_eligible,
        backed_up,
        transports
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

  return successResponse({
    credentials: credentials || []
  });
});

export const DELETE2 = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return authError('Authentication required');
  }

  const url = new URL(request.url);
  const credentialId = url.searchParams.get('id');

  if (!credentialId) {
    return validationError({ credentialId: 'Credential ID is required' });
  }

    // Delete the credential
    const { error: deleteError } = await supabase
      .from('webauthn_credentials')
      .delete()
      .eq('id', credentialId)
      .eq('user_id', user.id); // Ensure user can only delete their own credentials

    if (deleteError) {
      logger.error('Failed to delete WebAuthn credential:', deleteError);
      return errorResponse('Failed to delete credential', 500, undefined, 'WEBAUTHN_CREDENTIAL_DELETE_FAILED');
    }

    logger.info('WebAuthn credential deleted successfully', {
      userId: user.id,
      credentialId
    });

  return successResponse({
    message: 'Credential deleted successfully'
  });
});
