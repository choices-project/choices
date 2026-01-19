/* eslint-disable boundaries/element-types */
/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';

import FeedPage from '@/app/(app)/feed/page';

jest.mock('@/features/feeds', () => ({
  UnifiedFeedRefactored: jest.fn(() => <div data-testid="unified-feed" />),
}));

jest.mock('@/lib/stores', () => ({
  useUser: jest.fn(),
}));

jest.mock('@/features/profile/hooks/useUserDistrict', () => ({
  useFormattedDistrict: jest.fn(),
}));

type FeedsModule = typeof import('@/features/feeds');
type StoresModule = typeof import('@/lib/stores');
type DistrictModule = typeof import('@/features/profile/hooks/useUserDistrict');

const feedsModule = jest.requireMock('@/features/feeds') as {
  [K in keyof FeedsModule]: jest.Mock;
};
const storesModule = jest.requireMock('@/lib/stores') as {
  [K in keyof StoresModule]: jest.Mock;
};
const districtModule = jest.requireMock('@/features/profile/hooks/useUserDistrict') as {
  [K in keyof DistrictModule]: jest.Mock;
};

describe('FeedPage', () => {
  const mockUnifiedFeed = feedsModule.UnifiedFeedRefactored as jest.Mock;
  const mockUseUser = storesModule.useUser as jest.Mock;
  const mockUseFormattedDistrict = districtModule.useFormattedDistrict as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFormattedDistrict.mockReturnValue('District 7');
  });

  it('renders the unified feed with analytics enabled and without userId when unauthenticated', () => {
    mockUseUser.mockReturnValue(null);

    render(<FeedPage />);

    expect(mockUnifiedFeed).toHaveBeenCalledTimes(1);

    const props = mockUnifiedFeed.mock.calls[0]?.[0];
    expect(props).toMatchObject({
      enableAnalytics: true,
      maxItems: 50,
      userDistrict: 'District 7',
    });
    expect('userId' in props).toBe(false);
  });

  it('passes userId when the user is authenticated', () => {
    mockUseUser.mockReturnValue({ id: 'user-123' });

    render(<FeedPage />);

    const props = mockUnifiedFeed.mock.calls[0]?.[0];
    expect(props).toMatchObject({
      enableAnalytics: true,
      maxItems: 50,
      userDistrict: 'District 7',
      userId: 'user-123',
    });
  });
});

/* eslint-enable boundaries/element-types */
