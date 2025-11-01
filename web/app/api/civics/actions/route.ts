import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

import { createApiLogger } from '@/lib/utils/api-logger';

// SECURITY: Use regular Supabase client with user authentication, not service role
// Users should access data through Supabase with RLS, not service role APIs
// Note: This global client is not used - each function creates its own client

// ============================================================================
// TYPES
// ============================================================================

type CreateCivicActionRequest = {
  type: 'contact' | 'petition' | 'event' | 'donation' | 'volunteer';
  title: string;
  description?: string;
  targetRepresentativeId?: number;
  targetOrganization?: string;
  targetIssue?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  metadata?: Record<string, any>;
}

// UpdateCivicActionRequest type defined but not yet used - reserved for future PATCH/PUT implementation
type _UpdateCivicActionRequest = {
  title?: string;
  description?: string;
  status?: 'active' | 'completed' | 'cancelled' | 'postponed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  completionNotes?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// GET - Retrieve Civic Actions
// ============================================================================

export async function GET(request: NextRequest) {
  const logger = createApiLogger('/api/civics/actions', 'GET');
  
  try {
    // Get Supabase client
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: true } }
    );

    // Authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      logger.warn('Unauthenticated civic actions access attempt');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const representativeId = searchParams.get('representativeId');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Build query
    let query = supabaseClient
      .from('civic_actions')
      .select(`
        *,
        target_representative:representatives_core(id, name, title, party, state, district)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (representativeId) {
      query = query.eq('target_representative_id', parseInt(representativeId));
    }

    const { data: actions, error: queryError } = await query;

    if (queryError) {
      logger.error('Error fetching civic actions:', queryError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch civic actions' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count } = await supabaseClient
      .from('civic_actions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    logger.info('Civic actions retrieved', {
      userId: user.id,
      count: actions?.length || 0,
      filters: { status, type, representativeId }
    });

    return NextResponse.json({
      success: true,
      data: {
        actions: actions ?? [],
        pagination: {
          total: count ?? 0,
          limit,
          offset,
          hasMore: (count ?? 0) > offset + limit
        }
      }
    });

  } catch (error) {
    logger.error('Error in civic actions GET:', error as Error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create New Civic Action
// ============================================================================

export async function POST(request: NextRequest) {
  const logger = createApiLogger('/api/civics/actions', 'POST');
  
  try {
    // Get Supabase client
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: true } }
    );

    // Authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      logger.warn('Unauthenticated civic action creation attempt');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: CreateCivicActionRequest = await request.json();
    const {
      type,
      title,
      description,
      targetRepresentativeId,
      targetOrganization,
      targetIssue,
      priority = 'medium',
      dueDate,
      metadata = {}
    } = body;

    // Validate required fields
    if (!type || !title) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Type and title are required' 
        },
        { status: 400 }
      );
    }

    // Validate type
    if (!['contact', 'petition', 'event', 'donation', 'volunteer'].includes(type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid action type' 
        },
        { status: 400 }
      );
    }

    // Create civic action
    const { data: action, error: insertError } = await supabaseClient
      .from('civic_actions')
      .insert({
        user_id: user.id,
        type,
        title,
        description,
        target_representative_id: targetRepresentativeId,
        target_organization: targetOrganization,
        target_issue: targetIssue,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        metadata
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Error creating civic action:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create civic action' },
        { status: 500 }
      );
    }

    logger.info('Civic action created', {
      userId: user.id,
      actionId: action.id,
      type: action.type,
      title: action.title
    });

    return NextResponse.json({
      success: true,
      data: { action }
    });

  } catch (error) {
    logger.error('Error in civic actions POST:', error as Error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}




