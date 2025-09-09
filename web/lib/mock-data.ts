// Mock data for admin dashboard and testing

export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  user: string;
}

export interface ChartDataPoint {
  month: string;
  count: number;
}

export interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalPolls: number;
  activePolls: number;
  systemUptime: string;
  responseTime: string;
}

export interface DemographicsData {
  ageDistribution: Array<{ age: string; count: number }>;
  locationDistribution: Array<{ location: string; count: number }>;
  engagementLevels: Array<{ level: string; count: number }>;
  lastUpdated: string;
  totalUsers: number;
  recentPolls: any[];
  recentVotes: any[];
}

export const mockActivityFeed: ActivityItem[] = [
  {
    id: '1',
    type: 'poll_created',
    message: 'New poll created: "What should we focus on next?"',
    timestamp: new Date().toISOString(),
    user: 'Admin User'
  },
  {
    id: '2',
    type: 'user_registered',
    message: 'New user registered: john.doe@example.com',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    user: 'System'
  }
];

export const mockChartData = {
  users: [
    { month: 'Jan', count: 120 },
    { month: 'Feb', count: 150 },
    { month: 'Mar', count: 180 },
    { month: 'Apr', count: 200 }
  ],
  polls: [
    { month: 'Jan', count: 45 },
    { month: 'Feb', count: 52 },
    { month: 'Mar', count: 68 },
    { month: 'Apr', count: 75 }
  ],
  recentActivity: [
    { month: 'Jan', count: 25 },
    { month: 'Feb', count: 32 },
    { month: 'Mar', count: 28 },
    { month: 'Apr', count: 35 }
  ],
  topicCategories: [
    { category: 'Politics', count: 45 },
    { category: 'Technology', count: 32 },
    { category: 'Environment', count: 28 },
    { category: 'Health', count: 35 }
  ]
};

export const mockSystemMetrics: SystemMetrics = {
  totalUsers: 1250,
  activeUsers: 890,
  totalPolls: 156,
  activePolls: 23,
  systemUptime: '99.9%',
  responseTime: '120ms'
};

export const getMockDemographicsResponse = (): DemographicsData => ({
  ageDistribution: [
    { age: '18-24', count: 120 },
    { age: '25-34', count: 280 },
    { age: '35-44', count: 190 },
    { age: '45-54', count: 150 },
    { age: '55+', count: 100 }
  ],
  locationDistribution: [
    { location: 'United States', count: 450 },
    { location: 'Canada', count: 120 },
    { location: 'United Kingdom', count: 80 },
    { location: 'Australia', count: 60 },
    { location: 'Other', count: 130 }
  ],
  engagementLevels: [
    { level: 'High', count: 200 },
    { level: 'Medium', count: 350 },
    { level: 'Low', count: 290 }
  ],
  lastUpdated: new Date().toISOString(),
  totalUsers: 840,
  recentPolls: [],
  recentVotes: []
});