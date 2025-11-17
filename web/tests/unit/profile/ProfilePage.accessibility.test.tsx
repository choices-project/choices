import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';

type ProfilePageType = typeof import('@/features/profile/components/ProfilePage').default;
let ProfilePage: ProfilePageType;

const mockUser = {
  id: 'user-1',
  username: 'user1',
  display_name: 'User One',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/lib/stores', () => ({
  useIsAuthenticated: () => true,
  useUserLoading: () => false,
}));

jest.mock('@/features/profile/hooks/use-profile', () => ({
  useProfileData: () => ({
    profile: mockUser,
    isLoading: false,
    error: null,
  }),
  useProfileDisplay: () => ({
    displayName: 'User One',
    initials: 'UO',
    trustTier: 'T1',
    trustTierDisplay: 'Tier 1',
    isAdmin: false,
  }),
  useProfileCompleteness: () => ({
    isComplete: true,
    missingFields: [],
    completionPercentage: 100,
  }),
  useProfileExport: () => ({
    exportProfile: jest.fn(() => Promise.resolve({ profile: mockUser })),
    isExporting: false,
    error: null,
  }),
  useProfileLoadingStates: () => ({
    isAnyUpdating: false,
    isExporting: false,
  }),
}));

describe('ProfilePage export dialog accessibility', () => {
  beforeAll(() => {
    jest.spyOn(React, 'useId').mockImplementation(() => 'test-id');
    ProfilePage = require('@/features/profile/components/ProfilePage').default;
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const renderProfilePage = () =>
    render(<ProfilePage user={mockUser} isOwnProfile canEdit />);

  it('opens export dialog with proper semantics when export button clicked', () => {
    renderProfilePage();

    fireEvent.click(screen.getByRole('button', { name: /Export Data/i }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    const title = screen.getByText('Export Your Data');
    expect(dialog).toHaveAttribute('aria-labelledby', title.id);

    const description = screen.getByText(/download a JSON file/i);
    expect(dialog).toHaveAttribute('aria-describedby', description.id);
  });

  it('closes when clicking the overlay', () => {
    renderProfilePage();
    fireEvent.click(screen.getByRole('button', { name: /Export Data/i }));

    const overlay = screen.getByTestId('profile-export-overlay');
    fireEvent.click(overlay);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

