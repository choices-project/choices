import { NextRequest, NextResponse } from 'next/server';
import { devLog } from '@/lib/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { handleError, getUserMessage, getHttpStatus, ValidationError } from '@/lib/error-handler';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      throw new ValidationError('Email is required')
    }

    const cookieStore = cookies()
    const supabase = getSupabaseServerClient()
    
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    const supabaseClient = await supabase

    // Check if user exists
    const { data: user, error: userError } = await supabaseClient
      .from('ia_users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .eq('is_active', true as any)
      .single()

    if (userError || !user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, you will receive a password reset link.'
      })
    }

    // Use Supabase Auth's built-in password reset
    const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(email, {
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

