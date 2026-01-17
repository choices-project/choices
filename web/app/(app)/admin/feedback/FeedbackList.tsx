'use client';

import { 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  Smile, 
  Frown, 
  Meh,
  Eye,
  Star,
  Tag,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import React from 'react';

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

type FeedbackListProps = {
  feedback: Feedback[];
  isLoading: boolean;
  onFeedbackSelect: (_item: Feedback) => void;
  onStatusUpdate: (_feedbackId: string, _newStatus: string) => void;
}

export const FeedbackList: React.FC<FeedbackListProps> = ({
  feedback,
  isLoading,
  onFeedbackSelect,
  onStatusUpdate
}) => {
  // Debug logging removed for production
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="w-4 h-4" />;
      case 'feature': return <Lightbulb className="w-4 h-4" />;
      case 'correction': return <AlertTriangle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'feature': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'correction': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
      default: return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'inprogress': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'resolved': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'closed': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <Smile className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'negative': return <Frown className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'neutral': return <Meh className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
      default: return <Meh className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'high': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'low': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)  }...`;
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        <p className="text-gray-600 dark:text-gray-400 mt-2">Loading feedback...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" data-testid="feedback-list-container">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" data-testid="feedback-table">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Feedback
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Priority
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Sentiment
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {feedback.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No feedback found</h3>
                <p className="text-gray-600 dark:text-gray-400">No feedback submissions match your current filters.</p>
              </td>
            </tr>
          ) : (
            feedback.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-6 py-4">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {item.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {truncateText(item.description, 80)}
                    </p>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 2 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{item.tags.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                  {item.type}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={item.status}
                  onChange={(e) => onStatusUpdate(item.id, e.target.value)}
                  className={`text-sm font-medium px-2 py-1 rounded-full border-0 bg-transparent ${getStatusColor(item.status)}`}
                >
                  <option value="open">Open</option>
                  <option value="inprogress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                  <Star className="w-3 h-3 mr-1" />
                  {item.priority}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  {getSentimentIcon(item.sentiment)}
                  <span className="text-sm text-gray-900 dark:text-gray-100 capitalize">{item.sentiment}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(item.createdat)}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => onFeedbackSelect(item)}
                  className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
              </td>
            </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
