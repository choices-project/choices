/**
 * Contact Messages Hooks
 * 
 * Custom hooks for managing contact messages and threads
 * Features:
 * - Send messages to representatives
 * - Retrieve message history
 * - Real-time updates
 * - Error handling
 * 
 * Created: January 23, 2025
 * Status: ✅ ACTIVE
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ContactMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  recipient_id: number;
  content: string;
  subject?: string;
  message_type: 'text' | 'email' | 'attachment' | 'system';
  status: 'sent' | 'delivered' | 'read' | 'replied' | 'failed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  read_at?: string;
  replied_at?: string;
}

interface ContactThread {
  id: string;
  user_id: string;
  representative_id: number;
  subject: string;
  status: 'active' | 'closed' | 'archived' | 'spam';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  message_count: number;
}

interface SendMessageData {
  thread_id: string;
  sender_id: string;
  recipient_id: number;
  content: string;
  subject?: string;
  message_type?: 'text' | 'email' | 'attachment' | 'system';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface CreateThreadData {
  user_id: string;
  representative_id: number;
  subject: string;
  status?: 'active' | 'closed' | 'archived' | 'spam';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export function useContactMessages(representativeId: string) {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchMessages = useCallback(async () => {
    if (!representativeId || !user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/contact/messages?representative_id=${representativeId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [representativeId, user]);

  const sendMessage = useCallback(async (messageData: SendMessageData): Promise<ContactMessage> => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/contact/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`,
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      const data = await response.json();
      const newMessage = data.message;

      // Add to local state
      setMessages(prev => [...prev, newMessage]);

      return newMessage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch messages on mount
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    refetch: fetchMessages,
  };
}

export function useContactThreads() {
  const [threads, setThreads] = useState<ContactThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchThreads = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/contact/threads', {
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch threads: ${response.statusText}`);
      }

      const data = await response.json();
      setThreads(data.threads || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch threads');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createThread = useCallback(async (threadData: CreateThreadData): Promise<ContactThread> => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/contact/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`,
        },
        body: JSON.stringify(threadData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create thread: ${response.statusText}`);
      }

      const data = await response.json();
      const newThread = data.thread;

      // Add to local state
      setThreads(prev => [...prev, newThread]);

      return newThread;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create thread');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch threads on mount
  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  return {
    threads,
    loading,
    error,
    createThread,
    refetch: fetchThreads,
  };
}
