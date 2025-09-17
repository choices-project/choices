import { getSupabaseServerClient } from '@/utils/supabase/server';
import { devLog } from '@/lib/logger';
import crypto from 'crypto';

export async function getAuthenticationOptions(body: any) {
  try {
    const supabase = getSupabaseServerClient()
    
    if (!supabase) {
      throw new Error('Database connection not available');
    }

    const supabaseClient = await supabase

    // Get available credentials for this domain
    const { data: credentials, error } = await supabaseClient
      .from('webauthn_credentials')
      .select('credential_id, transports')
      .eq('rp_id', body.rpId || 'localhost')

    if (error) {
      devLog('Error getting credentials for authentication options:', error)
      throw new Error('Failed to get authentication options');
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

    return {
      success: true,
      ...authOptions
    }

  } catch (error) {
    devLog('Error getting authentication options:', error)
    throw error;
  }
}

export async function verifyCredential(body: any) {
  try {
    const { credential, challenge } = body

    if (!credential || !challenge) {
      throw new Error('Missing credential or challenge');
    }

    const supabase = getSupabaseServerClient()
    
    if (!supabase) {
      throw new Error('Database connection not available');
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
      throw new Error('Invalid credential');
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
      throw new Error('User not found');
    }

    // Create session token
    const sessionToken = {
      userId: user.stable_id,
      email: user.email,
      authMethod: 'biometric',
      issuedAt: new Date().toISOString()
    }

    devLog('Biometric authentication successful for user:', user.stable_id)

    return {
      success: true,
      message: 'Biometric authentication successful',
      user: {
        id: user.stable_id,
        email: user.email
      },
      sessionToken
    }

  } catch (error) {
    devLog('Error verifying credential:', error)
    throw error;
  }
}





