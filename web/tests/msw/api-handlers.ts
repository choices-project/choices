import { http, HttpResponse } from 'msw';

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

const json = (body: unknown, status = 200) => HttpResponse.json(body, { status });

const clonePoll = (poll: MockPollRecord): MockPollRecord => ({
  ...poll,
  options: poll.options.map((option) => ({ ...option })),
});

const polls: MockPollRecord[] = POLL_FIXTURES.map(clonePoll);

const ensurePoll = (input: Partial<MockPollRecord> & { rawOptions?: string[] }) => {
  const poll = createPollRecord({
    id: input.id ?? `poll-${polls.length + 1}`,
    ...input,
    options:
      input.options ??
      input.rawOptions?.map((text, index) => ({
        id: `${input.id ?? `poll-${polls.length + 1}`}-option-${index + 1}`,
        text,
      })),
  });

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
  http.get('/api/polls', () =>
    json(
      mockSuccess(
        { polls },
        buildPaginationMetadata(),
      ),
    ),
  ),

  http.post('/api/polls', async ({ request }) => {
    const payload = await request.json().catch(() => ({}));
    const poll = ensurePoll({
      title: typeof payload?.title === 'string' ? payload.title : undefined,
      description: typeof payload?.description === 'string' ? payload.description : undefined,
      category: typeof payload?.category === 'string' ? payload.category : undefined,
      rawOptions: Array.isArray(payload?.options) ? payload.options : undefined,
    });

    return json(
      mockSuccess(poll),
      201,
    );
  }),

  http.get('/api/polls/:id', ({ params }) => {
    const poll = getPollById(params.id as string | undefined);
    if (!poll) {
      return json(mockError('Poll not found', { code: 'NOT_FOUND' }), 404);
    }

    return json(mockSuccess(poll));
  }),

  http.post('/api/polls/:id/vote', async ({ params, request }) => {
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
  }),

  http.get('/api/polls/:id/results', ({ params }) => {
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

  http.get('/api/dashboard', ({ request }) => {
    const hasAuthHeader = request.headers.get('authorization')?.startsWith('Bearer ');
    if (!hasAuthHeader) {
      return json(mockError('Admin authentication required', { code: 'AUTH_ERROR' }), 401);
    }
    return json(mockSuccess(buildDashboardData(polls)));
  }),

  http.post('/api/v1/civics/address-lookup', () =>
    json(
      mockSuccess(CIVICS_ADDRESS_LOOKUP, {
        integration: 'google-civic',
        fallback: false,
      }),
    ),
  ),

  http.get('/api/v1/civics/by-state', () =>
    json(
      mockSuccess(CIVICS_STATE_FIXTURE),
    ),
  ),

  http.get('/api/notifications', () =>
    json(mockSuccess(buildNotificationList())),
  ),

  http.post('/api/notifications', async ({ request }) => {
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

  http.put('/api/notifications', async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    return json(
      mockSuccess({
        id: body?.notificationId ?? 'notification-1',
        readAt: new Date().toISOString(),
      }),
    );
  }),

  http.post('/api/pwa/notifications/subscribe', () =>
    json(mockSuccess(PWA_SUBSCRIPTION_FIXTURE)),
  ),

  http.post('/api/pwa/notifications/send', () =>
    json(mockSuccess(PWA_NOTIFICATION_FIXTURE)),
  ),

  http.post('/api/pwa/offline/process', () =>
    json(mockSuccess(PWA_OFFLINE_FIXTURE)),
  ),

  http.post('/api/pwa/offline/sync', () =>
    json(mockSuccess(PWA_OFFLINE_FIXTURE)),
  ),

  http.post('/api/share', async ({ request }) => {
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

  http.get(/\/api\/share.*/, ({ request }) => {
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

  http.get('/api/shared/poll/:id', ({ params }) =>
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

  http.post('/api/shared/vote', async ({ request }) => {
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

