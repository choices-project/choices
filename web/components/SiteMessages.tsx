'use client';

import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
  MessageSquare,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
import { logger } from '@/lib/utils/logger';

type SiteMessage = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'feedback';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
  expires_at?: string;
};

type SiteMessagesProps = {
  className?: string;
  maxMessages?: number;
  showDismiss?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
};

const MAX_PREVIEW_LENGTH = 150;

const typeToIcon: Record<SiteMessage['type'], React.ReactNode> = {
  info: <Info className="h-4 w-4" aria-hidden="true" />,
  warning: <AlertCircle className="h-4 w-4" aria-hidden="true" />,
  success: <CheckCircle className="h-4 w-4" aria-hidden="true" />,
  error: <AlertCircle className="h-4 w-4" aria-hidden="true" />,
  feedback: <MessageSquare className="h-4 w-4" aria-hidden="true" />,
};

const typeToColor: Record<SiteMessage['type'], string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  feedback: 'bg-purple-50 border-purple-200 text-purple-800',
};

const priorityToBadge: Record<SiteMessage['priority'], string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};

const liveRegionForMessage = (message: SiteMessage) => {
  if (message.priority === 'critical' || message.type === 'error' || message.type === 'warning') {
    return { role: 'alert' as const, 'aria-live': 'assertive' as const };
  }
  return { role: 'status' as const, 'aria-live': 'polite' as const };
};

const loadDismissedFromStorage = (): Set<string> => {
  if (typeof window === 'undefined') {
    return new Set();
  }
  try {
    const stored = window.localStorage.getItem('dismissedSiteMessages');
    if (!stored) {
      return new Set();
    }
    const parsed: string[] = JSON.parse(stored);
    return new Set(parsed);
  } catch (error) {
    logger.warn('Unable to read dismissed site messages from storage', error);
    return new Set();
  }
};

const persistDismissedToStorage = (dismissed: Set<string>) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem('dismissedSiteMessages', JSON.stringify(Array.from(dismissed)));
  } catch (error) {
    logger.warn('Unable to persist dismissed site messages', error);
  }
};

