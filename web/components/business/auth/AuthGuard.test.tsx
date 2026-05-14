/**
 * @jest-environment jsdom
 *
 * Regression tests for AuthGuard.
 *
 * Bug history (May 14, 2026 + Dec 20, 2025): when AuthContext's
 * `supabase.auth.getSession()` hangs (commonly caused by a stuck
 * `navigator.locks` after a crashed tab, or by Incognito quirks), the user
 * store's `isLoading` stays `true` forever. AuthGuard's previous "10s
 * timeout" only logged a warning and never flipped any state, so the user
 * was trapped on "Checking authentication..." indefinitely.
 *
 * These tests pin the new escape hatch: after the hard timeout, AuthGuard
 * proceeds to render children (middleware is the real security gate).
 */

import { render, screen, act } from '@testing-library/react';
import React from 'react';

import { AuthGuard } from './AuthGuard';

let mockIsAuthenticated = false;
let mockIsLoading = true;
const mockPush = jest.fn();

jest.mock('@/lib/stores', () => ({
  useIsAuthenticated: () => mockIsAuthenticated,
  useUserLoading: () => mockIsLoading,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

const setStoreState = (next: { isLoading: boolean; isAuthenticated: boolean }) => {
  mockIsLoading = next.isLoading;
  mockIsAuthenticated = next.isAuthenticated;
};

describe('AuthGuard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPush.mockReset();
    setStoreState({ isLoading: true, isAuthenticated: false });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('shows the loading fallback while auth is initializing', () => {
    render(
      <AuthGuard>
        <div data-testid="kids">protected content</div>
      </AuthGuard>,
    );

    expect(screen.getByText(/Checking authentication/i)).toBeTruthy();
    expect(screen.queryByTestId('kids')).toBeNull();
  });

  it('renders children once auth resolves with an authenticated user', () => {
    const { rerender } = render(
      <AuthGuard>
        <div data-testid="kids">protected content</div>
      </AuthGuard>,
    );

    setStoreState({ isLoading: false, isAuthenticated: true });
    rerender(
      <AuthGuard>
        <div data-testid="kids">protected content</div>
      </AuthGuard>,
    );

    expect(screen.getByTestId('kids')).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('redirects to /auth when bootstrap completes cleanly with no session', () => {
    const { rerender } = render(
      <AuthGuard>
        <div data-testid="kids">protected content</div>
      </AuthGuard>,
    );

    setStoreState({ isLoading: false, isAuthenticated: false });
    rerender(
      <AuthGuard>
        <div data-testid="kids">protected content</div>
      </AuthGuard>,
    );

    expect(mockPush).toHaveBeenCalledWith('/auth');
  });

  it('escapes the infinite-loading trap after the hard timeout and renders children', () => {
    render(
      <AuthGuard>
        <div data-testid="kids">protected content</div>
      </AuthGuard>,
    );

    expect(screen.getByText(/Checking authentication/i)).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(10_001);
    });

    expect(screen.getByTestId('kids')).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does NOT bounce the user to /auth if bootstrap later resolves with no session after timeout', () => {
    const { rerender } = render(
      <AuthGuard>
        <div data-testid="kids">protected content</div>
      </AuthGuard>,
    );

    act(() => {
      jest.advanceTimersByTime(10_001);
    });

    // Bootstrap eventually times out in AuthContext, sets isLoading=false but
    // never confirms an authenticated user. Without sticky `loadingTimedOut`,
    // AuthGuard would now push the user to /auth → middleware lets them back
    // into /feed → AuthGuard times out again → redirect loop. The fix keeps
    // the timeout bit sticky so we render children instead.
    setStoreState({ isLoading: false, isAuthenticated: false });
    rerender(
      <AuthGuard>
        <div data-testid="kids">protected content</div>
      </AuthGuard>,
    );

    expect(screen.getByTestId('kids')).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('honors a custom redirectTo when bootstrap completes with no session', () => {
    const { rerender } = render(
      <AuthGuard redirectTo="/login">
        <div data-testid="kids">protected content</div>
      </AuthGuard>,
    );

    setStoreState({ isLoading: false, isAuthenticated: false });
    rerender(
      <AuthGuard redirectTo="/login">
        <div data-testid="kids">protected content</div>
      </AuthGuard>,
    );

    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
