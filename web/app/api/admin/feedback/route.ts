import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdminOr401, getAdminUser } from '@/features/auth/lib/admin-auth';
import { devLog } from '@/lib/utils/logger';
import { getSupabaseAdminClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Single admin gate - returns 401 if not admin
  const authGate = await requireAdminOr401()
  if (authGate) return authGate
  
  // Get admin user info
  const adminUser = await getAdminUser()
  
  try {
    
    // Get Supabase client
    const supabase = await getSupabaseAdminClient();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const sentiment = searchParams.get('sentiment');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const dateRange = searchParams.get('dateRange') || 'all';
    const search = searchParams.get('search') || '';

    // Build query
    let query = supabase
      .from('feedback')
      .select('id, user_id, type, title, description, sentiment, created_at, updated_at, tags')
      .order('created_at', { ascending: false });

    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }

    if (sentiment) {
      query = query.eq('sentiment', sentiment);
    }

    if (status?.trim()) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
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
    if (search.trim() !== '') {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Execute query
    const { data: feedback, error } = await query;

    if (error) {
      devLog('Error fetching feedback:', { error });
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    // Apply additional search filtering if needed (for fields not in the database)
    let filteredFeedback = feedback || [];
    if (feedback) {
      filteredFeedback = feedback.filter((item: any) => {
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
      admin: {
        id: adminUser?.id,
        email: adminUser?.email
      },
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
    devLog('Error in admin feedback API:', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
