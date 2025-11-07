import logger from '@/lib/utils/logger';
/**
 * Real-time Messaging Service
 * 
 * Handles contact messaging functionality with real-time updates via polling
 * Integrates with the contact messages API for message sending and retrieval
 * 
 * Created: January 26, 2025
 * Status: ✅ IMPLEMENTED
 */
export type Message = {
  id: string;
  content: string;
  timestamp: Date;
  senderId: string;
  recipientId: string;
  threadId?: string;
  status?: 'sent' | 'delivered' | 'read';
  subject?: string;
}

type SubscribeCallback = (message: Message) => void;

// Store active subscriptions for polling
const subscriptions = new Map<string, {
  callback: SubscribeCallback;
  intervalId: ReturnType<typeof setInterval>;
  lastMessageId?: string;
}>();

/**
 * Send a message via the contact messages API
 */
export const contactMessagingService = {
  sendMessage: async (message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> => {
    try {
      // Determine thread ID - use provided or create new thread
      const response = await fetch('/api/contact/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId: message.threadId,
          representativeId: message.recipientId,
          subject: message.subject ?? 'Contact Message',
          content: message.content,
          priority: 'normal',
          messageType: 'text',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to send message' }));
        throw new Error(errorData.error ?? 'Failed to send message');
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.error ?? 'Failed to send message');
      }

      // Transform API response to Message type
      const sentMessage: Message = {
        id: result.data.id,
        content: result.data.content,
        timestamp: new Date(result.data.created_at),
        senderId: result.data.sender_id,
        recipientId: result.data.recipient_id ?? message.recipientId,
        threadId: result.data.thread_id,
        status: result.data.status ?? 'sent',
        subject: result.data.subject,
      };

      return sentMessage;
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  },
  
  /**
   * Get messages for a thread
   */
  getMessages: async (threadId: string): Promise<Message[]> => {
    try {
      const response = await fetch(`/api/contact/messages?threadId=${encodeURIComponent(threadId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch messages' }));
        throw new Error(errorData.error ?? 'Failed to fetch messages');
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        return [];
      }

      // Transform API response to Message array
      return (result.data.messages ?? []).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        senderId: msg.sender_id,
        recipientId: msg.recipient_id,
        threadId: msg.thread_id,
        status: msg.status ?? 'sent',
        subject: msg.subject,
      }));
    } catch (error) {
      logger.error('Error fetching messages:', error);
      return [];
    }
  },
  
  /**
   * Subscribe to real-time message updates via polling
   * Note: For true real-time, consider implementing WebSockets or Server-Sent Events
   */
  subscribeToMessages: (threadId: string, callback: SubscribeCallback): (() => void) => {
    // Clear existing subscription if any
    const existing = subscriptions.get(threadId);
    if (existing) {
      clearInterval(existing.intervalId);
    }

    let lastMessageId: string | undefined;

    // Poll for new messages every 3 seconds
    const intervalId = setInterval(async () => {
      try {
        const messages = await contactMessagingService.getMessages(threadId);
        
        // Find new messages
        if (lastMessageId) {
          const newMessages = messages.filter(msg => {
            // Check if this message is newer than the last one we saw
            return msg.id !== lastMessageId && 
                   messages.findIndex(m => m.id === lastMessageId) < messages.findIndex(m => m.id === msg.id);
          });
          
          // Call callback for each new message
          newMessages.forEach(callback);
        } else {
          // First poll - set last message ID
          const lastMessage = messages[messages.length - 1];
          if (lastMessage) {
            lastMessageId = lastMessage.id;
          }
        }

        // Update last message ID to the most recent
        const lastMessage = messages[messages.length - 1];
        if (lastMessage) {
          lastMessageId = lastMessage.id;
        }
      } catch (error) {
        logger.error('Error polling for messages:', error);
      }
    }, 3000); // Poll every 3 seconds

    // Store subscription
    subscriptions.set(threadId, {
      callback,
      intervalId,
      ...(lastMessageId && { lastMessageId })
    } as any);

    // Return unsubscribe function
    return () => {
      clearInterval(intervalId);
      subscriptions.delete(threadId);
    };
  },
};
