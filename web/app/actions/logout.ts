'use server'

import { getSupabaseServerClient } from '@/utils/supabase/server'

import { 
  createSecureServerAction,
  getAuthenticatedUser,
  logSecurityEvent,
  type ServerActionContext
} from '@/lib/core/auth/server-actions'

// Enhanced logout action with security features
export const logout = createSecureServerAction(
  async (context: ServerActionContext) => {
    // Get authenticated user for logging
    const user = await getAuthenticatedUser(context)
    
    // Log logout event
    logSecurityEvent('USER_LOGOUT', {
      userId: user?.userId,
      userRole: user?.userRole
    }, context)

    // Get Supabase client and sign out
    const supabase = await getSupabaseServerClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
    
    return { success: true, message: 'Logged out successfully' }
  }
)
