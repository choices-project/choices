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

import { 
  XMarkIcon, 
  PaperAirplaneIcon, 
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { useFeatureFlag } from '@/features/pwa/hooks/useFeatureFlags';

import { useContactMessages, useContactThreads } from '../hooks/useContactMessages';
import { useMessageTemplates } from '../hooks/useMessageTemplates';


type ContactModalProps = {
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
  const [showTemplates, setShowTemplates] = useState(false);
  // Store template values locally for immediate UI updates
  const [localTemplateValues, setLocalTemplateValues] = useState<Record<string, string>>({});

  // Feature flag check
  const { enabled: contactSystemEnabled } = useFeatureFlag('CONTACT_INFORMATION_SYSTEM');

  // Template hook
  const {
    templatesByCategory,
    selectedTemplate,
    selectTemplate,
    updateTemplateValue,
    filledTemplate,
    validation,
    resetTemplate,
  } = useMessageTemplates();

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
      setShowTemplates(false);
      setLocalTemplateValues({});
      resetTemplate();
    }
  }, [isOpen, resetTemplate]);

  // Initialize local template values when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      const initialValues: Record<string, string> = {};
      selectedTemplate.placeholders.forEach(placeholder => {
        initialValues[placeholder.key] = localTemplateValues[placeholder.key] ?? '';
      });
      setLocalTemplateValues(initialValues);
    }
  }, [selectedTemplate]);

  // Apply filled template when it's ready
  useEffect(() => {
    if (filledTemplate && selectedTemplate) {
      setSubject(filledTemplate.subject);
      setMessage(filledTemplate.body);
    }
  }, [filledTemplate, selectedTemplate]);

  // Memoize thread lookup for performance
  const existingThreadId = useMemo(() => {
    return threads.find(t => t.representative_id === representative.id)?.id;
  }, [threads, representative.id]);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !subject.trim()) {
      setError('Please fill in both subject and message');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create thread if it doesn't exist
      let threadId = existingThreadId;
      
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
  }, [message, subject, existingThreadId, representative.id, userId, sendMessage, createThread, onClose]);

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

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Focus trap: focus first focusable element
      const firstInput = document.querySelector('#subject') as HTMLInputElement;
      firstInput?.focus();
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
      aria-describedby="contact-modal-description"
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
            <div>
              <h2 id="contact-modal-title" className="text-lg font-semibold text-gray-900">
                Contact {representative.name}
              </h2>
              <p id="contact-modal-description" className="text-sm text-gray-600">{representative.office}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close contact modal"
            type="button"
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
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

          {/* Template Selector */}
          <div className="space-y-2">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              aria-expanded={showTemplates}
              aria-controls="template-selector"
              type="button"
            >
              <DocumentTextIcon className="h-4 w-4" aria-hidden="true" />
              <span>{selectedTemplate ? `Using: ${selectedTemplate.title}` : 'Use a Template'}</span>
            </button>
            
            {showTemplates && (
              <div 
                id="template-selector"
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto"
                role="listbox"
                aria-label="Message templates"
              >
                <p className="text-xs font-medium text-gray-700 mb-3">Select a template:</p>
                <div className="space-y-2">
                  {Object.entries(templatesByCategory).map(([category, templates]) => (
                    <div key={category}>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{category}</p>
                      {templates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => {
                            selectTemplate(template.id);
                            setShowTemplates(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-white transition-colors ${
                            selectedTemplate?.id === template.id ? 'bg-blue-100 text-blue-900' : 'text-gray-700'
                          }`}
                          role="option"
                          aria-selected={selectedTemplate?.id === template.id}
                          type="button"
                        >
                          <div className="font-medium">{template.title}</div>
                          <div className="text-xs text-gray-500">{template.description}</div>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
                {selectedTemplate && (
                  <button
                    onClick={() => {
                      resetTemplate();
                      setSubject('');
                      setMessage('');
                    }}
                    className="mt-3 text-xs text-gray-600 hover:text-gray-800"
                  >
                    Clear template
                  </button>
                )}
              </div>
            )}

            {/* Template Placeholders Form */}
            {selectedTemplate && showTemplates && (
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <p className="text-sm font-medium text-blue-900 mb-3">Fill in template details:</p>
                <div className="space-y-3">
                  {selectedTemplate.placeholders.map(placeholder => (
                    <div key={placeholder.key}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {placeholder.label}
                        {placeholder.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={localTemplateValues[placeholder.key] ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateTemplateValue(placeholder.key, value);
                          setLocalTemplateValues(prev => ({ ...prev, [placeholder.key]: value }));
                        }}
                        placeholder={placeholder.example}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
                {validation.missing.length > 0 && (
                  <p className="mt-2 text-xs text-red-600">
                    Missing required fields: {validation.missing.join(', ')}
                  </p>
                )}
              </div>
            )}
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
                disabled={isLoading || !!filledTemplate}
                aria-required="true"
                aria-invalid={error && !subject.trim() ? 'true' : 'false'}
                aria-describedby={error && !subject.trim() ? 'subject-error' : undefined}
                maxLength={200}
              />
              {error && !subject.trim() && (
                <p id="subject-error" className="mt-1 text-xs text-red-600" role="alert">
                  Subject is required
                </p>
              )}
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
                aria-required="true"
                aria-invalid={error && !message.trim() ? 'true' : 'false'}
                aria-describedby={error && !message.trim() ? 'message-error' : undefined}
                maxLength={10000}
              />
              <div className="mt-1 flex justify-between items-center">
                {error && !message.trim() && (
                  <p id="message-error" className="text-xs text-red-600" role="alert">
                    Message is required
                  </p>
                )}
                <span className={`text-xs ml-auto ${message.length > 9500 ? 'text-red-600' : 'text-gray-500'}`}>
                  {message.length} / 10,000 characters
                </span>
              </div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div 
              className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg"
              role="alert"
              aria-live="polite"
            >
              <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div 
              className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg"
              role="alert"
              aria-live="polite"
            >
              <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
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
              aria-busy={isLoading}
              aria-label={isLoading ? 'Sending message...' : 'Send message'}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
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
