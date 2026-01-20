/**
 * Bulk Contact Modal Component
 *
 * Allows users to send the same message to multiple representatives at once
 *
 * Created: January 26, 2025
 * Status: ✅ PRODUCTION
 */

'use client';

import {
  XMarkIcon,
  PaperAirplaneIcon,
  UsersIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import { trackCivicsRepresentativeEvent } from '@/features/civics/analytics/civicsAnalyticsEvents';
import { useElectionCountdown, formatElectionDate } from '@/features/civics/utils/civicsCountdownUtils';
import { useFeatureFlag } from '@/features/pwa/hooks/useFeatureFlags';

import { useAccessibleDialog } from '@/lib/accessibility/useAccessibleDialog';
import { useAnalyticsActions, useContactActions } from '@/lib/stores';

import { useI18n } from '@/hooks/useI18n';


import { useContactThreads } from '../hooks/useContactMessages';
import { useMessageTemplates } from '../hooks/useMessageTemplates';

import type { Representative } from '@/types/representative';


type BulkContactModalProps = {
  isOpen: boolean;
  onClose: () => void;
  representatives: Representative[];
  userId: string;
}

type SendResult = {
  representativeId: number;
  representativeName: string;
  success: boolean;
  error?: string;
  threadId?: string;
}

export default function BulkContactModal({
  isOpen,
  onClose,
  representatives,
  userId: _userId
}: BulkContactModalProps) {
  const { t, currentLanguage } = useI18n();
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sendResults, setSendResults] = useState<SendResult[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [localTemplateValues, setLocalTemplateValues] = useState<Record<string, string>>({});
  const [selectedRepresentatives, setSelectedRepresentatives] = useState<Set<number>>(
    new Set(representatives.map(r => r.id))
  );

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
  const { createThread } = useContactThreads();
  const { sendMessage } = useContactActions();

  const divisionIds = useMemo(() => {
    const divisions = new Set<string>();
    representatives.forEach((rep) => {
      const candidate = rep.ocdDivisionIds ?? rep.division_ids ?? [];
      if (!Array.isArray(candidate)) {
        return;
      }
      candidate.forEach((division) => {
        if (typeof division === 'string' && division.trim().length > 0) {
          divisions.add(division.trim());
        }
      });
    });
    return Array.from(divisions);
  }, [representatives]);

  const {
    elections: upcomingElections,
    loading: electionLoading,
    error: electionError,
    daysUntilNextElection,
  } = useElectionCountdown(divisionIds, {
    autoFetch: isOpen,
    analytics: {
      surface: 'contact_bulk_modal',
      metadata: {
        representativeCount: representatives.length,
      },
    },
  });

  const { trackEvent } = useAnalyticsActions();
  const openTrackedRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(currentLanguage ?? undefined),
    [currentLanguage],
  );
  const formattedSelectedCount = useMemo(
    () => numberFormatter.format(selectedRepresentatives.size),
    [numberFormatter, selectedRepresentatives.size],
  );
  const dialogLiveMessage = contactSystemEnabled
    ? t('contact.bulkModal.a11y.liveOpen', { count: formattedSelectedCount })
    : t('contact.bulkModal.a11y.liveUnavailable');
  const footerSelectionText = t('contact.bulkModal.footer.selection', {
    count: selectedRepresentatives.size,
    formattedCount: formattedSelectedCount,
  });
  const sendButtonLabel = t('contact.bulkModal.actions.sendLabel', {
    count: selectedRepresentatives.size,
    formattedCount: formattedSelectedCount,
  });
  const sendingButtonLabel = t('contact.bulkModal.actions.sendingLabel', {
    count: selectedRepresentatives.size,
    formattedCount: formattedSelectedCount,
  });
  const sendButtonAria = t('contact.bulkModal.actions.sendAria', {
    count: selectedRepresentatives.size,
    formattedCount: formattedSelectedCount,
  });
  const sendingButtonAria = t('contact.bulkModal.actions.sendingAria', {
    count: selectedRepresentatives.size,
    formattedCount: formattedSelectedCount,
  });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMessage('');
      setSubject('');
      setError(null);
      setSuccess(false);
      setSendResults([]);
      setShowTemplates(false);
      setLocalTemplateValues({});
      setSelectedRepresentatives(new Set(representatives.map(r => r.id)));
      resetTemplate();
    }
  }, [isOpen, representatives, resetTemplate]);

  useEffect(() => {
    if (!isOpen) {
      openTrackedRef.current = false;
      return;
    }

    if (openTrackedRef.current) {
      return;
    }

    openTrackedRef.current = true;

    trackCivicsRepresentativeEvent(trackEvent, {
      type: 'civics_representative_bulk_contact_modal_open',
      value: selectedRepresentatives.size,
      label: String(representatives.length),
      data: {
        representativeIds: representatives.map((rep) => rep.id),
        totalRepresentatives: representatives.length,
        selectedCount: selectedRepresentatives.size,
        divisionIds,
      },
    });
  }, [divisionIds, isOpen, representatives, selectedRepresentatives.size, trackEvent]);

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

  const toggleRepresentative = (representativeId: number) => {
    setSelectedRepresentatives(prev => {
      const newSet = new Set(prev);
      if (newSet.has(representativeId)) {
        newSet.delete(representativeId);
      } else {
        newSet.add(representativeId);
      }
      return newSet;
    });
  };

  // Memoize selected representatives list
  const selectedReps = useMemo(() => {
    return representatives.filter(r => selectedRepresentatives.has(r.id));
  }, [representatives, selectedRepresentatives]);
  const totalSelectedCount = selectedReps.length;
  const formattedSelectedRepsCount = useMemo(
    () => numberFormatter.format(totalSelectedCount),
    [numberFormatter, totalSelectedCount],
  );

  const handleClose = useCallback(() => {
    trackCivicsRepresentativeEvent(trackEvent, {
      type: 'civics_representative_bulk_contact_modal_close',
      value: selectedRepresentatives.size,
      label: String(representatives.length),
      data: {
        representativeIds: representatives.map((rep) => rep.id),
        totalRepresentatives: representatives.length,
        selectedCount: selectedRepresentatives.size,
        divisionIds,
        hadDraftContent: message.trim().length > 0,
        wasSuccessful: success,
      },
    });
    openTrackedRef.current = false;
    onClose();
  }, [
    divisionIds,
    message,
    onClose,
    openTrackedRef,
    representatives,
    selectedRepresentatives.size,
    success,
    trackEvent,
  ]);

  useAccessibleDialog({
    isOpen,
    dialogRef,
    ...(contactSystemEnabled ? { initialFocusRef: subjectInputRef } : {}),
    onClose: handleClose,
    liveMessage: dialogLiveMessage,
    ariaLabelId: contactSystemEnabled ? 'bulk-contact-title' : 'bulk-disabled-title',
  });

  const handleBulkSend = useCallback(async () => {
    if (!message.trim() || !subject.trim()) {
      setError(t('contact.bulkModal.errors.missingFields'));
      return;
    }

    if (selectedRepresentatives.size === 0) {
      setError(t('contact.bulkModal.errors.noRepresentatives'));
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccess(false);
    setSendResults([]);

    const results: SendResult[] = [];

    try {
      // Send to each representative
      for (const representative of selectedReps) {
        try {
          // Create thread
          const { thread } = await createThread({
            representativeId: representative.id,
            subject,
            priority: 'normal',
          });

          await sendMessage({
            threadId: thread.id,
            representativeId: representative.id,
            subject,
            content: message,
            priority: 'normal',
            messageType: 'text',
          });

          results.push({
            representativeId: representative.id,
            representativeName: representative.name,
            success: true,
            threadId: thread.id,
          });
        } catch (err) {
          results.push({
            representativeId: representative.id,
            representativeName: representative.name,
            success: false,
            error:
              err instanceof Error
                ? err.message
                : t('contact.bulkModal.results.failureFallback'),
          });
        }
      }

      setSendResults(results);

      const successCount = results.filter(r => r.success).length;
      if (successCount === selectedReps.length) {
        setSuccess(true);
        // Auto-close after 3 seconds
        setTimeout(() => {
          handleClose();
        }, 3000);
      } else if (successCount > 0) {
        setError(
          t('contact.bulkModal.errors.partial', {
            successCount: numberFormatter.format(successCount),
            total: formattedSelectedRepsCount,
          }),
        );
      } else {
        setError(t('contact.bulkModal.errors.allFailed'));
      }

      trackCivicsRepresentativeEvent(trackEvent, {
        type: 'civics_representative_bulk_contact_send',
        value: successCount,
        label: String(representatives.length),
        data: {
          representativeIds: representatives.map((rep) => rep.id),
          selectedRepresentativeIds: selectedReps.map((rep) => rep.id),
          totalRepresentatives: representatives.length,
          selectedCount: selectedRepresentatives.size,
          divisionIds,
          successCount,
          failureCount: results.length - successCount,
          templateId: selectedTemplate?.id ?? null,
        },
      });
    } catch (err) {
      const fallbackError = t('contact.bulkModal.errors.sendFailed');
      setError(err instanceof Error ? err.message : fallbackError);
      trackCivicsRepresentativeEvent(trackEvent, {
        type: 'civics_representative_bulk_contact_send_error',
        value: selectedRepresentatives.size,
        label: String(representatives.length),
        data: {
          representativeIds: representatives.map((rep) => rep.id),
          selectedRepresentativeIds: selectedReps.map((rep) => rep.id),
          totalRepresentatives: representatives.length,
          selectedCount: selectedRepresentatives.size,
          divisionIds,
          errorMessage: err instanceof Error ? err.message : fallbackError,
          templateId: selectedTemplate?.id ?? null,
        },
      });
    } finally {
      setIsSending(false);
    }
  }, [
    createThread,
    divisionIds,
    formattedSelectedRepsCount,
    handleClose,
    message,
    numberFormatter,
    representatives,
    selectedRepresentatives,
    selectedReps,
    selectedTemplate?.id,
    sendMessage,
    subject,
    t,
    trackEvent,
  ]);

  if (!isOpen) return null;

  if (!contactSystemEnabled) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-disabled-title"
        ref={dialogRef}
      >
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <div className="flex items-center justify-center mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" aria-hidden="true" />
          </div>
          <h2 id="bulk-disabled-title" className="text-yellow-800 text-center font-semibold mb-2">
            {t('contact.bulkModal.disabled.title')}
          </h2>
          <p className="text-yellow-800 text-center">
            {t('contact.bulkModal.disabled.description')}
          </p>
          <button
            onClick={handleClose}
            className="mt-4 w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
            aria-label={t('contact.bulkModal.actions.closeAria')}
            type="button"
          >
            {t('contact.bulkModal.actions.close')}
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
      aria-labelledby="bulk-contact-title"
      aria-describedby="bulk-contact-description"
      ref={dialogRef}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <UsersIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
            <div>
              <h2 id="bulk-contact-title" className="text-lg font-semibold text-gray-900">
                {t('contact.bulkModal.header.title', {
                  count: selectedRepresentatives.size,
                  formattedCount: formattedSelectedCount,
                })}
              </h2>
              <p id="bulk-contact-description" className="text-sm text-gray-600">
                {t('contact.bulkModal.header.description', {
                  count: selectedRepresentatives.size,
                  formattedCount: formattedSelectedCount,
                })}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label={t('contact.bulkModal.actions.closeAria')}
            type="button"
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Representative Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {t('contact.bulkModal.selection.heading', {
                count: selectedRepresentatives.size,
                formattedCount: formattedSelectedCount,
              })}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {representatives.map(rep => (
                <label
                  key={rep.id}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedRepresentatives.has(rep.id)}
                    onChange={() => toggleRepresentative(rep.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 truncate">{rep.name}</span>
                </label>
              ))}
            </div>
          </div>

          {upcomingElections.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 space-y-2">
              <p className="font-semibold flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-blue-500" />
                {t('contact.bulkModal.elections.title')}
              </p>
              <ul className="space-y-1 text-blue-700">
                {upcomingElections.slice(0, 4).map((election) => (
                  <li key={election.election_id} className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-blue-500" />
                    <span>
                      <span className="font-medium">{election.name}</span>
                      <span className="ml-1">
                        {t('contact.bulkModal.elections.date', {
                          date: formatElectionDate(election.election_day, currentLanguage),
                        })}
                      </span>
                    </span>
                  </li>
                ))}
                {upcomingElections.length > 4 && (
                  <li>
                    {t('contact.bulkModal.elections.more', {
                      count: numberFormatter.format(upcomingElections.length - 4),
                    })}
                  </li>
                )}
                {daysUntilNextElection != null && (
                  <li className="text-xs text-blue-700">
                    {daysUntilNextElection === 0
                      ? t('contact.bulkModal.elections.countdown.today')
                      : t('contact.bulkModal.elections.countdown.inDays', {
                          count: daysUntilNextElection,
                          formattedCount: numberFormatter.format(daysUntilNextElection),
                        })}
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Template Selector (same as ContactModal) */}
          <div className="space-y-2">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              aria-expanded={showTemplates}
              aria-controls="bulk-template-selector"
              type="button"
            >
              <DocumentTextIcon className="h-4 w-4" aria-hidden="true" />
              <span>
                {selectedTemplate
                  ? t('contact.bulkModal.templates.toggle.active', { title: selectedTemplate.title })
                  : t('contact.bulkModal.templates.toggle.inactive')}
              </span>
            </button>

            {showTemplates && (
              <div
                id="bulk-template-selector"
                className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto"
                role="listbox"
                aria-label={t('contact.bulkModal.templates.ariaLabel')}
              >
                <p className="text-xs font-medium text-gray-700 mb-3">
                  {t('contact.bulkModal.templates.instructions')}
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
                            trackCivicsRepresentativeEvent(trackEvent, {
                              type: 'civics_representative_bulk_contact_template_select',
                              label: template.id,
                              data: {
                                representativeIds: representatives.map((rep) => rep.id),
                                totalRepresentatives: representatives.length,
                                selectedCount: selectedRepresentatives.size,
                                divisionIds,
                                templateId: template.id,
                                templateTitle: template.title,
                              },
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
                      setLocalTemplateValues({});
                      trackCivicsRepresentativeEvent(trackEvent, {
                        type: 'civics_representative_bulk_contact_template_clear',
                        label: lastTemplateId,
                        data: {
                          representativeIds: representatives.map((rep) => rep.id),
                          totalRepresentatives: representatives.length,
                          selectedCount: selectedRepresentatives.size,
                          divisionIds,
                          lastTemplateId,
                        },
                      });
                    }}
                    className="mt-3 text-xs text-gray-600 hover:text-gray-800"
                  >
                    {t('contact.bulkModal.templates.clear')}
                  </button>
                )}
              </div>
            )}

            {/* Template Placeholders Form */}
            {selectedTemplate && showTemplates && (
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <p className="text-sm font-medium text-blue-900 mb-3">
                  {t('contact.bulkModal.templates.fillLabel')}
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
                    {t('contact.bulkModal.templates.validation.missing', {
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
              <label htmlFor="bulk-subject" className="block text-sm font-medium text-gray-700 mb-2">
                {t('contact.bulkModal.form.subject.label')}
              </label>
              <input
                type="text"
                id="bulk-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t('contact.bulkModal.form.subject.placeholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSending || !!filledTemplate}
                aria-required="true"
                aria-invalid={error && !subject.trim() ? 'true' : 'false'}
                aria-describedby={error && !subject.trim() ? 'bulk-subject-error' : undefined}
                maxLength={200}
                ref={subjectInputRef}
              />
              {error && !subject.trim() && (
                <p id="bulk-subject-error" className="mt-1 text-xs text-red-600" role="alert">
                  {t('contact.bulkModal.form.subject.required')}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="bulk-message" className="block text-sm font-medium text-gray-700 mb-2">
                {t('contact.bulkModal.form.message.label')}
              </label>
              <textarea
                id="bulk-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('contact.bulkModal.form.message.placeholder')}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSending || !!filledTemplate}
                aria-required="true"
                aria-invalid={error && !message.trim() ? 'true' : 'false'}
                aria-describedby={error && !message.trim() ? 'bulk-message-error' : undefined}
                maxLength={10000}
              />
              <div className="mt-1 flex justify-between items-center">
                {error && !message.trim() && (
                  <p id="bulk-message-error" className="text-xs text-red-600" role="alert">
                    {t('contact.bulkModal.form.message.required')}
                  </p>
                )}
                <span className={`text-xs ml-auto ${message.length > 9500 ? 'text-red-600' : 'text-gray-500'}`}>
                  {t('contact.bulkModal.form.message.count', {
                    current: numberFormatter.format(message.length),
                    max: numberFormatter.format(10000),
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Send Results */}
          {sendResults.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {t('contact.bulkModal.results.title')}
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {sendResults.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded ${
                      result.success ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {result.representativeName}
                    </span>
                    {result.success ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                          <span className="text-xs text-red-600">
                            {result.error ?? t('contact.bulkModal.results.failureFallback')}
                          </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
              <span className="text-sm">
                {t('contact.bulkModal.success', {
                  count: totalSelectedCount,
                  formattedCount: formattedSelectedRepsCount,
                })}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">{footerSelectionText}</div>
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isSending}
            >
              {t('common.actions.cancel')}
            </button>
            <button
              onClick={handleBulkSend}
              disabled={isSending || !message.trim() || !subject.trim() || selectedRepresentatives.size === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-busy={isSending}
              aria-label={isSending ? sendingButtonAria : sendButtonAria}
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true" />
                  <span>{sendingButtonLabel}</span>
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
                  <span>{sendButtonLabel}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

