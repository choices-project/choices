import { getCanonicalSiteOrigin } from '@/lib/auth/canonical-site-origin';

jest.mock('@/lib/config/env', () => ({
  getValidatedEnv: jest.fn(() => ({
    NEXT_PUBLIC_SITE_URL: 'https://www.choices-app.com/',
    NEXT_PUBLIC_BASE_URL: undefined,
  })),
}));

describe('getCanonicalSiteOrigin', () => {
  it('normalizes www env URL to apex for OAuth callbacks', () => {
    expect(getCanonicalSiteOrigin('https://preview.vercel.app/auth')).toBe(
      'https://choices-app.com',
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

  it('keeps apex when env already uses apex', () => {
    const { getValidatedEnv } = require('@/lib/config/env') as {
      getValidatedEnv: jest.Mock;
    };
    getValidatedEnv.mockReturnValueOnce({
      NEXT_PUBLIC_SITE_URL: 'https://choices-app.com',
      NEXT_PUBLIC_BASE_URL: undefined,
    });
    expect(getCanonicalSiteOrigin('https://choices-app.com/auth')).toBe(
      'https://choices-app.com',
    );
  });
});
