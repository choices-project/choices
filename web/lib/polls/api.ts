import { logger } from '@/lib/utils/logger';

import type { PollCreatePayload } from './wizard/submission';

const DEFAULT_CREATE_ERROR_MESSAGE = 'Something went wrong while creating your poll.';
const DEFAULT_VOTE_ERROR_MESSAGE = 'We could not record your vote. Please try again.';
const DEFAULT_UNDO_ERROR_MESSAGE = 'We could not undo your vote. Please try again.';

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

const resolveErrorMessage = (
  status: number,
  fallbackMessage: string | null | undefined,
  defaultMessage: string,
): string => {
  const safeMessage =
    typeof fallbackMessage === 'string' && fallbackMessage.trim().length > 0 ? fallbackMessage : defaultMessage;

  switch (status) {
    case 400:
    case 422:
      return safeMessage || 'Some fields need attention before we can complete this action.';
    case 401:
      return 'Please sign in to continue.';
    case 403:
      return 'You do not have permission to complete this action.';
    case 404:
      return 'The requested resource is temporarily unavailable. Please try again soon.';
    case 429:
      return 'You are performing this action too quickly. Please slow down and try again in a moment.';
    case 500:
      return 'Our servers hit an issue. Please try again in a few minutes.';
    default:
      return safeMessage || defaultMessage;
  }
};

export type PollActionErrorReason =
  | 'validation'
  | 'authentication'
  | 'permission'
  | 'rate_limit'
  | 'network'
  | 'cancelled'
  | 'unknown';

const resolveErrorReason = (
  status: number,
  fieldErrors?: Record<string, string>,
  details?: unknown,
): PollActionErrorReason => {
  if (status === 0) {
    if (
      details &&
      typeof details === 'object' &&
      'reason' in (details as Record<string, unknown>) &&
      (details as Record<string, unknown>).reason === 'aborted'
    ) {
      return 'cancelled';
    }
    return 'network';
  }

  if (status === 401) {
    return 'authentication';
  }

  if (status === 403) {
    return 'permission';
  }

  if (status === 429) {
    return 'rate_limit';
  }

  if (status >= 500) {
    return 'network';
  }

  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return 'validation';
  }

  if (status >= 400 && status < 500) {
    return 'unknown';
  }

  return 'unknown';
};

export type PollActionErrorResult = {
  success: false;
  status: number;
  message: string;
  reason: PollActionErrorReason;
  details?: unknown;
  fieldErrors?: Record<string, string>;
  durationMs?: number;
};

export type PollCreateRequestSuccess = {
      success: true;
      ok: true;
  status: number;
      data: {
        id: string;
        title: string;
      };
  message?: string;
  durationMs?: number;
};

export type PollCreateRequestResult = PollCreateRequestSuccess | PollActionErrorResult;

export type PollVoteRequestSuccess = {
  success: true;
  status: number;
  message?: string;
  durationMs?: number;
  data: {
    pollId: string;
    optionId: string;
    totalVotes?: number;
    voteId?: string;
  };
};

export type PollVoteRequestResult = PollVoteRequestSuccess | PollActionErrorResult;

export type PollUndoVoteRequestSuccess = {
  success: true;
      status: number;
  message?: string;
  durationMs?: number;
  data: {
    pollId: string;
    totalVotes?: number;
    voteId?: string;
  };
    };

export type PollUndoVoteRequestResult = PollUndoVoteRequestSuccess | PollActionErrorResult;

const createJsonRequestInit = (body: unknown, signal?: AbortSignal): RequestInit => {
  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    credentials: 'include',
    body: JSON.stringify(body),
  };

  if (signal) {
    requestInit.signal = signal;
  }

  return requestInit;
};

const computeDuration = (startedAt?: number): number | undefined => {
  if (startedAt === undefined || typeof performance === 'undefined') {
    return undefined;
  }
  return Math.round(performance.now() - startedAt);
};

