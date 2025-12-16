import type { MetadataRoute } from 'next';

/**
 * Next.js App Router web app manifest.
 *
 * This file ensures `/manifest.json` is served correctly in all environments
 * (including staging and production), aligning with:
 * - `metadata.manifest` in `app/layout.tsx`
 * - E2E tests that call `/manifest.json`
 * - PWA service worker configuration
 *
 * The structure mirrors the manifest returned by `/api/pwa/manifest` so both
 * entry points stay consistent for clients and tests.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Choices',
    short_name: 'Choices',
    description:
      'A privacy-first civic engagement platform for polls, actions, and local democracy.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a',
    theme_color: '#2563eb',
    dir: 'ltr',
    lang: 'en',
    categories: ['social', 'productivity', 'utilities', 'news', 'politics'],
    shortcuts: [
      {
        name: 'Open Feed',
        short_name: 'Feed',
        description: 'See trending polls and civic actions',
        url: '/feed',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
      {
        name: 'My Dashboard',
        short_name: 'Dashboard',
        description: 'View your activity and saved content',
        url: '/dashboard',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
    ],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    // Screenshots can be added later if needed; keep manifest minimal and valid for now.
    related_applications: [],
    prefer_related_applications: false,
  };
}


