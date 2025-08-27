import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger';
import { withAuth, createRateLimitMiddleware, combineMiddleware } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

// Rate limiting: 100 requests per minute per IP
const rateLimitMiddleware = createRateLimitMiddleware({
  maxRequests: 100,
  windowMs: 60 * 1000
})

// Combined middleware: rate limiting + admin auth
const middleware = combineMiddleware(rateLimitMiddleware)

export const GET = withAuth(async (request: NextRequest, context) => {
  try {
    // Apply rate limiting
    const rateLimitResult = await middleware(request)
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const trustTier = searchParams.get('trust_tier') || ''

    // Build query
    let query = context.supabase
      .from('user_profiles')
      .select(`
        user_id,
        username,
        email,
        trust_tier,
        created_at,
        updated_at,
        last_login_at
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (trustTier) {
      query = query.eq('trust_tier', trustTier)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: users, error, count } = await query

    if (error) {
      logger.error('Error fetching users:', error)
      return NextResponse.json(
        { message: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    })

  } catch (error) {
    logger.error('Admin users API error:', error)
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}, { requireAdmin: true })

export const PUT = withAuth(async (request: NextRequest, context) => {
  try {
    // Apply rate limiting
    const rateLimitResult = await middleware(request)
    if (rateLimitResult) {
      return rateLimitResult
    }

    const body = await request.json()
    const { userId, updates } = body

    if (!userId || !updates) {
      return NextResponse.json(
        { message: 'User ID and updates are required' },
        { status: 400 }
      )
    }

    // Validate updates
    const allowedFields = ['trust_tier', 'username']
    const validUpdates: any = {}
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        validUpdates[key] = value
      }
    }

    if (Object.keys(validUpdates).length === 0) {
      return NextResponse.json(
        { message: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update user profile
    const { error: updateError } = await context.supabase
      .from('user_profiles')
      .update({
        ...validUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (updateError) {
      logger.error('Error updating user:', updateError)
      return NextResponse.json(
        { message: 'Failed to update user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'User updated successfully',
    })

  } catch (error) {
    logger.error('Admin user update error:', error)
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}, { requireAdmin: true })
