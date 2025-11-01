'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Download,
  MessageSquare,
  Eye,
  AlertCircle,
  Github
} from 'lucide-react';
import React, { useState } from 'react';

import { devLog } from '@/lib/utils/logger';

import { FeedbackDetailModal } from './FeedbackDetailModal';
import { FeedbackFilters } from './FeedbackFilters';
import { FeedbackList } from './FeedbackList';
import { FeedbackStats } from './FeedbackStats';
import { IssueGenerationPanel } from './IssueGenerationPanel';


type Feedback = {
  id: string;
  userid: string | null;
  type: string;
  title: string;
  description: string;
  sentiment: string;
  screenshot: string | null;
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
}

export default function AdminFeedbackPage() {
  const [filters, setFilters] = useState({
    type: '',
    sentiment: '',
    status: '',
    priority: '',
    dateRange: 'all',
    search: ''
  });

  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'issues'>('overview');

  // Fetch feedback data
  const { data: feedback, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-feedback', filters],
    queryFn: async () => {
      const response = await fetch(`/api/admin/feedback?${  new URLSearchParams({
        type: filters.type,
        sentiment: filters.sentiment,
        status: filters.status,
        priority: filters.priority,
        dateRange: filters.dateRange,
        search: filters.search
      })}`);

      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }

      const data = await response.json() as Feedback[];
      return data;
    },
    staleTime: 30000, // 30 seconds
  });

  const handleFeedbackSelect = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setIsDetailModalOpen(true);
  };

  const handleStatusUpdate = async (feedbackId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/feedback/${feedbackId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Refetch data to update the UI
      await refetch();
      devLog('Feedback status updated successfully', { feedbackId, newStatus });
    } catch (error) {
      devLog('Error updating feedback status:', { error });
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/admin/feedback/export?${  new URLSearchParams(filters)}`);
      const blob = await response.blob();
      // Use SSR-safe browser API access
      const { safeWindow, safeDocument } = await import('@/lib/utils/ssr-safe');
      const url = safeWindow(w => w.URL?.createObjectURL?.(blob));
      if (url) {
        const a = safeDocument(d => d.createElement?.('a')) as HTMLAnchorElement;
        if (a) {
          a.href = url;
          a.download = `feedback-export-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
        }
        safeWindow(w => w.URL?.revokeObjectURL?.(url));
      }
    } catch (error) {
      devLog('Error exporting feedback:', { error });
    }
  };

  const handleIssueGenerated = (feedbackId: string, issueData: { issueNumber: number; generatedIssue: { title: string; description: string }; issueUrl: string; feedbackId: string; analysis: { intent: string; category: string; sentiment: number; urgency: number; complexity: number; keywords: string[]; suggestedActions: string[]; impact: number; estimatedEffort: string } }) => {
    devLog('GitHub issue generated:', { feedbackId, issueData });
    // Refetch data to update the UI
    void refetch();
  };

  const handleBulkGenerate = (feedbackIds: string[]) => {
    devLog('Bulk issue generation completed:', { feedbackIds });
    // Refetch data to update the UI
    void refetch();
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <h3 className="text-red-800 font-medium">Error Loading Feedback</h3>
          </div>
          <p className="text-red-600 mt-2">Failed to load feedback data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback Management</h1>
          <p className="text-gray-600 mt-1">Manage and respond to user feedback submissions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => void handleExport()}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={() => void refetch()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Eye className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Overview</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('issues')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'issues'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Github className="h-4 w-4" />
              <span>GitHub Issues</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' ? (
        <>
          {/* Stats Cards */}
          <FeedbackStats feedback={feedback ?? []} />

          {/* Filters */}
          <FeedbackFilters
            filters={filters}
            onFiltersChange={setFilters}
          />

          {/* Feedback List */}
          <div className="bg-white rounded-lg shadow" data-testid="feedback-list">
            <FeedbackList
              feedback={feedback ?? []}
              isLoading={isLoading}
              onFeedbackSelect={handleFeedbackSelect}
              onStatusUpdate={() => void handleStatusUpdate}
            />
          </div>
        </>
      ) : (
        <IssueGenerationPanel
          feedback={feedback ?? []}
          onIssueGenerated={handleIssueGenerated}
          onBulkGenerate={handleBulkGenerate}
        />
      )}

      {/* Detail Modal */}
      {selectedFeedback && (
        <FeedbackDetailModal
          feedback={selectedFeedback}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedFeedback(null);
          }}
          onStatusUpdate={() => void handleStatusUpdate}
        />
      )}
    </div>
  );
}
