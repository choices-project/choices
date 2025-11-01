// NextRequest import removed - not used
import { NextResponse } from 'next/server';

import { handleError, getUserMessage, getHttpStatus, AuthenticationError } from '@/lib/error-handler';
import { devLog } from '@/lib/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = getSupabaseServerClient()
    
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    const supabaseClient = await supabase

    // Get current authenticated user from Supabase Auth
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      throw new AuthenticationError('User not authenticated')
    }

    devLog('Syncing user:', {
      id: user.id,
      email: user.email,
      email_confirmed: user.email_confirmed_at
    })

    // Check if user already exists in ia_users table
    const { data: existingUser, error: checkError } = await supabaseClient
      .from('ia_users')
      .select('id, stable_id, email, verification_tier, is_active')
      .eq('stable_id', String(user.id) as any)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      devLog('Error checking existing user:', checkError)
      throw new Error('Database error')
    }

    if (existingUser && !('error' in existingUser)) {
      devLog('User already exists in ia_users table')
      return NextResponse.json({
        success: true,
        message: 'User already synced',
        user: {
          id: existingUser.id,
          stable_id: existingUser.stable_id,
          email: existingUser.email,
          verification_tier: existingUser.verification_tier,
          is_active: existingUser.is_active
        }
      })
    }

    // Create user in ia_users table
    const { data: newUser, error: createError } = await supabaseClient
      .from('ia_users')
      .insert({
        stable_id: user.id,
        email: user.email,
        verification_tier: 'T0',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any)
      .select()
      .single()

    if (createError) {
      devLog('Error creating user in ia_users:', createError)
      throw new Error('Failed to create user record')
    }

    devLog('Successfully created user in ia_users table:', newUser)

    return NextResponse.json({
      success: true,
      message: 'User synced successfully',
      user: {
        id: (newUser).id,
        stable_id: (newUser).stable_id,
        email: (newUser).email,
        verification_tier: (newUser).verification_tier,
        is_active: (newUser).is_active
      }
    })

  } catch (error) {
    devLog('Unexpected error in sync-user:', error)
    const appError = handleError(error as Error)
    const userMessage = getUserMessage(appError)
    const statusCode = getHttpStatus(appError)
    
    return NextResponse.json({ error: userMessage }, { status: statusCode })
  }
}

