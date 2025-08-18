import { NextRequest, NextResponse } from 'next/server'
import { devLog } from '@/lib/logger';
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, title, description, sentiment, screenshot, userJourney } = body

    // Validate required fields
    if (!type || !title || !description || !sentiment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate feedback type
    if (!['bug', 'feature', 'general'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      )
    }

    // Validate sentiment
    if (!['positive', 'negative', 'neutral'].includes(sentiment)) {
      return NextResponse.json(
        { error: 'Invalid sentiment value' },
        { status: 400 }
      )
    }

    // Get Supabase client
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    if (!supabase) {
      devLog('Supabase not configured - using mock response')
      return NextResponse.json({
        success: true,
        message: 'Feedback submitted successfully (mock)',
        feedback_id: 'mock-' + Date.now()
      })
    }

    // Get current user (if authenticated)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      devLog('Could not get user, proceeding with anonymous feedback:', userError.message)
    }

    // Prepare feedback data
    const feedbackData = {
      user_id: user?.id || null, // Set user_id to null for anonymous feedback
      type,
      title: title.trim(),
      description: description.trim(),
      sentiment,
      screenshot: screenshot || null,
      user_journey: userJourney || {},
      status: 'open',
      priority: type === 'bug' ? 'high' : 'medium'
      // Remove created_at and updated_at - let database handle these
    }

    devLog('Inserting feedback data:', {
      user_id: feedbackData.user_id ? 'authenticated' : 'anonymous',
      type: feedbackData.type,
      sentiment: feedbackData.sentiment
    })

    // Insert feedback into database
    const { data, error } = await supabase
      .from('feedback')
      .insert([feedbackData])
      .select()

    if (error) {
      devLog('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save feedback', details: error.message },
        { status: 500 }
      )
    }

    // Log feedback submission for analytics
    devLog('Feedback submitted:', {
      type,
      sentiment,
      page: userJourney?.page,
      timestamp: new Date().toISOString(),
      user_id: user?.id ? 'authenticated' : 'anonymous'
    })

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback_id: data?.[0]?.id
    })

  } catch (error) {
    devLog('Feedback API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // This endpoint is for admin use - you might want to add authentication
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get Supabase client
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    if (!supabase) {
      devLog('Supabase not configured - using mock response')
      return NextResponse.json({
        success: true,
        feedback: [],
        count: 0
      })
    }

    let query = supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      devLog('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      feedback: data,
      count: data?.length || 0
    })

  } catch (error) {
    devLog('Feedback API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
