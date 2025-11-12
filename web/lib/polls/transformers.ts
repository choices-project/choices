import type { PollHashtagIntegration } from '@/features/hashtags/types';
import type { PollRow } from '@/features/polls/types';

export type PollCardView = {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  tags: string[];
  totalVotes: number;
  createdAt: string;
  hashtags: string[];
  primaryHashtag?: string;
  hashtagIntegration?: PollHashtagIntegration;
  trendingPosition?: number;
  engagementRate?: number;
  userInterestLevel?: number;
  author: {
    name: string;
    verified: boolean;
  };
};

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
};

const resolveAuthor = (value: unknown): PollCardView['author'] => {
  if (value && typeof value === 'object') {
    const candidate = value as Record<string, unknown>;
    const name =
      typeof candidate.name === 'string' && candidate.name.trim().length > 0
        ? candidate.name
        : 'Anonymous';
    const verified = Boolean(candidate.verified);
    return { name, verified };
  }

  return { name: 'Anonymous', verified: false };
};

export const createPollCardView = (poll: PollRow): PollCardView => {
  const meta = poll as Record<string, unknown>;

  const hashtags = asStringArray(meta.hashtags);

  const rawIntegration = meta.hashtag_engagement;
  const primaryHashtag =
    typeof meta.primary_hashtag === 'string' ? meta.primary_hashtag : undefined;

  const hashtagIntegration: PollHashtagIntegration | undefined =
    rawIntegration && typeof rawIntegration === 'object'
      ? {
          poll_id: poll.id,
          hashtags,
          ...(primaryHashtag ? { primary_hashtag: primaryHashtag } : {}),
          hashtag_engagement: {
            total_views:
              typeof (rawIntegration as Record<string, unknown>).total_views === 'number'
                ? ((rawIntegration as Record<string, unknown>).total_views as number)
                : 0,
            hashtag_clicks:
              typeof (rawIntegration as Record<string, unknown>).hashtag_clicks === 'number'
                ? ((rawIntegration as Record<string, unknown>).hashtag_clicks as number)
                : 0,
            hashtag_shares:
              typeof (rawIntegration as Record<string, unknown>).hashtag_shares === 'number'
                ? ((rawIntegration as Record<string, unknown>).hashtag_shares as number)
                : 0,
          },
          related_polls: asStringArray((rawIntegration as Record<string, unknown>).related_polls),
          hashtag_trending_score:
            typeof (rawIntegration as Record<string, unknown>).hashtag_trending_score === 'number'
              ? ((rawIntegration as Record<string, unknown>).hashtag_trending_score as number)
              : 0,
        }
      : undefined;

  const totalVotes =
    typeof poll.total_votes === 'number'
      ? poll.total_votes
      : (typeof meta.totalVotes === 'number' ? (meta.totalVotes as number) : 0);

  const createdAt =
    typeof poll.created_at === 'string'
      ? poll.created_at
      : (typeof meta.createdAt === 'string' ? (meta.createdAt as string) : new Date().toISOString());

  const engagementRate =
    typeof meta.engagement_rate === 'number'
      ? (meta.engagement_rate as number)
      : (typeof meta.engagementRate === 'number' ? (meta.engagementRate as number) : undefined);

  const userInterestLevel =
    typeof meta.user_interest_level === 'number'
      ? (meta.user_interest_level as number)
      : (typeof meta.userInterestLevel === 'number'
          ? (meta.userInterestLevel as number)
          : undefined);

  const trendingPosition =
    typeof meta.trending_position === 'number'
      ? (meta.trending_position as number)
      : (typeof meta.trendingPosition === 'number' ? (meta.trendingPosition as number) : undefined);

  const tags = asStringArray(meta.tags);

  return {
    id: poll.id,
    title: typeof poll.title === 'string' ? poll.title : (typeof meta.title === 'string' ? (meta.title as string) : ''),
    description:
      typeof poll.description === 'string'
        ? poll.description
        : (typeof meta.description === 'string' ? (meta.description as string) : ''),
    status: typeof poll.status === 'string' ? poll.status : 'draft',
    category:
      typeof poll.category === 'string'
        ? poll.category
        : (typeof meta.category === 'string' ? (meta.category as string) : 'general'),
    tags,
    totalVotes,
    createdAt,
    hashtags,
    ...(primaryHashtag ? { primaryHashtag } : {}),
    ...(hashtagIntegration ? { hashtagIntegration } : {}),
    ...(trendingPosition !== undefined ? { trendingPosition } : {}),
    ...(engagementRate !== undefined ? { engagementRate } : {}),
    ...(userInterestLevel !== undefined ? { userInterestLevel } : {}),
    author: resolveAuthor(meta.author),
  };
};


