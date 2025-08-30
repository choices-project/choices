import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // For now, just log the preferences since we haven't implemented user preferences storage yet
    // This will be replaced with proper database storage
    
    logger.info('User preferences saved', { preferences: body })
    
    return NextResponse.json({ message: 'Preferences saved successfully' })
  } catch (error) {
    logger.error('Error saving user preferences', error as Error)
    return NextResponse.json(
      { message: 'Failed to save preferences' },
      { status: 500 }
    )
  }
}









