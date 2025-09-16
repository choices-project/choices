'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PollTemplate, PollCategory, TemplateCategory } from '@/lib/types/poll-templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Star, Clock, Users, Plus, Eye, BookOpen } from 'lucide-react';
import { devLog } from '@/lib/logger';

const TEMPLATECATEGORIES: TemplateCategory[] = [
  { id: 'general', name: 'General', description: 'General purpose polls', icon: '📊', color: 'blue', templateCount: 12 },
  { id: 'business', name: 'Business', description: 'Business and workplace polls', icon: '💼', color: 'green', templateCount: 8 },
  { id: 'education', name: 'Education', description: 'Educational and academic polls', icon: '🎓', color: 'purple', templateCount: 6 },
  { id: 'entertainment', name: 'Entertainment', description: 'Entertainment and media polls', icon: '🎬', color: 'pink', templateCount: 10 },
  { id: 'politics', name: 'Politics', description: 'Political and social issues', icon: '🗳️', color: 'red', templateCount: 5 },
  { id: 'technology', name: 'Technology', description: 'Technology and innovation polls', icon: '💻', color: 'indigo', templateCount: 9 },
  { id: 'health', name: 'Health', description: 'Health and wellness polls', icon: '🏥', color: 'emerald', templateCount: 7 },
  { id: 'sports', name: 'Sports', description: 'Sports and fitness polls', icon: '⚽', color: 'orange', templateCount: 4 },
];

const SAMPLETEMPLATES: PollTemplate[] = [
  {
    id: '1',
    name: 'Team Meeting Preferences',
    title: 'Team Meeting Preferences',
    description: 'Find the best time for team meetings that works for everyone',
    category: 'business',
    options: ['Monday 9 AM', 'Tuesday 2 PM', 'Wednesday 10 AM', 'Thursday 3 PM'],
    privacyLevel: 'private',
    estimatedDuration: 5,
    estimatedTime: 5,
    difficulty: 'beginner',
    isPopular: true,
    tags: ['meeting', 'team', 'schedule'],
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    usageCount: 1250,
    rating: 4.8,
    steps: [],
    defaultSettings: {
      allowMultipleVotes: false,
      allowAnonymousVotes: true,
      requireEmail: false,
      showResults: true,
      allowComments: true,
      enableNotifications: true,
      votingMethod: 'single',
      privacyLevel: 'private',
      moderationEnabled: false,
      autoClose: false,
    },
  },
  {
    id: '2',
    name: 'Product Feature Prioritization',
    title: 'Product Feature Prioritization',
    description: 'Help prioritize which features to build next based on user preferences',
    category: 'technology',
    options: ['User Authentication', 'Real-time Chat', 'File Sharing', 'Analytics Dashboard'],
    privacyLevel: 'public',
    estimatedDuration: 8,
    estimatedTime: 8,
    difficulty: 'intermediate',
    isPopular: true,
    tags: ['product', 'features', 'prioritization'],
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    usageCount: 890,
    rating: 4.6,
    steps: [],
    defaultSettings: {
      allowMultipleVotes: true,
      allowAnonymousVotes: false,
      requireEmail: true,
      showResults: false,
      allowComments: true,
      enableNotifications: true,
      votingMethod: 'ranked',
      privacyLevel: 'public',
      moderationEnabled: true,
      autoClose: true,
    },
  },
  {
    id: '3',
    name: 'Event Planning Survey',
    title: 'Event Planning Survey',
    description: 'Gather preferences for upcoming events and activities',
    category: 'social',
    options: ['Outdoor BBQ', 'Indoor Party', 'Movie Night', 'Game Night'],
    privacyLevel: 'public',
    estimatedDuration: 3,
    estimatedTime: 3,
    difficulty: 'beginner',
    isPopular: true,
    tags: ['event', 'planning', 'social'],
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    usageCount: 2100,
    rating: 4.9,
    steps: [],
    defaultSettings: {
      allowMultipleVotes: true,
      allowAnonymousVotes: true,
      requireEmail: false,
      showResults: true,
      allowComments: true,
      enableNotifications: false,
      votingMethod: 'multiple',
      privacyLevel: 'public',
      moderationEnabled: false,
      autoClose: false,
    },
  },
  {
    id: '4',
    name: 'Classroom Feedback',
    title: 'Classroom Feedback',
    description: 'Collect student feedback on course content and teaching methods',
    category: 'education',
    options: ['Excellent', 'Good', 'Average', 'Needs Improvement'],
    privacyLevel: 'private',
    estimatedDuration: 6,
    estimatedTime: 6,
    difficulty: 'intermediate',
    isPopular: false,
    tags: ['education', 'feedback', 'classroom'],
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    usageCount: 650,
    rating: 4.7,
    steps: [],
    defaultSettings: {
      allowMultipleVotes: false,
      allowAnonymousVotes: true,
      requireEmail: false,
      showResults: false,
      allowComments: true,
      enableNotifications: true,
      votingMethod: 'single',
      privacyLevel: 'private',
      moderationEnabled: true,
      autoClose: true,
    },
  },
  {
    id: '5',
    name: 'Restaurant Choice',
    title: 'Restaurant Choice',
    description: 'Decide where to eat with friends or colleagues',
    category: 'food',
    options: ['Italian', 'Mexican', 'Asian', 'American'],
    privacyLevel: 'public',
    estimatedDuration: 2,
    estimatedTime: 2,
    difficulty: 'beginner',
    isPopular: true,
    tags: ['food', 'restaurant', 'choice'],
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
    usageCount: 3200,
    rating: 4.5,
    steps: [],
    defaultSettings: {
      allowMultipleVotes: false,
      allowAnonymousVotes: true,
      requireEmail: false,
      showResults: true,
      allowComments: true,
      enableNotifications: false,
      votingMethod: 'single',
      privacyLevel: 'public',
      moderationEnabled: false,
      autoClose: false,
    },
  },
  {
    id: '6',
    name: 'Project Timeline Estimation',
    title: 'Project Timeline Estimation',
    description: 'Estimate project timelines and identify potential bottlenecks',
    category: 'business',
    options: ['2 weeks', '1 month', '2 months', '3+ months'],
    privacyLevel: 'private',
    estimatedDuration: 12,
    estimatedTime: 12,
    difficulty: 'advanced',
    isPopular: false,
    tags: ['project', 'timeline', 'estimation'],
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
    usageCount: 420,
    rating: 4.4,
    steps: [],
    defaultSettings: {
      allowMultipleVotes: true,
      allowAnonymousVotes: false,
      requireEmail: true,
      showResults: false,
      allowComments: true,
      enableNotifications: true,
      votingMethod: 'ranked',
      privacyLevel: 'private',
      moderationEnabled: true,
      autoClose: true,
    },
  },
];

