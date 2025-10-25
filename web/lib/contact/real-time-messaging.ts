/**
 * @fileoverview Real-time Messaging Service
 * 
 * Provides real-time messaging capabilities using Supabase real-time subscriptions.
 * Handles message delivery, status updates, and thread notifications.
 * 
 * @author Choices Platform Team
 * @created 2025-10-24
 * @version 2.0.0
 * @since 1.0.0
 */

import { createClient } from '../../utils/supabase/client';
import { type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../logger';

// ============================================================================
// TYPES
// ============================================================================

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  recipientId: string;
  content: string;
  subject: string;
  status: 'sent' | 'delivered' | 'read' | 'replied' | 'failed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  messageType: 'text' | 'email' | 'attachment' | 'system';
  attachments: any[];
  createdAt: string;
  readAt?: string;
  repliedAt?: string;
  metadata: any;
}

export interface Thread {
  id: string;
  userId: string;
  representativeId: string;
  subject: string;
  status: 'active' | 'closed' | 'archived' | 'spam';
  priority: 'low' | 'normal' | 'high' | 'urgent';
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

export interface MessageStatusUpdate {
  messageId: string;
  threadId: string;
  status: string;
  timestamp: string;
}

export interface NewMessageNotification {
  messageId: string;
  threadId: string;
  senderId: string;
  recipientId: string;
  content: string;
  subject: string;
  priority: string;
  timestamp: string;
}

// ============================================================================
// REAL-TIME MESSAGING SERVICE
// ============================================================================

export class ContactMessagingService {
  private supabase: any;
  private channels: Map<string, RealtimeChannel> = new Map();

  constructor() {
    this.supabase = createClient();
  }

  // ============================================================================
  // MESSAGE SUBSCRIPTIONS
  // ============================================================================

