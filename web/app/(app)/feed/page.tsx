'use client';

import { useState, useEffect } from 'react';

export default function FeedPage() {
  console.log('[FeedPage] Rendering');
  const [feeds, setFeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFeeds = async () => {
      try {
        setError(null);
        const response = await fetch('/api/feeds');
        if (response.ok) {
          const data = await response.json();
          setFeeds(data.feeds || []);
        } else {
          setError('Failed to load feeds');
        }
      } catch (error) {
        console.error('Failed to load feeds:', error);
        setError('Failed to load feeds');
      } finally {
        setLoading(false);
      }
    };

    loadFeeds();
  }, []);

  if (loading) {
    return (
      <div data-testid="unified-feed" className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="unified-feed" className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Unified Feed</h1>
        <div className="text-center py-12">
          <p className="text-red-600">Error loading feeds: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="unified-feed" className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Unified Feed</h1>
      <div className="space-y-4">
        {feeds.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No feeds available at the moment.</p>
          </div>
        ) : (
          feeds.map((feed) => (
            <div key={feed.id} className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold">{feed.title}</h3>
              <p className="text-gray-600">{feed.content}</p>
              <div className="mt-2 text-sm text-gray-500">
                {feed.engagement?.views || 0} views
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
