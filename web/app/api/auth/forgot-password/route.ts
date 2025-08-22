import { NextRequest, NextResponse } from 'next/server';
import { devLog } from '@/lib/logger';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { handleError, getUserMessage, getHttpStatus, ValidationError } from '@/lib/error-handler';

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      throw new ValidationError('Email is required')
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('ia_users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single()

    if (userError || !user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, you will receive a password reset link.'
      })
    }

    // Use Supabase Auth's built-in password reset
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
    })

    if (resetError) {
      devLog('Password reset error:', resetError)
      // Don't reveal the error to the user for security
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, you will receive a password reset link.'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, you will receive a password reset link.'
    })

  } catch (error) {
    devLog('Error in forgot password:', error)
    const appError = handleError(error as Error, { context: 'forgot-password' })
    const userMessage = getUserMessage(appError)
    const statusCode = getHttpStatus(appError)
    
    return NextResponse.json({ error: userMessage }, { status: statusCode })
  }
}

