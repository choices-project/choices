'use client';

import React, { useState, useEffect } from 'react';
import { devLog } from '@/lib/logger';
import { 
  TrendingUp, 
  Play, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Eye,
  BarChart3,
  Zap
} from 'lucide-react';

interface AnalysisCategory {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  exampleTopics: string[];
}

interface TrendingTopic {
  id: string;
  title: string;
  description?: string;
  sourceName: string;
  category: string[];
  trendingScore: number;
  sentimentScore: number;
  processingStatus: string;
  createdAt: string;
}

interface GeneratedPoll {
  id: string;
  title: string;
  status: string;
  qualityScore: number;
  votingMethod: string;
  createdAt: string;
}

export default function AutomatedPollsPage() {
  const [categories, setCategories] = useState<AnalysisCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [generatedPolls, setGeneratedPolls] = useState<GeneratedPoll[]>([]);
  const [activeTab, setActiveTab] = useState<'analyze' | 'topics' | 'polls'>('analyze');

  // Load available categories
  useEffect(() => {
    fetchCategories();
    fetchTrendingTopics();
    fetchGeneratedPolls();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/trending-topics/analyze');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      devLog('Error fetching categories:', error);
    }
  };

  const fetchTrendingTopics = async () => {
    try {
      const response = await fetch('/api/admin/trending-topics');
      if (response.ok) {
        const data = await response.json();
        setTrendingTopics(data.topics || []);
      }
    } catch (error) {
      devLog('Error fetching trending topics:', error);
    }
  };

  const fetchGeneratedPolls = async () => {
    try {
      const response = await fetch('/api/admin/generated-polls');
      if (response.ok) {
        const data = await response.json();
        setGeneratedPolls(data.polls || []);
      }
    } catch (error) {
      devLog('Error fetching generated polls:', error);
    }
  };

  const triggerAnalysis = async () => {
    if (!selectedCategory) {
      alert('Please select a category');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/admin/trending-topics/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: selectedCategory,
          sourceType: 'news'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysisResult(data);
        // Refresh data
        fetchTrendingTopics();
        fetchGeneratedPolls();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      devLog('Error triggering analysis:', error);
      alert('Error triggering analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'text-green-600';
    if (score < -0.3) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Automated Polls MVP</h1>
          </div>
          <p className="text-gray-600 max-w-3xl">
            Manual topic analysis and poll generation system. Currently focused on the Gavin Newsom vs Donald Trump feud.
            Select a category to analyze trending topics and generate polls.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'analyze', name: 'Topic Analysis', icon: Zap },
                { id: 'topics', name: 'Trending Topics', icon: TrendingUp },
                { id: 'polls', name: 'Generated Polls', icon: BarChart3 }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'analyze' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Analysis Panel */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Trigger Topic Analysis
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a category...</option>
                    {categories.map((category: any) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCategory && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">
                      {categories.find(c => c.id === selectedCategory)?.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {categories.find(c => c.id === selectedCategory)?.description}
                    </p>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Example Topics:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {categories.find(c => c.id === selectedCategory)?.exampleTopics.map((topic, index: any) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <button
                  onClick={triggerAnalysis}
                  disabled={!selectedCategory || isAnalyzing}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Start Analysis
                    </>
                  )}
                </button>
              </div>

              {/* Analysis Result */}
              {analysisResult && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium text-green-900">Analysis Complete</h3>
                  </div>
                  <p className="text-sm text-green-700">
                    {analysisResult.message} - {analysisResult.count} topics created.
                  </p>
                </div>
              )}
            </div>

            {/* Stats Panel */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                System Stats
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Trending Topics</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{trendingTopics.length}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Generated Polls</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{generatedPolls.length}</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Approved Polls</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {generatedPolls.filter(p => p.status === 'approved').length}
                  </p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-900">Pending Review</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    {generatedPolls.filter(p => p.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'topics' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Trending Topics
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Topic
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sentiment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trendingTopics.map((topic: any) => (
                    <tr key={topic.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{topic.title}</div>
                          {topic.description && (
                            <div className="text-sm text-gray-500">{topic.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{topic.sourceName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{topic.trendingScore.toFixed(1)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${getSentimentColor(topic.sentimentScore)}`}>
                          {topic.sentimentScore > 0 ? '+' : ''}{topic.sentimentScore.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(topic.processingStatus)}`}>
                          {topic.processingStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(topic.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'polls' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Generated Polls
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Poll Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Voting Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quality Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {generatedPolls.map((poll: any) => (
                    <tr key={poll.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{poll.title}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 capitalize">{poll.votingMethod}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${
                          poll.qualityScore >= 0.8 ? 'text-green-600' : 
                          poll.qualityScore >= 0.6 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {(poll.qualityScore * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(poll.status)}`}>
                          {poll.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(poll.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex gap-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          {poll.status === 'pending' && (
                            <button className="text-green-600 hover:text-green-900">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
