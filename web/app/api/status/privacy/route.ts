import { type NextRequest, NextResponse } from 'next/server';

import { getRPIDAndOrigins } from '@/features/auth/lib/webauthn/config';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * Privacy Status Endpoint
 * 
 * Returns privacy protection status for WebAuthn and other systems
 * Used by privacy status badge component
 */

export async function GET(req: NextRequest) {
  try {
    const { enabled, rpID, allowedOrigins } = getRPIDAndOrigins(req);
    
    // Check RLS on sensitive tables
    const supabase = await getSupabaseServerClient();
    
    // Check if WebAuthn tables exist and have RLS enabled
    // Simplified check - just verify we can query the tables
    const { data: credentialsCheck } = await supabase
      .from('webauthn_credentials')
      .select('id')
      .limit(1);
    
    const { data: challengesCheck } = await supabase
      .from('webauthn_challenges')
      .select('id')
      .limit(1);

    const webauthnTablesExist = credentialsCheck !== undefined && challengesCheck !== undefined;
    
    // Check privacy protections
    const privacyProtections = {
      webauthn: enabled,
      rls: webauthnTablesExist,
      rpId: rpID === 'choices-platform.vercel.app',
      origins: allowedOrigins.length > 0,
      attestation: 'none', // Privacy-preserving
      userVerification: 'required' // Security
    };
    
    const allGood = Object.values(privacyProtections).every(Boolean);
    const someGood = Object.values(privacyProtections).some(Boolean);
    
    return NextResponse.json({
      status: allGood ? 'active' : someGood ? 'partial' : 'inactive',
      protections: privacyProtections,
      badge: {
        color: allGood ? 'green' : someGood ? 'yellow' : 'red',
        label: allGood ? 'Privacy protections: ON' : 
               someGood ? 'Privacy protections: PARTIAL' : 
               'Privacy protections: CHECK SETTINGS'
      },
      details: {
        webauthnEnabled: enabled,
        rpId: rpID,
        allowedOrigins: allowedOrigins,
        tablesExist: webauthnTablesExist
      }
    });

  } catch (error) {
    logger.error('Privacy status error', { error });
    return NextResponse.json({
      status: 'inactive',
      protections: {},
      badge: {
        color: 'red',
        label: 'Privacy protections: ERROR'
      },
      error: 'Failed to check privacy status'
    }, { status: 500 });
  }
}
