import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { devLog, logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic'

// Security configuration for feedback API
const securityConfig = {
  maxContentLength: 1000,
  maxTitleLength: 200,
  maxRequestSize: 1024 * 1024, // 1MB
  suspiciousPatterns: [
    /[A-Z]{5,}/,                                    // ALL CAPS
    /!{3,}/,                                        // Multiple exclamation marks
    /https?:\/\/[^\s]+/g,                           // URLs
    /spam|scam|click here|buy now|free money/i      // Spam words
  ]
}

// Content validation function
function validateContent(content: string, fieldName: string): { valid: boolean; reason?: string } {
  if (content.length > securityConfig.maxContentLength) {
    return { valid: false, reason: `${fieldName} too long (max ${securityConfig.maxContentLength} characters)` }
  }
  
  for (const pattern of securityConfig.suspiciousPatterns) {
    if (pattern.test(content)) {
      return { valid: false, reason: `Suspicious content detected in ${fieldName}` }
    }
  }
  
  return { valid: true }
}

// Request size validation
function validateRequestSize(request: NextRequest): { valid: boolean; reason?: string } {
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > securityConfig.maxRequestSize) {
    return { valid: false, reason: 'Request too large' }
  }
  return { valid: true }
}

export async function POST(request: NextRequest) {
  try {
    // Request size validation
    const sizeValidation = validateRequestSize(request)
    if (!sizeValidation.valid) {
      return NextResponse.json(
        { error: sizeValidation.reason },
        { status: 413 }
      )
    }

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

    // Enhanced content validation
    const titleValidation = validateContent(title, 'title')
    if (!titleValidation.valid) {
      return NextResponse.json(
        { error: titleValidation.reason },
        { status: 400 }
      )
    }

    const descriptionValidation = validateContent(description, 'description')
    if (!descriptionValidation.valid) {
      return NextResponse.json(
        { error: descriptionValidation.reason },
        { status: 400 }
      )
    }

    // Validate feedback type
    if (!['bug', 'feature', 'general', 'performance', 'accessibility', 'security', 'csp-violation'].includes(type)) {
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
    const supabase = getSupabaseServerClient()
    
    if (!supabase) {
      devLog('Supabase not configured - using mock response')
      return NextResponse.json({
        success: true,
        message: 'Feedback submitted successfully (mock)',
        feedback_id: `mock-${  Date.now()}`
      })
    }

    const supabaseClient = await supabase;
            
    // Get current user (if authenticated)
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError) {
      devLog('Could not get user, proceeding with anonymous feedback:', { error: userError.message })
    }

    // Check daily feedback limit for authenticated users
    if (user?.id) {
      const today = new Date().toISOString().split('T')[0]
    const { count } = await supabaseClient
      .from('feedback')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', String(user.id))
      .gte('created_at', today)
      
      if (count && count >= 10) {
        return NextResponse.json(
          { error: 'Daily feedback limit exceeded (10 per day)' },
          { status: 429 }
        )
      }
    }

    // Special handling for CSP violations
    if (type === 'csp-violation') {
      // CSP violations are always anonymous and high priority
      const cspData = {
        user_id: null, // Always anonymous
        feedback_type: 'csp-violation', // Changed from 'type' to 'feedback_type'
        title: 'CSP Violation Report',
        description: `CSP Violation: ${description}`,
        sentiment: 'negative',
        screenshot: null,
        user_journey: {},
        status: 'open',
        priority: 'urgent',
        tags: ['security', 'csp', 'violation'],
        ai_analysis: {},
        metadata: {
          cspReport: body['csp-report'] || {},
          userAgent: request.headers.get('user-agent') || 'unknown',
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
          timestamp: new Date().toISOString(),
          security: {
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            timestamp: new Date().toISOString()
          }
        }
      };
      
      devLog('Processing CSP violation report:', cspData);
      
      const { data: cspResult, error: cspError } = await supabaseClient
        .from('feedback')
        .insert(cspData)
        .select()
        .single();
        
      if (cspError) {
        logger.error('Error storing CSP violation:', cspError);
        return NextResponse.json(
          { error: 'Failed to store CSP violation report' },
          { status: 500 }
        );
      }
      
      logger.warn('CSP Violation Report', {
        'csp-report': body['csp-report'],
        feedbackId: cspResult.id,
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
      });
      
      return NextResponse.json({
        success: true,
        message: 'CSP violation report received',
        feedback_id: cspResult.id
      });
    }

    // Prepare enhanced feedback data
    const feedbackData = {
      user_id: user?.id || null,
      feedback_type: type, // Changed from 'type' to 'feedback_type'
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
        },
        security: {
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          timestamp: new Date().toISOString()
        }
      }
    }

    devLog('Inserting enhanced feedback data:', {
      user_id: feedbackData.user_id ? 'authenticated' : 'anonymous',
      type: feedbackData.feedback_type,
      sentiment: feedbackData.sentiment,
      sessionId: userJourney?.sessionId,
      currentPage: userJourney?.currentPage,
      deviceType: userJourney?.deviceInfo?.type
    })

    // Insert feedback into database
    const { data, error } = await supabaseClient
      .from('feedback')
      .insert([feedbackData])
      .select()

    if (error) {
      devLog('Database error:', { error })
      // If table doesn't exist or schema cache issue, use mock response for testing
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes('relation "feedback" does not exist') || 
          errorMessage.includes('does not exist') ||
          errorMessage.includes('schema cache')) {
        devLog('Schema cache issue or table not ready - using mock response')
        return NextResponse.json({
          success: true,
          message: 'Feedback submitted successfully (mock - schema cache issue)',
          feedback_id: `mock-${  Date.now()}`,
          context: {
            sessionId: userJourney?.sessionId,
            deviceInfo: userJourney?.deviceInfo,
            performanceMetrics: userJourney?.performanceMetrics
          }
        })
      }
      return NextResponse.json(
        { error: 'Failed to save feedback', details: error instanceof Error ? error.message : "Unknown error" },
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
      feedback_id: data && !('error' in data) && data[0] && 'id' in data[0] ? data[0].id : null,
      context: {
        sessionId: userJourney?.sessionId,
        deviceInfo: userJourney?.deviceInfo,
        performanceMetrics: userJourney?.performanceMetrics
      }
    })

  } catch (error) {
    devLog('Enhanced feedback API error:', { error })
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
    const supabase = getSupabaseServerClient()

    if (!supabase) {
      devLog('Supabase not configured - using mock response')
      return NextResponse.json({
        success: true,
        feedback: [],
        count: 0
      })
    }

    const supabaseClient = await supabase;
    
    let query = supabaseClient
      .from('feedback')
      .select('id, user_id, type, title, description, sentiment, created_at, updated_at, user_journey, metadata, ai_analysis')
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
      devLog('Database error:', { error })
      // If table doesn't exist or schema cache issue, return empty mock response
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes('relation "feedback" does not exist') || 
          errorMessage.includes('does not exist') ||
          errorMessage.includes('schema cache')) {
        devLog('Schema cache issue or table not ready - using mock response')
        return NextResponse.json({
          success: true,
          feedback: [],
          count: 0,
          analytics: {
            total: 0,
            byType: {},
            bySentiment: {},
            byStatus: {}
          }
        })
      }
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      )
    }

    // Process feedback data for better display
    const processedFeedback = data && !('error' in data) ? data.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      type: item.type,
      content: item.description || item.title || '',
      status: item.status || 'open',
      sentiment: item.sentiment,
      created_at: item.created_at,
      updated_at: item.updated_at,
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
    })) : []

    return NextResponse.json({
      success: true,
      feedback: processedFeedback,
      count: processedFeedback.length,
      analytics: generateAnalytics(processedFeedback)
    })

  } catch (error) {
    devLog('Feedback API error:', { error })
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
