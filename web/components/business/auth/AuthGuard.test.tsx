/**
 * @jest-environment jsdom
 *
 * AuthGuard hydrates the browser session in the background. Middleware is the
 * security gate, so children must render even when the user store is still
 * loading or the client session is missing.
 */

import { render, screen, act } from '@testing-library/react';
import React from 'react';

import { AuthGuard } from './AuthGuard';

let mockIsAuthenticated = false;

jest.mock('@/lib/stores', () => ({
  useIsAuthenticated: () => mockIsAuthenticated,
}));

const mockHydrate = jest.fn().mockResolvedValue(null);
const mockSyncClientAuthSession = jest.fn();

jest.mock('@/lib/auth/browser-session', () => ({
  hydrateBrowserSessionFromServer: () => mockHydrate(),
}));

jest.mock('@/lib/auth/sync-client-auth-session', () => ({
  syncClientAuthSession: (...args: unknown[]) => mockSyncClientAuthSession(...args),
}));

describe('AuthGuard', () => {
  beforeEach(() => {
    mockHydrate.mockReset().mockResolvedValue(null);
    mockSyncClientAuthSession.mockReset();
    mockIsAuthenticated = false;
  });

  it('renders children immediately while the client session is unknown', () => {
    render(
      <AuthGuard>
        <div data-testid="kids">protected content</div>
      </AuthGuard>,
    );

    expect(screen.getByTestId('kids')).toBeTruthy();
  });

  it('renders children when the store already has a user', () => {
    mockIsAuthenticated = true;
    render(
      <AuthGuard>
        <div data-testid="kids">protected content</div>
      </AuthGuard>,
    );

    expect(screen.getByTestId('kids')).toBeTruthy();
    expect(mockHydrate).not.toHaveBeenCalled();
  });

  it('syncs the user store when cookie hydration returns a session', async () => {
    const session = { user: { id: 'u1' } };
    mockHydrate.mockResolvedValue(session);

    render(
      <AuthGuard>
        <div data-testid="kids">protected content</div>
      </AuthGuard>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('kids')).toBeTruthy();
    expect(mockSyncClientAuthSession).toHaveBeenCalledWith(session);
  });
});
