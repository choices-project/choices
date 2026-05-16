import { getCanonicalSiteOrigin } from '@/lib/auth/canonical-site-origin';

jest.mock('@/lib/config/env', () => ({
  getValidatedEnv: jest.fn(() => ({
    NEXT_PUBLIC_SITE_URL: 'https://www.choices-app.com/',
    NEXT_PUBLIC_BASE_URL: undefined,
  })),
}));

describe('getCanonicalSiteOrigin', () => {
  it('prefers NEXT_PUBLIC_SITE_URL without trailing slash', () => {
    expect(getCanonicalSiteOrigin('https://preview.vercel.app/auth')).toBe(
      'https://www.choices-app.com',
    );
  });

  it('falls back to request origin when env is unset', () => {
    const { getValidatedEnv } = require('@/lib/config/env') as {
      getValidatedEnv: jest.Mock;
    };
    getValidatedEnv.mockReturnValueOnce({
      NEXT_PUBLIC_SITE_URL: undefined,
      NEXT_PUBLIC_BASE_URL: undefined,
    });
    expect(getCanonicalSiteOrigin('https://preview.vercel.app/auth')).toBe(
      'https://preview.vercel.app',
    );
  });
});
