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

import type { Metadata } from 'next';

/**
 * Generate metadata for poll pages with Open Graph tags
 */
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.VERCEL_URL ?? 'http://localhost:3000';
  const pollUrl = `${baseUrl.replace(/\/$/, '')}/polls/${id}`;

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
        // TODO: Add og:image when SOCIAL_SHARING_OG feature is implemented
        // images: [
        //   {
        //     url: `${baseUrl}/api/og/poll/${id}`,
        //     width: 1200,
        //     height: 630,
        //     alt: title,
        //   },
        // ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: truncatedDescription,
        // TODO: Add twitter:image when SOCIAL_SHARING_OG feature is implemented
        // images: [`${baseUrl}/api/og/poll/${id}`],
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
