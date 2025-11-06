import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { devLog } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

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

    // Check admin permissions - only admins can access feedback data
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', String(user.id))
      .single();

    if (profileError) {
      devLog('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      );
    }

    if (!userProfile.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const sentiment = searchParams.get('sentiment');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const dateRange = searchParams.get('dateRange') ?? 'all';
    const search = searchParams.get('search') ?? '';

    // Build query
    let query = supabaseClient
      .from('feedback')
      .select('id, email, verification_tier, created_at, updated_at, display_name, avatar_url, bio, stable_id, is_active')
      .order('created_at', { ascending: false });

    // Apply filters
    if (type) {
      query = query.eq('type', type as any);
    }

    if (sentiment) {
      query = query.eq('sentiment', sentiment as any);
    }

    if (status && status.trim() !== '') {
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
        case 'quarter': {
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        }
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
      devLog('Error fetching feedback for export:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    // Convert to CSV
    const csvData = convertToCSV(feedback || []);

    // Create response with CSV headers
    const response = new NextResponse(csvData);
    response.headers.set('Content-Type', 'text/csv');
    response.headers.set('Content-Disposition', `attachment; filename="feedback-export-${new Date().toISOString().split('T')[0]}.csv"`);

    return response;

  } catch (error) {
    devLog('Error in feedback export API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) {
    return 'No data to export';
  }

  // Define CSV headers
  const headers = [
    'ID',
    'Title',
    'Description',
    'Type',
    'Status',
    'Priority',
    'Sentiment',
    'Tags',
    'User ID',
    'Created At',
    'Updated At',
    'Screenshot',
    'AI Analysis',
    'User Journey',
    'Metadata'
  ];

  // Convert data to CSV rows
  const rows = data.map(item => [
    item.id,
    `"${(item.title || '').replace(/"/g, '""')}"`,
    `"${(item.description || '').replace(/"/g, '""')}"`,
    item.type || '',
    item.status || '',
    item.priority || '',
    item.sentiment || '',
    `"${(item.tags || []).join(', ')}"`,
    item.user_id || '',
    item.created_at || '',
    item.updated_at || '',
    item.screenshot ? 'Yes' : 'No',
    `"${JSON.stringify(item.ai_analysis || {}).replace(/"/g, '""')}"`,
    `"${JSON.stringify(item.user_journey || {}).replace(/"/g, '""')}"`,
    `"${JSON.stringify(item.metadata || {}).replace(/"/g, '""')}"`
  ]);

  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

  return csvContent;
}
