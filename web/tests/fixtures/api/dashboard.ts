import type { MockPollRecord } from './polls';

export type DashboardAnalytics = {
  total_votes: number;
  total_polls_created: number;
  participation_score: number;
  recent_activity: {
    votes_last_30_days: number;
    polls_created_last_30_days: number;
  };
};

export type PlatformStats = {
  activeUsers: number;
  newPolls: number;
};

export type DashboardData = {
  platform: PlatformStats;
  polls: MockPollRecord[];
  analytics: DashboardAnalytics;
};

export const buildDashboardData = (polls: MockPollRecord[]): DashboardData => ({
  platform: {
    activeUsers: 120,
    newPolls: polls.length,
  },
  polls,
  analytics: {
    total_votes: 480,
    total_polls_created: polls.length,
    participation_score: 78,
    recent_activity: {
      votes_last_30_days: 140,
      polls_created_last_30_days: 6,
    },
  },
});

