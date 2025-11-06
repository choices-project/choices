import type { NextRequest } from 'next/server';

import { withErrorHandling, successResponse, authError, errorResponse, validationError } from '@/lib/api';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

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

    // Delete the credential
    const { error: deleteError } = await supabase
      .from('webauthn_credentials')
      .delete()
      .eq('id', credentialId)
      .eq('user_id', user.id); // Ensure user can only delete their own credentials

  if (deleteError) {
    logger.error('Failed to delete WebAuthn credential:', deleteError);
    return errorResponse('Failed to delete credential', 500);
  }

  logger.info('WebAuthn credential deleted successfully', { 
    userId: user.id, 
    credentialId 
  });

  return successResponse({
    message: 'Credential deleted successfully'
  });
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const credentialId = id;
    
    if (!credentialId) {
      return NextResponse.json(
        { error: 'Credential ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { device_label } = body;

    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update the credential
    const { error: updateError } = await supabase
      .from('webauthn_credentials')
      .update({ device_label })
      .eq('id', credentialId)
      .eq('user_id', user.id); // Ensure user can only update their own credentials

    if (updateError) {
      logger.error('Failed to update WebAuthn credential:', updateError);
      return NextResponse.json(
        { error: 'Failed to update credential' },
        { status: 500 }
      );
    }

    logger.info('WebAuthn credential updated successfully', { 
      userId: user.id, 
      credentialId,
      device_label 
    });

    return NextResponse.json({
      success: true,
      message: 'Credential updated successfully'
    });

  } catch (error) {
    logger.error('WebAuthn credential update error:', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
