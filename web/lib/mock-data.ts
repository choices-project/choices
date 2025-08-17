import { TrendingTopic, GeneratedPoll, SystemMetrics, ActivityItem } from './admin-store';

// Mock trending topics data
export const mockTrendingTopics: TrendingTopic[] = [
  {
    id: '1',
    title: 'Gavin Newsom vs Donald Trump: California Governor Challenges Former President',
    category: 'politics',
    trend_score: 95,
    status: 'pending',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    source: 'Twitter Trends'
  },
  {
    id: '2',
    title: 'AI Regulation Debate: Tech Leaders vs Government Officials',
    category: 'technology',
    trend_score: 87,
    status: 'approved',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    source: 'Reddit'
  },
  {
    id: '3',
    title: 'Climate Change Summit: Global Leaders Meet in Paris',
    category: 'politics',
    trend_score: 82,
    status: 'pending',
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    source: 'News API'
  },
  {
    id: '4',
    title: 'SpaceX Starship Launch: Latest Mission to Mars',
    category: 'technology',
    trend_score: 78,
    status: 'rejected',
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    source: 'NASA'
  },
  {
    id: '5',
    title: 'Olympic Games 2024: Controversy Over Russian Athletes',
    category: 'sports',
    trend_score: 75,
    status: 'approved',
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    source: 'Sports News'
  }
];

// Mock generated polls data
export const mockGeneratedPolls: GeneratedPoll[] = [
  {
    id: '1',
    title: 'Who do you think would win in a debate between Gavin Newsom and Donald Trump?',
    options: ['Gavin Newsom', 'Donald Trump', 'It would be a tie', 'Neither would win'],
    source_topic_id: '1',
    status: 'pending',
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    metrics: {
      total_votes: 0,
      engagement_rate: 0
    }
  },
  {
    id: '2',
    title: 'Should AI development be regulated by governments?',
    options: ['Yes, strict regulation needed', 'Yes, but minimal regulation', 'No, let the market decide', 'Not sure'],
    source_topic_id: '2',
    status: 'approved',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    metrics: {
      total_votes: 1247,
      engagement_rate: 85.2
    }
  },
  {
    id: '3',
    title: 'Do you support the new climate change agreements?',
    options: ['Strongly support', 'Somewhat support', 'Neutral', 'Oppose', 'Strongly oppose'],
    source_topic_id: '3',
    status: 'pending',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    metrics: {
      total_votes: 0,
      engagement_rate: 0
    }
  }
];

// Mock system metrics
export const mockSystemMetrics: SystemMetrics = {
  total_topics: 15,
  total_polls: 8,
  active_polls: 3,
  system_health: 'healthy',
  last_updated: new Date().toISOString()
};

// Mock activity feed
export const mockActivityFeed: ActivityItem[] = [
  {
    id: '1',
    type: 'topic_created',
    title: 'New Trending Topic',
    description: '"Gavin Newsom vs Donald Trump: California Governor Challenges Former President" was detected as trending',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    severity: 'info'
  },
  {
    id: '2',
    type: 'poll_generated',
    title: 'New Poll Generated',
    description: '"Who do you think would win in a debate between Gavin Newsom and Donald Trump?" was generated from trending topic',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    severity: 'info'
  },
  {
    id: '3',
    type: 'poll_approved',
    title: 'Poll Approved',
    description: '"Should AI development be regulated by governments?" has been approved and is now live',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    severity: 'info'
  },
  {
    id: '4',
    type: 'system_alert',
    title: 'System Health Check',
    description: 'All systems are operating normally. Database performance is optimal.',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    severity: 'info'
  },
  {
    id: '5',
    type: 'topic_created',
    title: 'New Trending Topic',
    description: '"Climate Change Summit: Global Leaders Meet in Paris" was detected as trending',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    severity: 'info'
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
