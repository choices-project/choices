import { logger } from '@/lib/utils/logger';

import type { PollCreatePayload, PollCreateResult } from './types';

const DEFAULT_ERROR_MESSAGE = 'Something went wrong while creating your poll.';

const parseResponse = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const extractFieldErrors = (body: unknown): Record<string, string> | undefined => {
  if (!body || typeof body !== 'object') {
    return undefined;
  }

  const candidate =
    'fields' in body && typeof (body as Record<string, unknown>).fields === 'object'
      ? (body as Record<string, Record<string, string>>).fields
      : 'details' in body && body.details && typeof (body as Record<string, any>).details.fields === 'object'
      ? ((body as Record<string, any>).details.fields as Record<string, string>)
      : undefined;

  if (!candidate) {
    return undefined;
  }

  const entries = Object.entries(candidate).filter(([, value]) => typeof value === 'string');
  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries) as Record<string, string>;
};

const resolveErrorMessage = (status: number, fallbackMessage: string): string => {
  switch (status) {
    case 400:
    case 422:
      return fallbackMessage || 'Some fields need attention before we can publish your poll.';
    case 401:
      return 'Please sign in to create a poll.';
    case 403:
      return 'You do not have permission to create polls on this account.';
    case 404:
      return 'The poll service is temporarily unavailable. Please try again soon.';
    case 429:
      return 'You are creating polls too quickly. Please slow down and try again in a moment.';
    case 500:
      return 'Our servers hit an issue saving your poll. Please try again in a few minutes.';
    default:
      return fallbackMessage || DEFAULT_ERROR_MESSAGE;
  }
};

export async function createPollRequest(payload: PollCreatePayload, signal?: AbortSignal): Promise<PollCreateResult> {
  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    credentials: 'include',
    body: JSON.stringify(payload),
  };

  if (signal) {
    requestInit.signal = signal;
  }

  const startedAt = typeof performance !== 'undefined' ? performance.now() : undefined;

  let response: Response;
  try {
    response = await fetch('/api/polls', requestInit);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        success: false,
        message: 'Poll creation cancelled',
        status: 0,
        details: { reason: 'aborted' },
      };
    }

    logger.error('Poll creation request failed before reaching the server', {
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
    });

    return {
      success: false,
      message: 'Unable to reach the server. Check your connection and try again.',
      status: 0,
      details: error instanceof Error ? { name: error.name, message: error.message } : error,
    };
  }

  const durationMs =
    startedAt !== undefined && typeof performance !== 'undefined' ? Math.round(performance.now() - startedAt) : undefined;

  const body = await parseResponse(response);

  if (!response.ok) {
    const fallbackMessage =
      (body && typeof body === 'object' && 'error' in body && typeof (body as Record<string, unknown>).error === 'string'
        ? (body as Record<string, string>).error
        : null) ?? DEFAULT_ERROR_MESSAGE;

    const fieldErrors = extractFieldErrors(body);
    const message = resolveErrorMessage(response.status, fallbackMessage);

    logger.warn('Poll creation returned an error response', {
      status: response.status,
      durationMs,
      fieldErrors,
      body,
    });

    return {
      success: false,
      message,
      status: response.status,
      details: body,
      fieldErrors,
    };
  }

  if (!body || typeof body !== 'object') {
    logger.error('Poll creation succeeded but response payload was not JSON', {
      durationMs,
    });
    return {
      success: false,
      message: 'Unexpected response from the server. Please try again.',
    };
  }

  const pollData = 'data' in body && body.data && typeof body.data === 'object' ? (body.data as Record<string, unknown>) : {};
  const id = typeof pollData.id === 'string' ? pollData.id : undefined;
  const title = typeof pollData.title === 'string' ? pollData.title : undefined;

  if (!id) {
    logger.error('Poll creation response missing poll identifier', {
      durationMs,
      payload: body,
    });
    return {
      success: false,
      message: 'Poll created but the server response was incomplete. Please refresh before retrying.',
      details: body,
    };
  }

  logger.info('Poll created successfully', {
    pollId: id,
    category: payload.category,
    optionCount: payload.options.length,
    privacyLevel: payload.settings.privacyLevel,
    durationMs,
  });

  return {
    success: true,
    ok: true,
    data: {
      id,
      title: title ?? payload.title,
    },
  };
}

