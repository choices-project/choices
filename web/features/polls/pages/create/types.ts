import type { PollWizardData } from '@/lib/polls/types';

export type PollWizardSnapshot = PollWizardData;

export type SanitizedPollOption = {
  text: string;
};

export type PollCreatePayload = {
  title: string;
  question: string;
  description: string;
  options: Array<SanitizedPollOption | string>;
  category: string;
  tags: string[];
  settings: {
    allowMultipleVotes: boolean;
    // allowAnonymousVotes removed - was saved but never checked
    // requireAuthentication removed - redundant, main vote endpoint always requires auth
    showResultsBeforeClose: boolean;
    // allowComments removed - feature not implemented
    allowSharing: boolean;
    privacyLevel: 'public' | 'private' | 'unlisted';
  };
  metadata: Record<string, unknown>;
};

export type PollCreateResponse = {
  ok: true;
  data: {
    id: string;
    title: string;
  };
};

export type PollCreateError = {
  message: string;
  status?: number;
  details?: unknown;
  fieldErrors?: Record<string, string> | undefined;
};

export type PollCreateResult =
  | ({ success: true } & PollCreateResponse)
  | ({ success: false } & PollCreateError);

