// NextRequest import removed - not used
import { NextResponse } from 'next/server';

import { handleError, getUserMessage, getHttpStatus, AuthenticationError } from '@/lib/error-handler';
import { devLog } from '@/lib/utils/logger';
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

    // Check if user already exists in user_profiles table
    const { data: existingUser, error: checkError } = await supabaseClient
      .from('user_profiles')
      .select('id, user_id, email, trust_tier, created_at')
      .eq('user_id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      devLog('Error checking existing user:', checkError)
      throw new Error('Database error')
    }

    if (existingUser && !('error' in existingUser)) {
      devLog('User already exists in user_profiles table')
      return NextResponse.json({
        success: true,
        message: 'User already synced',
        user: {
          id: (existingUser as any).id,
          user_id: (existingUser as any).user_id,
          email: (existingUser as any).email,
          trust_tier: (existingUser as any).trust_tier
        }
      })
    }

    // Create user in user_profiles table
    const { data: newUser, error: createError } = await (supabaseClient as any)
      .from('user_profiles')
      .insert({
        user_id: user.id,
        email: user.email ?? undefined,
        trust_tier: 'T0'
      })
      .select()
      .single()

    if (createError) {
      devLog('Error creating user in user_profiles:', createError)
      throw new Error('Failed to create user record')
    }

    devLog('Successfully created user in user_profiles table:', newUser)

    return NextResponse.json({
      success: true,
      message: 'User synced successfully',
      user: {
        id: (newUser).id,
        user_id: (newUser).user_id,
        email: (newUser).email,
        trust_tier: (newUser).trust_tier
      }
    })

  } catch (error) {
    devLog('Unexpected error in sync-user:', error)
    const appError = handleError(error instanceof Error ? error : new Error(String(error)))
    const userMessage = getUserMessage(appError)
    const statusCode = getHttpStatus(appError)
    
    return NextResponse.json({ error: userMessage }, { status: statusCode })
  }
}

