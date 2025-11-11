/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import AnalyticsPanel from '@/features/admin/components/AnalyticsPanel';
import { useAnalyticsStore } from '@/lib/stores/analyticsStore';

jest.mock('@/lib/utils/logger', () => {
  const loggerMock = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  return {
    logger: loggerMock,
    default: loggerMock,
  };
});

const restoreFetch = (originalFetch: typeof global.fetch | undefined) => {
  if (originalFetch) {
    global.fetch = originalFetch;
  } else {
    delete (global as Record<string, unknown>).fetch;
  }
};

describe('AnalyticsPanel', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    useAnalyticsStore.getState().resetAnalyticsState();
    restoreFetch(originalFetch);
    jest.clearAllMocks();
  });

  it('renders dashboard and metrics after successful fetch', async () => {
    const mockResponse = {
      dashboard: {
        totalEvents: 120,
        uniqueUsers: 42,
        sessionCount: 12,
        averageSessionDuration: 180,
        topPages: [
          { page: '/polls', views: 10 },
          { page: '/admin', views: 8 },
        ],
        topActions: [],
        userEngagement: 75,
        conversionFunnel: [],
      },
      performanceMetrics: {
        pageLoadTime: 120,
        timeToInteractive: 200,
        firstContentfulPaint: 100,
        largestContentfulPaint: 180,
        cumulativeLayoutShift: 0.15,
        firstInputDelay: 30,
        totalBlockingTime: 45,
      },
      userBehavior: {
        sessionDuration: 300,
        pageViews: 5,
        interactions: 3,
        bounceRate: 0.1,
        conversionRate: 0.2,
        userJourney: [],
        engagementScore: 80,
        lastActivity: new Date().toISOString(),
        deviceType: 'desktop',
        browser: 'Chrome',
        os: 'macOS',
      },
    };

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    global.fetch = mockFetch as unknown as typeof global.fetch;

    render(<AnalyticsPanel refreshInterval={60_000} />);

    await waitFor(() => expect(screen.getByText('120ms')).toBeInTheDocument());

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Live Data')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Response Time:')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows an error state when fetch fails', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    global.fetch = mockFetch as unknown as typeof global.fetch;

    render(<AnalyticsPanel refreshInterval={60_000} />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Analytics')).toBeInTheDocument();
    });
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('HTTP error! status: 500')).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

