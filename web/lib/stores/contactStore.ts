/**
 * Contact Store - Zustand Implementation
 *
 * Centralised state management for contact threads and messages between
 * constituents and representatives. Aligns with 2025 store standards:
 * - Typed creator + action split
 * - Shared base loading/error helpers
 * - Normalised state with deterministic updates
 * - Memoised selector helpers for granular subscriptions
 *
 * Sensitive messaging data is not persisted locally to limit exposure of PII.
 */

import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createBaseStoreActions } from './baseStoreActions';
import type { BaseStore } from './types';

type ThreadStatus = 'active' | 'closed' | 'archived' | 'spam';
type ThreadPriority = 'low' | 'normal' | 'high' | 'urgent';
type MessageStatus = 'sent' | 'delivered' | 'read' | 'replied' | 'failed';
type MessageType = 'text' | 'email' | 'attachment' | 'system';

export type ContactRepresentativeSummary = {
  id: number;
  name: string;
  office: string;
  party?: string | null;
  district?: string | null;
  photo?: string | null;
  divisionIds: string[];
  ocdDivisionIds?: string[] | null;
};

export type ContactThread = {
  id: string;
  userId: string;
  representativeId: number;
  subject: string;
  status: ThreadStatus;
  priority: ThreadPriority;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  messageCount: number;
  representative: ContactRepresentativeSummary | null;
};

export type ContactMessage = {
  id: string;
  threadId: string;
  senderId: string;
  recipientId: string | number;
  subject: string;
  content: string;
  status: MessageStatus;
  priority: ThreadPriority;
  messageType: MessageType;
  attachments: Array<{
    name?: string;
    size?: number;
    type?: string;
    url?: string;
  }>;
  createdAt: string;
  updatedAt: string | null;
  readAt: string | null;
  repliedAt: string | null;
};

export type ContactPagination = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

type ContactMessagesMeta = ContactPagination & {
  lastFetchedAt: number | null;
};

export type ContactState = {
  threads: ContactThread[];
  threadsById: Record<string, ContactThread>;
  threadsByRepresentativeId: Record<string, string>;
  messagesByThreadId: Record<string, ContactMessage[]>;
  messagesMetaByThreadId: Record<string, ContactMessagesMeta>;
  messagesLoadingByThreadId: Record<string, boolean>;
  messagesErrorByThreadId: Record<string, string | null>;
  isLoading: boolean;
  isCreatingThread: boolean;
  isSendingMessage: boolean;
  error: string | null;
  lastFetchedAt: number | null;
};

export type FetchThreadsOptions = {
  status?: ThreadStatus;
  priority?: ThreadPriority;
  representativeId?: number | string;
  offset?: number;
  limit?: number;
  sortBy?: 'lastMessageAt' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  force?: boolean;
};

export type FetchMessagesOptions = {
  append?: boolean;
  offset?: number;
  limit?: number;
  force?: boolean;
};

export type CreateThreadInput = {
  representativeId: number;
  subject: string;
  priority?: ThreadPriority;
  initialMessage?: string;
};

export type CreateThreadResult = {
  thread: ContactThread;
  wasExisting: boolean;
  existingThreadId?: string;
};

export type SendMessageInput = {
  threadId: string;
  representativeId: number;
  subject: string;
  content: string;
  priority?: ThreadPriority;
  messageType?: Exclude<MessageType, 'system'>;
  attachments?: ContactMessage['attachments'];
};

export type ContactActions = Pick<BaseStore, 'setLoading' | 'setError' | 'clearError'> & {
  fetchThreads: (options?: FetchThreadsOptions) => Promise<ContactThread[]>;
  createThread: (input: CreateThreadInput) => Promise<CreateThreadResult>;
  fetchMessages: (threadId: string, options?: FetchMessagesOptions) => Promise<ContactMessage[]>;
  sendMessage: (input: SendMessageInput) => Promise<ContactMessage>;
  upsertThreads: (threads: ContactThread[]) => void;
  clearThreadMessages: (threadId: string) => void;
  resetContactState: () => void;
};

