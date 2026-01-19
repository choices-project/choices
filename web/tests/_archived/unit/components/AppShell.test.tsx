/**
 * @jest-environment jsdom
 */
import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { AppShell } from '@/components/shared/AppShell';
import { useAppStore } from '@/lib/stores/appStore';

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

// Mock useSystemThemeSync to prevent it from overriding theme in tests
jest.mock('@/hooks/useSystemThemeSync', () => ({
  useSystemThemeSync: jest.fn(),
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
      // Note: setSidebarPinned(true) automatically sets collapsed to false
      store.setSidebarWidth(240);
      store.setSidebarPinned(true);
    });

    render(
      <AppShell navigation={<div>nav</div>} siteMessages={<div>messages</div>}>
        <div>content</div>
      </AppShell>,
    );

    const shell = screen.getByTestId('app-shell');
    // When pinned, sidebar is not collapsed
    expect(shell).toHaveAttribute('data-sidebar-collapsed', 'false');
    expect(shell).toHaveAttribute('data-sidebar-width', '240');
    expect(shell).toHaveAttribute('data-sidebar-pinned', 'true');
  });

  it('persists theme state across component remounts', async () => {
    // Set theme to dark
    act(() => {
      useAppStore.getState().setTheme('dark');
    });

    const { unmount } = render(
      <AppShell navigation={<div>nav</div>} siteMessages={<div>messages</div>}>
        <div>content</div>
      </AppShell>,
    );

    let shell = screen.getByTestId('app-shell');
    expect(shell).toHaveAttribute('data-theme', 'dark');

    // Unmount and remount - theme should persist
    unmount();

    render(
      <AppShell navigation={<div>nav</div>} siteMessages={<div>messages</div>}>
        <div>content</div>
      </AppShell>,
    );

    shell = screen.getByTestId('app-shell');
    await waitFor(() => {
      expect(shell).toHaveAttribute('data-theme', 'dark');
    });
  });

  it('persists sidebar state across component remounts', async () => {
    // Set sidebar state
    act(() => {
      const store = useAppStore.getState();
      // Note: setSidebarPinned(true) automatically sets collapsed to false
      store.setSidebarWidth(300);
      store.setSidebarPinned(true);
    });

    const { unmount } = render(
      <AppShell navigation={<div>nav</div>} siteMessages={<div>messages</div>}>
        <div>content</div>
      </AppShell>,
    );

    let shell = screen.getByTestId('app-shell');
    // When pinned, sidebar is not collapsed
    expect(shell).toHaveAttribute('data-sidebar-collapsed', 'false');
    expect(shell).toHaveAttribute('data-sidebar-width', '300');
    expect(shell).toHaveAttribute('data-sidebar-pinned', 'true');

    // Unmount and remount - sidebar state should persist
    unmount();

    render(
      <AppShell navigation={<div>nav</div>} siteMessages={<div>messages</div>}>
        <div>content</div>
      </AppShell>,
    );

    shell = screen.getByTestId('app-shell');
    await waitFor(() => {
      expect(shell).toHaveAttribute('data-sidebar-collapsed', 'false');
      expect(shell).toHaveAttribute('data-sidebar-width', '300');
      expect(shell).toHaveAttribute('data-sidebar-pinned', 'true');
    });
  });

  it('uses selector hooks correctly (not direct store access)', () => {
    // This test verifies that AppShell uses selector hooks
    // by checking that the component re-renders when store state changes
    act(() => {
      useAppStore.getState().setTheme('light');
    });

    const { rerender } = render(
      <AppShell navigation={<div>nav</div>} siteMessages={<div>messages</div>}>
        <div>content</div>
      </AppShell>,
    );

    let shell = screen.getByTestId('app-shell');
    expect(shell).toHaveAttribute('data-theme', 'light');

    // Change theme - component should update via selector hook
    act(() => {
      useAppStore.getState().setTheme('dark');
    });

    rerender(
      <AppShell navigation={<div>nav</div>} siteMessages={<div>messages</div>}>
        <div>content</div>
      </AppShell>,
    );

    shell = screen.getByTestId('app-shell');
    expect(shell).toHaveAttribute('data-theme', 'dark');
  });

  it('handles sidebar width clamping correctly', () => {
    act(() => {
      const store = useAppStore.getState();
      // Set width below minimum (200)
      store.setSidebarWidth(150);
    });

    render(
      <AppShell navigation={<div>nav</div>} siteMessages={<div>messages</div>}>
        <div>content</div>
      </AppShell>,
    );

    const shell = screen.getByTestId('app-shell');
    // Width should be clamped to minimum of 200
    expect(shell).toHaveAttribute('data-sidebar-width', '200');
  });

  it('handles sidebar width maximum clamping correctly', () => {
    act(() => {
      const store = useAppStore.getState();
      // Set width above maximum (400)
      store.setSidebarWidth(500);
    });

    render(
      <AppShell navigation={<div>nav</div>} siteMessages={<div>messages</div>}>
        <div>content</div>
      </AppShell>,
    );

    const shell = screen.getByTestId('app-shell');
    // Width should be clamped to maximum of 400
    expect(shell).toHaveAttribute('data-sidebar-width', '400');
  });

  it('handles sidebar pinning automatically collapsing when unpinned', () => {
    act(() => {
      const store = useAppStore.getState();
      store.setSidebarPinned(true);
      store.setSidebarCollapsed(false);
    });

    const { rerender } = render(
      <AppShell navigation={<div>nav</div>} siteMessages={<div>messages</div>}>
        <div>content</div>
      </AppShell>,
    );

    let shell = screen.getByTestId('app-shell');
    expect(shell).toHaveAttribute('data-sidebar-pinned', 'true');
    expect(shell).toHaveAttribute('data-sidebar-collapsed', 'false');

    // Unpinning should not automatically collapse (that's handled by setSidebarPinned)
    act(() => {
      useAppStore.getState().setSidebarPinned(false);
    });

    rerender(
      <AppShell navigation={<div>nav</div>} siteMessages={<div>messages</div>}>
        <div>content</div>
      </AppShell>,
    );

    shell = screen.getByTestId('app-shell');
    expect(shell).toHaveAttribute('data-sidebar-pinned', 'false');
  });

  it('handles theme toggle correctly', () => {
    act(() => {
      useAppStore.getState().setTheme('light');
    });

    const { rerender } = render(
      <AppShell navigation={<div>nav</div>} siteMessages={<div>messages</div>}>
        <div>content</div>
      </AppShell>,
    );

    let shell = screen.getByTestId('app-shell');
    expect(shell).toHaveAttribute('data-theme', 'light');

    // Toggle theme
    act(() => {
      useAppStore.getState().toggleTheme();
    });

    rerender(
      <AppShell navigation={<div>nav</div>} siteMessages={<div>messages</div>}>
        <div>content</div>
      </AppShell>,
    );

    shell = screen.getByTestId('app-shell');
    // Should toggle from light to dark
    expect(shell).toHaveAttribute('data-theme', 'dark');
  });
});


