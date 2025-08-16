import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    // Prepare feedback data
    const feedbackData = {
      type,
      title: title.trim(),
      description: description.trim(),
      sentiment,
      screenshot: screenshot || null,
      user_journey: userJourney,
      status: 'open',
      priority: type === 'bug' ? 'high' : 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Insert feedback into database
    if (!supabase) {
      console.warn('Supabase not configured - using mock response')
      return NextResponse.json({
        success: true,
        message: 'Feedback submitted successfully (mock)',
        feedback_id: 'mock-' + Date.now()
      })
    }

    const { data, error } = await supabase
      .from('feedback')
      .insert([feedbackData])
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      )
    }

    // Log feedback submission for analytics
    console.log('Feedback submitted:', {
      type,
      sentiment,
      page: userJourney?.page,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback_id: data?.[0]?.id
    })

  } catch (error) {
    console.error('Feedback API error:', error)
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

    if (!supabase) {
      console.warn('Supabase not configured - using mock response')
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
      console.error('Database error:', error)
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
    console.error('Feedback API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
