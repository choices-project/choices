// Mock data for admin system

export const mockActivityFeed = [
  {
    id: '1',
    type: 'user_registration',
    message: 'New user registered',
    timestamp: new Date().toISOString(),
    metadata: { userId: 'user-1' }
  },
  {
    id: '2',
    type: 'poll_created',
    message: 'New poll created',
    timestamp: new Date().toISOString(),
    metadata: { pollId: 'poll-1' }
  }
];

export const mockSystemMetrics = {
  totalUsers: 150,
  totalPolls: 25,
  activePolls: 8,
  totalVotes: 1200,
  systemHealth: 'good' as const
};

export const mockChartData = {
  userGrowth: [
    { month: 'Jan', users: 100 },
    { month: 'Feb', users: 120 },
    { month: 'Mar', users: 140 },
    { month: 'Apr', users: 150 }
  ],
  pollActivity: [
    { day: 'Mon', polls: 5 },
    { day: 'Tue', polls: 8 },
    { day: 'Wed', polls: 6 },
    { day: 'Thu', polls: 10 },
    { day: 'Fri', polls: 7 }
  ],
  recentActivity: [
    { month: 'Jan', count: 45 },
    { month: 'Feb', count: 52 },
    { month: 'Mar', count: 48 },
    { month: 'Apr', count: 61 }
  ],
  topicCategories: [
    { category: 'Technology', count: 25 },
    { category: 'Politics', count: 18 },
    { category: 'Environment', count: 12 },
    { category: 'Health', count: 8 },
    { category: 'Education', count: 6 }
  ]
};

// Mock types for disabled services
export interface BreakingNewsStory {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  source: string;
}

export interface PollContext {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}
