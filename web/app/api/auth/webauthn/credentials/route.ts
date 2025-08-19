import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { devLog } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// GET - List user's biometric credentials
export async function GET(request: NextRequest) {
  try {
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

    // Get user's biometric credentials
    const { data: credentials, error: credentialsError } = await supabase
      .from('biometric_credentials')
      .select(`
        id,
        credential_id,
        device_type,
        authenticator_type,
        sign_count,
        backup_eligible,
        backup_state,
        user_agent,
        created_at,
        last_used_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (credentialsError) {
      devLog('Error getting credentials:', credentialsError)
      return NextResponse.json(
        { error: 'Failed to get credentials' },
        { status: 500 }
      )
    }

    // Format credentials for response
    const formattedCredentials = credentials?.map(cred => ({
      id: cred.id,
      credentialId: cred.credential_id,
      deviceType: cred.device_type,
      authenticatorType: cred.authenticator_type,
      signCount: cred.sign_count || 0,
      backupEligible: cred.backup_eligible,
      backupState: cred.backup_state,
      userAgent: cred.user_agent,
      createdAt: cred.created_at,
      lastUsedAt: cred.last_used_at
    })) || []

    devLog('Retrieved credentials for user:', user.id, 'Count:', formattedCredentials.length)

    return NextResponse.json({
      success: true,
      credentials: formattedCredentials
    })

  } catch (error) {
    devLog('Error getting biometric credentials:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a biometric credential
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { credentialId } = body

    if (!credentialId) {
      return NextResponse.json(
        { error: 'Missing credentialId' },
        { status: 400 }
      )
    }

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

    // Verify the credential belongs to the user
    const { data: credentialData, error: credentialError } = await supabase
      .from('biometric_credentials')
      .select('id, user_id')
      .eq('credential_id', credentialId)
      .single()

    if (credentialError || !credentialData) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      )
    }

    if (credentialData.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Delete the credential
    const { error: deleteError } = await supabase
      .from('biometric_credentials')
      .delete()
      .eq('credential_id', credentialId)

    if (deleteError) {
      devLog('Error deleting credential:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete credential' },
        { status: 500 }
      )
    }

    devLog('Deleted biometric credential:', credentialId, 'for user:', user.id)

    return NextResponse.json({
      success: true,
      message: 'Credential deleted successfully'
    })

  } catch (error) {
    devLog('Error deleting biometric credential:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
