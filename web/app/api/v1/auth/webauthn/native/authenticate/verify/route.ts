/**
 * Native WebAuthn Authentication Verification
 * 
 * Verifies authentication response using native WebAuthn implementation
 * This is the CORRECT implementation - uses native Web Crypto API
 * 
 * Created: November 5, 2025
 * Status: ✅ Production-ready (Native implementation)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getRPIDAndOrigins } from '@/features/auth/lib/webauthn/config';
import { verifyAuthenticationResponse } from '@/features/auth/lib/webauthn/native/server';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Disable during build time
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      return NextResponse.json({ error: 'WebAuthn routes disabled during build' }, { status: 503 });
    }

    const { enabled, rpID, allowedOrigins } = getRPIDAndOrigins(req);
    if (!enabled) {
      return NextResponse.json({ error: 'Passkeys disabled on preview' }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Get challenge from database
    const { data: chalRows } = await supabase
      .from('webauthn_challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('kind', 'authentication')
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!chalRows?.length) {
      return NextResponse.json({ error: 'No challenge found' }, { status: 400 });
    }

    const chal = chalRows[0];
    if (!chal) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 400 });
    }

    // Check challenge expiry
    if (new Date(chal.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Challenge expired' }, { status: 400 });
    }

    // Get current request origin
    const origin = req.headers.get('origin') ?? req.headers.get('referer') ?? '';
    const currentOrigin = origin.replace(/\/$/, '');

    // SECURITY: Validate origin against allowed origins
    if (currentOrigin && !allowedOrigins.includes(currentOrigin)) {
      logger.warn('WebAuthn authentication attempt from unauthorized origin', {
        origin: currentOrigin,
        allowedOrigins,
        userId: user.id
      });
      return NextResponse.json({ error: 'Unauthorized origin' }, { status: 403 });
    }

    // Lookup credential
    const credIdBuf = Buffer.from(body.id, 'base64url');
    const { data: creds, error: credsErr } = await supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('rp_id', rpID)
      .eq('credential_id', Buffer.from(credIdBuf).toString('base64'))
      .limit(1);

    if (credsErr || !creds?.length) {
      return NextResponse.json({ error: 'Unknown credential' }, { status: 400 });
    }

    const cred = creds[0];
    if (!cred) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 400 });
    }

    // Verify authentication using native implementation
    const verificationResult = await verifyAuthenticationResponse(
      body,
      chal.challenge,
      currentOrigin,
      rpID,
      {
        id: cred.id,
        credentialId: cred.credential_id,
        publicKey: cred.public_key,
        counter: Number(cred.counter),
        userId: cred.user_id,
        rpId: cred.rp_id ?? rpID,
        createdAt: new Date(cred.created_at ?? Date.now()),
        userHandle: cred.user_id
      }
    );

    if (!verificationResult.verified) {
      return NextResponse.json({ 
        error: 'Verification failed', 
        details: verificationResult.error 
      }, { status: 400 });
    }

    const newCounter = verificationResult.newCounter ?? 0;

    // Security check: Counter should never decrease
    if (newCounter < Number(cred.counter)) {
      logger.warn('Suspicious counter decrease detected', {
        credentialId: cred.id,
        oldCounter: cred.counter,
        newCounter
      });
      return NextResponse.json({ error: 'Counter anomaly detected' }, { status: 400 });
    }

    // Update counter
    await supabase
      .from('webauthn_credentials')
      .update({ counter: newCounter })
      .eq('id', cred.id);

    // Mark challenge as used
    await supabase
      .from('webauthn_challenges')
      .update({ used_at: new Date().toISOString() })
      .eq('id', chal.id);

    logger.info('WebAuthn authentication verified (native)', { userId: user.id });

    return NextResponse.json({
      verified: true,
      credential: {
        id: cred.credential_id,
        counter: newCounter
      }
    });

  } catch (error) {
    logger.error('Native authentication verify error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

