import { http, HttpResponse, type JsonBodyType } from 'msw';

import { CIVICS_ADDRESS_LOOKUP, CIVICS_STATE_FIXTURE } from '../fixtures/api/civics';
import { buildDashboardData } from '../fixtures/api/dashboard';
import {
  buildNotification,
  buildNotificationList,
} from '../fixtures/api/notifications';
import {
  POLL_FIXTURES,
  createPollRecord,
  type MockPollRecord,
} from '../fixtures/api/polls';
import {
  PWA_NOTIFICATION_FIXTURE,
  PWA_OFFLINE_FIXTURE,
  PWA_SUBSCRIPTION_FIXTURE,
} from '../fixtures/api/pwa';
import { buildShareAnalytics } from '../fixtures/api/share';

import { mockError, mockSuccess } from './utils/envelope';

// Loosen MSW handler typings for test fixtures to avoid noisy generic type
// incompatibilities while preserving the actual runtime behavior.
const httpAny = http as any;

const json = <T extends JsonBodyType>(body: T, status = 200) =>
  HttpResponse.json<T>(body, { status });

const clonePoll = (poll: MockPollRecord): MockPollRecord => ({
  ...poll,
  options: poll.options.map((option) => ({ ...option })),
});

const polls: MockPollRecord[] = POLL_FIXTURES.map(clonePoll);

const ensurePoll = (input: Partial<MockPollRecord> & { rawOptions?: string[] }) => {
  const base: Partial<MockPollRecord> = {
    id: input.id ?? `poll-${polls.length + 1}`,
    ...input,
  };

  const derivedOptions =
    input.options ??
    (input.rawOptions
      ? input.rawOptions.map((text, index) => ({
          id: `${input.id ?? `poll-${polls.length + 1}`}-option-${index + 1}`,
          text,
        }))
      : undefined);

  const poll = createPollRecord(
    derivedOptions ? { ...base, options: derivedOptions } : base,
  );

  polls.push(clonePoll(poll));
  return poll;
};

const buildPaginationMetadata = () => ({
  pagination: {
    limit: polls.length,
    offset: 0,
    total: polls.length,
    hasMore: false,
    page: 1,
    totalPages: 1,
  },
});

const getPollById = (id: string | undefined) => polls.find((poll) => poll.id === id);

