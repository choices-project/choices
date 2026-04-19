import type { MetadataRoute } from 'next';

/**
 * Next.js App Router web app manifest (served at the framework manifest URL).
 *
 * Keep fields aligned with `public/manifest.json`, which is the canonical
 * `rel="manifest"` target in `app/layout.tsx` for installability and E2E.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Choices',
    short_name: 'Choices',
    description:
      'A privacy-first civic engagement platform for polls, actions, and local democracy.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    dir: 'ltr',
    lang: 'en',
    categories: ['social', 'productivity', 'utilities', 'news', 'politics'],
    shortcuts: [
      {
        name: 'Open Feed',
        short_name: 'Feed',
        description: 'See trending polls and civic actions',
        url: '/feed',
        icons: [{ src: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' }],
      },
      {
        name: 'My Dashboard',
        short_name: 'Dashboard',
        description: 'View your activity and saved content',
        url: '/dashboard',
        icons: [{ src: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' }],
      },
      {
        name: 'Create Poll',
        short_name: 'Create',
        description: 'Create a new poll',
        url: '/polls/create',
        icons: [{ src: '/icons/shortcut-create.svg', sizes: '96x96', type: 'image/svg+xml' }],
      },
    ],
    icons: [
      {
        src: '/icons/icon-72x72.svg',
        sizes: '72x72',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-96x96.svg',
        sizes: '96x96',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-128x128.svg',
        sizes: '128x128',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-144x144.svg',
        sizes: '144x144',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-152x152.svg',
        sizes: '152x152',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192x192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192x192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-384x384.svg',
        sizes: '384x384',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}
