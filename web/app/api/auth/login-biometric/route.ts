import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Get the request body
    const body = await request.json()
    const { credentialId, authenticatorData, clientDataJSON, signature } = body

    if (!credentialId || !authenticatorData || !clientDataJSON || !signature) {
      return NextResponse.json(
        { error: 'Missing required biometric authentication data' },
        { status: 400 }
      )
    }

    // Verify the biometric credential
    const { data: credential, error: credentialError } = await supabase
      .from('biometric_credentials')
      .select('user_id, public_key, counter')
      .eq('credential_id', credentialId)
      .single()

    if (credentialError || !credential) {
      logger.error('Biometric credential not found:', credentialError)
      return NextResponse.json(
        { error: 'Biometric credential not found' },
        { status: 401 }
      )
    }

    // TODO: Implement proper WebAuthn verification
    // For now, we'll do a basic check and return success
    // In production, you would verify the signature against the public key

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('ia_users')
      .select('id, username, email, role')
      .eq('id', credential.user_id)
      .single()

    if (userError || !user) {
      logger.error('User not found:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Update credential counter
    await supabase
      .from('biometric_credentials')
      .update({ 
        last_used: new Date().toISOString(),
        counter: credential.counter + 1
      })
      .eq('credential_id', credentialId)

    // Create session token
    const sessionToken = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      authMethod: 'biometric',
      issuedAt: new Date().toISOString()
    }

    // Set session cookie
    const response = NextResponse.json(
      { 
        success: true, 
        message: 'Biometric authentication successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      },
      { status: 200 }
    )

    // Set secure session cookie
    response.cookies.set('session_token', JSON.stringify(sessionToken), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    return response

  } catch (error) {
    logger.error('Biometric login error:', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Internal server error during biometric authentication' },
      { status: 500 }
    )
  }
}
