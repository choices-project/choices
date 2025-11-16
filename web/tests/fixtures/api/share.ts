export const SHARE_ANALYTICS_FIXTURE = {
  analytics: {
    totalShares: 128,
    platformBreakdown: {
      twitter: 64,
      facebook: 32,
      sms: 16,
      other: 16,
    },
    topPolls: [
      { pollId: 'share-poll-1', shares: 24 },
      { pollId: 'share-poll-2', shares: 18 },
    ],
    periodDays: 7,
    filters: {
      platform: 'all',
      pollId: 'all',
    },
  },
};

export const buildShareAnalytics = (overrides = {}) => ({
  analytics: {
    ...SHARE_ANALYTICS_FIXTURE.analytics,
    ...overrides,
  },
});

