/**
 * @jest-environment node
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { ContactStore, ContactThread } from '@/lib/stores/contactStore';
import { contactStoreCreator } from '@/lib/stores/contactStore';

const createTestStore = () =>
  create<ContactStore>()(
    immer((set, get, api) => contactStoreCreator(set, get, api))
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

  it('optimistically inserts and then replaces contact messages on success', async () => {
    const store = createTestStore();
    const iso = new Date().toISOString();
    const thread: ContactThread = {
      id: 'thread-optimistic',
      userId: 'user-1',
      representativeId: 42,
      subject: 'Feedback',
      status: 'active',
      priority: 'normal',
      createdAt: iso,
      updatedAt: iso,
      lastMessageAt: null,
      messageCount: 0,
      representative: null,
    };

    store.setState((state) => {
      state.threads = [thread];
      state.threadsById[thread.id] = thread;
      state.messagesByThreadId[thread.id] = [];
      state.messagesMetaByThreadId[thread.id] = {
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
        lastFetchedAt: null,
      };
    });

    let resolveFetch: (() => void) | undefined;

    global.fetch = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = () =>
            resolve({
              ok: true,
              status: 200,
              json: async () => ({
                success: true,
                data: {
                  threadId: thread.id,
                  message: {
                    id: 'msg-server',
                    thread_id: thread.id,
                    sender_id: 'user-1',
                    recipient_id: 42,
                    subject: 'Feedback',
                    content: 'Thanks for your help!',
                    status: 'sent',
                    priority: 'normal',
                    message_type: 'text',
                    attachments: [],
                    created_at: iso,
                    updated_at: null,
                  },
                },
              }),
            } as unknown as Response);
        }),
    ) as typeof global.fetch;

    const sendPromise = store.getState().sendMessage({
      threadId: thread.id,
      representativeId: 42,
      subject: 'Feedback',
      content: 'Thanks for your help!',
    });

    const optimisticMessages = store.getState().messagesByThreadId[thread.id] ?? [];
    expect(optimisticMessages).toHaveLength(1);
    expect(optimisticMessages[0]?.id).toContain('optimistic-');
    expect(store.getState().isSendingMessage).toBe(true);

    resolveFetch?.();
    const finalMessage = await sendPromise;

    const storedMessages = store.getState().messagesByThreadId[thread.id] ?? [];
    expect(storedMessages).toHaveLength(1);
    expect(storedMessages[0]?.id).toBe('msg-server');
    expect(finalMessage.id).toBe('msg-server');
    expect(store.getState().isSendingMessage).toBe(false);
    expect(store.getState().error).toBeNull();
  });

  it('rolls back optimistic insert when sendMessage fails', async () => {
    const store = createTestStore();
    const iso = new Date().toISOString();
    const thread: ContactThread = {
      id: 'thread-error',
      userId: 'user-1',
      representativeId: 55,
      subject: 'Assistance',
      status: 'active',
      priority: 'normal',
      createdAt: iso,
      updatedAt: iso,
      lastMessageAt: null,
      messageCount: 0,
      representative: null,
    };

    store.setState((state) => {
      state.threads = [thread];
      state.threadsById[thread.id] = thread;
      state.messagesByThreadId[thread.id] = [];
      state.messagesMetaByThreadId[thread.id] = {
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
        lastFetchedAt: null,
      };
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    }) as unknown as typeof global.fetch;

    await expect(
      store.getState().sendMessage({
        threadId: thread.id,
        representativeId: 55,
        subject: 'Assistance',
        content: 'Need help',
      }),
    ).rejects.toThrow('Failed to send contact message');

    const messages = store.getState().messagesByThreadId[thread.id] ?? [];
    expect(messages).toHaveLength(0);
    expect(store.getState().error).toBe('Failed to send contact message');
    expect(store.getState().threadsById[thread.id]?.messageCount).toBe(0);
  });
});