export default function PollTemplatesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PollCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating' | 'name'>('popular');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [templates, _setTemplates] = useState<PollTemplate[]>(SAMPLETEMPLATES);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'popular':
        comparison = b.usageCount - a.usageCount;
        break;
      case 'recent':
        comparison = b.createdAt.getTime() - a.createdAt.getTime();
        break;
      case 'rating':
        comparison = b.rating - a.rating;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
    }
    
    return sortOrder === 'desc' ? comparison : -comparison;
  });

  const handleUseTemplate = (template: PollTemplate) => {
    router.push(`/polls/create?template=${template.id}`);
  };

  const previewTemplate = (template: PollTemplate) => {
    devLog('Preview template:', template);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Poll Templates</h1>
          <p className="text-gray-600 mt-2">Choose from our collection of pre-built poll templates to get started quickly</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as PollCategory | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {TEMPLATECATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.templateCount})
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="popular">Most Popular</option>
                <option value="recent">Recently Added</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Name A-Z</option>
              </select>
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="px-3"
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </Button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              All Templates
            </button>
            {TEMPLATECATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id as PollCategory | 'all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {sortedTemplates.length} of {templates.length} templates
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{template.name}</CardTitle>
                    <CardDescription className="text-sm mb-3">
                      {template.description}
                    </CardDescription>
                  </div>
                  <Badge className={getDifficultyColor(template.difficulty)}>
                    {template.difficulty}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {template.estimatedTime} min
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {template.usageCount.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {template.rating}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <Separator className="mb-4" />
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => previewTemplate(template)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {sortedTemplates.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
