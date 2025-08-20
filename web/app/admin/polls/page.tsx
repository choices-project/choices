/**
 * Polls Management Page
 * 
 * Admin interface for managing polls and voting.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Plus,
  Download,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lock,
  Globe,
  Settings
} from 'lucide-react';
import { devLog } from '@/lib/logger';

interface Poll {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'draft' | 'closed' | 'archived';
  visibility: 'public' | 'private' | 'restricted';
  createdBy: string;
  createdAt: string;
  endDate: string;
  totalVotes: number;
  totalParticipants: number;
  options: string[];
  category: string;
  tags: string[];
  featured: boolean;
}

export default function PollsManagementPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [filteredPolls, setFilteredPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'closed' | 'archived'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private' | 'restricted'>('all');
  const [selectedPolls, setSelectedPolls] = useState<string[]>([]);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchPolls = () => {
      const mockPolls: Poll[] = [
        {
          id: '1',
          title: 'Favorite Programming Language 2024',
          description: 'Which programming language do you prefer for web development?',
          status: 'active',
          visibility: 'public',
          createdBy: 'admin@choices.com',
          createdAt: '2024-12-15',
          endDate: '2024-12-25',
          totalVotes: 1247,
          totalParticipants: 892,
          options: ['JavaScript', 'Python', 'TypeScript', 'Rust', 'Go'],
          category: 'Technology',
          tags: ['programming', 'web-development', 'survey'],
          featured: true
        },
        {
          id: '2',
          title: 'Best Pizza Topping',
          description: 'What is your favorite pizza topping?',
          status: 'active',
          visibility: 'public',
          createdBy: 'john.doe@example.com',
          createdAt: '2024-12-18',
          endDate: '2024-12-28',
          totalVotes: 567,
          totalParticipants: 445,
          options: ['Pepperoni', 'Mushrooms', 'Cheese', 'Veggies', 'Meat'],
          category: 'Food',
          tags: ['pizza', 'food', 'preferences'],
          featured: false
        },
        {
          id: '3',
          title: 'Remote Work Preferences',
          description: 'How do you prefer to work?',
          status: 'draft',
          visibility: 'private',
          createdBy: 'jane.smith@example.com',
          createdAt: '2024-12-19',
          endDate: '2024-12-29',
          totalVotes: 0,
          totalParticipants: 0,
          options: ['Fully Remote', 'Hybrid', 'Office Only'],
          category: 'Work',
          tags: ['remote-work', 'workplace'],
          featured: false
        },
        {
          id: '4',
          title: 'Climate Change Awareness',
          description: 'How concerned are you about climate change?',
          status: 'closed',
          visibility: 'public',
          createdBy: 'admin@choices.com',
          createdAt: '2024-11-20',
          endDate: '2024-12-10',
          totalVotes: 2341,
          totalParticipants: 1892,
          options: ['Very Concerned', 'Somewhat Concerned', 'Not Concerned', 'Unsure'],
          category: 'Environment',
          tags: ['climate', 'environment', 'awareness'],
          featured: true
        },
        {
          id: '5',
          title: 'Mobile App Usage',
          description: 'Which mobile apps do you use most frequently?',
          status: 'archived',
          visibility: 'restricted',
          createdBy: 'bob.wilson@example.com',
          createdAt: '2024-10-15',
          endDate: '2024-11-15',
          totalVotes: 892,
          totalParticipants: 567,
          options: ['Social Media', 'Productivity', 'Entertainment', 'Shopping', 'Other'],
          category: 'Technology',
          tags: ['mobile', 'apps', 'usage'],
          featured: false
        }
      ];

      setPolls(mockPolls);
      setFilteredPolls(mockPolls);
      setLoading(false);
    };

    fetchPolls();
  }, []);

  // Filter polls based on search and filters
  useEffect(() => {
    let filtered = polls;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(poll =>
        poll.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        poll.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        poll.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(poll => poll.status === statusFilter);
    }

    // Visibility filter
    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(poll => poll.visibility === visibilityFilter);
    }

    setFilteredPolls(filtered);
  }, [polls, searchTerm, statusFilter, visibilityFilter]);

  const handlePollSelection = (pollId: string) => {
    setSelectedPolls(prev => 
      prev.includes(pollId) 
        ? prev.filter(id => id !== pollId)
        : [...prev, pollId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPolls.length === filteredPolls.length) {
      setSelectedPolls([]);
    } else {
      setSelectedPolls(filteredPolls.map(poll => poll.id));
    }
  };

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'archive' | 'delete' | 'feature') => {
    // Implement bulk actions
    devLog(`Bulk action: ${action}`, selectedPolls);
    setSelectedPolls([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'draft':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'closed':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'archived':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'private':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'restricted':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-4 w-4" />;
      case 'private':
        return <Lock className="h-4 w-4" />;
      case 'restricted':
        return <Settings className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i: any) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Polls Management</h1>
          <p className="text-gray-600 mt-1">Manage polls and voting activities</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" />
            <span>Create Poll</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Polls</p>
              <p className="text-2xl font-bold text-gray-900">{polls.length}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Polls</p>
              <p className="text-2xl font-bold text-gray-900">
                {polls.filter(p => p.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Votes</p>
              <p className="text-2xl font-bold text-gray-900">
                {polls.reduce((sum: any, poll: any) => sum + poll.totalVotes, 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Featured Polls</p>
              <p className="text-2xl font-bold text-gray-900">
                {polls.filter(p => p.featured).length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search polls by title, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Visibility Filter */}
          <div>
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Visibility</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="restricted">Restricted</option>
            </select>
          </div>

          {/* Refresh */}
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPolls.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedPolls.length} poll(s) selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkAction('archive')}
                  className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                >
                  Archive
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
            <button
              onClick={() => setSelectedPolls([])}
              className="text-blue-600 hover:text-blue-800"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Polls Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedPolls.length === filteredPolls.length && filteredPolls.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Poll
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visibility
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ends
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPolls.map((poll: any) => (
                <tr key={poll.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedPolls.includes(poll.id)}
                      onChange={() => handlePollSelection(poll.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900">{poll.title}</h3>
                          {poll.featured && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{poll.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-gray-500">{poll.category}</span>
                          <div className="flex space-x-1">
                            {poll.tags.slice(0, 2).map((tag, index: any) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {tag}
                              </span>
                            ))}
                            {poll.tags.length > 2 && (
                              <span className="text-xs text-gray-500">+{poll.tags.length - 2} more</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(poll.status)}`}>
                      {poll.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getVisibilityIcon(poll.visibility)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getVisibilityColor(poll.visibility)}`}>
                        {poll.visibility}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-sm text-gray-900">{poll.totalVotes.toLocaleString()} votes</div>
                    <div className="text-sm text-gray-500">{poll.totalParticipants.toLocaleString()} participants</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(poll.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(poll.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPolls.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No polls found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {filteredPolls.length} of {polls.length} polls
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Previous
          </button>
          <button className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md">
            1
          </button>
          <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
