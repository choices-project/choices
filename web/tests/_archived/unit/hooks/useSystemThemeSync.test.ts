/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';

import { useSystemThemeSync } from '@/hooks/useSystemThemeSync';

const mockUpdateSystemTheme = jest.fn();

jest.mock('@/lib/stores/appStore', () => ({
  useAppStore: jest.fn((selector) => {
    const state = {
      updateSystemTheme: mockUpdateSystemTheme,
    };
    return selector ? selector(state) : state;
  }),
}));

jest.mock('@/lib/stores/deviceStore', () => ({
  useDarkMode: jest.fn(() => false),
}));

const mockedDeviceStore = jest.requireMock('@/lib/stores/deviceStore') as {
  useDarkMode: jest.Mock;
};

describe('useSystemThemeSync', () => {
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

    mockedDeviceStore.useDarkMode.mockReturnValue(false);
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
    expect(mockUpdateSystemTheme).toHaveBeenCalledWith('dark');
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

    expect(mockUpdateSystemTheme).toHaveBeenCalledWith('light');
  });

  it('syncs system theme from deviceStore when darkMode changes', () => {
    const { rerender } = renderHook(() => useSystemThemeSync());

    // Initial state: light
    expect(mockUpdateSystemTheme).toHaveBeenCalledWith('light');

    // Change deviceStore to dark
    mockedDeviceStore.useDarkMode.mockReturnValue(true);
    rerender();

    expect(mockUpdateSystemTheme).toHaveBeenCalledWith('dark');
  });

  it('syncs system theme from deviceStore when darkMode changes to light', () => {
    mockedDeviceStore.useDarkMode.mockReturnValue(true);

    const { rerender } = renderHook(() => useSystemThemeSync());

    // Initial state: dark (from matchMedia mock returning false, but deviceStore returns true)
    expect(mockUpdateSystemTheme).toHaveBeenCalled();

    // Change deviceStore to light
    mockedDeviceStore.useDarkMode.mockReturnValue(false);
    rerender();

    expect(mockUpdateSystemTheme).toHaveBeenCalledWith('light');
  });

  it('handles boolean false from deviceStore', () => {
    mockedDeviceStore.useDarkMode.mockReturnValue(false);

    renderHook(() => useSystemThemeSync());

    expect(mockUpdateSystemTheme).toHaveBeenCalledWith('light');
  });

  it('handles boolean true from deviceStore', () => {
    mockedDeviceStore.useDarkMode.mockReturnValue(true);

    renderHook(() => useSystemThemeSync());

    // Initial detection happens first (light from matchMedia), then deviceStore sync (dark)
    expect(mockUpdateSystemTheme).toHaveBeenCalled();
  });

  it('does not update when deviceStore returns non-boolean', () => {
    mockedDeviceStore.useDarkMode.mockReturnValue(undefined);

    renderHook(() => useSystemThemeSync());

    // Should only call from initial detection
    expect(mockUpdateSystemTheme).toHaveBeenCalledTimes(1);
  });

  it('handles matchMedia not being available', () => {
    const originalMatchMedia = window.matchMedia;
    // @ts-expect-error - intentionally removing matchMedia for test
    delete window.matchMedia;

    // Should not throw
    expect(() => renderHook(() => useSystemThemeSync())).not.toThrow();

    window.matchMedia = originalMatchMedia;
  });

  it('handles matchMedia errors gracefully', () => {
    mockMatchMedia.mockImplementation(() => {
      throw new Error('matchMedia not supported');
    });

    // Should not throw
    expect(() => renderHook(() => useSystemThemeSync())).not.toThrow();
  });

  it('only initializes once even on re-renders', () => {
    const { rerender } = renderHook(() => useSystemThemeSync());

    const initialCallCount = mockUpdateSystemTheme.mock.calls.length;

    // Re-render multiple times without changing darkMode
    rerender();
    rerender();
    rerender();

    // Should not call again since darkMode didn't change
    expect(mockUpdateSystemTheme.mock.calls.length).toBe(initialCallCount);
  });
});

