import { env } from '@/lib/config/env';

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.NEXT_PUBLIC_BASE_URL || 'https://choices.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/auth/reset/', '/account/', '/profile/edit/', '/onboarding/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
