import type { NextRequest } from 'next/server';

import { requireAdminOr401 } from '@/lib/admin-auth';
import { withErrorHandling, errorResponse } from '@/lib/api';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Single admin gate - returns 401 if not admin
  const authGate = await requireAdminOr401()
  if (authGate) return authGate
  
    const supabase = await getSupabaseServerClient();

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')
    const search = searchParams.get('search') ?? ''
    const trustTier = searchParams.get('trust_tier') ?? ''

    // Build query
    let query = supabase
      .from('user_profiles')
      .select(`
        user_id,
        username,
        email,
        is_admin,
        created_at,
        updated_at,
        last_login_at
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Filter by admin status instead of trust_tier
    if (trustTier === 'admin') {
      query = query.eq('is_admin', true)
    } else if (trustTier === 'user') {
      query = query.eq('is_admin', false)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: users, error, count } = await query

  if (error) {
    logger.error('Error fetching users:', error)
    return errorResponse('Failed to fetch users', 500);
  }

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        pages: Math.ceil((count ?? 0) / limit),
      },
    });
});

export async function PUT(request: NextRequest) {
  // Single admin gate - returns 401 if not admin
  const authGate = await requireAdminOr401()
  if (authGate) return authGate
  
  try {
    const supabase = await getSupabaseServerClient();

    const body = await request.json()
    const { userId, updates } = body

    if (!userId || !updates) {
      return NextResponse.json(
        { message: 'User ID and updates are required' },
        { status: 400 }
      )
    }

    // Validate updates
    const allowedFields = ['is_admin', 'username']
    const validUpdates: Record<string, unknown> = {}
    
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
    const { error: updateError } = await supabase
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
    // narrow 'unknown' → Error
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Admin user update error:', err)
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
