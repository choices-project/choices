import type { ApiSuccessResponse } from '@/lib/api/types';

import type { FeedsApiPayload } from '../types/feeds';

export type FetchFeedsParams = {
  category?: string | null;
  district?: string | null;
  limit?: number;
  offset?: number;
  sort?: string | null;
};

const buildFeedsQueryString = (params: FetchFeedsParams = {}): string => {
  const searchParams = new URLSearchParams();

  if (params.limit != null) {
    searchParams.set('limit', String(params.limit));
  }
  if (params.offset != null) {
    searchParams.set('offset', String(params.offset));
  }
  if (params.category && params.category !== 'all') {
    searchParams.set('category', params.category);
  }
  if (params.district) {
    searchParams.set('district', params.district);
  }
  if (params.sort) {
    searchParams.set('sort', params.sort);
  }

  return searchParams.toString();
};

export const fetchFeedsFromApi = async (
  params: FetchFeedsParams = {},
  request: typeof fetch = fetch,
): Promise<FeedsApiPayload> => {
  const query = buildFeedsQueryString(params);
  const endpoint = `/api/feeds${query ? `?${query}` : ''}`;

  const response = await request(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch feeds (status ${response.status})`);
  }

  const raw = await response.json();
  return parseFeedsPayload(raw, {
    category: params.category ?? 'all',
    district: params.district ?? null,
    sort: params.sort ?? 'trending',
    limit: params.limit,
    offset: params.offset,
  });
};

type FeedSearchResponse = {
  items: FeedsApiPayload['feeds'];
  total: number;
  suggestions?: string[];
};

type FeedsPayloadFallback = {
  category: string;
  district: string | null;
  sort: string;
  limit?: number;
  offset?: number;
};

const buildPaginationMetadata = (
  pagination: FeedsApiPayload['pagination'] | undefined,
  total: number,
  fallback: Pick<FeedsPayloadFallback, 'limit' | 'offset'>,
) => {
  const limit = pagination?.limit ?? fallback.limit ?? total;
  const offset = pagination?.offset ?? fallback.offset ?? 0;
  const hasMore =
    typeof pagination?.hasMore === 'boolean'
      ? pagination.hasMore
      : offset + (pagination?.limit ?? fallback.limit ?? total) < total;

  return {
    total,
    limit,
    offset,
    hasMore,
  };
};

export const parseFeedsPayload = (
  raw: unknown,
  fallback: FeedsPayloadFallback,
): FeedsApiPayload => {
  if (raw && typeof raw === 'object' && 'success' in raw) {
    const successPayload = raw as ApiSuccessResponse<FeedsApiPayload>;
    const total =
      typeof successPayload.data.count === 'number'
        ? successPayload.data.count
        : successPayload.data.feeds.length;
    return {
      ...successPayload.data,
      count: total,
      pagination: buildPaginationMetadata(
        successPayload.data.pagination,
        total,
        { limit: fallback.limit, offset: fallback.offset },
      ),
    };
  }

  if (raw && typeof raw === 'object' && 'feeds' in raw) {
    const payload = raw as Partial<FeedsApiPayload>;
    if (Array.isArray(payload.feeds)) {
      const total =
        typeof payload.count === 'number' ? payload.count : payload.feeds.length;
      return {
        feeds: payload.feeds,
        count: total,
        filters: {
          category: payload.filters?.category ?? fallback.category ?? 'all',
          district: payload.filters?.district ?? fallback.district ?? null,
          sort: payload.filters?.sort ?? fallback.sort ?? 'trending',
        },
        pagination: buildPaginationMetadata(
          payload.pagination,
          total,
          { limit: fallback.limit, offset: fallback.offset },
        ),
      };
    }
  }

  if (Array.isArray(raw)) {
    const feeds = raw as FeedsApiPayload['feeds'];
    const total = feeds.length;
    return {
      feeds,
      count: total,
      filters: {
        category: fallback.category ?? 'all',
        district: fallback.district ?? null,
        sort: fallback.sort ?? 'trending',
      },
      pagination: buildPaginationMetadata(
        undefined,
        total,
        { limit: fallback.limit, offset: fallback.offset },
      ),
    };
  }

  throw new Error('Invalid feeds response payload');
};

export const parseFeedSearchPayload = (raw: unknown): FeedSearchResponse => {
  if (raw && typeof raw === 'object' && 'success' in raw) {
    const successPayload = raw as ApiSuccessResponse<FeedSearchResponse>;
    return successPayload.data;
  }

  if (raw && typeof raw === 'object' && 'items' in raw) {
    const payload = raw as Partial<FeedSearchResponse>;
    if (Array.isArray(payload.items) && typeof payload.total === 'number') {
      return {
        items: payload.items,
        total: payload.total,
        suggestions: payload.suggestions ?? [],
      };
    }
  }

  if (Array.isArray(raw)) {
    const items = raw as FeedSearchResponse['items'];
    return {
      items,
      total: items.length,
      suggestions: [],
    };
  }

  throw new Error('Invalid feed search response payload');
};


