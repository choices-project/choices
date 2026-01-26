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
import {
  CONTACT_FIXTURES,
  createContactSubmission,
  buildContactList,
  type MockContactSubmission,
} from '../fixtures/api/contact';

import { mockError, mockSuccess } from './utils/envelope';

const json = (body: any, status = 200) => HttpResponse.json(body, { status });

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
      })) ??
      [],
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

// Contact submissions store (mutable for testing)
const contacts: MockContactSubmission[] = [...CONTACT_FIXTURES];

const getContactById = (id: number) => contacts.find((contact) => contact.id === id);

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
    const payload: any = await request.json().catch(() => ({}));
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
    const payload: any = await request.json().catch(() => ({}));
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
    const body: any = await request.json().catch(() => ({}));
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
    const body: any = await request.json().catch(() => ({}));
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
    const body: any = await request.json().catch(() => ({}));
    return json(
      mockSuccess({
        voteId: `vote-${Date.now()}`,
        pollId: body?.poll_id ?? 'shared-poll',
        optionId: body?.option_id ?? 'shared-option',
      }),
      201,
    );
  }),

  // Contact Information APIs
  http.post('/api/contact/submit', async ({ request }) => {
    const payload: any = await request.json().catch(() => ({}));
    const contact = createContactSubmission({
      representative_id: payload?.representative_id ?? 1,
      contact_type: payload?.contact_type ?? 'email',
      value: payload?.value ?? `contact-${Date.now()}@example.com`,
      is_primary: payload?.is_primary ?? false,
      is_verified: false,
      source: 'user_submission',
    });
    contacts.push(contact);
    return json(
      mockSuccess({
        contact: {
          id: contact.id,
          representative_id: contact.representative_id,
          contact_type: contact.contact_type,
          value: contact.value,
          is_primary: contact.is_primary,
          is_verified: contact.is_verified,
          source: contact.source,
          created_at: contact.created_at,
          updated_at: contact.updated_at,
        },
        message: 'Contact information submitted successfully. It will be reviewed by an administrator.',
      }),
      201,
    );
  }),

  http.get('/api/contact/:id', ({ params }) => {
    const contactId = parseInt(params.id as string, 10);
    const contact = getContactById(contactId);
    if (!contact) {
      return json(mockError('Contact not found', { code: 'NOT_FOUND' }), 404);
    }
    return json(
      mockSuccess({
        contact: {
          ...contact,
          representative: contact.representative,
        },
      })
    );
  }),

  http.get('/api/contact/representative/:id', ({ params, request }) => {
    const representativeId = parseInt(params.id as string, 10);
    const url = new URL(request.url);
    const contactType = url.searchParams.get('contact_type');
    const isVerified = url.searchParams.get('is_verified');
    const source = url.searchParams.get('source');

    let filteredContacts = contacts.filter((c) => c.representative_id === representativeId);

    if (contactType) {
      filteredContacts = filteredContacts.filter((c) => c.contact_type === contactType);
    }
    if (isVerified !== null) {
      filteredContacts = filteredContacts.filter((c) => c.is_verified === (isVerified === 'true'));
    }
    if (source) {
      filteredContacts = filteredContacts.filter((c) => c.source === source);
    }

    return json(
      mockSuccess({
        representative: {
          id: representativeId,
          name: 'Mock Representative',
          office: 'State Senator',
        },
        contacts: filteredContacts,
        count: filteredContacts.length,
      })
    );
  }),

  http.patch('/api/contact/:id', async ({ params, request }) => {
    const contactId = parseInt(params.id as string, 10);
    const contact = getContactById(contactId);
    if (!contact) {
      return json(mockError('Contact not found', { code: 'NOT_FOUND' }), 404);
    }

    const payload: any = await request.json().catch(() => ({}));
    const updatedContact = {
      ...contact,
      ...(payload.contact_type && { contact_type: payload.contact_type }),
      ...(payload.value && { value: payload.value }),
      ...(payload.is_primary !== undefined && { is_primary: payload.is_primary }),
      updated_at: new Date().toISOString(),
    };

    const index = contacts.findIndex((c) => c.id === contactId);
    if (index !== -1) {
      contacts[index] = updatedContact;
    }

    return json(
      mockSuccess({
        contact: updatedContact,
        message: 'Contact information updated successfully',
      })
    );
  }),

  http.delete('/api/contact/:id', ({ params }) => {
    const contactId = parseInt(params.id as string, 10);
    const index = contacts.findIndex((c) => c.id === contactId);
    if (index === -1) {
      return json(mockError('Contact not found', { code: 'NOT_FOUND' }), 404);
    }
    contacts.splice(index, 1);
    return json(
      mockSuccess({
        message: 'Contact information deleted successfully',
      })
    );
  }),

  // Admin Contact APIs
  http.get('/api/admin/contact/pending', ({ request }) => {
    const url = new URL(request.url);
    const representativeId = url.searchParams.get('representative_id');
    const contactType = url.searchParams.get('contact_type');
    const search = url.searchParams.get('search') ?? '';
    const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

    let filteredContacts = contacts.filter(
      (c) => c.is_verified === false && c.source === 'user_submission'
    );

    if (representativeId) {
      const repId = parseInt(representativeId, 10);
      if (!isNaN(repId)) {
        filteredContacts = filteredContacts.filter((c) => c.representative_id === repId);
      }
    }

    if (contactType) {
      filteredContacts = filteredContacts.filter((c) => c.contact_type === contactType);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredContacts = filteredContacts.filter(
        (c) =>
          c.value.toLowerCase().includes(searchLower) ||
          c.representative?.name.toLowerCase().includes(searchLower)
      );
    }

    const result = buildContactList(filteredContacts, {
      limit,
      offset,
      total: filteredContacts.length,
    });

    return json(
      mockSuccess({
        contacts: result.contacts,
        pagination: result.pagination,
      })
    );
  }),

  http.post('/api/admin/contact/:id/approve', ({ params }) => {
    const contactId = parseInt(params.id as string, 10);
    const contact = getContactById(contactId);
    if (!contact) {
      return json(mockError('Contact not found', { code: 'NOT_FOUND' }), 404);
    }

    const updatedContact = {
      ...contact,
      is_verified: true,
      updated_at: new Date().toISOString(),
    };

    const index = contacts.findIndex((c) => c.id === contactId);
    if (index !== -1) {
      contacts[index] = updatedContact;
    }

    return json(
      mockSuccess({
        contact: updatedContact,
        message: 'Contact information approved successfully',
      })
    );
  }),

  http.post('/api/admin/contact/:id/reject', async ({ params, request }) => {
    const contactId = parseInt(params.id as string, 10);
    const contact = getContactById(contactId);
    if (!contact) {
      return json(mockError('Contact not found', { code: 'NOT_FOUND' }), 404);
    }

    const payload: any = await request.json().catch(() => ({}));
    const reason = payload?.reason;

    // Remove from contacts array
    const index = contacts.findIndex((c) => c.id === contactId);
    if (index !== -1) {
      contacts.splice(index, 1);
    }

    return json(
      mockSuccess({
        message: 'Contact information rejected successfully',
        rejected_contact: {
          id: contact.id,
          representative_id: contact.representative_id,
          contact_type: contact.contact_type,
          value: contact.value,
        },
        reason: reason || null,
      })
    );
  }),
];

