import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/core/auth/middleware';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/site-messages - Get site messages for admin management
 */
async function GET(request: NextRequest, context: any) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const priority = searchParams.get('priority') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase
      .rpc('is_admin', { input_user_id: user.id });

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Build query for site messages
    let query = supabase
      .from('site_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (priority !== 'all') {
      query = query.eq('priority', priority);
    }

    const { data: messages, error } = await query;

    if (error) {
      logger.error('Error fetching site messages:', error as Error);
      return NextResponse.json(
        { error: 'Failed to fetch site messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: messages || [],
      total: messages?.length || 0,
      filters: {
        status,
        priority,
        limit
      },
      admin_user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error) {
    logger.error('Admin site-messages API error:', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/site-messages - Create a new site message
 */
async function POST(request: NextRequest, context: any) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase
      .rpc('is_admin', { input_user_id: user.id });

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, priority, status, target_audience, start_date, end_date } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Create site message using correct field names
    const { data: message, error } = await supabase
      .from('site_messages')
      .insert({
        title,
        message: content, // Use existing 'message' field
        priority: priority || 'medium',
        type: 'announcement',
        is_active: true
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating site message:', error as Error);
      return NextResponse.json(
        { error: 'Failed to create site message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: message,
      message: 'Site message created successfully'
    });

  } catch (error) {
    logger.error('Admin site-messages POST API error:', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export { GET, POST };
