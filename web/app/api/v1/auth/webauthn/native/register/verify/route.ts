/**
 * Native WebAuthn Registration Verification
 * 
 * Verifies registration response using native WebAuthn implementation
 * This is the CORRECT implementation - uses native Web Crypto API
 * 
 * Created: November 5, 2025
 * Status: ✅ Production-ready (Native implementation)
 */

import { type NextRequest, NextResponse } from 'next/server';

import { getRPIDAndOrigins } from '@/features/auth/lib/webauthn/config';
import { verifyRegistrationResponse } from '@/features/auth/lib/webauthn/native/server';
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
      .eq('kind', 'registration')
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

    // Verify registration using native implementation
    const verificationResult = await verifyRegistrationResponse(
      body,
      chal.challenge,
      currentOrigin,
      rpID
    );

    if (!verificationResult.verified) {
      return NextResponse.json({ 
        error: 'Verification failed', 
        details: verificationResult.error 
      }, { status: 400 });
    }

    // Use credential data from verification result
    const credentialId = verificationResult.credentialId;
    const publicKey = verificationResult.publicKey;

    // Convert ArrayBuffer to base64 for storage
    const publicKeyBase64 = Buffer.from(publicKey).toString('base64');

    // Store credential
    const { error: credErr } = await supabase.from('webauthn_credentials').insert({
      user_id: user.id,
      rp_id: rpID,
      credential_id: credentialId,
      public_key: publicKeyBase64,
      counter: verificationResult.counter,
      transports: verificationResult.transports || [],
      backup_eligible: verificationResult.backupEligible || false,
      backup_state: verificationResult.backupState || false,
      created_at: new Date().toISOString()
    });

    if (credErr) {
      logger.error('Failed to store credential', { error: credErr });
      return NextResponse.json({ error: 'Failed to store credential' }, { status: 500 });
    }

    // Mark challenge as used
    if (chal) {
      await supabase
        .from('webauthn_challenges')
        .update({ used_at: new Date().toISOString() })
        .eq('id', chal.id);
    }

    logger.info('WebAuthn registration verified (native)', { userId: user.id });

    return NextResponse.json({
      verified: true,
      credential: {
        id: credentialId,
        publicKey: publicKeyBase64
      }
    });

  } catch (error) {
    logger.error('Native registration verify error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

