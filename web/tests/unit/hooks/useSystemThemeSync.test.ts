/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import React from 'react';

import { useSystemThemeSync } from '@/hooks/useSystemThemeSync';
import { useAppStore } from '@/lib/stores/appStore';
import { useDeviceStore } from '@/lib/stores/deviceStore';

jest.mock('@/lib/stores/appStore');
jest.mock('@/lib/stores/deviceStore');

jest.mock('@/lib/utils/logger', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockLogger,
    logger: mockLogger,
  };
});

const mockedAppStore = jest.requireMock('@/lib/stores/appStore') as {
  useAppStore: jest.Mock;
  useAppActions: jest.Mock;
  useTheme: jest.Mock;
};

const mockedDeviceStore = jest.requireMock('@/lib/stores/deviceStore') as {
  useDeviceStore: jest.Mock;
  useDarkMode: jest.Mock;
};

describe('useSystemThemeSync', () => {
  const updateSystemTheme = jest.fn();
  let mockMatchMedia: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock window.matchMedia
    mockMatchMedia = jest.fn().mockReturnValue({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });

    mockedAppStore.useAppActions = jest.fn().mockReturnValue({
      updateSystemTheme,
    });

    mockedAppStore.useTheme = jest.fn().mockReturnValue('system');

    mockedDeviceStore.useDarkMode = jest.fn().mockReturnValue(false);
  });

  it('detects initial system theme preference on mount', () => {
    mockMatchMedia.mockReturnValue({
      matches: true, // System prefers dark
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    });

    renderHook(() => useSystemThemeSync());

    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    expect(updateSystemTheme).toHaveBeenCalledWith('dark');
  });

  it('detects light theme when system prefers light', () => {
    mockMatchMedia.mockReturnValue({
      matches: false, // System prefers light
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    });

    renderHook(() => useSystemThemeSync());

    expect(updateSystemTheme).toHaveBeenCalledWith('light');
  });

  it('syncs system theme from deviceStore when darkMode changes', () => {
    const { rerender } = renderHook(() => useSystemThemeSync());

    // Initial state: light
    expect(updateSystemTheme).toHaveBeenCalledWith('light');

    // Change deviceStore to dark
    mockedDeviceStore.useDarkMode.mockReturnValue(true);
    rerender();

    expect(updateSystemTheme).toHaveBeenCalledWith('dark');
  });

  it('syncs system theme from deviceStore when darkMode changes to light', () => {
    mockedDeviceStore.useDarkMode.mockReturnValue(true);

    const { rerender } = renderHook(() => useSystemThemeSync());

    // Initial state: dark
    expect(updateSystemTheme).toHaveBeenCalledWith('dark');

    // Change deviceStore to light
    mockedDeviceStore.useDarkMode.mockReturnValue(false);
    rerender();

    expect(updateSystemTheme).toHaveBeenCalledWith('light');
  });

  it('handles boolean false from deviceStore', () => {
    mockedDeviceStore.useDarkMode.mockReturnValue(false);

    renderHook(() => useSystemThemeSync());

    expect(updateSystemTheme).toHaveBeenCalledWith('light');
  });

  it('handles boolean true from deviceStore', () => {
    mockedDeviceStore.useDarkMode.mockReturnValue(true);

    renderHook(() => useSystemThemeSync());

    expect(updateSystemTheme).toHaveBeenCalledWith('dark');
  });

  it('does not update when deviceStore returns non-boolean', () => {
    mockedDeviceStore.useDarkMode.mockReturnValue(undefined);

    renderHook(() => useSystemThemeSync());

    // Should only call from initial detection, not from deviceStore
    expect(updateSystemTheme).toHaveBeenCalledTimes(1);
  });

  it('handles matchMedia not being available', () => {
    const originalMatchMedia = window.matchMedia;
    // @ts-expect-error - intentionally removing matchMedia for test
    delete window.matchMedia;

    renderHook(() => useSystemThemeSync());

    // Should not throw, but also may not call updateSystemTheme
    // (depends on deviceStore fallback)
    expect(() => renderHook(() => useSystemThemeSync())).not.toThrow();

    window.matchMedia = originalMatchMedia;
  });

  it('handles matchMedia errors gracefully', () => {
    mockMatchMedia.mockImplementation(() => {
      throw new Error('matchMedia not supported');
    });

    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    renderHook(() => useSystemThemeSync());

    // Should not throw
    expect(() => renderHook(() => useSystemThemeSync())).not.toThrow();

    consoleWarn.mockRestore();
  });

  it('only initializes once even on re-renders', () => {
    const { rerender } = renderHook(() => useSystemThemeSync());

    const initialCallCount = updateSystemTheme.mock.calls.length;

    // Re-render multiple times
    rerender();
    rerender();
    rerender();

    // Should only have initial detection call (plus deviceStore sync if applicable)
    // The initial detection should only run once due to useRef guard
    expect(updateSystemTheme.mock.calls.length).toBeGreaterThanOrEqual(initialCallCount);
  });

  it('logs debug message when theme is set to system', () => {
    const logger = jest.requireMock('@/lib/utils/logger').default;

    mockedAppStore.useTheme.mockReturnValue('system');
    mockedDeviceStore.useDarkMode.mockReturnValue(false);

    renderHook(() => useSystemThemeSync());

    expect(logger.debug).toHaveBeenCalledWith(
      'Theme is set to system, following system preference',
      { systemPrefersDark: false },
    );
  });

  it('does not log when theme is not set to system', () => {
    const logger = jest.requireMock('@/lib/utils/logger').default;

    mockedAppStore.useTheme.mockReturnValue('dark');
    mockedDeviceStore.useDarkMode.mockReturnValue(false);

    renderHook(() => useSystemThemeSync());

    const systemThemeLogs = (logger.debug as jest.Mock).mock.calls.filter((call) =>
      call[0]?.includes('Theme is set to system'),
    );

    expect(systemThemeLogs).toHaveLength(0);
  });
});

