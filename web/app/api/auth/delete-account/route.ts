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
    const { password } = body

    // Validate input
    if (!password) {
      throw new ValidationError('Password is required to delete account')
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

    // Get user from ia_users table to verify password
    const { data: iaUser, error: iaError } = await supabase
      .from('ia_users')
      .select('id, stable_id, password_hash')
      .eq('stable_id', user.id)
      .single()

    if (iaError || !iaUser) {
      throw new NotFoundError('User')
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, iaUser.password_hash)
    if (!isPasswordValid) {
      throw new AuthenticationError('Password is incorrect')
    }

    // Delete user data from all tables
    try {
      // Delete user profile
      await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', user.id)

      // Delete refresh tokens
      await supabase
        .from('ia_refresh_tokens')
        .delete()
        .eq('user_id', iaUser.id)

      // Delete votes (if any)
      await supabase
        .from('po_votes')
        .delete()
        .eq('user_id', user.id)

      // Delete polls created by user (if any)
      await supabase
        .from('po_polls')
        .delete()
        .eq('created_by', user.id)

      // Finally, delete the user from ia_users table
      const { error: deleteError } = await supabase
        .from('ia_users')
        .delete()
        .eq('stable_id', user.id)

      if (deleteError) {
        devLog('Error deleting user from ia_users:', deleteError)
        throw new Error('Failed to delete user account')
      }

      // Delete user from Supabase Auth
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id)
      
      if (authDeleteError) {
        devLog('Error deleting user from Supabase Auth:', authDeleteError)
        // Don't fail the request if Supabase Auth deletion fails
        // The ia_users table deletion is our primary concern
      }

      // Sign out the user
      await supabase.auth.signOut()

      return NextResponse.json({
        success: true,
        message: 'Account deleted successfully'
      })

    } catch (deleteError) {
      devLog('Error during account deletion:', deleteError)
      throw new Error('Failed to delete account. Please try again.')
    }

  } catch (error) {
    const appError = handleError(error as Error, { context: 'delete-account' })
    const userMessage = getUserMessage(appError)
    const statusCode = getHttpStatus(appError)
    
    return NextResponse.json(
      { error: userMessage },
      { status: statusCode }
    )
  }
}

