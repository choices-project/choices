/**
 * Real-time Messaging Service
 * 
 * Provides real-time messaging capabilities for contact forms and representative communication.
 * 
 * @author Choices Platform Team
 * @created 2025-10-26
 * @version 1.0.0
 * @since 1.0.0
 */

export interface Message {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  type: 'text' | 'file' | 'system';
  metadata?: Record<string, any>;
}

export interface SendMessageRequest {
  threadId?: string;
  representativeId: number;
  subject: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  messageType: 'text' | 'file' | 'system';
  attachments?: Array<{
    name: string;
    size: number;
    type: string;
  }>;
}

export interface SendMessageResult {
  success: boolean;
  message?: Message;
  error?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  representativeId?: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  id: string;
  filename: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}

export interface MessagingService {
  sendMessage: (request: SendMessageRequest) => Promise<SendMessageResult>;
  getMessages: (conversationId: string) => Promise<Message[]>;
  markAsRead: (messageId: string) => Promise<void>;
  subscribeToMessages: (conversationId: string, callback: (message: Message) => void) => () => void;
  sendContactMessage: (contactMessage: Omit<ContactMessage, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<ContactMessage>;
  getContactMessages: (representativeId?: string) => Promise<ContactMessage[]>;
  updateContactMessageStatus: (messageId: string, status: ContactMessage['status']) => Promise<void>;
}

class RealTimeMessagingService implements MessagingService {
  private messageSubscriptions: Map<string, Set<(message: Message) => void>> = new Map();
  private contactSubscriptions: Map<string, Set<(message: ContactMessage) => void>> = new Map();

  /**
   * Send a message
   */
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResult> {
    try {
      const message: Message = {
        id: this.generateId(),
        content: request.content,
        senderId: 'current-user', // This would come from auth context
        recipientId: request.representativeId.toString(),
        timestamp: new Date(),
        status: 'sent',
        type: request.messageType,
        metadata: {
          subject: request.subject,
          priority: request.priority,
          attachments: request.attachments || []
        }
      };

      // Simulate sending message
      console.log('Sending message:', message);
      
      // Notify subscribers
      this.notifyMessageSubscribers(message);

      return {
        success: true,
        message
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      };
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    // Simulate fetching messages
    return [
      {
        id: '1',
        content: 'Hello, how can I help you?',
        senderId: 'rep-1',
        recipientId: 'user-1',
        timestamp: new Date(Date.now() - 60000),
        status: 'read',
        type: 'text'
      },
      {
        id: '2',
        content: 'I have a question about voting procedures.',
        senderId: 'user-1',
        recipientId: 'rep-1',
        timestamp: new Date(Date.now() - 30000),
        status: 'delivered',
        type: 'text'
      }
    ];
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    console.log(`Marking message ${messageId} as read`);
    // In a real implementation, this would update the database
  }

  /**
   * Subscribe to messages for a conversation
   */
  subscribeToMessages(conversationId: string, callback: (message: Message) => void): () => void {
    if (!this.messageSubscriptions.has(conversationId)) {
      this.messageSubscriptions.set(conversationId, new Set());
    }
    
    this.messageSubscriptions.get(conversationId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = this.messageSubscriptions.get(conversationId);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.messageSubscriptions.delete(conversationId);
        }
      }
    };
  }

  /**
   * Send contact message
   */
  async sendContactMessage(contactData: Omit<ContactMessage, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<ContactMessage> {
    const contactMessage: ContactMessage = {
      ...contactData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending'
    };

    console.log('Sending contact message:', contactMessage);
    
    // Notify subscribers
    this.notifyContactSubscribers(contactMessage);

    return contactMessage;
  }

  /**
   * Get contact messages
   */
  async getContactMessages(representativeId?: string): Promise<ContactMessage[]> {
    // Simulate fetching contact messages
    return [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Question about local policies',
        message: 'I would like to know more about the new zoning regulations.',
        representativeId: representativeId || 'rep-1',
        status: 'pending',
        priority: 'medium',
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(Date.now() - 3600000)
      }
    ];
  }

  /**
   * Update contact message status
   */
  async updateContactMessageStatus(messageId: string, status: ContactMessage['status']): Promise<void> {
    console.log(`Updating contact message ${messageId} status to ${status}`);
    // In a real implementation, this would update the database
  }

  /**
   * Notify message subscribers
   */
  private notifyMessageSubscribers(message: Message): void {
    const subscribers = this.messageSubscriptions.get(message.recipientId);
    if (subscribers) {
      subscribers.forEach(callback => callback(message));
    }
  }

  /**
   * Notify contact subscribers
   */
  private notifyContactSubscribers(message: ContactMessage): void {
    const subscribers = this.contactSubscriptions.get(message.representativeId || 'all');
    if (subscribers) {
      subscribers.forEach(callback => callback(message));
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Export singleton instance
export const contactMessagingService = new RealTimeMessagingService();
export default contactMessagingService;
