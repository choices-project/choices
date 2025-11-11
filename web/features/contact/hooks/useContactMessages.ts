/**
 * Contact Messages Hooks
 *
 * Convenience React hooks layered on top of the contact Zustand store.
 * Maintains backwards compatible signatures for feature components while
 * delegating all state management to `web/lib/stores/contactStore.ts`.
 *
 * Created: January 23, 2025
 * Updated: November 10, 2025
 * Status: ✅ ACTIVE
 */

import { useCallback, useEffect, useMemo } from 'react';

import {
  useContactThreadsState,
  useContactThreadsLoading,
  useContactThreadsError,
  useContactThreadByRepresentativeId,
  useContactMessagesByThreadId,
  useContactMessagesLoading,
  useContactMessagesError,
  useContactActions,
  useContactIsCreatingThread,
  useContactIsSendingMessage,
} from '@/lib/stores';
import type {
  FetchThreadsOptions,
  FetchMessagesOptions,
  ContactMessage,
} from '@/lib/stores/contactStore';
import { useIsAuthenticated } from '@/lib/stores';

type UseContactThreadsOptions = {
  autoFetch?: boolean;
  fetchOptions?: FetchThreadsOptions;
};

export function useContactThreads(options: UseContactThreadsOptions = {}) {
  const { autoFetch = true, fetchOptions } = options;
  const threads = useContactThreadsState();
  const loading = useContactThreadsLoading();
  const error = useContactThreadsError();
  const isCreatingThread = useContactIsCreatingThread();
  const isAuthenticated = useIsAuthenticated();
  const { fetchThreads, createThread } = useContactActions();

  const memoisedFetchOptions = useMemo(() => fetchOptions ?? {}, [fetchOptions]);

  useEffect(() => {
    if (!autoFetch || !isAuthenticated) {
      return;
    }

    void fetchThreads(memoisedFetchOptions);
  }, [autoFetch, isAuthenticated, fetchThreads, memoisedFetchOptions]);

  const refetch = useCallback(
    (override?: FetchThreadsOptions) =>
      fetchThreads({
        ...memoisedFetchOptions,
        ...override,
        force: true,
      }),
    [fetchThreads, memoisedFetchOptions],
  );

  return {
    threads,
    loading: loading || isCreatingThread,
    error,
    createThread,
    refetch,
  };
}

type UseContactMessagesOptions = {
  autoFetch?: boolean;
  forceOnMount?: boolean;
  fetchOptions?: FetchMessagesOptions;
};

export function useContactMessages(
  representativeId: number | string | null | undefined,
  options: UseContactMessagesOptions = {},
) {
  const { autoFetch = true, forceOnMount = false, fetchOptions } = options;
  const memoisedFetchOptions = useMemo(() => fetchOptions ?? {}, [fetchOptions]);
  const numericRepresentativeId =
    representativeId == null
      ? null
      : typeof representativeId === 'string'
      ? Number.parseInt(representativeId, 10)
      : representativeId;

  const thread = useContactThreadByRepresentativeId(numericRepresentativeId);
  const threadId = thread?.id ?? null;
  const messages = useContactMessagesByThreadId(threadId);
  const loading = useContactMessagesLoading(threadId);
  const requestError = useContactMessagesError(threadId);
  const isSendingMessage = useContactIsSendingMessage();
  const { fetchMessages, sendMessage } = useContactActions();

  useEffect(() => {
    if (!autoFetch || !threadId) {
      return;
    }

    if (!forceOnMount && messages.length > 0) {
      return;
    }

    void fetchMessages(threadId, memoisedFetchOptions);
  }, [autoFetch, forceOnMount, fetchMessages, memoisedFetchOptions, messages.length, threadId]);

  const refetch = useCallback(
    (override?: FetchMessagesOptions) =>
      threadId
        ? fetchMessages(threadId, {
            ...memoisedFetchOptions,
            ...override,
            force: true,
          })
        : Promise.resolve([] as ContactMessage[]),
    [fetchMessages, memoisedFetchOptions, threadId],
  );

  return {
    thread,
    threadId,
    messages,
    loading: loading || isSendingMessage,
    error: requestError,
    refetch,
    sendMessage,
  };
}
