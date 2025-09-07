import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { clearEnhancedSession } from '@/lib/session-enhanced'
import { 
  validateCsrfProtection, 
  createCsrfErrorResponse 
} from '../_shared'

export async function POST(request: NextRequest) {
  try {
    // Validate CSRF protection for state-changing operation
    if (!validateCsrfProtection(request)) {
      return createCsrfErrorResponse()
    }

    // Create response and clear all session cookies
    const response = NextResponse.json({ message: 'Logged out successfully' })
    clearEnhancedSession(response)
    
    logger.info('User logged out')
    
    return response
  } catch (error) {
    logger.error('Error during logout', error as Error)
    return NextResponse.json(
      { message: 'Failed to logout' },
      { status: 500 }
    )
  }
}
