/**
 * Poll Detail Page - Canonical Implementation
 * 
 * This is the canonical implementation that should be used by the app route.
 * Provides SSR-safe poll loading with proper error handling.
 */

import { headers } from 'next/headers';
import PollClient from './PollClient';

export default async function PollPage({ params }: { params: { id: string } }) {
  const h = headers();
  const e2eHeader = h.get('x-e2e-bypass') === '1' ? { 'x-e2e-bypass': '1' } : {};
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/polls/${params.id}`, {
      cache: 'no-store',
      headers: { 
        ...Object.fromEntries(
          Object.entries(e2eHeader).filter(([_, value]) => value !== undefined)
        ) 
      },
    });
    
    if (!res.ok) {
      throw new Error(`poll load ${res.status}`);
    }
    
    const poll = await res.json();
    return <PollClient poll={poll} />;
  } catch {
    return <div data-testid="poll-error">Unable to load poll.</div>;
  }
}