export type ContactStore = ContactState & ContactActions;

export type ContactStoreCreator = StateCreator<
  ContactStore,
  [['zustand/immer', never], ['zustand/devtools', never]],
  [],
  ContactStore
>;

const createInitialContactState = (): ContactState => ({
  threads: [],
  threadsById: {},
  threadsByRepresentativeId: {},
  messagesByThreadId: {},
  messagesMetaByThreadId: {},
  messagesLoadingByThreadId: {},
  messagesErrorByThreadId: {},
  isLoading: false,
  isCreatingThread: false,
  isSendingMessage: false,
  error: null,
  lastFetchedAt: null,
});

const normaliseRepresentative = (rep: any): ContactRepresentativeSummary | null => {
  if (!rep) {
    return null;
  }

  const rawDivisionIds =
    rep.division_ids ??
    rep.divisions ??
    rep.representative_divisions ??
    rep.ocdDivisionIds ??
    rep.ocd_division_ids ??
    [];

  const divisionIds = Array.isArray(rawDivisionIds)
    ? rawDivisionIds
        .map((value) => (typeof value === 'string' ? value.trim() : null))
        .filter((value): value is string => Boolean(value))
    : [];

  return {
    id: typeof rep.id === 'string' ? Number.parseInt(rep.id, 10) : Number(rep.id ?? 0),
    name: rep.name ?? '',
    office: rep.office ?? '',
    party: rep.party ?? rep.party_affiliation ?? null,
    district: rep.district ?? rep.district_name ?? null,
    photo: rep.photo ?? rep.avatar ?? null,
    divisionIds,
    ocdDivisionIds: Array.isArray(rep.ocdDivisionIds)
      ? rep.ocdDivisionIds
      : Array.isArray(rep.ocd_division_ids)
      ? rep.ocd_division_ids
      : divisionIds,
  };
};

const normaliseThread = (thread: any): ContactThread => {
  const representative = normaliseRepresentative(
    thread.representative ?? thread.representatives_core ?? thread.representativeSummary,
  );

  const representativeIdRaw =
    thread.representativeId ?? thread.representative_id ?? representative?.id ?? 0;

  return {
    id: String(thread.id),
    userId: String(thread.userId ?? thread.user_id ?? ''),
    representativeId:
      typeof representativeIdRaw === 'string'
        ? Number.parseInt(representativeIdRaw, 10)
        : Number(representativeIdRaw ?? 0),
    subject: thread.subject ?? representative?.office ?? '',
    status: (thread.status ?? 'active') as ThreadStatus,
    priority: (thread.priority ?? 'normal') as ThreadPriority,
    createdAt: thread.createdAt ?? thread.created_at ?? new Date().toISOString(),
    updatedAt: thread.updatedAt ?? thread.updated_at ?? thread.createdAt ?? thread.created_at ?? new Date().toISOString(),
    lastMessageAt: thread.lastMessageAt ?? thread.last_message_at ?? null,
    messageCount: Number(thread.messageCount ?? thread.message_count ?? 0),
    representative,
  };
};

const normaliseMessage = (message: any, fallbackThreadId: string): ContactMessage => {
  const threadIdRaw = message.threadId ?? message.thread_id ?? fallbackThreadId;
  const senderIdRaw = message.senderId ?? message.sender_id ?? message.userId ?? message.user_id ?? '';
  const recipientIdRaw = message.recipientId ?? message.recipient_id ?? '';

  return {
    id: String(message.id),
    threadId: String(threadIdRaw),
    senderId: String(senderIdRaw),
    recipientId: recipientIdRaw,
    subject: message.subject ?? '',
    content: message.content ?? message.message ?? '',
    status: (message.status ?? 'sent') as MessageStatus,
    priority: (message.priority ?? 'normal') as ThreadPriority,
    messageType: (message.messageType ?? message.message_type ?? 'text') as MessageType,
    attachments: Array.isArray(message.attachments) ? message.attachments : [],
    createdAt: message.createdAt ?? message.created_at ?? new Date().toISOString(),
    updatedAt: message.updatedAt ?? message.updated_at ?? null,
    readAt: message.readAt ?? message.read_at ?? null,
    repliedAt: message.repliedAt ?? message.replied_at ?? null,
  };
};

