/**
 * @jest-environment jsdom
 */
import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { AppShell } from '@/components/shared/AppShell';
import { useAppStore } from '@/lib/stores/appStore';
import { useDeviceStore } from '@/lib/stores/deviceStore';

const mockInitializeDevice = jest.fn();
const mockTeardownDevice = jest.fn();

jest.mock('@/lib/stores/deviceStore', () => ({
  useDeviceStore: jest.fn((selector) => {
    // Return the appropriate function based on what selector requests
    const state = {
      initialize: mockInitializeDevice,
      teardown: mockTeardownDevice,
    };
    return selector ? selector(state) : state;
  }),
  useDeviceActions: jest.fn(() => ({
    initialize: mockInitializeDevice,
    teardown: mockTeardownDevice,
  })),
  useDarkMode: jest.fn(() => false),
}));

const mockedDeviceStore = jest.requireMock('@/lib/stores/deviceStore') as {
  useDeviceStore: jest.Mock;
  useDeviceActions: jest.Mock;
  useDarkMode: jest.Mock;
};

describe('AppShell', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    act(() => {
      const store = useAppStore.getState();
      store.resetAppState();
      // Ensure system theme is set to a known value
      store.updateSystemTheme('light');
    });

    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
  });

  it('applies persisted theme attributes from the app store', () => {
    act(() => {
      useAppStore.getState().setTheme('dark');
    });

    render(
      <AppShell navigation={<div>nav</div>} siteMessages={<div>messages</div>}>
        <div>content</div>
      </AppShell>,
    );

    const shell = screen.getByTestId('app-shell');
    expect(shell).toHaveAttribute('data-theme', 'dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('applies light theme correctly', () => {
    act(() => {
      useAppStore.getState().setTheme('light');
    });

    render(
      <AppShell navigation={<div>nav</div>} siteMessages={<div>messages</div>}>
        <div>content</div>
      </AppShell>,
    );

    const shell = screen.getByTestId('app-shell');
    expect(shell).toHaveAttribute('data-theme', 'light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('applies system theme based on resolved theme', async () => {
    mockedDeviceStore.useDarkMode.mockReturnValue(true);

    // Set theme to system first, then update system theme
    act(() => {
      useAppStore.getState().setTheme('system');
    });
    
    act(() => {
      useAppStore.getState().updateSystemTheme('dark');
    });

    // Verify state is correct before rendering
    const state = useAppStore.getState();
    expect(state.theme).toBe('system');
    expect(state.systemTheme).toBe('dark');
    expect(state.resolvedTheme).toBe('dark');

    render(
      <AppShell navigation={<div>nav</div>} siteMessages={<div>messages</div>}>
        <div>content</div>
      </AppShell>,
    );

    const shell = screen.getByTestId('app-shell');
    // useAppTheme resolves 'system' to the systemTheme value ('dark')
    // The component should use the resolved theme
    await waitFor(() => {
      expect(shell).toHaveAttribute('data-theme', 'dark');
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('initializes device store on mount', () => {
    render(
      <AppShell navigation={<div>nav</div>} siteMessages={<div>messages</div>}>
        <div>content</div>
      </AppShell>,
    );

    expect(mockInitializeDevice).toHaveBeenCalled();
  });

  it('updates document theme when theme changes', async () => {
    const { rerender } = render(
      <AppShell navigation={<div>nav</div>} siteMessages={<div>messages</div>}>
        <div>content</div>
      </AppShell>,
    );

    act(() => {
      useAppStore.getState().setTheme('dark');
    });

    rerender(
      <AppShell navigation={<div>nav</div>} siteMessages={<div>messages</div>}>
        <div>content</div>
      </AppShell>,
    );

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  it('reflects sidebar persistence state via data attributes', () => {
    act(() => {
      const store = useAppStore.getState();
      store.setSidebarCollapsed(true);
      store.setSidebarWidth(240);
      store.setSidebarPinned(true);
    });

    render(
      <AppShell navigation={<div>nav</div>} siteMessages={<div>messages</div>}>
        <div>content</div>
      </AppShell>,
    );

    const shell = screen.getByTestId('app-shell');
    expect(shell).toHaveAttribute('data-sidebar-collapsed', 'false');
    expect(shell).toHaveAttribute('data-sidebar-width', '240');
    expect(shell).toHaveAttribute('data-sidebar-pinned', 'true');
  });
});


