/**
 * PWA Manifest API Endpoint
 * 
 * Serves the web app manifest with dynamic configuration.
 * This allows for environment-specific manifest customization.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { isFeatureEnabled } from '@/lib/core/feature-flags';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check if PWA feature is enabled
    if (!isFeatureEnabled('PWA')) {
      return NextResponse.json({
        success: false,
        error: 'PWA feature is disabled'
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    // Get base URL for dynamic manifest generation
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    const manifest = {
      name: 'Choices - Democratic Polling Platform',
      short_name: 'Choices',
      description: 'A privacy-first, democratic polling platform with advanced voting methods',
      start_url: '/',
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
    
    // Always return wrapped response for consistency
    const responseObj = NextResponse.json({
      success: true,
      manifest,
      timestamp: new Date().toISOString()
    });
    
    // Add CORS headers
    responseObj.headers.set('Access-Control-Allow-Origin', '*');
    responseObj.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseObj.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Set appropriate content type based on format
    if (format === 'json') {
      responseObj.headers.set('Content-Type', 'application/manifest+json');
    } else {
      responseObj.headers.set('Content-Type', 'application/json');
    }
    
    return responseObj;

  } catch (error) {
    logger.error('PWA: Failed to serve manifest:', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json({
      success: false,
      error: 'Failed to serve manifest',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
