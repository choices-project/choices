import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseServerClient } from '@/utils/supabase/server'
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

    const cookieStore = cookies()
    const supabase = getSupabaseServerClient()
    
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    const supabaseClient = await supabase

    // Get current authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      throw new AuthenticationError('User not authenticated')
    }

    // Get user from ia_users table to verify password
    const { data: iaUser, error: iaError } = await supabaseClient
      .from('ia_users')
      .select('id, stable_id, password_hash')
      .eq('stable_id', String(user.id) as any)
      .single()

    if (iaError || !iaUser) {
      throw new NotFoundError('User')
    }

    // Verify password
    if (!iaUser || !('password_hash' in iaUser) || !iaUser.password_hash) {
      throw new AuthenticationError('User password hash not found')
    }
    const isPasswordValid = await bcrypt.compare(password, iaUser.password_hash)
    if (!isPasswordValid) {
      throw new AuthenticationError('Password is incorrect')
    }

    // Delete user data from all tables
    try {
      // Delete user profile
      await supabaseClient
        .from('user_profiles')
        .delete()
        .eq('user_id', String(user.id) as any)

      // Delete refresh tokens
      await supabaseClient
        .from('ia_refresh_tokens')
        .delete()
        .eq('user_id', iaUser.id)

      // Delete votes (if any)
      await supabaseClient
        .from('po_votes')
        .delete()
        .eq('user_id', String(user.id) as any)

      // Delete polls created by user (if any)
      await supabaseClient
        .from('po_polls')
        .delete()
        .eq('created_by', String(user.id) as any)

      // Finally, delete the user from ia_users table
      const { error: deleteError } = await supabaseClient
        .from('ia_users')
        .delete()
        .eq('stable_id', String(user.id) as any)

      if (deleteError) {
        devLog('Error deleting user from ia_users:', deleteError)
        throw new Error('Failed to delete user account')
      }

      // Delete user from Supabase Auth
      const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(user.id)
      
      if (authDeleteError) {
        devLog('Error deleting user from Supabase Auth:', authDeleteError)
        // Don't fail the request if Supabase Auth deletion fails
        // The ia_users table deletion is our primary concern
      }

      // Sign out the user
      await supabaseClient.auth.signOut()

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

