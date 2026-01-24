'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

import { useAppActions } from '@/lib/stores/appStore';
import { logger } from '@/lib/utils/logger';

import { useDebounce } from '@/hooks/useDebounce';

import { FeedbackDetailModal } from './FeedbackDetailModal';
import { FeedbackFilters } from './FeedbackFilters';
import { FeedbackList } from './FeedbackList';
import { FeedbackStats } from './FeedbackStats';

type Feedback = {
  id: string;
  userid: string | null;
  type: string;
  title: string;
  description: string;
  sentiment: string;
  screenshot: string | null;
  adminresponse?: string | null;
  adminresponseat?: string | null;
  adminresponseby?: string | null;
  userjourney: {
    currentPage: string;
    currentPath: string;
    pageTitle: string;
    referrer: string;
    userAgent: string;
    screenResolution: string;
    viewportSize: string;
    timeOnPage: number;
    sessionId: string;
    sessionStartTime: string;
    totalPageViews: number;
    activeFeatures: string[];
    lastAction: string;
    actionSequence: string[];
    pageLoadTime: number;
    performanceMetrics: {
      fcp?: number;
      lcp?: number;
      fid?: number;
      cls?: number;
    };
    errors: Array<{
      type: string;
      message: string;
      stack?: string;
      timestamp: string;
    }>;
    deviceInfo: {
      type: 'mobile' | 'tablet' | 'desktop';
      os: string;
      browser: string;
      language: string;
      timezone: string;
    };
    isAuthenticated: boolean;
    userRole?: string;
    userId?: string;
  };
  status: string;
  priority: string;
  tags: string[];
  aianalysis: {
    intent: string;
    category: string;
    sentiment: number;
    urgency: number;
    complexity: number;
    keywords: string[];
    suggestedActions: string[];
  };
  metadata: Record<string, unknown>;
  createdat: string;
  updatedat: string;
};

type Filters = {
  type: string;
  sentiment: string;
  status: string;
  priority: string;
  dateRange: string;
  search: string;
};

