'use client';

import React, { useState } from 'react';
import { devLog } from '@/lib/logger';
import { 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  Download,
  RefreshCw,
  Zap
} from 'lucide-react';
import { useTrendingTopics, useApproveTopic, useRejectTopic, useAnalyzeTrendingTopics } from '../../../lib/admin-hooks';
import { useAdminStore } from '../../../lib/admin-store';
import { ChartWrapper, ChartSkeleton } from '../charts/BasicCharts';

export const TrendingTopicsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: topics, isLoading, refetch } = useTrendingTopics();
  const approveTopic = useApproveTopic();
  const rejectTopic = useRejectTopic();
  const analyzeTopics = useAnalyzeTrendingTopics();



  // Filter topics based on search and filters
  const filteredTopics = (topics as any)?.filter((topic: any) => {
    const matchesSearch = topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         topic.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || topic.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || topic.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const getTrendScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleAnalyze = async () => {
    try {
      await analyzeTopics.mutateAsync();
    } catch (error) {
      devLog('Failed to analyze trending topics:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trending Topics</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage trending topics for poll generation
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleAnalyze}
            disabled={analyzeTopics.isPending}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="h-4 w-4 mr-2" />
            {analyzeTopics.isPending ? 'Analyzing...' : 'Analyze Topics'}
          </button>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <ChartWrapper title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="politics">Politics</option>
            <option value="technology">Technology</option>
            <option value="entertainment">Entertainment</option>
            <option value="sports">Sports</option>
            <option value="other">Other</option>
          </select>

          {/* Export Button */}
          <button className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </ChartWrapper>

      {/* Topics Table */}
      <ChartWrapper title={`Trending Topics (${filteredTopics.length})`}>
        
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i: any) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredTopics.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trending topics found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Click "Analyze Topics" to scan for new trending topics.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Topic
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
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
                {filteredTopics.map((topic: any) => (
                  <tr key={topic.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {topic.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {topic.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${getTrendScoreColor(topic.trend_score)}`}>
                        {topic.trend_score}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(topic.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {topic.source}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(topic.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {topic.status === 'pending' && (
                          <>
                            <button
                              onClick={() => approveTopic.mutate(topic.id)}
                              disabled={approveTopic.isPending}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => rejectTopic.mutate(topic.id)}
                              disabled={rejectTopic.isPending}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ChartWrapper>
    </div>
  );
};
