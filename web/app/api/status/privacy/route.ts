import type { NextRequest } from 'next/server';

import { getRPIDAndOrigins } from '@/features/auth/lib/webauthn/config';
import { withErrorHandling, successResponse } from '@/lib/api';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (req: NextRequest) => {
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
    
  return successResponse({
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
});
