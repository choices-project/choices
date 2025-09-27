/**
 * Canonical Individual Poll Page
 * 
 * SSR-safe implementation with E2E bypass support and proper error handling.
 * This replaces the custom implementation in /app/(app)/polls/[id]/page.tsx
 */

import { headers } from 'next/headers';
import PollClient from '@/app/(app)/polls/[id]/PollClient';

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
