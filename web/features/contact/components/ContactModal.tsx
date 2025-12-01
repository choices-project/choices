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
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import { useRepresentativeCtaAnalytics } from '@/features/civics/hooks/useRepresentativeCtaAnalytics';
import { formatElectionDate } from '@/features/civics/utils/civicsCountdownUtils';
import { useFeatureFlag } from '@/features/pwa/hooks/useFeatureFlags';
import { useAccessibleDialog } from '@/lib/accessibility/useAccessibleDialog';

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
    division_ids?: string[];
    ocdDivisionIds?: string[];
  };
  userId: string;
}

export default function ContactModal({
  isOpen,
  onClose,
  representative,
  userId: _userId
}: ContactModalProps) {
  const { t, currentLanguage } = useI18n();
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
    messages: _messages,
    loading: _messagesLoading,
    error: _messagesError,
    sendMessage
  } = useContactMessages(representative.id.toString());

  const {
    threads,
    loading: _threadsLoading,
    createThread
  } = useContactThreads();

  const {
    divisionIds: _representativeDivisionIds,
    elections: representativeElections,
    loading: electionLoading,
    error: electionError,
    daysUntilNextElection,
    trackCtaEvent,
  } = useRepresentativeCtaAnalytics(representative, { source: 'contact_modal' });

  const dialogRef = useRef<HTMLDivElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(currentLanguage ?? undefined),
    [currentLanguage],
  );
  const handleClose = useCallback(() => {
    trackCtaEvent('civics_representative_contact_modal_close', {
      hadDraftContent: message.trim().length > 0,
      wasSuccessful: success,
    });
    onClose();
  }, [message, onClose, success, trackCtaEvent]);

  const dialogLiveMessage = contactSystemEnabled
    ? t('contact.modal.a11y.liveOpen', { name: representative.name })
    : t('contact.modal.a11y.liveUnavailable');

  useAccessibleDialog({
    isOpen,
    dialogRef,
    ...(contactSystemEnabled ? { initialFocusRef: subjectInputRef, ariaLabelId: 'contact-modal-title' } : {}),
    onClose: handleClose,
    liveMessage: dialogLiveMessage,
  });

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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    trackCtaEvent('civics_representative_contact_modal_open');
  }, [isOpen, trackCtaEvent]);

  // Initialize local template values when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      const initialValues: Record<string, string> = {};
      selectedTemplate.placeholders.forEach(placeholder => {
        initialValues[placeholder.key] = localTemplateValues[placeholder.key] ?? '';
      });
      setLocalTemplateValues(initialValues);
    }
  }, [selectedTemplate, localTemplateValues]);

  // Apply filled template when it's ready
  useEffect(() => {
    if (filledTemplate && selectedTemplate) {
      setSubject(filledTemplate.subject);
      setMessage(filledTemplate.body);
    }
  }, [filledTemplate, selectedTemplate]);

  // Memoize thread lookup for performance
  const existingThreadId = useMemo(() => {
    return threads.find(t => t.representativeId === representative.id)?.id;
  }, [threads, representative.id]);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !subject.trim()) {
      setError(t('contact.modal.errors.missingFields'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create thread if it doesn't exist
      let threadId = existingThreadId;

      if (!threadId) {
        const { thread } = await createThread({
          representativeId: representative.id,
          subject,
          priority: 'normal',
        });
        threadId = thread.id;
      }

      // Send message
      await sendMessage({
        threadId,
        representativeId: representative.id,
        subject,
        content: message,
        messageType: 'text',
        priority: 'normal',
      });

      setSuccess(true);
      setMessage('');
      setSubject('');

      trackCtaEvent('civics_representative_contact_send', {
        threadId,
        usedTemplateId: selectedTemplate?.id ?? null,
        characterCount: message.length,
      });

      // Auto-close after success
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err) {
      const fallbackError = t('contact.modal.errors.sendFailed');
      setError(err instanceof Error ? err.message : fallbackError);
      trackCtaEvent('civics_representative_contact_send_error', {
        errorMessage: err instanceof Error ? err.message : fallbackError,
        usedTemplateId: selectedTemplate?.id ?? null,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    message,
    subject,
    existingThreadId,
    representative.id,
    sendMessage,
    createThread,
    handleClose,
    selectedTemplate?.id,
    trackCtaEvent,
    t,
  ]);

  if (!isOpen) return null;

  if (!contactSystemEnabled) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-disabled-title"
      >
        <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center space-y-4">
          <div className="flex items-center justify-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" aria-hidden="true" />
          </div>
          <h2 id="contact-disabled-title" className="text-yellow-800 font-semibold">
            {t('contact.modal.disabled.title')}
          </h2>
          <p className="text-yellow-800">
            {t('contact.modal.disabled.description')}
          </p>
          <button
            onClick={handleClose}
            className="mt-2 w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
            type="button"
          >
            {t('contact.modal.actions.close')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
      aria-describedby="contact-modal-description"
      ref={dialogRef}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
            <div>
              <h2 id="contact-modal-title" className="text-lg font-semibold text-gray-900">
                {t('contact.modal.header.title', { name: representative.name })}
              </h2>
              <p id="contact-modal-description" className="text-sm text-gray-600">
                {t('contact.modal.header.subtitle', { office: representative.office })}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label={t('contact.modal.actions.closeAria')}
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

          {(representativeElections.length > 0 || electionLoading || electionError) && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 space-y-2">
              <p className="font-semibold flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-blue-500" />
                {t('contact.modal.elections.title')}
              </p>
              {electionLoading && <p>{t('contact.modal.elections.loading')}</p>}
              {electionError && !electionLoading && (
                <p className="text-red-600">{t('contact.modal.elections.error')}</p>
              )}
              {!electionLoading && !electionError && representativeElections.length > 0 && (
                <ul className="space-y-1 text-blue-700">
                  {representativeElections.slice(0, 3).map((election) => (
                    <li key={election.election_id} className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-blue-500" />
                      <span>
                        <span className="font-medium">{election.name}</span>
                        <span className="ml-1">
                          {t('contact.modal.elections.date', {
                            date: formatElectionDate(election.election_day, currentLanguage),
                          })}
                        </span>
                      </span>
                    </li>
                  ))}
                  {representativeElections.length > 3 && (
                    <li>
                      {t('contact.modal.elections.more', {
                        count: numberFormatter.format(representativeElections.length - 3),
                      })}
                    </li>
                  )}
                  {daysUntilNextElection != null && (
                    <li className="text-xs text-blue-700">
                      {daysUntilNextElection === 0
                        ? t('contact.modal.elections.countdown.today')
                        : t('contact.modal.elections.countdown.inDays', {
                            count: daysUntilNextElection,
                            formattedCount: numberFormatter.format(daysUntilNextElection),
                          })}
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}

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
              <span>
                {selectedTemplate
                  ? t('contact.modal.templates.toggle.active', { title: selectedTemplate.title })
                  : t('contact.modal.templates.toggle.inactive')}
              </span>
            </button>

            {showTemplates && (
              <div
                id="template-selector"
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto"
                role="listbox"
                aria-label={t('contact.modal.templates.ariaLabel')}
              >
                <p className="text-xs font-medium text-gray-700 mb-3">
                  {t('contact.modal.templates.instructions')}
                </p>
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
                            trackCtaEvent('civics_representative_contact_template_select', {
                              templateId: template.id,
                              templateTitle: template.title,
                            });
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
                      const lastTemplateId = selectedTemplate.id;
                      resetTemplate();
                      setSubject('');
                      setMessage('');
                      trackCtaEvent('civics_representative_contact_template_clear', {
                        lastTemplateId,
                      });
                    }}
                    className="mt-3 text-xs text-gray-600 hover:text-gray-800"
                  >
                    {t('contact.modal.templates.clear')}
                  </button>
                )}
              </div>
            )}

            {/* Template Placeholders Form */}
            {selectedTemplate && showTemplates && (
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <p className="text-sm font-medium text-blue-900 mb-3">
                  {t('contact.modal.templates.fillLabel')}
                </p>
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
                    {t('contact.modal.templates.validation.missing', {
                      fields: validation.missing.join(', '),
                    })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Message Form */}
          <div className="space-y-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                {t('contact.modal.form.subject.label')}
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t('contact.modal.form.subject.placeholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading || !!filledTemplate}
                aria-required="true"
                aria-invalid={error && !subject.trim() ? 'true' : 'false'}
                aria-describedby={error && !subject.trim() ? 'subject-error' : undefined}
                maxLength={200}
                ref={subjectInputRef}
              />
              {error && !subject.trim() && (
                <p id="subject-error" className="mt-1 text-xs text-red-600" role="alert">
                  {t('contact.modal.form.subject.required')}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                {t('contact.modal.form.message.label')}
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('contact.modal.form.message.placeholder')}
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
                    {t('contact.modal.form.message.required')}
                  </p>
                )}
                <span className={`text-xs ml-auto ${message.length > 9500 ? 'text-red-600' : 'text-gray-500'}`}>
                  {t('contact.modal.form.message.count', {
                    current: numberFormatter.format(message.length),
                    max: numberFormatter.format(10000),
                  })}
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
              <span className="text-sm">{t('contact.modal.success')}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <ClockIcon className="h-4 w-4" />
          <span>{t('contact.modal.footer.responseTime')}</span>
          </div>
          <div className="flex space-x-3">
            <button
            onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
            {t('common.actions.cancel')}
            </button>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !message.trim() || !subject.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-busy={isLoading}
            aria-label={
              isLoading
                ? t('contact.modal.actions.sendingAria')
                : t('contact.modal.actions.sendAria')
            }
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true" />
                <span>{t('contact.modal.actions.sending')}</span>
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
                <span>{t('contact.modal.actions.send')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

