/**
 * Contact Modal Component
 * 
 * Modal for users to send messages to their representatives
 * Features:
 * - Direct messaging to representatives
 * - Message threading
 * - Real-time updates
 * - Mobile-optimized interface
 * 
 * Created: January 23, 2025
 * Status: ✅ ACTIVE
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  PaperAirplaneIcon, 
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useContactMessages, useContactThreads } from '../hooks/useContactMessages';
import { useFeatureFlag } from '@/features/pwa/hooks/useFeatureFlags';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  representative: {
    id: number;
    name: string;
    office: string;
    party?: string;
    photo?: string;
  };
  userId: string;
}

export default function ContactModal({ 
  isOpen, 
  onClose, 
  representative, 
  userId 
}: ContactModalProps) {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Feature flag check
  const { enabled: contactSystemEnabled } = useFeatureFlag('CONTACT_INFORMATION_SYSTEM');

  // Contact hooks
  const { 
    messages, 
    loading: messagesLoading, 
    error: messagesError,
    sendMessage 
  } = useContactMessages(representative.id.toString());

  const { 
    threads, 
    loading: threadsLoading,
    createThread 
  } = useContactThreads();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMessage('');
      setSubject('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!message.trim() || !subject.trim()) {
      setError('Please fill in both subject and message');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create thread if it doesn't exist
      let threadId = threads.find(t => t.representative_id === representative.id)?.id;
      
      if (!threadId) {
        const newThread = await createThread({
          user_id: userId,
          representative_id: representative.id,
          subject,
          status: 'active'
        });
        threadId = newThread.id;
      }

      // Send message
      await sendMessage({
        thread_id: threadId,
        sender_id: userId,
        recipient_id: representative.id,
        content: message,
        subject,
        message_type: 'text',
        priority: 'normal'
      });

      setSuccess(true);
      setMessage('');
      setSubject('');
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  if (!contactSystemEnabled) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <div className="flex items-center justify-center mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
          </div>
          <p className="text-yellow-800 text-center">
            Contact system is currently disabled. This feature will be available soon.
          </p>
          <button
            onClick={onClose}
            className="mt-4 w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Contact {representative.name}
              </h2>
              <p className="text-sm text-gray-600">{representative.office}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Representative Info */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            {representative.photo ? (
              <img
                src={representative.photo}
                alt={representative.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {representative.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
            )}
            <div>
              <h3 className="font-medium text-gray-900">{representative.name}</h3>
              <p className="text-sm text-gray-600">{representative.office}</p>
              {representative.party && (
                <p className="text-xs text-gray-500">{representative.party}</p>
              )}
            </div>
          </div>

          {/* Message Form */}
          <div className="space-y-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What is this message about?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircleIcon className="h-5 w-5" />
              <span className="text-sm">Message sent successfully!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <ClockIcon className="h-4 w-4" />
            <span>Messages are typically responded to within 2-3 business days</span>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !message.trim() || !subject.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4" />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
