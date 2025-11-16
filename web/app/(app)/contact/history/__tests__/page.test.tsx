/**
 * @jest-environment jsdom
 */
import { render, waitFor } from '@testing-library/react';
import React from 'react';

import ContactHistoryPage from '../page';

jest.mock('@/lib/stores/appStore', () => ({
  useAppActions: jest.fn(),
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

const mockedAppStore = jest.requireMock('@/lib/stores/appStore') as {
  useAppActions: jest.Mock;
};

const mockFetch = jest.fn();
const mockSetCurrentRoute = jest.fn();
const mockSetSidebarActiveSection = jest.fn();
const mockSetBreadcrumbs = jest.fn();

describe('Contact history navigation wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          threads: [],
        },
      }),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    mockedAppStore.useAppActions.mockReturnValue({
      setCurrentRoute: mockSetCurrentRoute,
      setSidebarActiveSection: mockSetSidebarActiveSection,
      setBreadcrumbs: mockSetBreadcrumbs,
    });
  });

  it('registers contact route + breadcrumbs on mount', async () => {
    render(<ContactHistoryPage />);

    await waitFor(() => {
      expect(mockSetCurrentRoute).toHaveBeenCalledWith('/contact/history');
    });

    expect(mockSetSidebarActiveSection).toHaveBeenCalledWith('contact');
    expect(mockSetBreadcrumbs).toHaveBeenCalledWith([
      { label: 'Home', href: '/' },
      { label: 'Contact', href: '/contact' },
      { label: 'History', href: '/contact/history' },
    ]);
  });

  it('clears sidebar + breadcrumbs when unmounted', async () => {
    const { unmount } = render(<ContactHistoryPage />);

    await waitFor(() => expect(mockSetCurrentRoute).toHaveBeenCalled());

    unmount();

    expect(mockSetSidebarActiveSection).toHaveBeenLastCalledWith(null);
    expect(mockSetBreadcrumbs).toHaveBeenLastCalledWith([]);
  });
});

