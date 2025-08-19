import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { devLog } from '@/lib/logger'
import { arrayBufferToBase64, base64ToArrayBuffer } from '@/lib/webauthn'

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, credential } = body

    // Get Supabase client
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    // If this is a challenge request (first step)
    if (!credential) {
      if (!username) {
        return NextResponse.json(
          { error: 'Missing username' },
          { status: 400 }
        )
      }

      // Get user by username/email
      const { data: userData, error: userError } = await supabase
        .from('ia_users')
        .select('id, email')
        .eq('email', username.toLowerCase())
        .single()

      if (userError || !userData) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Get user's biometric credentials
      const { data: credentials, error: credentialsError } = await supabase
        .from('biometric_credentials')
        .select('credential_id, device_type, authenticator_type')
        .eq('user_id', userData.id)

      if (credentialsError) {
        devLog('Error getting credentials:', credentialsError)
        return NextResponse.json(
          { error: 'Failed to get credentials' },
          { status: 500 }
        )
      }

      if (!credentials || credentials.length === 0) {
        return NextResponse.json(
          { error: 'No biometric credentials found' },
          { status: 404 }
        )
      }

      // Generate challenge
      const challenge = generateChallenge()

      // Store challenge in database
      const { error: challengeError } = await supabase
        .from('webauthn_challenges')
        .insert({
          user_id: userData.id,
          challenge: challenge,
          challenge_type: 'authentication',
          expires_at: new Date(Date.now() + WEBAUTHN_CONFIG.timeout).toISOString()
        })

      if (challengeError) {
        devLog('Error storing challenge:', challengeError)
        return NextResponse.json(
          { error: 'Failed to create challenge' },
          { status: 500 }
        )
      }

      devLog('Authentication challenge created for user:', username)

      return NextResponse.json({
        challenge: challenge,
        allowCredentials: credentials.map(cred => ({
          id: cred.credential_id,
          type: 'public-key',
          transports: ['internal']
        }))
      })
    }

    // If this is a credential authentication (second step)
    if (credential) {
      // Get the credential from database
      const { data: credentialData, error: credentialError } = await supabase
        .from('biometric_credentials')
        .select('user_id, credential_id, sign_count')
        .eq('credential_id', credential.id)
        .single()

      if (credentialError || !credentialData) {
        return NextResponse.json(
          { error: 'Invalid credential' },
          { status: 400 }
        )
      }

      // Verify challenge exists and is valid
      const { data: challengeData, error: challengeError } = await supabase
        .from('webauthn_challenges')
        .select('*')
        .eq('user_id', credentialData.user_id)
        .eq('challenge_type', 'authentication')
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

      // Update sign count
      const newSignCount = (credentialData.sign_count || 0) + 1
      await supabase
        .from('biometric_credentials')
        .update({ 
          sign_count: newSignCount,
          last_used_at: new Date().toISOString()
        })
        .eq('credential_id', credential.id)

      // Clean up the challenge
      await supabase
        .from('webauthn_challenges')
        .delete()
        .eq('id', challengeData.id)

      // Log the authentication
      await supabase.rpc('log_biometric_auth', {
        p_user_id: credentialData.user_id,
        p_credential_id: credential.id,
        p_result: true,
        p_ip_address: deviceInfo.ipAddress,
        p_user_agent: deviceInfo.userAgent,
        p_device_info: deviceInfo,
        p_location_info: null
      })

      // Get user data
      const { data: userData } = await supabase
        .from('ia_users')
        .select('id, email, verification_tier')
        .eq('id', credentialData.user_id)
        .single()

      devLog('Biometric authentication successful for user:', userData?.email)

      return NextResponse.json({
        success: true,
        message: 'Biometric authentication successful',
        user: {
          id: userData?.id,
          email: userData?.email,
          verificationTier: userData?.verification_tier
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )

  } catch (error) {
    devLog('Error in WebAuthn authentication:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
