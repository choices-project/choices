/**
 * @jest-environment jsdom
 */
import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import AdminDashboard from '@/features/admin/components/AdminDashboard';
import type * as StoresModule from '@/lib/stores';
import type * as FeedsStoreModule from '@/lib/stores/feedsStore';

const mockGetTrendingHashtags = jest.fn();

const baseUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  role: 'admin' as const,
};
jest.mock('@/lib/performance/performance-metrics', () => ({
  performanceMetrics: {
    addMetric: jest.fn(),
  },
}));

jest.mock('@/lib/performance/lazy-loading', () => ({
  createLazyComponent: () => () => <div data-testid="lazy-component" />,
}));

jest.mock('@/lib/stores', () => ({
  useAdminActiveTab: jest.fn(),
  useAdminDashboardStats: jest.fn(),
  useAdminDashboardActions: jest.fn(),
  useAdminLoading: jest.fn(),
  useAdminError: jest.fn(),
  useAdminStats: jest.fn(),
  useAdminNotifications: jest.fn(),
  useTrendingTopics: jest.fn(),
  useRecentActivity: jest.fn(),
  useHashtagActions: jest.fn(),
  useHashtagLoading: jest.fn(),
  useHashtagError: jest.fn(),
  useTrendingHashtags: jest.fn(),
}));

jest.mock('@/lib/stores/feedsStore', () => ({
  useFeedsActions: jest.fn(),
  useFeeds: jest.fn(),
  useFeedsLoading: jest.fn(),
  useFeedsError: jest.fn(),
}));

jest.mock('@/lib/utils/logger', () => {
  const loggerMock = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  return {
    __esModule: true,
    logger: loggerMock,
    devLog: jest.fn(),
    default: loggerMock,
  };
});

describe('AdminDashboard', () => {
  let loadDashboardStatsMock: jest.Mock;
  const mockedStores = jest.requireMock('@/lib/stores') as jest.Mocked<StoresModule>;
  const mockedFeedsStore = jest.requireMock('@/lib/stores/feedsStore') as jest.Mocked<FeedsStoreModule>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTrendingHashtags.mockReset();

    loadDashboardStatsMock = jest.fn().mockResolvedValue(undefined);

    mockedStores.useAdminActiveTab.mockReturnValue('overview');
    mockedStores.useAdminDashboardStats.mockReturnValue(null);
    mockedStores.useAdminDashboardActions.mockReturnValue({
      setActiveTab: jest.fn(),
      loadDashboardStats: loadDashboardStatsMock,
    });
    mockedStores.useAdminLoading.mockReturnValue(false);
    mockedStores.useAdminError.mockReturnValue(null);
    mockedStores.useAdminStats.mockReturnValue({ unreadNotifications: 0 });
    mockedStores.useAdminNotifications.mockReturnValue([]);
    mockedStores.useTrendingTopics.mockReturnValue([]);
    mockedStores.useRecentActivity.mockReturnValue([]);
    mockedStores.useHashtagActions.mockReturnValue({
      getTrendingHashtags: (...args: Parameters<typeof mockGetTrendingHashtags>) =>
        mockGetTrendingHashtags(...args),
    });
    mockedStores.useHashtagLoading.mockReturnValue({ isLoading: false });
    mockedStores.useHashtagError.mockReturnValue({ error: null, searchError: null, followError: null, createError: null });
    mockedStores.useTrendingHashtags.mockReturnValue([]);

    mockedFeedsStore.useFeedsActions.mockReturnValue({ getFeeds: jest.fn(), refreshFeeds: jest.fn() });
    mockedFeedsStore.useFeeds.mockReturnValue([]);
    mockedFeedsStore.useFeedsLoading.mockReturnValue({ isLoading: false });
    mockedFeedsStore.useFeedsError.mockReturnValue({ error: null });
  });

  it('renders loading skeleton when admin data is loading', () => {
    mockedStores.useAdminLoading.mockReturnValue(true);
    mockedStores.useAdminError.mockReturnValue(null);

    const { container } = render(<AdminDashboard user={baseUser} onLogout={jest.fn()} />);
    expect(container.querySelector('.animate-pulse')).not.toBeNull();
  });

  it('renders error state when admin dashboard fails to load', () => {
    mockedStores.useAdminLoading.mockReturnValue(false);
    mockedStores.useAdminError.mockReturnValue('Something went wrong');

    render(<AdminDashboard user={baseUser} onLogout={jest.fn()} />);

    expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders overview metrics and triggers data loaders on mount', async () => {
    mockedStores.useAdminLoading.mockReturnValue(false);
    mockedStores.useAdminError.mockReturnValue(null);
    mockedStores.useAdminNotifications.mockReturnValue([
      {
        id: 'notif-1',
        timestamp: '2025-01-01T00:00:00.000Z',
        type: 'info',
        title: 'Welcome',
        message: 'Review the latest dashboard',
        read: false,
        created_at: '2025-01-01T00:00:00.000Z',
      },
    ]);
    mockedStores.useRecentActivity.mockReturnValue([
      {
        id: 'activity-1',
        type: 'poll',
        title: 'New poll launched',
        description: 'Poll 42 is now live',
        timestamp: '2025-01-01T00:00:00.000Z',
      },
    ]);
    mockedStores.useTrendingTopics.mockReturnValue([
      {
        id: 'topic-1',
        title: 'Civic Engagement',
        description: 'Residents discussing local issues',
        category: 'community',
        trending_score: 72,
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
      },
    ]);
    mockedStores.useAdminDashboardStats.mockReturnValue({
      totalUsers: 128,
      activePolls: 14,
      totalVotes: 4521,
      systemHealth: 'healthy',
      pollsCreatedLast7Days: 9,
      pollsCreatedToday: 2,
      milestoneAlertsLast7Days: 3,
      shareActionsLast24h: 11,
      topShareChannel: { channel: 'email', count: 7 },
      latestMilestone: {
        pollId: 'poll-42',
        milestone: 500,
        occurredAt: '2025-01-01T12:00:00.000Z',
      },
    });
    mockedStores.useAdminStats.mockReturnValue({ unreadNotifications: 1 });

    render(<AdminDashboard user={baseUser} onLogout={jest.fn()} />);

    await waitFor(() => expect(loadDashboardStatsMock).toHaveBeenCalled());
    await waitFor(() => expect(mockGetTrendingHashtags).toHaveBeenCalledWith(undefined, 6));

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome back, admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('You have 1 unread admin alert.')).toBeInTheDocument();
    expect(
      screen.getAllByText('Email is leading with 7 share actions in the last 24 hours.'),
    ).not.toHaveLength(0);
    expect(screen.getByText('Latest milestone: poll-42 · 500 votes')).toBeInTheDocument();
  });
});

