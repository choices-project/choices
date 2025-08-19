'use client';

import React, { useState } from 'react';
import {
  Github,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Target,
  Users,
  TrendingUp,
  BarChart3
} from 'lucide-react';

interface Feedback {
  id: string;
  title: string;
  description: string;
  type: string;
  sentiment: string;
  priority: string;
  status: string;
  metadata?: {
    githubIssue?: {
      number: number;
      url: string;
      analysis: any;
      createdAt: string;
    };
  };
}

interface IssueGenerationPanelProps {
  feedback: Feedback[];
  onIssueGenerated: (feedbackId: string, issueData: any) => void;
  onBulkGenerate: (feedbackIds: string[]) => void;
}

export const IssueGenerationPanel: React.FC<IssueGenerationPanelProps> = ({
  feedback,
  onIssueGenerated,
  onBulkGenerate
}) => {
  const [selectedFeedback, setSelectedFeedback] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResults, setGenerationResults] = useState<any[]>([]);
  const [showAnalysis, setShowAnalysis] = useState<string | null>(null);

  const feedbackWithoutIssues = feedback.filter(
    (item) => !item.metadata?.githubIssue
  );

  const feedbackWithIssues = feedback.filter(
    (item) => item.metadata?.githubIssue
  );

  const handleSelectFeedback = (feedbackId: string) => {
    setSelectedFeedback(prev => 
      prev.includes(feedbackId)
        ? prev.filter(id => id !== feedbackId)
        : [...prev, feedbackId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFeedback.length === feedbackWithoutIssues.length) {
      setSelectedFeedback([]);
    } else {
      setSelectedFeedback(feedbackWithoutIssues.map(item => item.id));
    }
  };

  const handleGenerateIssue = async (feedbackId: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/admin/feedback/${feedbackId}/generate-issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        onIssueGenerated(feedbackId, result.data);
        setGenerationResults(prev => [...prev, result.data]);
      } else {
        throw new Error('Failed to generate issue');
      }
    } catch (error) {
      console.error('Error generating issue:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBulkGenerate = async () => {
    if (selectedFeedback.length === 0) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/admin/feedback/bulk-generate-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackIds: selectedFeedback })
      });

      if (response.ok) {
        const result = await response.json();
        setGenerationResults(prev => [...prev, ...result.data.issues]);
        setSelectedFeedback([]);
        onBulkGenerate(selectedFeedback);
      } else {
        throw new Error('Failed to generate issues');
      }
    } catch (error) {
      console.error('Error generating issues:', error);
    } finally {
      setIsGenerating(false);
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <AlertCircle className="w-4 h-4" />;
      case 'feature': return <Plus className="w-4 h-4" />;
      case 'general': return <Users className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Github className="h-6 w-6 text-gray-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">GitHub Issue Generation</h2>
            <p className="text-sm text-gray-600">Transform feedback into actionable development tasks</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {feedbackWithoutIssues.length} without issues
          </span>
          <span className="text-sm text-gray-500">
            {feedbackWithIssues.length} with issues
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-50">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Ready to Generate</p>
              <p className="text-2xl font-bold text-gray-900">{feedbackWithoutIssues.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Issues Created</p>
              <p className="text-2xl font-bold text-gray-900">{feedbackWithIssues.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-50">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">
                {feedbackWithoutIssues.filter(f => f.priority === 'high' || f.priority === 'urgent').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-orange-50">
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Bug Reports</p>
              <p className="text-2xl font-bold text-gray-900">
                {feedbackWithoutIssues.filter(f => f.type === 'bug').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {feedbackWithoutIssues.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={selectedFeedback.length === feedbackWithoutIssues.length}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Select All ({selectedFeedback.length}/{feedbackWithoutIssues.length})
              </span>
            </div>
            <button
              onClick={handleBulkGenerate}
              disabled={selectedFeedback.length === 0 || isGenerating}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Github className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : `Generate ${selectedFeedback.length} Issues`}
            </button>
          </div>
        </div>
      )}

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Feedback Ready for Issue Generation</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {feedbackWithoutIssues.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-600">All feedback has been converted to GitHub issues.</p>
            </div>
          ) : (
            feedbackWithoutIssues.map((item) => (
              <div key={item.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedFeedback.includes(item.id)}
                      onChange={() => handleSelectFeedback(item.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(item.type)}
                      <span className="text-sm font-medium text-gray-900">{item.title}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                    <button
                      onClick={() => handleGenerateIssue(item.id)}
                      disabled={isGenerating}
                      className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Github className="h-3 w-3 mr-1" />
                      Generate
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600 ml-8">{item.description}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Generation Results */}
      {generationResults.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recently Generated Issues</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {generationResults.slice(-5).map((result, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-900">
                        Issue #{result.issueNumber} created
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{result.generatedIssue.title}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={result.issueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View on GitHub
                    </a>
                    <button
                      onClick={() => setShowAnalysis(showAnalysis === result.feedbackId ? null : result.feedbackId)}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      {showAnalysis === result.feedbackId ? 'Hide' : 'Show'} Analysis
                    </button>
                  </div>
                </div>
                {showAnalysis === result.feedbackId && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Urgency:</span> {result.analysis.urgency}/10
                      </div>
                      <div>
                        <span className="font-medium">Impact:</span> {result.analysis.impact}/10
                      </div>
                      <div>
                        <span className="font-medium">Effort:</span> {result.analysis.estimatedEffort}
                      </div>
                      <div>
                        <span className="font-medium">Intent:</span> {result.analysis.intent}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
