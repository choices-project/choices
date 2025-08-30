import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import { devLog } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    
    // Get Supabase client
    const supabaseClient = await supabase;
    
    if (!supabaseClient) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    // Check authentication
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin permissions
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('ia_users')
      .select('verification_tier')
      .eq('stable_id', String(user.id) as any)
      .single();

    if (profileError) {
      devLog('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      );
    }

    if (!userProfile || !userProfile || !('verification_tier' in userProfile) || !['T2', 'T3'].includes(userProfile.verification_tier)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const sentiment = searchParams.get('sentiment');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const dateRange = searchParams.get('dateRange') || 'all';
    const search = searchParams.get('search') || '';

    // Build query
    let query = supabaseClient
      .from('feedback')
      .select('id, user_id, type, title, description, sentiment, created_at, updated_at, tags')
      .order('created_at', { ascending: false });

    // Apply filters
    if (type) {
      query = query.eq('type', type as any);
    }

    if (sentiment) {
      query = query.eq('sentiment', sentiment as any);
    }

    if (status) {
      query = query.eq('status', status as any);
    }

    if (priority) {
      query = query.eq('priority', priority as any);
    }

    // Apply date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        default:
          startDate = new Date(0);
      }

      query = query.gte('created_at', startDate.toISOString());
    }

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Execute query
    const { data: feedback, error } = await query;

    if (error) {
      devLog('Error fetching feedback:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    // Apply additional search filtering if needed (for fields not in the database)
    let filteredFeedback = feedback || [];
    if (search && feedback) {
      filteredFeedback = feedback.filter(item => {
        const searchLower = search.toLowerCase();
        return (
          (item && 'title' in item ? item.title?.toLowerCase().includes(searchLower) : false) ||
          (item && 'description' in item ? item.description?.toLowerCase().includes(searchLower) : false) ||
          (item && 'tags' in item ? item.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower)) : false)
        );
      });
    }

    return NextResponse.json({
      success: true,
      data: filteredFeedback,
      total: filteredFeedback.length,
      filters: {
        type,
        sentiment,
        status,
        priority,
        dateRange,
        search
      }
    });

  } catch (error) {
    devLog('Error in admin feedback API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
