/** @jest-environment jsdom */

import { jest } from '@jest/globals';
import { PWAAuth } from '@/features/pwa/lib/pwa-auth-integration';
import { isFeatureEnabled } from '@/lib/core/feature-flags';

jest.mock('@/lib/core/feature-flags', () => ({
  isFeatureEnabled: jest.fn(() => true),
}));

const mockIsFeatureEnabled = isFeatureEnabled as jest.MockedFunction<typeof isFeatureEnabled>;

describe('PWAAuth integration', () => {
  beforeEach(() => {
    mockIsFeatureEnabled.mockReturnValue(true);
    localStorage.clear();
  });

  it('creates a user with default PWA feature configuration and persists it', async () => {
    const sut = new PWAAuth();

    const user = await sut.createUser();

    expect(user.pwaFeatures).toEqual({
      webAuthnEnabled: false,
      pushNotificationsEnabled: false,
      offlineVotingEnabled: true,
      encryptedStorageEnabled: true,
    });

    expect(localStorage.getItem('pwa_user')).not.toBeNull();
  });

  it('exports data with sanitized offline votes', async () => {
    const sut = new PWAAuth();

    await sut.createUser();

    localStorage.setItem(
      'offline_votes',
      JSON.stringify([
        { pollId: 'poll-1', choice: 2, timestamp: 123, metadata: { source: 'cache' } },
        { invalid: true },
      ])
    );

    const exported = sut.exportUserData();

    expect(exported).not.toBeNull();
    expect(exported?.offlineVotes).toHaveLength(1);

    const vote = exported?.offlineVotes?.[0];
    expect(vote).toBeDefined();
    const definedVote = vote!;
    expect(definedVote.pollId).toBe('poll-1');
    expect(definedVote.choice).toBe(2);
    expect(typeof definedVote.timestamp).toBe('number');
    expect(definedVote.metadata).toEqual({ source: 'cache' });
  });

  it('disables functionality when feature flag is off', () => {
    mockIsFeatureEnabled.mockReturnValue(false);

    expect(() => new PWAAuth()).not.toThrow();

    const sut = new PWAAuth();

    return expect(sut.createUser()).rejects.toThrow('PWA feature is disabled');
  });
});
