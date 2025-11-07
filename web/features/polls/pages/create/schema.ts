import { z } from 'zod';

import { withOptional } from '@/lib/util/objects';

import { DESCRIPTION_CHAR_LIMIT, MAX_OPTIONS, MAX_TAGS, MIN_OPTIONS, TITLE_CHAR_LIMIT } from './constants';
import type { PollWizardSnapshot, PollCreatePayload } from './types';

const trimmedString = (requiredMessage: string) =>
  z
    .string()
    .trim()
    .min(1, { message: requiredMessage });

const optionSchema = z
  .string()
  .transform((value) => value.trim())
  .pipe(z.string().min(1, 'Option text is required').max(120, 'Option text must be under 120 characters'));

const tagSchema = z
  .string()
  .trim()
  .min(1, 'Tag cannot be empty')
  .max(32, 'Tag must be under 32 characters')
  .refine((value) => /^[a-zA-Z0-9\-\s]+$/.test(value), {
    message: 'Tags may only include letters, numbers, spaces, or hyphens',
  });

const privacyLevelSchema = z.enum(['public', 'private', 'unlisted']);

const votingMethodSchema = z.enum(['single', 'multiple', 'approval', 'ranked']);

const wizardSettingsSchema = z.object({
  allowMultipleVotes: z.boolean().default(false),
  allowAnonymousVotes: z.boolean().default(true),
  requireAuthentication: z.boolean().default(false),
  requireEmail: z.boolean().default(false),
  showResults: z.boolean().default(true),
  allowWriteIns: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  enableNotifications: z.boolean().default(true),
  maxSelections: z.number().int().min(1).max(MAX_OPTIONS).default(1),
  votingMethod: votingMethodSchema.default('single'),
  privacyLevel: privacyLevelSchema.default('public'),
  moderationEnabled: z.boolean().default(false),
  autoClose: z.boolean().default(false),
});

const pollWizardSubmissionSchema = z
  .object({
    title: trimmedString('Title is required')
      .min(3, { message: 'Title must be at least 3 characters' })
      .max(TITLE_CHAR_LIMIT, { message: `Title must be under ${TITLE_CHAR_LIMIT} characters` }),
    description: trimmedString('Description is required')
      .min(10, { message: 'Description must be at least 10 characters' })
      .max(DESCRIPTION_CHAR_LIMIT, { message: `Description must be under ${DESCRIPTION_CHAR_LIMIT} characters` }),
    category: z.string().trim().min(2, 'Category is required'),
    options: z
      .array(optionSchema)
      .min(MIN_OPTIONS, { message: `Provide at least ${MIN_OPTIONS} options` })
      .max(MAX_OPTIONS, { message: `You can provide up to ${MAX_OPTIONS} options` })
      .refine(
        (options) => new Set(options.map((option) => option.toLowerCase())).size === options.length,
        'Options must be unique'
      ),
    tags: z
      .array(tagSchema)
      .max(MAX_TAGS, `Add up to ${MAX_TAGS} tags`)
      .transform((tags) => Array.from(new Set(tags.map((tag) => tag.toLowerCase())))),
    privacyLevel: privacyLevelSchema.default('public'),
    settings: wizardSettingsSchema,
  })
  .transform((data) => {
    const tags = Array.from(new Set(data.tags)).slice(0, MAX_TAGS);

    const mergedSettings = withOptional(
      data.settings as Record<string, unknown>,
      { privacyLevel: data.settings.privacyLevel ?? data.privacyLevel ?? 'public' }
    ) as typeof data.settings;

    return withOptional(data as Record<string, unknown>, {
      tags,
      settings: mergedSettings,
    }) as typeof data & { tags: string[]; settings: typeof mergedSettings };
  });

export type SanitizedWizardData = z.infer<typeof pollWizardSubmissionSchema>;

export const validateWizardDataForSubmission = (data: PollWizardSnapshot) => {
  const normalizedSettings = withOptional({
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
    privacyLevel: data.privacyLevel ?? 'public',
    moderationEnabled: false,
    autoClose: false,
  }, data.settings as Record<string, unknown>) as NonNullable<PollWizardSnapshot['settings']>;

  const boundedSettings = withOptional(normalizedSettings as Record<string, unknown>, {
    maxSelections: Math.max(1, Math.min(normalizedSettings.maxSelections ?? 1, MAX_OPTIONS)),
    privacyLevel: normalizedSettings.privacyLevel ?? data.privacyLevel ?? 'public',
  }) as typeof normalizedSettings;

  const basePayload = withOptional(data as Record<string, unknown>, {
    options:
      data.options?.map((option) => option ?? '').filter((option): option is string => option !== undefined) ?? [],
    tags: data.tags ?? [],
    privacyLevel: normalizedSettings.privacyLevel ?? data.privacyLevel ?? 'public',
    settings: boundedSettings,
  });

  return pollWizardSubmissionSchema.safeParse(basePayload);
};

const buildClientMetadata = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const resolvedTimeZone = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return undefined;
    }
  })();

  return {
    locale: navigator.language,
    platform: navigator.platform,
    timezone: resolvedTimeZone,
    screen: {
      width: window.screen.width,
      height: window.screen.height,
    },
    userAgent: navigator.userAgent,
  } satisfies Record<string, unknown>;
};

export const buildPollCreatePayload = (data: SanitizedWizardData): PollCreatePayload => {
  const clientMetadata = buildClientMetadata();
  const submittedAt = new Date().toISOString();

  const options = data.options.map((option) => ({ text: option }));
  const settings = {
    allowMultipleVotes: data.settings.allowMultipleVotes,
    allowAnonymousVotes: data.settings.allowAnonymousVotes,
    requireAuthentication: data.settings.requireAuthentication,
    showResultsBeforeClose: data.settings.showResults,
    allowComments: data.settings.allowComments,
    allowSharing: true,
    privacyLevel: data.settings.privacyLevel,
  } satisfies PollCreatePayload['settings'];

  const metadataBase = {
    wizardVersion: '2025-11-07',
    votingMethod: data.settings.votingMethod,
    maxSelections: data.settings.maxSelections,
    allowWriteIns: data.settings.allowWriteIns,
    enableNotifications: data.settings.enableNotifications,
    requireEmail: data.settings.requireEmail,
    moderationEnabled: data.settings.moderationEnabled,
    autoClose: data.settings.autoClose,
    submittedAt,
    optionCount: data.options.length,
    tagCount: data.tags.length,
  } as Record<string, unknown>;

  const metadata = withOptional(metadataBase, clientMetadata ? { client: clientMetadata } : undefined);

  return {
    title: data.title,
    question: data.title,
    description: data.description,
    category: data.category,
    tags: data.tags,
    options,
    settings,
    metadata,
  } satisfies PollCreatePayload;
};

export const mapValidationErrors = (error: z.ZodError<SanitizedWizardData>): Record<string, string> => {
  const flat = error.flatten((issue) => issue.message ?? 'Invalid value');
  const fieldErrors: Record<string, string> = {};

  Object.entries(flat.fieldErrors).forEach(([key, messages]) => {
    if (messages && messages.length > 0) {
      fieldErrors[key] = messages[0] ?? 'Invalid value';
    }
  });

  if (flat.formErrors.length > 0) {
    fieldErrors._form = flat.formErrors[0] ?? 'Form validation failed';
  }

  return fieldErrors;
};

