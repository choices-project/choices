/**
 * Contact Information Fixtures
 *
 * Mock data for contact information testing
 */

export type MockContactSubmission = {
  id: number;
  representative_id: number;
  contact_type: 'email' | 'phone' | 'fax' | 'address';
  value: string;
  is_primary: boolean | null;
  is_verified: boolean;
  source: string | null;
  created_at: string;
  updated_at: string;
  representative?: {
    id: number;
    name: string;
    office: string;
    party?: string;
  };
};

export const createContactSubmission = (
  overrides: Partial<MockContactSubmission> = {}
): MockContactSubmission => {
  const id = overrides.id ?? Math.floor(Math.random() * 10000);
  const representativeId = overrides.representative_id ?? 1;

  return {
    id,
    representative_id: representativeId,
    contact_type: overrides.contact_type ?? 'email',
    value: overrides.value ?? `contact-${id}@example.com`,
    is_primary: overrides.is_primary ?? false,
    is_verified: overrides.is_verified ?? false,
    source: overrides.source ?? 'user_submission',
    created_at: overrides.created_at ?? new Date().toISOString(),
    updated_at: overrides.updated_at ?? new Date().toISOString(),
    representative: overrides.representative ?? {
      id: representativeId,
      name: 'John Doe',
      office: 'State Senator',
      party: 'Democratic',
    },
  };
};

export const CONTACT_FIXTURES: MockContactSubmission[] = [
  createContactSubmission({
    id: 1,
    representative_id: 1,
    contact_type: 'email',
    value: 'john.doe@example.com',
    is_verified: false,
    source: 'user_submission',
    representative: {
      id: 1,
      name: 'John Doe',
      office: 'State Senator',
      party: 'Democratic',
    },
  }),
  createContactSubmission({
    id: 2,
    representative_id: 1,
    contact_type: 'phone',
    value: '5551234567',
    is_verified: false,
    source: 'user_submission',
    representative: {
      id: 1,
      name: 'John Doe',
      office: 'State Senator',
      party: 'Democratic',
    },
  }),
  createContactSubmission({
    id: 3,
    representative_id: 2,
    contact_type: 'address',
    value: '123 Capitol Building, Washington, DC 20510',
    is_verified: false,
    source: 'user_submission',
    representative: {
      id: 2,
      name: 'Jane Smith',
      office: 'U.S. Representative',
      party: 'Republican',
    },
  }),
];

export const buildContactList = (
  contacts: MockContactSubmission[],
  pagination?: {
    limit?: number;
    offset?: number;
    total?: number;
  }
) => {
  const limit = pagination?.limit ?? contacts.length;
  const offset = pagination?.offset ?? 0;
  const total = pagination?.total ?? contacts.length;

  return {
    contacts: contacts.slice(offset, offset + limit),
    pagination: {
      total,
      limit,
      offset,
      hasMore: total > offset + limit,
    },
  };
};
