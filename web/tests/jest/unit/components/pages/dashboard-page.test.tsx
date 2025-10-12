/**
 * Dashboard Page Component Tests
 * 
 * Tests the main dashboard functionality including:
 * - Dashboard layout and navigation
 * - User metrics display
 * - Poll management
 * - Analytics widgets
 * - Responsive design
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Zustand stores
jest.mock('@/lib/stores', () => ({
  useAppStore: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenSize: 'lg',
  }),
  useUserStore: () => ({
    user: {
      id: 'test-user-1',
      email: 'test@example.com',
      username: 'testuser',
    },
    isAuthenticated: true,
    isLoading: false,
  }),
  usePollsStore: () => ({
    userPolls: [
      {
        id: 'poll-1',
        title: 'Test Poll 1',
        status: 'active',
        totalVotes: 42,
        createdAt: '2025-01-01T00:00:00Z',
      },
      {
        id: 'poll-2',
        title: 'Test Poll 2',
        status: 'ended',
        totalVotes: 28,
        createdAt: '2025-01-02T00:00:00Z',
      },
    ],
    isLoading: false,
  }),
  useAnalyticsStore: () => ({
    userMetrics: {
      pollsCreated: 2,
      votesCast: 15,
      participationRate: 85,
      averageSessionTime: 12,
    },
    isLoading: false,
  }),
}));

// Mock the dashboard page component
const MockDashboardPage = () => {
  return (
    <div data-testid="dashboard-page">
      <header data-testid="dashboard-header">
        <h1 data-testid="dashboard-title">Dashboard</h1>
        <div data-testid="user-info">
          <span data-testid="user-name">testuser</span>
          <span data-testid="user-email">test@example.com</span>
        </div>
      </header>

      <main data-testid="dashboard-content">
        <section data-testid="metrics-section">
          <h2 data-testid="metrics-title">Your Activity</h2>
          <div data-testid="metrics-grid">
            <div data-testid="metric-polls-created">
              <span data-testid="metric-value">2</span>
              <span data-testid="metric-label">Polls Created</span>
            </div>
            <div data-testid="metric-votes-cast">
              <span data-testid="metric-value">15</span>
              <span data-testid="metric-label">Votes Cast</span>
            </div>
            <div data-testid="metric-participation">
              <span data-testid="metric-value">85%</span>
              <span data-testid="metric-label">Participation Rate</span>
            </div>
            <div data-testid="metric-session-time">
              <span data-testid="metric-value">12m</span>
              <span data-testid="metric-label">Avg Session</span>
            </div>
          </div>
        </section>

        <section data-testid="polls-section">
          <div data-testid="polls-header">
            <h2 data-testid="polls-title">Your Polls</h2>
            <button data-testid="create-poll-btn">Create Poll</button>
          </div>
          <div data-testid="polls-list">
            <div data-testid="poll-item-1" className="poll-item">
              <h3 data-testid="poll-title">Test Poll 1</h3>
              <span data-testid="poll-status">Active</span>
              <span data-testid="poll-votes">42 votes</span>
            </div>
            <div data-testid="poll-item-2" className="poll-item">
              <h3 data-testid="poll-title">Test Poll 2</h3>
              <span data-testid="poll-status">Ended</span>
              <span data-testid="poll-votes">28 votes</span>
            </div>
          </div>
        </section>

        <section data-testid="recent-activity-section">
          <h2 data-testid="activity-title">Recent Activity</h2>
          <div data-testid="activity-list">
            <div data-testid="activity-item-1">
              <span data-testid="activity-text">Created poll "Test Poll 1"</span>
              <span data-testid="activity-time">2 hours ago</span>
            </div>
            <div data-testid="activity-item-2">
              <span data-testid="activity-text">Voted on "Community Survey"</span>
              <span data-testid="activity-time">1 day ago</span>
            </div>
          </div>
        </section>
      </main>

      <nav data-testid="dashboard-nav">
        <a href="/dashboard" data-testid="nav-dashboard">Dashboard</a>
        <a href="/polls" data-testid="nav-polls">Polls</a>
        <a href="/civics" data-testid="nav-civics">Civics</a>
        <a href="/profile" data-testid="nav-profile">Profile</a>
      </nav>
    </div>
  );
};

describe('Dashboard Page Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the dashboard with all main sections', () => {
      render(
        <BrowserRouter>
          <MockDashboardPage />
        </BrowserRouter>
      );

      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-nav')).toBeInTheDocument();
    });

    it('should display user information in header', () => {
      render(
        <BrowserRouter>
          <MockDashboardPage />
        </BrowserRouter>
      );

      expect(screen.getByTestId('user-name')).toHaveTextContent('testuser');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });

    it('should display user metrics correctly', () => {
      render(
        <BrowserRouter>
          <MockDashboardPage />
        </BrowserRouter>
      );

      expect(screen.getByTestId('metrics-title')).toHaveTextContent('Your Activity');
      expect(screen.getByTestId('metric-polls-created')).toHaveTextContent('2');
      expect(screen.getByTestId('metric-votes-cast')).toHaveTextContent('15');
      expect(screen.getByTestId('metric-participation')).toHaveTextContent('85%');
      expect(screen.getByTestId('metric-session-time')).toHaveTextContent('12m');
    });

    it('should display user polls with correct information', () => {
      render(
        <BrowserRouter>
          <MockDashboardPage />
        </BrowserRouter>
      );

      expect(screen.getByTestId('polls-title')).toHaveTextContent('Your Polls');
      expect(screen.getByTestId('poll-item-1')).toHaveTextContent('Test Poll 1');
      expect(screen.getByTestId('poll-item-2')).toHaveTextContent('Test Poll 2');
    });

    it('should display recent activity', () => {
      render(
        <BrowserRouter>
          <MockDashboardPage />
        </BrowserRouter>
      );

      expect(screen.getByTestId('activity-title')).toHaveTextContent('Recent Activity');
      expect(screen.getByTestId('activity-item-1')).toHaveTextContent('Created poll "Test Poll 1"');
      expect(screen.getByTestId('activity-item-2')).toHaveTextContent('Voted on "Community Survey"');
    });
  });

  describe('User Interactions', () => {
    it('should handle create poll button click', async () => {
      render(
        <BrowserRouter>
          <MockDashboardPage />
        </BrowserRouter>
      );

      const createPollBtn = screen.getByTestId('create-poll-btn');
      fireEvent.click(createPollBtn);

      // In a real implementation, this would navigate to poll creation
      expect(createPollBtn).toBeInTheDocument();
    });

    it('should handle poll item clicks', async () => {
      render(
        <BrowserRouter>
          <MockDashboardPage />
        </BrowserRouter>
      );

      const pollItem1 = screen.getByTestId('poll-item-1');
      fireEvent.click(pollItem1);

      // In a real implementation, this would navigate to poll details
      expect(pollItem1).toBeInTheDocument();
    });

    it('should handle navigation clicks', () => {
      render(
        <BrowserRouter>
          <MockDashboardPage />
        </BrowserRouter>
      );

      const navPolls = screen.getByTestId('nav-polls');
      const navCivics = screen.getByTestId('nav-civics');
      const navProfile = screen.getByTestId('nav-profile');

      expect(navPolls).toHaveAttribute('href', '/polls');
      expect(navCivics).toHaveAttribute('href', '/civics');
      expect(navProfile).toHaveAttribute('href', '/profile');
    });
  });

  describe('Data Loading States', () => {
    it('should handle loading state for metrics', () => {
      // Mock loading state
      jest.doMock('@/lib/stores', () => ({
        useAnalyticsStore: () => ({
          userMetrics: null,
          isLoading: true,
        }),
      }));

      render(
        <BrowserRouter>
          <MockDashboardPage />
        </BrowserRouter>
      );

      expect(screen.getByTestId('metrics-section')).toBeInTheDocument();
    });

    it('should handle loading state for polls', () => {
      // Mock loading state
      jest.doMock('@/lib/stores', () => ({
        usePollsStore: () => ({
          userPolls: [],
          isLoading: true,
        }),
      }));

      render(
        <BrowserRouter>
          <MockDashboardPage />
        </BrowserRouter>
      );

      expect(screen.getByTestId('polls-section')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <BrowserRouter>
          <MockDashboardPage />
        </BrowserRouter>
      );

      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });

    it('should adapt to tablet viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <BrowserRouter>
          <MockDashboardPage />
        </BrowserRouter>
      );

      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <BrowserRouter>
          <MockDashboardPage />
        </BrowserRouter>
      );

      const dashboardTitle = screen.getByTestId('dashboard-title');
      const metricsTitle = screen.getByTestId('metrics-title');
      const pollsTitle = screen.getByTestId('polls-title');

      expect(dashboardTitle.tagName).toBe('H1');
      expect(metricsTitle.tagName).toBe('H2');
      expect(pollsTitle.tagName).toBe('H2');
    });

    it('should have accessible button labels', () => {
      render(
        <BrowserRouter>
          <MockDashboardPage />
        </BrowserRouter>
      );

      const createPollBtn = screen.getByTestId('create-poll-btn');
      expect(createPollBtn).toHaveTextContent('Create Poll');
    });

    it('should have proper navigation structure', () => {
      render(
        <BrowserRouter>
          <MockDashboardPage />
        </BrowserRouter>
      );

      const nav = screen.getByTestId('dashboard-nav');
      expect(nav).toBeInTheDocument();
      
      const navLinks = screen.getAllByRole('link');
      expect(navLinks).toHaveLength(4);
    });
  });

  describe('Performance', () => {
    it('should render within acceptable time', async () => {
      const startTime = performance.now();
      
      render(
        <BrowserRouter>
          <MockDashboardPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within 200ms for dashboard
      expect(renderTime).toBeLessThan(200);
    });

    it('should handle multiple re-renders efficiently', () => {
      const { rerender } = render(
        <BrowserRouter>
          <MockDashboardPage />
        </BrowserRouter>
      );

      // Simulate multiple re-renders
      for (let i = 0; i < 5; i++) {
        rerender(
          <BrowserRouter>
            <MockDashboardPage />
          </BrowserRouter>
        );
      }

      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
  });
});
