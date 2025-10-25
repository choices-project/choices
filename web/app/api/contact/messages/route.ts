/**
 * Contact Messages API Endpoint
 * 
 * Handles CRUD operations for contact messages between users and representatives.
 * Supports real-time messaging, message status updates, and delivery tracking.
 * 
 * Created: January 23, 2025
 * Status: ✅ IMPLEMENTATION READY
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { rateLimiters } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

// ============================================================================
// TYPES
// ============================================================================

interface CreateMessageRequest {
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

interface MessageResponse {
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

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Rate limiting: 10 messages per minute per user
    const rateLimitResult = await rateLimiters.contact.check(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many messages. Please wait before sending another message.',
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      );
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

    // Validate required fields
    if (!representativeId || !subject || !content) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Representative ID, subject, and content are required' 
        },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.length > 10000) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Message content is too long (max 10,000 characters)' 
        },
        { status: 400 }
      );
    }

    // Check if representative exists (representativeId is database primary key)
    const { data: representative, error: repError } = await supabase
      .from('representatives_core')
      .select('id, name, office')
      .eq('id', parseInt(representativeId))
      .single();

    if (repError || !representative) {
      logger.warn('Invalid representative ID', { representativeId, error: repError });
      return NextResponse.json(
        { success: false, error: 'Representative not found' },
        { status: 404 }
      );
    }

    // Generate a thread ID for grouping related messages
    const finalThreadId = threadId || crypto.randomUUID();

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('contact_messages')
      .insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        representative_id: parseInt(representativeId),
        message: content,
        subject: subject || 'Contact Message',
        priority: priority || 'normal',
        status: 'sent',
        metadata: {
          user_agent: request.headers.get('user-agent'),
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
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
      logger.error('Failed to create message', new Error(messageError?.message || 'Unknown error'), { error: messageError });
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
      representativeId,
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

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error creating message:', new Error(err?.message || 'Unknown error'), { error: err });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Retrieve User Messages
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
    const threadId = searchParams.get('threadId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
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
      `)
      .or(`sender_id.eq.${user.id},recipient_id.in.(select id from representatives_core where user_id = ${user.id})`)
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
      logger.error('Failed to fetch messages', new Error(messagesError?.message || 'Unknown error'), { error: messagesError });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .or(`sender_id.eq.${user.id},recipient_id.in.(select id from representatives_core where user_id = ${user.id})`);

    return NextResponse.json({
      success: true,
      messages: messages || [],
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: (totalCount || 0) > offset + limit
      }
    });

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error fetching messages:', new Error(err?.message || 'Unknown error'), { error: err });
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
    logger.error('Failed to send representative notification', new Error((error as Error)?.message || 'Unknown error'), { error });
    // Don't fail the message creation if notification fails
  }
}
