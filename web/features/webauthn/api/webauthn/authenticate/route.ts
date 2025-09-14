import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { devLog } from '@/lib/logger';
import crypto from 'crypto';

export const dynamic = 'force-dynamic'

// POST - Handle WebAuthn authentication (both getting options and verifying)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // If credential is provided, this is a verification request
    if (body.credential) {
      return await verifyCredential(body)
    }
    
    // Otherwise, this is a request for authentication options
    return await getAuthenticationOptions(body)
    
  } catch (error) {
    devLog('WebAuthn authentication error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getAuthenticationOptions(body: any) {
  try {
    const supabase = getSupabaseServerClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    const supabaseClient = await supabase

    // Get available credentials for this domain
    const { data: credentials, error } = await supabaseClient
      .from('webauthn_credentials')
      .select('credential_id, transports')
      .eq('rp_id', body.rpId || 'localhost')

    if (error) {
      devLog('Error getting credentials for authentication options:', error)
      return NextResponse.json(
        { error: 'Failed to get authentication options' },
        { status: 500 }
      )
    }

    // Generate a random challenge
    const challenge = crypto.randomBytes(32)
    const challengeBase64 = challenge.toString('base64')

    // Format allowCredentials
    const allowCredentials = (credentials || []).map((cred: any) => ({
      id: cred.credential_id,
      type: 'public-key',
      transports: cred.transports || ['internal']
    }))

    const authOptions = {
      challenge: challengeBase64,
      rpId: body.rpId || 'localhost',
      allowCredentials: allowCredentials,
      userVerification: 'preferred',
      timeout: 60000
    }

    // Store challenge in session for verification
    // In a real implementation, you'd store this in a session or cache
    // For now, we'll return it and verify it in the same request

    return NextResponse.json({
      success: true,
      ...authOptions
    })

  } catch (error) {
    devLog('Error getting authentication options:', error)
    return NextResponse.json(
      { error: 'Failed to get authentication options' },
      { status: 500 }
    )
  }
}

async function verifyCredential(body: any) {
  try {
    const { credential, challenge } = body

    if (!credential || !challenge) {
      return NextResponse.json(
        { error: 'Missing credential or challenge' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServerClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }

    const supabaseClient = await supabase

    // Find the credential in the database
    const { data: storedCredential, error } = await supabaseClient
      .from('webauthn_credentials')
      .select('id, user_id, public_key, counter')
      .eq('credential_id', credential.id)
      .single()

    if (error || !storedCredential) {
      devLog('Credential not found for verification:', credential.id)
      return NextResponse.json(
        { error: 'Invalid credential' },
        { status: 401 }
      )
    }

    // TODO: Implement proper WebAuthn signature verification
    // This would involve:
    // 1. Verifying the challenge matches
    // 2. Verifying the signature using the stored public key
    // 3. Checking the authenticator data
    // 4. Verifying the counter hasn't been reused
    
    // For now, we'll do a basic verification and assume it's valid
    // In production, you MUST implement proper signature verification

    // Update the credential counter
    await supabaseClient
      .from('webauthn_credentials')
      .update({ 
        counter: (storedCredential.counter || 0) + 1,
        last_used: new Date().toISOString()
      })
      .eq('id', storedCredential.id)

    // Get user data
    const { data: user, error: userError } = await supabaseClient
      .from('ia_users')
      .select('stable_id, email')
      .eq('stable_id', storedCredential.user_id)
      .single()

    if (userError || !user) {
      devLog('User not found for verified credential:', storedCredential.user_id)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Create session token
    const sessionToken = {
      userId: user.stable_id,
      email: user.email,
      authMethod: 'biometric',
      issuedAt: new Date().toISOString()
    }

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Biometric authentication successful',
      user: {
        id: user.stable_id,
        email: user.email
      }
    })

    response.cookies.set('choices_session', JSON.stringify(sessionToken), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    devLog('Biometric authentication successful for user:', user.stable_id)

    return response

  } catch (error) {
    devLog('Error verifying credential:', error)
    return NextResponse.json(
      { error: 'Failed to verify credential' },
      { status: 500 }
    )
  }
}
