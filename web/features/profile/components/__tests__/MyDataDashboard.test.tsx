/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import MyDataDashboard from '@/features/profile/components/MyDataDashboard';
import type { PrivacySettings } from '@/types/profile';

const mockExportProfile = jest.fn();
const mockDeleteProfile = jest.fn();
const mockSignOut = jest.fn();
const mockUpdatePrivacySettings = jest.fn();
const mockResetProfile = jest.fn();

jest.mock('@/features/profile/hooks/use-profile', () => ({
  useProfileExport: () => ({ exportProfile: mockExportProfile, isExporting: false }),
  useProfileDelete: () => ({ deleteProfile: mockDeleteProfile }),
}));

jest.mock('@/lib/stores', () => ({
  useUserActions: () => ({ signOut: mockSignOut }),
}));

const mockStoreState = {
  privacySettings: null,
  updatePrivacySettings: mockUpdatePrivacySettings,
  resetProfile: mockResetProfile,
};

const mockUseProfileStore = jest.fn((selector: any) => {
  if (typeof selector === 'function') {
    return selector(mockStoreState);
  }
  return mockStoreState;
});

jest.mock('@/lib/stores/profileStore', () => ({
  profileSelectors: {
    privacySettings: (state: typeof mockStoreState) => state.privacySettings,
  },
  useProfileStore: (selector: any) => mockUseProfileStore(selector),
}));

const buildPrivacySettings = (overrides: Partial<PrivacySettings> = {}): PrivacySettings => ({
  collectLocationData: false,
  collectVotingHistory: false,
  trackInterests: false,
  trackFeedActivity: false,
  collectAnalytics: false,
  trackRepresentativeInteractions: false,
  showReadHistory: false,
  showBookmarks: false,
  showLikes: false,
  shareActivity: false,
  participateInTrustTier: false,
  personalizeFeeds: false,
  personalizeRecommendations: false,
  retainVotingHistory: false,
  retainSearchHistory: false,
  retainLocationHistory: false,
  ...overrides,
});

describe('MyDataDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStoreState.privacySettings = null;
  });

  it('calls onPrivacyUpdate when a privacy toggle is changed', async () => {
    const onPrivacyUpdate = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <MyDataDashboard
        userId="user-1"
        privacySettings={buildPrivacySettings()}
        onPrivacyUpdate={onPrivacyUpdate}
      />,
    );

    const switches = screen.getAllByRole('switch');
    await user.click(switches[0]);

    await waitFor(() => {
      expect(onPrivacyUpdate).toHaveBeenCalledWith({ collectLocationData: true });
    });

    expect(screen.queryByText(/failed to update privacy setting/i)).not.toBeInTheDocument();
  });

  it('surfaces an error message when the privacy update fails', async () => {
    const onPrivacyUpdate = jest.fn().mockRejectedValue(new Error('update failed'));
    const user = userEvent.setup();

    render(
      <MyDataDashboard
        userId="user-1"
        privacySettings={buildPrivacySettings()}
        onPrivacyUpdate={onPrivacyUpdate}
      />,
    );

    const switches = screen.getAllByRole('switch');
    await user.click(switches[0]);

    expect(await screen.findByText('update failed')).toBeInTheDocument();
  });

  it('exports profile data and shows a success message', async () => {
    const user = userEvent.setup();
    const exportedData = { profile: { id: 'user-1' } };
    mockExportProfile.mockResolvedValue(exportedData);

    const createObjectURLSpy = jest
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:mock-export');
    const revokeObjectURLSpy = jest
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => undefined);
    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    render(
      <MyDataDashboard
        userId="user-1"
        privacySettings={buildPrivacySettings()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /export all my data/i }));

    await waitFor(() => {
      expect(mockExportProfile).toHaveBeenCalledWith({
        includeActivity: true,
        includeVotes: true,
        includeComments: true,
        format: 'json',
      });
    });

    expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob));
    expect(clickSpy).toHaveBeenCalled();
    expect(
      await screen.findByText(/your data has been exported successfully/i),
    ).toBeInTheDocument();

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    clickSpy.mockRestore();
  });
});
