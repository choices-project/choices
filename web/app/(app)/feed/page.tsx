'use client';

import { UnifiedFeed } from '@/features/feeds';

export default function FeedPage() {
  console.log('[FeedPage] Rendering');
  return (
    <div data-testid="unified-feed">
      <UnifiedFeed userId="test-user" />
    </div>
  );
}
