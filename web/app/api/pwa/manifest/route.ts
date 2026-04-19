
import { successResponse, withErrorHandling, forbiddenError } from '@/lib/api';
import { isFeatureEnabled } from '@/lib/core/feature-flags';

import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/** Mirrors `public/manifest.json` (SVG assets only; no missing screenshot URLs). */
const PWA_MANIFEST = {
  id: '/',
  name: 'Choices',
  short_name: 'Choices',
  description:
    'A privacy-first civic engagement platform for polls, actions, and local democracy.',
  start_url: '/',
  scope: '/',
  display: 'standalone' as const,
  background_color: '#ffffff',
  theme_color: '#3b82f6',
  orientation: 'portrait-primary' as const,
  lang: 'en',
  dir: 'ltr' as const,
  categories: ['social', 'productivity', 'utilities', 'news', 'politics'],
  icons: [
    { src: '/icons/icon-72x72.svg', sizes: '72x72', type: 'image/svg+xml', purpose: 'any' },
    { src: '/icons/icon-96x96.svg', sizes: '96x96', type: 'image/svg+xml', purpose: 'any' },
    { src: '/icons/icon-128x128.svg', sizes: '128x128', type: 'image/svg+xml', purpose: 'any' },
    { src: '/icons/icon-144x144.svg', sizes: '144x144', type: 'image/svg+xml', purpose: 'any' },
    { src: '/icons/icon-152x152.svg', sizes: '152x152', type: 'image/svg+xml', purpose: 'any' },
    { src: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
    { src: '/icons/icon-384x384.svg', sizes: '384x384', type: 'image/svg+xml', purpose: 'any' },
    { src: '/icons/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
  ],
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
  related_applications: [],
  prefer_related_applications: false,
  edge_side_panel: { preferred_width: 400 },
  launch_handler: { client_mode: 'navigate-existing' as const },
};

export const GET = withErrorHandling(async (request: NextRequest) => {
  if (!isFeatureEnabled('PWA')) {
    return forbiddenError('PWA feature is disabled');
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') ?? 'json';

  const responseObj = successResponse({
    manifest: PWA_MANIFEST,
    format,
    timestamp: new Date().toISOString(),
  });

  responseObj.headers.set('Access-Control-Allow-Origin', '*');
  responseObj.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  responseObj.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  responseObj.headers.set('Cache-Control', 'public, max-age=3600');
  responseObj.headers.set(
    'Content-Type',
    format === 'json' ? 'application/manifest+json' : 'application/json',
  );

  return responseObj;
});
