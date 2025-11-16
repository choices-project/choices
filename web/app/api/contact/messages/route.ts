/**
 * Contact Messages API Endpoint
 * 
 * Handles CRUD operations for contact messages between users and representatives.
 * Supports real-time messaging, message status updates, and delivery tracking.
 * 
 * Created: January 23, 2025
 * Updated: November 6, 2025 - Modernized
 * Status: ✅ PRODUCTION READY
 */

import type { NextRequest } from 'next/server';

import {
  authError,
  errorResponse,
  forbiddenError,
  notFoundError,
  rateLimitError,
  successResponse,
  validationError,
  withErrorHandling,
  parseBody,
} from '@/lib/api';
import { apiRateLimiter } from '@/lib/rate-limiting/api-rate-limiter';
import {
  sanitizeMessageContent,
  sanitizeSubject,
  validateRepresentativeId,
  validateThreadId,
  validatePriority,
  validateMessageType,
} from '@/lib/security/input-sanitization';
import { logger } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// ============================================================================
// TYPES
// ============================================================================

type CreateMessageRequest = {
  threadId?: string;
  representativeId: string;
  subject: string;
  content: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  messageType?: 'text' | 'email' | 'attachment';
  attachments?: Array<{
    name: string;
    size: number;
    type: string;
    url?: string;
  }>;
}

// MessageResponse type reserved for future API response standardization
type _MessageResponse = {
  id: string;
  threadId: string;
  senderId: string;
  recipientId: string;
  content: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  attachments: any[];
  metadata: any;
}

// ============================================================================
// POST - Create New Message
// ============================================================================

