import type { ApiMetadata } from '@/lib/api';

export type MockSuccessEnvelope<T = unknown> = {
  success: true;
  data: T;
  metadata: ApiMetadata;
};

export type MockErrorEnvelope = {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
  metadata: ApiMetadata;
};

export type MockEnvelope<T = unknown> = MockSuccessEnvelope<T> | MockErrorEnvelope;

export const buildMockMetadata = (metadata?: Partial<ApiMetadata>): ApiMetadata => ({
  timestamp: new Date().toISOString(),
  ...(metadata ?? {}),
});

export const mockSuccess = <T>(
  data: T,
  metadata?: Partial<ApiMetadata>,
): MockSuccessEnvelope<T> => ({
  success: true,
  data,
  metadata: buildMockMetadata(metadata),
});

export const mockError = (
  error: string,
  options: {
    code?: string;
    details?: unknown;
    metadata?: Partial<ApiMetadata>;
  } = {},
): MockErrorEnvelope => ({
  success: false,
  error,
  ...(options.code ? { code: options.code } : {}),
  ...(options.details ? { details: options.details } : {}),
  metadata: buildMockMetadata(options.metadata),
});

export const normalizeMockPayload = (payload: unknown): MockEnvelope => {
  if (payload && typeof payload === 'object' && 'success' in payload) {
    const envelope = payload as Partial<MockEnvelope>;

    if (envelope.success) {
      return mockSuccess(
        'data' in envelope ? (envelope as MockSuccessEnvelope<unknown>).data ?? null : null,
        envelope.metadata,
      );
    }

    const errorMessage =
      'error' in envelope ? (envelope as MockErrorEnvelope).error ?? 'Request failed' : 'Request failed';
    const opts: { code?: string; details?: unknown; metadata?: Partial<ApiMetadata> } = {};
    if ('code' in envelope && typeof envelope.code === 'string') {
      opts.code = envelope.code;
    }
    if ('details' in envelope && envelope.details !== undefined) {
      opts.details = envelope.details;
    }
    if (envelope.metadata) {
      opts.metadata = envelope.metadata;
    }
    return mockError(errorMessage, opts);
  }

  return mockSuccess(payload);
};

