import type { PollRow } from '@/features/polls/types';
import { createPollCardView } from '@/lib/polls/transformers';

describe('poll transformers', () => {
  it('creates poll card view with normalized fields', () => {
    const poll = {
      id: 'poll-1',
      title: 'Future of Transit',
      description: 'How should the city invest in transit?',
      status: 'active',
      category: 'transportation',
      tags: ['transit', 'infrastructure'],
      total_votes: 42,
      created_at: '2025-11-10T00:00:00.000Z',
      hashtags: ['TransitFuture'],
      primary_hashtag: 'TransitFuture',
      trending_position: 3,
      engagement_rate: 0.87,
      user_interest_level: 4,
      author: {
        name: 'Alex Rivera',
        verified: true,
      },
    } as unknown as PollRow;

    const card = createPollCardView(poll);

    expect(card).toEqual(
      expect.objectContaining({
        id: 'poll-1',
        title: 'Future of Transit',
        totalVotes: 42,
        hashtags: ['TransitFuture'],
        primaryHashtag: 'TransitFuture',
        trendingPosition: 3,
        engagementRate: 0.87,
        userInterestLevel: 4,
        author: {
          name: 'Alex Rivera',
          verified: true,
        },
      }),
    );
  });

  it('falls back to safe defaults when optional metadata is missing', () => {
    const poll = {
      id: 'poll-2',
      title: 'Community Garden',
      status: 'draft',
      category: null,
      tags: null,
      total_votes: null,
      created_at: null,
    } as unknown as PollRow;

    const card = createPollCardView(poll);

    expect(card).toEqual(
      expect.objectContaining({
        id: 'poll-2',
        category: 'general',
        tags: [],
        totalVotes: 0,
        author: {
          name: 'Anonymous',
          verified: false,
        },
      }),
    );
  });
});


