/**
 * @jest-environment jsdom
 */
import { act, render, screen } from '@testing-library/react';
import React from 'react';

import { AppShell } from '@/components/shared/AppShell';
import { useAppStore } from '@/lib/stores/appStore';

describe('AppShell', () => {
  beforeEach(() => {
    act(() => {
      useAppStore.getState().resetAppState();
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