const extractPayload = <T = Record<string, unknown>>(raw: any): T =>
  ((raw && typeof raw === 'object' && 'data' in raw ? raw.data : raw) ?? {}) as T;

const sortThreadsByRecency = (threads: ContactThread[]): void => {
  threads.sort((a, b) => {
    const getTimestamp = (thread: ContactThread) => {
      const source =
        thread.lastMessageAt ??
        thread.updatedAt ??
        thread.createdAt;
      return source ? new Date(source).getTime() : 0;
    };
    return getTimestamp(b) - getTimestamp(a);
  });
};

const mergeMessages = (
  current: ContactMessage[],
  incoming: ContactMessage[],
  append: boolean,
): ContactMessage[] => {
  if (!current.length && !append) {
    return incoming.slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  const map = new Map<string, ContactMessage>();

  if (append) {
    for (const message of current) {
      map.set(message.id, message);
    }
  }

  for (const message of incoming) {
    map.set(message.id, message);
  }

  const merged = append
    ? Array.from(map.values())
    : incoming.concat(current.filter((msg) => !map.has(msg.id)));

  merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return merged;
};

const buildThreadsQuery = (options: FetchThreadsOptions = {}): string => {
  const searchParams = new URLSearchParams();

  if (options.status) {
    searchParams.set('status', options.status);
  }
  if (options.priority) {
    searchParams.set('priority', options.priority);
  }
  if (options.representativeId != null) {
    searchParams.set('representativeId', String(options.representativeId));
  }
  if (options.limit != null) {
    searchParams.set('limit', String(options.limit));
  }
  if (options.offset != null) {
    searchParams.set('offset', String(options.offset));
  }
  if (options.sortBy) {
    const sortMap: Record<string, string> = {
      lastMessageAt: 'last_message_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    };
    searchParams.set('sortBy', sortMap[options.sortBy] ?? 'last_message_at');
  }
  if (options.sortOrder) {
    searchParams.set('sortOrder', options.sortOrder);
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

const buildMessagesQuery = (threadId: string, options: FetchMessagesOptions = {}): string => {
  const searchParams = new URLSearchParams();
  searchParams.set('threadId', threadId);

  if (options.limit != null) {
    searchParams.set('limit', String(options.limit));
  }
  if (options.offset != null) {
    searchParams.set('offset', String(options.offset));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

const generateOptimisticId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto && typeof crypto.randomUUID === 'function') {
    return `optimistic-${crypto.randomUUID()}`;
  }
  return `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const createContactActions = (
  set: Parameters<ContactStoreCreator>[0],
  get: Parameters<ContactStoreCreator>[1],
): ContactActions => {
  const setState = set as unknown as (recipe: (draft: ContactState) => void) => void;
  const baseActions = createBaseStoreActions<ContactState>(setState);

  const upsertThreads = (threads: ContactThread[]) => {
    setState((state) => {
      for (const thread of threads) {
        state.threadsById[thread.id] = thread;
        state.threadsByRepresentativeId[String(thread.representativeId)] = thread.id;

        const existingIndex = state.threads.findIndex((item) => item.id === thread.id);
        if (existingIndex >= 0) {
          state.threads[existingIndex] = thread;
        } else {
          state.threads.push(thread);
        }
      }

      sortThreadsByRecency(state.threads);
      state.lastFetchedAt = Date.now();
    });
  };

  const fetchThreads: ContactActions['fetchThreads'] = async (options = {}) => {
    const { force = false, ...restOptions } = options;
    const state = get();

    if (state.isLoading && !force) {
      return state.threads;
    }

    baseActions.setLoading(true);

    try {
      const query = buildThreadsQuery(restOptions);
      const response = await fetch(`/api/contact/threads${query}`);
      const data = await response.json();
      const payload = extractPayload<{ threads?: any[]; pagination?: ContactPagination }>(data);

      if (!response.ok || data?.success !== true) {
        throw new Error(data?.error ?? 'Failed to fetch contact threads');
      }

      const normalisedThreads = Array.isArray(payload.threads)
        ? (payload.threads as any[]).map(normaliseThread)
        : [];

      setState((draft) => {
        draft.threads = [];
        draft.threadsById = {};
        draft.threadsByRepresentativeId = {};
        draft.lastFetchedAt = Date.now();
      });

      upsertThreads(normalisedThreads);

      baseActions.clearError();

      return normalisedThreads;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error fetching threads';
      baseActions.setError(message);
      throw error;
    } finally {
      baseActions.setLoading(false);
    }
  };

  const createThread: ContactActions['createThread'] = async (input) => {
    setState((state) => {
      state.isCreatingThread = true;
    });

    try {
      const response = await fetch('/api/contact/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          representativeId: String(input.representativeId),
          subject: input.subject,
          priority: input.priority ?? 'normal',
          initialMessage: input.initialMessage,
        }),
      });

      const data = await response.json().catch(() => ({}));
      const payload = extractPayload<{ thread?: any; threadId?: string; existingThreadId?: string }>(data);

      if (response.status === 409) {
        await fetchThreads({ force: true });
        const existingThreadId: string | undefined =
          data?.details?.existingThreadId ??
          payload.existingThreadId ??
          payload.threadId ??
          payload.thread?.id;
        const existingThread =
          (existingThreadId ? get().threadsById[existingThreadId] : undefined) ??
          get().threads.find(
            (thread) => thread.representativeId === input.representativeId && thread.status === 'active',
          );

        if (!existingThread) {
          throw new Error(
            data?.error ?? 'Active thread already exists with this representative',
          );
        }

        return {
          thread: existingThread,
          wasExisting: true,
          existingThreadId: existingThread.id,
        };
      }

      if (!response.ok || data?.success !== true || !payload.thread) {
        throw new Error(data?.error ?? 'Failed to create thread');
      }

      const thread = normaliseThread(payload.thread);
      upsertThreads([thread]);
      baseActions.clearError();

      return {
        thread,
        wasExisting: false,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error creating contact thread';
      baseActions.setError(message);
      throw error;
    } finally {
      setState((state) => {
        state.isCreatingThread = false;
      });
    }
  };

  const fetchMessages: ContactActions['fetchMessages'] = async (threadId, options = {}) => {
    const { append = false, force = false, ...restOptions } = options;
    const state = get();

    if (state.messagesLoadingByThreadId[threadId] && !force) {
      return state.messagesByThreadId[threadId] ?? [];
    }

    setState((draft) => {
      draft.messagesLoadingByThreadId[threadId] = true;
      draft.messagesErrorByThreadId[threadId] = null;
    });

    try {
      const query = buildMessagesQuery(threadId, restOptions);
      const response = await fetch(`/api/contact/messages${query}`);
      const data = await response.json();
      const payload = extractPayload<{ messages?: any[]; pagination?: ContactPagination }>(data);

      if (!response.ok || data?.success !== true) {
        throw new Error(data?.error ?? 'Failed to fetch contact messages');
      }

      const normalisedMessages = Array.isArray(payload.messages)
        ? (payload.messages as any[]).map((message) => normaliseMessage(message, threadId))
        : [];

      setState((draft) => {
        const existingMessages = draft.messagesByThreadId[threadId] ?? [];
        draft.messagesByThreadId[threadId] = mergeMessages(existingMessages, normalisedMessages, append);
        draft.messagesMetaByThreadId[threadId] = {
          total: payload.pagination?.total ?? normalisedMessages.length,
          limit: payload.pagination?.limit ?? restOptions.limit ?? 50,
          offset: payload.pagination?.offset ?? restOptions.offset ?? 0,
          hasMore: Boolean(payload.pagination?.hasMore),
          lastFetchedAt: Date.now(),
        };
      });

      return get().messagesByThreadId[threadId] ?? [];
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error fetching contact messages';
      setState((draft) => {
        draft.messagesErrorByThreadId[threadId] = message;
      });
      baseActions.setError(message);
      throw error;
    } finally {
      setState((draft) => {
        draft.messagesLoadingByThreadId[threadId] = false;
      });
    }
  };

  const sendMessage: ContactActions['sendMessage'] = async (input) => {
    const optimisticId = generateOptimisticId();
    const optimisticCreatedAt = new Date().toISOString();

    setState((draft) => {
      draft.isSendingMessage = true;
      draft.error = null;

      const optimisticMessage: ContactMessage = {
        id: optimisticId,
        threadId: input.threadId,
        senderId: String(input.representativeId ?? 'me'),
        recipientId: input.representativeId,
        subject: input.subject,
        content: input.content,
        status: 'sent',
        priority: input.priority ?? 'normal',
        messageType: input.messageType ?? 'text',
        attachments: input.attachments ?? [],
        createdAt: optimisticCreatedAt,
        updatedAt: null,
        readAt: null,
        repliedAt: null,
      };

      const existingMessages = draft.messagesByThreadId[input.threadId] ?? [];
      draft.messagesByThreadId[input.threadId] = mergeMessages(existingMessages, [optimisticMessage], true);

      const thread = draft.threadsById[input.threadId];
      if (thread) {
        thread.lastMessageAt = optimisticCreatedAt;
        thread.messageCount = Number.isFinite(thread.messageCount)
          ? thread.messageCount + 1
          : (draft.messagesByThreadId[input.threadId]?.length ?? 1);
        thread.updatedAt = optimisticCreatedAt;
      }

      const meta = draft.messagesMetaByThreadId[input.threadId];
      draft.messagesMetaByThreadId[input.threadId] = {
        total: (meta?.total ?? existingMessages.length) + 1,
        limit: meta?.limit ?? existingMessages.length + 1,
        offset: 0,
        hasMore: meta?.hasMore ?? false,
        lastFetchedAt: Date.now(),
      };
    });

    try {
      const response = await fetch('/api/contact/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          threadId: input.threadId,
          representativeId: String(input.representativeId),
          subject: input.subject,
          content: input.content,
          priority: input.priority ?? 'normal',
          messageType: input.messageType ?? 'text',
          attachments: input.attachments ?? [],
        }),
      });

      const data = await response.json().catch(() => ({}));
      const payload = extractPayload<{ message?: any; threadId?: string }>(data);

      if (!response.ok || data?.success !== true || !payload.message) {
        throw new Error('Failed to send contact message');
      }

      const normalisedMessage = normaliseMessage(
        payload.message,
        payload.threadId ?? input.threadId
      );

      setState((draft) => {
        const threadId = normalisedMessage.threadId;
        const existingMessages = draft.messagesByThreadId[threadId] ?? [];
        const withoutOptimistic = existingMessages.filter((message) => message.id !== optimisticId);
        const updatedMessages = mergeMessages(withoutOptimistic, [normalisedMessage], true);
        draft.messagesByThreadId[threadId] = updatedMessages;

        const thread = draft.threadsById[threadId];
        if (thread) {
          thread.lastMessageAt = normalisedMessage.createdAt;
          thread.messageCount = Number.isFinite(thread.messageCount)
            ? thread.messageCount + 1
            : updatedMessages.length;
          thread.updatedAt = normalisedMessage.createdAt ?? new Date().toISOString();
        }

        draft.messagesMetaByThreadId[threadId] = {
          total: updatedMessages.length,
          limit: draft.messagesMetaByThreadId[threadId]?.limit ?? updatedMessages.length,
          offset: 0,
          hasMore: draft.messagesMetaByThreadId[threadId]?.hasMore ?? false,
          lastFetchedAt: Date.now(),
        };
      });

      upsertThreads(
        [get().threadsById[normalisedMessage.threadId]].filter(
          (thread): thread is ContactThread => Boolean(thread),
        ),
      );

      baseActions.clearError();

      return normalisedMessage;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error sending contact message';
      baseActions.setError(message);

      setState((draft) => {
        const messages = draft.messagesByThreadId[input.threadId];
        if (messages) {
          draft.messagesByThreadId[input.threadId] = messages.filter((msg) => msg.id !== optimisticId);
        }

        const thread = draft.threadsById[input.threadId];
        if (thread && Number.isFinite(thread.messageCount)) {
          thread.messageCount = Math.max(0, thread.messageCount - 1);
        }

        if (draft.messagesMetaByThreadId[input.threadId]) {
          const prev = draft.messagesMetaByThreadId[input.threadId]!;
          draft.messagesMetaByThreadId[input.threadId] = {
            total: Math.max(0, (prev.total ?? 1) - 1),
            lastFetchedAt: Date.now(),
            limit: prev.limit,
            offset: prev.offset,
            hasMore: prev.hasMore,
          };
        }
      });

      throw error;
    } finally {
      setState((draft) => {
        draft.isSendingMessage = false;
      });
    }
  };

  const clearThreadMessages: ContactActions['clearThreadMessages'] = (threadId) => {
    setState((draft) => {
      delete draft.messagesByThreadId[threadId];
      delete draft.messagesMetaByThreadId[threadId];
      delete draft.messagesLoadingByThreadId[threadId];
      delete draft.messagesErrorByThreadId[threadId];
    });
  };

  const resetContactState: ContactActions['resetContactState'] = () => {
    setState(() => createInitialContactState());
  };

  return {
    ...baseActions,
    fetchThreads,
    createThread,
    fetchMessages,
    sendMessage,
    upsertThreads,
    clearThreadMessages,
    resetContactState,
  };
};

export const contactStoreCreator: ContactStoreCreator = (set, get) =>
  Object.assign(createInitialContactState(), createContactActions(set, get));

export const useContactStore = create<ContactStore>()(
  devtools(immer(contactStoreCreator), { name: 'contact-store' }),
);

// Selector helpers
export const useContactThreadsState = () => useContactStore((state) => state.threads);
export const useContactThreadsLoading = () => useContactStore((state) => state.isLoading);
export const useContactThreadsError = () => useContactStore((state) => state.error);
export const useContactIsCreatingThread = () =>
  useContactStore((state) => state.isCreatingThread);
export const useContactIsSendingMessage = () =>
  useContactStore((state) => state.isSendingMessage);

export const useContactThreadById = (threadId: string | null | undefined) =>
  useContactStore((state) =>
    threadId ? state.threadsById[threadId] ?? null : null,
  );

export const useContactThreadByRepresentativeId = (
  representativeId: number | string | null | undefined,
) =>
  useContactStore((state) => {
    if (representativeId == null) {
      return null;
    }
    const key = String(representativeId);
    const threadId = state.threadsByRepresentativeId[key];
    return threadId ? state.threadsById[threadId] ?? null : null;
  });

export const useContactMessagesByThreadId = (threadId: string | null | undefined) =>
  useContactStore((state) =>
    threadId ? state.messagesByThreadId[threadId] ?? [] : [],
  );

export const useContactMessagesLoading = (threadId: string | null | undefined) =>
  useContactStore((state) =>
    threadId ? state.messagesLoadingByThreadId[threadId] ?? false : false,
  );

export const useContactMessagesError = (threadId: string | null | undefined) =>
  useContactStore((state) =>
    threadId ? state.messagesErrorByThreadId[threadId] ?? null : null,
  );

export const useContactActions = () => {
  const fetchThreads = useContactStore((state) => state.fetchThreads);
  const createThread = useContactStore((state) => state.createThread);
  const fetchMessages = useContactStore((state) => state.fetchMessages);
  const sendMessage = useContactStore((state) => state.sendMessage);
  const clearThreadMessages = useContactStore((state) => state.clearThreadMessages);
  const resetContactState = useContactStore((state) => state.resetContactState);

  return {
    fetchThreads,
    createThread,
    fetchMessages,
    sendMessage,
    clearThreadMessages,
    resetContactState,
  };
};