const createNetworkErrorResult = (
  context: 'create' | 'vote' | 'undo',
  error: unknown,
): PollActionErrorResult => {
  logger.error(
    context === 'create'
      ? 'Poll creation request failed before reaching the server'
      : context === 'vote'
        ? 'Poll vote request failed before reaching the server'
        : 'Poll undo vote request failed before reaching the server',
    {
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
    },
  );
  return {
    success: false,
    status: 0,
    message:
      context === 'create'
        ? 'Unable to reach the server. Check your connection and try again.'
        : 'Unable to reach the server. Please try again.',
    reason: 'network',
    details: error instanceof Error ? { name: error.name, message: error.message } : error,
  };
};

export async function createPollRequest(
  payload: PollCreatePayload,
  signal?: AbortSignal,
): Promise<PollCreateRequestResult> {
  const requestInit = createJsonRequestInit(payload, signal);
  const startedAt = typeof performance !== 'undefined' ? performance.now() : undefined;

  let response: Response;
  try {
    response = await fetch('/api/polls', requestInit);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        success: false,
        status: 0,
        message: 'Poll creation cancelled',
        reason: 'cancelled',
        details: { reason: 'aborted' },
      };
    }

    return createNetworkErrorResult('create', error);
  }

  const durationMs = computeDuration(startedAt);
  const body = await parseResponse(response);

  if (!response.ok) {
    const fallbackMessage =
      (body && typeof body === 'object' && 'error' in body && typeof (body as Record<string, unknown>).error === 'string'
        ? (body as Record<string, string>).error
        : null) ?? DEFAULT_CREATE_ERROR_MESSAGE;

    const fieldErrors = extractFieldErrors(body);
    const message = resolveErrorMessage(response.status, fallbackMessage, DEFAULT_CREATE_ERROR_MESSAGE);
    const reason = resolveErrorReason(response.status, fieldErrors, body);

    logger.warn('Poll creation returned an error response', {
      status: response.status,
      durationMs,
      fieldErrors,
      body,
    });

    return {
      success: false,
      status: response.status,
      message,
      reason,
      details: body,
      ...(fieldErrors ? { fieldErrors } : {}),
      ...(durationMs !== undefined ? { durationMs } : {}),
    };
  }

  if (!body || typeof body !== 'object') {
    logger.error('Poll creation succeeded but response payload was not JSON', {
      durationMs,
    });
    return {
      success: false,
      status: response.status,
      message: 'Unexpected response from the server. Please try again.',
      reason: resolveErrorReason(response.status),
      ...(durationMs !== undefined ? { durationMs } : {}),
    };
  }

  const pollData =
    'data' in body && body.data && typeof body.data === 'object' ? (body.data as Record<string, unknown>) : {};
  const id = typeof pollData.id === 'string' ? pollData.id : undefined;
  const title = typeof pollData.title === 'string' ? pollData.title : undefined;
  const message = typeof (body as Record<string, unknown>).message === 'string'
    ? ((body as Record<string, string>).message as string)
    : undefined;

  if (!id) {
    logger.error('Poll creation response missing poll identifier', {
      durationMs,
      payload: body,
    });
    return {
      success: false,
      status: response.status,
      message: 'Poll created but the server response was incomplete. Please refresh before retrying.',
      reason: 'unknown',
      details: body,
      ...(durationMs !== undefined ? { durationMs } : {}),
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
    status: response.status,
    data: {
      id,
      title: title ?? payload.title,
    },
    ...(message ? { message } : {}),
    ...(durationMs !== undefined ? { durationMs } : {}),
  };
}

