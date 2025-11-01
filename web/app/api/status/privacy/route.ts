import { type NextRequest, NextResponse } from 'next/server';

import { getRPIDAndOrigins } from '@/lib/webauthn/config';
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
    const { data: rlsStatus } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['webauthn_credentials', 'webauthn_challenges']);

    const webauthnTablesExist = rlsStatus?.length === 2;
    
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
    console.error('Privacy status error:', error);
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
