import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { devLog } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      type, 
      title, 
      description, 
      sentiment, 
      screenshot, 
      userJourney,
      feedbackContext 
    } = body

    // Validate required fields
    if (!type || !title || !description || !sentiment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate feedback type
    if (!['bug', 'feature', 'general', 'performance', 'accessibility', 'security'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      )
    }

    // Validate sentiment
    if (!['positive', 'negative', 'neutral', 'mixed'].includes(sentiment)) {
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

    // Prepare enhanced feedback data
    const feedbackData = {
      user_id: user?.id || null,
      type,
      title: title.trim(),
      description: description.trim(),
      sentiment,
      screenshot: screenshot || null,
      user_journey: userJourney || {},
      status: 'open',
      priority: type === 'bug' ? 'high' : type === 'security' ? 'urgent' : 'medium',
      tags: generateTags(type, title, description, sentiment),
      ai_analysis: feedbackContext?.aiAnalysis || {},
      metadata: {
        feedbackContext: feedbackContext || {},
        userAgent: userJourney?.userAgent,
        deviceInfo: userJourney?.deviceInfo,
        performanceMetrics: userJourney?.performanceMetrics,
        errors: userJourney?.errors || [],
        sessionInfo: {
          sessionId: userJourney?.sessionId,
          sessionStartTime: userJourney?.sessionStartTime,
          totalPageViews: userJourney?.totalPageViews
        }
      }
    }

    devLog('Inserting enhanced feedback data:', {
      user_id: feedbackData.user_id ? 'authenticated' : 'anonymous',
      type: feedbackData.type,
      sentiment: feedbackData.sentiment,
      sessionId: userJourney?.sessionId,
      currentPage: userJourney?.currentPage,
      deviceType: userJourney?.deviceInfo?.type
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

    // Log comprehensive feedback submission for analytics
    devLog('Enhanced feedback submitted:', {
      type,
      sentiment,
      page: userJourney?.currentPage,
      device: userJourney?.deviceInfo?.type,
      browser: userJourney?.deviceInfo?.browser,
      os: userJourney?.deviceInfo?.os,
      sessionId: userJourney?.sessionId,
      timestamp: new Date().toISOString(),
      user_id: user?.id ? 'authenticated' : 'anonymous',
      performance: {
        pageLoadTime: userJourney?.pageLoadTime,
        timeOnPage: userJourney?.timeOnPage
      },
      errors: userJourney?.errors?.length || 0
    })

    return NextResponse.json({
      success: true,
      message: 'Enhanced feedback submitted successfully',
      feedback_id: data?.[0]?.id,
      context: {
        sessionId: userJourney?.sessionId,
        deviceInfo: userJourney?.deviceInfo,
        performanceMetrics: userJourney?.performanceMetrics
      }
    })

  } catch (error) {
    devLog('Enhanced feedback API error:', error)
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
    const sentiment = searchParams.get('sentiment')
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

    if (sentiment) {
      query = query.eq('sentiment', sentiment)
    }

    const { data, error } = await query

    if (error) {
      devLog('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      )
    }

    // Process feedback data for better display
    const processedFeedback = data?.map(item => ({
      ...item,
      userJourney: item.user_journey,
      metadata: item.metadata,
      aiAnalysis: item.ai_analysis,
      // Extract key metrics for easy access
      deviceType: item.user_journey?.deviceInfo?.type,
      browser: item.user_journey?.deviceInfo?.browser,
      os: item.user_journey?.deviceInfo?.os,
      pageLoadTime: item.user_journey?.pageLoadTime,
      timeOnPage: item.user_journey?.timeOnPage,
      errorCount: item.user_journey?.errors?.length || 0,
      sessionId: item.user_journey?.sessionId
    })) || []

    return NextResponse.json({
      success: true,
      feedback: processedFeedback,
      count: processedFeedback.length,
      analytics: generateAnalytics(processedFeedback)
    })

  } catch (error) {
    devLog('Feedback API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
function generateTags(type: string, title: string, description: string, sentiment: string): string[] {
  const tags: string[] = []
  
  // Type-based tags
  tags.push(type)
  
  // Sentiment-based tags
  tags.push(`${sentiment}-feedback`)
  
  // Content-based tags
  const content = `${title} ${description}`.toLowerCase()
  
  if (content.includes('bug') || content.includes('error') || content.includes('broken')) {
    tags.push('bug-report')
  }
  
  if (content.includes('feature') || content.includes('request') || content.includes('add')) {
    tags.push('feature-request')
  }
  
  if (content.includes('slow') || content.includes('performance') || content.includes('lag')) {
    tags.push('performance-issue')
  }
  
  if (content.includes('mobile') || content.includes('responsive') || content.includes('screen')) {
    tags.push('responsive-design')
  }
  
  if (content.includes('privacy') || content.includes('security') || content.includes('data')) {
    tags.push('privacy-security')
  }
  
  if (content.includes('accessibility') || content.includes('a11y') || content.includes('screen-reader')) {
    tags.push('accessibility')
  }
  
  return tags
}

function generateAnalytics(feedback: any[]): any {
  const analytics = {
    total: feedback.length,
    byType: {},
    bySentiment: {},
    byDevice: {},
    byBrowser: {},
    byOS: {},
    performance: {
      avgPageLoadTime: 0,
      avgTimeOnPage: 0,
      totalErrors: 0
    },
    topPages: {},
    topIssues: {}
  }
  
  const typeCount: any = {}
  const sentimentCount: any = {}
  const deviceCount: any = {}
  const browserCount: any = {}
  const osCount: any = {}
  const pageCount: any = {}
  const issueCount: any = {}
  
  let totalPageLoadTime = 0
  let totalTimeOnPage = 0
  let totalErrors = 0
  let validPageLoadTimes = 0
  let validTimeOnPage = 0
  
  feedback.forEach(item => {
    // Count by type
    typeCount[item.type] = (typeCount[item.type] || 0) + 1
    
    // Count by sentiment
    sentimentCount[item.sentiment] = (sentimentCount[item.sentiment] || 0) + 1
    
    // Count by device
    if (item.deviceType) {
      deviceCount[item.deviceType] = (deviceCount[item.deviceType] || 0) + 1
    }
    
    // Count by browser
    if (item.browser) {
      browserCount[item.browser] = (browserCount[item.browser] || 0) + 1
    }
    
    // Count by OS
    if (item.os) {
      osCount[item.os] = (osCount[item.os] || 0) + 1
    }
    
    // Count by page
    if (item.userJourney?.currentPage) {
      pageCount[item.userJourney.currentPage] = (pageCount[item.userJourney.currentPage] || 0) + 1
    }
    
    // Count by issue (using tags)
    if (item.tags) {
      item.tags.forEach((tag: string) => {
        issueCount[tag] = (issueCount[tag] || 0) + 1
      })
    }
    
    // Performance metrics
    if (item.pageLoadTime && item.pageLoadTime > 0) {
      totalPageLoadTime += item.pageLoadTime
      validPageLoadTimes++
    }
    
    if (item.timeOnPage && item.timeOnPage > 0) {
      totalTimeOnPage += item.timeOnPage
      validTimeOnPage++
    }
    
    totalErrors += item.errorCount || 0
  })
  
  analytics.byType = typeCount
  analytics.bySentiment = sentimentCount
  analytics.byDevice = deviceCount
  analytics.byBrowser = browserCount
  analytics.byOS = osCount
  analytics.topPages = pageCount
  analytics.topIssues = issueCount
  
  analytics.performance.avgPageLoadTime = validPageLoadTimes > 0 ? totalPageLoadTime / validPageLoadTimes : 0
  analytics.performance.avgTimeOnPage = validTimeOnPage > 0 ? totalTimeOnPage / validTimeOnPage : 0
  analytics.performance.totalErrors = totalErrors
  
  return analytics
}