export async function voteOnPollRequest(
  pollId: string,
  optionId: string,
  signal?: AbortSignal,
): Promise<PollVoteRequestResult> {
  const requestInit = createJsonRequestInit({ pollId, optionId }, signal);
  const startedAt = typeof performance !== 'undefined' ? performance.now() : undefined;

  let response: Response;
  try {
    response = await fetch('/api/polls/vote', requestInit);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        success: false,
        status: 0,
        message: 'Vote cancelled',
        reason: 'cancelled',
        details: { reason: 'aborted' },
      };
    }

    return createNetworkErrorResult('vote', error);
  }

  const durationMs = computeDuration(startedAt);
  const body = await parseResponse(response);

  if (!response.ok) {
    const fallbackMessage =
      (body && typeof body === 'object' && 'error' in body && typeof (body as Record<string, unknown>).error === 'string'
        ? (body as Record<string, string>).error
        : null) ?? DEFAULT_VOTE_ERROR_MESSAGE;

    const fieldErrors = extractFieldErrors(body);
    const message = resolveErrorMessage(response.status, fallbackMessage, DEFAULT_VOTE_ERROR_MESSAGE);
    const reason = resolveErrorReason(response.status, fieldErrors, body);

    logger.warn('Poll vote returned an error response', {
      pollId,
      optionId,
      status: response.status,
      durationMs,
      fieldErrors,
      body,
    });

    return {
      success: false,
      status: response.status,
      message,
      reason,
      details: body,
      ...(fieldErrors ? { fieldErrors } : {}),
      ...(durationMs !== undefined ? { durationMs } : {}),
    };
  }

  const totalVotes =
    body && typeof body === 'object' && 'totalVotes' in body && typeof (body as Record<string, unknown>).totalVotes === 'number'
      ? ((body as Record<string, number>).totalVotes as number)
      : undefined;

  const voteId =
    body && typeof body === 'object' && 'voteId' in body && typeof (body as Record<string, unknown>).voteId === 'string'
      ? ((body as Record<string, string>).voteId as string)
      : undefined;

  const message = body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
    ? (body.message as string)
    : undefined;

  logger.info('Vote cast successfully', {
    pollId,
    optionId,
    durationMs,
    totalVotes,
  });

  return {
    success: true,
    status: response.status,
    ...(message ? { message } : {}),
    ...(durationMs !== undefined ? { durationMs } : {}),
    data: {
      pollId,
      optionId,
      ...(totalVotes !== undefined ? { totalVotes } : {}),
      ...(voteId ? { voteId } : {}),
    },
  };
}

export async function undoVoteRequest(pollId: string, signal?: AbortSignal): Promise<PollUndoVoteRequestResult> {
  const requestInit = createJsonRequestInit({ pollId }, signal);
  const startedAt = typeof performance !== 'undefined' ? performance.now() : undefined;

  let response: Response;
  try {
    response = await fetch('/api/polls/undo-vote', requestInit);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        success: false,
        status: 0,
        message: 'Vote cancellation aborted',
        reason: 'cancelled',
        details: { reason: 'aborted' },
      };
    }

    return createNetworkErrorResult('undo', error);
  }

  const durationMs = computeDuration(startedAt);
  const body = await parseResponse(response);

  if (!response.ok) {
    const fallbackMessage =
      (body && typeof body === 'object' && 'error' in body && typeof (body as Record<string, unknown>).error === 'string'
        ? (body as Record<string, string>).error
        : null) ?? DEFAULT_UNDO_ERROR_MESSAGE;

    const fieldErrors = extractFieldErrors(body);
    const message = resolveErrorMessage(response.status, fallbackMessage, DEFAULT_UNDO_ERROR_MESSAGE);
    const reason = resolveErrorReason(response.status, fieldErrors, body);

    logger.warn('Poll undo vote returned an error response', {
      pollId,
      status: response.status,
      durationMs,
      fieldErrors,
      body,
    });

    return {
      success: false,
      status: response.status,
      message,
      reason,
      details: body,
      ...(fieldErrors ? { fieldErrors } : {}),
      ...(durationMs !== undefined ? { durationMs } : {}),
    };
  }

  const totalVotes =
    body && typeof body === 'object' && 'totalVotes' in body && typeof (body as Record<string, unknown>).totalVotes === 'number'
      ? ((body as Record<string, number>).totalVotes as number)
      : undefined;

  const voteId =
    body && typeof body === 'object' && 'voteId' in body && typeof (body as Record<string, unknown>).voteId === 'string'
      ? ((body as Record<string, string>).voteId as string)
      : undefined;

  const message = body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
    ? (body.message as string)
    : undefined;

  logger.info('Vote undo completed successfully', {
    pollId,
    durationMs,
    totalVotes,
  });

  return {
    success: true,
    status: response.status,
    ...(message ? { message } : {}),
    ...(durationMs !== undefined ? { durationMs } : {}),
    data: {
      pollId,
      ...(totalVotes !== undefined ? { totalVotes } : {}),
      ...(voteId ? { voteId } : {}),
    },
  };
}

export type { PollCreatePayload } from './wizard/submission';
