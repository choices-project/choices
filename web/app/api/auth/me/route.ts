import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getCurrentUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      const response = NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      return response
    }

    const response = NextResponse.json(user)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  } catch (error) {
    logger.error('Error getting user info', error as Error)
    return NextResponse.json(
      { message: 'Failed to get user information' },
      { status: 500 }
    )
  }
}
