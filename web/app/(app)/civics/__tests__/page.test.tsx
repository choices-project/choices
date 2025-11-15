/**
 * @jest-environment jsdom
 */
import { render, waitFor } from '@testing-library/react';
import React from 'react';

import Civics2Page from '../page';

jest.mock('@/lib/stores/appStore', () => ({
  useAppActions: jest.fn(),
  useIsMobile: jest.fn(),
}));

jest.mock('@/features/civics/components/representative/RepresentativeCard', () => ({
  RepresentativeCard: () => <div data-testid="representative-card" />,
}));

jest.mock('@/features/feeds', () => ({
  UnifiedFeedRefactored: () => <div data-testid="unified-feed" />,
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/util/objects', () => ({
  withOptional: jest.fn((required: Record<string, unknown>, optional: Record<string, unknown>) => ({
    ...required,
    ...optional,
  })),
}));

jest.mock('next/dynamic', () => {
  const React = require('react');
  return () => () => <div data-testid="dynamic-component" />;
});

const mockedAppStore = jest.requireMock('@/lib/stores/appStore') as {
  useAppActions: jest.Mock;
  useIsMobile: jest.Mock;
};

const mockFetch = jest.fn();
const mockSetCurrentRoute = jest.fn();
const mockSetSidebarActiveSection = jest.fn();
const mockSetBreadcrumbs = jest.fn();

describe('Civics page navigation wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    mockedAppStore.useIsMobile.mockReturnValue(false);
    mockedAppStore.useAppActions.mockReturnValue({
      setCurrentRoute: mockSetCurrentRoute,
      setSidebarActiveSection: mockSetSidebarActiveSection,
      setBreadcrumbs: mockSetBreadcrumbs,
    });
  });

  it('synchronizes civics navigation state on mount', async () => {
    render(<Civics2Page />);

    await waitFor(() => {
      expect(mockSetCurrentRoute).toHaveBeenCalledWith('/civics');
    });

    expect(mockSetSidebarActiveSection).toHaveBeenCalledWith('civics');
    expect(mockSetBreadcrumbs).toHaveBeenCalledWith([
      { label: 'Home', href: '/' },
      { label: 'Civics', href: '/civics' },
    ]);
  });

  it('clears sidebar state on unmount', async () => {
    const { unmount } = render(<Civics2Page />);

    await waitFor(() => expect(mockSetCurrentRoute).toHaveBeenCalled());

    unmount();

    expect(mockSetSidebarActiveSection).toHaveBeenLastCalledWith(null);
    expect(mockSetBreadcrumbs).toHaveBeenLastCalledWith([]);
  });
});

