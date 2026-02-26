/**
 * @jest-environment jsdom
 */
import { render, waitFor } from '@testing-library/react';
import React from 'react';

import type { PrivacySettings } from '@/types/profile';

import PrivacyPage from '../page';

jest.mock('@/lib/stores/appStore', () => ({
  useAppActions: jest.fn(),
}));

jest.mock('@/features/profile/hooks/use-profile', () => ({
  useProfileData: jest.fn(),
  useProfileDraft: jest.fn(),
  useProfileDraftActions: jest.fn(),
}));

jest.mock('@/lib/stores', () => ({
  useUser: jest.fn(),
}));

jest.mock('@/lib/stores/profileStore', () => {
  const settings = { data_sharing: 'minimal', allow_messages: true };
  return {
    useProfileStore: jest.fn(),
    useProfilePrivacySettings: jest.fn(() => settings),
    useProfileActions: jest.fn(() => ({ updatePrivacySettings: jest.fn() })),
    useProfileLoading: jest.fn(() => ({
      isLoading: false,
      isUpdating: false,
      isUploadingAvatar: false,
      isExporting: false,
    })),
  };
});

jest.mock('@/components/shared/DashboardNavigation', () => {
  const DashboardNavigation = () => <div data-testid="dashboard-navigation" />;
  const MobileDashboardNav = () => <div data-testid="mobile-dashboard-nav" />;

  return {
    __esModule: true,
    default: DashboardNavigation,
    MobileDashboardNav,
  };
});

jest.mock('@/features/profile/components/MyDataDashboard', () => ({
  __esModule: true,
  default: () => <div data-testid="my-data-dashboard" />,
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

const mockedAppStore = jest.requireMock('@/lib/stores/appStore') as {
  useAppActions: jest.Mock;
};

const mockedProfileHooks = jest.requireMock('@/features/profile/hooks/use-profile') as {
  useProfileData: jest.Mock;
  useProfileDraft: jest.Mock;
  useProfileDraftActions: jest.Mock;
};

const mockedUserStore = jest.requireMock('@/lib/stores') as {
  useUser: jest.Mock;
};

const mockedProfileStore = jest.requireMock('@/lib/stores/profileStore') as {
  useProfileStore: jest.Mock;
};

const privacySettings = {
  data_sharing: 'minimal',
  allow_messages: true,
} as unknown as PrivacySettings;

const mergeDraft = jest.fn();
const setProfileEditing = jest.fn();
const updatePrivacySettings = jest.fn();

const mockSetCurrentRoute = jest.fn();
const mockSetSidebarActiveSection = jest.fn();
const mockSetBreadcrumbs = jest.fn();

describe('Account privacy navigation wiring', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedProfileHooks.useProfileData.mockReturnValue({
      profile: { id: 'user-123', user_id: 'user-123', privacy_settings: privacySettings },
      isLoading: false,
      error: null,
    });

    mockedProfileHooks.useProfileDraft.mockReturnValue({ privacy_settings: null });
    mockedProfileHooks.useProfileDraftActions.mockReturnValue({
      mergeDraft,
      setProfileEditing,
    });

    mockedUserStore.useUser.mockReturnValue({ id: 'user-123' });

    mockedProfileStore.useProfileStore.mockImplementation((selector: (state: Record<string, unknown>) => unknown) =>
      selector({
        privacySettings,
        updatePrivacySettings,
        isUpdating: false,
      }),
    );

    mockedAppStore.useAppActions.mockReturnValue({
      setCurrentRoute: mockSetCurrentRoute,
      setSidebarActiveSection: mockSetSidebarActiveSection,
      setBreadcrumbs: mockSetBreadcrumbs,
    });
  });

  it('registers account privacy navigation state', async () => {
    render(<PrivacyPage />);

    await waitFor(() => {
      expect(mockSetCurrentRoute).toHaveBeenCalledWith('/account/privacy');
    });

    expect(mockSetSidebarActiveSection).toHaveBeenCalledWith('privacy');
    expect(mockSetBreadcrumbs).toHaveBeenCalledWith([
      { label: 'Home', href: '/' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Privacy & Data', href: '/account/privacy' },
    ]);
  });

  it('cleans up account breadcrumbs on unmount', async () => {
    const { unmount } = render(<PrivacyPage />);

    await waitFor(() => expect(mockSetCurrentRoute).toHaveBeenCalled());

    unmount();

    expect(mockSetSidebarActiveSection).toHaveBeenLastCalledWith(null);
    expect(mockSetBreadcrumbs).toHaveBeenLastCalledWith([]);
  });
});

