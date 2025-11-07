import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { withErrorHandling, forbiddenError } from '@/lib/api';
import { isFeatureEnabled } from '@/lib/core/feature-flags';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
  if (!isFeatureEnabled('PWA')) {
    return forbiddenError('PWA feature is disabled');
  }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') ?? 'json';

    // Get base URL for dynamic manifest generation
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 
                   `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    const manifest = {
      name: 'Choices - Democratic Polling Platform',
      short_name: 'Choices',
      description: 'A privacy-first, democratic polling platform with advanced voting methods',
      start_url: baseUrl,
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#3b82f6',
      orientation: 'portrait-primary',
      scope: '/',
      lang: 'en',
      categories: ['social', 'politics', 'utilities'],
      icons: [
        {
          src: '/icons/icon-72x72.png',
          sizes: '72x72',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icons/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icons/icon-128x128.png',
          sizes: '128x128',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icons/icon-144x144.png',
          sizes: '144x144',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icons/icon-152x152.png',
          sizes: '152x152',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/icons/icon-384x384.png',
          sizes: '384x384',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ],
      screenshots: [
        {
          src: '/screenshots/desktop-home.png',
          sizes: '1280x720',
          type: 'image/png',
          form_factor: 'wide',
          label: 'Home page on desktop'
        },
        {
          src: '/screenshots/mobile-poll.png',
          sizes: '390x844',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Poll voting on mobile'
        }
      ],
      shortcuts: [
        {
          name: 'Create Poll',
          short_name: 'Create',
          description: 'Create a new poll',
          url: '/create',
          icons: [
            {
              src: '/icons/shortcut-create.png',
              sizes: '96x96'
            }
          ]
        },
        {
          name: 'My Polls',
          short_name: 'My Polls',
          description: 'View your polls',
          url: '/my-polls',
          icons: [
            {
              src: '/icons/shortcut-mypolls.png',
              sizes: '96x96'
            }
          ]
        }
      ],
      related_applications: [],
      prefer_related_applications: false,
      edge_side_panel: {
        preferred_width: 400
      },
      launch_handler: {
        client_mode: 'navigate-existing'
      }
    };

    // Set appropriate content type
    const headers = new Headers();
    headers.set('Content-Type', 'application/manifest+json');
    headers.set('Cache-Control', 'public, max-age=3600');
    
    // Always return wrapped response for consistency
    const responseObj = NextResponse.json({
      success: true,
      manifest,
      timestamp: new Date().toISOString()
    });
    
    // Add CORS headers
    responseObj.headers.set('Access-Control-Allow-Origin', '*');
    responseObj.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    // Add manifest-specific headers
    responseObj.headers.set('Content-Type', 'application/manifest+json');
    responseObj.headers.set('Cache-Control', 'public, max-age=3600');
    responseObj.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Set appropriate content type based on format
    if (format === 'json') {
      responseObj.headers.set('Content-Type', 'application/manifest+json');
    } else {
      responseObj.headers.set('Content-Type', 'application/json');
  }
  
  return responseObj;
});
