import { resolveSyncSessionNavigation } from '@/lib/auth/post-auth-navigation';

function mockResponse(
  partial: Partial<Pick<Response, 'type' | 'status' | 'headers'>>,
): Pick<Response, 'type' | 'status' | 'headers'> {
  return {
    type: 'basic',
    status: 200,
    headers: new Headers(),
    ...partial,
  };
}

describe('resolveSyncSessionNavigation', () => {
  it('navigates on opaqueredirect using redirectTo when Location is hidden', () => {
    const result = resolveSyncSessionNavigation(
      mockResponse({ type: 'opaqueredirect', status: 0 }),
      '/polls',
    );
    expect(result).toEqual({ shouldNavigate: true, destination: '/polls' });
  });

  it('navigates on 303 using Location when present', () => {
    const result = resolveSyncSessionNavigation(
      mockResponse({
        status: 303,
        headers: new Headers({ Location: '/profile' }),
      }),
      '/polls',
    );
    expect(result).toEqual({ shouldNavigate: true, destination: '/profile' });
  });

  it('does not navigate on 401', () => {
    const result = resolveSyncSessionNavigation(
      mockResponse({ status: 401 }),
      '/polls',
    );
    expect(result).toEqual({ shouldNavigate: false, destination: '/polls' });
  });
});
