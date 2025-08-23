import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import bcrypt from 'bcryptjs'
import { devLog } from '@/lib/logger'
import { 
  ValidationError, 
  AuthenticationError, 
  NotFoundError, 
  handleError, 
  getUserMessage, 
  getHttpStatus 
} from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Validate input
    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current password and new password are required')
    }

    // Validate new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(newPassword)) {
      throw new ValidationError('New password must be at least 8 characters with uppercase, lowercase, number, and special character')
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    // Get current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new AuthenticationError('User not authenticated')
    }

    // Get user from ia_users table to verify current password
    const { data: iaUser, error: iaError } = await supabase
      .from('ia_users')
      .select('id, email, verification_tier, created_at, updated_at, display_name, avatar_url, bio, stable_id, is_active, password_hash')
      .eq('stable_id', user.id)
      .single()

    if (iaError || !iaUser) {
      throw new NotFoundError('User')
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, iaUser.password_hash)
    if (!isCurrentPasswordValid) {
      throw new AuthenticationError('Current password is incorrect')
    }

    // Hash new password
    const saltRounds = 12
    const newHashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password in ia_users table
    const { error: updateError } = await supabase
      .from('ia_users')
      .update({ 
        password_hash: newHashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('stable_id', user.id)

    if (updateError) {
      devLog('Error updating password:', updateError)
      throw new Error('Failed to update password')
    }

    // Update password in Supabase Auth
    const { error: authUpdateError } = await supabase.auth.updateUser({
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
    const appError = handleError(error as Error, { context: 'change-password' })
    const userMessage = getUserMessage(appError)
    const statusCode = getHttpStatus(appError)
    
    return NextResponse.json(
      { error: userMessage },
      { status: statusCode }
    )
  }
}

