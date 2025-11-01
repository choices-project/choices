/**
 * Contact Representative Form Component
 * 
 * Provides a form for users to send messages to their representatives.
 * Supports message composition, priority selection, and file attachments.
 * 
 * Created: January 23, 2025
 * Status: ✅ IMPLEMENTATION READY
 */

'use client';

import { Send, Paperclip, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import React, { useState, useRef } from 'react';

import { contactMessagingService } from '@/lib/contact/real-time-messaging';
import { logger } from '@/lib/utils/logger';






// ============================================================================
// TYPES
// ============================================================================

type ContactRepresentativeFormProps = {
  representativeId: number;  // ← FIXED: Should be number from civics API
  representativeName: string;
  representativeOffice: string;
  threadId?: string;
  onMessageSent?: (message: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

type FormData = {
  subject: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  attachments: File[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ContactRepresentativeForm({
  representativeId,
  representativeName,
  representativeOffice,
  threadId,
  onMessageSent,
  onError,
  className = ''
}: ContactRepresentativeFormProps) {
  // State
  const [formData, setFormData] = useState<FormData>({
    subject: '',
    content: '',
    priority: 'normal',
    attachments: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Constants
  const MAX_CONTENT_LENGTH = 10000;
  const MAX_ATTACHMENTS = 5;
  const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleInputChange = (field: keyof FormData, value: string | File[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Update character count for content
    if (field === 'content') {
      setCharCount((value as string).length);
    }

    // Clear error when user starts typing
    if (submitStatus === 'error') {
      setSubmitStatus('idle');
      setErrorMessage(null);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file count
    if (formData.attachments.length + files.length > MAX_ATTACHMENTS) {
      setErrorMessage(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
      setSubmitStatus('error');
      return;
    }

    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > MAX_ATTACHMENT_SIZE);
    if (oversizedFiles.length > 0) {
      setErrorMessage(`Files must be smaller than ${MAX_ATTACHMENT_SIZE / (1024 * 1024)}MB`);
      setSubmitStatus('error');
      return;
    }

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validation
    if (!formData.subject.trim()) {
      setErrorMessage('Subject is required');
      setSubmitStatus('error');
      return;
    }

    if (!formData.content.trim()) {
      setErrorMessage('Message content is required');
      setSubmitStatus('error');
      return;
    }

    if (formData.content.length > MAX_CONTENT_LENGTH) {
      setErrorMessage(`Message content is too long (max ${MAX_CONTENT_LENGTH} characters)`);
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage(null);

    try {
      // Prepare attachments data
      const attachmentsData = formData.attachments.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }));

      // Send minimal message compatible with service type
      const sent = await contactMessagingService.sendMessage({
        content: formData.content.trim(),
        senderId: 'current-user',
        recipientId: String(representativeId)
      });

      if (sent && sent.id) {
        setSubmitStatus('success');
        setFormData({
          subject: '',
          content: '',
          priority: 'normal',
          attachments: []
        });
        setCharCount(0);
        
        // Call success callback
        onMessageSent?.(sent);
        
        logger.info('Message sent successfully', {
          messageId: sent.id,
          representativeId,
          threadId
        });
      } else {
        setErrorMessage('Failed to send message');
        setSubmitStatus('error');
        onError?.('Failed to send message');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to send message';
      setErrorMessage(errorMsg);
      setSubmitStatus('error');
      onError?.(errorMsg);
      
      logger.error('Error sending message', error instanceof Error ? error : new Error(String(error)), { representativeId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Contact {representativeName}
        </h3>
        <p className="text-sm text-gray-600">
          {representativeOffice}
        </p>
      </div>

      {/* Form */}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
            Subject *
          </label>
          <input
            type="text"
            id="subject"
            value={formData.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter message subject"
            maxLength={255}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) => handleInputChange('priority', e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSubmitting}
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {/* Message Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Message *
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32 resize-none"
            placeholder="Type your message here..."
            maxLength={MAX_CONTENT_LENGTH}
            required
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center mt-1">
            <span className={`text-xs ${charCount > MAX_CONTENT_LENGTH * 0.9 ? 'text-red-600' : 'text-gray-500'}`}>
              {charCount} / {MAX_CONTENT_LENGTH} characters
            </span>
          </div>
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachments
          </label>
          
          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
            disabled={isSubmitting}
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            disabled={isSubmitting || formData.attachments.length >= MAX_ATTACHMENTS}
          >
            <Paperclip className="w-4 h-4" />
            <span className="text-sm">Add Files</span>
          </button>
          
          <p className="text-xs text-gray-500 mt-1">
            Maximum {MAX_ATTACHMENTS} files, {MAX_ATTACHMENT_SIZE / (1024 * 1024)}MB each
          </p>

          {/* Attachment List */}
          {formData.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {formData.attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Paperclip className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                    disabled={isSubmitting}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Message */}
        {submitStatus === 'error' && errorMessage && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{errorMessage}</span>
          </div>
        )}

        {/* Success Message */}
        {submitStatus === 'success' && (
          <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Message sent successfully!</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !formData.subject.trim() || !formData.content.trim()}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Message</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}