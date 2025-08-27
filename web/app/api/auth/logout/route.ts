import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { clearSessionToken } from '@/lib/session'

export async function POST(_request: NextRequest) {
  try {
    clearSessionToken()
    
    logger.info('User logged out')
    
    return NextResponse.json({ message: 'Logged out successfully' })
  } catch (error) {
    logger.error('Error during logout', error as Error)
    return NextResponse.json(
      { message: 'Failed to logout' },
      { status: 500 }
    )
  }
}
