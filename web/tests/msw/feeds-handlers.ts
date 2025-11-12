import type { FeedItem, GenericFeedItem } from '@/lib/stores/types/feeds';

type BuildFeedsResponseParams = {
  limit: number;
  category?: string | null;
  district?: string | null;
  sort?: string | null;
};

const baseFeedItem = (overrides: Partial<GenericFeedItem>): GenericFeedItem => ({
  id: 'feed-1',
  title: 'Sample Feed',
  content: 'Sample feed content for testing.',
  summary: 'Sample feed summary for testing.',
  author: {
    id: 'author-1',
    name: 'Test Author',
    verified: true,
  },
  category: 'general',
  tags: ['general'],
  type: 'article',
  source: {
    name: 'Choices Daily',
    url: 'https://example.com',
    verified: true,
  },
  publishedAt: new Date('2025-01-01T00:00:00.000Z').toISOString(),
  updatedAt: new Date('2025-01-01T00:00:00.000Z').toISOString(),
  readTime: 4,
  engagement: {
    likes: 12,
    shares: 6,
    comments: 3,
    views: 150,
  },
  userInteraction: {
    liked: false,
    shared: false,
    bookmarked: false,
    read: false,
    readAt: null,
  },
  metadata: {
    language: 'en',
  },
  district: null,
  ...overrides,
});

export const FEED_FIXTURES: FeedItem[] = [
  baseFeedItem({
    id: 'feed-1',
    title: 'Climate Action Now',
    summary: 'City council invites public comment on the climate action plan.',
    category: 'climate',
    tags: ['climate', 'policy'],
    engagement: {
      likes: 48,
      shares: 22,
      comments: 15,
      views: 810,
    },
    district: 'NY-12',
  }),
  baseFeedItem({
    id: 'feed-2',
    title: 'Community Garden Expansion',
    summary: 'Volunteers needed to expand the community garden network.',
    category: 'community',
    tags: ['community', 'volunteer'],
    engagement: {
      likes: 32,
      shares: 12,
      comments: 6,
      views: 540,
    },
    district: 'NY-12',
  }),
  baseFeedItem({
    id: 'feed-3',
    title: 'Youth Civic Summit',
    summary: 'Local students gather to design civic engagement projects.',
    category: 'education',
    tags: ['youth', 'education'],
    engagement: {
      likes: 18,
      shares: 9,
      comments: 4,
      views: 320,
    },
    district: 'NY-13',
  }),
];

export const FEED_CATEGORY_FIXTURES = [
  {
    id: 'climate',
    name: 'Climate',
    description: 'Policy and action around climate resilience.',
    color: '#1E90FF',
    icon: 'Sun',
    count: 24,
    enabled: true,
  },
  {
    id: 'community',
    name: 'Community',
    description: 'Community events and volunteer opportunities.',
    color: '#22C55E',
    icon: 'Users',
    count: 18,
    enabled: true,
  },
  {
    id: 'education',
    name: 'Education',
    description: 'Schools, youth programs, and lifelong learning.',
    color: '#A855F7',
    icon: 'BookOpen',
    count: 15,
    enabled: true,
  },
];

export const buildFeedsResponse = ({
  limit,
  category,
  district,
  sort,
}: BuildFeedsResponseParams) => {
  const sanitizedLimit = Number.isNaN(limit) ? FEED_FIXTURES.length : limit;
  const feeds =
    sanitizedLimit >= FEED_FIXTURES.length
      ? FEED_FIXTURES
      : FEED_FIXTURES.slice(0, Math.max(1, Math.min(2, sanitizedLimit)));

  return {
    success: true as const,
    data: {
      feeds,
      count: FEED_FIXTURES.length,
      filters: {
        category: category ?? 'all',
        district: district ?? null,
        sort: sort ?? 'newest',
      },
    },
  };
};

export const buildFeedSearchResponse = (query: string) => {
  const normalizedQuery = query.trim().toLowerCase();
  const items = normalizedQuery
    ? FEED_FIXTURES.filter((feed) =>
        feed.title.toLowerCase().includes(normalizedQuery),
      )
    : FEED_FIXTURES;

  return {
    success: true as const,
    data: {
      items,
      total: items.length,
      suggestions: items.slice(0, 3).map((feed) => feed.title),
    },
  };
};

export const buildFeedInteractionResponse = () => ({
  success: true as const,
});

export const buildFeedCategoriesResponse = () => ({
  success: true as const,
  data: FEED_CATEGORY_FIXTURES,
});


