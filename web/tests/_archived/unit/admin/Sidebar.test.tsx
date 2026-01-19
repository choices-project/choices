/**
 * @jest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import React from 'react';

import { Sidebar } from '@/app/(app)/admin/layout/Sidebar';
import { useAppStore } from '@/lib/stores/appStore';

const mockUsePathname = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

jest.mock('@/features/admin/lib/hooks', () => ({
  useSystemMetrics: jest.fn(() => ({
    data: { total_topics: 0, total_polls: 0, active_polls: 0 },
  })),
}));

function renderSidebar() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <Sidebar />
    </QueryClientProvider>,
  );
}

describe('Admin Sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useAppStore.getState().resetAppState();
    });
    mockUsePathname.mockReturnValue('/admin');
  });

  it('highlights link based on sidebar active section', () => {
    act(() => {
      useAppStore.getState().setSidebarActiveSection('admin-users');
    });

    renderSidebar();

    const usersLink = screen.getByRole('link', { name: /Users/i });
    expect(usersLink.className).toContain('bg-blue-100');
    expect(usersLink.getAttribute('aria-current')).toBe('page');
  });

  it('falls back to pathname when sidebar section not set', () => {
    mockUsePathname.mockReturnValue('/admin/feature-flags');

    renderSidebar();

    const featureFlagsLink = screen.getByRole('link', { name: /Feature Flags/i });
    expect(featureFlagsLink.className).toContain('bg-blue-100');
  });
});


