import { buildPollCreatePayload, validateWizardDataForSubmission } from '@/features/polls/pages/create/schema';
import type { PollWizardSnapshot } from '@/features/polls/pages/create/types';

const createSnapshot = (overrides: Partial<PollWizardSnapshot> = {}): PollWizardSnapshot => ({
  title: 'New Library Funding',
  description: 'Allocate additional funds to expand community library services over the next year.',
  category: 'technology',
  options: ['Increase budget', 'Keep current budget'],
  tags: ['community', 'libraries'],
  privacyLevel: 'public',
  allowMultipleVotes: false,
  showResults: true,
  isTemplate: false,
  settings: {
    allowMultipleVotes: false,
    allowAnonymousVotes: true,
    requireAuthentication: false,
    requireEmail: false,
    showResults: true,
    allowWriteIns: false,
    allowComments: true,
    enableNotifications: true,
    maxSelections: 1,
    votingMethod: 'single',
    privacyLevel: 'public',
    moderationEnabled: false,
    autoClose: false,
  },
  ...overrides,
});

const originalWindow = global.window;
const originalNavigator = global.navigator;

beforeAll(() => {
  (global as any).window = {
    navigator: {
      language: 'en-US',
      platform: 'jest-test',
      userAgent: 'jest-test-agent',
    },
    screen: {
      width: 1280,
      height: 720,
    },
  };
  (global as any).navigator = (global.window as any).navigator;
});

afterAll(() => {
  (global as any).window = originalWindow;
  (global as any).navigator = originalNavigator;
});

describe('poll creation schema', () => {
  it('sanitises wizard data and produces a valid payload', () => {
    const snapshot = createSnapshot({
      options: [' Option A ', 'Option B'],
      tags: ['Community', 'community', 'Focus'],
    });

    const parsed = validateWizardDataForSubmission(snapshot);

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const payload = buildPollCreatePayload(parsed.data);

    expect(payload.title).toBe('New Library Funding');
    expect(payload.options).toEqual([
      { text: 'Option A' },
      { text: 'Option B' },
    ]);
    expect(payload.tags).toEqual(['community', 'focus']);
    expect(payload.settings.privacyLevel).toBe('public');
    expect(payload.metadata.optionCount).toBe(2);
    expect(payload.metadata.tagCount).toBe(2);
    expect(payload.metadata.client).toMatchObject({
      locale: 'en-US',
      platform: 'jest-test',
    });
    expect(payload.metadata.submittedAt).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it('rejects duplicate poll options', () => {
    const snapshot = createSnapshot({
      options: ['Yes', 'yes'],
    });

    const parsed = validateWizardDataForSubmission(snapshot);
    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    expect(parsed.error.flatten().fieldErrors.options?.[0]).toContain('unique');
  });

  it('enforces minimum description length', () => {
    const snapshot = createSnapshot({
      description: 'Too short',
    });

    const parsed = validateWizardDataForSubmission(snapshot);
    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    expect(parsed.error.flatten().fieldErrors.description?.[0]).toContain('at least');
  });
});

