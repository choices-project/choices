'use client';

import SuperiorMobileFeed from '@/components/SuperiorMobileFeed';

export default function FeedPage() {
  return (
    <div data-testid="mobile-feed">
      <SuperiorMobileFeed userId="test-user" />
    </div>
  );
}