export const POST = withErrorHandling(async (request: NextRequest) => {
  const startTime = Date.now();
  
  // Rate limiting: 10 messages per minute per user
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
  const userAgent = request.headers.get('user-agent');
  const rateLimitOptions: any = {};
  if (userAgent) rateLimitOptions.userAgent = userAgent;
  const rateLimitResult = await apiRateLimiter.checkLimit(
    ip,
    '/api/contact/messages',
    rateLimitOptions
  );
  if (!rateLimitResult.allowed) {
    return rateLimitError('Too many messages. Please wait before sending another message.');
  }

    // Get Supabase client
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      logger.error('Supabase client not available');
      return errorResponse('Database connection not available', 500);
    }

    // Authentication
    const { data: { user }, error: authFetchError } = await supabase.auth.getUser();
    if (authFetchError || !user) {
      logger.warn('Unauthenticated message creation attempt');
      return authError('Authentication required');
    }

    // Parse request body
    const parsedBody = await parseBody<CreateMessageRequest>(request);
    if (!parsedBody.success) {
      return parsedBody.error;
    }
    const body = parsedBody.data;
    const {
      threadId,
      representativeId,
      subject,
      content,
      priority = 'normal',
      messageType = 'text',
      attachments = []
    } = body;

    // Validate and sanitize inputs
    if (!representativeId || !subject || !content) {
      const missing: Record<string, string> = {}
      if (!representativeId) missing.representativeId = 'Representative ID is required'
      if (!subject) missing.subject = 'Subject is required'
      if (!content) missing.content = 'Content is required'
      return validationError(missing, 'Representative ID, subject, and content are required')
    }

    // Validate representative ID
    const repIdValidation = validateRepresentativeId(representativeId);
    if (!repIdValidation.isValid) {
      return validationError(
        { representativeId: repIdValidation.error ?? 'Invalid representative ID' },
        'Invalid representative ID'
      );
    }

    // Thread ID validation will happen later when we check/create the thread

    // Sanitize and validate subject
    const subjectValidation = sanitizeSubject(subject);
    if (!subjectValidation.isValid) {
      return validationError(
        { subject: subjectValidation.error ?? 'Invalid subject' },
        'Invalid subject'
      );
    }

    // Sanitize and validate content
    const contentValidation = sanitizeMessageContent(content);
    if (!contentValidation.isValid) {
      return validationError(
        { content: contentValidation.error ?? 'Invalid message content' },
        'Invalid message content'
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

    // Validate message type
    const messageTypeValidation = validateMessageType(messageType);
    if (!messageTypeValidation.isValid) {
      return validationError(
        { messageType: messageTypeValidation.error ?? 'Invalid message type' },
        'Invalid message type'
      );
    }

    // Use sanitized values
    const sanitizedSubject = subjectValidation.sanitized;
    const sanitizedContent = contentValidation.sanitized;
    if (!repIdValidation.parsedId) {
      return validationError({ representativeId: 'Invalid representative ID' }, 'Invalid representative ID');
    }
    if (!priorityValidation.parsedPriority) {
      return validationError({ priority: 'Invalid priority' }, 'Invalid priority');
    }
    if (!messageTypeValidation.parsedType) {
      return validationError({ messageType: 'Invalid message type' }, 'Invalid message type');
    }
    const validatedRepId = repIdValidation.parsedId;
    const validatedPriority = priorityValidation.parsedPriority;
    const validatedMessageType = messageTypeValidation.parsedType;

    // Check if representative exists (representativeId is database primary key)
    const { data: representative, error: repError } = await supabase
      .from('representatives_core')
      .select('id, name, office')
      .eq('id', validatedRepId)
      .single();

    if (repError || !representative) {
      logger.warn('Invalid representative ID', { representativeId, error: repError });
      return notFoundError('Representative not found');
    }

    // Handle thread: get existing or create new
    let finalThreadId: string;
    
    if (threadId) {
      // Validate thread exists and belongs to user
      const threadIdValidation = validateThreadId(threadId);
      if (!threadIdValidation.isValid || !threadIdValidation.parsedId) {
        return validationError(
          { threadId: threadIdValidation.error ?? 'Invalid thread ID' },
          'Invalid thread ID'
        );
      }
      
      const { data: existingThread, error: threadError } = await supabase
        .from('contact_threads')
        .select('id, user_id')
        .eq('id', threadIdValidation.parsedId)
        .single();
      
      if (threadError || !existingThread) {
        return notFoundError('Thread not found');
      }
      
      if (existingThread.user_id !== user.id) {
        return forbiddenError('Unauthorized access to thread');
      }
      
      finalThreadId = threadIdValidation.parsedId;
    } else {
      // Create new thread
      const { data: newThread, error: threadError } = await supabase
        .from('contact_threads')
        .insert({
          user_id: user.id,
          representative_id: validatedRepId,
          subject: sanitizedSubject,
          priority: validatedPriority,
          status: 'active',
        })
        .select('id')
        .single();
      
      if (threadError || !newThread) {
        logger.error('Failed to create thread', new Error(threadError?.message ?? 'Unknown error'), { error: threadError });
        return errorResponse('Failed to create thread', 500);
      }
      
      finalThreadId = newThread.id;
    }

    // Create message with sanitized inputs and thread_id
    const { data: message, error: messageError } = await supabase
      .from('contact_messages')
      .insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        representative_id: validatedRepId,
        thread_id: finalThreadId,
        message: sanitizedContent,
        subject: sanitizedSubject ?? 'Contact Message',
        priority: validatedPriority,
        status: 'sent',
        message_type: validatedMessageType,
        attachments: attachments ?? [],
        metadata: {
          user_agent: request.headers.get('user-agent'),
          ip_address: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip'),
          created_via: 'api'
        }
      })
      .select(`
        id,
        user_id,
        representative_id,
        message,
        subject,
        status,
        priority,
        created_at,
        updated_at
      `)
      .single();

    if (messageError || !message) {
      logger.error('Failed to create message', new Error(messageError?.message ?? 'Unknown error'), { error: messageError });
      return errorResponse('Failed to send message', 500);
    }

    // Log delivery attempt
    await supabase
      .from('message_delivery_logs')
      .insert({
        message_id: message.id,
        delivery_status: 'sent',
        delivery_timestamp: new Date().toISOString(),
        retry_count: 1
      });

    // Send notification to representative (if they have notifications enabled)
    await sendRepresentativeNotification(supabase, message, representative);

    const responseTime = Date.now() - startTime;
    logger.info('Message created successfully', {
      messageId: message.id,
      threadId: finalThreadId,
      userId: user.id,
      representativeId: validatedRepId.toString(),
      responseTime
    });

    return successResponse({
      message: {
        id: message.id,
        userId: message.user_id,
        representativeId: message.representative_id,
        message: message.message,
        subject: message.subject,
        status: message.status,
        priority: message.priority,
        createdAt: message.created_at,
        updatedAt: message.updated_at
      },
      threadId: finalThreadId,
      responseTime
    });
});

