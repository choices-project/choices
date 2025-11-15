/**
 * @jest-environment node
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { ContactStore } from '@/lib/stores/contactStore';
import { contactStoreCreator } from '@/lib/stores/contactStore';

const createTestStore = () =>
  create<ContactStore>()(
    immer((set, get, _api) => contactStoreCreator(set, get))
  );

describe('contactStore API payload handling', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it('fetchThreads consumes successResponse envelopes', async () => {
    const store = createTestStore();
    const iso = new Date().toISOString();

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          threads: [
            {
              id: 'thread-1',
              user_id: 'user-1',
              representative_id: 42,
              subject: 'Constituent services',
              status: 'active',
              priority: 'normal',
              created_at: iso,
              updated_at: iso,
              last_message_at: iso,
              message_count: 0,
              representative: {
                id: 42,
                name: 'Representative Example',
                office: 'City Council',
                division_ids: []
              }
            }
          ],
          pagination: { total: 1, limit: 20, offset: 0, hasMore: false }
        }
      })
    }) as unknown as typeof global.fetch;

    const threads = await store.getState().fetchThreads();

    expect(threads).toHaveLength(1);
    expect(store.getState().threads[0]?.representative?.name).toEqual('Representative Example');
  });

  it('sendMessage stores messages from enveloped payloads', async () => {
    const store = createTestStore();
    const iso = new Date().toISOString();

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          threadId: 'thread-99',
          message: {
            id: 'msg-1',
            thread_id: 'thread-99',
            sender_id: 'user-1',
            recipient_id: 'rep-1',
            subject: 'Hello',
            content: 'Following up on our meeting.',
            status: 'sent',
            priority: 'normal',
            message_type: 'text',
            created_at: iso,
            updated_at: iso
          }
        }
      })
    }) as unknown as typeof global.fetch;

    const message = await store.getState().sendMessage({
      threadId: 'thread-99',
      representativeId: 99,
      subject: 'Hello',
      content: 'Following up on our meeting.'
    });

    const storedMessages = store.getState().messagesByThreadId['thread-99'] ?? [];

    expect(message.id).toBe('msg-1');
    expect(storedMessages).toHaveLength(1);
    expect(storedMessages[0]?.content).toContain('Following up');
  });
});

