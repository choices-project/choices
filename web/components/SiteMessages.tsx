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
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

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
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
  error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
  feedback: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200',
};

const priorityToBadge: Record<SiteMessage['priority'], string> = {
  critical: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200',
  high: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200',
  medium: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200',
  low: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200',
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

  // Track if component is mounted to prevent hydration mismatches from Date()
  // CRITICAL: Use function initializer and useLayoutEffect to ensure stable initial state
  const [isMounted, setIsMounted] = useState(() => false);

  useLayoutEffect(() => {
    setIsMounted(true);
  }, []);

  const activeMessages = useMemo(() => {
    // Only filter by expiration date after mount to prevent hydration mismatch
    // During SSR, show all non-dismissed messages
    if (!isMounted) {
      return messages
        .filter((message) => !dismissedMessages.has(message.id))
        .slice(0, maxMessages);
    }

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
  }, [dismissedMessages, maxMessages, messages, isMounted]);

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
      <div className={`space-y-3 ${className}`} role="status" aria-live="assertive" data-testid="site-messages-error">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          {error}
        </div>
      </div>
    );
  }

  if (activeMessages.length === 0) {
    // Return null when no active messages (filtered out, expired, or dismissed)
    // This is expected behavior - component should not render anything
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`} role="region" aria-label="Site messages and alerts" data-testid="site-messages">
      {activeMessages.map((message) => {
        const isExpanded = expandedMessages.has(message.id);
        const liveRegion = liveRegionForMessage(message);
        const showToggle = message.message.length > MAX_PREVIEW_LENGTH;

        return (
          <article
            key={message.id}
            data-testid={`site-message-${message.id}`}
            className={`relative rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 p-4 ${typeToColor[message.type]}`}
            {...liveRegion}
            aria-atomic="true"
          >
            <div className="flex items-start space-x-3">
              <div className="mt-0.5 flex-shrink-0 p-1.5 rounded-full bg-white dark:bg-gray-800/50">
                {typeToIcon[message.type]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold leading-5 flex-1" data-testid={`site-message-${message.id}-title`}>{message.title}</h3>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 text-xs font-medium uppercase tracking-wide rounded ${priorityToBadge[message.priority]}`}>
                      {message.priority}
                    </span>
                    {showDismiss && (
                      <button
                        onClick={() => handleDismiss(message.id, message.title)}
                        className="flex-shrink-0 rounded p-1 text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        aria-label={`Dismiss message titled ${message.title}`}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-2">
                  <p className="text-sm leading-6" id={`site-message-${message.id}-body`} data-testid={`site-message-${message.id}-message`}>
                    {isExpanded ? message.message : message.message.slice(0, MAX_PREVIEW_LENGTH)}
                    {showToggle && !isExpanded && message.message.length > MAX_PREVIEW_LENGTH && '…'}
                  </p>

                  {showToggle && (
                    <button
                      onClick={() => handleToggleExpand(message.id, !isExpanded)}
                      className="mt-2 flex items-center space-x-1 text-xs font-medium text-blue-700 dark:text-blue-400 transition hover:text-blue-900 dark:hover:text-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded px-1 py-0.5"
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

                <div className="mt-3 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-current/10">
                  <time dateTime={message.created_at} className="flex items-center gap-1">
                    <span>Posted</span>
                    <span className="font-medium">
                      {isMounted
                        ? new Date(message.created_at).toLocaleDateString()
                        : new Date(message.created_at).toISOString().split('T')[0]}
                    </span>
                  </time>

                  {message.expires_at && (
                    <span className="flex items-center gap-1">
                      <span>Expires</span>
                      <span className="font-medium">
                        {isMounted
                          ? new Date(message.expires_at).toLocaleDateString()
                          : new Date(message.expires_at).toISOString().split('T')[0]}
                      </span>
                    </span>
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