// ============================================================================
// GET - Retrieve User Messages
// ============================================================================

export const GET = withErrorHandling(async (request: NextRequest) => {
    // Get Supabase client
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return errorResponse('Database connection not available', 500);
    }

    // Authentication
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return authError('Authentication required');
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Build query - optimized for performance
    const { data: userRepresentatives } = await supabase
      .from('representatives_core')
      .select('id')
      .eq('user_id', user.id);

    const representativeIds = userRepresentatives?.map((r) => r.id) ?? [];

    let query = supabase
      .from('contact_messages')
      .select(`
        id,
        thread_id,
        sender_id,
        recipient_id,
        content,
        subject,
        status,
        priority,
        message_type,
        attachments,
        created_at,
        read_at,
        replied_at,
        metadata,
        contact_threads!inner(
          id,
          subject,
          status,
          priority,
          representatives_core!inner(
            id,
            name,
            office,
            party
          )
        )
      `);

    if (representativeIds.length > 0) {
      query = query.or(`sender_id.eq.${user.id},recipient_id.in.(${representativeIds.join(',')})`);
    } else {
      query = query.eq('sender_id', user.id);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    if (threadId) {
      query = query.eq('thread_id', threadId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      logger.error('Failed to fetch messages', new Error(messagesError?.message ?? 'Unknown error'), { error: messagesError });
      return errorResponse('Failed to fetch messages', 500);
    }

    let countQuery = supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true });

    if (representativeIds.length > 0) {
      countQuery = countQuery.or(`sender_id.eq.${user.id},recipient_id.in.(${representativeIds.join(',')})`);
    } else {
      countQuery = countQuery.eq('sender_id', user.id);
    }

    const { count: totalCount, error: countError } = await countQuery;
    if (countError) {
      logger.error('Failed to count messages', new Error(countError?.message ?? 'Unknown error'), { error: countError });
      return errorResponse('Failed to fetch messages', 500);
    }

    return successResponse({
      messages: messages ?? [],
      pagination: {
        total: totalCount ?? 0,
        limit,
        offset,
        hasMore: (totalCount ?? 0) > offset + limit,
      },
    });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function sendRepresentativeNotification(
  supabase: any,
  message: any,
  representative: any
) {
  try {
    // Check if representative has notifications enabled using new schema
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('privacy_settings')
      .eq('user_id', representative.user_id)
      .single();

    const contactMessagesEnabled = userProfile?.privacy_settings?.contact_messages !== false;

    if (contactMessagesEnabled) {
      // Create notification
      await supabase
        .from('admin_notifications')
        .insert({
          type: 'new_message',
          title: 'New Message from Constituent',
          message: `You have received a new message from a constituent regarding: ${message.subject}`,
          data: {
            messageId: message.id,
            threadId: message.thread_id,
            senderId: message.sender_id,
            priority: message.priority
          },
          user_id: representative.user_id,
          status: 'unread'
        });

      logger.info('Representative notification sent', {
        representativeId: representative.id,
        messageId: message.id
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error ?? 'Unknown error');
    logger.error('Failed to send representative notification', new Error(errorMessage), { error });
    // Don't fail the message creation if notification fails
  }
}
