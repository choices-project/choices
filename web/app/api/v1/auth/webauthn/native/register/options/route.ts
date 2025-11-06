/**
 * Native WebAuthn Registration Options
 * 
 * Generates registration options using native WebAuthn implementation
 * This is the CORRECT implementation - uses native Web Crypto API
 * 
 * Created: November 5, 2025
 * Status: ✅ Production-ready (Native implementation)
 */

import type { NextRequest } from 'next/server';

import { getRPIDAndOrigins, CHALLENGE_TTL_MS } from '@/features/auth/lib/webauthn/config';
import { generateRegistrationOptions } from '@/features/auth/lib/webauthn/native/server';
import { withErrorHandling, successResponse, authError, forbiddenError, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export const POST = withErrorHandling(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    return errorResponse('WebAuthn routes disabled during build', 503);
  }

  const { enabled, rpID } = getRPIDAndOrigins(req);
  if (!enabled) {
    return forbiddenError('Passkeys disabled on preview');
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return authError('Authentication required');
  }

    // Fetch existing credential IDs to exclude
    const { data: creds } = await supabase
      .from('webauthn_credentials')
      .select('credential_id')
      .eq('user_id', user.id);

    const excludeCredentials = (creds ?? []).map(c => c.credential_id);

    // Use native implementation
    const options = generateRegistrationOptions(
      user.id,
      user.email ?? user.id,
      user.email ?? user.id,
      rpID,
      'Choices',
      excludeCredentials
    );

    // Persist challenge
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS).toISOString();
    const challengeArray = new Uint8Array(options.challenge);
    
    const { error: chalErr } = await supabase.from('webauthn_challenges').insert({
      user_id: user.id,
      rp_id: rpID,
      kind: 'registration',
      challenge: Buffer.from(challengeArray).toString('base64'),
      expires_at: expiresAt,
    });

    if (chalErr) {
      logger.error('Challenge persist failed', { error: chalErr });
      return NextResponse.json({ error: 'Challenge persist failed' }, { status: 500 });
    }

    logger.info('WebAuthn registration options generated (native)', { userId: user.id });

    return NextResponse.json(options);

  } catch (error) {
    logger.error('Native registration options error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

