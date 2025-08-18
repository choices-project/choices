import { NextResponse } from 'next/server'
import { devLog } from '@/lib/logger';
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { password, confirmDelete } = await request.json()
    
    if (!password || !confirmDelete) {
      return NextResponse.json(
        { error: 'Password and confirmation are required' },
        { status: 400 }
      )
    }

    if (confirmDelete !== 'DELETE') {
      return NextResponse.json(
        { error: 'Please type DELETE to confirm account deletion' },
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

    // Get user from ia_users table to verify password
    const { data: iaUser } = await supabase
      .from('ia_users')
      .select('*')
      .eq('stable_id', user.id)
      .single()

    if (iaError || !iaUser) {
      return NextResponse.json(
        { error: 'User not found in system' },
        { status: 404 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, iaUser.password_hash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Password is incorrect' },
        { status: 401 }
      )
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
      const {  } = await supabase
        .from('ia_users')
        .delete()
        .eq('stable_id', user.id)

      if (deleteError) {
        devLog('Error deleting user from ia_users:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete user account' },
          { status: 500 }
        )
      }

      // Delete user from Supabase Auth
      const {  } = await supabase.auth.admin.deleteUser(user.id)
      
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
      return NextResponse.json(
        { error: 'Failed to delete account. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    devLog('Error in delete account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

