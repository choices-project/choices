import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { devLog } from '@/lib/logger';
import { arrayBufferToBase64, base64ToArrayBuffer } from '@/lib/webauthn';

export const dynamic = 'force-dynamic'

// WebAuthn configuration
const WEBAUTHN_CONFIG = {
  rpName: 'Choices Platform',
  rpId: process.env.NEXT_PUBLIC_VERCEL_URL ? 
    process.env.NEXT_PUBLIC_VERCEL_URL.replace('https://', '') : 
    'choices-platform.vercel.app',
  timeout: 60000,
  challengeLength: 32
}

// Generate random challenge
function generateChallenge(): string {
  const challenge = crypto.getRandomValues(new Uint8Array(WEBAUTHN_CONFIG.challengeLength))
  return arrayBufferToBase64(challenge.buffer)
}

// Generate random user ID
function generateUserId(): string {
  const userId = crypto.getRandomValues(new Uint8Array(16))
  return arrayBufferToBase64(userId.buffer)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, username, credential } = body

    // Get Supabase client
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // If this is a challenge request (first step)
    if (!credential) {
      if (!userId || !username) {
        return NextResponse.json(
          { error: 'Missing userId or username' },
          { status: 400 }
        )
      }

      // Verify user owns this account
      if (user.id !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }

      // Generate challenge and user ID
      const challenge = generateChallenge()
      const newUserId = generateUserId()

      // Store challenge in database
      const { error: challengeError } = await supabase
        .from('webauthn_challenges')
        .insert({
          user_id: user.id,
          challenge: challenge,
          challenge_type: 'registration',
          expires_at: new Date(Date.now() + WEBAUTHN_CONFIG.timeout).toISOString()
        })

      if (challengeError) {
        devLog('Error storing challenge:', challengeError)
        return NextResponse.json(
          { error: 'Failed to create challenge' },
          { status: 500 }
        )
      }

      devLog('Registration challenge created for user:', username)

      return NextResponse.json({
        challenge: challenge,
        userId: newUserId,
        rp: {
          name: WEBAUTHN_CONFIG.rpName,
          id: WEBAUTHN_CONFIG.rpId
        }
      })
    }

    // If this is a credential registration (second step)
    if (credential) {
      // Verify challenge exists and is valid
      const { data: challengeData, error: challengeError } = await supabase
        .from('webauthn_challenges')
        .select('id, user_id, challenge, challenge_type, expires_at, created_at')
        .eq('user_id', user.id)
        .eq('challenge_type', 'registration')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (challengeError || !challengeData) {
        return NextResponse.json(
          { error: 'Invalid or expired challenge' },
          { status: 400 }
        )
      }

      // Verify the challenge matches
      if (credential.response?.clientDataJSON) {
        const clientData = JSON.parse(
          Buffer.from(base64ToArrayBuffer(credential.response.clientDataJSON)).toString('utf-8')
        )
        
        if (clientData.challenge !== challengeData.challenge) {
          return NextResponse.json(
            { error: 'Challenge mismatch' },
            { status: 400 }
          )
        }
      }

      // Extract device information
      const deviceInfo = {
        userAgent: request.headers.get('user-agent') || 'unknown',
        ipAddress: request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        timestamp: new Date().toISOString()
      }

      // Determine authenticator type
      let authenticatorType = 'unknown'
      if (request.headers.get('user-agent')?.includes('iPhone') || 
          request.headers.get('user-agent')?.includes('iPad')) {
        authenticatorType = 'face'
      } else if (request.headers.get('user-agent')?.includes('Android')) {
        authenticatorType = 'fingerprint'
      } else {
        authenticatorType = 'fingerprint' // Default
      }

      // Store the credential
      const { data: _credentialData, error: credentialError } = await supabase
        .from('biometric_credentials')
        .insert({
          user_id: user.id,
          credential_id: credential.id,
          public_key: credential.response?.attestationObject || '',
          device_type: 'platform',
          authenticator_type: authenticatorType,
          user_agent: deviceInfo.userAgent
        })
        .select()
        .single()

      if (credentialError) {
        devLog('Error storing credential:', credentialError)
        return NextResponse.json(
          { error: 'Failed to store credential' },
          { status: 500 }
        )
      }

      // Clean up the challenge
      await supabase
        .from('webauthn_challenges')
        .delete()
        .eq('id', challengeData.id)

      // Log the registration
      await supabase.rpc('log_biometric_auth', {
        p_user_id: user.id,
        p_credential_id: credential.id,
        p_result: true,
        p_ip_address: deviceInfo.ipAddress,
        p_user_agent: deviceInfo.userAgent,
        p_device_info: deviceInfo,
        p_location_info: null
      })

      devLog('Biometric credential registered successfully for user:', user.id)

      return NextResponse.json({
        success: true,
        message: 'Biometric credential registered successfully',
        credentialId: credential.id
      })
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )

  } catch (error) {
    devLog('Error in WebAuthn registration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
