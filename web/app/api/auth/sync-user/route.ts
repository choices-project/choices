import { NextResponse } from 'next/server'
import { devLog } from '@/lib/logger';
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    // Get current authenticated user from Supabase Auth
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    devLog('Syncing user:', {
      id: user.id,
      email: user.email,
      email_confirmed: user.email_confirmed_at
    })

    // Check if user already exists in ia_users table
    const { error: checkError } = await supabase
      .from('ia_users')
      .select('*')
      .eq('stable_id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      devLog('Error checking existing user:', checkError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (existingUser) {
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
    const { error: createError } = await supabase
      .from('ia_users')
      .insert({
        stable_id: user.id,
        email: user.email,
        verification_tier: 'T0',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      devLog('Error creating user in ia_users:', createError)
      return NextResponse.json(
        { error: 'Failed to create user record' },
        { status: 500 }
      )
    }

    devLog('Successfully created user in ia_users table:', newUser)

    return NextResponse.json({
      success: true,
      message: 'User synced successfully',
      user: {
        id: newUser.id,
        stable_id: newUser.stable_id,
        email: newUser.email,
        verification_tier: newUser.verification_tier,
        is_active: newUser.is_active
      }
    })

  } catch (error) {
    devLog('Unexpected error in sync-user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

