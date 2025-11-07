import { cookies, headers } from 'next/headers';
import React from 'react';

import logger from '@/lib/utils/logger';

/**
 * Poll Detail Page - Canonical Implementation
 *
 * This is the canonical implementation that should be used by the app route.
 * Provides SSR-safe poll loading with proper error handling.
 */

import PollClient from './PollClient';

export default async function PollPage({ params }: { params: { id: string } }) {
  const allHeaders = await headers();
  const allCookies = await cookies();

  const bypassHeader = allHeaders.get('x-e2e-bypass') === '1' ? '1' : undefined;
  const cookieHeader = allCookies.getAll().map(({ name, value }) => `${name}=${value}`).join('; ');

  const { id } = params;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.VERCEL_URL ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/polls/${id}`, {
      cache: 'no-store',
      headers: {
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        ...(bypassHeader ? { 'x-e2e-bypass': bypassHeader } : {}),
      },
    });

    if (!res.ok) {
      throw new Error(`poll load ${res.status}`);
    }

    const payload = await res.json();
    if (!payload?.success || !payload?.data) {
      throw new Error('Malformed poll response');
    }

    return <PollClient poll={payload.data} />;
  } catch (error) {
    logger.error('Failed to render poll page', error);
    return <div data-testid="poll-error">Unable to load poll.</div>;
  }
}