export default function SiteMessages({
  className = '',
  maxMessages = 3,
  showDismiss = true,
  autoRefresh = true,
  refreshInterval = 30_000,
}: SiteMessagesProps) {
  const [messages, setMessages] = useState<SiteMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedMessages, setDismissedMessages] = useState<Set<string>>(new Set());
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const announcedMessagesRef = useRef<Set<string>>(new Set());

  // Load dismissed IDs from storage once on mount
  useEffect(() => {
    setDismissedMessages(loadDismissedFromStorage());
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/site-messages');

      if (response.ok) {
        const result = await response.json();
        // API returns { success: true, data: { messages: [...], count: ..., timestamp: ... } }
        const apiMessages = result?.data?.messages ?? [];
        
        // Map database fields to component type
        const mappedMessages: SiteMessage[] = apiMessages.map((msg: any) => {
          // Map database type values to component type values
          let messageType: SiteMessage['type'] = 'info';
          if (msg.type === 'security' || msg.type === 'error') {
            messageType = 'error';
          } else if (msg.type === 'warning' || msg.type === 'maintenance') {
            messageType = 'warning';
          } else if (msg.type === 'success' || msg.type === 'feature') {
            messageType = 'success';
          } else if (msg.type === 'feedback' || msg.type === 'announcement') {
            messageType = msg.type === 'feedback' ? 'feedback' : 'info';
          }
          
          // Map database priority values to component priority values
          let messagePriority: SiteMessage['priority'] = 'medium';
          if (msg.priority === 'critical' || msg.priority === 'urgent') {
            messagePriority = 'critical';
          } else if (msg.priority === 'high') {
            messagePriority = 'high';
          } else if (msg.priority === 'medium') {
            messagePriority = 'medium';
          } else if (msg.priority === 'low') {
            messagePriority = 'low';
          }
          
          return {
            id: msg.id,
            title: msg.title || 'Untitled message',
            message: msg.message || '',
            type: messageType,
            priority: messagePriority,
            created_at: msg.created_at || new Date().toISOString(),
            updated_at: msg.updated_at || msg.created_at || new Date().toISOString(),
            expires_at: msg.end_date || undefined,
          };
        });
        
        setMessages(mappedMessages);
      } else {
        setError('We could not load site messages right now.');
      }
    } catch (err) {
      setError('We could not load site messages right now.');
      logger.error('Error fetching site messages:', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();

    if (!autoRefresh) {
      return;
    }

    const interval = window.setInterval(fetchMessages, refreshInterval);
    return () => window.clearInterval(interval);
  }, [autoRefresh, fetchMessages, refreshInterval]);

  const handleDismiss = (messageId: string, title: string) => {
    setDismissedMessages((prev) => {
      const next = new Set(prev);
      next.add(messageId);
      persistDismissedToStorage(next);
      return next;
    });
    ScreenReaderSupport.announce(`Message "${title}" dismissed.`, 'polite');
  };

  const handleToggleExpand = (messageId: string, expand: boolean) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev);
      if (expand) {
        next.add(messageId);
      } else {
        next.delete(messageId);
      }
      return next;
    });
  };

  const activeMessages = useMemo(() => {
    const now = new Date();
    return messages
      .filter((message) => !dismissedMessages.has(message.id))
      .filter((message) => {
        if (!message.expires_at) {
          return true;
        }
        return new Date(message.expires_at) > now;
      })
      .slice(0, maxMessages);
  }, [dismissedMessages, maxMessages, messages]);

  useEffect(() => {
    // Announce any new active messages once
    activeMessages.forEach((message) => {
      if (!announcedMessagesRef.current.has(message.id)) {
        const announcement =
          message.priority === 'critical' || message.type === 'error'
            ? `Important alert: ${message.title}. ${message.message}`
            : `${message.title}: ${message.message}`;
        ScreenReaderSupport.announce(announcement, message.priority === 'critical' || message.type === 'error' ? 'assertive' : 'polite');
        announcedMessagesRef.current.add(message.id);
      }
    });
  }, [activeMessages]);

  if (loading && messages.length === 0) {
    return (
      <div className={`space-y-3 ${className}`} role="status" aria-live="polite">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          Loading site messages…
        </div>
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div className={`space-y-3 ${className}`} role="status" aria-live="assertive">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          {error}
        </div>
      </div>
    );
  }

  if (activeMessages.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`} role="region" aria-label="Site messages and alerts">
      {activeMessages.map((message) => {
        const isExpanded = expandedMessages.has(message.id);
        const liveRegion = liveRegionForMessage(message);
        const showToggle = message.message.length > MAX_PREVIEW_LENGTH;

        return (
          <article
            key={message.id}
            className={`relative rounded-lg border p-4 transition-all duration-200 ${typeToColor[message.type]}`}
            {...liveRegion}
            aria-atomic="true"
          >
            <div className="flex items-start space-x-3">
              <div className="mt-0.5 flex-shrink-0">{typeToIcon[message.type]}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-semibold leading-5">{message.title}</h3>
                  <div className="ml-2 flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium uppercase tracking-wide ${priorityToBadge[message.priority]}`}>
                      {message.priority}
                    </span>
                    {showDismiss && (
                      <button
                        onClick={() => handleDismiss(message.id, message.title)}
                        className="flex-shrink-0 rounded p-1 text-gray-500 transition-colors hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        aria-label={`Dismiss message titled ${message.title}`}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-2">
                  <p className="text-sm leading-5" id={`site-message-${message.id}-body`}>
                    {isExpanded ? message.message : message.message.slice(0, MAX_PREVIEW_LENGTH)}
                    {showToggle && !isExpanded && message.message.length > MAX_PREVIEW_LENGTH && '…'}
                  </p>

                  {showToggle && (
                    <button
                      onClick={() => handleToggleExpand(message.id, !isExpanded)}
                      className="mt-2 flex items-center space-x-1 text-xs font-medium text-blue-700 transition hover:text-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      aria-expanded={isExpanded}
                      aria-controls={`site-message-${message.id}-body`}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3 w-3" aria-hidden="true" />
                          <span>Show less</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" aria-hidden="true" />
                          <span>Show more</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                  <time dateTime={message.created_at}>
                    Posted {new Date(message.created_at).toLocaleString()}
                  </time>

                  {message.expires_at && (
                    <span>Expires {new Date(message.expires_at).toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
