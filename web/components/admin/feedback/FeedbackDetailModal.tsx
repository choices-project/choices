'use client';

import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  Smile, 
  Frown, 
  Meh,
  Clock,
  CheckCircle,
  Star,
  Tag,
  User,
  Calendar,
  Monitor,
  Globe,
  Smartphone,
  Download,
  Send
} from 'lucide-react';

interface Feedback {
  id: string;
  user_id: string | null;
  type: string;
  title: string;
  description: string;
  sentiment: string;
  screenshot: string | null;
  user_journey: any;
  status: string;
  priority: string;
  tags: string[];
  ai_analysis: any;
  metadata: any;
  created_at: string;
  updated_at: string;
}

interface FeedbackDetailModalProps {
  feedback: Feedback;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (feedbackId: string, newStatus: string) => void;
}

export const FeedbackDetailModal: React.FC<FeedbackDetailModalProps> = ({
  feedback,
  isOpen,
  onClose,
  onStatusUpdate
}) => {
  const [adminResponse, setAdminResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="w-4 h-4" />;
      case 'feature': return <Lightbulb className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return 'bg-red-100 text-red-700';
      case 'feature': return 'bg-blue-100 text-blue-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <Smile className="w-4 h-4 text-green-600" />;
      case 'negative': return <Frown className="w-4 h-4 text-red-600" />;
      case 'neutral': return <Meh className="w-4 h-4 text-gray-600" />;
      default: return <Meh className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSubmitResponse = async () => {
    if (!adminResponse.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/feedback/${feedback.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: adminResponse })
      });

      if (!response.ok) {
        throw new Error('Failed to submit response');
      }

      setAdminResponse('');
      // You could add a success notification here
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getTypeColor(feedback.type)}`}>
              {getTypeIcon(feedback.type)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{feedback.title}</h2>
              <p className="text-sm text-gray-500">Feedback #{feedback.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Type:</span>
              <span className="text-sm font-medium capitalize">{feedback.type}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Priority:</span>
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${getPriorityColor(feedback.priority)}`}>
                {feedback.priority}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {getSentimentIcon(feedback.sentiment)}
              <span className="text-sm text-gray-600">Sentiment:</span>
              <span className="text-sm font-medium capitalize">{feedback.sentiment}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Created:</span>
              <span className="text-sm font-medium">{formatDate(feedback.created_at)}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{feedback.description}</p>
            </div>
          </div>

          {/* Tags */}
          {feedback.tags && feedback.tags.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {feedback.tags.map((tag: any, index: any) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    <Tag className="w-4 h-4 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* User Journey */}
          {feedback.user_journey && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">User Journey</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(feedback.user_journey, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Metadata */}
          {feedback.metadata && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Technical Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feedback.metadata.deviceInfo && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Device Information</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Monitor className="h-4 w-4" />
                        <span>OS: {feedback.metadata.deviceInfo.os}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4" />
                        <span>Browser: {feedback.metadata.deviceInfo.browser}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4" />
                        <span>Type: {feedback.metadata.deviceInfo.type}</span>
                      </div>
                    </div>
                  </div>
                )}
                {feedback.metadata.performanceMetrics && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Performance Metrics</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>CLS: {feedback.metadata.performanceMetrics.cls}</div>
                      <div>FCP: {feedback.metadata.performanceMetrics.fcp}ms</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {feedback.ai_analysis && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">AI Analysis</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(feedback.ai_analysis, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Admin Response */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Response</h3>
            <div className="space-y-3">
              <textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Type your response to the user..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
              />
              <div className="flex justify-between items-center">
                <select
                  value={feedback.status}
                  onChange={(e) => onStatusUpdate(feedback.id, e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <button
                  onClick={handleSubmitResponse}
                  disabled={!adminResponse.trim() || isSubmitting}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Sending...' : 'Send Response'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
