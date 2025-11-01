/**
 * Contact Threads API Endpoint
 * 
 * Handles CRUD operations for message threads between users and representatives.
 * Provides thread management, filtering, and real-time updates.
 * 
 * Created: January 23, 2025
 * Status: ✅ IMPLEMENTATION READY
 */

import { type NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';
import {
  sanitizeSubject,
  sanitizeMessageContent,
  validateRepresentativeId,
  validatePriority,
} from '@/lib/security/input-sanitization';

export const dynamic = 'force-dynamic';

// ============================================================================
// TYPES
// ============================================================================

type CreateThreadRequest = {
  representativeId: string;
  subject: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  initialMessage?: string;
}

// ThreadResponse type reserved for future API response standardization
type _ThreadResponse = {
  id: string;
  userId: string;
  representativeId: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messageCount: number;
  representative: {
    id: string;
    name: string;
    office: string;
    party: string;
  };
}

// ============================================================================
// GET - Retrieve User Threads
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Get Supabase client
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const representativeId = searchParams.get('representativeId');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const sortBy = searchParams.get('sortBy') ?? 'last_message_at';
    const sortOrder = searchParams.get('sortOrder') ?? 'desc';

    // Build query with proper joins to get thread and representative information
    let query = supabase
      .from('contact_threads')
      .select(`
        id,
        user_id,
        representative_id,
        subject,
        status,
        priority,
        created_at,
        updated_at,
        last_message_at,
        message_count,
        representatives_core!inner(
          id,
          name,
          office,
          party
        )
      `)
      .eq('user_id', user.id)
      .order(sortBy === 'last_message_at' ? 'last_message_at' : sortBy === 'created_at' ? 'created_at' : 'updated_at', 
             { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (representativeId) {
      query = query.eq('representative_id', parseInt(representativeId));
    }

    const { data: threads, error: threadsError } = await query;

    if (threadsError) {
      logger.error('Failed to fetch threads', new Error(threadsError?.message ?? 'Unknown error'), { error: threadsError });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch threads' },
        { status: 500 }
      );
    }

    // Get total count for pagination with same filters
    let countQuery = supabase
      .from('contact_threads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (status) {
      countQuery = countQuery.eq('status', status);
    }
    if (priority) {
      countQuery = countQuery.eq('priority', priority);
    }
    if (representativeId) {
      countQuery = countQuery.eq('representative_id', parseInt(representativeId));
    }

    const { count: totalCount } = await countQuery;

    // Transform response data with full thread information
    const transformedThreads = (threads ?? []).map((thread: any) => ({
      id: thread.id,
      userId: thread.user_id,
      representativeId: thread.representative_id,
      subject: thread.subject,
      status: thread.status,
      priority: thread.priority,
      createdAt: thread.created_at,
      updatedAt: thread.updated_at,
      lastMessageAt: thread.last_message_at,
      messageCount: thread.message_count ?? 0,
      representative: thread.representatives_core ? {
        id: thread.representatives_core.id,
        name: thread.representatives_core.name,
        office: thread.representatives_core.office,
        party: thread.representatives_core.party
      } : null
    }));

    return NextResponse.json({
      success: true,
      threads: transformedThreads,
      pagination: {
        total: totalCount ?? 0,
        limit,
        offset,
        hasMore: (totalCount ?? 0) > offset + limit
      }
    });

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error fetching threads:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create New Thread
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Get Supabase client
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: CreateThreadRequest = await request.json();
    const {
      representativeId,
      subject,
      priority = 'normal',
      initialMessage
    } = body;

    // Validate required fields
    if (!representativeId || !subject) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Representative ID and subject are required' 
        },
        { status: 400 }
      );
    }

    // Validate and sanitize representative ID
    const repIdValidation = validateRepresentativeId(representativeId);
    if (!repIdValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: repIdValidation.error ?? 'Invalid representative ID' 
        },
        { status: 400 }
      );
    }

    // Sanitize and validate subject
    const subjectValidation = sanitizeSubject(subject, 255);
    if (!subjectValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: subjectValidation.error ?? 'Invalid subject' 
        },
        { status: 400 }
      );
    }

    // Validate priority
    const priorityValidation = validatePriority(priority);
    if (!priorityValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: priorityValidation.error ?? 'Invalid priority' 
        },
        { status: 400 }
      );
    }

    // Use validated/sanitized values
    const validatedRepId = repIdValidation.parsedId!;
    const sanitizedSubject = subjectValidation.sanitized;
    const validatedPriority = priorityValidation.parsedPriority!;

    // Check if representative exists (representativeId is database primary key)
    const { data: representative, error: repError } = await supabase
      .from('representatives_core')
      .select('id, name, office, party')
      .eq('id', validatedRepId)
      .single();

    if (repError || !representative) {
      logger.warn('Invalid representative ID', { representativeId, error: repError });
      return NextResponse.json(
        { success: false, error: 'Representative not found' },
        { status: 404 }
      );
    }

    // Check for existing active thread with same representative
    const { data: existingThread } = await supabase
      .from('contact_threads')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('representative_id', validatedRepId)
      .eq('status', 'active')
      .single();

    if (existingThread) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Active thread already exists with this representative',
          existingThreadId: existingThread.id
        },
        { status: 409 }
      );
    }

    // Create new thread with sanitized values
    const { data: thread, error: threadError } = await supabase
      .from('contact_threads')
      .insert({
        user_id: user.id,
        representative_id: validatedRepId,
        subject: sanitizedSubject,
        priority: validatedPriority,
        status: 'active'
      })
      .select(`
        id,
        user_id,
        representative_id,
        subject,
        status,
        priority,
        created_at,
        updated_at,
        last_message_at,
        message_count
      `)
      .single();

    if (threadError || !thread) {
      logger.error('Failed to create thread', new Error(threadError?.message ?? 'Unknown error'), { error: threadError });
      return NextResponse.json(
        { success: false, error: 'Failed to create thread' },
        { status: 500 }
      );
    }

    // Create initial message if provided (with sanitization)
    if (initialMessage?.trim()) {
      const initialMessageValidation = sanitizeMessageContent(initialMessage.trim());
      if (initialMessageValidation.isValid) {
        const { error: messageError } = await supabase
          .from('contact_messages')
          .insert({
            thread_id: thread.id,
            sender_id: user.id,
            recipient_id: validatedRepId,
            content: initialMessageValidation.sanitized,
            subject: sanitizedSubject,
            priority: validatedPriority,
            message_type: 'text',
            status: 'sent'
          });

        if (messageError) {
          logger.error('Failed to create initial message', new Error(messageError?.message ?? 'Unknown error'), { error: messageError });
          // Don't fail thread creation if initial message fails
        }
      } else {
        logger.warn('Initial message contains invalid content, skipping', { error: initialMessageValidation.error });
      }
    }

    logger.info('Thread created successfully', {
      threadId: thread.id,
      userId: user.id,
      representativeId: validatedRepId.toString(),
      subject: sanitizedSubject
    });

    return NextResponse.json({
      success: true,
      thread: {
        id: thread.id,
        userId: thread.user_id,
        representativeId: thread.representative_id,
        subject: thread.subject,
        status: thread.status,
        priority: thread.priority,
        createdAt: thread.created_at,
        updatedAt: thread.updated_at,
        lastMessageAt: thread.last_message_at,
        messageCount: thread.message_count,
        representative: {
          id: representative.id,
          name: representative.name,
          office: representative.office,
          party: representative.party
        }
      }
    });

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error creating thread:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Update Thread Status
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    // Get Supabase client
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { threadId, status, priority } = body;

    if (!threadId) {
      return NextResponse.json(
        { success: false, error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    // Verify thread ownership
    const { data: thread, error: threadError } = await supabase
      .from('contact_threads')
      .select('id, user_id, status')
      .eq('id', threadId)
      .eq('user_id', user.id)
      .single();

    if (threadError || !thread) {
      return NextResponse.json(
        { success: false, error: 'Thread not found or access denied' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    // Update thread
    const { data: updatedThread, error: updateError } = await supabase
      .from('contact_threads')
      .update(updateData)
      .eq('id', threadId)
      .select(`
        id,
        user_id,
        representative_id,
        subject,
        status,
        priority,
        updated_at
      `)
      .single();

    if (updateError || !updatedThread) {
      logger.error('Failed to update thread', new Error(updateError?.message ?? 'Unknown error'), { error: updateError });
      return NextResponse.json(
        { success: false, error: 'Failed to update thread' },
        { status: 500 }
      );
    }

    logger.info('Thread updated successfully', {
      threadId,
      userId: user.id,
      updates: updateData
    });

    return NextResponse.json({
      success: true,
      thread: updatedThread
    });

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error updating thread:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
