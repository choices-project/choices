/** @jest-environment jsdom */

import { act, render, screen } from '@testing-library/react';
import React from 'react';

import { useAppStore } from '@/lib/stores/appStore';

const ThemeDisplay = () => {
  const theme = useAppStore((state) => state.theme);
  const resolvedTheme = useAppStore((state) => state.resolvedTheme);
  return (
    <div data-testid="theme-display">
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
    </div>
  );
};

const ThemeControls = () => {
  const setTheme = useAppStore((state) => state.setTheme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  return (
    <div>
      <button data-testid="set-light" onClick={() => setTheme('light')}>
        Set Light
      </button>
      <button data-testid="set-dark" onClick={() => setTheme('dark')}>
        Set Dark
      </button>
      <button data-testid="set-system" onClick={() => setTheme('system')}>
        Set System
      </button>
      <button data-testid="toggle-theme" onClick={() => toggleTheme()}>
        Toggle
      </button>
    </div>
  );
};

const SidebarDisplay = () => {
  const collapsed = useAppStore((state) => state.sidebarCollapsed);
  const pinned = useAppStore((state) => state.sidebarPinned);
  return (
    <div data-testid="sidebar-display">
      <span data-testid="collapsed">{collapsed ? 'collapsed' : 'expanded'}</span>
      <span data-testid="pinned">{pinned ? 'pinned' : 'unpinned'}</span>
    </div>
  );
};

const SidebarControls = () => {
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const setSidebarCollapsed = useAppStore((state) => state.setSidebarCollapsed);
  const setSidebarPinned = useAppStore((state) => state.setSidebarPinned);
  return (
    <div>
      <button data-testid="toggle-sidebar" onClick={() => toggleSidebar()}>
        Toggle Sidebar
      </button>
      <button data-testid="collapse-sidebar" onClick={() => setSidebarCollapsed(true)}>
        Collapse
      </button>
      <button data-testid="expand-sidebar" onClick={() => setSidebarCollapsed(false)}>
        Expand
      </button>
      <button data-testid="pin-sidebar" onClick={() => setSidebarPinned(true)}>
        Pin
      </button>
      <button data-testid="unpin-sidebar" onClick={() => setSidebarPinned(false)}>
        Unpin
      </button>
    </div>
  );
};

describe('appStore integration', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      const state = useAppStore.getState();
      state.setTheme('system');
      state.setSidebarCollapsed(false);
      state.setSidebarPinned(false);
      state.setError(null);
      state.setLoading(false);
    });
  });

  afterEach(() => {
    act(() => {
      const state = useAppStore.getState();
      state.setTheme('system');
      state.setSidebarCollapsed(false);
      state.setSidebarPinned(false);
      state.setError(null);
      state.setLoading(false);
    });
  });

  describe('theme management', () => {
    it('should update theme when setTheme is called', () => {
      render(
        <>
          <ThemeDisplay />
          <ThemeControls />
        </>
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('system');

      act(() => {
        screen.getByTestId('set-light').click();
      });

      expect(screen.getByTestId('theme')).toHaveTextContent('light');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');

      act(() => {
        screen.getByTestId('set-dark').click();
      });

      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
    });

    it('should toggle theme correctly', () => {
      render(
        <>
          <ThemeDisplay />
          <ThemeControls />
        </>
      );

      act(() => {
        screen.getByTestId('set-light').click();
      });

      expect(screen.getByTestId('theme')).toHaveTextContent('light');

      act(() => {
        screen.getByTestId('toggle-theme').click();
      });

      expect(screen.getByTestId('theme')).toHaveTextContent('dark');

      act(() => {
        screen.getByTestId('toggle-theme').click();
      });

      expect(screen.getByTestId('theme')).toHaveTextContent('light');
    });

    it('should apply theme to document', () => {
      render(<ThemeControls />);

      act(() => {
        screen.getByTestId('set-dark').click();
      });

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      act(() => {
        screen.getByTestId('set-light').click();
      });

      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('sidebar management', () => {
    it('should toggle sidebar collapsed state', () => {
      render(
        <>
          <SidebarDisplay />
          <SidebarControls />
        </>
      );

      expect(screen.getByTestId('collapsed')).toHaveTextContent('expanded');

      act(() => {
        screen.getByTestId('toggle-sidebar').click();
      });

      expect(screen.getByTestId('collapsed')).toHaveTextContent('collapsed');

      act(() => {
        screen.getByTestId('toggle-sidebar').click();
      });

      expect(screen.getByTestId('collapsed')).toHaveTextContent('expanded');
    });

    it('should set sidebar collapsed state directly', () => {
      render(
        <>
          <SidebarDisplay />
          <SidebarControls />
        </>
      );

      act(() => {
        screen.getByTestId('collapse-sidebar').click();
      });

      expect(screen.getByTestId('collapsed')).toHaveTextContent('collapsed');

      act(() => {
        screen.getByTestId('expand-sidebar').click();
      });

      expect(screen.getByTestId('collapsed')).toHaveTextContent('expanded');
    });

    it('should pin and unpin sidebar', () => {
      render(
        <>
          <SidebarDisplay />
          <SidebarControls />
        </>
      );

      expect(screen.getByTestId('pinned')).toHaveTextContent('unpinned');

      act(() => {
        screen.getByTestId('pin-sidebar').click();
      });

      expect(screen.getByTestId('pinned')).toHaveTextContent('pinned');
      // Pinning should also expand the sidebar
      expect(screen.getByTestId('collapsed')).toHaveTextContent('expanded');

      act(() => {
        screen.getByTestId('unpin-sidebar').click();
      });

      expect(screen.getByTestId('pinned')).toHaveTextContent('unpinned');
    });
  });

  describe('loading and error states', () => {
    it('should update loading state', () => {
      const LoadingDisplay = () => {
        const isLoading = useAppStore((state) => state.isLoading);
        return <div data-testid="loading">{isLoading ? 'loading' : 'idle'}</div>;
      };

      render(<LoadingDisplay />);

      expect(screen.getByTestId('loading')).toHaveTextContent('idle');

      act(() => {
        useAppStore.getState().setLoading(true);
      });

      expect(screen.getByTestId('loading')).toHaveTextContent('loading');

      act(() => {
        useAppStore.getState().setLoading(false);
      });

      expect(screen.getByTestId('loading')).toHaveTextContent('idle');
    });

    it('should update error state', () => {
      const ErrorDisplay = () => {
        const error = useAppStore((state) => state.error);
        return <div data-testid="error">{error || 'no-error'}</div>;
      };

      render(<ErrorDisplay />);

      expect(screen.getByTestId('error')).toHaveTextContent('no-error');

      act(() => {
        useAppStore.getState().setError('Test error');
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Test error');

      act(() => {
        useAppStore.getState().clearError();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });
  });
});