  /**
   * Subscribe to new messages for a specific user
   */
  subscribeToUserMessages(
    userId: string,
    onNewMessage: (message: Message) => void,
    onError?: (error: Error) => void
  ): RealtimeChannel {
    const channelName = `user_messages_${userId}`;
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contact_messages',
          filter: `recipient_id=eq.${userId}`
        },
        (payload: any) => {
          try {
            const message = this.transformMessage(payload.new);
            onNewMessage(message);
            logger.debug('New message received', { messageId: message.id, userId });
          } catch (error) {
            logger.error('Error processing new message', error instanceof Error ? error : new Error(String(error)), { payload });
            onError?.(error as Error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contact_messages',
          filter: `sender_id=eq.${userId}`
        },
        (payload: any) => {
          try {
            const message = this.transformMessage(payload.new);
            onNewMessage(message);
            logger.debug('Message sent confirmation', { messageId: message.id, userId });
          } catch (error) {
            logger.error('Error processing sent message', new Error("Error"), { error, payload });
            onError?.(error as Error);
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          logger.info('Subscribed to user messages', { userId, channelName });
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Error subscribing to user messages', new Error("Error"), { userId, channelName });
          onError?.(new Error('Failed to subscribe to user messages'));
        }
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to message status updates for a specific user
   */
  subscribeToMessageStatusUpdates(
    userId: string,
    onStatusUpdate: (update: MessageStatusUpdate) => void,
    onError?: (error: Error) => void
  ): RealtimeChannel {
    const channelName = `message_status_${userId}`;
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contact_messages',
          filter: `sender_id=eq.${userId}`
        },
        (payload: any) => {
          try {
            const update: MessageStatusUpdate = {
              messageId: payload.new.id,
              threadId: payload.new.thread_id,
              status: payload.new.status,
              timestamp: payload.new.updated_at
            };
            onStatusUpdate(update);
            logger.debug('Message status updated', { 
              messageId: update.messageId, 
              status: update.status,
              userId 
            });
          } catch (error) {
            logger.error('Error processing status update', new Error("Error"), { error, payload });
            onError?.(error as Error);
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          logger.info('Subscribed to message status updates', { userId, channelName });
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Error subscribing to status updates', new Error("Error"), { userId, channelName });
          onError?.(new Error('Failed to subscribe to status updates'));
        }
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to thread updates for a specific user
   */
  subscribeToThreadUpdates(
    userId: string,
    onThreadUpdate: (thread: Thread) => void,
    onError?: (error: Error) => void
  ): RealtimeChannel {
    const channelName = `user_threads_${userId}`;
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_threads',
          filter: `user_id=eq.${userId}`
        },
        (payload: any) => {
          try {
            const thread = this.transformThread(payload.new);
            onThreadUpdate(thread);
            logger.debug('Thread updated', { threadId: thread.id, userId });
          } catch (error) {
            logger.error('Error processing thread update', new Error("Error"), { error, payload });
            onError?.(error as Error);
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          logger.info('Subscribed to thread updates', { userId, channelName });
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Error subscribing to thread updates', new Error("Error"), { userId, channelName });
          onError?.(new Error('Failed to subscribe to thread updates'));
        }
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to specific thread messages
   */
  subscribeToThreadMessages(
    threadId: string,
    onNewMessage: (message: Message) => void,
    onError?: (error: Error) => void
  ): RealtimeChannel {
    const channelName = `thread_messages_${threadId}`;
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contact_messages',
          filter: `thread_id=eq.${threadId}`
        },
        (payload: any) => {
          try {
            const message = this.transformMessage(payload.new);
            onNewMessage(message);
            logger.debug('New message in thread', { messageId: message.id, threadId });
          } catch (error) {
            logger.error('Error processing thread message', new Error("Error"), { error, payload });
            onError?.(error as Error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contact_messages',
          filter: `thread_id=eq.${threadId}`
        },
        (payload: any) => {
          try {
            const message = this.transformMessage(payload.new);
            onNewMessage(message);
            logger.debug('Message updated in thread', { messageId: message.id, threadId });
          } catch (error) {
            logger.error('Error processing thread message update', new Error("Error"), { error, payload });
            onError?.(error as Error);
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          logger.info('Subscribed to thread messages', { threadId, channelName });
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Error subscribing to thread messages', new Error("Error"), { threadId, channelName });
          onError?.(new Error('Failed to subscribe to thread messages'));
        }
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  // ============================================================================
  // MESSAGE ACTIONS
  // ============================================================================

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('contact_messages')
        .update({
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) {
        logger.error('Failed to mark message as read', new Error("Error"), { messageId, error });
        return false;
      }

      logger.debug('Message marked as read', { messageId });
      return true;
    } catch (error) {
      logger.error('Error marking message as read', new Error("Error"), { messageId, error });
      return false;
    }
  }

  /**
   * Mark message as replied
   */
  async markMessageAsReplied(messageId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('contact_messages')
        .update({
          status: 'replied',
          replied_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) {
        logger.error('Failed to mark message as replied', new Error("Error"), { messageId, error });
        return false;
      }

      logger.debug('Message marked as replied', { messageId });
      return true;
    } catch (error) {
      logger.error('Error marking message as replied', new Error("Error"), { messageId, error });
      return false;
    }
  }

  /**
   * Send message via API
   */
  async sendMessage(messageData: {
    threadId?: string;
    representativeId: number;  // ← Frontend sends number, JSON serializes to string
    subject: string;
    content: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    messageType?: 'text' | 'email' | 'attachment';
    attachments?: any[];
  }): Promise<{ success: boolean; message?: Message; error?: string }> {
    try {
      const response = await fetch('/api/contact/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      const result = await response.json();

      if (!result.success) {
        logger.error('Failed to send message', new Error("Error"), { error: result.error });
        return { success: false, error: result.error };
      }

      logger.info('Message sent successfully', { messageId: result.message.id });
      return { success: true, message: result.message };
    } catch (error) {
      logger.error('Error sending message', new Error("Error"), { error });
      return { success: false, error: 'Failed to send message' };
    }
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
      logger.debug('Unsubscribed from channel', { channelName });
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    this.channels.forEach((channel, channelName) => {
      channel.unsubscribe();
      logger.debug('Unsubscribed from channel', { channelName });
    });
    this.channels.clear();
    logger.info('Unsubscribed from all channels');
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  private transformMessage(data: any): Message {
    return {
      id: data.id,
      threadId: data.thread_id,
      senderId: data.sender_id,
      recipientId: data.recipient_id,
      content: data.content,
      subject: data.subject,
      status: data.status,
      priority: data.priority,
      messageType: data.message_type,
      attachments: data.attachments || [],
      createdAt: data.created_at,
      readAt: data.read_at,
      repliedAt: data.replied_at,
      metadata: data.metadata || {}
    };
  }

  private transformThread(data: any): Thread {
    return {
      id: data.id,
      userId: data.user_id,
      representativeId: data.representative_id,
      subject: data.subject,
      status: data.status,
      priority: data.priority,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastMessageAt: data.last_message_at,
      messageCount: data.message_count,
      representative: data.representatives_core || {
        id: data.representative_id,
        name: 'Unknown Representative',
        office: 'Unknown Office',
        party: 'Unknown Party'
      }
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const contactMessagingService = new ContactMessagingService();

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useEffect, useState, useCallback } from 'react';

/**
 * Hook for real-time message updates
 */
export function useContactMessages(userId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNewMessage = useCallback((message: Message) => {
    setMessages(prev => [message, ...prev]);
  }, []);

  const handleError = useCallback((err: Error) => {
    setError(err.message);
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channel = contactMessagingService.subscribeToUserMessages(
      userId,
      handleNewMessage,
      handleError
    );

    setIsConnected(true);
    setError(null);

    return () => {
      contactMessagingService.unsubscribe(`user_messages_${userId}`);
      setIsConnected(false);
    };
  }, [userId, handleNewMessage, handleError]);

  return {
    messages,
    isConnected,
    error,
    sendMessage: contactMessagingService.sendMessage.bind(contactMessagingService),
    markAsRead: contactMessagingService.markMessageAsRead.bind(contactMessagingService)
  };
}

/**
 * Hook for real-time thread updates
 */
export function useContactThreads(userId: string) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleThreadUpdate = useCallback((thread: Thread) => {
    setThreads(prev => {
      const existingIndex = prev.findIndex(t => t.id === thread.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = thread;
        return updated;
      }
      return [thread, ...prev];
    });
  }, []);

  const handleError = useCallback((err: Error) => {
    setError(err.message);
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channel = contactMessagingService.subscribeToThreadUpdates(
      userId,
      handleThreadUpdate,
      handleError
    );

    setIsConnected(true);
    setError(null);

    return () => {
      contactMessagingService.unsubscribe(`user_threads_${userId}`);
      setIsConnected(false);
    };
  }, [userId, handleThreadUpdate, handleError]);

  return {
    threads,
    isConnected,
    error
  };
}
