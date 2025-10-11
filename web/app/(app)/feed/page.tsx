'use client';

import { SuperiorMobileFeed } from '@/features/feeds';

export default function FeedPage() {
  return (
    <div data-testid="mobile-feed">
      <SuperiorMobileFeed userId="test-user" />
    </div>
  );
}
