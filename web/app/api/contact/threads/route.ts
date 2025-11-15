/**
 * Contact Threads API Endpoint
 * 
 * Handles CRUD operations for message threads between users and representatives.
 * Provides thread management, filtering, and real-time updates.
 * 
 * Created: January 23, 2025
 * Status: ✅ IMPLEMENTATION READY
 */

import type { NextRequest } from 'next/server';

import {
  authError,
  errorResponse,
  notFoundError,
  successResponse,
  validationError,
  withErrorHandling,
  parseBody,
} from '@/lib/api';
import {
  sanitizeSubject,
  sanitizeMessageContent,
  validateRepresentativeId,
  validatePriority,
} from '@/lib/security/input-sanitization';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

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

export const GET = withErrorHandling(async (request: NextRequest) => {
    // Get Supabase client
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return errorResponse('Database connection not available', 500);
    }

    // Authentication
    const { data: { user }, error: userFetchError } = await supabase.auth.getUser();
    if (userFetchError || !user) {
      return authError('Authentication required');
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
      return errorResponse('Failed to fetch threads', 500);
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

    const { count: totalCount, error: countError } = await countQuery;
    if (countError) {
      logger.error('Failed to count threads', new Error(countError?.message ?? 'Unknown error'), { error: countError });
      return errorResponse('Failed to fetch threads', 500);
    }

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

    return successResponse({
      threads: transformedThreads,
      pagination: {
        total: totalCount ?? 0,
        limit,
        offset,
        hasMore: (totalCount ?? 0) > offset + limit
      }
    });
});

// ============================================================================
// POST - Create New Thread
// ============================================================================

export const POST = withErrorHandling(async (request: NextRequest) => {
    // Get Supabase client
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return errorResponse('Database connection not available', 500);
    }

    // Authentication
    const { data: { user }, error: userFetchError } = await supabase.auth.getUser();
    if (userFetchError || !user) {
      return authError('Authentication required');
    }

    // Parse request body
    const parsedBody = await parseBody<CreateThreadRequest>(request);
    if (!parsedBody.success) {
      return parsedBody.error;
    }
    const body = parsedBody.data;
    const {
      representativeId,
      subject,
      priority = 'normal',
      initialMessage
    } = body;

    // Validate required fields
    if (!representativeId || !subject) {
      const missingFields: Record<string, string> = {};
      if (!representativeId) missingFields.representativeId = 'Representative ID is required';
      if (!subject) missingFields.subject = 'Subject is required';
      return validationError(missingFields, 'Representative ID and subject are required');
    }

    // Validate and sanitize representative ID
    const repIdValidation = validateRepresentativeId(representativeId);
    if (!repIdValidation.isValid) {
      return validationError(
        { representativeId: repIdValidation.error ?? 'Invalid representative ID' },
        'Invalid representative ID'
      );
    }

    // Sanitize and validate subject
    const subjectValidation = sanitizeSubject(subject, 255);
    if (!subjectValidation.isValid) {
      return validationError(
        { subject: subjectValidation.error ?? 'Invalid subject' },
        'Invalid subject'
      );
    }

    // Validate priority
    const priorityValidation = validatePriority(priority);
    if (!priorityValidation.isValid) {
      return validationError(
        { priority: priorityValidation.error ?? 'Invalid priority' },
        'Invalid priority'
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
      return notFoundError('Representative not found');
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
      return errorResponse(
        'Active thread already exists with this representative',
        409,
        { existingThreadId: existingThread.id },
        'THREAD_EXISTS'
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
      return errorResponse('Failed to create thread', 500);
    }

    // Create initial message if provided (with sanitization)
    if (initialMessage?.trim()) {
      const initialMessageValidation = sanitizeMessageContent(initialMessage.trim());
      if (initialMessageValidation.isValid) {
        const { error: messageError } = await supabase
          .from('contact_messages')
          .insert({
            thread_id: thread.id,
            user_id: user.id,
            representative_id: validatedRepId,
            message: initialMessageValidation.sanitized,
            subject: sanitizedSubject,
            priority: validatedPriority,
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

    return successResponse({
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
});

// ============================================================================
// PUT - Update Thread Status
// ============================================================================

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return errorResponse('Database connection not available', 500);
  }

  const { data: { user }, error: userFetchError } = await supabase.auth.getUser();
  if (userFetchError || !user) {
    return authError('Authentication required');
  }

  const body = await request.json().catch(() => null);
  const threadId = body?.threadId as string | undefined;
  const status = body?.status as string | undefined;
  const priority = body?.priority as string | undefined;

  if (!threadId) {
    return validationError({ threadId: 'Thread ID is required' });
  }

  const { data: thread, error: threadError } = await supabase
    .from('contact_threads')
    .select('id, user_id, status')
    .eq('id', threadId)
    .eq('user_id', user.id)
    .single();

  if (threadError || !thread) {
    return notFoundError('Thread not found or access denied');
  }

  const updateData: Record<string, unknown> = {};
  if (status) updateData.status = status;
  if (priority) updateData.priority = priority;

  if (Object.keys(updateData).length === 0) {
    return validationError({ updates: 'No valid updates provided' });
  }

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
    return errorResponse('Failed to update thread', 500);
  }

  logger.info('Thread updated successfully', {
    threadId,
    userId: user.id,
    updates: updateData
  });

  return successResponse({
    thread: updatedThread
  });
});
