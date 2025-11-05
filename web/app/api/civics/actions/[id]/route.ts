import { type NextRequest, NextResponse } from 'next/server';

import { createApiLogger } from '@/lib/utils/api-logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// ============================================================================
// TYPES
// ============================================================================

type UpdateCivicActionRequest = {
  title?: string;
  description?: string;
  status?: 'active' | 'completed' | 'cancelled' | 'postponed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  completionNotes?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// GET - Retrieve Single Civic Action
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = createApiLogger('/api/civics/actions/[id]', 'GET');
  
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Action ID is required' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabaseClient = await getSupabaseServerClient();
    if (!supabaseClient) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      logger.warn('Unauthenticated civic action access attempt');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch civic action with related data
    const { data: action, error: queryError } = await supabaseClient
      .from('civic_actions')
      .select(`
        *,
        target_representative:representatives_core(id, name, title, party, state, district, photo),
        related_thread:contact_threads(id, subject, status),
        related_message:contact_messages(id, content, subject, created_at)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (queryError) {
      if (queryError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Civic action not found' },
          { status: 404 }
        );
      }
      
      logger.error('Error fetching civic action:', queryError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch civic action' },
        { status: 500 }
      );
    }

    logger.info('Civic action retrieved', {
      userId: user.id,
      actionId: action.id,
      type: (action as any).action_type
    });

    return NextResponse.json({
      success: true,
      data: { action }
    });

  } catch (error) {
    logger.error('Error in civic action GET:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Update Civic Action
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = createApiLogger('/api/civics/actions/[id]', 'PUT');
  
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Action ID is required' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabaseClient = await getSupabaseServerClient();
    if (!supabaseClient) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      logger.warn('Unauthenticated civic action update attempt');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: UpdateCivicActionRequest = await request.json();
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      completionNotes,
      metadata
    } = body;

    // Build update object
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) {
      updateData.status = status;
      // Auto-set completion date if status is completed
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) {
      updateData.due_date = dueDate ? new Date(dueDate).toISOString() : null;
    }
    if (completionNotes !== undefined) updateData.completion_notes = completionNotes;
    if (metadata !== undefined) updateData.metadata = metadata;

    // Update civic action
    const { data: action, error: updateError } = await supabaseClient
      .from('civic_actions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Civic action not found' },
          { status: 404 }
        );
      }
      
      logger.error('Error updating civic action:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update civic action' },
        { status: 500 }
      );
    }

    logger.info('Civic action updated', {
      userId: user.id,
      actionId: action.id,
      updates: Object.keys(updateData)
    });

    return NextResponse.json({
      success: true,
      data: { action }
    });

  } catch (error) {
    logger.error('Error in civic action PUT:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete Civic Action
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = createApiLogger('/api/civics/actions/[id]', 'DELETE');
  
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Action ID is required' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabaseClient = await getSupabaseServerClient();
    if (!supabaseClient) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      logger.warn('Unauthenticated civic action deletion attempt');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Delete civic action
    const { error: deleteError } = await supabaseClient
      .from('civic_actions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      logger.error('Error deleting civic action:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete civic action' },
        { status: 500 }
      );
    }

    logger.info('Civic action deleted', {
      userId: user.id,
      actionId: id
    });

    return NextResponse.json({
      success: true,
      message: 'Civic action deleted successfully'
    });

  } catch (error) {
    logger.error('Error in civic action DELETE:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

