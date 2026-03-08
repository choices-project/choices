/**
 * Unit tests for My Submissions page (contact/submissions).
 * Locks in unauthenticated and loading states so E2E smoke assertions stay valid.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const useAuth = jest.requireMock('@/hooks/useAuth').useAuth as jest.Mock;

// Default: no Link navigation in unit test
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

describe('My Submissions page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state when auth is loading', async () => {
    useAuth.mockReturnValue({ user: null, isLoading: true });
    const Page = require('../page').default;
    render(<Page />);
    expect(screen.getByRole('status', { name: /loading submissions/i })).toBeInTheDocument();
  });

  it('shows My Submissions card and Sign in when unauthenticated', async () => {
    useAuth.mockReturnValue({ user: null, isLoading: false });
    const Page = require('../page').default;
    render(<Page />);
    expect(screen.getByText('My Submissions')).toBeInTheDocument();
    expect(screen.getByText(/Sign in to view your contact information submissions/i)).toBeInTheDocument();
    const signInLink = screen.getByRole('link', { name: /sign in/i });
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute('href', '/auth?redirect=/contact/submissions');
  });
});
