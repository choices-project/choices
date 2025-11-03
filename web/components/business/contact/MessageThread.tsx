/**
 * Message Thread Component
 * 
 * Displays a conversation thread between a user and representative.
 * Supports real-time message updates, message status indicators, and reply functionality.
 * 
 * Created: January 23, 2025
 * Status: ✅ IMPLEMENTATION READY
 */

'use client';

import { Send, Paperclip, Clock, CheckCircle, CheckCircle2, AlertCircle, User, Building2 } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { contactMessagingService } from '@/lib/contact/real-time-messaging';
import type { Message } from '@/lib/contact/real-time-messaging';
import { logger } from '@/lib/utils/logger';






// ============================================================================
// TYPES
// ============================================================================

type MessageThreadProps = {
  threadId: string;
  currentUserId: string;
  representative: {
    id: string;
    name: string;
    office: string;
    party: string;
  };
  className?: string;
}

type MessageBubbleProps = {
  message: Message;
  isCurrentUser: boolean;
  representative: {
    name: string;
    office: string;
  };
}

// ============================================================================
// MESSAGE BUBBLE COMPONENT
// ============================================================================

function MessageBubble({ message, isCurrentUser, representative }: MessageBubbleProps) {
  const getStatusIcon = () => {
    const status = (message as any).status as 'sent' | 'delivered' | 'read' | 'failed' | undefined;
    switch (status) {
      case 'sent':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCircle className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCircle2 className="w-3 h-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    const status = (message as any).status as 'sent' | 'delivered' | 'read' | 'failed' | undefined;
    switch (status) {
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'read':
        return 'Read';
      case 'failed':
        return 'Failed';
      default:
        return '';
    }
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'order-2' : 'order-1'}`}>
        {/* Sender Info */}
        {!isCurrentUser && (
          <div className="flex items-center space-x-2 mb-1">
            <div className="flex items-center space-x-1">
              <Building2 className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-600">{representative.name}</span>
            </div>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">{representative.office}</span>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`px-4 py-2 rounded-lg ${
            isCurrentUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          
          {/* Attachments */}
          {(message as any).metadata?.attachments && (message as any).metadata.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {(message as any).metadata.attachments.map((attachment: any, index: number) => (
                <div key={index} className="flex items-center space-x-2 text-xs opacity-75">
                  <Paperclip className="w-3 h-3" />
                  <span>{attachment.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Status */}
        <div className={`flex items-center space-x-1 mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-gray-500">
            {formatTimestamp(message.timestamp)}
          </span>
          {isCurrentUser && (
            <>
              <span className="text-xs text-gray-400">•</span>
              <div className="flex items-center space-x-1">
                {getStatusIcon()}
                <span className="text-xs text-gray-500">{getStatusText()}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MessageThread({ 
  threadId, 
  currentUserId, 
  representative, 
  className = '' 
}: MessageThreadProps) {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Constants
  const MAX_MESSAGE_LENGTH = 10000;

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [threadId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time message updates
  useEffect(() => {
    if (!threadId) return;

    const handleNewMessage = (message: Message) => {
      setMessages(prev => {
        // Check if message already exists to avoid duplicates
        const exists = prev.some(m => m.id === message.id);
        if (exists) return prev;
        
        return [...prev, message].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });
    };

    const unsubscribe = contactMessagingService.subscribeToMessages(
      threadId,
      handleNewMessage
    );

    return unsubscribe;
  }, [threadId]);

  // ============================================================================
  // FUNCTIONS
  // ============================================================================

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/contact/messages?threadId=${threadId}`);
      const result = await response.json();

      if (result.success) {
        setMessages(result.messages || []);
      } else {
        setError(result.error || 'Failed to load messages');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load messages';
      setError(errorMsg);
      logger.error('Error loading messages', err instanceof Error ? err : new Error(String(err)), { threadId });
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const sent = await contactMessagingService.sendMessage({
        content: messageContent,
        senderId: currentUserId,
        recipientId: representative.id
      } as any);
      if (!sent?.id) {
        setError('Failed to send message');
        setNewMessage(messageContent);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMsg);
      setNewMessage(messageContent); // Restore message on failure
      logger.error('Error sending message', err instanceof Error ? err : new Error(String(err)), { threadId });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          <span>Loading messages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Thread Header */}
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {representative.name}
            </h3>
            <p className="text-sm text-gray-600">
              {representative.office} • {representative.party}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm">No messages yet</p>
              <p className="text-xs text-gray-400">Start the conversation below</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isCurrentUser={message.senderId === currentUserId}
              representative={representative}
            />
          ))
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={2}
              maxLength={MAX_MESSAGE_LENGTH}
              disabled={isSending}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">
                {newMessage.length} / {MAX_MESSAGE_LENGTH} characters
              </span>
              <span className="text-xs text-gray-400">
                Press Enter to send, Shift+Enter for new line
              </span>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending || newMessage.length > MAX_MESSAGE_LENGTH}
            className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}