'use server'

import { 
  createSecureServerAction,
  secureLogout,
  getAuthenticatedUser,
  logSecurityEvent,
  type ServerActionContext
} from '@/lib/auth/server-actions'

// Enhanced logout action with security features
export const logout = createSecureServerAction(
  async (formData: FormData, context: ServerActionContext) => {
    // Get authenticated user for logging
    const user = await getAuthenticatedUser(context)
    
    // Log logout event
    logSecurityEvent('USER_LOGOUT', {
      userId: user.userId,
      userRole: user.userRole
    }, context)

    // Perform secure logout with session cleanup
    secureLogout()
  },
  {
    requireAuth: true,
    rateLimit: { endpoint: '/logout', maxRequests: 20 }
  }
)
