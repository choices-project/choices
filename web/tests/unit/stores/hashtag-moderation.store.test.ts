import { act } from '@testing-library/react';

import { useHashtagModerationStore } from '@/lib/stores/hashtagModerationStore';

const createModeration = () => ({
  id: 'mod-1',
  hashtagId: 'climate-action',
  status: 'pending' as const,
  flags: [],
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
});

describe('hashtagModerationStore', () => {
  beforeEach(() => {
    act(() => {
      const store = useHashtagModerationStore.getState();
      store.setModerationQueue([]);
      store.setSelectedModeration(null);
      store.resetForm();
      store.setError(null);
    });
  });

  it('merges moderation updates and refreshes timestamps', () => {
    const original = createModeration();

    act(() => {
      useHashtagModerationStore.getState().setModerationQueue([original]);
    });

    const previousUpdatedAt = useHashtagModerationStore.getState().moderationQueue[0].updatedAt;

    act(() => {
      useHashtagModerationStore.getState().updateModeration(original.id, {
        status: 'approved',
        moderatorNotes: undefined,
      });
    });

    const [updated] = useHashtagModerationStore.getState().moderationQueue;

    expect(updated.status).toBe('approved');
    expect(updated.updatedAt).not.toBe(previousUpdatedAt);
    expect(updated.moderatorNotes).toBeUndefined();
    expect(updated).not.toBe(original);
  });
});


