import { getSupabaseServerClient } from '@/utils/supabase/server';

import { withErrorHandling, successResponse, authError, errorResponse, validationError } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

import type { NextRequest } from 'next/server';



export const dynamic = 'force-dynamic';

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const credentialId = id;

  if (!credentialId) {
    return validationError({ credentialId: 'Credential ID is required' });
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return authError('Authentication required');
  }

  // Extract security context for logging
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ?? request.headers.get('x-real-ip') ?? 'unknown';
  const userAgent = request.headers.get('user-agent') ?? 'unknown';

    // Delete the credential
    const { error: deleteError } = await supabase
      .from('webauthn_credentials')
      .delete()
      .eq('id', credentialId)
      .eq('user_id', user.id); // Ensure user can only delete their own credentials

  if (deleteError) {
    logger.error('Failed to delete WebAuthn credential:', deleteError, {
      userId: user.id,
      credentialId,
      ipAddress,
      userAgent,
    });
    return errorResponse('Failed to delete credential', 500, undefined, 'WEBAUTHN_CREDENTIAL_DELETE_FAILED');
  }

  logger.info('WebAuthn credential deleted successfully', {
    userId: user.id,
    credentialId,
    ipAddress,
    userAgent,
  });

  return successResponse({
    message: 'Credential deleted successfully'
  });
});

export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
    const { id } = await params;
    const credentialId = id;

    if (!credentialId) {
      return validationError({ credentialId: 'Credential ID is required' });
    }

    const body = await request.json();
    const { device_label } = body;

    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return errorResponse('Database connection not available', 500);
    }

    // Get authenticated user
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return authError('Authentication required');
    }

    // Update the credential
    const { error: updateError } = await supabase
      .from('webauthn_credentials')
      .update({ device_label })
      .eq('id', credentialId)
      .eq('user_id', user.id); // Ensure user can only update their own credentials

    if (updateError) {
      logger.error('Failed to update WebAuthn credential:', updateError);
      return errorResponse('Failed to update credential', 500, undefined, 'WEBAUTHN_CREDENTIAL_UPDATE_FAILED');
    }

    logger.info('WebAuthn credential updated successfully', {
      userId: user.id,
      credentialId,
      device_label
    });

    return successResponse({
      message: 'Credential updated successfully'
    });
});
