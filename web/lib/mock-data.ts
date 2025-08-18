import { TrendingTopic, GeneratedPoll, ActivityItem } from '@/types';

export const mockTrendingTopics: TrendingTopic[] = [
  {
    id: '1',
    title: 'Gavin Newsom vs Donald Trump',
    description: 'California Governor Challenges Former President',
    category: 'politics',
    trend_score: 95,
    trending_score: 95,
    status: 'active',
    source: 'Twitter Trends',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    title: 'AI Regulation Debate',
    description: 'Should AI development be regulated by governments?',
    category: 'technology',
    trend_score: 87,
    trending_score: 87,
    status: 'active',
    source: 'Reddit',
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    title: 'Climate Change Summit',
    description: 'Global Leaders Meet in Paris',
    category: 'environment',
    trend_score: 82,
    trending_score: 82,
    status: 'active',
    source: 'News API',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    title: 'Space Exploration',
    description: 'NASA Announces New Mars Mission',
    category: 'science',
    trend_score: 78,
    trending_score: 78,
    status: 'active',
    source: 'NASA',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    title: 'World Cup Final',
    description: 'Championship Match Draws Global Attention',
    category: 'sports',
    trend_score: 75,
    trending_score: 75,
    status: 'active',
    source: 'Sports News',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  }
];

export const mockGeneratedPolls: GeneratedPoll[] = [
  {
    id: '1',
    title: 'Who do you think would win in a debate between Gavin Newsom and Donald Trump?',
    options: ['Gavin Newsom', 'Donald Trump', 'Too close to call', 'Neither'],
    source_topic_id: '1',
    status: 'pending',
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    metrics: {
      total_votes: 0,
      engagement_rate: 0
    }
  },
  {
    id: '2',
    title: 'Should AI development be regulated by governments?',
    options: ['Yes, strict regulation', 'Yes, moderate regulation', 'No, let market decide', 'Not sure'],
    source_topic_id: '2',
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    metrics: {
      total_votes: 847,
      engagement_rate: 67.8
    }
  },
  {
    id: '3',
    title: 'What is the most important issue facing the world today?',
    options: ['Climate Change', 'Economic Inequality', 'Global Health', 'Political Polarization'],
    source_topic_id: '3',
    status: 'pending',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    metrics: {
      total_votes: 0,
      engagement_rate: 0
    }
  }
];

export const mockActivityFeed: ActivityItem[] = [
  {
    id: '1',
    title: 'Topic Created',
    type: 'topic_created',
    description: '"Gavin Newsom vs Donald Trump: California Governor Challenges Former President" was detected as trending',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    severity: 'info'
  },
  {
    id: '2',
    title: 'Poll Generated',
    type: 'poll_generated',
    description: '"Who do you think would win in a debate between Gavin Newsom and Donald Trump?" was generated from trending topic',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    severity: 'info'
  },
  {
    id: '3',
    title: 'Poll Approved',
    type: 'poll_approved',
    description: '"Should AI development be regulated by governments?" has been approved and is now live',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    title: 'System Alert',
    type: 'system_alert',
    description: 'All systems are operating normally. Database performance is optimal.',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    title: 'Topic Created',
    type: 'topic_created',
    description: '"Climate Change Summit: Global Leaders Meet in Paris" was detected as trending',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  }
];

// Mock chart data
export const mockChartData = {
  recentActivity: [
    { name: 'Mon', value: 12 },
    { name: 'Tue', value: 19 },
    { name: 'Wed', value: 15 },
    { name: 'Thu', value: 25 },
    { name: 'Fri', value: 22 },
    { name: 'Sat', value: 18 },
    { name: 'Sun', value: 24 },
  ],
  topicCategories: [
    { name: 'Politics', value: 35 },
    { name: 'Technology', value: 25 },
    { name: 'Entertainment', value: 20 },
    { name: 'Sports', value: 15 },
    { name: 'Other', value: 5 },
  ],
  pollPerformance: [
    { name: 'Jan', value: 65 },
    { name: 'Feb', value: 78 },
    { name: 'Mar', value: 82 },
    { name: 'Apr', value: 75 },
    { name: 'May', value: 88 },
    { name: 'Jun', value: 92 },
  ]
};

// Mock demographics response
export const getMockDemographicsResponse = () => ({
  totalUsers: 1250,
  recentPolls: [
    {
      poll_id: '1',
      total_votes: 847,
      participation_rate: 67.8,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      poll_id: '2',
      total_votes: 1247,
      participation_rate: 85.2,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    }
  ],
  recentVotes: [
    {
      poll_id: '1',
      voted_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
      poll_id: '2',
      voted_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
    }
  ],
  demographics: {
    ageGroups: [
      { name: '18-24', value: 25 },
      { name: '25-34', value: 35 },
      { name: '35-44', value: 20 },
      { name: '45-54', value: 15 },
      { name: '55+', value: 5 }
    ],
    locations: [
      { name: 'United States', value: 45 },
      { name: 'Europe', value: 25 },
      { name: 'Asia', value: 20 },
      { name: 'Other', value: 10 }
    ],
    interests: [
      { name: 'Politics', value: 30 },
      { name: 'Technology', value: 25 },
      { name: 'Environment', value: 20 },
      { name: 'Sports', value: 15 },
      { name: 'Other', value: 10 }
    ]
  }
});
