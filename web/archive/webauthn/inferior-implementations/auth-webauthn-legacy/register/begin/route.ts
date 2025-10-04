// WebAuthn Registration Begin API
// Generates registration options and stores challenge for verification
// Created: October 2, 2025

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, displayName, email } = body;

    if (!username && !email) {
      return NextResponse.json(
        { error: 'Username or email is required' },
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

    // Check if user already exists (for existing users adding passkey)
    let existingUser = null;
    if (email) {
      const { data: user } = await supabase
        .from('user_profiles')
        .select('user_id, username, email')
        .eq('email', email)
        .single();
      existingUser = user;
    }

    // Generate challenge and user handle
    const challenge = crypto.randomBytes(32);
    const challengeBase64 = challenge.toString('base64');
    
    const userHandle = crypto.randomBytes(16);
    const userHandleBase64 = userHandle.toString('base64');

    // Store challenge for verification
    const challengeData = {
      challenge: challenge,
      user_id: existingUser?.user_id || null, // Will be set after user creation
      rp_id: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('http://', '') || 'localhost',
      kind: 'registration',
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      origin: request.headers.get('origin') || 'localhost'
    };

    const { error: challengeError } = await supabase
      .from('webauthn_challenges')
      .insert(challengeData);

    if (challengeError) {
      logger.error('Failed to store WebAuthn challenge:', challengeError);
      return NextResponse.json(
        { error: 'Failed to initialize registration' },
        { status: 500 }
      );
    }

    // Generate registration options
    const registrationOptions = {
      challenge: challengeBase64,
      rp: {
        name: 'Choices Platform',
        id: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('http://', '') || 'localhost'
      },
      user: {
        id: userHandleBase64,
        name: username || email,
        displayName: displayName || username || email
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' } // RS256
      ],
      timeout: 60000,
      attestation: 'direct',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
        requireResidentKey: false
      },
      excludeCredentials: [] // No existing credentials to exclude for new registration
    };

    logger.info('WebAuthn registration options generated', { 
      username: username || email,
      hasExistingUser: !!existingUser 
    });

    return NextResponse.json({
      success: true,
      ...registrationOptions,
      // Include metadata for client
      metadata: {
        hasExistingUser: !!existingUser,
        userId: existingUser?.user_id || null
      }
    });

  } catch (error) {
    logger.error('WebAuthn registration begin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
