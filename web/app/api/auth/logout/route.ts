// NextRequest import removed - not used
import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'
import { logger } from '@/lib/utils/logger'

export async function POST() {
  try {
    const supabase = getSupabaseServerClient()
    const supabaseClient = await supabase

    // Sign out with Supabase Auth
    const { error } = await supabaseClient.auth.signOut()

    if (error) {
      logger.warn('Logout error', { error: error.message })
      return NextResponse.json(
        { message: 'Logout failed' },
        { status: 500 }
      )
    }

    logger.info('User logged out successfully')

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

  } catch (error) {
    logger.error('Logout error', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}