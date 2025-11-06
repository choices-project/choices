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

import { withErrorHandling, rateLimitError } from '@/lib/api';
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
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.warn('Unauthenticated message creation attempt');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: CreateMessageRequest = await request.json();
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
      return NextResponse.json(
        { 
          success: false, 
          error: 'Representative ID, subject, and content are required' 
        },
        { status: 400 }
      );
    }

    // Validate representative ID
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

    // Thread ID validation will happen later when we check/create the thread

    // Sanitize and validate subject
    const subjectValidation = sanitizeSubject(subject);
    if (!subjectValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: subjectValidation.error ?? 'Invalid subject' 
        },
        { status: 400 }
      );
    }

    // Sanitize and validate content
    const contentValidation = sanitizeMessageContent(content);
    if (!contentValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: contentValidation.error ?? 'Invalid message content' 
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

    // Validate message type
    const messageTypeValidation = validateMessageType(messageType);
    if (!messageTypeValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: messageTypeValidation.error ?? 'Invalid message type' 
        },
        { status: 400 }
      );
    }

    // Use sanitized values
    const sanitizedSubject = subjectValidation.sanitized;
    const sanitizedContent = contentValidation.sanitized;
    const validatedRepId = repIdValidation.parsedId!;
    const validatedPriority = priorityValidation.parsedPriority!;
    const validatedMessageType = messageTypeValidation.parsedType!;

    // Check if representative exists (representativeId is database primary key)
    const { data: representative, error: repError } = await supabase
      .from('representatives_core')
      .select('id, name, office')
      .eq('id', validatedRepId)
      .single();

    if (repError || !representative) {
      logger.warn('Invalid representative ID', { representativeId, error: repError });
      return NextResponse.json(
        { success: false, error: 'Representative not found' },
        { status: 404 }
      );
    }

    // Handle thread: get existing or create new
    let finalThreadId: string;
    
    if (threadId) {
      // Validate thread exists and belongs to user
      const threadIdValidation = validateThreadId(threadId);
      if (!threadIdValidation.isValid || !threadIdValidation.parsedId) {
        return NextResponse.json(
          { 
            success: false, 
            error: threadIdValidation.error ?? 'Invalid thread ID' 
          },
          { status: 400 }
        );
      }
      
      const { data: existingThread, error: threadError } = await supabase
        .from('contact_threads')
        .select('id, user_id')
        .eq('id', threadIdValidation.parsedId)
        .single();
      
      if (threadError || !existingThread) {
        return NextResponse.json(
          { success: false, error: 'Thread not found' },
          { status: 404 }
        );
      }
      
      if (existingThread.user_id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized access to thread' },
          { status: 403 }
        );
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
        return NextResponse.json(
          { success: false, error: 'Failed to create thread' },
          { status: 500 }
        );
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
      return NextResponse.json(
        { success: false, error: 'Failed to send message' },
        { status: 500 }
      );
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

    return NextResponse.json({
      success: true,
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

export async function GET(request: NextRequest): Promise<NextResponse> {
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
    const threadId = searchParams.get('threadId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Build query - optimized for performance
    // First, get user's representative IDs to avoid subquery in OR condition
    const { data: userRepresentatives } = await supabase
      .from('representatives_core')
      .select('id')
      .eq('user_id', user.id);
    
    const representativeIds = userRepresentatives?.map(r => r.id) ?? [];
    
    // Build optimized query - use explicit conditions instead of complex OR with subquery
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
    
    // Use more efficient query structure
    if (representativeIds.length > 0) {
      query = query.or(`sender_id.eq.${user.id},recipient_id.in.(${representativeIds.join(',')})`);
    } else {
      query = query.eq('sender_id', user.id);
    }
    
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
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
      return NextResponse.json(
        { success: false, error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Get total count for pagination - use same optimized approach
    let countQuery = supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true });
    
    if (representativeIds.length > 0) {
      countQuery = countQuery.or(`sender_id.eq.${user.id},recipient_id.in.(${representativeIds.join(',')})`);
    } else {
      countQuery = countQuery.eq('sender_id', user.id);
    }
    
    const { count: totalCount } = await countQuery;

    return NextResponse.json({
      success: true,
      messages: messages ?? [],
      pagination: {
        total: totalCount ?? 0,
        limit,
        offset,
        hasMore: (totalCount ?? 0) > offset + limit
      }
    });

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error fetching messages:', new Error(err?.message ?? 'Unknown error'), { error: err });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
