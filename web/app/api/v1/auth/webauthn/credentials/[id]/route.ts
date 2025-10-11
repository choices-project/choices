// WebAuthn Individual Credential Management API
// Manages individual WebAuthn credentials (delete, update)
// Created: October 2, 2025

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const credentialId = params.id;
    
    if (!credentialId) {
      return NextResponse.json(
        { error: 'Credential ID is required' },
        { status: 400 }
      );
    }

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

    // Delete the credential
    const { error: deleteError } = await supabase
      .from('webauthn_credentials')
      .delete()
      .eq('id', credentialId)
      .eq('user_id', user.id); // Ensure user can only delete their own credentials

    if (deleteError) {
      logger.error('Failed to delete WebAuthn credential:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete credential' },
        { status: 500 }
      );
    }

    logger.info('WebAuthn credential deleted successfully', { 
      userId: user.id, 
      credentialId 
    });

    return NextResponse.json({
      success: true,
      message: 'Credential deleted successfully'
    });

  } catch (error) {
    logger.error('WebAuthn credential deletion error:', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const credentialId = params.id;
    
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