export default function AdminFeedbackPage() {
  const { setCurrentRoute, setSidebarActiveSection, setBreadcrumbs } = useAppActions();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [filters, setFilters] = useState<Filters>({
    type: '',
    sentiment: '',
    status: '',
    priority: '',
    dateRange: 'all',
    search: '',
  });

  // Debounce search filter to reduce API calls (500ms delay)
  const debouncedSearch = useDebounce(filters.search, 500);

  // Create debounced filters object for API calls
  const debouncedFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
    }),
    [filters, debouncedSearch],
  );

  useEffect(() => {
    setCurrentRoute('/admin/feedback');
    setSidebarActiveSection('admin-feedback');
    setBreadcrumbs([
      { label: 'Admin', href: '/admin' },
      { label: 'Feedback', href: '/admin/feedback' },
    ]);

    return () => {
      setSidebarActiveSection(null);
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setCurrentRoute, setSidebarActiveSection]);

  const fetchFeedback = useCallback(async (isMountedRef?: { current: boolean }) => {
    if (isMountedRef && !isMountedRef.current) return; // Component unmounted, abort
    setError(null);
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedFilters.type) params.append('type', debouncedFilters.type);
      if (debouncedFilters.sentiment) params.append('sentiment', debouncedFilters.sentiment);
      if (debouncedFilters.status) params.append('status', debouncedFilters.status);
      if (debouncedFilters.priority) params.append('priority', debouncedFilters.priority);
      if (debouncedFilters.dateRange) params.append('dateRange', debouncedFilters.dateRange);
      if (debouncedFilters.search) params.append('search', debouncedFilters.search);

      const url = `/api/admin/feedback?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Failed to fetch feedback:', { status: response.status, statusText: response.statusText, error: errorText });
        throw new Error(`Failed to fetch feedback: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle API errors
      if (!data.success) {
        logger.error('API returned error:', data.error || data);
        if (isMountedRef && !isMountedRef.current) return; // Component unmounted, abort
        setError(data.error ?? 'Unable to load feedback. The server returned an error.');
        setFeedback([]);
        return;
      }

      // Handle response structure - successResponse wraps data in { success: true, data: { ... } }
      // The API returns { success: true, data: { feedback: [...], total: N, ... } }
      const feedbackData = Array.isArray(data.data?.feedback) ? data.data.feedback : [];

      // Always set feedback, even if empty - this ensures the component renders
      if (Array.isArray(feedbackData)) {
        // Transform API response to match Feedback type
        const transformedFeedback: Feedback[] = feedbackData.map((item: any) => ({
          id: item.id,
          userid: item.user_id || null,
          type: item.type || item.feedback_type || 'general',
          title: item.title || 'Untitled',
          description: item.description || '',
          sentiment: item.sentiment || 'neutral',
          screenshot: item.screenshot || null,
          adminresponse: item.admin_response ?? null,
          adminresponseat: item.admin_response_at ?? null,
          adminresponseby: item.admin_response_by ?? null,
          userjourney: item.user_journey || item.userjourney || {
            currentPage: '',
            currentPath: '',
            pageTitle: '',
            referrer: '',
            userAgent: '',
            screenResolution: '',
            viewportSize: '',
            timeOnPage: 0,
            sessionId: '',
            sessionStartTime: '',
            totalPageViews: 0,
            activeFeatures: [],
            lastAction: '',
            actionSequence: [],
            pageLoadTime: 0,
            performanceMetrics: {},
            errors: [],
            deviceInfo: {
              type: 'desktop',
              os: '',
              browser: '',
              language: '',
              timezone: '',
            },
            isAuthenticated: false,
          },
          // Map database status values to UI values (in_progress -> inprogress)
          status: item.status === 'in_progress' ? 'inprogress' : (item.status || 'open'),
          priority: item.priority || 'medium',
          tags: item.tags || [],
          aianalysis: item.ai_analysis || item.aianalysis || {
            intent: '',
            category: '',
            sentiment: 0,
            urgency: 0,
            complexity: 0,
            keywords: [],
            suggestedActions: [],
          },
          metadata: item.metadata || {},
          createdat: item.created_at || item.createdat || new Date().toISOString(),
          updatedat: item.updated_at || item.updatedat || new Date().toISOString(),
        }));

        if (isMountedRef && !isMountedRef.current) return; // Component unmounted, abort
        setFeedback(transformedFeedback);
      } else {
        // Even if empty, set empty array so component renders empty state
        if (isMountedRef && !isMountedRef.current) return; // Component unmounted, abort
        setFeedback([]);
      }
    } catch (err) {
      logger.error('Error fetching feedback:', err instanceof Error ? err : new Error(String(err)));
      if (isMountedRef && !isMountedRef.current) {
        setIsLoading(false);
        return; // Component unmounted, abort
      }
      setError(err instanceof Error ? err.message : 'Failed to load feedback.');
      setFeedback([]);
    } finally {
      // Only set loading to false if component is still mounted
      if (isMountedRef && isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [debouncedFilters]);

  useEffect(() => {
    const isMountedRef = { current: true }; // Track if component is still mounted
    const hasLoadedRef = { current: false }; // Prevent multiple simultaneous loads

    const loadData = async () => {
      if (hasLoadedRef.current) return;
      hasLoadedRef.current = true;
      await fetchFeedback(isMountedRef);
      // Reset on error so user can retry
      if (!isMountedRef.current) {
        hasLoadedRef.current = false;
      }
    };

    void loadData();

    // Cleanup: mark component as unmounted
    return () => {
      isMountedRef.current = false;
    };
  }, [debouncedFilters]); // Only reload when filters change, not when fetchFeedback changes

  const handleStatusUpdate = useCallback(async (feedbackId: string, newStatus: string) => {
    try {
      // Map status values to API format
      const apiStatus = newStatus === 'inprogress' ? 'in_progress' : newStatus;

      const response = await fetch(`/api/admin/feedback/${feedbackId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: apiStatus }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }

      // Update local state
      setFeedback((prev) =>
        prev.map((item) =>
          item.id === feedbackId
            ? { ...item, status: newStatus, updatedat: new Date().toISOString() }
            : item
        )
      );

      // Update selected feedback if it's the one being updated
      if (selectedFeedback?.id === feedbackId) {
        setSelectedFeedback((prev) =>
          prev ? { ...prev, status: newStatus, updatedat: new Date().toISOString() } : null
        );
      }
    } catch (error) {
      logger.error('Error updating feedback status:', error instanceof Error ? error : new Error(String(error)));
    }
  }, [selectedFeedback]);

  const handleFeedbackSelect = useCallback((item: Feedback) => {
    setSelectedFeedback(item);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedFeedback(null);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    fetchFeedback({ current: true });
  }, [fetchFeedback]);

  return (
    <ErrorBoundary
      fallback={
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 m-8">
          <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Feedback Page Error</h3>
          <p className="text-red-600 dark:text-red-400 mt-2">
            An error occurred while loading the feedback page. Please try refreshing the page.
          </p>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" data-testid="admin-feedback-page">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Feedback Management</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage and triage user feedback, sentiment analysis, and follow-up actions.
        </p>
      </div>

      {/* Statistics */}
      <div data-testid="feedback-stats">
        <FeedbackStats feedback={feedback} />
      </div>

      {/* Filters */}
      <div data-testid="feedback-filters">
        <FeedbackFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Feedback List */}
      <div data-testid="feedback-list">
        <FeedbackList
          feedback={feedback}
          isLoading={isLoading}
          error={error}
          onRetry={handleRetry}
          onFeedbackSelect={handleFeedbackSelect}
          onStatusUpdate={handleStatusUpdate}
        />
      </div>

      {/* Detail Modal */}
      {selectedFeedback && (
        <FeedbackDetailModal
          feedback={selectedFeedback}
          isOpen={!!selectedFeedback}
          onClose={handleCloseModal}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
      </div>
    </ErrorBoundary>
  );
}
