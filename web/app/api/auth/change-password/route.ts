import { NextRequest, NextResponse } from 'next/server'
import { devLog } from '@/lib/logger';
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json()
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    // Validate new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters with uppercase, lowercase, number, and special character' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    // Get current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Get user from ia_users table to verify current password
    const { data: iaUser, error: iaError } = await supabase
      .from('ia_users')
      .select('id, email, verification_tier, created_at, updated_at, display_name, avatar_url, bio, stable_id, is_active, password_hash')
      .eq('stable_id', user.id)
      .single()

    if (iaError || !iaUser) {
      return NextResponse.json(
        { error: 'User not found in system' },
        { status: 404 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, iaUser.password_hash)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Hash new password
    const saltRounds = 12
    const newHashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password in ia_users table
    const { data: updatedUser, error: updateError } = await supabase
      .from('ia_users')
      .update({ 
        password_hash: newHashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('stable_id', user.id)

    if (updateError) {
      devLog('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

    // Update password in Supabase Auth
    const { data: authUser, error: authUpdateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (authUpdateError) {
      devLog('Error updating Supabase Auth password:', authUpdateError)
      // Don't fail the request if Supabase Auth update fails
      // The ia_users table is our source of truth
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    })

  } catch (error) {
    devLog('Error in change password:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