export const apiHandlers = [
  httpAny.get('/api/polls', () =>
    json(
      mockSuccess(
        { polls },
        buildPaginationMetadata(),
      ),
    ),
  ),

  httpAny.post('/api/polls', async ({ request }: { request: any }) => {
    type PollCreatePayload = {
      title?: unknown;
      description?: unknown;
      category?: unknown;
      options?: unknown;
    };

    const payload = (await request.json().catch(() => ({}))) as PollCreatePayload;
    const poll = ensurePoll({
      ...(typeof payload.title === 'string' ? { title: payload.title } : {}),
      ...(typeof payload.description === 'string'
        ? { description: payload.description }
        : {}),
      ...(typeof payload.category === 'string' ? { category: payload.category } : {}),
      ...(Array.isArray(payload.options)
        ? { rawOptions: payload.options as string[] }
        : {}),
    });

    return json(
      mockSuccess(poll),
      201,
    );
  }),

  httpAny.get(
    '/api/polls/:id',
    (({ params }: { params: { id?: string } }) => {
      const poll = getPollById(params.id as string | undefined);
      if (!poll) {
        return json(mockError('Poll not found', { code: 'NOT_FOUND' }), 404);
      }

      return json(mockSuccess(poll));
    }) as any,
  ),

  httpAny.post(
    '/api/polls/:id/vote',
    async ({ params, request }: { params: any; request: any }) => {
      const poll = getPollById(params.id as string | undefined);
    if (!poll) {
      return json(mockError('Poll not found', { code: 'NOT_FOUND' }), 404);
    }
      const payload = await request.json().catch(() => ({}));
    const optionId = typeof payload?.optionId === 'string' ? payload.optionId : poll.options[0]?.id ?? null;

      return json(
        mockSuccess({
          pollId: poll.id,
          optionId,
        }),
      );
    },
  ),

  httpAny.get('/api/polls/:id/results', ({ params }: { params: any }) => {
    const poll = getPollById(params.id as string | undefined);
    if (!poll) {
      return json(mockError('Poll not found', { code: 'NOT_FOUND' }), 404);
    }

    return json(
      mockSuccess({
        pollId: poll.id,
        results: poll.options.map((option, index) => ({
          optionId: option.id,
          count: index + 1,
        })),
      }),
    );
  }),

  httpAny.get('/api/dashboard', ({ request }: { request: any }) => {
    const hasAuthHeader = request.headers.get('authorization')?.startsWith('Bearer ');
    if (!hasAuthHeader) {
      return json(mockError('Admin authentication required', { code: 'AUTH_ERROR' }), 401);
    }
    return json(mockSuccess(buildDashboardData(polls)));
  }),

  httpAny.post('/api/v1/civics/address-lookup', () =>
    json(
      mockSuccess(CIVICS_ADDRESS_LOOKUP, {
        integration: 'google-civic',
        fallback: false,
      }),
    ),
  ),

  httpAny.get('/api/v1/civics/by-state', () =>
    json(
      mockSuccess(CIVICS_STATE_FIXTURE),
    ),
  ),

  httpAny.get('/api/notifications', () =>
    json(mockSuccess(buildNotificationList())),
  ),

  httpAny.post('/api/notifications', async ({ request }: { request: any }) => {
    const body = await request.json().catch(() => ({}));
    return json(
      mockSuccess(
        buildNotification({
          title: typeof body?.title === 'string' ? body.title : undefined,
          message: typeof body?.message === 'string' ? body.message : undefined,
        }),
      ),
      201,
    );
  }),

  httpAny.put('/api/notifications', async ({ request }: { request: any }) => {
    const body = await request.json().catch(() => ({}));
    return json(
      mockSuccess({
        id: body?.notificationId ?? 'notification-1',
        readAt: new Date().toISOString(),
      }),
    );
  }),

  httpAny.post('/api/pwa/notifications/subscribe', () =>
    json(mockSuccess(PWA_SUBSCRIPTION_FIXTURE)),
  ),

  httpAny.post('/api/pwa/notifications/send', () =>
    json(mockSuccess(PWA_NOTIFICATION_FIXTURE)),
  ),

  httpAny.post('/api/pwa/offline/process', () =>
    json(mockSuccess(PWA_OFFLINE_FIXTURE)),
  ),

  httpAny.post('/api/pwa/offline/sync', () =>
    json(mockSuccess(PWA_OFFLINE_FIXTURE)),
  ),

  httpAny.post('/api/share', async ({ request }: { request: any }) => {
    const body = await request.json().catch(() => ({}));
    return json(
      mockSuccess({
        message: 'Share event tracked successfully',
        shareId: `share-${Date.now()}`,
        request: body,
      }),
      201,
    );
  }),

  httpAny.get(/\/api\/share.*/, ({ request }: { request: any }) => {
    const url = new URL(request.url);
    const days = Number(url.searchParams.get('days') ?? '7');
    const platform = url.searchParams.get('platform') ?? 'all';
    const pollId = url.searchParams.get('poll_id') ?? 'all';

    return json(
      mockSuccess(
        buildShareAnalytics({
          periodDays: days,
          filters: { platform, pollId },
        }),
      ),
    );
  }),

  httpAny.get('/api/shared/poll/:id', ({ params }: { params: any }) =>
    json(
      mockSuccess({
        poll: {
          id: params.id,
          question: 'Mock shared poll question',
          createdAt: new Date().toISOString(),
          isPublic: true,
          isShareable: true,
          options: [
            { id: `${params.id}-opt-1`, text: 'Option A', createdAt: new Date().toISOString() },
            { id: `${params.id}-opt-2`, text: 'Option B', createdAt: new Date().toISOString() },
          ],
          results: [
            { optionId: `${params.id}-opt-1`, votes: 120 },
            { optionId: `${params.id}-opt-2`, votes: 45 },
          ],
        },
      }),
    ),
  ),

  httpAny.post('/api/shared/vote', async ({ request }: { request: any }) => {
    const body = await request.json().catch(() => ({}));
    return json(
      mockSuccess({
        voteId: `vote-${Date.now()}`,
        pollId: body?.poll_id ?? 'shared-poll',
        optionId: body?.option_id ?? 'shared-option',
      }),
      201,
    );
  }),
];

