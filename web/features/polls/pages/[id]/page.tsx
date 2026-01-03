import dynamicImport from 'next/dynamic';
import { cookies, headers } from 'next/headers';
import React from 'react';

import logger from '@/lib/utils/logger';

import type { Metadata } from 'next';

/**
 * Poll Detail Page - Canonical Implementation
 *
 * This is the canonical implementation that should be used by the app route.
 * Provides SSR-safe poll loading with proper error handling.
 */

// Dynamically import PollClient to prevent hydration errors
// This must be at module level, not inside the component
const PollClient = dynamicImport(() => import('./PollClient'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="animate-pulse" role="status" aria-live="polite" aria-busy="true">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mx-auto" />
        </div>
      </div>
    </div>
  ),
});

/**
 * Generate metadata for poll pages with Open Graph tags
 */
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = params;
  // Use NEXT_PUBLIC_SITE_URL if available (standard Next.js pattern), fallback to other options
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? process.env.VERCEL_URL ?? 'https://choices-app.com';
  const siteUrl = baseUrl.replace(/\/$/, '');
  const pollUrl = `${siteUrl}/polls/${id}`;

  try {
    const allHeaders = await headers();
    const allCookies = await cookies();
    const cookieHeader = allCookies.getAll().map(({ name, value }) => `${name}=${value}`).join('; ');
    const bypassHeader = allHeaders.get('x-e2e-bypass') === '1' ? '1' : undefined;

    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/polls/${id}`, {
      cache: 'no-store',
      headers: {
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        ...(bypassHeader ? { 'x-e2e-bypass': bypassHeader } : {}),
      },
    });

    if (!res.ok) {
      return {
        title: 'Poll - Choices',
        description: 'View and participate in this poll on Choices',
        openGraph: {
          title: 'Poll - Choices',
          description: 'View and participate in this poll on Choices',
          url: pollUrl,
          siteName: 'Choices',
          type: 'website',
        },
        twitter: {
          card: 'summary',
          title: 'Poll - Choices',
          description: 'View and participate in this poll on Choices',
        },
      };
    }

    const payload = await res.json();
    if (!payload?.success || !payload?.data) {
      return {
        title: 'Poll - Choices',
        description: 'View and participate in this poll on Choices',
        openGraph: {
          title: 'Poll - Choices',
          description: 'View and participate in this poll on Choices',
          url: pollUrl,
          siteName: 'Choices',
          type: 'website',
        },
        twitter: {
          card: 'summary',
          title: 'Poll - Choices',
          description: 'View and participate in this poll on Choices',
        },
      };
    }

    const poll = payload.data;
    const title = poll.title || 'Poll';
    const description = poll.description || 'View and participate in this poll on Choices';
    const truncatedDescription = description.length > 200 ? `${description.substring(0, 197)}...` : description;

    return {
      title: `${title} - Choices`,
      description: truncatedDescription,
      openGraph: {
        title,
        description: truncatedDescription,
        url: pollUrl,
        siteName: 'Choices',
        type: 'website',
        images: [
          {
            url: `${siteUrl}/api/og/poll/${id}`,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: truncatedDescription,
        images: [`${siteUrl}/api/og/poll/${id}`],
      },
    };
  } catch (error) {
    logger.error('Failed to generate poll metadata', error);
    return {
      title: 'Poll - Choices',
      description: 'View and participate in this poll on Choices',
      openGraph: {
        title: 'Poll - Choices',
        description: 'View and participate in this poll on Choices',
        url: pollUrl,
        siteName: 'Choices',
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: 'Poll - Choices',
        description: 'View and participate in this poll on Choices',
      },
    };
  }
}

export default async function PollPage({ params }: { params: { id: string } }) {
  const allHeaders = await headers();
  const allCookies = await cookies();

  const bypassHeader = allHeaders.get('x-e2e-bypass') === '1' ? '1' : undefined;
  const cookieHeader = allCookies.getAll().map(({ name, value }) => `${name}=${value}`).join('; ');

  const { id } = params;

  try {
    // Use relative URL for API calls to avoid base URL issues
    // This works in both development and production
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = allHeaders.get('host') ?? 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    
    const res = await fetch(`${baseUrl}/api/polls/${id}`, {
      cache: 'no-store',
      headers: {
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        ...(bypassHeader ? { 'x-e2e-bypass': bypassHeader } : {}),
      },
    });

    if (!res.ok) {
      logger.error('Poll API returned error', { status: res.status, pollId: id });
      throw new Error(`poll load ${res.status}`);
    }

    const payload = await res.json();
    if (!payload?.success || !payload?.data) {
      logger.error('Malformed poll response', { pollId: id, payload });
      throw new Error('Malformed poll response');
    }

    return <PollClient poll={payload.data} />;
  } catch (error) {
    logger.error('Failed to render poll page', { error, pollId: id });
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Unable to load poll</h1>
          <p className="text-gray-600 dark:text-gray-400">
            We couldn&apos;t find or load this poll. It may have been deleted or you may not have permission to view it.
          </p>
          <a
            href="/polls"
            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Browse all polls
          </a>
        </div>
      </div>
    );
  }
}
