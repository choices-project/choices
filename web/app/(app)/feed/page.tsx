'use client';

import { UnifiedFeed } from '@/features/feeds';

export default function FeedPage() {
  return (
    <div data-testid="unified-feed">
      <UnifiedFeed userId="test-user" />
    </div>
  );
}
