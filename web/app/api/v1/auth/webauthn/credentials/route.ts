// WebAuthn Credentials Management API
// Lists and manages user WebAuthn credentials
// Created: October 2, 2025

import { type NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Always require real authentication - no E2E bypasses for security

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: 'Failed to fetch credentials' },
        { status: 500 }
      );
    }

    logger.info('WebAuthn credentials fetched successfully', { 
      userId: user.id, 
      credentialCount: credentials?.length || 0 
    });

    return NextResponse.json({
      success: true,
      credentials: credentials || []
    });

  } catch (error) {
    logger.error('WebAuthn credentials endpoint error:', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
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

    const url = new URL(request.url);
    const credentialId = url.searchParams.get('id');
    
    if (!credentialId) {
      return NextResponse.json(
        { error: 'Credential ID is required' },
        { status: 400 }
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
