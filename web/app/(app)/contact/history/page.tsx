/**
 * Communication History Page
 *
 * Displays all message threads and communication history between
 * the user and their representatives
 *
 * Created: January 26, 2025
 * Status: ✅ PRODUCTION
 */

'use client';

import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { RefreshCw } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useMemo, useCallback } from 'react';

import { EnhancedEmptyState } from '@/components/shared/EnhancedEmptyState';
import { EnhancedErrorDisplay } from '@/components/shared/EnhancedErrorDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useAppActions } from '@/lib/stores/appStore';
import { logger } from '@/lib/utils/logger';

type Thread = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  message_count: number;
  representative: {
    id: number;
    name: string;
    office: string;
    photo?: string;
  };
};

export default function ContactHistoryPage() {
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent');

  const fetchThreads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/contact/threads');

      if (!response.ok) {
        if (response.status === 401) {
          setError('Please sign in to view your message history');
          return;
        }
        throw new Error('Failed to fetch message threads');
      }

      const data = await response.json();

      if (data.success && data.data) {
        setThreads(data.data.threads ?? []);
      } else {
        throw new Error(data.error ?? 'Failed to fetch message threads');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      logger.error('Error fetching message threads:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentRoute('/contact/history');
    setSidebarActiveSection('contact');
    setBreadcrumbs([
      { label: 'Home', href: '/' },
      { label: 'Contact', href: '/contact' },
      { label: 'History', href: '/contact/history' },
    ]);

    return () => {
      setSidebarActiveSection(null);
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setCurrentRoute, setSidebarActiveSection]);

  useEffect(() => {
    void fetchThreads();
  }, [fetchThreads]);

  // Filter and sort threads - memoized for performance
  const filteredThreads = useMemo(() => {
    return threads
      .filter(thread => {
        if (filter === 'all') return true;
        if (filter === 'active') return thread.status === 'active';
        if (filter === 'closed') return thread.status === 'closed';
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.last_message_at ?? a.updated_at).getTime();
        const dateB = new Date(b.last_message_at ?? b.updated_at).getTime();
        return sortBy === 'recent' ? dateB - dateA : dateA - dateB;
      });
  }, [threads, filter, sortBy]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <ClockIcon className="w-8 h-8 animate-pulse mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading message history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EnhancedErrorDisplay
          title="Unable to load message history"
          message={error}
          details="We encountered an issue while loading your communication history. This might be a temporary network problem."
          tip="Check your internet connection and try again. If the problem persists, the service may be temporarily unavailable."
          canRetry={true}
          onRetry={() => void fetchThreads()}
          primaryAction={{
            label: 'Try Again',
            onClick: () => void fetchThreads(),
            icon: <RefreshCw className="h-4 w-4" />,
          }}
          secondaryAction={{
            label: 'Browse Representatives',
            href: '/representatives',
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center space-x-2">
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-600" />
            <span>Communication History</span>
          </h1>
          <p className="text-gray-600">
            View all your messages and conversations with representatives
          </p>
        </div>
        <Link
          href="/contact/submissions"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          My Submissions →
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <div className="flex space-x-2">
            {(['all', 'active', 'closed'] as const).map(filterOption => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  filter === filterOption
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">Sort:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'oldest')}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {filteredThreads.length === 0 ? (
        <EnhancedEmptyState
          icon={<ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400" />}
          title="No messages yet"
          description="Start a conversation with your representatives to see it here."
          tip="Browse your representatives and send them a message to start a conversation thread."
          primaryAction={{
            label: 'Browse Representatives',
            href: '/representatives',
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredThreads.map(thread => (
            <Card key={thread.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{thread.subject}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        {thread.representative.photo ? (
                          <Image
                            src={thread.representative.photo}
                            alt={thread.representative.name}
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {thread.representative.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        )}
                        <span>{thread.representative.name}</span>
                        <span className="text-gray-400">•</span>
                        <span>{thread.representative.office}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      thread.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {thread.status}
                    </span>
                    {thread.priority === 'high' && (
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <ChatBubbleLeftRightIcon className="w-4 h-4" />
                      <span>{thread.message_count} {thread.message_count === 1 ? 'message' : 'messages'}</span>
                    </div>
                    {thread.last_message_at && (
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>
                          Last message: {new Date(thread.last_message_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/contact/threads/${thread.id}`}>
                      View Thread
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

